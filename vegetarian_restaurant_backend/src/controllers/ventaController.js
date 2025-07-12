const Venta = require('../models/ventaModel');
const Mesa = require('../models/mesaModel');
const db = require('../config/database');
const logger = require('../config/logger'); // Importar el logger

// Utilidades para mapear nombres a ids
async function getIdByField(table, field, value, id_restaurante) {
  try {
    logger.debug(`getIdByField: Buscando en tabla ${table}, campo ${field}, valor ${value}, id_restaurante ${id_restaurante}`);
    
    // Usar consultas específicas para cada tabla
    let query;
    let params = [value];

    if (table === 'vendedores') {
      query = 'SELECT * FROM vendedores WHERE username = $1 AND id_restaurante = $2 LIMIT 1';
      params.push(id_restaurante);
    } else if (table === 'sucursales') {
      query = 'SELECT * FROM sucursales WHERE nombre = $1 AND id_restaurante = $2 LIMIT 1';
      params.push(id_restaurante);
    } else if (table === 'metodos_pago') {
      query = 'SELECT * FROM metodos_pago WHERE descripcion = $1 AND id_restaurante = $2 LIMIT 1';
      params.push(id_restaurante);
    } else {
      // Para otras tablas, asumimos que 'field' es el nombre de la columna y que id_restaurante es el segundo parámetro
      query = `SELECT * FROM ${table} WHERE ${field} = $1 AND id_restaurante = $2 LIMIT 1`;
      params.push(id_restaurante);
    }
    
    logger.debug(`getIdByField: Query: ${query}`);
    const { rows } = await db.query(query, params);
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
    logger.info('Backend: User from token:', req.user);
    
    // Log completo del request para debugging
    console.log('=== DEBUG: CREATE VENTA ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('User from token:', JSON.stringify(req.user, null, 2));
    console.log('Headers:', req.headers);
    console.log('=== END DEBUG ===');
    
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
    const id_restaurante = req.user.id_restaurante; // Obtener id_restaurante del usuario autenticado

    logger.info('Backend: Parsed data:', { items, total, paymentMethod, cashier, branch, tipo_servicio, mesa_numero, id_restaurante });

    // Mapear a ids
    // Buscar vendedor directamente - usar ID del usuario si está disponible
    let vendedor;
    if (req.user.id_vendedor && req.user.username === cashier) {
      // Si el usuario autenticado es el mismo que está haciendo la venta, usar su ID
      const vendedorResult = await db.query('SELECT * FROM vendedores WHERE id_vendedor = $1 AND id_restaurante = $2 LIMIT 1', [req.user.id_vendedor, id_restaurante]);
      vendedor = vendedorResult.rows[0];
      logger.info('Backend: Vendedor found by ID:', vendedor);
    }
    
    // Si no se encontró por ID o no es el mismo usuario, buscar por username
    if (!vendedor) {
      const vendedorResult = await db.query('SELECT * FROM vendedores WHERE username = $1 AND id_restaurante = $2 LIMIT 1', [cashier, id_restaurante]);
      vendedor = vendedorResult.rows[0];
      logger.info('Backend: Vendedor found by username:', vendedor);
    }
    
    if (!vendedor) return res.status(400).json({ message: 'Cajero no encontrado' });
    
    // Buscar sucursal directamente - usar ID de sucursal del usuario si está disponible
    let sucursal;
    if (req.user.id_sucursal) {
      // Si tenemos el ID de sucursal del usuario, usarlo directamente
      const sucursalResult = await db.query('SELECT * FROM sucursales WHERE id_sucursal = $1 AND id_restaurante = $2 LIMIT 1', [req.user.id_sucursal, id_restaurante]);
      sucursal = sucursalResult.rows[0];
      logger.info('Backend: Sucursal found by ID:', sucursal);
    }
    
    // Si no se encontró por ID o no hay ID, buscar por nombre
    if (!sucursal) {
      const sucursalResult = await db.query('SELECT * FROM sucursales WHERE nombre = $1 AND id_restaurante = $2 LIMIT 1', [branch, id_restaurante]);
      sucursal = sucursalResult.rows[0];
      logger.info('Backend: Sucursal found by name:', sucursal);
    }
    
    // Si aún no se encontró, buscar por nombre similar (case insensitive)
    if (!sucursal) {
      const sucursalResult = await db.query('SELECT * FROM sucursales WHERE LOWER(nombre) LIKE LOWER($1) AND id_restaurante = $2 LIMIT 1', [`%${branch}%`, id_restaurante]);
      sucursal = sucursalResult.rows[0];
      logger.info('Backend: Sucursal found by similar name:', sucursal);
    }
    
    if (!sucursal) {
      logger.error('Backend: Sucursal no encontrada. Branch enviado:', branch, 'ID restaurante:', id_restaurante);
      logger.error('Backend: Usuario ID sucursal:', req.user.id_sucursal);
      
      // Mostrar sucursales disponibles para debugging
      const availableSucursales = await db.query('SELECT id_sucursal, nombre FROM sucursales WHERE id_restaurante = $1 AND activo = true', [id_restaurante]);
      logger.error('Backend: Sucursales disponibles:', availableSucursales.rows);
      
      return res.status(400).json({ 
        message: 'Sucursal no encontrada',
        availableSucursales: availableSucursales.rows.map(s => ({ id: s.id_sucursal, nombre: s.nombre }))
      });
    }
    
    // Buscar método de pago directamente
    logger.info('Backend: Searching for payment method:', paymentMethod, 'in restaurant:', id_restaurante);
    const pagoResult = await db.query('SELECT * FROM metodos_pago WHERE descripcion = $1 AND id_restaurante = $2 LIMIT 1', [paymentMethod, id_restaurante]);
    const pago = pagoResult.rows[0];
    logger.info('Backend: Pago found:', pago);
    if (!pago) {
      logger.error('Backend: Payment method not found. Available methods:');
      const allMethodsResult = await db.query('SELECT descripcion FROM metodos_pago WHERE id_restaurante = $1', [id_restaurante]);
      logger.error('Backend: Available methods:', allMethodsResult.rows);
      return res.status(400).json({ message: 'Método de pago no encontrado' });
    }

    // Crear venta y detalles en una transacción
    logger.info('Backend: Creating venta with:', {
      id_vendedor: vendedor.id_vendedor,
      id_pago: pago.id_pago,
      id_sucursal: sucursal.id_sucursal,
      tipo_servicio,
      total,
      mesa_numero,
      id_restaurante
    });
    
    console.log('=== DEBUG: VENTA DATA ===');
    console.log('Vendedor ID:', vendedor.id_vendedor);
    console.log('Pago ID:', pago.id_pago);
    console.log('Sucursal ID:', sucursal.id_sucursal);
    console.log('Tipo servicio:', tipo_servicio);
    console.log('Total:', total);
    console.log('Mesa número:', mesa_numero);
    console.log('Restaurante ID:', id_restaurante);
    console.log('=== END DEBUG ===');
    
    let venta;
    let detalles;
    let mesaActualizada = null;

    // --- VERIFICACIÓN DE MESA ANTES DE LA TRANSACCIÓN ---
    let mesa = null;
    if (tipo_servicio === 'Mesa' && mesa_numero) {
      logger.info('Backend: Verificando mesa:', mesa_numero);
      mesa = await Mesa.getMesaByNumero(mesa_numero, sucursal.id_sucursal, id_restaurante);
      if (!mesa) {
        // Obtener mesas disponibles para mostrar al usuario
        const mesasDisponibles = await db.query(
          'SELECT numero FROM mesas WHERE id_sucursal = $1 AND id_restaurante = $2 AND activo = true ORDER BY numero',
          [sucursal.id_sucursal, id_restaurante]
        );
        const numerosMesas = mesasDisponibles.rows.map(m => m.numero).join(', ');
        return res.status(400).json({
          message: `Mesa ${mesa_numero} no encontrada en la sucursal "${sucursal.nombre}".`,
          details: `Mesas disponibles: ${numerosMesas || 'Ninguna mesa configurada'}`,
          errorType: 'MESA_NO_ENCONTRADA',
          mesaSolicitada: mesa_numero,
          sucursal: sucursal.nombre
        });
      }
      if (mesa.estado !== 'libre' && mesa.estado !== 'en_uso') {
        const estadoDescripcion = {
          'libre': 'disponible',
          'en_uso': 'ocupada',
          'pendiente_cobro': 'pendiente de cobro',
          'reservada': 'reservada',
          'mantenimiento': 'en mantenimiento'
        };
        return res.status(400).json({
          message: `Mesa ${mesa_numero} no está disponible en este momento.`,
          details: `Estado actual: ${estadoDescripcion[mesa.estado] || mesa.estado}`,
          errorType: 'MESA_NO_DISPONIBLE',
          mesaSolicitada: mesa_numero,
          estadoActual: mesa.estado,
          sucursal: sucursal.nombre
        });
      }
    }
    // --- FIN VERIFICACIÓN DE MESA ---
    
    console.log('=== DEBUG: CONNECTING TO DB ===');
    const client = await db.pool.connect();
    console.log('=== DEBUG: DB CONNECTED ===');
    try {
      console.log('=== DEBUG: STARTING TRANSACTION ===');
      await client.query('BEGIN');
      console.log('=== DEBUG: TRANSACTION STARTED ===');
      
      // Si es venta por mesa, actualizar estado de mesa
      if (tipo_servicio === 'Mesa' && mesa_numero) {
        if (mesa.estado === 'libre') {
          // Si la mesa está libre, abrirla
          logger.info('Backend: Abriendo mesa:', mesa_numero);
          mesaActualizada = await Mesa.abrirMesa(mesa_numero, sucursal.id_sucursal, vendedor.id_vendedor, id_restaurante, client);
          // Crear prefactura
          await Mesa.crearPrefactura(mesaActualizada.id_mesa, null, id_restaurante, client);
        } else if (mesa.estado === 'en_uso') {
          // Si la mesa está en uso, actualizar total acumulado
          logger.info('Backend: Mesa en uso, actualizando total acumulado');
          const nuevoTotal = mesa.total_acumulado + total;
          mesaActualizada = await Mesa.actualizarTotalAcumulado(mesa.id_mesa, nuevoTotal, id_restaurante, client);
        }
      }
      
      // Crear venta
      venta = await Venta.createVenta({
        id_vendedor: vendedor.id_vendedor,
        id_pago: pago.id_pago,
        id_sucursal: sucursal.id_sucursal,
        tipo_servicio,
        total,
        mesa_numero,
        id_restaurante // Pasar id_restaurante a createVenta
      }, client);
      logger.info('Backend: Venta created successfully:', venta);
      
      if (!venta || !venta.id_venta) {
        throw new Error('No se pudo obtener el ID de la venta principal.');
      }

      // Si es venta por mesa, asignar la venta a la mesa
      if (tipo_servicio === 'Mesa' && mesa_numero && mesaActualizada) {
        await Mesa.asignarVentaAMesa(mesaActualizada.id_mesa, venta.id_venta, id_restaurante, client);
      }

      // Verificar el estado de la venta después de crearla
      logger.debug('Backend: === VERIFICANDO ESTADO DE VENTA ===');
      const estadoQuery = 'SELECT id_venta, estado, mesa_numero, total, id_restaurante FROM ventas WHERE id_venta = $1 AND id_restaurante = $2';
      const estadoResult = await client.query(estadoQuery, [venta.id_venta, id_restaurante]);
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
        id_restaurante, // Pasar id_restaurante a createDetalleVenta
        client
      );
      logger.info('Backend: Detalles created successfully:', detalles);
      
      await client.query('COMMIT');
      
      // Verificar el estado final después del commit
      logger.debug('Backend: === VERIFICANDO ESTADO FINAL ===');
      const estadoFinalQuery = 'SELECT id_venta, estado, mesa_numero, total, id_restaurante FROM ventas WHERE id_venta = $1 AND id_restaurante = $2';
      const estadoFinalResult = await db.query(estadoFinalQuery, [venta.id_venta, id_restaurante]);
      logger.debug('Backend: Estado final de venta:', estadoFinalResult.rows[0]);
      logger.debug('Backend: === FIN VERIFICACIÓN FINAL ===');
      
    } catch (error) {
      console.log('=== DEBUG: ERROR IN TRANSACTION ===');
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      console.error('Error code:', error.code);
      console.error('Error detail:', error.detail);
      console.log('=== END DEBUG ===');
      
      await client.query('ROLLBACK');
      logger.error('Backend: Error in transaction:', error.message);
      logger.error('Backend: Stack trace:', error.stack);
      return res.status(500).json({ 
        message: 'Error al crear la venta y sus detalles.',
        error: error.message,
        details: error.detail || error.code
      });
    } finally {
      client.release();
    }

    // Si hay datos de factura, crear factura
    let factura = null;
    if (invoiceData && invoiceData.nit && invoiceData.businessName) {
      const query = `
        INSERT INTO facturas (numero, nit_cliente, razon_social, total, fecha, id_venta, id_restaurante)
        VALUES ($1, $2, $3, $4, NOW(), $5, $6)
        RETURNING *;
      `;
      const numero = 'F-' + Date.now();
      const values = [numero, invoiceData.nit, invoiceData.businessName, total, venta.id_venta, id_restaurante];
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
    console.log('=== DEBUG: GENERAL ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error code:', error.code);
    console.error('Error detail:', error.detail);
    console.log('=== END DEBUG ===');
    
    logger.error('Error al registrar venta (general catch):', error.message);
    logger.error('Backend: Stack trace (general catch):', error.stack);
    next(error);
  }
};

exports.getPedidosParaCocina = async (req, res, next) => {
  try {
    const id_restaurante = req.user.id_restaurante; // Obtener id_restaurante del usuario autenticado

    const query = `
      SELECT
          v.id_venta,
          v.fecha,
          v.mesa_numero,
          v.tipo_servicio,
          v.estado,
          v.total,
          v.id_sucursal,
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
          v.estado IN ('recibido', 'en_preparacion', 'listo_para_servir') AND v.id_restaurante = $1
      GROUP BY
          v.id_venta, v.fecha, v.mesa_numero, v.tipo_servicio, v.estado, v.total, v.id_sucursal
      ORDER BY
          v.fecha ASC;
    `;
    const { rows } = await db.query(query, [id_restaurante]);
    logger.info('Pedidos para cocina obtenidos exitosamente.', { id_restaurante });
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
    const id_restaurante = req.user.id_restaurante; // Obtener id_restaurante del usuario autenticado

    logger.info('Backend: Updating order status:', { id, estado, user: req.user, id_restaurante });

    // Validar que el estado sea uno de los permitidos
    const estadosPermitidos = ['recibido', 'en_preparacion', 'listo_para_servir', 'entregado', 'cancelado'];
    if (!estadosPermitidos.includes(estado)) {
      logger.warn('Backend: Invalid status:', estado);
      return res.status(400).json({ message: 'Estado de pedido no válido.' });
    }

    const query = `
      UPDATE ventas
      SET estado = $1
      WHERE id_venta = $2 AND id_restaurante = $3
      RETURNING id_venta, estado, id_restaurante;
    `;
    logger.debug('Backend: Executing query:', query, [estado, id, id_restaurante]);
    const { rows } = await db.query(query, [estado, id, id_restaurante]);

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
    const id_restaurante = req.user.id_restaurante; // Obtener id_restaurante del usuario autenticado

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

    logger.info('Backend: Calling Venta.getSalesSummary with:', { startDate, endDate, id_restaurante, id_sucursal });
    const salesSummary = await Venta.getSalesSummary(startDate, endDate, id_restaurante, id_sucursal);
    logger.info('Backend: Sales summary result:', salesSummary);
    
    logger.info('Backend: Calling Venta.getDailyCashFlow with:', { startDate, endDate, id_restaurante, id_sucursal });
    const dailyCashFlow = await Venta.getDailyCashFlow(startDate, endDate, id_restaurante, id_sucursal);
    logger.info('Backend: Daily cash flow result:', dailyCashFlow);

    // Si no hay datos y el usuario no es admin, verificar si hay datos en otras sucursales
    if ((!salesSummary || salesSummary.length === 0) && (!dailyCashFlow || dailyCashFlow.length === 0)) {
      if (req.user.rol !== 'admin') {
        logger.info('Backend: No data found for user sucursal, checking other sucursales for admin view');
        
        // Para usuarios no-admin, también obtener datos de todas las sucursales para mostrar
        const allSalesSummary = await Venta.getSalesSummary(startDate, endDate, id_restaurante, null);
        const allDailyCashFlow = await Venta.getDailyCashFlow(startDate, endDate, id_restaurante, null);
        
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
    const id_restaurante = req.user.id_restaurante; // Obtener id_restaurante del usuario autenticado

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
    
    const ventas = await Venta.getVentasOrdenadas(id_restaurante, parseInt(limit), id_sucursal);
    
    logger.info('Ventas ordenadas obtenidas exitosamente.', { id_restaurante });
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
    const id_restaurante = req.user.id_restaurante; // Obtener id_restaurante del usuario autenticado
    const fechas = await Venta.verificarFechasVentas(id_restaurante);
    
    logger.info('Verificación de fechas completada.', { id_restaurante });
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
    const id_restaurante = req.user.id_restaurante; // Obtener id_restaurante del usuario autenticado
    const ventas = await Venta.getVentasPorFecha(id_restaurante);
    
    logger.info('Ventas ordenadas por fecha obtenidas exitosamente.', { id_restaurante });
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
    const id_restaurante = req.user.id_restaurante; // Obtener id_restaurante del usuario autenticado
    const duplicados = await Venta.verificarDuplicadosFecha(id_restaurante);
    
    logger.info('Verificación de duplicados por fecha completada.', { id_restaurante });
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
    const id_restaurante = req.user.id_restaurante; // Obtener id_restaurante del usuario autenticado
    const updates = await Venta.corregirFechasVentas(id_restaurante);
    
    logger.info('Fechas de ventas corregidas exitosamente.', { id_restaurante });
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
    
    const id_restaurante = req.user.id_restaurante; // Obtener id_restaurante del usuario autenticado

    // Obtener sucursal del usuario o del query string
    let id_sucursal = req.user.id_sucursal;
    if (req.query.sucursal) {
      id_sucursal = parseInt(req.query.sucursal);
    }
    
    const { fecha } = req.query; // Obtener fecha opcional del query
    
    // Si no se proporciona fecha, usar hoy
    const fechaConsulta = fecha || new Date().toISOString().split('T')[0];
    
    const ventas = await Venta.getVentasHoy(id_restaurante, id_sucursal, fechaConsulta);
    
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
    const id_restaurante = req.user.id_restaurante; // Obtener id_restaurante del usuario autenticado

    if (!mesa_numero || !id_sucursal || !paymentMethod) {
      logger.warn('Número de mesa, sucursal y método de pago son requeridos para cerrar mesa con factura.');
      return res.status(400).json({ 
        message: 'Número de mesa, sucursal y método de pago son requeridos.' 
      });
    }

    // Obtener mesa y verificar estado
    const mesa = await Mesa.getMesaByNumero(mesa_numero, id_sucursal, id_restaurante);
    if (!mesa) {
      logger.warn(`Mesa ${mesa_numero} no encontrada para cerrar con factura en el restaurante ${id_restaurante}.`);
      return res.status(404).json({ message: 'Mesa no encontrada.' });
    }

    if (mesa.estado !== 'en_uso') {
      logger.warn(`Intento de cerrar mesa ${mesa_numero} que no está en uso. Estado actual: ${mesa.estado}`);
      return res.status(400).json({ 
        message: `La mesa ${mesa_numero} no está en uso. Estado actual: ${mesa.estado}` 
      });
    }

    // Obtener sucursal y método de pago
    const sucursalResult = await db.query('SELECT * FROM sucursales WHERE id_sucursal = $1 AND id_restaurante = $2 LIMIT 1', [id_sucursal, id_restaurante]);
    const sucursal = sucursalResult.rows[0];
    if (!sucursal) {
      logger.warn('Sucursal no encontrada para cerrar mesa con factura.');
      return res.status(400).json({ message: 'Sucursal no encontrada' });
    }
    
    const pagoResult = await db.query('SELECT * FROM metodos_pago WHERE descripcion = $1 AND id_restaurante = $2 LIMIT 1', [paymentMethod, id_restaurante]);
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
        mesa_numero: mesa_numero,
        id_restaurante: id_restaurante // Pasar id_restaurante a createVenta
      }, client);

      // Cerrar la mesa
      const mesaCerrada = await Mesa.cerrarMesa(mesa.id_mesa, id_restaurante, client);

      // Cerrar prefactura si existe
      const prefactura = await Mesa.getPrefacturaByMesa(mesa.id_mesa, id_restaurante);
      if (prefactura) {
        await Mesa.cerrarPrefactura(prefactura.id_prefactura, mesa.total_acumulado, id_restaurante, client);
      }

      // Si hay datos de factura, crear factura
      let factura = null;
      if (invoiceData && invoiceData.nit && invoiceData.businessName) {
        const query = `
          INSERT INTO facturas (numero, nit_cliente, razon_social, total, fecha, id_venta, id_restaurante)
          VALUES ($1, $2, $3, $4, NOW(), $5, $6)
          RETURNING *;
        `;
        const numero = 'F-' + Date.now();
        const values = [numero, invoiceData.nit, invoiceData.businessName, mesa.total_acumulado, ventaFinal.id_venta, id_restaurante];
        const { rows } = await client.query(query, values);
        factura = rows[0];
      }

      await client.query('COMMIT');
      logger.info(`Mesa ${mesa_numero} cerrada y facturada exitosamente para el restaurante ${id_restaurante}. Venta ID: ${ventaFinal.id_venta}`);

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
  const id_restaurante = req.user.id_restaurante; // Obtener id_restaurante del usuario autenticado

  try {
    if (!estado) {
      return res.status(400).json({ message: 'El campo "estado" es requerido.' });
    }
    // Validar permisos adicionales si es necesario (ej: solo cocinero puede pasar a "en_preparacion")
    // ...
    const updated = await Venta.updateEstadoVenta(ventaId, estado, id_restaurante);
    logger.info(`Venta ${ventaId} actualizada a estado: ${estado} por usuario ${user?.username || 'desconocido'} para el restaurante ${id_restaurante}`);
    res.status(200).json({
      message: 'Estado de venta actualizado correctamente.',
      data: updated
    });
  } catch (error) {
    logger.error('Error al actualizar estado de venta:', error.message);
    res.status(400).json({ message: error.message });
  }
};