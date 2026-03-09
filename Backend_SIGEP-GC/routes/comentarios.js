const express = require('express');
const router  = express.Router();

const {
  obtenerComentarios,
  agregarComentario,
  eliminarComentario
} = require('../controllers/comentariosController');

const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

// GET  /api/comentarios/:pedidoId  → todos los mensajes del pedido
router.get('/:pedidoId', verifyToken, obtenerComentarios);

// POST /api/comentarios/:pedidoId  → agregar nuevo mensaje
router.post('/:pedidoId', verifyToken, agregarComentario);

// DELETE /api/comentarios/:id      → eliminar mensaje (solo admin)
router.delete('/:id', verifyToken, isAdmin, eliminarComentario);

module.exports = router;
