const { pool } = require('./src/config/database');

async function debugPrefacturaDetallado() {
  try {
    console.log('🔍 DEBUG DETALLADO: SIMULANDO FUNCIÓN generarPrefactura\n');
    
    // Simular parámetros de la función
    const id_mesa = 31; // Mesa 1 que sabemos que tiene productos
    const id_restaurante = 1;
    
    console.log(`📋 PARÁMETROS DE ENTRADA:`);
    console.log(`  - ID Mesa: ${id_mesa}`);
    console.log(`  - ID Restaurante: ${id_restaurante}\n`);
    
    // PASO 1: Obtener mesa con información completa
    console.log('1️⃣ PASO 1: OBTENIENDO MESA');
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
      console.log('❌ Mesa no encontrada');
      return;
    }
    
    const mesa = mesaResult.rows[0];
    console.log(`✅ Mesa obtenida:`);
    console.log(`  - ID: ${mesa.id_mesa}`);
    console.log(`  - Número: ${mesa.numero}`);
    console.log(`  - Sucursal: ${mesa.id_sucursal}`);
    console.log(`  - Estado: ${mesa.estado}`);
    console.log(`  - Hora apertura: ${mesa.hora_apertura}`);
    console.log(`  - Fecha apertura prefactura: ${mesa.fecha_apertura_prefactura}`);
    console.log(`  - Estado prefactura: ${mesa.estado_prefactura}\n`);
    
    // PASO 2: Verificar ventas existentes
    console.log('2️⃣ PASO 2: VERIFICANDO VENTAS EXISTENTES');
    const ventasQuery = `
      SELECT 
        v.id_venta,
        v.id_mesa,
        v.id_sucursal,
        v.estado,
        v.total,
        v.fecha,
        COUNT(dv.id_detalle) as items_count
      FROM ventas v
      LEFT JOIN detalle_ventas dv ON v.id_venta = dv.id_venta
      WHERE v.id_mesa = $1 
        AND v.id_sucursal = $2
        AND v.id_restaurante = $3
      GROUP BY v.id_venta, v.id_mesa, v.id_sucursal, v.estado, v.total, v.fecha
      ORDER BY v.fecha DESC
    `;
    const ventasResult = await pool.query(ventasQuery, [mesa.id_mesa, mesa.id_sucursal, id_restaurante]);
    console.log(`✅ Ventas encontradas: ${ventasResult.rows.length}`);
    
    ventasResult.rows.forEach((venta, index) => {
      console.log(`  Venta ${index + 1}: ID=${venta.id_venta}, Estado=${venta.estado}, Total=${venta.total}, Items=${venta.items_count}, Fecha=${venta.fecha}`);
    });
    console.log('');
    
    // PASO 3: Obtener prefactura abierta
    console.log('3️⃣ PASO 3: OBTENIENDO PREFACTURA ABIERTA');
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
      console.log(`✅ Prefactura encontrada: ID=${prefactura.id_prefactura}, Fecha=${fechaAperturaPrefactura}`);
    } else {
      fechaAperturaPrefactura = mesa.hora_apertura;
      console.log(`⚠️ No hay prefactura abierta, usando hora_apertura: ${fechaAperturaPrefactura}`);
    }
    console.log('');
    
    // PASO 4: Definir estados válidos
    console.log('4️⃣ PASO 4: DEFINIENDO ESTADOS VÁLIDOS');
    const estadosValidos = [
      'recibido', 'en_preparacion', 'listo_para_servir', 'entregado', 'cancelado',
      'abierta', 'en_uso', 'pendiente_cobro', 'completada', 'pendiente', 'pagado'
    ];
    console.log(`✅ Estados válidos: ${estadosValidos.join(', ')}\n`);
    
    // PASO 5: Calcular total acumulado
    console.log('5️⃣ PASO 5: CALCULANDO TOTAL ACUMULADO');
    if (fechaAperturaPrefactura) {
      const totalSesionQuery = `
        SELECT 
          COALESCE(SUM(dv.subtotal), 0) as total_acumulado,
          COUNT(DISTINCT v.id_venta) as total_ventas,
          COUNT(dv.id_detalle) as total_items
        FROM ventas v
        JOIN detalle_ventas dv ON dv.id_venta = v.id_venta
        WHERE v.id_mesa = $1 
          AND v.id_sucursal = $2
          AND v.id_restaurante = $3
          AND v.fecha >= $4
          AND v.estado = ANY($5)
      `;
      const totalSesionResult = await pool.query(totalSesionQuery, [mesa.id_mesa, mesa.id_sucursal, id_restaurante, fechaAperturaPrefactura, estadosValidos]);
      
      const totalAcumulado = parseFloat(totalSesionResult.rows[0].total_acumulado) || 0;
      const totalVentas = parseInt(totalSesionResult.rows[0].total_ventas) || 0;
      const totalItems = parseInt(totalSesionResult.rows[0].total_items) || 0;
      
      console.log(`✅ Total calculado desde ${fechaAperturaPrefactura}:`);
      console.log(`  - Total acumulado: $${totalAcumulado}`);
      console.log(`  - Total ventas: ${totalVentas}`);
      console.log(`  - Total items: ${totalItems}`);
    } else {
      console.log('❌ No se pudo determinar fecha de apertura');
    }
    console.log('');
    
    // PASO 6: Obtener historial completo
    console.log('6️⃣ PASO 6: OBTENIENDO HISTORIAL COMPLETO');
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
      WHERE v.id_mesa = $1
        AND v.id_sucursal = $2
        AND v.id_restaurante = $3
        AND v.estado = ANY($4)
        ${fechaAperturaPrefactura ? 'AND v.fecha >= $5' : ''}
      ORDER BY v.fecha DESC
    `;
    
    const historialParams = fechaAperturaPrefactura 
      ? [mesa.id_mesa, mesa.id_sucursal, id_restaurante, estadosValidos, fechaAperturaPrefactura]
      : [mesa.id_mesa, mesa.id_sucursal, id_restaurante, estadosValidos];
    
    console.log(`🔍 Parámetros de consulta: ${JSON.stringify(historialParams)}`);
    
    const historialResult = await pool.query(historialQuery, historialParams);
    console.log(`✅ Historial obtenido: ${historialResult.rows.length} registros`);
    
    if (historialResult.rows.length > 0) {
      console.log('📋 Primeros registros del historial:');
      historialResult.rows.slice(0, 3).forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.nombre_producto} - ${item.cantidad}x $${item.precio_unitario} = $${item.subtotal} (Estado: ${item.estado})`);
      });
      
      // Verificar si hay productos con nombre NULL
      const productosNull = historialResult.rows.filter(r => !r.nombre_producto);
      if (productosNull.length > 0) {
        console.log(`⚠️ Productos con nombre NULL: ${productosNull.length}`);
        productosNull.slice(0, 3).forEach((item, index) => {
          console.log(`  ${index + 1}. ID Producto: ${item.id_producto}, Cantidad: ${item.cantidad}, Subtotal: ${item.subtotal}`);
        });
      }
    } else {
      console.log('❌ No se encontraron registros de historial');
      
      // Verificar qué ventas existen sin filtro de estado
      console.log('\n🔍 VERIFICANDO VENTAS SIN FILTRO DE ESTADO:');
      const ventasSinFiltroQuery = `
        SELECT v.id_venta, v.estado, v.fecha, COUNT(dv.id_detalle) as items
        FROM ventas v
        LEFT JOIN detalle_ventas dv ON v.id_venta = dv.id_venta
        WHERE v.id_mesa = $1 AND v.id_sucursal = $2 AND v.id_restaurante = $3
        GROUP BY v.id_venta, v.estado, v.fecha
        ORDER BY v.fecha DESC
        LIMIT 5
      `;
      const ventasSinFiltroResult = await pool.query(ventasSinFiltroQuery, [mesa.id_mesa, mesa.id_sucursal, id_restaurante]);
      console.log(`Ventas encontradas sin filtro: ${ventasSinFiltroResult.rows.length}`);
      ventasSinFiltroResult.rows.forEach((venta, index) => {
        console.log(`  Venta ${index + 1}: ID=${venta.id_venta}, Estado=${venta.estado}, Items=${venta.items}, Fecha=${venta.fecha}`);
      });
      
      // Verificar si hay detalles de venta
      console.log('\n🔍 VERIFICANDO DETALLES DE VENTA:');
      const detallesQuery = `
        SELECT dv.*, v.estado as estado_venta, v.fecha as fecha_venta
        FROM detalle_ventas dv
        JOIN ventas v ON dv.id_venta = v.id_venta
        WHERE v.id_mesa = $1 AND v.id_sucursal = $2 AND v.id_restaurante = $3
        ORDER BY v.fecha DESC
        LIMIT 5
      `;
      const detallesResult = await pool.query(detallesQuery, [mesa.id_mesa, mesa.id_sucursal, id_restaurante]);
      console.log(`Detalles encontrados: ${detallesResult.rows.length}`);
      detallesResult.rows.forEach((detalle, index) => {
        console.log(`  Detalle ${index + 1}: ID=${detalle.id_detalle}, Producto=${detalle.id_producto}, Cantidad=${detalle.cantidad}, Subtotal=${detalle.subtotal}, Estado Venta=${detalle.estado_venta}`);
      });
    }
    
    console.log('\n🏁 DEBUG COMPLETADO');
    
  } catch (error) {
    console.error('❌ Error en debug:', error);
  } finally {
    await pool.end();
  }
}

debugPrefacturaDetallado();
