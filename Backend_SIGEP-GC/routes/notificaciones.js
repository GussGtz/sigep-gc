const express = require('express');
const router  = express.Router();

const {
  obtenerNotificaciones,
  marcarLeida,
  marcarTodasLeidas
} = require('../controllers/notificacionesController');

const { verifyToken } = require('../middlewares/authMiddleware');

// GET    /api/notificaciones            → mis notificaciones (según rol)
router.get('/', verifyToken, obtenerNotificaciones);

// PATCH  /api/notificaciones/leer-todas → marcar todas como leídas (ANTES del :id)
router.patch('/leer-todas', verifyToken, marcarTodasLeidas);

// PATCH  /api/notificaciones/:id/leer   → marcar una como leída
router.patch('/:id/leer', verifyToken, marcarLeida);

module.exports = router;
