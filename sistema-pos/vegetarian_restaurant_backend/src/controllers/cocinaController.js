const { pool } = require('../config/database');
const logger = require('../config/logger');

// Obtener todos los pedidos con estado 'pendiente' o 'en_preparacion'
exports.getPedidosPendientes = async (req, res, next) => {
  try {
    const id_sucursal = req.user.id_sucursal;

    const query = `
      SELECT 
        dv.id_detalle,
        dv.id_venta,
        p.nombre as producto_nombre,
        dv.cantidad,
        dv.observaciones,
        dv.estado_preparacion,
        m.nombre as mesa_nombre,
        v.fecha_creacion
      FROM detalle_ventas dv
      JOIN productos p ON dv.id_producto = p.id_producto
      JOIN ventas v ON dv.id_venta = v.id_venta
      JOIN mesas m ON v.id_mesa = m.id_mesa
      WHERE v.id_sucursal = $1
        AND dv.estado_preparacion IN ('pendiente', 'en_preparacion')
        AND v.estado = 'abierta'
      ORDER BY v.fecha_creacion ASC, dv.id_detalle ASC;
    `;

    const { rows } = await pool.query(query, [id_sucursal]);

    res.status(200).json({ 
      message: 'Pedidos pendientes obtenidos exitosamente.',
      data: rows
    });

  } catch (error) {
    logger.error('Error al obtener pedidos pendientes:', error);
    next(error);
  }
};

// Actualizar el estado de un pedido (ej. de 'pendiente' a 'en_preparacion' o 'listo')
exports.actualizarEstadoPedido = async (req, res, next) => {
  try {
    const { id_detalle } = req.params;
    const { nuevo_estado } = req.body; // 'en_preparacion', 'listo'

    if (!['en_preparacion', 'listo'].includes(nuevo_estado)) {
      return res.status(400).json({ message: 'Estado no válido.' });
    }

    const query = `
      UPDATE detalle_ventas
      SET estado_preparacion = $1
      WHERE id_detalle = $2
      RETURNING *;
    `;

    const { rows } = await pool.query(query, [nuevo_estado, id_detalle]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Pedido no encontrado.' });
    }

    // Aquí podrías emitir un evento de socket.io para notificar al frontend (mesero)

    res.status(200).json({ 
      message: `Pedido actualizado a ${nuevo_estado} exitosamente.`,
      data: rows[0]
    });

  } catch (error) {
    logger.error('Error al actualizar estado del pedido:', error);
    next(error);
  }
};
