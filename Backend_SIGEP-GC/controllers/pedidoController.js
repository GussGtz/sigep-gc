const pool = require('../config/db');

/* ─────────────────────────────────────────────
   Helper interno: crear notificación en la BD
───────────────────────────────────────────── */
async function crearNotificacion({ tipo, mensaje, pedidoId, pedidoNumero, creadoPor, creadoPorNombre, paraRoles = [1, 2, 3] }) {
  try {
    await pool.query(
      `INSERT INTO notificaciones (tipo, mensaje, pedido_id, pedido_numero, creado_por, creado_por_nombre, para_roles)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [tipo, mensaje, pedidoId || null, pedidoNumero || null, creadoPor || null, creadoPorNombre || null, paraRoles]
    );

    // ── Push notification a TODOS los usuarios activos (app cerrada / background) ──
    if (global.sendPushToUser) {
      const { rows: usuarios } = await pool.query(
        'SELECT id, role_id FROM usuarios WHERE activo = true'
      );
      for (const u of usuarios) {
        // Los conductores van a /conductor; admins/colaboradores a /admin/pedidos
        const url = u.role_id === 3 ? '/conductor' : (pedidoId ? '/admin/pedidos' : '/');
        global.sendPushToUser(u.id, {
          title: 'VITREX SIGEP',
          body:  mensaje,
          url
        });
      }
    }
  } catch (err) {
    console.error('[NOTIF] Error al crear notificación:', err.message);
  }
}

/* ─────────────────────────────────────────────
   POST /api/pedidos
───────────────────────────────────────────── */
const crearPedido = async (req, res) => {
  const {
    numero_pedido,
    fecha_entrega,
    alto,
    ancho,
    cantidad      = 1,
    prioridad     = 'normal',
    especificaciones,
    cliente_nombre,
    direccion_entrega,
    inventario_id: _inventarioId
  } = req.body;

  const userId   = req.user.id;
  const userName = req.user.nombre || 'Sistema';

  if (!numero_pedido || !fecha_entrega) {
    return res.status(400).json({ message: 'numero_pedido y fecha_entrega son obligatorios' });
  }

  // Calcular m² si se proporcionaron medidas (alto × ancho en metros × cantidad)
  const metros_cuadrados = (alto && ancho)
    ? parseFloat((parseFloat(alto) * parseFloat(ancho) * parseInt(cantidad || 1)).toFixed(4))
    : null;

  const prioridadValida = ['normal', 'urgente'].includes((prioridad || 'normal').toLowerCase())
    ? (prioridad || 'normal').toLowerCase()
    : 'normal';

  const inventarioId = _inventarioId ? parseInt(_inventarioId) : null;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check duplicate
    const existe = await client.query(
      'SELECT 1 FROM pedidos WHERE numero_pedido = $1',
      [numero_pedido]
    );
    if (existe.rows.length > 0) {
      await client.query('ROLLBACK');
      client.release();
      return res.status(400).json({ message: 'Ese número de pedido ya existe' });
    }

    // Verificar stock suficiente antes de crear el pedido
    if (inventarioId && metros_cuadrados > 0) {
      const matRow = await client.query(
        'SELECT stock_m2, tipo, color FROM inventario_vidrio WHERE id = $1',
        [inventarioId]
      );
      if (!matRow.rows.length) {
        await client.query('ROLLBACK');
        client.release();
        return res.status(404).json({ message: 'Material de inventario no encontrado' });
      }
      const stockActual = parseFloat(matRow.rows[0].stock_m2);
      if (stockActual < metros_cuadrados) {
        await client.query('ROLLBACK');
        client.release();
        return res.status(400).json({
          message: `Stock insuficiente: disponible ${stockActual.toFixed(4)} m², requerido ${metros_cuadrados.toFixed(4)} m²`
        });
      }
    }

    // Insertar pedido (con inventario_id si aplica)
    const pedido = await client.query(
      `INSERT INTO pedidos
         (numero_pedido, fecha_entrega, creado_por,
          alto, ancho, cantidad, metros_cuadrados, prioridad,
          especificaciones, cliente_nombre, direccion_entrega, inventario_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING id`,
      [
        numero_pedido, fecha_entrega, userId,
        alto || null, ancho || null, parseInt(cantidad || 1), metros_cuadrados,
        prioridadValida,
        especificaciones || null, cliente_nombre || null, direccion_entrega || null,
        inventarioId
      ]
    );

    const pedidoId = pedido.rows[0].id;
    const areas = ['contabilidad', 'ventas', 'produccion'];

    for (const area of areas) {
      await client.query(
        'INSERT INTO pedido_estatus (pedido_id, area) VALUES ($1, $2)',
        [pedidoId, area]
      );
    }

    // Descontar stock del inventario si hay material vinculado
    if (inventarioId && metros_cuadrados > 0) {
      await client.query(
        `UPDATE inventario_vidrio SET stock_m2 = stock_m2 - $1, updated_at = NOW() WHERE id = $2`,
        [metros_cuadrados, inventarioId]
      );
      await client.query(
        `INSERT INTO movimientos_inventario (inventario_id, tipo, m2, descripcion, creado_por, creado_por_nombre)
         VALUES ($1, 'uso', $2, $3, $4, $5)`,
        [inventarioId, metros_cuadrados, `Pedido #${numero_pedido}`, userId, userName]
      );
    }

    await client.query('COMMIT');
    client.release();

    // Notificación (fuera de la transacción)
    let mensajeNotif = `Nuevo pedido #${numero_pedido} creado por ${userName}`;
    if (prioridadValida === 'urgente') mensajeNotif += ' 🔴 URGENTE';

    await crearNotificacion({
      tipo: 'pedido_creado',
      mensaje: mensajeNotif,
      pedidoId,
      pedidoNumero: numero_pedido,
      creadoPor: userId,
      creadoPorNombre: userName,
      paraRoles: [1, 2, 3]
    });

    if (global.broadcastToAll) global.broadcastToAll({ type: 'data_pedidos' });
    // Si se descontó stock, notificar también al inventario
    if (inventarioId && metros_cuadrados > 0 && global.broadcastToAdmins) {
      global.broadcastToAdmins({ type: 'data_inventario' });
    }
    res.status(201).json({ message: 'Pedido creado correctamente', pedidoId });
  } catch (err) {
    await client.query('ROLLBACK');
    client.release();
    console.error('[ERROR crearPedido]', err.message);
    res.status(500).json({ message: 'Error al crear el pedido', error: err.message });
  }
};

/* ─────────────────────────────────────────────
   GET /api/pedidos
   Retorna `areas` como array + campos nuevos + flag `retrasado`
───────────────────────────────────────────── */
const obtenerPedidos = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        p.id,
        p.numero_pedido,
        p.alto,
        p.ancho,
        p.cantidad,
        p.metros_cuadrados,
        p.prioridad,
        p.especificaciones,
        p.cliente_nombre,
        p.direccion_entrega,
        p.merma_m2,
        p.merma_descripcion,
        p.inventario_id,
        iv.tipo        AS inventario_tipo,
        iv.color       AS inventario_color,
        iv.espesor_mm  AS inventario_espesor,
        CAST(iv.stock_m2 AS FLOAT) AS inventario_stock,
        TO_CHAR(p.fecha_entrega,  'YYYY-MM-DD')         AS fecha_entrega,
        TO_CHAR(p.fecha_creacion, 'YYYY-MM-DD HH24:MI') AS fecha_creacion,
        u.nombre                                         AS creado_por_nombre,
        e.area,
        e.estatus,
        e.comentarios,
        TO_CHAR(e.fecha_actualizacion, 'YYYY-MM-DD HH24:MI') AS fecha_actualizacion
      FROM pedidos p
      LEFT JOIN pedido_estatus e ON p.id = e.pedido_id
      LEFT JOIN usuarios u ON p.creado_por = u.id
      LEFT JOIN inventario_vidrio iv ON iv.id = p.inventario_id
      ORDER BY p.fecha_creacion DESC
    `);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const pedidosMap = new Map();

    for (const row of result.rows) {
      if (!pedidosMap.has(row.id)) {
        pedidosMap.set(row.id, {
          id:               row.id,
          numero_pedido:    row.numero_pedido,
          fecha_entrega:    row.fecha_entrega,
          fecha_creacion:   row.fecha_creacion,
          creado_por_nombre:row.creado_por_nombre || 'Sistema',
          alto:             row.alto   ? parseFloat(row.alto)   : null,
          ancho:            row.ancho  ? parseFloat(row.ancho)  : null,
          cantidad:         row.cantidad || 1,
          metros_cuadrados: row.metros_cuadrados ? parseFloat(row.metros_cuadrados) : null,
          prioridad:        row.prioridad || 'normal',
          especificaciones:  row.especificaciones  || null,
          cliente_nombre:    row.cliente_nombre    || null,
          direccion_entrega: row.direccion_entrega || null,
          merma_m2:           row.merma_m2 ? parseFloat(row.merma_m2) : null,
          merma_descripcion:  row.merma_descripcion || null,
          inventario_id:      row.inventario_id || null,
          inventario_tipo:    row.inventario_tipo || null,
          inventario_color:   row.inventario_color || null,
          inventario_espesor: row.inventario_espesor ? parseFloat(row.inventario_espesor) : null,
          inventario_stock:   row.inventario_stock != null ? parseFloat(row.inventario_stock) : null,
          areas:              [],
          _completados:     0,
          _total:           0
        });
      }

      const p = pedidosMap.get(row.id);
      if (row.area) {
        p._total += 1;
        if (row.estatus === 'completado') p._completados += 1;
        p.areas.push({
          area:               row.area,
          estatus:            row.estatus || 'pendiente',
          comentarios:        row.comentarios || '',
          fecha_actualizacion:row.fecha_actualizacion || null
        });
      }
    }

    // Filtro opcional por ?completado=true|false
    const filtroCompletado = req.query.completado;
    let pedidos = Array.from(pedidosMap.values()).map(({ _completados, _total, ...p }) => {
      const allComplete = _total > 0 && _completados === _total;
      const fechaEntregaDate = p.fecha_entrega ? new Date(p.fecha_entrega) : null;
      return {
        ...p,
        retrasado: fechaEntregaDate && fechaEntregaDate < today && !allComplete
      };
    });

    if (filtroCompletado === 'true')  pedidos = pedidos.filter(p => p.areas?.every(a => a.estatus === 'completado'));
    if (filtroCompletado === 'false') pedidos = pedidos.filter(p => !p.areas?.every(a => a.estatus === 'completado'));

    res.json(pedidos);
  } catch (err) {
    console.error('[ERROR obtenerPedidos]', err.message);
    res.status(500).json({ message: 'Error al obtener los pedidos', error: err.message });
  }
};

/* ─────────────────────────────────────────────
   GET /api/pedidos/resumen — Solo admin
   Datos para gráficas del dashboard
───────────────────────────────────────────── */
const obtenerResumen = async (req, res) => {
  try {
    // 1. Pedidos creados por día — últimos 7 días
    const diasRes = await pool.query(`
      SELECT DATE(fecha_creacion) AS dia, COUNT(*)::int AS total
      FROM pedidos
      WHERE fecha_creacion >= CURRENT_DATE - INTERVAL '6 days'
      GROUP BY DATE(fecha_creacion)
      ORDER BY dia
    `);

    // 2. Completados hoy (producción marcada como completado hoy)
    const hoyRes = await pool.query(`
      SELECT COUNT(DISTINCT pedido_id)::int AS total
      FROM pedido_estatus
      WHERE area = 'produccion'
        AND estatus = 'completado'
        AND DATE(fecha_actualizacion) = CURRENT_DATE
    `);

    // 3. Urgentes activos (no completados totalmente)
    const urgentesRes = await pool.query(`
      SELECT COUNT(*)::int AS total
      FROM pedidos p
      WHERE p.prioridad = 'urgente'
        AND EXISTS (
          SELECT 1 FROM pedido_estatus pe
          WHERE pe.pedido_id = p.id AND pe.estatus != 'completado'
        )
    `);

    // 4. Total atrasados (fecha_entrega < hoy, no todos completados)
    const atrasadosRes = await pool.query(`
      SELECT COUNT(*)::int AS total
      FROM pedidos p
      WHERE DATE(p.fecha_entrega) < CURRENT_DATE
        AND EXISTS (
          SELECT 1 FROM pedido_estatus pe
          WHERE pe.pedido_id = p.id AND pe.estatus != 'completado'
        )
    `);

    res.json({
      porDia:          diasRes.rows,
      entregadosHoy:   hoyRes.rows[0]?.total    || 0,
      urgentesActivos: urgentesRes.rows[0]?.total || 0,
      atrasadosTotal:  atrasadosRes.rows[0]?.total || 0,
    });
  } catch (err) {
    console.error('[ERROR obtenerResumen]', err.message);
    res.status(500).json({ message: 'Error al obtener resumen', error: err.message });
  }
};

/* ─────────────────────────────────────────────
   PUT /api/pedidos/estatus/:id
───────────────────────────────────────────── */
const actualizarEstatus = async (req, res) => {
  const pedidoId  = req.params.id;
  const { area, estatus, comentarios } = req.body;
  const userId    = req.user.id;
  const userName  = req.user.nombre || 'Sistema';

  if (!pedidoId || !area || !estatus) {
    return res.status(400).json({ message: 'Faltan campos requeridos' });
  }

  const areaValida    = ['ventas', 'contabilidad', 'produccion'].includes(area.toLowerCase());
  const estatusPorArea = {
    ventas:       ['pendiente', 'en proceso', 'completado'],
    contabilidad: ['pendiente', 'en proceso', 'completado'],
    produccion:   ['pendiente', 'en proceso', 'en corte', 'pulido', 'completado']
  };
  const estatusValido = (estatusPorArea[area.toLowerCase()] || []).includes(estatus.toLowerCase());

  if (!areaValida)    return res.status(400).json({ message: 'Área no permitida' });
  if (!estatusValido) return res.status(400).json({ message: 'Estatus no válido' });

  try {
    const pedidoRow = await pool.query('SELECT numero_pedido FROM pedidos WHERE id = $1', [pedidoId]);
    const numeroPedido = pedidoRow.rows[0]?.numero_pedido || pedidoId;

    const result = await pool.query(
      `UPDATE pedido_estatus
       SET estatus = $1, comentarios = $2, fecha_actualizacion = NOW()
       WHERE pedido_id = $3 AND area = $4`,
      [estatus.toLowerCase(), comentarios || '', pedidoId, area.toLowerCase()]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'No se encontró estatus para ese pedido y área' });
    }

    const areaLabels    = { ventas: 'Ventas', contabilidad: 'Contabilidad', produccion: 'Producción' };
    const estatusLabels = { pendiente: 'Pendiente', 'en proceso': 'En Proceso', completado: 'Completado' };

    let tipo    = 'status_change';
    let mensaje = `Pedido #${numeroPedido}: ${areaLabels[area]} → ${estatusLabels[estatus]} (por ${userName})`;

    if (estatus === 'completado' && area === 'produccion') {
      tipo    = 'listo_entrega';
      mensaje = `Pedido #${numeroPedido} listo para entrega — Producción completada por ${userName}`;
    }

    await crearNotificacion({
      tipo,
      mensaje,
      pedidoId: parseInt(pedidoId),
      pedidoNumero: numeroPedido,
      creadoPor: userId,
      creadoPorNombre: userName,
      paraRoles: [1, 2, 3]
    });

    if (global.broadcastToAll) global.broadcastToAll({ type: 'data_pedidos' });
    res.json({ message: `Estatus actualizado para ${area} correctamente.` });
  } catch (err) {
    console.error('[ERROR actualizarEstatus]', err.message);
    res.status(500).json({ message: 'Error del servidor al actualizar', error: err.message });
  }
};

/* ─────────────────────────────────────────────
   DELETE /api/pedidos/:id — Solo admins
───────────────────────────────────────────── */
const eliminarPedido = async (req, res) => {
  const pedidoId = req.params.id;

  try {
    await pool.query('DELETE FROM pedido_estatus   WHERE pedido_id = $1', [pedidoId]);
    await pool.query('DELETE FROM comentarios       WHERE pedido_id = $1', [pedidoId]);
    await pool.query('DELETE FROM notificaciones    WHERE pedido_id = $1', [pedidoId]);
    const result = await pool.query('DELETE FROM pedidos WHERE id = $1', [pedidoId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }

    if (global.broadcastToAll) global.broadcastToAll({ type: 'data_pedidos' });
    res.json({ message: 'Pedido eliminado correctamente' });
  } catch (err) {
    console.error('[ERROR eliminarPedido]', err.message);
    res.status(500).json({ message: 'Error al eliminar el pedido', error: err.message });
  }
};

/* ─────────────────────────────────────────────
   PUT /api/pedidos/:id/merma
───────────────────────────────────────────── */
const registrarMerma = async (req, res) => {
  const { id } = req.params;
  const { merma_m2, merma_descripcion } = req.body;

  if (merma_m2 === undefined || parseFloat(merma_m2) < 0) {
    return res.status(400).json({ message: 'merma_m2 debe ser un número >= 0' });
  }

  try {
    const result = await pool.query(
      `UPDATE pedidos SET merma_m2 = $1, merma_descripcion = $2 WHERE id = $3 RETURNING id`,
      [parseFloat(merma_m2), merma_descripcion || null, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }

    if (global.broadcastToAll) global.broadcastToAll({ type: 'data_pedidos' });
    res.json({ message: 'Merma registrada correctamente' });
  } catch (err) {
    console.error('[ERROR registrarMerma]', err.message);
    res.status(500).json({ message: 'Error al registrar merma', error: err.message });
  }
};

/* ─────────────────────────────────────────────
   DELETE /api/pedidos/completados — Solo admins
───────────────────────────────────────────── */
const eliminarPedidosCompletados = async (req, res) => {
  const client = await pool.connect();
  try {
    const completados = await client.query(`
      SELECT p.id
      FROM pedidos p
      JOIN pedido_estatus e ON p.id = e.pedido_id
      GROUP BY p.id
      HAVING COUNT(*) = SUM(CASE WHEN e.estatus = 'completado' THEN 1 ELSE 0 END)
    `);

    if (completados.rows.length === 0) {
      client.release();
      return res.json({ message: 'No hay pedidos completados para eliminar.' });
    }

    const ids = completados.rows.map(p => p.id);

    await client.query('BEGIN');
    await client.query('DELETE FROM comentarios       WHERE pedido_id = ANY($1)', [ids]);
    await client.query('DELETE FROM notificaciones    WHERE pedido_id = ANY($1)', [ids]);
    await client.query('DELETE FROM pedido_estatus    WHERE pedido_id = ANY($1)', [ids]);
    await client.query('DELETE FROM pedidos           WHERE id        = ANY($1)', [ids]);
    await client.query('COMMIT');

    client.release();
    if (global.broadcastToAll) global.broadcastToAll({ type: 'data_pedidos' });
    res.json({ message: `${ids.length} pedidos completados eliminados correctamente.` });
  } catch (err) {
    await client.query('ROLLBACK');
    client.release();
    console.error('[ERROR eliminarPedidosCompletados]', err.message);
    res.status(500).json({ message: 'Error al eliminar pedidos completados', error: err.message });
  }
};

module.exports = {
  crearPedido,
  obtenerPedidos,
  obtenerResumen,
  actualizarEstatus,
  eliminarPedido,
  eliminarPedidosCompletados,
  crearNotificacion,
  registrarMerma
};
