const pool = require('../config/db');
const { crearNotificacion } = require('./pedidoController');

/* ─────────────────────────────────────────────
   GET /api/comentarios/:pedidoId
   Retorna todos los mensajes del hilo de comentarios
───────────────────────────────────────────── */
const obtenerComentarios = async (req, res) => {
  const { pedidoId } = req.params;

  try {
    const result = await pool.query(
      `SELECT
         c.id,
         c.pedido_id,
         c.area,
         c.usuario_id,
         c.usuario_nombre,
         c.usuario_rol,
         c.mensaje,
         TO_CHAR(c.created_at, 'YYYY-MM-DD HH24:MI:SS') AS created_at
       FROM comentarios c
       WHERE c.pedido_id = $1
       ORDER BY c.created_at ASC`,
      [pedidoId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('[ERROR obtenerComentarios]', err.message);
    res.status(500).json({ message: 'Error al obtener comentarios', error: err.message });
  }
};

/* ─────────────────────────────────────────────
   POST /api/comentarios/:pedidoId
   Agrega un nuevo mensaje al hilo
───────────────────────────────────────────── */
const agregarComentario = async (req, res) => {
  const { pedidoId } = req.params;
  const { mensaje }  = req.body;
  const userId       = req.user.id;
  const userName     = req.user.nombre || 'Usuario';
  const userRol      = req.user.role_id;
  const userDept     = req.user.departamento;

  if (!mensaje || !mensaje.trim()) {
    return res.status(400).json({ message: 'El mensaje no puede estar vacío' });
  }

  // Determinar área del comentario según rol/departamento
  let area = 'admin';
  if (userRol === 2) {
    area = userDept || 'colaborador';
  } else if (userRol === 3) {
    area = 'conductor';
  }

  try {
    // Verificar que el pedido existe
    const pedidoRow = await pool.query('SELECT numero_pedido FROM pedidos WHERE id = $1', [pedidoId]);
    if (pedidoRow.rows.length === 0) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }
    const numeroPedido = pedidoRow.rows[0].numero_pedido;

    // Insertar comentario
    const result = await pool.query(
      `INSERT INTO comentarios (pedido_id, area, usuario_id, usuario_nombre, usuario_rol, mensaje)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, pedido_id, area, usuario_id, usuario_nombre, usuario_rol, mensaje,
                 TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') AS created_at`,
      [pedidoId, area, userId, userName, userRol, mensaje.trim()]
    );

    const nuevoComentario = result.rows[0];

    // Notificar a todos (menos a quien escribió, pero por simplicidad notificamos a todos)
    const areaLabels = {
      admin: 'Administrador',
      ventas: 'Ventas',
      contabilidad: 'Contabilidad',
      produccion: 'Producción',
      conductor: 'Conductor',
      colaborador: 'Colaborador'
    };

    await crearNotificacion({
      tipo: 'comment',
      mensaje: `Nuevo comentario de ${areaLabels[area] || area} en pedido #${numeroPedido}: "${mensaje.trim().slice(0, 60)}${mensaje.trim().length > 60 ? '...' : ''}"`,
      pedidoId: parseInt(pedidoId),
      pedidoNumero: numeroPedido,
      creadoPor: userId,
      creadoPorNombre: userName,
      paraRoles: [1, 2, 3]
    });

    res.status(201).json(nuevoComentario);
  } catch (err) {
    console.error('[ERROR agregarComentario]', err.message);
    res.status(500).json({ message: 'Error al agregar comentario', error: err.message });
  }
};

/* ─────────────────────────────────────────────
   DELETE /api/comentarios/:id  — Solo admin
   Elimina un comentario específico
───────────────────────────────────────────── */
const eliminarComentario = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM comentarios WHERE id = $1', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Comentario no encontrado' });
    }

    res.json({ message: 'Comentario eliminado' });
  } catch (err) {
    console.error('[ERROR eliminarComentario]', err.message);
    res.status(500).json({ message: 'Error al eliminar comentario', error: err.message });
  }
};

module.exports = {
  obtenerComentarios,
  agregarComentario,
  eliminarComentario
};
