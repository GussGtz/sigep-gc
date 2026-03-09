const express = require('express')
const router  = express.Router()
const pool    = require('../config/db.js')
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware.js')

// ─── GET /api/gps/ubicaciones ────────────────────────────────────────────────
// Devuelve la última posición de cada conductor (solo las actualizadas en los últimos 5 min)
router.get('/ubicaciones', verifyToken, isAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        cu.conductor_id,
        cu.lat,
        cu.lng,
        cu.pedido_id,
        cu.updated_at,
        u.nombre AS conductor_nombre,
        p.numero_pedido
      FROM conductor_ubicaciones cu
      JOIN usuarios u ON u.id = cu.conductor_id
      LEFT JOIN pedidos p ON p.id = cu.pedido_id
      WHERE cu.updated_at > NOW() - INTERVAL '5 minutes'
      ORDER BY cu.updated_at DESC
    `)
    res.json(rows)
  } catch (err) {
    console.error('[ERROR gps/ubicaciones]', err.message)
    res.status(500).json({ message: 'Error al obtener ubicaciones' })
  }
})

// ─── GET /api/gps/historial/:conductorId ─────────────────────────────────────
// Posición actual de un conductor específico (sin límite de tiempo)
router.get('/historial/:conductorId', verifyToken, isAdmin, async (req, res) => {
  const conductorId = parseInt(req.params.conductorId)
  if (isNaN(conductorId)) return res.status(400).json({ message: 'conductorId inválido' })

  try {
    const { rows } = await pool.query(`
      SELECT cu.*, u.nombre AS conductor_nombre
      FROM conductor_ubicaciones cu
      JOIN usuarios u ON u.id = cu.conductor_id
      WHERE cu.conductor_id = $1
    `, [conductorId])

    if (!rows.length) return res.status(404).json({ message: 'Sin posición registrada' })
    res.json(rows[0])
  } catch (err) {
    console.error('[ERROR gps/historial]', err.message)
    res.status(500).json({ message: 'Error al obtener posición' })
  }
})

module.exports = router
