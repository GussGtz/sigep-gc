const http    = require('http');
const path    = require('path');
const express = require('express');
const cors    = require('cors');
const jwt     = require('jsonwebtoken');
const { WebSocketServer } = require('ws');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app  = express();
const pool = require('./config/db.js');

// ═══════════════════════════════════════
// Web Push (PWA Push Notifications)
// ═══════════════════════════════════════
const webpush = require('web-push');
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    `mailto:${process.env.VAPID_EMAIL || 'admin@vitrex.com'}`,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

/**
 * Envía una push notification a todas las suscripciones activas de un usuario.
 * Limpia automáticamente suscripciones expiradas (HTTP 410).
 * @param {number} userId
 * @param {{ title: string, body: string, url?: string }} payload
 */
async function sendPushToUser(userId, payload) {
  if (!process.env.VAPID_PUBLIC_KEY) return; // push no configurado
  try {
    const { rows } = await pool.query(
      'SELECT endpoint, subscription FROM push_subscriptions WHERE user_id = $1',
      [userId]
    );
    for (const row of rows) {
      webpush.sendNotification(row.subscription, JSON.stringify(payload)).catch(async (err) => {
        if (err.statusCode === 410 || err.statusCode === 404) {
          // Suscripción expirada — eliminar
          await pool.query('DELETE FROM push_subscriptions WHERE endpoint = $1', [row.endpoint]);
        }
      });
    }
  } catch (err) {
    console.error('[push] sendPushToUser:', err.message);
  }
}
// Exponer globalmente para que los controllers puedan usarlo
global.sendPushToUser = sendPushToUser;

// ═══════════════════════════════════════
// Middlewares globales
// ═══════════════════════════════════════
app.use(cors());
app.use(express.json({ limit: '10mb' })); // limite ampliado para fotos base64

// ═══════════════════════════════════════
// Registro de clientes WebSocket
// Estructura: Map<userId, Set<WebSocket>>
// ═══════════════════════════════════════
const clients = new Map();

function sendToUser(userId, data) {
  const sockets = clients.get(userId);
  if (!sockets) return;
  const payload = JSON.stringify(data);
  for (const ws of sockets) {
    if (ws.readyState === 1) ws.send(payload);
  }
}

function broadcastToAdmins(data) {
  const payload = JSON.stringify(data);
  for (const [, sockets] of clients) {
    for (const ws of sockets) {
      if (ws._roleId === 1 && ws.readyState === 1) ws.send(payload);
    }
  }
}

// ═══════════════════════════════════════
// Auto-crear tablas nuevas al arrancar
// ═══════════════════════════════════════
async function initDB() {
  try {
    // Tabla de comentarios (chat multi-mensaje por pedido)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS comentarios (
        id              SERIAL PRIMARY KEY,
        pedido_id       INTEGER NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
        area            VARCHAR(50)  NOT NULL DEFAULT 'admin',
        usuario_id      INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
        usuario_nombre  VARCHAR(200) NOT NULL DEFAULT 'Sistema',
        usuario_rol     INTEGER      DEFAULT 2,
        mensaje         TEXT         NOT NULL,
        created_at      TIMESTAMP    DEFAULT NOW()
      )
    `);

    // Tabla de notificaciones (persistentes, cross-user)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notificaciones (
        id                SERIAL PRIMARY KEY,
        tipo              VARCHAR(50)  NOT NULL,
        mensaje           TEXT         NOT NULL,
        pedido_id         INTEGER REFERENCES pedidos(id) ON DELETE CASCADE,
        pedido_numero     VARCHAR(100),
        creado_por        INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
        creado_por_nombre VARCHAR(200),
        para_roles        INTEGER[]    DEFAULT '{1,2,3}',
        leidas_por        INTEGER[]    DEFAULT '{}',
        created_at        TIMESTAMP    DEFAULT NOW()
      )
    `);

    // ── Nuevas columnas en pedidos (idempotente) ──
    const alteraciones = [
      `ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS alto              DECIMAL(10,2) DEFAULT NULL`,
      `ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS ancho             DECIMAL(10,2) DEFAULT NULL`,
      `ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS cantidad          INTEGER       DEFAULT 1`,
      `ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS metros_cuadrados  DECIMAL(10,4) DEFAULT NULL`,
      `ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS prioridad         VARCHAR(20)   DEFAULT 'normal'`,
      `ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS especificaciones  TEXT          DEFAULT NULL`,
      `ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS cliente_nombre    VARCHAR(200)  DEFAULT NULL`,
      `ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS direccion_entrega TEXT          DEFAULT NULL`,
      `ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS merma_m2          DECIMAL(10,4) DEFAULT NULL`,
      `ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS merma_descripcion TEXT          DEFAULT NULL`,
      // Foto de entrega (puede ser grande, base64 JPEG comprimido ~150KB)
      `ALTER TABLE entregas ADD COLUMN IF NOT EXISTS foto_base64 TEXT DEFAULT NULL`,
      // Turno activo del conductor (persiste entre sesiones)
      `ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS en_turno BOOLEAN DEFAULT false`,
    ];
    for (const sql of alteraciones) {
      await pool.query(sql);
    }

    // ── Inventario de vidrio ──
    await pool.query(`
      CREATE TABLE IF NOT EXISTS inventario_vidrio (
        id              SERIAL PRIMARY KEY,
        tipo            VARCHAR(100) NOT NULL,
        color           VARCHAR(50)  DEFAULT 'Incoloro',
        espesor_mm      DECIMAL(5,2) NOT NULL,
        stock_m2        DECIMAL(10,4) DEFAULT 0,
        stock_minimo_m2 DECIMAL(10,4) DEFAULT 5,
        precio_m2       DECIMAL(10,2) DEFAULT NULL,
        updated_at      TIMESTAMP DEFAULT NOW()
      )
    `);

    // ── Historial de movimientos de inventario ──
    await pool.query(`
      CREATE TABLE IF NOT EXISTS movimientos_inventario (
        id                SERIAL PRIMARY KEY,
        inventario_id     INTEGER REFERENCES inventario_vidrio(id) ON DELETE CASCADE,
        tipo              VARCHAR(20) NOT NULL,
        m2                DECIMAL(10,4) NOT NULL,
        descripcion       TEXT,
        creado_por        INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
        creado_por_nombre VARCHAR(200),
        created_at        TIMESTAMP DEFAULT NOW()
      )
    `);

    // ── Chat 1-a-1 ──
    await pool.query(`
      CREATE TABLE IF NOT EXISTS mensajes_directos (
        id              SERIAL PRIMARY KEY,
        de_usuario_id   INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        para_usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        mensaje         TEXT    NOT NULL,
        leido           BOOLEAN DEFAULT FALSE,
        created_at      TIMESTAMP DEFAULT NOW()
      )
    `);

    // ── GPS - posición actual por conductor (UPSERT) ──
    await pool.query(`
      CREATE TABLE IF NOT EXISTS conductor_ubicaciones (
        conductor_id  INTEGER PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
        lat           DOUBLE PRECISION NOT NULL,
        lng           DOUBLE PRECISION NOT NULL,
        pedido_id     INTEGER REFERENCES pedidos(id) ON DELETE SET NULL,
        updated_at    TIMESTAMP DEFAULT NOW()
      )
    `);

    // ── Push Notifications — suscripciones de usuarios (PWA) ──
    await pool.query(`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id           SERIAL PRIMARY KEY,
        user_id      INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        endpoint     TEXT NOT NULL UNIQUE,
        subscription JSONB NOT NULL,
        created_at   TIMESTAMP DEFAULT NOW()
      )
    `);

    console.log('✅ Tablas verificadas / creadas correctamente');
  } catch (err) {
    console.error('⚠️  Error al inicializar tablas:', err.message);
  }
}

initDB();

// ═══════════════════════════════════════
// GPS Heartbeat Monitor
// Cada 3 min, detecta conductores en turno sin señal GPS
// y les envía un push para que abran la app.
// ═══════════════════════════════════════
setInterval(async () => {
  if (!process.env.VAPID_PUBLIC_KEY || !global.sendPushToUser) return;
  try {
    // Conductores activos en turno cuya última posición tiene más de 3 minutos
    // (o no tienen posición registrada)
    const { rows } = await pool.query(`
      SELECT u.id
      FROM usuarios u
      LEFT JOIN conductor_ubicaciones cu ON cu.conductor_id = u.id
      WHERE u.role_id = 3
        AND u.en_turno  = true
        AND u.activo    = true
        AND (cu.updated_at IS NULL OR cu.updated_at < NOW() - INTERVAL '3 minutes')
    `);
    for (const row of rows) {
      global.sendPushToUser(row.id, {
        title:  'VITREX — GPS inactivo',
        body:   'Abre la app para continuar el seguimiento de tu ruta.',
        url:    '/conductor',
        tag:    'gps-reminder'
      });
    }
    if (rows.length) {
      console.log(`[GPS heartbeat] Push enviado a ${rows.length} conductor(es) sin señal`);
    }
  } catch (err) {
    console.error('[GPS heartbeat]', err.message);
  }
}, 3 * 60 * 1000); // cada 3 minutos

// ═══════════════════════════════════════
// Health check (Render lo usa en /api/health)
// ═══════════════════════════════════════
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

// Ruta raíz solo en desarrollo (en prod la SPA la ocupa)
if (process.env.NODE_ENV !== 'production') {
  app.get('/', (_req, res) => {
    res.json({
      success: true,
      message: '✅ Backend SIGEP-GC activo y funcionando 🚀',
      version: '2.0.0'
    });
  });
}

// ═══════════════════════════════════════
// Rutas principales
// ═══════════════════════════════════════
app.use('/api/auth',           require('./routes/auth'));
app.use('/api/pedidos',        require('./routes/pedidos'));
app.use('/api/comentarios',    require('./routes/comentarios'));
app.use('/api/notificaciones', require('./routes/notificaciones'));
app.use('/api/entregas',       require('./routes/entregas'));
app.use('/api/usuarios',       require('./routes/usuarios'));
app.use('/api/inventario',     require('./routes/inventario'));
app.use('/api/chat',           require('./routes/chat'));
app.use('/api/gps',            require('./routes/gps'));
app.use('/api/push',           require('./routes/push'));

// ═══════════════════════════════════════
// Frontend estático (solo en producción)
// El build de Vue queda en vue-app/dist/
// ═══════════════════════════════════════
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '..', 'vue-app', 'dist');
  app.use(express.static(distPath));
  // SPA fallback — Express 5 no acepta '*', usar app.use() sin path
  app.use((req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// ═══════════════════════════════════════
// Servidor HTTP + WebSocket
// ═══════════════════════════════════════
const server = http.createServer(app);

const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws, req) => {
  // Autenticar via token en query string: ws://host/ws?token=JWT
  let user;
  try {
    const url   = new URL(req.url, `http://${req.headers.host}`);
    const token = url.searchParams.get('token');
    if (!token) throw new Error('No token');
    user = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    ws.close(1008, 'Token inválido');
    return;
  }

  // Guardar metadata en el socket
  ws._userId  = user.id;
  ws._roleId  = user.role_id;
  ws._nombre  = user.nombre;

  // Registrar cliente
  if (!clients.has(user.id)) clients.set(user.id, new Set());
  clients.get(user.id).add(ws);

  console.log(`[WS] Conectado: ${user.nombre} (id=${user.id}, role=${user.role_id})`);

  ws.on('message', async (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    // ── location_update: conductor comparte posición ──
    if (msg.type === 'location_update') {
      if (user.role_id !== 3) return; // Solo conductores
      const { lat, lng, pedido_id } = msg;
      if (typeof lat !== 'number' || typeof lng !== 'number') return;

      try {
        await pool.query(
          `INSERT INTO conductor_ubicaciones (conductor_id, lat, lng, pedido_id, updated_at)
           VALUES ($1, $2, $3, $4, NOW())
           ON CONFLICT (conductor_id)
           DO UPDATE SET lat=$2, lng=$3, pedido_id=$4, updated_at=NOW()`,
          [user.id, lat, lng, pedido_id || null]
        );

        // Enviar a todos los admins conectados
        broadcastToAdmins({
          type:        'location_update',
          conductorId: user.id,
          nombre:      user.nombre,
          lat,
          lng,
          pedido_id:   pedido_id || null,
          updated_at:  new Date().toISOString()
        });
      } catch (err) {
        console.error('[WS GPS]', err.message);
      }
      return;
    }

    // ── chat_message: mensaje directo entre usuarios ──
    if (msg.type === 'chat_message') {
      const { para_usuario_id, mensaje } = msg;
      if (!para_usuario_id || !mensaje?.trim()) return;

      try {
        const result = await pool.query(
          `INSERT INTO mensajes_directos (de_usuario_id, para_usuario_id, mensaje)
           VALUES ($1, $2, $3)
           RETURNING id, created_at`,
          [user.id, para_usuario_id, mensaje.trim()]
        );
        const row = result.rows[0];

        // Confirmar al emisor con el ID de BD
        if (ws.readyState === 1) {
          ws.send(JSON.stringify({
            type:           'chat_sent',
            id:             row.id,
            de_usuario_id:  user.id,
            para_usuario_id,
            mensaje:        mensaje.trim(),
            created_at:     row.created_at
          }));
        }

        // Entregar al receptor si está conectado
        sendToUser(para_usuario_id, {
          type:            'chat_message',
          id:              row.id,
          de_usuario_id:   user.id,
          de_nombre:       user.nombre,
          de_role_id:      user.role_id,
          para_usuario_id,
          mensaje:         mensaje.trim(),
          created_at:      row.created_at
        });
      } catch (err) {
        console.error('[WS Chat]', err.message);
      }
      return;
    }
  });

  ws.on('close', () => {
    const set = clients.get(user.id);
    if (set) {
      set.delete(ws);
      if (set.size === 0) clients.delete(user.id);
    }
    console.log(`[WS] Desconectado: ${user.nombre}`);
  });

  ws.on('error', (err) => console.error(`[WS Error] ${user.nombre}:`, err.message));
});

// ═══════════════════════════════════════
// Puerto
// ═══════════════════════════════════════
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Servidor SIGEP-GC corriendo en puerto ${PORT}`);
  console.log(`📡 WebSocket activo en ws://localhost:${PORT}/ws`);
});
