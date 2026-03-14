const express = require('express');
const router  = express.Router();
const pool    = require('../config/db');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

/* ─────────────────────────────────────────────
   GET /api/inventario/movimientos
   Lista historial de movimientos (todos o por material)
───────────────────────────────────────────── */
router.get('/movimientos', verifyToken, isAdmin, async (req, res) => {
  const { inventario_id } = req.query;
  try {
    let query = `
      SELECT
        m.id,
        m.inventario_id,
        iv.tipo,
        iv.color,
        iv.espesor_mm,
        m.tipo       AS movimiento,
        m.m2,
        m.descripcion,
        m.creado_por_nombre,
        TO_CHAR(m.created_at, 'YYYY-MM-DD HH24:MI') AS fecha
      FROM movimientos_inventario m
      JOIN inventario_vidrio iv ON iv.id = m.inventario_id
    `;
    const params = [];
    if (inventario_id) {
      query += ' WHERE m.inventario_id = $1';
      params.push(inventario_id);
    }
    query += ' ORDER BY m.created_at DESC LIMIT 100';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('[ERROR movimientos]', err.message);
    res.status(500).json({ message: 'Error al obtener movimientos', error: err.message });
  }
});

/* ─────────────────────────────────────────────
   POST /api/inventario/movimiento
   Registra entrada o ajuste y actualiza stock
───────────────────────────────────────────── */
router.post('/movimiento', verifyToken, isAdmin, async (req, res) => {
  const { inventario_id, tipo, m2, descripcion } = req.body;
  const userName = req.user.nombre || 'Admin';
  const userId   = req.user.id;

  if (!inventario_id || !tipo || m2 === undefined) {
    return res.status(400).json({ message: 'inventario_id, tipo y m2 son obligatorios' });
  }
  if (!['entrada', 'ajuste', 'uso'].includes(tipo)) {
    return res.status(400).json({ message: 'tipo debe ser entrada, ajuste o uso' });
  }
  const m2Val = parseFloat(m2);
  if (isNaN(m2Val)) {
    return res.status(400).json({ message: 'm2 debe ser numérico' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Verificar que existe el material
    const mat = await client.query('SELECT id, stock_m2 FROM inventario_vidrio WHERE id = $1', [inventario_id]);
    if (mat.rows.length === 0) {
      await client.query('ROLLBACK');
      client.release();
      return res.status(404).json({ message: 'Material no encontrado' });
    }

    // 'entrada' → suma, 'ajuste' → valor absoluto, 'uso' → resta (nunca baja de 0)
    if (tipo === 'entrada') {
      await client.query(
        `UPDATE inventario_vidrio SET stock_m2 = stock_m2 + $1, updated_at = NOW() WHERE id = $2`,
        [m2Val, inventario_id]
      );
    } else if (tipo === 'ajuste') {
      // ajuste — establece el valor absoluto
      await client.query(
        `UPDATE inventario_vidrio SET stock_m2 = $1, updated_at = NOW() WHERE id = $2`,
        [m2Val, inventario_id]
      );
    } else {
      // uso — descuenta del stock (mínimo 0)
      await client.query(
        `UPDATE inventario_vidrio SET stock_m2 = GREATEST(0, stock_m2 - $1), updated_at = NOW() WHERE id = $2`,
        [m2Val, inventario_id]
      );
    }

    await client.query(
      `INSERT INTO movimientos_inventario (inventario_id, tipo, m2, descripcion, creado_por, creado_por_nombre)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [inventario_id, tipo, m2Val, descripcion || null, userId, userName]
    );

    await client.query('COMMIT');
    client.release();
    if (global.broadcastToAdmins) global.broadcastToAdmins({ type: 'data_inventario' });

    // ── Alerta de stock bajo (solo en movimientos que reducen stock) ──
    if (tipo === 'uso' || tipo === 'ajuste') {
      try {
        const stockRow = await pool.query(
          'SELECT stock_m2, stock_minimo_m2, tipo AS nombre, color FROM inventario_vidrio WHERE id = $1',
          [inventario_id]
        );
        const mat = stockRow.rows[0];
        if (mat && parseFloat(mat.stock_m2) <= parseFloat(mat.stock_minimo_m2)) {
          const nombreMat = `${mat.nombre}${mat.color ? ' ' + mat.color : ''}`;
          const stockActual = parseFloat(mat.stock_m2).toFixed(2);
          const stockMin    = parseFloat(mat.stock_minimo_m2).toFixed(2);
          await pool.query(
            `INSERT INTO notificaciones (tipo, mensaje, para_roles, creado_por_nombre)
             VALUES ($1, $2, $3, $4)`,
            ['stock_bajo',
             `⚠️ Stock bajo: ${nombreMat} — ${stockActual} m² disponible (mínimo: ${stockMin} m²)`,
             [1], 'Sistema']
          );
          if (global.sendPushToUser) {
            const { rows: admins } = await pool.query(
              'SELECT id FROM usuarios WHERE role_id = 1 AND activo = true'
            );
            for (const admin of admins) {
              global.sendPushToUser(admin.id, {
                title: 'Glass Caribe — Stock Bajo',
                body:  `${nombreMat}: ${stockActual} m² disponible`,
                url:   '/admin/inventario'
              });
            }
          }
        }
      } catch (alertErr) {
        console.warn('[STOCK ALERT]', alertErr.message);
      }
    }

    res.json({ message: 'Movimiento registrado correctamente' });
  } catch (err) {
    await client.query('ROLLBACK');
    client.release();
    console.error('[ERROR movimiento]', err.message);
    res.status(500).json({ message: 'Error al registrar movimiento', error: err.message });
  }
});

/* ─────────────────────────────────────────────
   GET /api/inventario
   Lista todos los materiales en stock
───────────────────────────────────────────── */
router.get('/', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        tipo,
        color,
        espesor_mm,
        CAST(stock_m2 AS FLOAT)          AS stock_m2,
        CAST(stock_minimo_m2 AS FLOAT)   AS stock_minimo_m2,
        CAST(precio_m2 AS FLOAT)         AS precio_m2,
        TO_CHAR(updated_at, 'YYYY-MM-DD HH24:MI') AS updated_at
      FROM inventario_vidrio
      ORDER BY tipo, color, espesor_mm
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('[ERROR inventario GET]', err.message);
    res.status(500).json({ message: 'Error al obtener inventario', error: err.message });
  }
});

/* ─────────────────────────────────────────────
   POST /api/inventario
   Crear nuevo material
───────────────────────────────────────────── */
router.post('/', verifyToken, isAdmin, async (req, res) => {
  const { tipo, color, espesor_mm, stock_m2 = 0, stock_minimo_m2 = 0, precio_m2 = 0 } = req.body;

  if (!tipo) return res.status(400).json({ message: 'El campo tipo es obligatorio' });

  try {
    const result = await pool.query(
      `INSERT INTO inventario_vidrio (tipo, color, espesor_mm, stock_m2, stock_minimo_m2, precio_m2)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [tipo, color || null, espesor_mm || null, parseFloat(stock_m2), parseFloat(stock_minimo_m2), parseFloat(precio_m2)]
    );
    if (global.broadcastToAdmins) global.broadcastToAdmins({ type: 'data_inventario' });
    res.status(201).json({ message: 'Material creado correctamente', id: result.rows[0].id });
  } catch (err) {
    console.error('[ERROR inventario POST]', err.message);
    res.status(500).json({ message: 'Error al crear material', error: err.message });
  }
});

/* ─────────────────────────────────────────────
   PUT /api/inventario/:id
   Actualizar datos de un material
───────────────────────────────────────────── */
router.put('/:id', verifyToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  const { tipo, color, espesor_mm, stock_minimo_m2, precio_m2 } = req.body;

  try {
    const result = await pool.query(
      `UPDATE inventario_vidrio
       SET tipo = COALESCE($1, tipo),
           color = $2,
           espesor_mm = $3,
           stock_minimo_m2 = COALESCE($4, stock_minimo_m2),
           precio_m2 = COALESCE($5, precio_m2),
           updated_at = NOW()
       WHERE id = $6
       RETURNING id`,
      [tipo || null, color || null, espesor_mm || null, stock_minimo_m2 != null ? parseFloat(stock_minimo_m2) : null, precio_m2 != null ? parseFloat(precio_m2) : null, id]
    );
    if (result.rowCount === 0) return res.status(404).json({ message: 'Material no encontrado' });
    if (global.broadcastToAdmins) global.broadcastToAdmins({ type: 'data_inventario' });
    res.json({ message: 'Material actualizado correctamente' });
  } catch (err) {
    console.error('[ERROR inventario PUT]', err.message);
    res.status(500).json({ message: 'Error al actualizar material', error: err.message });
  }
});

/* ─────────────────────────────────────────────
   DELETE /api/inventario/:id
   Eliminar material (solo si no tiene movimientos)
───────────────────────────────────────────── */
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const mov = await pool.query('SELECT 1 FROM movimientos_inventario WHERE inventario_id = $1 LIMIT 1', [id]);
    if (mov.rows.length > 0) {
      return res.status(409).json({ message: 'No se puede eliminar: el material tiene movimientos registrados' });
    }
    const result = await pool.query('DELETE FROM inventario_vidrio WHERE id = $1', [id]);
    if (result.rowCount === 0) return res.status(404).json({ message: 'Material no encontrado' });
    if (global.broadcastToAdmins) global.broadcastToAdmins({ type: 'data_inventario' });
    res.json({ message: 'Material eliminado correctamente' });
  } catch (err) {
    console.error('[ERROR inventario DELETE]', err.message);
    res.status(500).json({ message: 'Error al eliminar material', error: err.message });
  }
});

module.exports = router;
