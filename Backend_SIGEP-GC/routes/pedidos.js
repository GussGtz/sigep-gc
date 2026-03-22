const express = require('express');
const router = express.Router();

// === Controladores ===
const {
  crearPedido,
  obtenerPedidos,
  obtenerResumen,
  actualizarEstatus,
  actualizarPrioridad,
  eliminarPedido,
  eliminarPedidosCompletados,
  registrarMerma
} = require('../controllers/pedidoController');

// === Middleware de autenticación y permisos ===
const {
  verifyToken,
  isAdmin
} = require('../middlewares/authMiddleware');

const pool = require('../config/db');

// ==== 📦 PEDIDOS ====
// Nota: los comentarios ahora se gestionan en /api/comentarios (routes/comentarios.js)

router.get('/',              verifyToken,           obtenerPedidos);
router.get('/resumen',      verifyToken, isAdmin,  obtenerResumen);
router.post('/',             verifyToken,           crearPedido);          // admin o ventas
router.put('/estatus/:id',    verifyToken,           actualizarEstatus);
router.put('/:id/prioridad', verifyToken, isAdmin,  actualizarPrioridad);
router.put('/:id/merma',     verifyToken,           registrarMerma);
router.delete('/completados',verifyToken, isAdmin,  eliminarPedidosCompletados);
router.delete('/:id',        verifyToken, isAdmin,  eliminarPedido);

/* ─────────────────────────────────────────────
   POST /api/pedidos/importar
   Importación masiva desde Excel (array de pedidos)
   Solo admin.
───────────────────────────────────────────── */
router.post('/importar', verifyToken, isAdmin, async (req, res) => {
  const { pedidos } = req.body;
  if (!Array.isArray(pedidos) || pedidos.length === 0) {
    return res.status(400).json({ message: 'Se requiere un array de pedidos' });
  }

  const userId   = req.user.id;
  const userName = req.user.nombre || 'Admin';
  const resultado = { creados: 0, errores: [] };

  for (const p of pedidos) {
    if (!p.numero_pedido || !p.fecha_entrega) {
      resultado.errores.push({ numero_pedido: p.numero_pedido || '(vacío)', error: 'Faltan campos obligatorios: numero_pedido y fecha_entrega' });
      continue;
    }

    try {
      // Verificar duplicado
      const existe = await pool.query('SELECT 1 FROM pedidos WHERE numero_pedido = $1', [p.numero_pedido]);
      if (existe.rows.length > 0) {
        resultado.errores.push({ numero_pedido: p.numero_pedido, error: 'Ya existe en el sistema' });
        continue;
      }

      const alto     = p.alto     ? parseFloat(p.alto)     : null;
      const ancho    = p.ancho    ? parseFloat(p.ancho)    : null;
      const cantidad = p.cantidad ? parseInt(p.cantidad)   : 1;
      // Usar metros_cuadrados directo (PDF) o calcularlo de alto×ancho (Excel)
      const metros_cuadrados = (alto && ancho)
        ? parseFloat((alto * ancho * cantidad).toFixed(4))
        : (p.metros_cuadrados ? parseFloat(p.metros_cuadrados) : null);
      const prioridad = ['bajo', 'medio', 'alto'].includes((p.prioridad || 'bajo').toLowerCase())
        ? (p.prioridad || 'bajo').toLowerCase()
        : 'bajo';
      const inventarioId = p.inventario_id ? parseInt(p.inventario_id) : null;

      // ── Desglose por material (PDF multi-vidrio) o legacy (único ID) ────
      // posiciones_materiales: [{ inventario_id, m2 }]
      const posicionesMat = Array.isArray(p.posiciones_materiales) && p.posiciones_materiales.length > 0
        ? p.posiciones_materiales.filter(x => x.inventario_id && parseFloat(x.m2) > 0)
        : (inventarioId && metros_cuadrados > 0
            ? [{ inventario_id: inventarioId, m2: metros_cuadrados }]
            : []);

      // Verificar stock para cada material
      let stockError = null;
      for (const { inventario_id: invId, m2: m2req } of posicionesMat) {
        const matRow = await pool.query(
          'SELECT stock_m2, tipo FROM inventario_vidrio WHERE id = $1',
          [parseInt(invId)]
        );
        if (!matRow.rows.length) { stockError = `Material #${invId} no encontrado`; break; }
        const disponible = parseFloat(matRow.rows[0].stock_m2);
        const requerido  = parseFloat(m2req);
        if (disponible < requerido) {
          stockError = `Stock insuficiente en ${matRow.rows[0].tipo}: disponible ${disponible.toFixed(4)} m², requerido ${requerido.toFixed(4)} m²`;
          break;
        }
      }
      if (stockError) {
        resultado.errores.push({ numero_pedido: p.numero_pedido, error: stockError });
        continue;
      }

      // inventario_id principal = primer material con deducción (para FK en pedidos)
      const invIdPrincipal = posicionesMat.length > 0 ? parseInt(posicionesMat[0].inventario_id) : null;

      const pedidoResult = await pool.query(
        `INSERT INTO pedidos
           (numero_pedido, fecha_entrega, creado_por,
            alto, ancho, cantidad, metros_cuadrados, prioridad,
            especificaciones, cliente_nombre, direccion_entrega,
            precio, total_piezas, inventario_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
         RETURNING id`,
        [
          p.numero_pedido, p.fecha_entrega, userId,
          alto, ancho, cantidad, metros_cuadrados, prioridad,
          p.especificaciones || null, p.cliente_nombre || null, p.direccion_entrega || null,
          p.precio ? parseFloat(p.precio) : null,
          p.total_piezas ? parseInt(p.total_piezas) : null,
          invIdPrincipal,
        ]
      );

      const pedidoId = pedidoResult.rows[0].id;
      for (const area of ['contabilidad', 'ventas', 'produccion']) {
        await pool.query('INSERT INTO pedido_estatus (pedido_id, area) VALUES ($1, $2)', [pedidoId, area]);
      }

      // Descontar stock por cada material vinculado
      let huboCambioInv = false;
      for (const { inventario_id: invId, m2: m2uso } of posicionesMat) {
        await pool.query(
          `UPDATE inventario_vidrio SET stock_m2 = stock_m2 - $1, updated_at = NOW() WHERE id = $2`,
          [parseFloat(m2uso), parseInt(invId)]
        );
        await pool.query(
          `INSERT INTO movimientos_inventario (inventario_id, tipo, m2, descripcion, creado_por, creado_por_nombre)
           VALUES ($1, 'uso', $2, $3, $4, $5)`,
          [parseInt(invId), parseFloat(m2uso), `Importación pedido #${p.numero_pedido}`, userId, userName]
        );
        huboCambioInv = true;
      }
      if (huboCambioInv && global.broadcastToAdmins) global.broadcastToAdmins({ type: 'data_inventario' });

      resultado.creados++;
    } catch (err) {
      resultado.errores.push({ numero_pedido: p.numero_pedido, error: err.message });
    }
  }

  // Broadcast WS para actualizar vistas en tiempo real
  if (resultado.creados > 0 && global.broadcastToAll) {
    global.broadcastToAll({ type: 'data_pedidos' });
  }

  // Notificación resumen si se crearon pedidos
  if (resultado.creados > 0 && global.sendPushToUser) {
    try {
      const { rows: usuarios } = await pool.query('SELECT id, role_id FROM usuarios WHERE activo = true');
      for (const u of usuarios) {
        const url = u.role_id === 3 ? '/conductor' : '/admin/pedidos';
        global.sendPushToUser(u.id, {
          title: 'Glass Caribe',
          body: `${resultado.creados} pedido(s) importados desde Excel por ${userName}`,
          url
        });
      }
    } catch {}
  }

  res.json(resultado);
});

module.exports = router;
