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
      const metros_cuadrados = (alto && ancho)
        ? parseFloat((alto * ancho * cantidad).toFixed(4))
        : null;
      const prioridad = ['bajo', 'medio', 'alto'].includes((p.prioridad || 'bajo').toLowerCase())
        ? (p.prioridad || 'bajo').toLowerCase()
        : 'bajo';

      const pedidoResult = await pool.query(
        `INSERT INTO pedidos
           (numero_pedido, fecha_entrega, creado_por,
            alto, ancho, cantidad, metros_cuadrados, prioridad,
            especificaciones, cliente_nombre, direccion_entrega,
            precio, total_piezas)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         RETURNING id`,
        [
          p.numero_pedido, p.fecha_entrega, userId,
          alto, ancho, cantidad, metros_cuadrados, prioridad,
          p.especificaciones || null, p.cliente_nombre || null, p.direccion_entrega || null,
          p.precio ? parseFloat(p.precio) : null,
          p.total_piezas ? parseInt(p.total_piezas) : null,
        ]
      );

      const pedidoId = pedidoResult.rows[0].id;
      for (const area of ['contabilidad', 'ventas', 'produccion']) {
        await pool.query('INSERT INTO pedido_estatus (pedido_id, area) VALUES ($1, $2)', [pedidoId, area]);
      }

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
