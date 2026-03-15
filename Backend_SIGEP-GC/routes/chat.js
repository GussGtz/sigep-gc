const express = require('express')
const router  = express.Router()
const pool    = require('../config/db.js')
const { verifyToken } = require('../middlewares/authMiddleware.js')

// ─── GET /api/chat/contactos ────────────────────────────────────────────────
// Devuelve todos los usuarios activos excepto el propio, con count de mensajes no leídos
router.get('/contactos', verifyToken, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        u.id,
        u.nombre,
        u.email,
        u.role_id,
        u.departamento,
        COALESCE(unread.cnt, 0)::int AS unread_count,
        last_msg.mensaje              AS ultimo_mensaje,
        last_msg.created_at           AS ultimo_at
      FROM usuarios u
      LEFT JOIN (
        SELECT de_usuario_id, COUNT(*) AS cnt
        FROM mensajes_directos
        WHERE para_usuario_id = $1 AND leido = FALSE
        GROUP BY de_usuario_id
      ) unread ON unread.de_usuario_id = u.id
      LEFT JOIN LATERAL (
        SELECT mensaje, created_at
        FROM mensajes_directos
        WHERE (de_usuario_id = u.id   AND para_usuario_id = $1)
           OR (de_usuario_id = $1 AND para_usuario_id = u.id)
        ORDER BY created_at DESC
        LIMIT 1
      ) last_msg ON TRUE
      WHERE u.id <> $1 AND u.activo IS NOT FALSE
      ORDER BY last_msg.created_at DESC NULLS LAST, u.nombre
    `, [req.user.id])

    res.json(rows)
  } catch (err) {
    console.error('[ERROR chat/contactos]', err.message)
    res.status(500).json({ message: 'Error al obtener contactos' })
  }
})

// ─── GET /api/chat/conversacion/:userId ─────────────────────────────────────
// Últimos 100 mensajes entre el usuario actual y userId, orden cronológico
router.get('/conversacion/:userId', verifyToken, async (req, res) => {
  const otroId = parseInt(req.params.userId)
  if (isNaN(otroId)) return res.status(400).json({ message: 'userId inválido' })

  try {
    const { rows } = await pool.query(`
      SELECT
        m.id,
        m.de_usuario_id,
        m.para_usuario_id,
        m.mensaje,
        m.leido,
        m.created_at,
        u.nombre AS de_nombre,
        u.role_id AS de_role_id
      FROM mensajes_directos m
      JOIN usuarios u ON u.id = m.de_usuario_id
      WHERE
        (m.de_usuario_id = $1 AND m.para_usuario_id = $2)
        OR
        (m.de_usuario_id = $2 AND m.para_usuario_id = $1)
      ORDER BY m.created_at ASC
      LIMIT 100
    `, [req.user.id, otroId])

    res.json(rows)
  } catch (err) {
    console.error('[ERROR chat/conversacion]', err.message)
    res.status(500).json({ message: 'Error al obtener conversación' })
  }
})

// ─── PATCH /api/chat/leer/:userId ────────────────────────────────────────────
// Marca como leídos todos los mensajes recibidos del userId dado
router.patch('/leer/:userId', verifyToken, async (req, res) => {
  const otroId = parseInt(req.params.userId)
  if (isNaN(otroId)) return res.status(400).json({ message: 'userId inválido' })

  try {
    await pool.query(`
      UPDATE mensajes_directos
      SET leido = TRUE
      WHERE para_usuario_id = $1 AND de_usuario_id = $2 AND leido = FALSE
    `, [req.user.id, otroId])

    res.json({ ok: true })
  } catch (err) {
    console.error('[ERROR chat/leer]', err.message)
    res.status(500).json({ message: 'Error al marcar mensajes como leídos' })
  }
})

// ─── DELETE /api/chat/conversacion/:userId ───────────────────────────────────
// Elimina todos los mensajes entre el usuario actual y userId
router.delete('/conversacion/:userId', verifyToken, async (req, res) => {
  const otroId = parseInt(req.params.userId)
  if (isNaN(otroId)) return res.status(400).json({ message: 'userId inválido' })

  try {
    const { rowCount } = await pool.query(`
      DELETE FROM mensajes_directos
      WHERE (de_usuario_id = $1 AND para_usuario_id = $2)
         OR (de_usuario_id = $2 AND para_usuario_id = $1)
    `, [req.user.id, otroId])

    res.json({ message: `Conversación eliminada: ${rowCount} mensaje(s)` })
  } catch (err) {
    console.error('[ERROR delete chat/conversacion]', err.message)
    res.status(500).json({ message: 'Error al eliminar conversación' })
  }
})

// ─── DELETE /api/chat/todas ──────────────────────────────────────────────────
// Elimina todos los mensajes enviados o recibidos por el usuario actual
router.delete('/todas', verifyToken, async (req, res) => {
  try {
    const { rowCount } = await pool.query(`
      DELETE FROM mensajes_directos
      WHERE de_usuario_id = $1 OR para_usuario_id = $1
    `, [req.user.id])

    res.json({ message: `Historial eliminado: ${rowCount} mensaje(s)` })
  } catch (err) {
    console.error('[ERROR delete chat/todas]', err.message)
    res.status(500).json({ message: 'Error al eliminar chats' })
  }
})

module.exports = router
