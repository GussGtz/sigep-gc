const express = require('express')
const router  = express.Router()
const pool    = require('../config/db.js')
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware.js')

// GET /api/entregas — listar todas (admin)
// Nota: foto_base64 se excluye del listado por rendimiento; se obtiene vía GET /:id
router.get('/', verifyToken, isAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT e.id, e.pedido_id, e.conductor_id, e.estado,
             e.fecha_asignacion, e.fecha_inicio, e.fecha_entrega_real,
             e.notas, e.evidencia_url, e.firma_url,
             p.numero_pedido, p.fecha_entrega,
             p.cliente_nombre, p.direccion_entrega,
             u.nombre AS conductor_nombre
      FROM entregas e
      JOIN pedidos  p ON p.id = e.pedido_id
      JOIN usuarios u ON u.id = e.conductor_id
      ORDER BY e.fecha_asignacion DESC
    `)
    res.json(rows)
  } catch (err) {
    console.error('[ERROR entregas.GET]', err.message)
    res.status(500).json({ message: 'Error al obtener entregas' })
  }
})

// GET /api/entregas/conductor/mis-entregas — entregas del conductor autenticado
router.get('/conductor/mis-entregas', verifyToken, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT e.*, p.numero_pedido, p.fecha_entrega,
             p.cliente_nombre, p.direccion_entrega
      FROM entregas e
      JOIN pedidos p ON p.id = e.pedido_id
      WHERE e.conductor_id = $1
      ORDER BY e.fecha_asignacion DESC
    `, [req.user.id])
    res.json(rows)
  } catch (err) {
    console.error('[ERROR mis-entregas]', err.message)
    res.status(500).json({ message: 'Error al obtener entregas' })
  }
})

// GET /api/entregas/:id — detalle de una entrega
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT e.*, p.numero_pedido, p.fecha_entrega,
             p.cliente_nombre, p.direccion_entrega,
             p.alto, p.ancho, p.cantidad, p.metros_cuadrados, p.especificaciones
      FROM entregas e
      JOIN pedidos p ON p.id = e.pedido_id
      WHERE e.id = $1
    `, [req.params.id])
    if (!rows.length) return res.status(404).json({ message: 'Entrega no encontrada' })
    res.json(rows[0])
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener entrega' })
  }
})

// POST /api/entregas — asignar entrega (admin)
// Acepta pedido_id (entero) O numero_pedido (string) para compatibilidad con el formulario
router.post('/', verifyToken, isAdmin, async (req, res) => {
  let { pedido_id, numero_pedido, conductor_id } = req.body

  // Si vienen como numero_pedido, buscar el pedido_id real
  if (!pedido_id && numero_pedido) {
    try {
      const p = await pool.query(
        'SELECT id FROM pedidos WHERE numero_pedido = $1',
        [String(numero_pedido).trim()]
      )
      if (!p.rows.length) {
        return res.status(404).json({ message: `Pedido #${numero_pedido} no encontrado` })
      }
      pedido_id = p.rows[0].id
    } catch (err) {
      return res.status(500).json({ message: 'Error al buscar pedido' })
    }
  }

  if (!pedido_id || !conductor_id) {
    return res.status(400).json({ message: 'Faltan campos requeridos (pedido y conductor)' })
  }

  try {
    // Si ya existe una incidencia para este pedido, reasignar en lugar de duplicar
    const existing = await pool.query(
      `SELECT id FROM entregas WHERE pedido_id=$1 AND estado='incidencia' ORDER BY id DESC LIMIT 1`,
      [pedido_id]
    )

    let savedRow
    if (existing.rows.length) {
      // Reasignación: actualizar el registro existente
      const { rows } = await pool.query(
        `UPDATE entregas
         SET conductor_id=$1, estado='asignada', fecha_asignacion=NOW(), notas=NULL
         WHERE id=$2 RETURNING *`,
        [conductor_id, existing.rows[0].id]
      )
      savedRow = rows[0]
    } else {
      // Nueva asignación: insertar registro nuevo
      const { rows } = await pool.query(
        `INSERT INTO entregas (pedido_id, conductor_id, estado)
         VALUES ($1, $2, 'asignada') RETURNING *`,
        [pedido_id, conductor_id]
      )
      savedRow = rows[0]
    }

    // Notificar a admins y al conductor específico para actualizar sus vistas
    if (global.broadcastToAdmins) global.broadcastToAdmins({ type: 'data_entregas' })
    if (global.sendToUser) global.sendToUser(conductor_id, { type: 'data_entregas' })
    // Push notification al conductor asignado
    if (global.sendPushToUser) {
      try {
        const { rows: pInfo } = await pool.query('SELECT numero_pedido FROM pedidos WHERE id = $1', [pedido_id])
        const nPedido = pInfo[0]?.numero_pedido || pedido_id
        global.sendPushToUser(conductor_id, {
          title: 'VITREX SIGEP — Nueva Entrega',
          body:  `Se te asignó la entrega del pedido #${nPedido}`,
          url:   '/conductor'
        })
      } catch {}
    }
    res.status(201).json(savedRow)
  } catch (err) {
    console.error('[ERROR crear entrega]', err.message)
    res.status(500).json({ message: 'Error al asignar entrega' })
  }
})

// PATCH /api/entregas/:id/estado — admin cambia estado manualmente
router.patch('/:id/estado', verifyToken, isAdmin, async (req, res) => {
  const { estado } = req.body
  const estadosValidos = ['asignada', 'en_camino', 'entregada', 'incidencia']
  if (!estadosValidos.includes(estado)) {
    return res.status(400).json({ message: `Estado inválido. Use: ${estadosValidos.join(', ')}` })
  }
  try {
    const { rows } = await pool.query(
      'UPDATE entregas SET estado=$1 WHERE id=$2 RETURNING *',
      [estado, req.params.id]
    )
    if (!rows.length) return res.status(404).json({ message: 'Entrega no encontrada' })
    if (global.broadcastToAll) global.broadcastToAll({ type: 'data_entregas' })
    res.json(rows[0])
  } catch (err) {
    console.error('[ERROR patch estado]', err.message)
    res.status(500).json({ message: 'Error al actualizar estado' })
  }
})

// PUT /api/entregas/:id/iniciar — conductor inicia viaje
router.put('/:id/iniciar', verifyToken, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `UPDATE entregas SET estado='en_camino', fecha_inicio=NOW()
       WHERE id=$1 AND conductor_id=$2 RETURNING *`,
      [req.params.id, req.user.id]
    )
    if (!rows.length) return res.status(404).json({ message: 'Entrega no encontrada o sin permiso' })
    if (global.broadcastToAdmins) global.broadcastToAdmins({ type: 'data_entregas' })
    res.json(rows[0])
  } catch (err) {
    res.status(500).json({ message: 'Error al iniciar entrega' })
  }
})

// PUT /api/entregas/:id/entregar — conductor marca entregado (+ foto_base64 opcional)
router.put('/:id/entregar', verifyToken, async (req, res) => {
  const { evidencia_url, firma_url, notas, foto_base64 } = req.body
  try {
    const { rows } = await pool.query(
      `UPDATE entregas
       SET estado='entregada', fecha_entrega_real=NOW(),
           evidencia_url=$3, firma_url=$4, notas=$5, foto_base64=$6
       WHERE id=$1 AND conductor_id=$2 RETURNING *`,
      [req.params.id, req.user.id, evidencia_url || null, firma_url || null, notas || null, foto_base64 || null]
    )
    if (!rows.length) return res.status(404).json({ message: 'Entrega no encontrada o sin permiso' })
    if (global.broadcastToAdmins) global.broadcastToAdmins({ type: 'data_entregas' })
    res.json(rows[0])
  } catch (err) {
    console.error('[ERROR entregar]', err.message)
    res.status(500).json({ message: 'Error al registrar entrega' })
  }
})

// PUT /api/entregas/:id/no-entregada — conductor reporta que no pudo entregar
router.put('/:id/no-entregada', verifyToken, async (req, res) => {
  const { razon } = req.body
  if (!razon?.trim()) {
    return res.status(400).json({ message: 'El motivo es requerido' })
  }
  try {
    const { rows } = await pool.query(
      `UPDATE entregas SET estado='incidencia', notas=$3
       WHERE id=$1 AND conductor_id=$2 RETURNING pedido_id`,
      [req.params.id, req.user.id, razon.trim()]
    )
    if (!rows.length) return res.status(404).json({ message: 'Entrega no encontrada o sin permiso' })
    const pedidoId = rows[0].pedido_id
    // Obtener número de pedido
    const { rows: pRows } = await pool.query('SELECT numero_pedido FROM pedidos WHERE id = $1', [pedidoId])
    const numeroPedido = pRows[0]?.numero_pedido || pedidoId
    // WS a admins
    if (global.broadcastToAdmins) global.broadcastToAdmins({ type: 'data_entregas' })
    // Notificación persistente + push a admins
    try {
      const conductorNombre = req.user.nombre || 'Conductor'
      await pool.query(
        `INSERT INTO notificaciones (tipo, mensaje, pedido_id, pedido_numero, creado_por, creado_por_nombre, para_roles)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        ['incidencia',
         `⚠️ Incidencia: no se pudo entregar #${numeroPedido} — "${razon.trim()}" (${conductorNombre})`,
         pedidoId, String(numeroPedido), req.user.id, conductorNombre, [1]]
      )
      if (global.sendPushToUser) {
        const { rows: admins } = await pool.query('SELECT id FROM usuarios WHERE role_id=1 AND activo=true')
        for (const admin of admins) {
          global.sendPushToUser(admin.id, {
            title: 'VITREX — Incidencia de Entrega',
            body:  `No se pudo entregar pedido #${numeroPedido}: "${razon.trim()}"`,
            url:   '/admin/pedidos'
          })
        }
      }
    } catch (notifErr) {
      console.warn('[NOTIF incidencia]', notifErr.message)
    }
    res.json({ message: 'Incidencia registrada correctamente' })
  } catch (err) {
    console.error('[ERROR no-entregada]', err.message)
    res.status(500).json({ message: 'Error al registrar incidencia' })
  }
})

// DELETE /api/entregas/:id — eliminar entrega (admin)
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM entregas WHERE id=$1', [req.params.id])
    if (result.rowCount === 0) return res.status(404).json({ message: 'Entrega no encontrada' })
    if (global.broadcastToAll) global.broadcastToAll({ type: 'data_entregas' })
    res.json({ message: 'Entrega eliminada correctamente' })
  } catch (err) {
    console.error('[ERROR delete entrega]', err.message)
    res.status(500).json({ message: 'Error al eliminar entrega' })
  }
})

module.exports = router
