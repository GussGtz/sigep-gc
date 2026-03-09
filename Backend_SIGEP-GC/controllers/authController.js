const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const generateToken = require('../utils/generateToken');

// POST /api/auth/register
const register = async (req, res) => {
  const { nombre, email, password, role_id, departamento } = req.body;

  if (!nombre || !email || !password) {
    return res.status(400).json({ message: 'Nombre, email y contraseña son obligatorios' });
  }

  // ── Determinar rol (solo admin puede asignar rol distinto a 2) ──
  let rolAsignado = 2;
  const authHeader = req.headers.authorization;
  if (authHeader && role_id) {
    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // Ahora permite role_id 1, 2 y 3 (conductor)
      if (decoded.role_id === 1 && [1, 2, 3].includes(Number(role_id))) {
        rolAsignado = Number(role_id);
      }
    } catch {}
  }

  const esConductor = rolAsignado === 3;

  // ── Departamento: requerido solo para no-conductores ──
  if (!esConductor) {
    if (!departamento) {
      return res.status(400).json({ message: 'El departamento es obligatorio' });
    }
    if (!['ventas', 'contabilidad', 'produccion'].includes(departamento)) {
      return res.status(400).json({ message: 'Departamento invalido' });
    }
  }

  try {
    // Verificar si el email ya existe
    const existe = await pool.query('SELECT id FROM usuarios WHERE email = $1', [email]);
    if (existe.rows.length > 0) {
      return res.status(400).json({ message: 'El correo ya está registrado' });
    }

    const hash = await bcrypt.hash(password, 10);

    const insert = await pool.query(
      'INSERT INTO usuarios (nombre, email, password_hash, role_id, departamento) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [nombre, email, hash, rolAsignado, esConductor ? null : departamento]
    );

    const user = await pool.query(
      'SELECT id, nombre, email, role_id, departamento FROM usuarios WHERE id = $1',
      [insert.rows[0].id]
    );

    const token = generateToken(user.rows[0]);
    res.status(201).json({ user: user.rows[0], token });

  } catch (err) {
    console.error('[ERROR register]', err.message);
    res.status(500).json({ message: 'Error en el servidor', error: err.message });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Correo y contrasena son obligatorios' });
  }

  try {
    const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const user = result.rows[0];

    if (!user.activo) {
      return res.status(403).json({ message: 'Cuenta desactivada' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ message: 'Contrasena incorrecta' });
    }

    const token = generateToken(user);

    // Devuelve usuario sin password_hash
    const { password_hash, reset_token, reset_expires, ...userPublic } = user;
    res.json({ user: userPublic, token });

  } catch (err) {
    console.error('[ERROR login]', err.message);
    res.status(500).json({ message: 'Error en el servidor', error: err.message });
  }
};

// GET /api/auth/me
const me = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, nombre, email, role_id, departamento FROM usuarios WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('[ERROR me]', err.message);
    res.status(500).json({ message: 'Error al obtener usuario', error: err.message });
  }
};

module.exports = { register, login, me };
