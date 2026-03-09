const express = require('express');
const router = express.Router();

// === Controladores ===
const {
  crearPedido,
  obtenerPedidos,
  obtenerResumen,
  actualizarEstatus,
  eliminarPedido,
  eliminarPedidosCompletados,
  registrarMerma
} = require('../controllers/pedidoController');

// === Middleware de autenticación y permisos ===
const {
  verifyToken,
  isAdmin
} = require('../middlewares/authMiddleware');

// ==== 📦 PEDIDOS ====
// Nota: los comentarios ahora se gestionan en /api/comentarios (routes/comentarios.js)

router.get('/',              verifyToken,           obtenerPedidos);
router.get('/resumen',      verifyToken, isAdmin,  obtenerResumen);
router.post('/',             verifyToken,           crearPedido);          // admin o ventas
router.put('/estatus/:id',   verifyToken,           actualizarEstatus);
router.put('/:id/merma',     verifyToken,           registrarMerma);
router.delete('/completados',verifyToken, isAdmin,  eliminarPedidosCompletados);
router.delete('/:id',        verifyToken, isAdmin,  eliminarPedido);

module.exports = router;
