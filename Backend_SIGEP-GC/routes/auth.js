const express = require('express');
const router  = express.Router();
const https   = require('https');
const crypto  = require('crypto');

const { register, login, me } = require('../controllers/authController');
const { verifyToken }         = require('../middlewares/authMiddleware');

/* ══════════════════════════════════════════════════
   Rate limiter: 5 intentos de login por IP por minuto
   (implementado en memoria, sin dependencias extra)
   ══════════════════════════════════════════════════ */

const loginAttempts = new Map() // { ip → { count, resetAt } }

function loginRateLimiter(req, res, next) {
  const ip     = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.ip || 'unknown'
  const now    = Date.now()
  const WINDOW = 60_000   // ventana de 1 minuto
  const MAX    = 5        // intentos máximos

  let entry = loginAttempts.get(ip)

  if (!entry || now >= entry.resetAt) {
    // Nueva ventana: primer intento
    loginAttempts.set(ip, { count: 1, resetAt: now + WINDOW })
    return next()
  }

  if (entry.count >= MAX) {
    const segs = Math.ceil((entry.resetAt - now) / 1000)
    return res.status(429).json({
      message: `Demasiados intentos fallidos. Espera ${segs} segundo${segs !== 1 ? 's' : ''} e intenta de nuevo.`
    })
  }

  entry.count++
  next()
}

// Limpieza periódica para evitar memory leaks
setInterval(() => {
  const now = Date.now()
  for (const [ip, entry] of loginAttempts.entries()) {
    if (now >= entry.resetAt) loginAttempts.delete(ip)
  }
}, 5 * 60_000).unref()

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
 * Los administradores (JWT válido con role_id=1) omiten la verificación.
 */
async function checkRecaptcha(req, res, next) {
  // Admins no necesitan resolver reCAPTCHA (ej. crean usuarios desde el panel)
  const authHeader = req.headers.authorization;
  if (authHeader) {
    try {
      const { jwt: _jwt } = { jwt: require('jsonwebtoken') };
      const decoded = _jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
      if (decoded.role_id === 1) return next();
    } catch {}
  }

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

// POST /api/auth/login  (rate limiter → reCAPTCHA → controller)
router.post('/login', loginRateLimiter, checkRecaptcha, login);

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

  const emailNorm = email.toLowerCase().trim();

  try {
    const pool = require('../config/db');

    // Verificar si el usuario existe (pero no revelar si no existe en la respuesta)
    const { rows } = await pool.query(
      'SELECT id, nombre FROM usuarios WHERE email = $1 AND activo = true',
      [emailNorm]
    );

    if (rows.length) {
      // Generar token seguro y guardar con expiración de 1 hora
      const token     = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // +1 hora

      // Eliminar tokens previos del mismo email antes de crear uno nuevo
      await pool.query('DELETE FROM password_resets WHERE email = $1', [emailNorm]);
      await pool.query(
        'INSERT INTO password_resets (email, token, expires_at) VALUES ($1, $2, $3)',
        [emailNorm, token, expiresAt]
      );

      // Enviar email vía Brevo API HTTP (sin SMTP — compatible con Render free tier)
      if (process.env.BREVO_API_KEY) {
        try {
          const appUrl = process.env.APP_URL || 'https://sigep-gc.onrender.com';
          const link   = `${appUrl}/reset-password?token=${token}`;
          const nombre = rows[0].nombre || 'Usuario';

          const resp = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'api-key': process.env.BREVO_API_KEY,
            },
            body: JSON.stringify({
              sender:  { name: 'Glass Caribe', email: process.env.BREVO_SENDER_EMAIL || process.env.GMAIL_USER },
              to:      [{ email: emailNorm }],
              subject: 'Restablecer contraseña — Glass Caribe',
              htmlContent: `
                <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#f8f8f6;">
                  <div style="background:#fff;border-radius:16px;padding:32px;border:1px solid #e5e7eb;">
                    <div style="margin-bottom:24px;">
                      <span style="font-size:20px;font-weight:900;color:#1B3A5C;letter-spacing:-0.5px;">Glass Caribe</span>
                    </div>
                    <h2 style="font-size:22px;font-weight:700;color:#111827;margin:0 0 8px;">Hola, ${nombre} 👋</h2>
                    <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 24px;">
                      Recibimos una solicitud para restablecer la contraseña de tu cuenta.<br>
                      Haz clic en el botón de abajo. Este enlace expira en <strong>1 hora</strong>.
                    </p>
                    <a href="${link}"
                       style="display:inline-block;background:#1B3A5C;color:#fff;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:700;font-size:14px;letter-spacing:0.3px;">
                      🔑 Restablecer contraseña
                    </a>
                    <p style="color:#9ca3af;font-size:12px;margin:24px 0 0;line-height:1.6;">
                      Si no solicitaste este cambio, ignora este correo. Tu contraseña no cambiará.<br>
                      <span style="word-break:break-all;color:#d1d5db;">${link}</span>
                    </p>
                  </div>
                  <p style="text-align:center;color:#d1d5db;font-size:11px;margin-top:16px;">Glass Caribe © ${new Date().getFullYear()}</p>
                </div>
              `,
            }),
          });

          if (resp.ok) {
            console.log(`[forgot-password] Email enviado a: ${emailNorm}`);
          } else {
            const errBody = await resp.json().catch(() => ({}));
            console.error('[forgot-password] Brevo error:', resp.status, JSON.stringify(errBody));
          }
        } catch (emailErr) {
          console.error('[forgot-password] Error al enviar email:', emailErr.message);
        }
      } else {
        console.log(`[forgot-password] BREVO_API_KEY no configurada. Token: ${token}`);
      }
    } else {
      console.log(`[forgot-password] Email no encontrado (silenciado): ${emailNorm}`);
    }
  } catch (err) {
    console.error('[forgot-password] DB error:', err.message);
  }

  // Siempre responder éxito (previene enumeración de usuarios)
  res.json({ message: 'Si el correo existe, recibirás instrucciones.' });
});

// POST /api/auth/reset-password
// Valida el token y actualiza la contraseña
router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ message: 'Token y contraseña son requeridos' });
  }
  if (password.length < 8) {
    return res.status(400).json({ message: 'La contraseña debe tener al menos 8 caracteres' });
  }

  try {
    const pool   = require('../config/db');
    const bcrypt = require('bcrypt');

    // Buscar token válido y no expirado
    const { rows } = await pool.query(
      `SELECT email FROM password_resets
       WHERE token = $1 AND expires_at > NOW()`,
      [token]
    );

    if (!rows.length) {
      return res.status(400).json({
        message: 'El enlace es inválido o ha expirado. Solicita uno nuevo.'
      });
    }

    const { email } = rows[0];

    // Actualizar contraseña del usuario
    const hashed = await bcrypt.hash(password, 10);
    const updated = await pool.query(
      'UPDATE usuarios SET password_hash = $1 WHERE email = $2 AND activo = true RETURNING id',
      [hashed, email]
    );

    if (!updated.rows.length) {
      return res.status(404).json({ message: 'Usuario no encontrado o inactivo' });
    }

    // Eliminar el token usado (y todos los del mismo email)
    await pool.query('DELETE FROM password_resets WHERE email = $1', [email]);

    console.log(`[reset-password] Contraseña actualizada para: ${email}`);
    res.json({ message: 'Contraseña actualizada correctamente. Ya puedes iniciar sesión.' });
  } catch (err) {
    console.error('[reset-password]', err.message);
    res.status(500).json({ message: 'Error al restablecer contraseña', error: err.message });
  }
});

// PATCH /api/auth/cambiar-password — self-service para cualquier usuario autenticado
router.patch('/cambiar-password', verifyToken, async (req, res) => {
  const { password_actual, nueva_password } = req.body;
  if (!password_actual || !nueva_password) {
    return res.status(400).json({ message: 'Se requieren password_actual y nueva_password' });
  }
  if (nueva_password.length < 8) {
    return res.status(400).json({ message: 'La nueva contraseña debe tener mínimo 8 caracteres' });
  }
  try {
    const pool   = require('../config/db');
    const bcrypt = require('bcrypt');
    const { rows } = await pool.query('SELECT password_hash FROM usuarios WHERE id = $1', [req.user.id]);
    if (!rows.length) return res.status(404).json({ message: 'Usuario no encontrado' });
    const valid = await bcrypt.compare(password_actual, rows[0].password_hash);
    if (!valid) return res.status(401).json({ message: 'Contraseña actual incorrecta' });
    const hashed = await bcrypt.hash(nueva_password, 10);
    await pool.query('UPDATE usuarios SET password_hash = $1 WHERE id = $2', [hashed, req.user.id]);
    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (err) {
    console.error('[cambiar-password]', err.message);
    res.status(500).json({ message: 'Error al cambiar contraseña', error: err.message });
  }
});

module.exports = router;
