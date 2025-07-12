const Venta = require('../models/ventaModel');
const Mesa = require('../models/mesaModel');
const db = require('../config/database');
const logger = require('../config/logger'); // Importar el logger

// Utilidades para mapear nombres a ids
async function getIdByField(table, field, value) {
  try {
    logger.debug(`getIdByField: Buscando en tabla ${table}, campo ${field}, valor ${value}`);
    
    // Usar consultas específicas para cada tabla
    let query;
    if (table === 'vendedores') {
      query = 'SELECT * FROM vendedores WHERE username = $1 LIMIT 1';
    } else if (table === 'sucursales') {
      query = 'SELECT * FROM sucursales WHERE nombre = $1 LIMIT 1';
    } else if (table === 'metodos_pago') {
      query = 'SELECT * FROM metodos_pago WHERE descripcion = $1 LIMIT 1';
    } else {
      query = `SELECT * FROM ${table} WHERE ${field} = $1 LIMIT 1`;
    }
    
    logger.debug(`getIdByField: Query: ${query}`);
    const { rows } = await db.query(query, [value]);
    logger.debug(`getIdByField: Resultado:`, rows[0]);
    return rows[0];
  } catch (error) {
    logger.error(`getIdByField: Error buscando en ${table}.${field}:`, error.message);
    throw error;
  }
}

exports.createVenta = async (req, res, next) => {
  try {
    logger.info('Backend: createVenta called with:', req.body);
    
    const {
      items,
      total,
      paymentMethod,
      cashier,
      branch,
      tipo_servicio = 'Mesa',
      mesa_numero = null,
      invoiceData
    } = req.body;

    logger.info('Backend: Parsed data:', { items, total, paymentMethod, cashier, branch, tipo_servicio, mesa_numero });

    // Mapear a ids
    const vendedor_test = await db.query('SELECT * FROM vendedores LIMIT 5');
    logger.debug('VENDEDORES TEST:', vendedor_test.rows);
    
    // Buscar vendedor directamente
    const vendedorResult = await db.query('SELECT * FROM vendedores WHERE username = $1 LIMIT 1', [cashier]);
    const vendedor = vendedorResult.rows[0];
    logger.info('Backend: Vendedor found:', vendedor);
    if (!vendedor) return res.status(400).json({ message: 'Cajero no encontrado' });
    
    // Buscar sucursal directamente
    const sucursalResult = await db.query('SELECT * FROM sucursales WHERE nombre = $1 LIMIT 1', [branch]);
    const sucursal = sucursalResult.rows[0];
    logger.info('Backend: Sucursal found:', sucursal);
    if (!sucursal) return res.status(400).json({ message: 'Sucursal no encontrada' });
    
    // Buscar método de pago directamente
    const pagoResult = await db.query('SELECT * FROM metodos_pago WHERE descripcion = $1 LIMIT 1', [paymentMethod]);
    const pago = pagoResult.rows[0];
    logger.info('Backend: Pago found:', pago);
    if (!pago) return res.status(400).json({ message: 'Método de pago no encontrado' });

    // Crear venta y detalles en una transacción
    logger.info('Backend: Creating venta with:', {
      id_vendedor: vendedor.id_vendedor,
      id_pago: pago.id_pago,
      id_sucursal: sucursal.id_sucursal,
      tipo_servicio,
      total,
      mesa_numero
    });
    
    let venta;
    let detalles;
    let mesaActualizada = null;
    
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      
      // Si es venta por mesa, verificar y actualizar estado de mesa
      if (tipo_servicio === 'Mesa' && mesa_numero) {
        logger.info('Backend: Verificando mesa:', mesa_numero);
        
        // Verificar si la mesa existe y está disponible
        const mesa = await Mesa.getMesaByNumero(mesa_numero, sucursal.id_sucursal);
        if (!mesa) {
          throw new Error(`Mesa ${mesa_numero} no encontrada en la sucursal.`);
        }
        
        if (mesa.estado === 'libre') {
          // Si la mesa está libre, abrirla
          logger.info('Backend: Abriendo mesa:', mesa_numero);
          mesaActualizada = await Mesa.abrirMesa(mesa_numero, sucursal.id_sucursal, vendedor.id_vendedor, client);
          
          // Crear prefactura
          await Mesa.crearPrefactura(mesaActualizada.id_mesa, null, client);
        } else if (mesa.estado === 'en_uso') {
          // Si la mesa está en uso, actualizar total acumulado
          logger.info('Backend: Mesa en uso, actualizando total acumulado');
          const nuevoTotal = mesa.total_acumulado + total;
          mesaActualizada = await Mesa.actualizarTotalAcumulado(mesa.id_mesa, nuevoTotal, client);
        } else {
          throw new Error(`Mesa ${mesa_numero} no está disponible. Estado actual: ${mesa.estado}`);
        }
      }
      
      // Crear venta
      venta = await Venta.createVenta({
        id_vendedor: vendedor.id_vendedor,
        id_pago: pago.id_pago,
        id_sucursal: sucursal.id_sucursal,
        tipo_servicio,
        total,
        mesa_numero
      }, client);
      logger.info('Backend: Venta created successfully:', venta);
      
      if (!venta || !venta.id_venta) {
        throw new Error('No se pudo obtener el ID de la venta principal.');
      }

      // Si es venta por mesa, asignar la venta a la mesa
      if (tipo_servicio === 'Mesa' && mesa_numero && mesaActualizada) {
        await Mesa.asignarVentaAMesa(mesaActualizada.id_mesa, venta.id_venta, client);
      }

      // Verificar el estado de la venta después de crearla
      logger.debug('Backend: === VERIFICANDO ESTADO DE VENTA ===');
      const estadoQuery = 'SELECT id_venta, estado, mesa_numero, total FROM ventas WHERE id_venta = $1';
      const estadoResult = await client.query(estadoQuery, [venta.id_venta]);
      logger.debug('Backend: Estado de venta después de crear:', estadoResult.rows[0]);
      logger.debug('Backend: === FIN VERIFICACIÓN ===');

      // Crear detalle de venta
      logger.info('Backend: Creating detalles with items for venta ID:', venta.id_venta, 'items:', items);
      detalles = await Venta.createDetalleVenta(
        venta.id_venta,
        items.map(item => ({
          id_producto: item.id_producto,
          cantidad: item.cantidad,
          precio_unitario: item.precio_unitario,
          observaciones: item.observaciones || null
        })),
        client
      );
      logger.info('Backend: Detalles created successfully:', detalles);
      
      await client.query('COMMIT');
      
      // Verificar el estado final después del commit
      logger.debug('Backend: === VERIFICANDO ESTADO FINAL ===');
      const estadoFinalQuery = 'SELECT id_venta, estado, mesa_numero, total FROM ventas WHERE id_venta = $1';
      const estadoFinalResult = await db.query(estadoFinalQuery, [venta.id_venta]);
      logger.debug('Backend: Estado final de venta:', estadoFinalResult.rows[0]);
      logger.debug('Backend: === FIN VERIFICACIÓN FINAL ===');
      
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Backend: Error in transaction:', error.message);
      logger.error('Backend: Stack trace:', error.stack);
      return res.status(500).json({ message: 'Error al crear la venta y sus detalles.' });
    } finally {
      client.release();
    }

    // Si hay datos de factura, crear factura
    let factura = null;
    if (invoiceData && invoiceData.nit && invoiceData.businessName) {
      const query = `
        INSERT INTO facturas (numero, nit_cliente, razon_social, total, fecha, id_venta)
        VALUES ($1, $2, $3, $4, NOW(), $5)
        RETURNING *;
      `;
      const numero = 'F-' + Date.now();
      const values = [numero, invoiceData.nit, invoiceData.businessName, total, venta.id_venta];
      const { rows } = await db.query(query, values);
      factura = rows[0];
    }

    res.status(201).json({
      message: 'Venta registrada exitosamente',
      venta,
      detalles,
      factura
    });
  } catch (error) {
    logger.error('Error al registrar venta (general catch):', error.message);
    logger.error('Backend: Stack trace (general catch):', error.stack);
    next(error);
  }
};

exports.getPedidosParaCocina = async (req, res, next) => {
  try {
    const query = `
      SELECT
          v.id_venta,
          v.fecha,
          v.mesa_numero,
          v.tipo_servicio,
          v.estado,
          v.total,
          json_agg(
              json_build_object(
                  'id_producto', p.id_producto,
                  'nombre_producto', p.nombre,
                  'cantidad', dv.cantidad,
                  'precio_unitario', dv.precio_unitario,
                  'observaciones', dv.observaciones
              )
          ) AS productos
      FROM
          ventas v
      JOIN
          detalle_ventas dv ON v.id_venta = dv.id_venta
      JOIN
          productos p ON dv.id_producto = p.id_producto
      WHERE
          v.estado IN ('recibido', 'en_preparacion', 'listo_para_servir')
      GROUP BY
          v.id_venta, v.fecha, v.mesa_numero, v.tipo_servicio, v.estado, v.total
      ORDER BY
          v.fecha ASC;
    `;
    const { rows } = await db.query(query);
    logger.info('Pedidos para cocina obtenidos exitosamente.');
    res.status(200).json({ data: rows });
  } catch (error) {
    logger.error('Error al obtener pedidos para cocina:', error);
    next(error);
  }
};

exports.actualizarEstadoPedido = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    logger.info('Backend: Updating order status:', { id, estado, user: req.user });

    // Validar que el estado sea uno de los permitidos
    const estadosPermitidos = ['recibido', 'en_preparacion', 'listo_para_servir', 'entregado', 'cancelado'];
    if (!estadosPermitidos.includes(estado)) {
      logger.warn('Backend: Invalid status:', estado);
      return res.status(400).json({ message: 'Estado de pedido no válido.' });
    }

    const query = `
      UPDATE ventas
      SET estado = $1
      WHERE id_venta = $2
      RETURNING id_venta, estado;
    `;
    logger.debug('Backend: Executing query:', query, [estado, id]);
    const { rows } = await db.query(query, [estado, id]);

    logger.debug('Backend: Query result:', rows);

    if (rows.length === 0) {
      logger.warn('Backend: Order not found:', id);
      return res.status(404).json({ message: 'Pedido no encontrado.' });
    }

    logger.info('Backend: Order updated successfully:', rows[0]);
    res.status(200).json({ message: 'Estado del pedido actualizado exitosamente.', data: rows[0] });
  } catch (error) {
    logger.error('Backend: Error al actualizar estado del pedido:', error);
    next(error);
  }
};

exports.getArqueoData = async (req, res, next) => {
  try {
    logger.info('Backend: getArqueoData called with user:', req.user);
    logger.info('Backend: getArqueoData query params:', req.query);
    
    const { startDate, endDate, sucursal } = req.query;
    
    // Verificar que el usuario esté autenticado
    if (!req.user) {
      logger.warn('Backend: User not authenticated for arqueo data.');
      return res.status(401).json({ message: 'Usuario no autenticado.' });
    }
    
    // Determinar qué sucursal usar
    let id_sucursal = req.user.id_sucursal; // Default: sucursal del usuario
    
    // Si es admin y se especifica una sucursal, usar esa
    if (req.user.rol === 'admin' && sucursal) {
      id_sucursal = parseInt(sucursal);
      logger.info('Backend: Admin user using specified sucursal:', id_sucursal);
    }
    // Si no es admin, siempre usar su sucursal asignada
    else if (req.user.rol !== 'admin') {
      logger.info('Backend: Non-admin user using assigned sucursal:', id_sucursal);
    }

    if (!startDate || !endDate) {
      logger.warn('Backend: Missing startDate or endDate for arqueo data.');
      return res.status(400).json({ message: 'Fechas de inicio y fin son requeridas.' });
    }

    logger.info('Backend: Calling Venta.getSalesSummary with:', { startDate, endDate, id_sucursal });
    const salesSummary = await Venta.getSalesSummary(startDate, endDate, id_sucursal);
    logger.info('Backend: Sales summary result:', salesSummary);
    
    logger.info('Backend: Calling Venta.getDailyCashFlow with:', { startDate, endDate, id_sucursal });
    const dailyCashFlow = await Venta.getDailyCashFlow(startDate, endDate, id_sucursal);
    logger.info('Backend: Daily cash flow result:', dailyCashFlow);

    // Si no hay datos y el usuario no es admin, verificar si hay datos en otras sucursales
    if ((!salesSummary || salesSummary.length === 0) && (!dailyCashFlow || dailyCashFlow.length === 0)) {
      if (req.user.rol !== 'admin') {
        logger.info('Backend: No data found for user sucursal, checking other sucursales for admin view');
        
        // Para usuarios no-admin, también obtener datos de todas las sucursales para mostrar
        const allSalesSummary = await Venta.getSalesSummary(startDate, endDate, null);
        const allDailyCashFlow = await Venta.getDailyCashFlow(startDate, endDate, null);
        
        logger.info('Backend: Sending arqueo response with no data warning');
        res.status(200).json({
          message: 'No se encontraron datos para su sucursal en el período especificado.',
          data: {
            salesSummary: salesSummary || [],
            dailyCashFlow: dailyCashFlow || [],
            allSalesSummary: allSalesSummary || [],
            allDailyCashFlow: allDailyCashFlow || [],
            userSucursal: id_sucursal
          }
        });
        return;
      }
    }

    logger.info('Backend: Sending arqueo response');
    res.status(200).json({
      message: 'Datos de arqueo obtenidos exitosamente.',
      data: {
        salesSummary,
        dailyCashFlow,
        userSucursal: id_sucursal
      }
    });
  } catch (error) {
    logger.error('Backend: Error al obtener datos de arqueo:', error);
    next(error);
  }
};

exports.getVentasOrdenadas = async (req, res, next) => {
  try {
    const { limit = 50 } = req.query;
    
    // Verificar que el usuario esté autenticado
    if (!req.user) {
      logger.warn('Backend: User not authenticated for getVentasOrdenadas.');
      return res.status(401).json({ message: 'Usuario no autenticado.' });
    }
    
    // Obtener sucursal del usuario o del query string
    let id_sucursal = req.user.id_sucursal;
    if (req.query.sucursal) {
      id_sucursal = parseInt(req.query.sucursal);
    }
    
    const ventas = await Venta.getVentasOrdenadas(parseInt(limit), id_sucursal);
    
    logger.info('Ventas ordenadas obtenidas exitosamente.');
    res.status(200).json({
      message: 'Ventas obtenidas exitosamente.',
      data: ventas
    });
  } catch (error) {
    logger.error('Error al obtener ventas ordenadas:', error);
    next(error);
  }
};

exports.verificarFechasVentas = async (req, res, next) => {
  try {
    const fechas = await Venta.verificarFechasVentas();
    
    logger.info('Verificación de fechas completada.');
    res.status(200).json({
      message: 'Verificación de fechas completada.',
      data: fechas
    });
  } catch (error) {
    logger.error('Error al verificar fechas de ventas:', error);
    next(error);
  }
};

exports.getVentasPorFecha = async (req, res, next) => {
  try {
    const ventas = await Venta.getVentasPorFecha();
    
    logger.info('Ventas ordenadas por fecha obtenidas exitosamente.');
    res.status(200).json({
      message: 'Ventas ordenadas por fecha obtenidas exitosamente.',
      data: ventas
    });
  } catch (error) {
    logger.error('Error al obtener ventas por fecha:', error);
    next(error);
  }
};

exports.verificarDuplicadosFecha = async (req, res, next) => {
  try {
    const duplicados = await Venta.verificarDuplicadosFecha();
    
    logger.info('Verificación de duplicados por fecha completada.');
    res.status(200).json({
      message: 'Verificación de duplicados por fecha completada.',
      data: duplicados
    });
  } catch (error) {
    logger.error('Error al verificar duplicados por fecha:', error);
    next(error);
  }
};

exports.corregirFechasVentas = async (req, res, next) => {
  try {
    const updates = await Venta.corregirFechasVentas();
    
    logger.info('Fechas de ventas corregidas exitosamente.');
    res.status(200).json({
      message: 'Fechas de ventas corregidas exitosamente.',
      data: updates
    });
  } catch (error) {
    logger.error('Error al corregir fechas de ventas:', error);
    next(error);
  }
};

exports.getVentasHoy = async (req, res, next) => {
  try {
    logger.info('Backend: getVentasHoy called');
    
    // Verificar que el usuario esté autenticado
    if (!req.user) {
      logger.warn('Backend: User not authenticated for getVentasHoy.');
      return res.status(401).json({ message: 'Usuario no autenticado.' });
    }
    
    // Obtener sucursal del usuario o del query string
    let id_sucursal = req.user.id_sucursal;
    if (req.query.sucursal) {
      id_sucursal = parseInt(req.query.sucursal);
    }
    
    const { fecha } = req.query; // Obtener fecha opcional del query
    
    // Si no se proporciona fecha, usar hoy
    const fechaConsulta = fecha || new Date().toISOString().split('T')[0];
    
    const ventas = await Venta.getVentasHoy(id_sucursal, fechaConsulta);
    
    res.status(200).json({
      message: 'Ventas obtenidas exitosamente.',
      data: ventas
    });
  } catch (error) {
    logger.error('Error al obtener ventas de hoy:', error);
    next(error);
  }
};

// Cerrar mesa con facturación
exports.cerrarMesaConFactura = async (req, res, next) => {
  try {
    const { mesa_numero, id_sucursal, paymentMethod, invoiceData } = req.body;
    const id_vendedor = req.user.id;

    if (!mesa_numero || !id_sucursal || !paymentMethod) {
      logger.warn('Número de mesa, sucursal y método de pago son requeridos para cerrar mesa con factura.');
      return res.status(400).json({ 
        message: 'Número de mesa, sucursal y método de pago son requeridos.' 
      });
    }

    // Obtener mesa y verificar estado
    const mesa = await Mesa.getMesaByNumero(mesa_numero, id_sucursal);
    if (!mesa) {
      logger.warn(`Mesa ${mesa_numero} no encontrada para cerrar con factura.`);
      return res.status(404).json({ message: 'Mesa no encontrada.' });
    }

    if (mesa.estado !== 'en_uso') {
      logger.warn(`Intento de cerrar mesa ${mesa_numero} que no está en uso. Estado actual: ${mesa.estado}`);
      return res.status(400).json({ 
        message: `La mesa ${mesa_numero} no está en uso. Estado actual: ${mesa.estado}` 
      });
    }

    // Obtener sucursal y método de pago
    const sucursalResult = await db.query('SELECT * FROM sucursales WHERE id_sucursal = $1 LIMIT 1', [id_sucursal]);
    const sucursal = sucursalResult.rows[0];
    if (!sucursal) {
      logger.warn('Sucursal no encontrada para cerrar mesa con factura.');
      return res.status(400).json({ message: 'Sucursal no encontrada' });
    }
    
    const pagoResult = await db.query('SELECT * FROM metodos_pago WHERE descripcion = $1 LIMIT 1', [paymentMethod]);
    const pago = pagoResult.rows[0];
    if (!pago) {
      logger.warn('Método de pago no encontrado para cerrar mesa con factura.');
      return res.status(400).json({ message: 'Método de pago no encontrado' });
    }

    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      // Crear venta final con el total acumulado
      const ventaFinal = await Venta.createVenta({
        id_vendedor: id_vendedor,
        id_pago: pago.id_pago,
        id_sucursal: sucursal.id_sucursal,
        tipo_servicio: 'Mesa',
        total: mesa.total_acumulado,
        mesa_numero: mesa_numero
      }, client);

      // Cerrar la mesa
      const mesaCerrada = await Mesa.cerrarMesa(mesa.id_mesa, client);

      // Cerrar prefactura si existe
      const prefactura = await Mesa.getPrefacturaByMesa(mesa.id_mesa);
      if (prefactura) {
        await Mesa.cerrarPrefactura(prefactura.id_prefactura, mesa.total_acumulado, client);
      }

      // Si hay datos de factura, crear factura
      let factura = null;
      if (invoiceData && invoiceData.nit && invoiceData.businessName) {
        const query = `
          INSERT INTO facturas (numero, nit_cliente, razon_social, total, fecha, id_venta)
          VALUES ($1, $2, $3, $4, NOW(), $5)
          RETURNING *;
        `;
        const numero = 'F-' + Date.now();
        const values = [numero, invoiceData.nit, invoiceData.businessName, mesa.total_acumulado, ventaFinal.id_venta];
        const { rows } = await client.query(query, values);
        factura = rows[0];
      }

      await client.query('COMMIT');
      logger.info(`Mesa ${mesa_numero} cerrada y facturada exitosamente. Venta ID: ${ventaFinal.id_venta}`);

      res.status(200).json({
        message: `Mesa ${mesa_numero} cerrada y facturada exitosamente.`,
        data: {
          mesa: mesaCerrada,
          venta_final: ventaFinal,
          total_final: mesa.total_acumulado,
          factura: factura
        }
      });

    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error al cerrar mesa con facturación (transacción):', error);
      return res.status(500).json({ message: 'Error al cerrar la mesa.' });
    } finally {
      client.release();
    }

  } catch (error) {
    logger.error('Error al cerrar mesa con facturación (general):', error);
    next(error);
  }
};

/**
 * Actualiza el estado de una venta
 * PATCH /api/v1/ventas/:id/estado
 */
exports.updateEstadoVenta = async (req, res, next) => {
  const { id } = req.params;
  const { estado } = req.body;
  const user = req.user;
  const ventaId = parseInt(id, 10);
  try {
    if (!estado) {
      return res.status(400).json({ message: 'El campo "estado" es requerido.' });
    }
    // Validar permisos adicionales si es necesario (ej: solo cocinero puede pasar a "en_preparacion")
    // ...
    const updated = await Venta.updateEstadoVenta(ventaId, estado);
    logger.info(`Venta ${ventaId} actualizada a estado: ${estado} por usuario ${user?.username || 'desconocido'}`);
    res.status(200).json({
      message: 'Estado de venta actualizado correctamente.',
      data: updated
    });
  } catch (error) {
    logger.error('Error al actualizar estado de venta:', error.message);
    res.status(400).json({ message: error.message });
  }
};