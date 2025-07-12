const Mesa = require('../models/mesaModel');
const db = require('../config/database');
const logger = require('../config/logger'); // Importar el logger

// Obtener todas las mesas de una sucursal
exports.getMesas = async (req, res, next) => {
  try {
    const { id_sucursal } = req.params;
    
    if (!id_sucursal) {
      logger.warn('ID de sucursal es requerido para obtener mesas.');
      return res.status(400).json({ message: 'ID de sucursal es requerido.' });
    }

    const mesas = await Mesa.getMesasBySucursal(id_sucursal);
    logger.info(`Mesas obtenidas exitosamente para sucursal ${id_sucursal}.`);
    res.status(200).json({
      message: 'Mesas obtenidas exitosamente.',
      data: mesas
    });
  } catch (error) {
    logger.error('Error al obtener mesas:', error);
    next(error);
  }
};

// Obtener una mesa específica
exports.getMesa = async (req, res, next) => {
  try {
    const { numero, id_sucursal } = req.params;
    
    if (!numero || !id_sucursal) {
      logger.warn('Número de mesa y ID de sucursal son requeridos para obtener una mesa específica.');
      return res.status(400).json({ message: 'Número de mesa y ID de sucursal son requeridos.' });
    }

    const mesa = await Mesa.getMesaByNumero(numero, id_sucursal);
    
    if (!mesa) {
      logger.warn(`Mesa ${numero} no encontrada en sucursal ${id_sucursal}.`);
      return res.status(404).json({ message: 'Mesa no encontrada.' });
    }

    logger.info(`Mesa ${numero} obtenida exitosamente de sucursal ${id_sucursal}.`);
    res.status(200).json({
      message: 'Mesa obtenida exitosamente.',
      data: mesa
    });
  } catch (error) {
    logger.error('Error al obtener mesa:', error);
    next(error);
  }
};

// Abrir mesa (iniciar servicio)
exports.abrirMesa = async (req, res, next) => {
  try {
    const { numero, id_sucursal } = req.body;
    const id_vendedor = req.user.id; // Del token JWT

    if (!numero || !id_sucursal) {
      logger.warn('Número de mesa y ID de sucursal son requeridos para abrir mesa.');
      return res.status(400).json({ message: 'Número de mesa y ID de sucursal son requeridos.' });
    }

    // Verificar si la mesa está disponible
    const mesaDisponible = await Mesa.mesaDisponible(numero, id_sucursal);
    if (!mesaDisponible) {
      logger.warn(`Mesa ${numero} no encontrada para abrir.`);
      return res.status(404).json({ message: 'Mesa no encontrada.' });
    }

    if (mesaDisponible.estado !== 'libre') {
      logger.warn(`Intento de abrir mesa ${numero} que no está libre. Estado actual: ${mesaDisponible.estado}`);
      return res.status(400).json({ 
        message: `La mesa ${numero} no está disponible. Estado actual: ${mesaDisponible.estado}` 
      });
    }

    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      
      // Abrir la mesa
      const mesaAbierta = await Mesa.abrirMesa(numero, id_sucursal, id_vendedor, client);
      
      // Crear prefactura
      const prefactura = await Mesa.crearPrefactura(mesaAbierta.id_mesa, null, client);
      
      await client.query('COMMIT');
      logger.info(`Mesa ${numero} abierta exitosamente por vendedor ${id_vendedor}.`);
      res.status(200).json({
        message: `Mesa ${numero} abierta exitosamente.`,
        data: {
          mesa: mesaAbierta,
          prefactura: prefactura
        }
      });
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error en transacción al abrir mesa:', error);
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error('Error al abrir mesa:', error);
    next(error);
  }
};

// Cerrar mesa (finalizar servicio)
exports.cerrarMesa = async (req, res, next) => {
  try {
    const { id_mesa } = req.params;

    if (!id_mesa) {
      logger.warn('ID de mesa es requerido para cerrar mesa.');
      return res.status(400).json({ message: 'ID de mesa es requerido.' });
    }

    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      
      // Cerrar la mesa
      const mesaCerrada = await Mesa.cerrarMesa(id_mesa, client);
      
      // Cerrar prefactura si existe
      const prefactura = await Mesa.getPrefacturaByMesa(id_mesa);
      if (prefactura) {
        await Mesa.cerrarPrefactura(prefactura.id_prefactura, mesaCerrada.total_acumulado, client);
      }
      
      await client.query('COMMIT');
      logger.info(`Mesa ${id_mesa} cerrada exitosamente.`);
      res.status(200).json({
        message: `Mesa cerrada exitosamente.`,
        data: {
          mesa: mesaCerrada,
          total_final: mesaCerrada.total_acumulado
        }
      });
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error en transacción al cerrar mesa:', error);
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error('Error al cerrar mesa:', error);
    next(error);
  }
};

// Liberar mesa (marcar como libre sin facturar)
exports.liberarMesa = async (req, res, next) => {
  try {
    const { id_mesa } = req.params;

    if (!id_mesa) {
      logger.warn('ID de mesa es requerido para liberar mesa.');
      return res.status(400).json({ message: 'ID de mesa es requerido.' });
    }

    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      
      // Obtener la mesa actual
      const mesa = await Mesa.getMesaById(id_mesa);
      if (!mesa) {
        logger.warn(`Mesa ${id_mesa} no encontrada para liberar.`);
        return res.status(404).json({ message: 'Mesa no encontrada.' });
      }

      if (mesa.estado === 'libre') {
        logger.warn(`Mesa ${id_mesa} ya está libre.`);
        return res.status(400).json({ message: 'La mesa ya está libre.' });
      }

      // Liberar la mesa (marcar como libre sin facturar)
      const mesaLiberada = await Mesa.liberarMesa(id_mesa, client);
      
      // Cerrar prefactura si existe (sin facturar)
      const prefactura = await Mesa.getPrefacturaByMesa(id_mesa);
      if (prefactura) {
        await Mesa.cerrarPrefactura(prefactura.id_prefactura, 0, client); // Total 0 porque no se factura
      }
      
      await client.query('COMMIT');
      logger.info(`Mesa ${id_mesa} liberada exitosamente.`);
      res.status(200).json({
        message: `Mesa liberada exitosamente.`,
        data: {
          mesa: mesaLiberada
        }
      });
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error en transacción al liberar mesa:', error);
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error('Error al liberar mesa:', error);
    next(error);
  }
};

// Agregar productos a mesa existente
exports.agregarProductosAMesa = async (req, res, next) => {
  try {
    const { numero, id_sucursal, items, total } = req.body;
    const id_vendedor = req.user.id;

    if (!numero || !id_sucursal || !items || items.length === 0) {
      logger.warn('Número de mesa, sucursal y productos son requeridos para agregar productos a mesa.');
      return res.status(400).json({ message: 'Número de mesa, sucursal y productos son requeridos.' });
    }

    // Verificar si la mesa está en uso
    const mesa = await Mesa.getMesaByNumero(numero, id_sucursal);
    if (!mesa) {
      logger.warn(`Mesa ${numero} no encontrada para agregar productos.`);
      return res.status(404).json({ message: 'Mesa no encontrada.' });
    }

    if (mesa.estado !== 'en_uso') {
      logger.warn(`Intento de agregar productos a mesa ${numero} que no está en uso. Estado actual: ${mesa.estado}`);
      return res.status(400).json({ 
        message: `La mesa ${numero} no está en uso. Estado actual: ${mesa.estado}` 
      });
    }

    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      // Crear nueva venta para los productos adicionales
      const Venta = require('./ventaModel');
      const venta = await Venta.createVenta({
        id_vendedor: id_vendedor,
        id_pago: null, // Se pagará al final
        id_sucursal: id_sucursal,
        tipo_servicio: 'Mesa',
        total: total,
        mesa_numero: numero
      }, client);

      // Crear detalles de venta
      const detalles = await Venta.createDetalleVenta(
        venta.id_venta,
        items.map(item => ({
          id_producto: item.id_producto,
          cantidad: item.cantidad,
          precio_unitario: item.precio_unitario,
          observaciones: item.observaciones || null
        })),
        client
      );

      // Actualizar total acumulado de la mesa
      const nuevoTotal = mesa.total_acumulado + total;
      await Mesa.actualizarTotalAcumulado(mesa.id_mesa, nuevoTotal, client);

      await client.query('COMMIT');
      logger.info(`Productos agregados a la mesa ${numero} exitosamente. Total acumulado: ${nuevoTotal}`);
      res.status(200).json({
        message: `Productos agregados a la mesa ${numero} exitosamente.`,
        data: {
          venta: venta,
          detalles: detalles,
          total_acumulado: nuevoTotal
        }
      });
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error en transacción al agregar productos a mesa:', error);
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error('Error al agregar productos a mesa:', error);
    next(error);
  }
};

// Generar prefactura de mesa
exports.generarPrefactura = async (req, res, next) => {
  try {
    const { id_mesa } = req.params;

    if (!id_mesa) {
      logger.warn('ID de mesa es requerido para generar prefactura.');
      return res.status(400).json({ message: 'ID de mesa es requerido.' });
    }

    // Obtener mesa
    const mesaResult = await db.query('SELECT * FROM mesas WHERE id_mesa = $1', [id_mesa]);
    if (mesaResult.rows.length === 0) {
      logger.warn(`Mesa con ID ${id_mesa} no encontrada para generar prefactura.`);
      return res.status(404).json({ message: 'Mesa no encontrada.' });
    }
    const mesa = mesaResult.rows[0];

    // Calcular total acumulado solo para la sesión actual (ventas desde hora_apertura)
    const totalQuery = `
      SELECT COALESCE(SUM(dv.subtotal), 0) as total_acumulado
      FROM ventas v
      JOIN detalle_ventas dv ON dv.id_venta = v.id_venta
      WHERE v.mesa_numero = $1 
        AND v.id_sucursal = $2
        AND v.fecha >= $3
        AND v.estado IN ('abierta', 'en_uso', 'pendiente_cobro', 'entregado')
    `;
    const totalResult = await db.query(totalQuery, [mesa.numero, mesa.id_sucursal, mesa.hora_apertura]);
    const totalAcumulado = parseFloat(totalResult.rows[0].total_acumulado) || 0;

    // Actualizar el total acumulado en la mesa
    await db.query('UPDATE mesas SET total_acumulado = $1 WHERE id_mesa = $2', [totalAcumulado, id_mesa]);

    // Obtener historial solo de la sesión actual
    const historialQuery = `
      SELECT 
        v.id_venta,
        v.fecha,
        v.total,
        v.estado,
        v.tipo_servicio,
        dv.cantidad,
        dv.precio_unitario,
        dv.subtotal,
        dv.observaciones,
        p.nombre as nombre_producto,
        vend.nombre as nombre_vendedor
      FROM ventas v
      JOIN detalle_ventas dv ON v.id_venta = dv.id_venta
      JOIN productos p ON dv.id_producto = p.id_producto
      JOIN vendedores vend ON v.id_vendedor = vend.id_vendedor
      WHERE v.mesa_numero = $1
        AND v.id_sucursal = $2
        AND v.fecha >= $3
      ORDER BY v.fecha DESC
    `;
    const historialResult = await db.query(historialQuery, [mesa.numero, mesa.id_sucursal, mesa.hora_apertura]);

    logger.info(`Prefactura generada exitosamente para mesa ${id_mesa}. Total acumulado: ${totalAcumulado}`);
    res.status(200).json({
      message: 'Prefactura generada exitosamente.',
      data: {
        mesa: { ...mesa, total_acumulado: totalAcumulado },
        historial: historialResult.rows,
        total_acumulado: totalAcumulado
      }
    });
  } catch (error) {
    logger.error('Error al generar prefactura:', error);
    next(error);
  }
};

// Obtener estadísticas de mesas
exports.getEstadisticasMesas = async (req, res, next) => {
  try {
    const { id_sucursal } = req.params;

    if (!id_sucursal) {
      logger.warn('ID de sucursal es requerido para obtener estadísticas de mesas.');
      return res.status(400).json({ message: 'ID de sucursal es requerido.' });
    }

    const estadisticas = await Mesa.getEstadisticasMesas(id_sucursal);
    logger.info(`Estadísticas de mesas obtenidas exitosamente para sucursal ${id_sucursal}.`);
    res.status(200).json({
      message: 'Estadísticas obtenidas exitosamente.',
      data: estadisticas
    });
  } catch (error) {
    logger.error('Error al obtener estadísticas de mesas:', error);
    next(error);
  }
};

// Obtener historial de mesa
exports.getHistorialMesa = async (req, res, next) => {
  try {
    const { id_mesa } = req.params;
    const { fecha } = req.query;

    if (!id_mesa) {
      logger.warn('ID de mesa es requerido para obtener historial de mesa.');
      return res.status(400).json({ message: 'ID de mesa es requerido.' });
    }

    const historial = await Mesa.getHistorialVentasMesa(id_mesa, fecha);
    logger.info(`Historial de mesa ${id_mesa} obtenido exitosamente.`);
    res.status(200).json({
      message: 'Historial obtenido exitosamente.',
      data: historial
    });
  } catch (error) {
    logger.error('Error al obtener historial de mesa:', error);
    next(error);
  }
};

// ===================================
// 🔹 CONFIGURACIÓN DE MESAS
// ===================================

// Obtener configuración de mesas
exports.getConfiguracionMesas = async (req, res, next) => {
  try {
    const { id_sucursal } = req.params;
    
    if (!id_sucursal) {
      logger.warn('ID de sucursal es requerido para obtener configuración de mesas.');
      return res.status(400).json({ message: 'ID de sucursal es requerido.' });
    }

    const mesas = await Mesa.getConfiguracionMesas(id_sucursal);
    logger.info(`Configuración de mesas obtenida exitosamente para sucursal ${id_sucursal}.`);
    res.status(200).json({
      message: 'Configuración de mesas obtenida exitosamente.',
      data: mesas
    });
  } catch (error) {
    logger.error('Error al obtener configuración de mesas:', error);
    next(error);
  }
};

// Crear nueva mesa
exports.crearMesa = async (req, res, next) => {
  try {
    const { numero, id_sucursal, capacidad = 4, estado = 'libre' } = req.body;
    
    if (!numero || !id_sucursal) {
      logger.warn('Número de mesa y ID de sucursal son requeridos para crear mesa.');
      return res.status(400).json({ message: 'Número de mesa y ID de sucursal son requeridos.' });
    }

    // Verificar que el número de mesa no exista
    const numeroExiste = await Mesa.numeroMesaExiste(numero, id_sucursal);
    if (numeroExiste) {
      logger.warn(`El número de mesa ${numero} ya existe en la sucursal ${id_sucursal}.`);
      return res.status(400).json({ message: `El número de mesa ${numero} ya existe en esta sucursal.` });
    }

    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      
      const nuevaMesa = await Mesa.crearMesa({ numero, id_sucursal, capacidad, estado }, client);
      
      await client.query('COMMIT');
      logger.info(`Mesa ${numero} creada exitosamente en sucursal ${id_sucursal}.`);
      res.status(201).json({
        message: `Mesa ${numero} creada exitosamente.`,
        data: nuevaMesa
      });
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error en transacción al crear mesa:', error);
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error('Error al crear mesa:', error);
    next(error);
  }
};

// Actualizar mesa
exports.actualizarMesa = async (req, res, next) => {
  try {
    const { id_mesa } = req.params;
    const { numero, capacidad, estado } = req.body;
    
    if (!id_mesa) {
      logger.warn('ID de mesa es requerido para actualizar mesa.');
      return res.status(400).json({ message: 'ID de mesa es requerido.' });
    }

    // Verificar que el número de mesa no exista (excluyendo la mesa actual)
    if (numero) {
      const numeroExiste = await Mesa.numeroMesaExiste(numero, req.body.id_sucursal, id_mesa);
      if (numeroExiste) {
        logger.warn(`El número de mesa ${numero} ya existe en la sucursal ${req.body.id_sucursal} (excluyendo la mesa actual).`);
        return res.status(400).json({ message: `El número de mesa ${numero} ya existe en esta sucursal.` });
      }
    }

    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      
      const mesaActualizada = await Mesa.actualizarMesa(id_mesa, { numero, capacidad, estado }, client);
      
      await client.query('COMMIT');
      logger.info(`Mesa ${mesaActualizada.numero} actualizada exitosamente.`);
      res.status(200).json({
        message: `Mesa ${mesaActualizada.numero} actualizada exitosamente.`,
        data: mesaActualizada
      });
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error en transacción al actualizar mesa:', error);
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error('Error al actualizar mesa:', error);
    next(error);
  }
};

// Eliminar mesa
exports.eliminarMesa = async (req, res, next) => {
  try {
    const { id_mesa } = req.params;
    
    if (!id_mesa) {
      logger.warn('ID de mesa es requerido para eliminar mesa.');
      return res.status(400).json({ message: 'ID de mesa es requerido.' });
    }

    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      
      const mesaEliminada = await Mesa.eliminarMesa(id_mesa, client);
      
      await client.query('COMMIT');
      logger.info(`Mesa ${mesaEliminada.numero} eliminada exitosamente.`);
      res.status(200).json({
        message: `Mesa ${mesaEliminada.numero} eliminada exitosamente.`,
        data: mesaEliminada
      });
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error en transacción al eliminar mesa:', error);
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error('Error al eliminar mesa:', error);
    next(error);
  }
};