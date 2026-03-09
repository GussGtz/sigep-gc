const express = require('express');
const router  = express.Router();
const https   = require('https');

const { register, login, me } = require('../controllers/authController');
const { verifyToken }         = require('../middlewares/authMiddleware');

/* ══════════════════════════════════════════════════
   reCAPTCHA v2 — Verificación con Google
   ══════════════════════════════════════════════════ */

/**
 * Verifica el token reCAPTCHA con la API de Google.
 * Si RECAPTCHA_SECRET_KEY no está configurada (env local sin clave),
 * devuelve true para no bloquear el desarrollo.
 */
function verifyRecaptcha(token) {
  return new Promise((resolve) => {
    const secret = process.env.RECAPTCHA_SECRET_KEY;

    // Sin clave configurada → omitir verificación (desarrollo local)
    if (!secret) return resolve(true);
    // Sin token → rechazar
    if (!token)  return resolve(false);

    const params = `secret=${encodeURIComponent(secret)}&response=${encodeURIComponent(token)}`;
    const options = {
      hostname: 'www.google.com',
      path:     '/recaptcha/api/siteverify',
      method:   'POST',
      headers: {
        'Content-Type':   'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(params),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed.success === true);
        } catch {
          resolve(false);
        }
      });
    });

    req.on('error', () => resolve(true)); // error de red → no bloquear al usuario
    req.write(params);
    req.end();
  });
}

/**
 * Middleware: verifica reCAPTCHA antes de continuar.
 * Espera { recaptchaToken } en req.body.
 */
async function checkRecaptcha(req, res, next) {
  const ok = await verifyRecaptcha(req.body.recaptchaToken);
  if (!ok) {
    return res.status(400).json({
      message: 'Verificación de seguridad fallida. Completa el reCAPTCHA e intenta de nuevo.',
    });
  }
  next();
}

/* ══════════════════════════════════════════════════
   Rutas de autenticación
   ══════════════════════════════════════════════════ */

// POST /api/auth/register
router.post('/register', checkRecaptcha, register);

// POST /api/auth/login
router.post('/login', checkRecaptcha, login);

// GET /api/auth/me  (requiere token)
router.get('/me', verifyToken, me);

// POST /api/auth/logout  (limpia en cliente; el token expira naturalmente)
router.post('/logout', (req, res) => {
  res.json({ message: 'Sesion cerrada correctamente' });
});

// POST /api/auth/forgot-password
// Seguridad: siempre devuelve 200 para no revelar si el email existe
router.post('/forgot-password', checkRecaptcha, async (req, res) => {
  const { email } = req.body;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: 'Correo electrónico inválido' });
  }

  try {
    const pool = require('../config/db');
    await pool.query('SELECT id FROM usuarios WHERE email = $1', [email.toLowerCase().trim()]);
    // En producción: enviar correo con token de restablecimiento
    console.log(`[forgot-password] Solicitud recibida para: ${email}`);
  } catch (err) {
    console.error('[forgot-password] DB error:', err.message);
  }

  // Siempre responder éxito (previene enumeración de usuarios)
  res.json({ message: 'Si el correo existe, recibirás instrucciones.' });
});

module.exports = router;
