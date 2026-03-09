const express = require('express');
const router  = express.Router();
const pool    = require('../config/db');
const bcrypt  = require('bcrypt');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

/* GET /api/usuarios — lista todos los usuarios (admin) */
router.get('/', verifyToken, isAdmin, async (req, res) => {
  try {
    const { role_id } = req.query;
    let query  = 'SELECT id, nombre, email, role_id, departamento, activo, en_turno, fecha_creacion FROM usuarios';
    const vals = [];
    if (role_id) {
      query += ' WHERE role_id = $1';
      vals.push(parseInt(role_id));
    }
    query += ' ORDER BY role_id, nombre';
    const { rows } = await pool.query(query, vals);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener usuarios', error: err.message });
  }
});

/* PATCH /api/usuarios/turno/toggle — conductor activa/desactiva su propio turno */
router.patch('/turno/toggle', verifyToken, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'UPDATE usuarios SET en_turno = NOT en_turno WHERE id = $1 RETURNING id, en_turno',
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json({ en_turno: rows[0].en_turno });
  } catch (err) {
    res.status(500).json({ message: 'Error al cambiar estado de turno', error: err.message });
  }
});

/* PUT /api/usuarios/:id — actualizar datos del usuario (admin) */
router.put('/:id', verifyToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  const { nombre, email, role_id, departamento } = req.body;

  if (!nombre || !email) {
    return res.status(400).json({ message: 'Nombre y email son obligatorios' });
  }

  try {
    // Verificar email único (excluyendo el usuario actual)
    const emailExiste = await pool.query(
      'SELECT 1 FROM usuarios WHERE email = $1 AND id != $2',
      [email.toLowerCase(), id]
    );
    if (emailExiste.rows.length > 0) {
      return res.status(400).json({ message: 'Ese email ya está en uso' });
    }

    await pool.query(
      `UPDATE usuarios
       SET nombre = $1, email = $2, role_id = $3, departamento = $4
       WHERE id = $5`,
      [nombre.trim(), email.toLowerCase().trim(), role_id || 2, departamento || null, id]
    );

    const { rows } = await pool.query(
      'SELECT id, nombre, email, role_id, departamento, activo, en_turno FROM usuarios WHERE id = $1',
      [id]
    );

    if (rows.length === 0) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Error al actualizar usuario', error: err.message });
  }
});

/* PATCH /api/usuarios/:id/activo — activar / desactivar usuario (admin) */
router.patch('/:id/activo', verifyToken, isAdmin, async (req, res) => {
  const { id }    = req.params;
  const { activo } = req.body;

  if (typeof activo !== 'boolean') {
    return res.status(400).json({ message: 'El campo activo debe ser boolean' });
  }

  try {
    const result = await pool.query(
      'UPDATE usuarios SET activo = $1 WHERE id = $2',
      [activo, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json({ message: `Usuario ${activo ? 'activado' : 'desactivado'} correctamente` });
  } catch (err) {
    res.status(500).json({ message: 'Error al cambiar estado del usuario', error: err.message });
  }
});

/* PATCH /api/usuarios/:id/password — cambiar contraseña (admin) */
router.patch('/:id/password', verifyToken, isAdmin, async (req, res) => {
  const { id }       = req.params;
  const { password } = req.body;

  if (!password || password.length < 6) {
    return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres' });
  }

  try {
    const hashed = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'UPDATE usuarios SET password_hash = $1 WHERE id = $2',
      [hashed, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (err) {
    res.status(500).json({ message: 'Error al cambiar contraseña', error: err.message });
  }
});

module.exports = router;
