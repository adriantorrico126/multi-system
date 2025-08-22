const Venta = require('../models/ventaModel');
const Mesa = require('../models/mesaModel');
const { pool } = require('../config/database');
const logger = require('../config/logger'); // Importar el logger
const ModificadorModel = require('../models/modificadorModel');

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
    const { rows } = await pool.query(query, params);
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
    
    // Log extra: claims esperados
    if (!req.user) {
      logger.error('No se encontró req.user en la petición. Token inválido o no enviado.');
    } else {
      logger.info('Claims del usuario:', {
        id: req.user.id,
        id_vendedor: req.user.id_vendedor,
        username: req.user.username,
        rol: req.user.rol,
        id_sucursal: req.user.id_sucursal,
        id_restaurante: req.user.id_restaurante
      });
    }
    
    const {
      items,
      total,
      paymentMethod,
      cashier,
      branch,
      id_sucursal,
      tipo_servicio = 'Mesa',
      id_mesa = null,
      mesa_numero = null, // <-- Aceptar mesa_numero
      invoiceData
    } = req.body;
    const id_restaurante = req.user.id_restaurante; // Obtener id_restaurante del usuario autenticado

    logger.info('Backend: Parsed data:', { items, total, paymentMethod, cashier, branch, id_sucursal, tipo_servicio, id_mesa, mesa_numero, id_restaurante });

    // Buscar sucursal directamente - usar ID de sucursal del usuario si está disponible
    let sucursal;
    // Primero intentar con id_sucursal si está disponible
    if (id_sucursal) {
      const sucursalResult = await pool.query('SELECT * FROM sucursales WHERE id_sucursal = $1 AND id_restaurante = $2 LIMIT 1', [id_sucursal, id_restaurante]);
      sucursal = sucursalResult.rows[0];
      logger.info('Backend: Sucursal found by id_sucursal:', sucursal);
    }
    // Si no se encontró por id_sucursal, usar ID de sucursal del usuario si está disponible
    if (!sucursal && req.user.id_sucursal) {
      const sucursalResult = await pool.query('SELECT * FROM sucursales WHERE id_sucursal = $1 AND id_restaurante = $2 LIMIT 1', [req.user.id_sucursal, id_restaurante]);
      sucursal = sucursalResult.rows[0];
      logger.info('Backend: Sucursal found by user ID:', sucursal);
    }
    // Si no se encontró por ID, buscar por nombre
    if (!sucursal && branch) {
      const sucursalResult = await pool.query('SELECT * FROM sucursales WHERE nombre = $1 AND id_restaurante = $2 LIMIT 1', [branch, id_restaurante]);
      sucursal = sucursalResult.rows[0];
      logger.info('Backend: Sucursal found by name:', sucursal);
    }
    // Si aún no se encontró, buscar por nombre similar (case insensitive)
    if (!sucursal && branch) {
      const sucursalResult = await pool.query('SELECT * FROM sucursales WHERE LOWER(nombre) LIKE LOWER($1) AND id_restaurante = $2 LIMIT 1', [`%${branch}%`, id_restaurante]);
      sucursal = sucursalResult.rows[0];
      logger.info('Backend: Sucursal found by similar name:', sucursal);
    }
    if (!sucursal) {
      logger.error('Backend: Sucursal no encontrada. Branch enviado:', branch, 'ID sucursal enviado:', id_sucursal, 'ID restaurante:', id_restaurante);
      logger.error('Backend: Usuario ID sucursal:', req.user.id_sucursal);
      // Mostrar sucursales disponibles para debugging
      const availableSucursales = await pool.query('SELECT id_sucursal, nombre FROM sucursales WHERE id_restaurante = $1 AND activo = true', [id_restaurante]);
      logger.error('Backend: Sucursales disponibles:', availableSucursales.rows);
      return res.status(400).json({ 
        message: 'Sucursal no encontrada',
        availableSucursales: availableSucursales.rows.map(s => ({ id: s.id_sucursal, nombre: s.nombre }))
      });
    }

    // --- MOVER AQUÍ LA LÓGICA DE MESA ---
    let idMesaFinal = id_mesa;
    let mesa = null;
    if (tipo_servicio === 'Mesa' && !id_mesa && mesa_numero && sucursal.id_sucursal) {
      mesa = await Mesa.getMesaByNumero(mesa_numero, sucursal.id_sucursal, id_restaurante);
      if (!mesa) {
        logger.error(`[VENTA] No se encontró la mesa número ${mesa_numero} en la sucursal ${sucursal.id_sucursal} (restaurante ${id_restaurante})`);
        return res.status(400).json({
          message: `No se encontró la mesa número ${mesa_numero} en la sucursal seleccionada.`,
          errorType: 'MESA_NO_ENCONTRADA',
          mesaSolicitada: mesa_numero,
          sucursal: sucursal.id_sucursal
        });
      }
      idMesaFinal = mesa.id_mesa;
    }
    if (tipo_servicio === 'Mesa' && id_mesa) {
      mesa = await Mesa.getMesaById(id_mesa, sucursal.id_sucursal, id_restaurante);
    } else if (tipo_servicio === 'Mesa' && idMesaFinal) {
      mesa = await Mesa.getMesaById(idMesaFinal, sucursal.id_sucursal, id_restaurante);
    }
    // Validación final: si no se encontró la mesa, abortar
    if (tipo_servicio === 'Mesa' && (!mesa || !mesa.id_mesa)) {
      logger.error(`[VENTA] No se encontró la mesa (objeto: ${JSON.stringify(mesa)}) para mesa_numero: ${mesa_numero} en la sucursal ${sucursal.id_sucursal} (restaurante ${id_restaurante})`);
      return res.status(400).json({
        message: `No se encontró la mesa seleccionada.`,
        errorType: 'MESA_NO_ENCONTRADA',
        mesaSolicitada: mesa_numero || idMesaFinal,
        sucursal: sucursal.id_sucursal
      });
    }
    // Log explícito antes de crear la venta
    logger.info(`[VENTA] Mesa encontrada para venta: ${JSON.stringify(mesa)} (mesa_numero: ${mesa_numero})`);
    
    // Buscar vendedor/cajero
    let vendedor;
    if (req.user.id_vendedor && req.user.username === cashier) {
      // Buscar por id_vendedor
      const vendedorResult = await pool.query('SELECT * FROM vendedores WHERE id_vendedor = $1 AND id_restaurante = $2 LIMIT 1', [req.user.id_vendedor, id_restaurante]);
      vendedor = vendedorResult.rows[0];
      logger.info('Buscando vendedor por id_vendedor:', req.user.id_vendedor, 'Resultado:', vendedor);
    }
    if (!vendedor) {
      // Buscar por username
      const vendedorResult = await pool.query('SELECT * FROM vendedores WHERE username = $1 AND id_restaurante = $2 LIMIT 1', [cashier, id_restaurante]);
      vendedor = vendedorResult.rows[0];
      logger.info('Buscando vendedor por username:', cashier, 'Resultado:', vendedor);
    }
    if (!vendedor) {
      logger.error('No se encontró el cajero/vendedor para la venta. Claims del token:', req.user, 'cashier enviado:', cashier);
      return res.status(400).json({ message: 'Cajero no encontrado' });
    }
    
    // Buscar método de pago directamente
    let pago = null;
    if (paymentMethod === 'pendiente_caja') {
      // Buscar el id_pago real de 'pendiente_caja' en la base de datos
      let pagoResult = await pool.query('SELECT * FROM metodos_pago WHERE descripcion = $1 AND id_restaurante = $2 LIMIT 1', ['pendiente_caja', id_restaurante]);
      if (pagoResult.rows.length === 0) {
        // Si no existe, crearlo automáticamente
        const insertResult = await pool.query('INSERT INTO metodos_pago (descripcion, activo, id_restaurante) VALUES ($1, $2, $3) RETURNING *', ['pendiente_caja', true, id_restaurante]);
        pago = insertResult.rows[0];
        logger.info('Backend: Método de pago pendiente_caja creado automáticamente:', pago);
      } else {
        pago = pagoResult.rows[0];
        logger.info('Backend: Método de pago pendiente_caja encontrado:', pago);
      }
    } else {
      logger.info('Backend: Searching for payment method:', paymentMethod, 'in restaurant:', id_restaurante);
      const pagoResult = await pool.query('SELECT * FROM metodos_pago WHERE descripcion = $1 AND id_restaurante = $2 LIMIT 1', [paymentMethod, id_restaurante]);
      pago = pagoResult.rows[0];
      logger.info('Backend: Pago found:', pago);
      if (!pago) {
        logger.error('Backend: Payment method not found. Available methods:');
        const allMethodsResult = await pool.query('SELECT descripcion FROM metodos_pago WHERE id_restaurante = $1', [id_restaurante]);
        logger.error('Backend: Available methods:', allMethodsResult.rows);
        return res.status(400).json({ message: 'Método de pago no encontrado' });
      }
    }

    // Crear venta y detalles en una transacción
    logger.info('Backend: Creating venta with:', {
      id_vendedor: vendedor.id_vendedor,
      id_pago: pago.id_pago,
      id_sucursal: sucursal.id_sucursal,
      tipo_servicio,
      total,
      id_mesa: idMesaFinal,
      id_restaurante
    });
    
    console.log('=== DEBUG: VENTA DATA ===');
    console.log('Vendedor ID:', vendedor.id_vendedor);
    console.log('Pago ID:', pago.id_pago);
    console.log('Sucursal ID:', sucursal.id_sucursal);
    console.log('Tipo servicio:', tipo_servicio);
    console.log('Total:', total);
    console.log('Mesa ID:', idMesaFinal);
    console.log('Restaurante ID:', id_restaurante);
    console.log('=== END DEBUG ===');
    
    let venta;
    let detalles;
    let mesaActualizada = null;

    // --- VERIFICACIÓN DE MESA ANTES DE LA TRANSACCIÓN ---
    if (tipo_servicio === 'Mesa' && idMesaFinal) {
      logger.info('Backend: Verificando mesa:', idMesaFinal);
      mesa = await Mesa.getMesaById(idMesaFinal, sucursal.id_sucursal, id_restaurante);
      if (!mesa || mesa.numero == null) {
        // Obtener mesas disponibles para mostrar al usuario
        const mesasDisponibles = await pool.query(
          'SELECT id_mesa, numero FROM mesas WHERE id_sucursal = $1 AND id_restaurante = $2 ORDER BY numero',
          [sucursal.id_sucursal, id_restaurante]
        );
        const numerosMesas = mesasDisponibles.rows.map(m => m.numero).join(', ');
        return res.status(400).json({
          message: `No se pudo encontrar el número de la mesa ${idMesaFinal} en la sucursal "${sucursal.nombre}".`,
          details: `Mesas disponibles: ${numerosMesas || 'Ninguna mesa configurada'}`,
          errorType: 'MESA_NO_ENCONTRADA',
          mesaSolicitada: idMesaFinal,
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
          message: `Mesa ${idMesaFinal} no está disponible en este momento.`,
          details: `Estado actual: ${estadoDescripcion[mesa.estado] || mesa.estado}`,
          errorType: 'MESA_NO_DISPONIBLE',
          mesaSolicitada: idMesaFinal,
          estadoActual: mesa.estado,
          sucursal: sucursal.nombre
        });
      }
    }
    // --- FIN VERIFICACIÓN DE MESA ---
    
    console.log('=== DEBUG: CONNECTING TO DB ===');
    const client = await pool.connect();
    console.log('=== DEBUG: DB CONNECTED ===');
    try {
      console.log('=== DEBUG: STARTING TRANSACTION ===');
      await client.query('BEGIN');
      console.log('=== DEBUG: TRANSACTION STARTED ===');
      
      // Si es venta por mesa, actualizar estado de mesa
      if (tipo_servicio === 'Mesa' && idMesaFinal) {
        if (mesa.estado === 'libre') {
          // Si la mesa está libre, abrirla
          logger.info('Backend: Abriendo mesa:', idMesaFinal);
          mesaActualizada = await Mesa.abrirMesa(mesa.numero, sucursal.id_sucursal, vendedor.id_vendedor, id_restaurante, client);
          if (!mesaActualizada) {
            await client.query('ROLLBACK');
            logger.error(`[VENTA] No se pudo abrir la mesa ${mesa.numero} en la sucursal ${sucursal.id_sucursal} (restaurante ${id_restaurante})`);
            return res.status(400).json({
              message: `No se pudo abrir la mesa seleccionada. Verifica que esté disponible.`,
              errorType: 'MESA_NO_ABIERTA',
              mesaSolicitada: mesa.numero,
              sucursal: sucursal.id_sucursal
            });
          }
          // Crear prefactura
          await Mesa.crearPrefactura(mesaActualizada.id_mesa, null, id_restaurante, client);
        } else if (mesa.estado === 'en_uso') {
          // Si la mesa está en uso, calcular el total real de la sesión actual
          logger.info('Backend: Mesa en uso, calculando total real de la sesión actual');
          
          // Obtener el total real de la sesión actual (solo ventas de esta sesión)
          const totalSesionQuery = `
            SELECT COALESCE(SUM(dv.subtotal), 0) as total_acumulado
            FROM ventas v
            JOIN detalle_ventas dv ON v.id_venta = dv.id_venta
            WHERE v.id_mesa = $1 
              AND v.id_restaurante = $2 
              AND v.estado IN ('completada', 'pendiente', 'abierta', 'en_uso', 'pendiente_cobro', 'entregado', 'recibido', 'en_preparacion')
              AND v.fecha >= (
                SELECT COALESCE(hora_apertura, NOW()) 
                FROM mesas 
                WHERE id_mesa = $1 AND id_restaurante = $2
              )
          `;
          const totalSesionResult = await client.query(totalSesionQuery, [mesa.id_mesa, id_restaurante]);
          const totalAcumulado = parseFloat(totalSesionResult.rows[0].total_acumulado) || 0;
          
          // Sumar la venta actual al total de la sesión
          const nuevoTotal = totalAcumulado + total;
          
          mesaActualizada = await Mesa.actualizarTotalAcumulado(mesa.id_mesa, nuevoTotal, id_restaurante, client);
          if (!mesaActualizada) {
            await client.query('ROLLBACK');
            logger.error(`[VENTA] No se pudo actualizar el total acumulado de la mesa ${mesa.numero} en la sucursal ${sucursal.id_sucursal} (restaurante ${id_restaurante})`);
            return res.status(400).json({
              message: `No se pudo actualizar el total acumulado de la mesa seleccionada. Verifica que la mesa exista y esté en uso.`,
              errorType: 'MESA_NO_ACTUALIZADA',
              mesaSolicitada: mesa.numero,
              sucursal: sucursal.id_sucursal
            });
          }
        }
      }
      
      // Crear venta
      let mesaNumero = null;
      if (tipo_servicio === 'Mesa' && mesa) {
        mesaNumero = mesa.numero;
      }
      console.log('DEBUG: mesaNumero a guardar en venta:', mesaNumero);
      try {
        venta = await Venta.createVenta({
          id_vendedor: vendedor.id_vendedor,
          id_pago: pago.id_pago,
          id_sucursal: sucursal.id_sucursal,
          tipo_servicio,
          total,
          id_mesa: idMesaFinal,
          mesa_numero: mesaNumero,
          id_restaurante, // Pasar id_restaurante a createVenta
          rol_usuario: req.user.rol // Pasar el rol del usuario
        }, client);
      } catch (modelError) {
        await client.query('ROLLBACK');
        logger.error('Error de validación al crear venta:', modelError.message);
        return res.status(400).json({
          message: 'Error de validación al crear la venta.',
          error: modelError.message
        });
      }
      logger.info('Backend: Venta created successfully:', venta);
      
      if (!venta || !venta.id_venta) {
        throw new Error('No se pudo obtener el ID de la venta principal.');
      }

      // Si es venta por mesa, asignar la venta a la mesa
      if (tipo_servicio === 'Mesa' && idMesaFinal && mesaActualizada) {
        await Mesa.asignarVentaAMesa(mesaActualizada.id_mesa, venta.id_venta, id_restaurante, client);
        // Asignar el mesero a la mesa (id_mesero_actual)
        await Mesa.asignarMeseroAMesa(mesaActualizada.id_mesa, vendedor.id_vendedor, id_restaurante, client);
      }

      // Si es venta por mesa, asegurar que la mesa esté en estado 'en_uso' (forzar siempre)
      if (tipo_servicio === 'Mesa' && idMesaFinal) {
        console.log('DEBUG (FORZAR) actualizarEstadoMesa:', { id_mesa: idMesaFinal, estado: 'en_uso', id_restaurante });
        const mesaActualizada = await Mesa.actualizarEstadoMesa(idMesaFinal, 'en_uso', id_restaurante, client);
        console.log('DEBUG resultado actualizarEstadoMesa (FORZADO):', mesaActualizada);
      }

      // Verificar el estado de la venta después de crearla
      logger.debug('Backend: === VERIFICANDO ESTADO DE VENTA ===');
      const estadoQuery = 'SELECT id_venta, estado, id_mesa, total, id_restaurante FROM ventas WHERE id_venta = $1 AND id_restaurante = $2';
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
      
      // Si es venta por mesa, actualizar automáticamente la prefactura
      if (tipo_servicio === 'Mesa' && idMesaFinal) {
        logger.info('Backend: Actualizando prefactura automáticamente después de la venta');
        try {
          // Obtener la prefactura actual de la mesa
          const prefactura = await Mesa.getPrefacturaByMesa(idMesaFinal, id_restaurante);
          if (prefactura) {
            // Calcular el nuevo total acumulado de la sesión actual
            const totalSesionQuery = `
              SELECT COALESCE(SUM(dv.subtotal), 0) as total_acumulado
              FROM ventas v
              JOIN detalle_ventas dv ON v.id_venta = dv.id_venta
              WHERE v.id_mesa = $1 
                AND v.id_restaurante = $2 
                AND v.estado IN ('completada', 'pendiente', 'abierta', 'en_uso', 'pendiente_cobro', 'entregado', 'recibido', 'en_preparacion')
                AND v.fecha >= $3
            `;
            const totalSesionResult = await client.query(totalSesionQuery, [idMesaFinal, id_restaurante, prefactura.fecha_apertura]);
            const totalAcumulado = parseFloat(totalSesionResult.rows[0].total_acumulado) || 0;
            
            // Actualizar el total acumulado en la mesa
            await Mesa.actualizarTotalAcumulado(idMesaFinal, totalAcumulado, id_restaurante, client);
            
            logger.info(`Backend: Prefactura actualizada automáticamente. Total acumulado: ${totalAcumulado}`);
          }
        } catch (prefacturaError) {
          logger.warn('Backend: Error al actualizar prefactura automáticamente:', prefacturaError.message);
          // No fallar la transacción por error en prefactura
        }
      }
      
      await client.query('COMMIT');
      
      // Verificar el estado final después del commit
      logger.debug('Backend: === VERIFICANDO ESTADO FINAL ===');
      const estadoFinalQuery = 'SELECT id_venta, estado, id_mesa, total, id_restaurante FROM ventas WHERE id_venta = $1 AND id_restaurante = $2';
      const estadoFinalResult = await pool.query(estadoFinalQuery, [venta.id_venta, id_restaurante]);
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
      const { rows } = await pool.query(query, values);
      factura = rows[0];
    }

    // Después de crear la venta y asignar a la mesa:
    if (tipo_servicio === 'Mesa' && venta && venta.id_venta) {
      // Emitir evento a KDS
      try {
        const { getIO } = require('../socket');
        console.log('DEBUG: Emitiendo a KDS - mesa_numero:', venta.mesa_numero);
        getIO().emit('nueva-orden-cocina', {
          id_venta: venta.id_venta,
          id_mesa: venta.id_mesa,
          mesa_numero: venta.mesa_numero,
          productos: items,
          sucursal: sucursal.id_sucursal,
          restaurante: id_restaurante,
          timestamp: venta.fecha,
          estado: venta.estado, // Estado real de la venta
          prioridad: 'normal'
        });
      } catch (socketError) {
        logger.warn('No se pudo emitir evento socket:', socketError.message);
      }
    }

    // Después de crear los detalles de venta:
    if (items && detalles && Array.isArray(detalles)) {
      for (let i = 0; i < detalles.length; i++) {
        const detalle = detalles[i];
        const item = items[i];
        if (item.modificadores && item.modificadores.length > 0) {
          const id_modificadores = item.modificadores.map((m) => m.id_modificador);
          await ModificadorModel.asociarAMovimiento(detalle.id_detalle, id_modificadores);
        }
      }
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
    // Log de depuración: usuario y restaurante
    logger.info('[KDS] Petición de pedidos para cocina', {
      user: req.user,
      id_restaurante: req.user.id_restaurante,
      query: req.query
    });

    const id_restaurante = req.user.id_restaurante; // Obtener id_restaurante del usuario autenticado

    const query = `
      SELECT
          v.id_venta,
          v.fecha,
          v.id_mesa,
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
          v.id_restaurante = $1
          AND v.estado IN ('recibido', 'en_preparacion', 'listo_para_servir')
      GROUP BY
          v.id_venta, v.fecha, v.id_mesa, v.mesa_numero, v.tipo_servicio, v.estado, v.total, v.id_sucursal
      ORDER BY
          v.fecha ASC;
    `;
    const { rows } = await pool.query(query, [id_restaurante]);
    logger.info('[KDS] Pedidos para cocina obtenidos.', {
      id_restaurante,
      total_pedidos: rows.length,
      primer_pedido: rows[0] || null
    });
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
    const { rows } = await pool.query(query, [estado, id, id_restaurante]);

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

    // Siempre usar la sucursal del usuario si no es admin/super_admin
    let id_sucursal = req.user.id_sucursal;
    if (['admin', 'super_admin'].includes(req.user.rol) && req.query.sucursal) {
      id_sucursal = parseInt(req.query.sucursal);
    }

    logger.info('[DEBUG] getVentasOrdenadas params:', { id_restaurante, id_sucursal, limit });
    const ventas = await Venta.getVentasOrdenadas(id_restaurante, parseInt(limit), id_sucursal);
    logger.info('[DEBUG] getVentasOrdenadas - ventas devueltas:', ventas.length);
    if (ventas.length > 0) {
      logger.info('[DEBUG] Primer venta:', {
        id_venta: ventas[0].id_venta,
        productos: Array.isArray(ventas[0].productos) ? ventas[0].productos.length : 'no array',
        productosEjemplo: Array.isArray(ventas[0].productos) && ventas[0].productos.length > 0 ? ventas[0].productos[0] : null
      });
    }

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
    const { id_mesa, id_sucursal, paymentMethod, invoiceData } = req.body;
    const id_vendedor = req.user.id;
    const id_restaurante = req.user.id_restaurante; // Obtener id_restaurante del usuario autenticado

    if (!id_mesa || !id_sucursal || !paymentMethod) {
      logger.warn('ID de mesa, sucursal y método de pago son requeridos para cerrar mesa con factura.');
      return res.status(400).json({ 
        message: 'ID de mesa, sucursal y método de pago son requeridos.' 
      });
    }

    // Obtener mesa y verificar estado
    const mesa = await Mesa.getMesaById(id_mesa, id_sucursal, id_restaurante);
    if (!mesa) {
      logger.warn(`Mesa ${id_mesa} no encontrada para cerrar con factura en el restaurante ${id_restaurante}.`);
      return res.status(404).json({ message: 'Mesa no encontrada.' });
    }

    if (mesa.estado !== 'en_uso') {
      logger.warn(`Intento de cerrar mesa ${id_mesa} que no está en uso. Estado actual: ${mesa.estado}`);
      return res.status(400).json({ 
        message: `La mesa ${id_mesa} no está en uso. Estado actual: ${mesa.estado}` 
      });
    }

    // Obtener sucursal y método de pago
    const sucursalResult = await pool.query('SELECT * FROM sucursales WHERE id_sucursal = $1 AND id_restaurante = $2 LIMIT 1', [id_sucursal, id_restaurante]);
    const sucursal = sucursalResult.rows[0];
    if (!sucursal) {
      logger.warn('Sucursal no encontrada para cerrar mesa con factura.');
      return res.status(400).json({ message: 'Sucursal no encontrada' });
    }
    
    const pagoResult = await pool.query('SELECT * FROM metodos_pago WHERE descripcion = $1 AND id_restaurante = $2 LIMIT 1', [paymentMethod, id_restaurante]);
    const pago = pagoResult.rows[0];
    if (!pago) {
      logger.warn('Método de pago no encontrado para cerrar mesa con factura.');
      return res.status(400).json({ message: 'Método de pago no encontrado' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Crear venta final con el total acumulado
      const ventaFinal = await Venta.createVenta({
        id_vendedor: id_vendedor,
        id_pago: pago.id_pago,
        id_sucursal: sucursal.id_sucursal,
        tipo_servicio: 'Mesa',
        total: mesa.total_acumulado,
        id_mesa: id_mesa,
        id_restaurante: id_restaurante // Pasar id_restaurante a createVenta
      }, client);

      // Cerrar la mesa
      const mesaCerrada = await Mesa.cerrarMesa(id_mesa, id_restaurante, client);

      // Cerrar prefactura si existe
      const prefactura = await Mesa.getPrefacturaByMesa(id_mesa, id_restaurante);
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
      logger.info(`Mesa ${id_mesa} cerrada y facturada exitosamente para el restaurante ${id_restaurante}. Venta ID: ${ventaFinal.id_venta}`);

      res.status(200).json({
        message: `Mesa ${id_mesa} cerrada y facturada exitosamente.`,
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

    // Notificar a la sala de la mesa si la venta está asociada a una
    if (updated.id_mesa) {
      try {
        const { getIO } = require('../socket');
        const room = `restaurante_${id_restaurante}_mesa_${updated.id_mesa}`;
        getIO().to(room).emit('orden_actualizada', { 
          ventaId: ventaId, 
          nuevoEstado: estado, 
          id_mesa: updated.id_mesa 
        });
        logger.info(`Socket event 'orden_actualizada' emitido a room ${room}`);
      } catch (socketError) {
        logger.warn('No se pudo emitir evento socket para actualizar orden:', socketError.message);
      }
    }

    res.status(200).json({
      message: 'Estado de venta actualizado correctamente.',
      data: updated
    });
  } catch (error) {
    logger.error('Error al actualizar estado de venta:', error.message);
    res.status(400).json({ message: error.message });
  }
};

exports.exportVentasFiltradas = async (req, res, next) => {
  try {
    const id_restaurante = req.user.id_restaurante;
    const { fecha_inicio, fecha_fin, id_sucursal, id_producto, metodo_pago, cajero } = req.query;
    if (!fecha_inicio || !fecha_fin) {
      return res.status(400).json({ message: 'Debe especificar fecha_inicio y fecha_fin.' });
    }
    const filtros = {
      fecha_inicio,
      fecha_fin,
      id_sucursal: id_sucursal ? parseInt(id_sucursal) : undefined,
      id_producto: id_producto ? parseInt(id_producto) : undefined,
      metodo_pago,
      cajero
    };
    const ventas = await require('../models/ventaModel').getVentasFiltradas(filtros, id_restaurante);
    console.log('🔍 Controlador - Primera venta para debug:', ventas[0]);
    res.status(200).json({
      message: 'Ventas exportadas exitosamente.',
      data: ventas
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/detalle-ventas/:id_detalle
 * Body: { prioridad, tiempo_estimado, estacion_cocina }
 * Permite a la cocina actualizar estos campos en un ítem
 */
exports.actualizarDetalleVentaKDS = async (req, res) => {
  const { id_detalle } = req.params;
  const { prioridad, tiempo_estimado, estacion_cocina } = req.body;
  try {
    // Actualizar en la base de datos
    const updateQuery = `UPDATE detalle_ventas SET
      prioridad = COALESCE($1, prioridad),
      tiempo_estimado = COALESCE($2, tiempo_estimado),
      estacion_cocina = COALESCE($3, estacion_cocina)
      WHERE id_detalle = $4 RETURNING *`;
    const { rows } = await pool.query(updateQuery, [prioridad, tiempo_estimado, estacion_cocina, id_detalle]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Detalle de venta no encontrado.' });
    }
    // Emitir evento a KDS
    try {
      const { getIO } = require('../socket');
      getIO().emit('actualizar-detalle-kds', rows[0]);
    } catch (socketError) {
      logger.warn('No se pudo emitir evento socket:', socketError.message);
    }
    return res.status(200).json({ message: 'Detalle actualizado.', detalle: rows[0] });
  } catch (error) {
    logger.error('Error al actualizar detalle_ventas desde KDS:', error);
    return res.status(500).json({ message: 'Error al actualizar detalle.', error: error.message });
  }
};

// Crear venta (pedido) con estado pendiente_aprobacion
exports.crearPedidoMesero = async (req, res, next) => {
  try {
    const {
      id_mesa,
      id_sucursal,
      id_restaurante,
      id_vendedor,
      items,
      observaciones
    } = req.body;
    // Validaciones básicas
    if (!id_mesa || !id_sucursal || !id_restaurante || !id_vendedor || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Datos incompletos para crear el pedido.' });
    }
    // Calcular total
    const total = items.reduce((acc, item) => acc + (item.cantidad * item.precio_unitario), 0);
    // Crear venta con estado pendiente_aprobacion
    const ventaResult = await pool.query(
      `INSERT INTO ventas (id_mesa, id_sucursal, id_restaurante, id_vendedor, tipo_servicio, total, estado, observaciones, created_at)
       VALUES ($1,$2,$3,$4,'Mesa',$5,'pendiente_aprobacion',$6,NOW()) RETURNING *`,
      [id_mesa, id_sucursal, id_restaurante, id_vendedor, total, observaciones]
    );
    const venta = ventaResult.rows[0];
    // Insertar detalle_ventas
    for (const item of items) {
      await pool.query(
        `INSERT INTO detalle_ventas (id_venta, id_producto, cantidad, precio_unitario, subtotal, observaciones, id_restaurante, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())`,
        [venta.id_venta, item.id_producto, item.cantidad, item.precio_unitario, item.cantidad * item.precio_unitario, item.observaciones || '', id_restaurante]
      );
    }
    res.status(201).json({ data: venta });
  } catch (error) {
    next(error);
  }
};

/**
 * Listar pedidos pendientes de aprobación (para cajero)
 * GET /api/v1/ventas/pendientes-aprobacion
 */
exports.listarPedidosPendientesAprobacion = async (req, res, next) => {
  try {
    const id_restaurante = req.user.id_restaurante;
    
    const query = `
      SELECT 
        v.id_venta,
        v.fecha,
        v.total,
        v.tipo_servicio,
        v.mesa_numero,
        v.estado,
        vend.nombre as nombre_mesero,
        vend.username as username_mesero,
        json_agg(
          json_build_object(
            'id_producto', p.id_producto,
            'nombre_producto', p.nombre,
            'cantidad', dv.cantidad,
            'precio_unitario', dv.precio_unitario,
            'observaciones', dv.observaciones
          )
        ) AS productos
      FROM ventas v
      JOIN vendedores vend ON v.id_vendedor = vend.id_vendedor
      JOIN detalle_ventas dv ON v.id_venta = dv.id_venta
      JOIN productos p ON dv.id_producto = p.id_producto
      WHERE v.estado = 'pendiente_aprobacion' 
        AND v.id_restaurante = $1
        AND vend.rol = 'mesero'
      GROUP BY 
        v.id_venta, v.fecha, v.total, v.tipo_servicio, 
        v.mesa_numero, v.estado, vend.nombre, vend.username
      ORDER BY v.fecha ASC
    `;
    
    const { rows } = await pool.query(query, [id_restaurante]);
    
    logger.info(`Pedidos pendientes de aprobación obtenidos para restaurante ${id_restaurante}. Total: ${rows.length}`);
    
    res.status(200).json({
      message: 'Pedidos pendientes de aprobación obtenidos exitosamente.',
      data: rows
    });
  } catch (error) {
    logger.error('Error al obtener pedidos pendientes de aprobación:', error);
    next(error);
  }
};

// Aceptar pedido (cambiar a estado recibido)
exports.aceptarPedido = async (req, res, next) => {
  try {
    const { id_venta } = req.params;
    const result = await pool.query(
      `UPDATE ventas SET estado = 'recibido' WHERE id_venta = $1 RETURNING *`,
      [id_venta]
    );
    if (result.rowCount === 0) return res.status(404).json({ message: 'Pedido no encontrado' });
    res.status(200).json({ data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

// Rechazar pedido (cambiar a estado rechazado y guardar motivo)
exports.rechazarPedido = async (req, res, next) => {
  try {
    const { id_venta } = req.params;
    const { motivo } = req.body;
    const result = await pool.query(
      `UPDATE ventas SET estado = 'rechazado', observaciones = COALESCE(observaciones, '') || '\nRechazado: ' || $2 WHERE id_venta = $1 RETURNING *`,
      [id_venta, motivo || 'Sin motivo']
    );
    if (result.rowCount === 0) return res.status(404).json({ message: 'Pedido no encontrado' });
    res.status(200).json({ data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

/**
 * Aprobar pedido de mesero
 * PATCH /api/v1/ventas/:id/aprobar
 */
exports.aprobarPedidoMesero = async (req, res, next) => {
  const { id } = req.params;
  const user = req.user;
  const ventaId = parseInt(id, 10);
  const id_restaurante = req.user.id_restaurante;

  try {
    // Verificar que la venta existe y está en estado pendiente_aprobacion
    const ventaQuery = `
      SELECT id_venta, estado, id_vendedor, id_restaurante 
      FROM ventas 
      WHERE id_venta = $1 AND id_restaurante = $2
    `;
    const ventaResult = await pool.query(ventaQuery, [ventaId, id_restaurante]);
    
    if (ventaResult.rows.length === 0) {
      return res.status(404).json({ message: 'Venta no encontrada.' });
    }
    
    const venta = ventaResult.rows[0];
    
    if (venta.estado !== 'pendiente_aprobacion') {
      return res.status(400).json({ message: 'Solo se pueden aprobar pedidos en estado pendiente_aprobacion.' });
    }
    
    // Actualizar el estado a 'recibido'
    const updated = await Venta.updateEstadoVenta(ventaId, 'recibido', id_restaurante);
    
    logger.info(`Pedido ${ventaId} aprobado por ${user?.username || 'desconocido'} para el restaurante ${id_restaurante}`);
    
    res.status(200).json({
      message: 'Pedido aprobado exitosamente.',
      data: updated
    });
  } catch (error) {
    logger.error('Error al aprobar pedido de mesero:', error.message);
    res.status(400).json({ message: error.message });
  }
};

/**
 * Rechazar pedido de mesero
 * PATCH /api/v1/ventas/:id/rechazar
 */
exports.rechazarPedidoMesero = async (req, res, next) => {
  const { id } = req.params;
  const { motivo } = req.body;
  const user = req.user;
  const ventaId = parseInt(id, 10);
  const id_restaurante = req.user.id_restaurante;

  try {
    // Verificar que la venta existe y está en estado pendiente_aprobacion
    const ventaQuery = `
      SELECT id_venta, estado, id_vendedor, id_restaurante 
      FROM ventas 
      WHERE id_venta = $1 AND id_restaurante = $2
    `;
    const ventaResult = await pool.query(ventaQuery, [ventaId, id_restaurante]);
    
    if (ventaResult.rows.length === 0) {
      return res.status(404).json({ message: 'Venta no encontrada.' });
    }
    
    const venta = ventaResult.rows[0];
    
    if (venta.estado !== 'pendiente_aprobacion') {
      return res.status(400).json({ message: 'Solo se pueden rechazar pedidos en estado pendiente_aprobacion.' });
    }
    
    // Actualizar el estado a 'cancelado'
    const updated = await Venta.updateEstadoVenta(ventaId, 'cancelado', id_restaurante);
    
    logger.info(`Pedido ${ventaId} rechazado por ${user?.username || 'desconocido'} para el restaurante ${id_restaurante}. Motivo: ${motivo || 'No especificado'}`);
    
    res.status(200).json({
      message: 'Pedido rechazado exitosamente.',
      data: updated,
      motivo: motivo || 'No especificado'
    });
  } catch (error) {
    logger.error('Error al rechazar pedido de mesero:', error.message);
    res.status(400).json({ message: error.message });
  }
};