const express = require('express')
const router  = express.Router()
const pool    = require('../config/db.js')
const { verifyToken } = require('../middlewares/authMiddleware.js')

// GET /api/push/vapid-public-key — sin auth (necesario para suscripción en frontend)
router.get('/vapid-public-key', (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY || null })
})

// POST /api/push/subscribe — guarda o actualiza la suscripción push del usuario
router.post('/subscribe', verifyToken, async (req, res) => {
  const { subscription } = req.body
  if (!subscription?.endpoint) {
    return res.status(400).json({ message: 'Suscripción inválida' })
  }
  try {
    await pool.query(
      `INSERT INTO push_subscriptions (user_id, endpoint, subscription)
       VALUES ($1, $2, $3)
       ON CONFLICT (endpoint) DO UPDATE SET subscription = $3, user_id = $1`,
      [req.user.id, subscription.endpoint, JSON.stringify(subscription)]
    )
    res.json({ message: 'Suscripción guardada' })
  } catch (err) {
    res.status(500).json({ message: 'Error al guardar suscripción', error: err.message })
  }
})

// DELETE /api/push/unsubscribe — eliminar todas las suscripciones del usuario
router.delete('/unsubscribe', verifyToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM push_subscriptions WHERE user_id = $1', [req.user.id])
    res.json({ message: 'Suscripción eliminada' })
  } catch (err) {
    res.status(500).json({ message: 'Error al eliminar suscripción', error: err.message })
  }
})

module.exports = router
