const express = require('express');
const router  = express.Router();
const pool    = require('../config/db');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

// GET /api/tipos-vidrio
router.get('/', verifyToken, async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM tipos_vidrio ORDER BY orden ASC, nombre ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/tipos-vidrio
router.post('/', verifyToken, isAdmin, async (req, res) => {
  const { nombre } = req.body;
  if (!nombre?.trim()) return res.status(400).json({ message: 'nombre es obligatorio' });
  try {
    const { rows } = await pool.query(
      'INSERT INTO tipos_vidrio (nombre) VALUES ($1) RETURNING *',
      [nombre.trim()]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ message: 'Ese tipo ya existe' });
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/tipos-vidrio/:id  (actualizar nombre / activo / orden)
router.put('/:id', verifyToken, isAdmin, async (req, res) => {
  const { nombre, activo, orden } = req.body;
  const fields = [], vals = [];
  let idx = 1;
  if (nombre  !== undefined) { fields.push(`nombre=$${idx++}`); vals.push(nombre.trim()); }
  if (activo  !== undefined) { fields.push(`activo=$${idx++}`); vals.push(activo); }
  if (orden   !== undefined) { fields.push(`orden=$${idx++}`);  vals.push(parseInt(orden)); }
  if (!fields.length) return res.status(400).json({ message: 'Nada que actualizar' });
  vals.push(parseInt(req.params.id));
  try {
    const { rows } = await pool.query(
      `UPDATE tipos_vidrio SET ${fields.join(',')} WHERE id=$${idx} RETURNING *`,
      vals
    );
    if (!rows.length) return res.status(404).json({ message: 'No encontrado' });
    res.json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ message: 'Ese nombre ya existe' });
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/tipos-vidrio/:id
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM tipos_vidrio WHERE id=$1', [parseInt(req.params.id)]);
    if (!rowCount) return res.status(404).json({ message: 'No encontrado' });
    res.json({ message: 'Eliminado' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
