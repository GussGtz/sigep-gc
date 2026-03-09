const express = require('express')
const router  = express.Router()
const pool    = require('../config/db.js')
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware.js')

// GET /api/entregas — listar todas (admin)
router.get('/', verifyToken, isAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT e.*, p.numero_pedido, p.fecha_entrega,
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
    const { rows } = await pool.query(
      `INSERT INTO entregas (pedido_id, conductor_id, estado)
       VALUES ($1, $2, 'asignada') RETURNING *`,
      [pedido_id, conductor_id]
    )
    res.status(201).json(rows[0])
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
    res.json(rows[0])
  } catch (err) {
    console.error('[ERROR entregar]', err.message)
    res.status(500).json({ message: 'Error al registrar entrega' })
  }
})

// DELETE /api/entregas/:id — eliminar entrega (admin)
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM entregas WHERE id=$1', [req.params.id])
    if (result.rowCount === 0) return res.status(404).json({ message: 'Entrega no encontrada' })
    res.json({ message: 'Entrega eliminada correctamente' })
  } catch (err) {
    console.error('[ERROR delete entrega]', err.message)
    res.status(500).json({ message: 'Error al eliminar entrega' })
  }
})

module.exports = router
