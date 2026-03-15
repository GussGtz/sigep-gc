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

  // ── Determinar rol y si es auto-registro o lo crea un admin ──
  let rolAsignado    = 2;
  let esAutoRegistro = true; // true = usuario se registra solo; false = admin crea la cuenta

  const authHeader = req.headers.authorization;
  if (authHeader && role_id) {
    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // Permite role_id 1, 2 y 3 (conductor) solo si es admin
      if (decoded.role_id === 1 && [1, 2, 3].includes(Number(role_id))) {
        rolAsignado    = Number(role_id);
        esAutoRegistro = false; // Admin crea usuario → activar de inmediato
      }
    } catch {}
  }

  // ── Si el usuario eligió "conductor" en el formulario → rol 3 automático ──
  if (departamento === 'conductor') {
    rolAsignado = 3;
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

    const hash          = await bcrypt.hash(password, 10);
    const activoInicial = !esAutoRegistro; // Auto-registro → inactivo; Admin crea → activo

    const insert = await pool.query(
      'INSERT INTO usuarios (nombre, email, password_hash, role_id, departamento, activo) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [nombre, email, hash, rolAsignado, esConductor ? null : departamento, activoInicial]
    );

    if (esAutoRegistro) {
      // ── Auto-registro: notificar admins y responder sin token ──
      const deptLabel = esConductor ? 'Conductor' : (departamento || 'Sin depto.');

      // WebSocket: notificar admins con la app abierta
      if (global.broadcastToAdmins) {
        global.broadcastToAdmins({
          type: 'nuevo_registro',
          user: { id: insert.rows[0].id, nombre, email, departamento: deptLabel }
        });
      }

      // Push: notificar admins con la app cerrada
      try {
        const { rows: admins } = await pool.query(
          'SELECT id FROM usuarios WHERE role_id = 1 AND activo = true'
        );
        for (const a of admins) {
          global.sendPushToUser?.(a.id, {
            title: 'Glass Caribe — Nuevo registro',
            body:  `${nombre} solicita acceso (${deptLabel})`,
            url:   '/admin/usuarios',
            tag:   'nuevo-registro'
          });
        }
      } catch (pushErr) {
        console.error('[register] Error enviando push a admins:', pushErr.message);
      }

      return res.status(201).json({
        message: 'Cuenta creada. Tu solicitud está pendiente de aprobación por el administrador.'
      });
    }

    // ── Admin creando usuario: respuesta normal con token ──
    const user = await pool.query(
      'SELECT id, nombre, email, role_id, departamento, en_turno FROM usuarios WHERE id = $1',
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
      return res.status(403).json({
        message: 'Tu cuenta está pendiente de activación. El administrador revisará tu solicitud.'
      });
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
      'SELECT id, nombre, email, role_id, departamento, en_turno FROM usuarios WHERE id = $1',
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
