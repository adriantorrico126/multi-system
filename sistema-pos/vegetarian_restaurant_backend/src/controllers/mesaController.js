const Mesa = require('../models/mesaModel');
const { pool } = require('../config/database');
const logger = require('../config/logger'); // Importar el logger
const Venta = require('../models/ventaModel'); // Moved from inside agregarProductosAMesa

// Obtener todas las mesas de una sucursal
exports.getMesas = async (req, res, next) => {
  try {
    const { id_sucursal } = req.params;
    const id_restaurante = req.user.id_restaurante; // Obtener id_restaurante del usuario autenticado

    if (!id_sucursal) {
      logger.warn('ID de sucursal es requerido para obtener mesas.');
      return res.status(400).json({ message: 'ID de sucursal es requerido.' });
    }

    const mesas = await Mesa.getMesasBySucursal(id_sucursal, id_restaurante);
    logger.info(`Mesas obtenidas exitosamente para sucursal ${id_sucursal} y restaurante ${id_restaurante}.`);
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
    const { id_mesa } = req.params;
    const id_restaurante = req.user.id_restaurante; // Obtener id_restaurante del usuario autenticado
    // Obtener id_sucursal de la mesa
    const mesa = await Mesa.getMesaById(id_mesa, null, id_restaurante); // Buscamos primero para obtener id_sucursal
    if (!mesa) {
      logger.warn(`Mesa con ID ${id_mesa} no encontrada en el restaurante ${id_restaurante}.`);
      return res.status(404).json({ message: 'Mesa no encontrada.' });
    }
    // Ahora sí, obtener la mesa con id_sucursal
    const mesaCompleta = await Mesa.getMesaById(id_mesa, mesa.id_sucursal, id_restaurante);
    logger.info(`Mesa con ID ${id_mesa} obtenida exitosamente de sucursal ${mesa.id_sucursal} y restaurante ${id_restaurante}.`);
    res.status(200).json({
      message: 'Mesa obtenida exitosamente.',
      data: mesaCompleta
    });
  } catch (error) {
    logger.error('Error al obtener mesa:', error);
    next(error);
  }
};

// Abrir mesa (iniciar servicio)
exports.abrirMesa = async (req, res, next) => {
  try {
    const { id_mesa } = req.body;
    const id_vendedor = req.user.id; // Del token JWT
    const id_restaurante = req.user.id_restaurante; // Obtener id_restaurante del usuario autenticado

    if (!id_mesa) {
      logger.warn('ID de mesa es requerido para abrir mesa.');
      return res.status(400).json({ message: 'ID de mesa es requerido.' });
    }

    // Verificar si la mesa está disponible
    const mesaDisponible = await Mesa.mesaDisponible(id_mesa, id_restaurante);
    if (!mesaDisponible) {
      logger.warn(`Mesa con ID ${id_mesa} no encontrada para abrir en el restaurante ${id_restaurante}.`);
      return res.status(404).json({ message: 'Mesa no encontrada.' });
    }

    if (mesaDisponible.estado !== 'libre') {
      logger.warn(`Intento de abrir mesa con ID ${id_mesa} que no está libre. Estado actual: ${mesaDisponible.estado}`);
      return res.status(400).json({ 
        message: `La mesa con ID ${id_mesa} no está disponible. Estado actual: ${mesaDisponible.estado}` 
      });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Abrir la mesa
      const mesaAbierta = await Mesa.abrirMesa(id_mesa, id_vendedor, id_restaurante, client);
      
      // Verificar si ya existe una prefactura abierta
      const prefacturaExistente = await Mesa.getPrefacturaByMesa(id_mesa, id_restaurante);
      let prefactura;
      
      if (prefacturaExistente) {
        // Usar la prefactura existente
        prefactura = prefacturaExistente;
        logger.info(`Usando prefactura existente para mesa ${id_mesa}`);
      } else {
        // Crear nueva prefactura
        prefactura = await Mesa.crearPrefactura(mesaAbierta.id_mesa, null, id_restaurante, client);
        logger.info(`Nueva prefactura creada para mesa ${id_mesa}`);
      }
      
      await client.query('COMMIT');
      logger.info(`Mesa con ID ${id_mesa} abierta exitosamente por vendedor ${id_vendedor} para el restaurante ${id_restaurante}.`);
      res.status(200).json({
        message: `Mesa con ID ${id_mesa} abierta exitosamente.`,
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
    const id_restaurante = req.user.id_restaurante; // Obtener id_restaurante del usuario autenticado

    if (!id_mesa) {
      logger.warn('ID de mesa es requerido para cerrar mesa.');
      return res.status(400).json({ message: 'ID de mesa es requerido.' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Cerrar la mesa
      const mesaCerrada = await Mesa.cerrarMesa(id_mesa, id_restaurante, client);
      
      // Cerrar prefactura si existe
      const prefactura = await Mesa.getPrefacturaByMesa(id_mesa, id_restaurante);
      if (prefactura) {
        await Mesa.cerrarPrefactura(prefactura.id_prefactura, mesaCerrada.total_acumulado, id_restaurante, client);
      }
      
      await client.query('COMMIT');
      logger.info(`Mesa con ID ${id_mesa} cerrada exitosamente para el restaurante ${id_restaurante}.`);
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
    const id_restaurante = req.user.id_restaurante; // Obtener id_restaurante del usuario autenticado
    // Buscar la mesa solo por id_mesa e id_restaurante para obtener id_sucursal
    let mesa = await Mesa.getMesaById(id_mesa, null, id_restaurante);
    if (!mesa) {
      // Intentar buscar la mesa solo por id_mesa (sin id_sucursal)
      const mesaQuery = 'SELECT * FROM mesas WHERE id_mesa = $1 AND id_restaurante = $2';
      const { rows } = await pool.query(mesaQuery, [id_mesa, id_restaurante]);
      mesa = rows[0];
    }
    if (!mesa) {
      logger.warn(`Mesa con ID ${id_mesa} no encontrada para liberar en el restaurante ${id_restaurante}.`);
      return res.status(404).json({ message: 'Mesa no encontrada.' });
    }
    // Ahora sí, obtener la mesa con id_sucursal
    const mesaCompleta = await Mesa.getMesaById(id_mesa, mesa.id_sucursal, id_restaurante);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Liberar la mesa (marcar como libre sin facturar)
      const mesaLiberada = await Mesa.liberarMesa(id_mesa, id_restaurante, client);
      
      // Cerrar prefactura anterior si existe (sin facturar)
      const prefactura = await Mesa.getPrefacturaByMesa(id_mesa, id_restaurante);
      if (prefactura) {
        await Mesa.cerrarPrefactura(prefactura.id_prefactura, 0, id_restaurante, client); // Total 0 porque no se factura
        logger.info(`Prefactura anterior cerrada para mesa ${id_mesa}`);
      }
      
      // Crear nueva prefactura limpia para la siguiente sesión
      const nuevaPrefactura = await Mesa.crearPrefactura(id_mesa, null, id_restaurante, client);
      logger.info(`Nueva prefactura creada para mesa ${id_mesa}`);
      
      await client.query('COMMIT');
      logger.info(`Mesa con ID ${id_mesa} liberada exitosamente para el restaurante ${id_restaurante}.`);
      res.status(200).json({
        message: `Mesa liberada exitosamente.`,
        data: {
          mesa: mesaLiberada,
          nueva_prefactura: nuevaPrefactura
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
    const { id_mesa, items, total } = req.body;
    const id_vendedor = req.user.id;
    const id_restaurante = req.user.id_restaurante; // Obtener id_restaurante del usuario autenticado
    // Obtener id_sucursal de la mesa
    const mesa = await Mesa.getMesaById(id_mesa, null, id_restaurante);
    if (!mesa) {
      logger.warn(`Mesa con ID ${id_mesa} no encontrada para agregar productos en el restaurante ${id_restaurante}.`);
      return res.status(404).json({ message: 'Mesa no encontrada.' });
    }
    if (mesa.estado !== 'en_uso') {
      logger.warn(`Intento de agregar productos a mesa con ID ${id_mesa} que no está en uso. Estado actual: ${mesa.estado}`);
      return res.status(400).json({ 
        message: `La mesa con ID ${id_mesa} no está en uso. Estado actual: ${mesa.estado}` 
      });
    }
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      // Crear nueva venta para los productos adicionales
      const venta = await Venta.createVenta({
        id_vendedor: id_vendedor,
        id_pago: null, // Se pagará al final
        id_sucursal: mesa.id_sucursal, // Usar id_sucursal de la mesa
        tipo_servicio: 'Mesa',
        total: total,
        mesa_numero: mesa.numero, // Usar numero de la mesa
        id_restaurante: id_restaurante // Pasar id_restaurante a createVenta
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
        id_restaurante, // Pasar id_restaurante a createDetalleVenta
        client
      );
      // Actualizar total acumulado de la mesa
      const nuevoTotal = mesa.total_acumulado + total;
      await Mesa.actualizarTotalAcumulado(id_mesa, nuevoTotal, id_restaurante, client);
      await client.query('COMMIT');
      logger.info(`Productos agregados a la mesa con ID ${id_mesa} exitosamente para el restaurante ${id_restaurante}. Total acumulado: ${nuevoTotal}`);
      res.status(200).json({
        message: `Productos agregados a la mesa con ID ${id_mesa} exitosamente.`,
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
    const id_restaurante = req.user.id_restaurante; // Obtener id_restaurante del usuario autenticado

    if (!id_mesa) {
      logger.warn('ID de mesa es requerido para generar prefactura.');
      return res.status(400).json({ message: 'ID de mesa es requerido.' });
    }

    // Obtener mesa con información completa
    const mesaQuery = `
      SELECT 
        m.*,
        COALESCE(p.fecha_apertura, m.hora_apertura) as fecha_apertura_prefactura,
        p.estado as estado_prefactura
      FROM mesas m
      LEFT JOIN prefacturas p ON m.id_mesa = p.id_mesa AND p.estado = 'abierta'
      WHERE m.id_mesa = $1 AND m.id_restaurante = $2
    `;
    const mesaResult = await pool.query(mesaQuery, [id_mesa, id_restaurante]);
    if (mesaResult.rows.length === 0) {
      logger.warn(`Mesa con ID ${id_mesa} no encontrada para generar prefactura en el restaurante ${id_restaurante}.`);
      return res.status(404).json({ message: 'Mesa no encontrada.' });
    }
    const mesa = mesaResult.rows[0];

    // Debug: Verificar datos de la mesa
    logger.info(`Generando prefactura para mesa con ID ${id_mesa}, número: ${mesa.numero}, sucursal: ${mesa.id_sucursal}, restaurante: ${id_restaurante}`);

    // DIAGNÓSTICO: Verificar qué ventas existen para esta mesa
    const ventasQuery = `
      SELECT 
        v.id_venta,
        v.mesa_numero,
        v.id_sucursal,
        v.estado,
        v.total,
        v.fecha,
        COUNT(dv.id_detalle) as items_count
      FROM ventas v
      LEFT JOIN detalle_ventas dv ON v.id_venta = dv.id_venta
      WHERE v.mesa_numero = $1 
        AND v.id_sucursal = $2
        AND v.id_restaurante = $3
      GROUP BY v.id_venta, v.mesa_numero, v.id_sucursal, v.estado, v.total, v.fecha
      ORDER BY v.fecha DESC
    `;
    const ventasResult = await pool.query(ventasQuery, [mesa.numero, mesa.id_sucursal, id_restaurante]);
    logger.info(`Ventas encontradas para mesa con ID ${id_mesa}: ${ventasResult.rows.length}`);
    ventasResult.rows.forEach((venta, index) => {
      logger.info(`Venta ${index + 1}: ID=${venta.id_venta}, Estado=${venta.estado}, Total=${venta.total}, Items=${venta.items_count}, Fecha=${venta.fecha}`);
    });

    // DIAGNÓSTICO: Verificar qué productos existen
    const productosQuery = `
      SELECT 
        p.id_producto,
        p.nombre,
        p.precio,
        COUNT(*) as veces_ordenado
      FROM productos p
      WHERE p.id_restaurante = $1
      GROUP BY p.id_producto, p.nombre, p.precio
      ORDER BY p.nombre
    `;
    const productosResult = await pool.query(productosQuery, [id_restaurante]);
    logger.info(`Productos disponibles en restaurante ${id_restaurante}: ${productosResult.rows.length}`);
    productosResult.rows.slice(0, 5).forEach((producto, index) => {
      logger.info(`Producto ${index + 1}: ${producto.nombre}, Precio=${producto.precio}`);
    });

    // Obtener la prefactura abierta más reciente para la mesa
    const prefacturaQuery = `
      SELECT id_prefactura, fecha_apertura
      FROM prefacturas
      WHERE id_mesa = $1 AND id_restaurante = $2 AND estado = 'abierta'
      ORDER BY fecha_apertura DESC
      LIMIT 1
    `;
    const prefacturaResult = await pool.query(prefacturaQuery, [mesa.id_mesa, id_restaurante]);
    const prefactura = prefacturaResult.rows[0];
    let fechaAperturaPrefactura = null;
    if (prefactura) {
      fechaAperturaPrefactura = prefactura.fecha_apertura;
      logger.info(`Usando fecha de prefactura: ${fechaAperturaPrefactura}`);
    } else {
      // Si no hay prefactura abierta, usar la hora_apertura de la mesa
      fechaAperturaPrefactura = mesa.hora_apertura;
      logger.info(`No hay prefactura abierta, usando hora_apertura de mesa: ${fechaAperturaPrefactura}`);
    }

    // Calcular total acumulado SOLO de la sesión actual
    let totalAcumulado = 0;
    let totalVentas = 0;
    let totalItems = 0;
    
    // Siempre usar filtro de fecha para evitar mostrar ventas anteriores
    if (fechaAperturaPrefactura) {
      const totalSesionQuery = `
        SELECT 
          COALESCE(SUM(dv.subtotal), 0) as total_acumulado,
          COUNT(DISTINCT v.id_venta) as total_ventas,
          COUNT(dv.id_detalle) as total_items
        FROM ventas v
        JOIN detalle_ventas dv ON dv.id_venta = v.id_venta
        WHERE v.mesa_numero = $1 
          AND v.id_sucursal = $2
          AND v.id_restaurante = $3
          AND v.fecha >= $4
          AND v.estado IN ('recibido', 'en_preparacion', 'listo_para_servir', 'entregado', 'cancelado')
      `;
      const totalSesionResult = await pool.query(totalSesionQuery, [mesa.numero, mesa.id_sucursal, id_restaurante, fechaAperturaPrefactura]);
      totalAcumulado = parseFloat(totalSesionResult.rows[0].total_acumulado) || 0;
      totalVentas = parseInt(totalSesionResult.rows[0].total_ventas) || 0;
      totalItems = parseInt(totalSesionResult.rows[0].total_items) || 0;
      
      logger.info(`Total calculado desde ${fechaAperturaPrefactura}: $${totalAcumulado}, ${totalVentas} ventas, ${totalItems} items`);
    } else {
      logger.warn('No se pudo determinar fecha de apertura, mostrando solo ventas recientes');
    }

    // Actualizar el total acumulado en la mesa SOLO con el de la sesión actual
    await pool.query('UPDATE mesas SET total_acumulado = $1 WHERE id_mesa = $2 AND id_restaurante = $3', [totalAcumulado, mesa.id_mesa, id_restaurante]);

    // Obtener historial completo de la mesa con más detalles
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
        vend.nombre as nombre_vendedor,
        dv.id_detalle,
        dv.id_producto
      FROM ventas v
      LEFT JOIN detalle_ventas dv ON v.id_venta = dv.id_venta
      LEFT JOIN productos p ON dv.id_producto = p.id_producto
      LEFT JOIN vendedores vend ON v.id_vendedor = vend.id_vendedor
      WHERE v.mesa_numero = $1
        AND v.id_sucursal = $2
        AND v.id_restaurante = $3
        AND v.estado IN ('recibido', 'en_preparacion', 'listo_para_servir', 'entregado', 'cancelado')
        ${fechaAperturaPrefactura ? 'AND v.fecha >= $4' : ''}
      ORDER BY v.fecha DESC
    `;
    const historialParams = fechaAperturaPrefactura 
      ? [mesa.numero, mesa.id_sucursal, id_restaurante, fechaAperturaPrefactura]
      : [mesa.numero, mesa.id_sucursal, id_restaurante];
    const historialResult = await pool.query(historialQuery, historialParams);

    logger.info(`Historial obtenido: ${historialResult.rows.length} registros`);
    if (historialResult.rows.length > 0) {
      logger.info(`Primer registro: ${JSON.stringify(historialResult.rows[0])}`);
    }

    // Calcular subtotales por producto
    const productosAgrupados = {};
    historialResult.rows.forEach((item, index) => {
      const key = item.nombre_producto;
      if (!productosAgrupados[key]) {
        productosAgrupados[key] = {
          nombre_producto: key,
          cantidad_total: 0,
          precio_unitario: parseFloat(item.precio_unitario) || 0,
          subtotal_total: 0,
          observaciones: item.observaciones || '-'
        };
      }
      
      const cantidad = parseInt(item.cantidad) || 0;
      const subtotal = parseFloat(item.subtotal) || 0;
      
      productosAgrupados[key].cantidad_total += cantidad;
      productosAgrupados[key].subtotal_total += subtotal;
      
      logger.info(`Producto ${index + 1}: ${key}, Cantidad: ${cantidad}, Subtotal: ${subtotal}`);
    });

    const historialAgrupado = Object.values(productosAgrupados);
    logger.info(`Productos agrupados: ${historialAgrupado.length} productos diferentes`);
    
    // Verificar que los totales coincidan
    const totalCalculado = historialAgrupado.reduce((sum, item) => sum + parseFloat(item.subtotal_total), 0);
    logger.info(`Total calculado desde productos: ${totalCalculado}, Total desde DB: ${totalAcumulado}`);

    // Formatear fecha de apertura
    const fechaApertura = mesa.fecha_apertura_prefactura || mesa.hora_apertura;
    const fechaFormateada = fechaApertura ? new Date(fechaApertura).toLocaleString('es-ES') : 'No disponible';

    logger.info(`Prefactura generada exitosamente para mesa con ID ${id_mesa} en el restaurante ${id_restaurante}. Total acumulado: ${totalAcumulado}`);
    res.status(200).json({
      message: 'Prefactura generada exitosamente.',
      data: {
        mesa: { 
          ...mesa, 
          total_acumulado: totalAcumulado,
          fecha_apertura_formateada: fechaFormateada
        },
        historial: historialAgrupado,
        historial_detallado: historialResult.rows,
        total_acumulado: totalAcumulado,
        total_ventas: totalVentas,
        fecha_apertura: fechaFormateada,
        estado_prefactura: mesa.estado_prefactura || 'abierta',
        // Agregar información de diagnóstico
        debug: {
          ventas_encontradas: ventasResult.rows.length,
          productos_disponibles: productosResult.rows.length,
          historial_registros: historialResult.rows.length,
          total_calculado: totalCalculado
        }
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
    const id_restaurante = req.user.id_restaurante; // Obtener id_restaurante del usuario autenticado

    if (!id_sucursal) {
      logger.warn('ID de sucursal es requerido para obtener estadísticas de mesas.');
      return res.status(400).json({ message: 'ID de sucursal es requerido.' });
    }

    const estadisticas = await Mesa.getEstadisticasMesas(id_sucursal, id_restaurante);
    logger.info(`Estadísticas de mesas obtenidas exitosamente para sucursal ${id_sucursal} y restaurante ${id_restaurante}.`);
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
    const id_restaurante = req.user.id_restaurante; // Obtener id_restaurante del usuario autenticado

    if (!id_mesa) {
      logger.warn('ID de mesa es requerido para obtener historial de mesa.');
      return res.status(400).json({ message: 'ID de mesa es requerido.' });
    }

    const historial = await Mesa.getHistorialVentasMesa(id_mesa, id_restaurante, fecha);
    logger.info(`Historial de mesa con ID ${id_mesa} obtenido exitosamente para el restaurante ${id_restaurante}.`);
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
    const id_restaurante = req.user.id_restaurante; // Obtener id_restaurante del usuario autenticado

    if (!id_sucursal) {
      logger.warn('ID de sucursal es requerido para obtener configuración de mesas.');
      return res.status(400).json({ message: 'ID de sucursal es requerido.' });
    }

    const mesas = await Mesa.getConfiguracionMesas(id_sucursal, id_restaurante);
    logger.info(`Configuración de mesas obtenida exitosamente para sucursal ${id_sucursal} y restaurante ${id_restaurante}.`);
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
    const id_restaurante = req.user.id_restaurante; // Obtener id_restaurante del usuario autenticado

    if (!numero || !id_sucursal) {
      logger.warn('Número de mesa y ID de sucursal son requeridos para crear mesa.');
      return res.status(400).json({ message: 'Número de mesa y ID de sucursal son requeridos.' });
    }

    // Verificar que el número de mesa no exista
    const numeroExiste = await Mesa.numeroMesaExiste(numero, id_sucursal, id_restaurante);
    if (numeroExiste) {
      logger.warn(`El número de mesa ${numero} ya existe en la sucursal ${id_sucursal} para el restaurante ${id_restaurante}.`);
      return res.status(400).json({ message: `El número de mesa ${numero} ya existe en esta sucursal.` });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const nuevaMesa = await Mesa.crearMesa({ numero, id_sucursal, capacidad, estado, id_restaurante }, client);
      
      await client.query('COMMIT');
      logger.info(`Mesa con ID ${nuevaMesa.id_mesa} creada exitosamente en sucursal ${id_sucursal} para el restaurante ${id_restaurante}.`);
      res.status(201).json({
        message: `Mesa con ID ${nuevaMesa.id_mesa} creada exitosamente.`,
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
    const { numero, capacidad, estado, id_sucursal } = req.body; // Obtener id_sucursal del body
    const id_restaurante = req.user.id_restaurante; // Obtener id_restaurante del usuario autenticado

    if (!id_mesa) {
      logger.warn('ID de mesa es requerido para actualizar mesa.');
      return res.status(400).json({ message: 'ID de mesa es requerido.' });
    }

    // Verificar que el número de mesa no exista (excluyendo la mesa actual)
    if (numero) {
      const numeroExiste = await Mesa.numeroMesaExiste(numero, id_sucursal, id_restaurante, id_mesa);
      if (numeroExiste) {
        logger.warn(`El número de mesa ${numero} ya existe en la sucursal ${id_sucursal} para el restaurante ${id_restaurante} (excluyendo la mesa actual).`);
        return res.status(400).json({ message: `El número de mesa ${numero} ya existe en esta sucursal.` });
      }
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const mesaActualizada = await Mesa.actualizarMesa(id_mesa, id_restaurante, { numero, capacidad, estado }, client);
      
      await client.query('COMMIT');
      logger.info(`Mesa con ID ${id_mesa} actualizada exitosamente para el restaurante ${id_restaurante}.`);
      res.status(200).json({
        message: `Mesa con ID ${id_mesa} actualizada exitosamente.`,
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
    const id_restaurante = req.user.id_restaurante; // Obtener id_restaurante del usuario autenticado

    if (!id_mesa) {
      logger.warn('ID de mesa es requerido para eliminar mesa.');
      return res.status(400).json({ message: 'ID de mesa es requerido.' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const mesaEliminada = await Mesa.eliminarMesa(id_mesa, id_restaurante, client);
      
      await client.query('COMMIT');
      logger.info(`Mesa con ID ${id_mesa} eliminada exitosamente para el restaurante ${id_restaurante}.`);
      res.status(200).json({
        message: `Mesa con ID ${id_mesa} eliminada exitosamente.`,
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

// Marcar mesa como pagada (nuevo flujo)
exports.marcarMesaComoPagada = async (req, res, next) => {
  try {
    const { id_mesa } = req.body;
    const id_restaurante = req.user.id_restaurante; // Obtener id_restaurante del usuario autenticado
    // Buscar la mesa solo por id_mesa e id_restaurante para obtener id_sucursal
    let mesa = await Mesa.getMesaById(id_mesa, null, id_restaurante);
    if (!mesa) {
      // Intentar buscar la mesa solo por id_mesa (sin id_sucursal)
      const mesaQuery = 'SELECT * FROM mesas WHERE id_mesa = $1 AND id_restaurante = $2';
      const { rows } = await pool.query(mesaQuery, [id_mesa, id_restaurante]);
      mesa = rows[0];
    }
    if (!mesa) {
      logger.warn(`Mesa con ID ${id_mesa} no encontrada para marcar como pagada en el restaurante ${id_restaurante}.`);
      return res.status(404).json({ message: 'Mesa no encontrada.' });
    }
    if (mesa.estado === 'libre') {
      logger.warn(`Mesa con ID ${id_mesa} ya está libre.`);
      return res.status(400).json({ message: 'La mesa ya está libre.' });
    }
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      // Marcar mesa como pagada
      const mesaPagada = await Mesa.marcarMesaComoPagada(id_mesa, id_restaurante, client);
      // Cerrar prefactura si existe
      const prefactura = await Mesa.getPrefacturaByMesa(id_mesa, id_restaurante);
      if (prefactura) {
        await Mesa.cerrarPrefactura(prefactura.id_prefactura, mesaPagada.total_acumulado, id_restaurante, client);
      }
      await client.query('COMMIT');
      logger.info(`Mesa con ID ${id_mesa} marcada como pagada y liberada exitosamente para el restaurante ${id_restaurante}. Total: ${mesaPagada.total_acumulado}`);
      res.status(200).json({
        message: `Mesa con ID ${id_mesa} marcada como pagada y liberada exitosamente.`,
        data: {
          mesa: mesaPagada,
          total_final: mesaPagada.total_acumulado
        }
      });
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error en transacción al marcar mesa como pagada:', error);
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error('Error al marcar mesa como pagada:', error);
    next(error);
  }
};

// Asignar mesa a mesero
exports.asignarMesa = async (req, res, next) => {
  try {
    const { id_mesa } = req.params;
    const id_mesero = req.user.id_vendedor;
    const id_restaurante = req.user.id_restaurante;

    if (req.user.rol !== 'mesero') {
      return res.status(403).json({ message: 'Solo los meseros pueden asignarse mesas.' });
    }

    const mesaResult = await pool.query(
      'SELECT * FROM mesas WHERE id_mesa = $1 AND id_restaurante = $2',
      [id_mesa, id_restaurante]
    );
    const mesa = mesaResult.rows[0];
    if (!mesa) {
      return res.status(404).json({ message: 'Mesa no encontrada.' });
    }
    if (mesa.id_mesero_actual && mesa.id_mesero_actual !== id_mesero) {
      return res.status(400).json({ message: 'La mesa ya está asignada a otro mesero.' });
    }

    await pool.query(
      'UPDATE mesas SET id_mesero_actual = $1, estado = $2 WHERE id_mesa = $3 AND id_restaurante = $4',
      [id_mesero, 'en_uso', id_mesa, id_restaurante]
    );

    res.status(200).json({ message: 'Mesa asignada correctamente.' });
  } catch (error) {
    next(error);
  }
};

// Liberar mesa
exports.liberarMesaMesero = async (req, res, next) => {
  try {
    const { id_mesa } = req.params;
    const id_mesero = req.user.id_vendedor;
    const id_restaurante = req.user.id_restaurante;

    const mesaResult = await pool.query(
      'SELECT * FROM mesas WHERE id_mesa = $1 AND id_restaurante = $2',
      [id_mesa, id_restaurante]
    );
    const mesa = mesaResult.rows[0];
    if (!mesa) {
      return res.status(404).json({ message: 'Mesa no encontrada.' });
    }
    if (mesa.id_mesero_actual !== id_mesero && !['admin', 'cajero'].includes(req.user.rol)) {
      return res.status(403).json({ message: 'No tienes permiso para liberar esta mesa.' });
    }

    await pool.query(
      'UPDATE mesas SET id_mesero_actual = NULL, estado = $1 WHERE id_mesa = $2 AND id_restaurante = $3',
      ['libre', id_mesa, id_restaurante]
    );

    res.status(200).json({ message: 'Mesa liberada correctamente.' });
  } catch (error) {
    next(error);
  }
};

// Consultar mesas asignadas al mesero
exports.getMesasAsignadas = async (req, res, next) => {
  try {
    const id_mesero = req.user.id_vendedor;
    const id_restaurante = req.user.id_restaurante;

    const result = await pool.query(
      'SELECT * FROM mesas WHERE id_mesero_actual = $1 AND id_restaurante = $2',
      [id_mesero, id_restaurante]
    );
    res.status(200).json({ data: result.rows });
  } catch (error) {
    next(error);
  }
};

// División de cuenta (split bill)
exports.splitBill = async (req, res, next) => {
  try {
    const { id_mesa } = req.params;
    const { asignaciones } = req.body; // [{ id_detalle, subcuenta }]
    const id_restaurante = req.user.id_restaurante;
    if (!asignaciones || !Array.isArray(asignaciones) || asignaciones.length === 0) {
      return res.status(400).json({ message: 'Se requieren asignaciones de ítems a subcuentas.' });
    }

    // Obtener todos los detalles de venta actuales de la mesa
    const detallesQuery = `
      SELECT dv.*, v.id_prefactura, v.id_venta
      FROM detalle_ventas dv
      JOIN ventas v ON dv.id_venta = v.id_venta
      WHERE v.id_mesa = $1 AND v.id_restaurante = $2 AND v.estado IN ('recibido', 'en_preparacion', 'listo_para_servir', 'entregado', 'cancelado')
    `;
    const { rows: detalles } = await pool.query(detallesQuery, [id_mesa, id_restaurante]);
    if (detalles.length === 0) {
      return res.status(400).json({ message: 'No hay ítems activos para dividir en esta mesa.' });
    }

    // Agrupar asignaciones por subcuenta
    const subcuentas = {};
    for (const asignacion of asignaciones) {
      if (!subcuentas[asignacion.subcuenta]) subcuentas[asignacion.subcuenta] = [];
      subcuentas[asignacion.subcuenta].push(asignacion.id_detalle);
    }

    // Crear una prefactura/venta por cada subcuenta
    const client = await pool.connect();
    const nuevasPrefacturas = [];
    try {
      await client.query('BEGIN');
      for (const subcuenta in subcuentas) {
        // Crear nueva venta/prefactura para la subcuenta
        const ventaRes = await client.query(
          `INSERT INTO ventas (id_mesa, id_restaurante, estado, tipo_servicio, total)
           VALUES ($1, $2, 'recibido', 'Mesa', 0) RETURNING *`,
          [id_mesa, id_restaurante]
        );
        const nuevaVenta = ventaRes.rows[0];
        // Reasignar los detalles a la nueva venta
        for (const id_detalle of subcuentas[subcuenta]) {
          await client.query(
            `UPDATE detalle_ventas SET id_venta = $1 WHERE id_detalle = $2`,
            [nuevaVenta.id_venta, id_detalle]
          );
        }
        nuevasPrefacturas.push(nuevaVenta);
      }
      await client.query('COMMIT');
      res.status(200).json({ message: 'Cuenta dividida exitosamente.', nuevasPrefacturas });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    next(error);
  }
};

// Transferir ítem individual entre mesas
exports.transferirItem = async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { id_detalle, id_mesa_destino } = req.body;
    const id_restaurante = req.user.id_restaurante;
    const id_vendedor = req.user.id; // Asignar el vendedor que realiza la transferencia

    logger.debug(`req.body recibido en transferirItem: ${JSON.stringify(req.body)}`);

    if (!id_detalle || !id_mesa_destino) {
      return res.status(400).json({ message: 'Se requieren id_detalle e id_mesa_destino.' });
    }

    // 1. Obtener detalles del item y la venta de origen
    const detalleOriginalQuery = `
      SELECT dv.id_venta, dv.cantidad, dv.precio_unitario, dv.subtotal, v.id_mesa as id_mesa_origen
      FROM detalle_ventas dv
      JOIN ventas v ON dv.id_venta = v.id_venta
      WHERE dv.id_detalle = $1 AND v.id_restaurante = $2;
    `;
    const { rows: detalleRows } = await client.query(detalleOriginalQuery, [id_detalle, id_restaurante]);

    if (detalleRows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Detalle de venta no encontrado.' });
    }

    const detalleOriginal = detalleRows[0];
    const id_venta_origen = detalleOriginal.id_venta;
    const id_mesa_origen = detalleOriginal.id_mesa_origen;
    const subtotal_item = parseFloat(detalleOriginal.subtotal);

    logger.debug(`Validando mesas: Origen=${id_mesa_origen}, Destino=${id_mesa_destino}`);
    // Validar que la mesa de origen y destino sean diferentes
    if (id_mesa_origen === id_mesa_destino) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: 'No se puede transferir un producto a la misma mesa.' });
    }

    // 2. Obtener información de la mesa destino
    const mesaDestinoInfo = await Mesa.getMesaById(id_mesa_destino, null, id_restaurante);
    if (!mesaDestinoInfo) {
        await client.query('ROLLBACK');
        return res.status(404).json({ message: 'Mesa de destino no encontrada.' });
    }
    
    logger.debug(`Estado de mesa destino (ID: ${id_mesa_destino}): ${mesaDestinoInfo.estado}`);
    
    // Validar que la mesa no esté en mantenimiento o reservada
    if (mesaDestinoInfo.estado === 'mantenimiento' || mesaDestinoInfo.estado === 'reservada') {
        await client.query('ROLLBACK');
        return res.status(400).json({ 
            message: 'No se puede transferir productos a una mesa en mantenimiento o reservada.' 
        });
    }
    
    // Si la mesa está libre, se creará automáticamente una nueva venta
    const mesaEstaLibre = mesaDestinoInfo.estado === 'libre';
    if (mesaEstaLibre) {
        logger.info(`Mesa destino ${id_mesa_destino} está libre. Se creará una nueva venta automáticamente.`);
    }

    // 3. Crear SIEMPRE una nueva venta para la mesa destino (evita reactivar ventas históricas)
    logger.info(`Creando nueva venta en mesa destino ${id_mesa_destino} (estado: ${mesaDestinoInfo.estado})`);
    const newVentaRes = await client.query(
      `INSERT INTO ventas (id_mesa, mesa_numero, id_restaurante, estado, tipo_servicio, total, id_vendedor, id_sucursal, fecha)
       VALUES ($1, $2, $3, 'recibido', 'Mesa', 0, $4, $5, NOW()) RETURNING id_venta, fecha`,
      [id_mesa_destino, mesaDestinoInfo.numero, id_restaurante, id_vendedor, mesaDestinoInfo.id_sucursal]
    );
    let id_venta_destino = newVentaRes.rows[0].id_venta;
    let fechaVentaDestino = newVentaRes.rows[0].fecha;
    
    // Si la mesa estaba libre, actualizar su estado a 'en_uso'
    if (mesaEstaLibre) {
      await client.query(
        `UPDATE mesas SET estado = 'en_uso', id_venta_actual = $1 WHERE id_mesa = $2 AND id_restaurante = $3`,
        [id_venta_destino, id_mesa_destino, id_restaurante]
      );
      logger.info(`Mesa ${id_mesa_destino} actualizada de 'libre' a 'en_uso'`);
    }

    // 4. Transferir el ítem (actualizar id_venta en detalle_ventas)
    await client.query(
      `UPDATE detalle_ventas SET id_venta = $1 WHERE id_detalle = $2`,
      [id_venta_destino, id_detalle]
    );

    // 5. Actualizar totales de ventas de origen y destino
    await client.query(`
      UPDATE ventas
      SET total = COALESCE((SELECT SUM(subtotal) FROM detalle_ventas WHERE id_venta = ventas.id_venta), 0)
      WHERE id_venta = $1;
    `, [id_venta_origen]);

    await client.query(`
      UPDATE ventas
      SET total = COALESCE((SELECT SUM(subtotal) FROM detalle_ventas WHERE id_venta = ventas.id_venta), 0)
      WHERE id_venta = $1;
    `, [id_venta_destino]);

    // 6. Actualizar total_acumulado de las mesas de origen y destino (solo sesión actual)
    // Determinar fecha de apertura de la sesión para origen y destino (prefactura abierta o hora_apertura)
    const prefacturaOrigen = await Mesa.getPrefacturaByMesa(id_mesa_origen, id_restaurante);
    const mesaOrigenInfo = await Mesa.getMesaById(id_mesa_origen, null, id_restaurante);
    const aperturaOrigen = (prefacturaOrigen && prefacturaOrigen.fecha_apertura) || (mesaOrigenInfo && mesaOrigenInfo.hora_apertura) || null;

    const prefacturaDestino = await Mesa.getPrefacturaByMesa(id_mesa_destino, id_restaurante);
    const aperturaDestino = (prefacturaDestino && prefacturaDestino.fecha_apertura) || (mesaDestinoInfo && mesaDestinoInfo.hora_apertura) || null;

    // Para la mesa de origen: excluir cancelados e históricos
    const totalAcumuladoOrigenQuery = `
        SELECT COALESCE(SUM(v.total), 0)
        FROM ventas v
        WHERE v.id_mesa = $1 AND v.id_restaurante = $2 
          AND v.estado IN ('recibido', 'en_preparacion', 'listo_para_servir', 'entregado')
          AND ($3::timestamp IS NULL OR v.fecha >= $3);
    `;
    const { rows: totalOrigenRows } = await client.query(totalAcumuladoOrigenQuery, [id_mesa_origen, id_restaurante, aperturaOrigen]);
    const nuevoTotalOrigen = parseFloat(totalOrigenRows[0].coalesce) || 0;
    await Mesa.actualizarTotalAcumulado(id_mesa_origen, nuevoTotalOrigen, id_restaurante, client);

    // Si la mesa de origen quedó sin ventas activas, liberarla (doble verificación por seguridad)
    if (nuevoTotalOrigen <= 0) {
      await Mesa.liberarMesa(id_mesa_origen, id_restaurante, client);
      logger.info(`Mesa ${id_mesa_origen} liberada al quedar sin productos/ventas activas (por total 0)`);
    } else {
      // Verificación adicional por cantidad de ítems activos
      const { rows: restantesRows } = await client.query(`
        SELECT COUNT(*)::int AS cnt
        FROM ventas v
        LEFT JOIN detalle_ventas dv ON dv.id_venta = v.id_venta
        WHERE v.id_mesa = $1 AND v.id_restaurante = $2
          AND v.estado IN ('recibido', 'en_preparacion', 'listo_para_servir')
      `, [id_mesa_origen, id_restaurante]);
      const itemsActivosRestantes = parseInt(restantesRows[0].cnt, 10) || 0;
      if (itemsActivosRestantes === 0) {
        await Mesa.liberarMesa(id_mesa_origen, id_restaurante, client);
        logger.info(`Mesa ${id_mesa_origen} liberada al no quedar ítems activos (verificación por conteo)`);
      }
    }

    // Para la mesa de destino: misma regla por sesión
    const totalAcumuladoDestinoQuery = `
        SELECT COALESCE(SUM(v.total), 0)
        FROM ventas v
        WHERE v.id_mesa = $1 AND v.id_restaurante = $2 
          AND v.estado IN ('recibido', 'en_preparacion', 'listo_para_servir', 'entregado')
          AND ($3::timestamp IS NULL OR v.fecha >= $3);
    `;
    const { rows: totalDestinoRows } = await client.query(totalAcumuladoDestinoQuery, [id_mesa_destino, id_restaurante, aperturaDestino]);
    const nuevoTotalDestino = parseFloat(totalDestinoRows[0].coalesce) || 0;
    await Mesa.actualizarTotalAcumulado(id_mesa_destino, nuevoTotalDestino, id_restaurante, client);

    // Asegurar que la mesa de destino quede en uso si recibió toda la orden
    if (nuevoTotalDestino > 0) {
      await client.query(
        `UPDATE mesas 
           SET estado = 'en_uso', 
               hora_apertura = COALESCE(hora_apertura, NOW())
         WHERE id_mesa = $1 AND id_restaurante = $2`,
        [id_mesa_destino, id_restaurante]
      );
      logger.info(`Mesa ${id_mesa_destino} marcada como 'en_uso' tras recibir orden completa`);
    }

    // Asegurar que la mesa de destino quede en uso si recibió productos/venta
    if (nuevoTotalDestino > 0) {
      await client.query(
        `UPDATE mesas 
           SET estado = 'en_uso', 
               id_venta_actual = $1,
               hora_apertura = COALESCE(hora_apertura, NOW())
         WHERE id_mesa = $2 AND id_restaurante = $3`,
        [id_venta_destino, id_mesa_destino, id_restaurante]
      );
      logger.info(`Mesa ${id_mesa_destino} marcada como 'en_uso' y vinculada a venta ${id_venta_destino}`);
    }

    // 7. Prefacturas
    // Cerrar prefactura de la mesa de origen para cortar la sesión
    await Mesa.cerrarPrefacturaExistente(id_mesa_origen, id_restaurante, client);
    // Asegurar que la mesa destino tenga una prefactura abierta (crear si no existe)
    const prefDestino = await Mesa.getPrefacturaByMesa(id_mesa_destino, id_restaurante);
    if (!prefDestino) {
      // Usar fecha de la venta para que la sesión incluya inmediatamente sus detalles
      await Mesa.crearPrefacturaConFecha(id_mesa_destino, id_venta_destino, (fechaVentaDestino || new Date()), id_restaurante, client);
      logger.info(`Prefactura creada para mesa destino ${id_mesa_destino} vinculada a venta ${id_venta_destino}`);
    } else {
      // Si existe, alinear la fecha de apertura con la fecha de la venta destino para aislar la sesión
      await Mesa.actualizarFechaAperturaPrefactura(prefDestino.id_prefactura, (fechaVentaDestino || new Date()), id_restaurante, client);
      logger.info(`Prefactura ${prefDestino.id_prefactura} actualizada con nueva fecha_apertura para mesa ${id_mesa_destino}`);
    }

    await client.query('COMMIT');
    
    const mensajeTransferencia = mesaEstaLibre 
      ? `Ítem transferido exitosamente. Se creó una nueva venta en la mesa ${id_mesa_destino}.`
      : 'Ítem transferido exitosamente.';
    
    logger.info(`Ítem ${id_detalle} transferido de mesa ${id_mesa_origen} a mesa ${id_mesa_destino} exitosamente.`);
    res.status(200).json({ 
        message: mensajeTransferencia, 
        data: {
            id_detalle, 
            id_mesa_origen, 
            id_mesa_destino,
            nuevoTotalOrigen, 
            nuevoTotalDestino,
            nuevaVentaCreada: mesaEstaLibre,
            id_venta_destino
        }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error al transferir ítem:', error);
    next(error);
  } finally {
    client.release();
  }
};

// Transferir orden completa entre mesas
exports.transferirOrden = async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { id_venta, id_mesa_destino } = req.body;
    const id_restaurante = req.user.id_restaurante;

    if (!id_venta || !id_mesa_destino) {
      return res.status(400).json({ message: 'Se requieren id_venta e id_mesa_destino.' });
    }

    // 1. Obtener información de la venta de origen
    const ventaOrigenQuery = `SELECT id_mesa FROM ventas WHERE id_venta = $1 AND id_restaurante = $2;`;
    const { rows: ventaOrigenRows } = await client.query(ventaOrigenQuery, [id_venta, id_restaurante]);

    if (ventaOrigenRows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ message: 'Venta no encontrada.' });
    }
    const id_mesa_origen = ventaOrigenRows[0].id_mesa;

    // Validar que la mesa de origen y destino sean diferentes
    if (id_mesa_origen === id_mesa_destino) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: 'No se puede transferir una orden a la misma mesa.' });
    }

    // 2. Obtener información de la mesa destino
    const mesaDestinoInfo = await Mesa.getMesaById(id_mesa_destino, null, id_restaurante);
    if (!mesaDestinoInfo) {
        await client.query('ROLLBACK');
        return res.status(404).json({ message: 'Mesa de destino no encontrada.' });
    }
    
    // Validar que la mesa no esté en mantenimiento o reservada
    if (mesaDestinoInfo.estado === 'mantenimiento' || mesaDestinoInfo.estado === 'reservada') {
        await client.query('ROLLBACK');
        return res.status(400).json({ 
            message: 'No se puede transferir órdenes a una mesa en mantenimiento o reservada.' 
        });
    }
    
    // Si la mesa está libre, se permitirá la transferencia (la venta ya existe)
    const mesaEstaLibre = mesaDestinoInfo.estado === 'libre';
    if (mesaEstaLibre) {
        logger.info(`Mesa destino ${id_mesa_destino} está libre. Se transferirá la orden completa.`);
    }

    // 3. Transferir la venta y todos sus detalles
    const ventaUpdateRes = await client.query(
      `UPDATE ventas SET id_mesa = $1, mesa_numero = (SELECT numero FROM mesas WHERE id_mesa = $1 AND id_restaurante = $3)
       WHERE id_venta = $2 AND id_restaurante = $3
       RETURNING id_venta, fecha`,
      [id_mesa_destino, id_venta, id_restaurante]
    );
    const fechaVentaDestino = ventaUpdateRes.rows[0]?.fecha;

    // 4. Recalcular y actualizar total_acumulado para mesas de origen y destino
    // Para la mesa de origen:
    const totalAcumuladoOrigenQuery = `
        SELECT COALESCE(SUM(v.total), 0)
        FROM ventas v
        WHERE v.id_mesa = $1 AND v.id_restaurante = $2 AND v.estado IN ('recibido', 'en_preparacion', 'listo_para_servir', 'entregado', 'cancelado');
    `;
    const { rows: totalOrigenRows } = await client.query(totalAcumuladoOrigenQuery, [id_mesa_origen, id_restaurante]);
    const nuevoTotalOrigen = parseFloat(totalOrigenRows[0].coalesce) || 0;
    await Mesa.actualizarTotalAcumulado(id_mesa_origen, nuevoTotalOrigen, id_restaurante, client);

    // Si la mesa de origen quedó sin ventas activas tras transferir la orden, liberarla (doble verificación)
    if (nuevoTotalOrigen <= 0) {
      await Mesa.liberarMesa(id_mesa_origen, id_restaurante, client);
      logger.info(`Mesa ${id_mesa_origen} liberada al quedar sin ventas activas (transferirOrden, total 0)`);
    } else {
      const { rows: restantesRows } = await client.query(`
        SELECT COUNT(*)::int AS cnt
        FROM ventas v
        LEFT JOIN detalle_ventas dv ON dv.id_venta = v.id_venta
        WHERE v.id_mesa = $1 AND v.id_restaurante = $2
          AND v.estado IN ('recibido', 'en_preparacion', 'listo_para_servir')
      `, [id_mesa_origen, id_restaurante]);
      const itemsActivosRestantes = parseInt(restantesRows[0].cnt, 10) || 0;
      if (itemsActivosRestantes === 0) {
        await Mesa.liberarMesa(id_mesa_origen, id_restaurante, client);
        logger.info(`Mesa ${id_mesa_origen} liberada al no quedar ítems activos (transferirOrden, verificación por conteo)`);
      }
    }

    // Para la mesa de destino:
    const totalAcumuladoDestinoQuery = `
        SELECT COALESCE(SUM(v.total), 0)
        FROM ventas v
        WHERE v.id_mesa = $1 AND v.id_restaurante = $2 AND v.estado IN ('recibido', 'en_preparacion', 'listo_para_servir', 'entregado', 'cancelado');
    `;
    const { rows: totalDestinoRows } = await client.query(totalAcumuladoDestinoQuery, [id_mesa_destino, id_restaurante]);
    const nuevoTotalDestino = parseFloat(totalDestinoRows[0].coalesce) || 0;
    await Mesa.actualizarTotalAcumulado(id_mesa_destino, nuevoTotalDestino, id_restaurante, client);

    // 5. Prefacturas: cerrar origen, asegurar destino abierta
    await Mesa.cerrarPrefacturaExistente(id_mesa_origen, id_restaurante, client);
    const prefDestino = await Mesa.getPrefacturaByMesa(id_mesa_destino, id_restaurante);
    if (!prefDestino) {
      await Mesa.crearPrefacturaConFecha(id_mesa_destino, id_venta, (fechaVentaDestino || new Date()), id_restaurante, client);
      logger.info(`Prefactura creada para mesa destino ${id_mesa_destino} tras transferir orden ${id_venta}`);
    }

    await client.query('COMMIT');
    
    const mensajeTransferencia = mesaEstaLibre 
      ? `Orden transferida exitosamente a la mesa ${id_mesa_destino} (estaba libre).`
      : 'Orden transferida exitosamente.';
    
    logger.info(`Orden ${id_venta} transferida de mesa ${id_mesa_origen} a mesa ${id_mesa_destino} exitosamente.`);
    res.status(200).json({ 
        message: mensajeTransferencia, 
        data: {
            id_venta, 
            id_mesa_origen, 
            id_mesa_destino,
            nuevoTotalOrigen, 
            nuevoTotalDestino,
            mesaDestinoEstabaLibre: mesaEstaLibre
        }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error al transferir orden:', error);
    next(error);
  } finally {
    client.release();
  }
};

// Eliminar producto (detalle_ventas) de una orden
exports.eliminarDetalleVenta = async (req, res, next) => {
  try {
    const { id_detalle } = req.params;
    const id_restaurante = req.user.id_restaurante;
    // Solo permitir eliminar si el producto no fue enviado a cocina (puedes ajustar el estado según tu lógica)
    const detalle = await pool.query('SELECT * FROM detalle_ventas WHERE id_detalle = $1', [id_detalle]);
    if (!detalle.rows.length) {
      return res.status(404).json({ message: 'Detalle no encontrado.' });
    }
    // Aquí podrías validar el estado de la venta antes de permitir eliminar
    await pool.query('DELETE FROM detalle_ventas WHERE id_detalle = $1', [id_detalle]);
    res.status(200).json({ message: 'Producto eliminado de la orden.' });
  } catch (error) {
    next(error);
  }
};

// Editar modificadores/observaciones de un producto (detalle_ventas)
exports.editarDetalleVenta = async (req, res, next) => {
  try {
    const { id_detalle } = req.params;
    const { cantidad, observaciones } = req.body;
    // Puedes agregar lógica para editar modificadores si tienes esa estructura
    await pool.query(
      'UPDATE detalle_ventas SET cantidad = COALESCE($1, cantidad), observaciones = COALESCE($2, observaciones) WHERE id_detalle = $3',
      [cantidad, observaciones, id_detalle]
    );
    res.status(200).json({ message: 'Detalle de venta actualizado.' });
  } catch (error) {
    next(error);
  }
};

exports.listarMesas = async (req, res, next) => {
  try {
    const { id_sucursal, id_restaurante, estado } = req.query;
    let query = 'SELECT * FROM mesas WHERE 1=1';
    const params = [];
    if (id_sucursal) {
      params.push(id_sucursal);
      query += ` AND id_sucursal = $${params.length}`;
    }
    if (id_restaurante) {
      params.push(id_restaurante);
      query += ` AND id_restaurante = $${params.length}`;
    }
    if (estado) {
      params.push(estado);
      query += ` AND estado = $${params.length}`;
    }
    query += ' ORDER BY numero ASC';
    const result = await pool.query(query, params);
    res.status(200).json({ data: result.rows });
  } catch (error) {
    next(error);
  }
};

// =============================
// NUEVO: Crear grupo de mesas (unión de mesas)
// =============================
exports.crearGrupoMesas = async (req, res, next) => {
  try {
    const { mesas, id_mesero } = req.body;
    const id_restaurante = req.user.id_restaurante;
    const id_usuario = req.user.id || req.user.id_vendedor || req.user.id_usuario;
    if (!Array.isArray(mesas) || mesas.length < 2) {
      return res.status(400).json({ message: 'Debes seleccionar al menos dos mesas para agrupar.' });
    }
    if (!id_mesero) {
      return res.status(400).json({ message: 'Debes especificar el mesero responsable.' });
    }
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      // Crear grupo
      const grupoRes = await client.query(
        `INSERT INTO grupos_mesas (id_restaurante, estado, created_at, updated_at) VALUES ($1, 'activo', NOW(), NOW()) RETURNING *`,
        [id_restaurante]
      );
      const grupo = grupoRes.rows[0];
      // Asociar mesas al grupo
      for (const id_mesa of mesas) {
        await client.query(
          `INSERT INTO mesas_en_grupo (id_grupo_mesa, id_mesa, created_at) VALUES ($1, $2, NOW())`,
          [grupo.id_grupo_mesa, id_mesa]
        );
        await client.query(
          `UPDATE mesas SET id_grupo_mesa = $1, id_mesero_actual = $2, estado = 'agrupada' WHERE id_mesa = $3 AND id_restaurante = $4`,
          [grupo.id_grupo_mesa, id_mesero, id_mesa, id_restaurante]
        );
      }
      // Crear venta principal para el grupo
      const ventaRes = await client.query(
         `INSERT INTO ventas (id_vendedor, id_sucursal, tipo_servicio, total, estado, id_restaurante, id_mesa) VALUES ($1, (SELECT id_sucursal FROM mesas WHERE id_mesa = $2), 'Mesa', 0, 'recibido', $3, $2) RETURNING *`,
        [id_mesero, mesas[0], id_restaurante]
      );
      const venta = ventaRes.rows[0];
      // Registrar en auditoría
      await client.query(
        `INSERT INTO auditoria_admin (id_usuario, accion, tabla_afectada, id_registro, datos_anteriores, datos_nuevos, fecha_accion) VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [id_usuario, 'crear_grupo_mesas', 'grupos_mesas', grupo.id_grupo_mesa, null, JSON.stringify({ mesas, id_mesero }),]
      );
      await client.query('COMMIT');
      res.status(201).json({ message: 'Grupo de mesas creado exitosamente.', grupo, venta });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    next(error);
  }
};

// =============================
// NUEVO: Reasignar mesero a mesa (admin/cajero)
// =============================
exports.reasignarMesero = async (req, res, next) => {
  try {
    const { id_mesa } = req.params;
    const { id_mesero } = req.body;
    const id_restaurante = req.user.id_restaurante;
    const id_usuario = req.user.id || req.user.id_vendedor || req.user.id_usuario;
    if (!id_mesero) {
      return res.status(400).json({ message: 'Debes especificar el nuevo mesero.' });
    }
    const mesaRes = await pool.query('SELECT * FROM mesas WHERE id_mesa = $1 AND id_restaurante = $2', [id_mesa, id_restaurante]);
    const mesa = mesaRes.rows[0];
    if (!mesa) {
      return res.status(404).json({ message: 'Mesa no encontrada.' });
    }
    await pool.query('UPDATE mesas SET id_mesero_actual = $1 WHERE id_mesa = $2 AND id_restaurante = $3', [id_mesero, id_mesa, id_restaurante]);
    // Registrar en auditoría
    await pool.query(
      `INSERT INTO auditoria_admin (id_usuario, accion, tabla_afectada, id_registro, datos_anteriores, datos_nuevos, fecha_accion) VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [id_usuario, 'reasignar_mesero', 'mesas', id_mesa, JSON.stringify({ id_mesero_anterior: mesa.id_mesero_actual }), JSON.stringify({ id_mesero }),]
    );
    res.status(200).json({ message: 'Mesero reasignado correctamente.' });
  } catch (error) {
    next(error);
  }
};

// Eliminar mesas duplicadas por (id_restaurante, id_sucursal, numero)
exports.eliminarMesasDuplicadas = async (req, res, next) => {
  try {
    const id_restaurante = req.user.id_restaurante;
    const { id_sucursal } = req.query;
    if (!id_sucursal) {
      return res.status(400).json({ message: 'id_sucursal es requerido' });
    }

    // Buscar grupos de números de mesa duplicados
    const dupQuery = `
      SELECT numero, COUNT(*) as total,
             ARRAY_AGG(id_mesa ORDER BY created_at DESC) as ids_desc,
             ARRAY_AGG(id_mesa ORDER BY created_at ASC) as ids_asc
      FROM mesas
      WHERE id_restaurante = $1 AND id_sucursal = $2
      GROUP BY numero
      HAVING COUNT(*) > 1
    `;
    const { rows: duplicados } = await pool.query(dupQuery, [id_restaurante, id_sucursal]);

    let eliminadas = 0;
    const detalles = [];

    for (const dup of duplicados) {
      const numero = dup.numero;
      const idsAsc = dup.ids_asc; // más antiguas primero
      // Mantener la más reciente, eliminar las antiguas que estén libres
      // Evitar eliminar mesas en uso o pendientes
      const candidates = idsAsc.slice(0, -1); // todas menos la más reciente
      if (candidates.length === 0) continue;

      const estadoRows = await pool.query(
        `SELECT id_mesa, estado FROM mesas WHERE id_mesa = ANY($1::int[])`,
        [candidates]
      );
      const eliminables = estadoRows.rows
        .filter(r => r.estado === 'libre' || r.estado === 'mantenimiento' || r.estado === 'pagado')
        .map(r => r.id_mesa);

      if (eliminables.length > 0) {
        await pool.query(`DELETE FROM mesas WHERE id_mesa = ANY($1::int[])`, [eliminables]);
        eliminadas += eliminables.length;
        detalles.push({ numero, eliminadas: eliminables });
      } else {
        detalles.push({ numero, eliminadas: [] });
      }
    }

    return res.status(200).json({
      message: 'Limpieza de mesas duplicadas completada',
      data: { grupos_duplicados: duplicados.length, total_eliminadas: eliminadas, detalles }
    });
  } catch (error) {
    next(error);
  }
};