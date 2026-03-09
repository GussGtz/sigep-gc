const pool = require('../config/db');

/* ─────────────────────────────────────────────
   GET /api/notificaciones
   Retorna las últimas 60 notificaciones para el rol del usuario autenticado.
   Incluye campo `leida` para saber si el usuario ya la leyó.
───────────────────────────────────────────── */
const obtenerNotificaciones = async (req, res) => {
  const userId  = req.user.id;
  const roleId  = req.user.role_id;

  try {
    const result = await pool.query(
      `SELECT
         id,
         tipo,
         mensaje,
         pedido_id,
         pedido_numero,
         creado_por,
         creado_por_nombre,
         TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') AS created_at,
         ($1 = ANY(leidas_por)) AS leida
       FROM notificaciones
       WHERE $2 = ANY(para_roles)
       ORDER BY created_at DESC
       LIMIT 60`,
      [userId, roleId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('[ERROR obtenerNotificaciones]', err.message);
    res.status(500).json({ message: 'Error al obtener notificaciones', error: err.message });
  }
};

/* ─────────────────────────────────────────────
   PATCH /api/notificaciones/:id/leer
   Marca una notificación como leída para el usuario actual.
───────────────────────────────────────────── */
const marcarLeida = async (req, res) => {
  const { id } = req.params;
  const userId  = req.user.id;

  try {
    await pool.query(
      `UPDATE notificaciones
       SET leidas_por = array_remove(leidas_por, $1) || ARRAY[$1::integer]
       WHERE id = $2`,
      [userId, id]
    );

    res.json({ message: 'Notificación marcada como leída' });
  } catch (err) {
    console.error('[ERROR marcarLeida]', err.message);
    res.status(500).json({ message: 'Error al marcar notificación', error: err.message });
  }
};

/* ─────────────────────────────────────────────
   PATCH /api/notificaciones/leer-todas
   Marca todas las notificaciones del rol del usuario como leídas.
───────────────────────────────────────────── */
const marcarTodasLeidas = async (req, res) => {
  const userId = req.user.id;
  const roleId = req.user.role_id;

  try {
    await pool.query(
      `UPDATE notificaciones
       SET leidas_por = array_remove(leidas_por, $1) || ARRAY[$1::integer]
       WHERE $2 = ANY(para_roles)
         AND NOT ($1 = ANY(leidas_por))`,
      [userId, roleId]
    );

    res.json({ message: 'Todas las notificaciones marcadas como leídas' });
  } catch (err) {
    console.error('[ERROR marcarTodasLeidas]', err.message);
    res.status(500).json({ message: 'Error al marcar notificaciones', error: err.message });
  }
};

module.exports = {
  obtenerNotificaciones,
  marcarLeida,
  marcarTodasLeidas
};
