const { pool } = require('./src/config/database');

async function verificarPrefacturaCorregida() {
  try {
    console.log('✅ VERIFICANDO PREFACTURA DESPUÉS DE LA TRANSFERENCIA\n');
    
    // Mesa 1 Sucursal 6 (donde ahora están los productos)
    const id_mesa = 31;
    const id_restaurante = 1;
    
    console.log(`📋 PARÁMETROS:`);
    console.log(`  - ID Mesa: ${id_mesa}`);
    console.log(`  - ID Restaurante: ${id_restaurante}\n`);
    
    // 1. Verificar mesa
    console.log('1️⃣ VERIFICANDO MESA:');
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
    console.log(`  - Total acumulado: ${mesa.total_acumulado}`);
    console.log(`  - Hora apertura: ${mesa.hora_apertura}`);
    console.log(`  - Fecha apertura prefactura: ${mesa.fecha_apertura_prefactura}`);
    console.log(`  - Estado prefactura: ${mesa.estado_prefactura}\n`);
    
    // 2. Verificar ventas
    console.log('2️⃣ VERIFICANDO VENTAS:');
    const ventasQuery = `
      SELECT 
        v.id_venta,
        v.estado,
        v.total,
        v.fecha,
        COUNT(dv.id_detalle) as items_count
      FROM ventas v
      LEFT JOIN detalle_ventas dv ON v.id_venta = dv.id_venta
      WHERE v.id_mesa = $1
      GROUP BY v.id_venta, v.estado, v.total, v.fecha
      ORDER BY v.fecha DESC
      LIMIT 10
    `;
    const ventasResult = await pool.query(ventasQuery, [mesa.id_mesa]);
    console.log(`✅ Ventas encontradas: ${ventasResult.rows.length}`);
    
    ventasResult.rows.forEach((venta, index) => {
      console.log(`  ${index + 1}. ID=${venta.id_venta}, Estado=${venta.estado}, Total=${venta.total}, Items=${venta.items_count}, Fecha=${venta.fecha}`);
    });
    console.log('');
    
    // 3. Verificar prefactura
    console.log('3️⃣ VERIFICANDO PREFACTURA:');
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
    
    // 4. Calcular total acumulado
    console.log('4️⃣ CALCULANDO TOTAL ACUMULADO:');
    const estadosValidos = [
      'recibido', 'en_preparacion', 'listo_para_servir', 'entregado', 'cancelado',
      'abierta', 'en_uso', 'pendiente_cobro', 'completada', 'pendiente', 'pagado'
    ];
    
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
    
    // 5. Obtener historial completo
    console.log('5️⃣ OBTENIENDO HISTORIAL COMPLETO:');
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
    
    const historialResult = await pool.query(historialQuery, historialParams);
    console.log(`✅ Historial obtenido: ${historialResult.rows.length} registros`);
    
    if (historialResult.rows.length > 0) {
      console.log('📋 Primeros registros del historial:');
      historialResult.rows.slice(0, 5).forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.nombre_producto || 'Producto sin nombre'} - ${item.cantidad}x $${item.precio_unitario} = $${item.subtotal} (Estado: ${item.estado})`);
      });
      
      // Verificar productos con nombre NULL
      const productosNull = historialResult.rows.filter(r => !r.nombre_producto);
      if (productosNull.length > 0) {
        console.log(`⚠️ Productos con nombre NULL: ${productosNull.length}`);
      }
      
      // Calcular total desde productos
      const totalCalculado = historialResult.rows.reduce((sum, item) => sum + parseFloat(item.subtotal || 0), 0);
      console.log(`\n💰 Total calculado desde productos: $${totalCalculado.toFixed(2)}`);
      
    } else {
      console.log('❌ No se encontraron registros de historial');
    }
    
    console.log('\n🏁 VERIFICACIÓN COMPLETADA');
    console.log('💡 Si todo está correcto, la prefactura debería mostrar los productos ahora');
    
  } catch (error) {
    console.error('❌ Error en verificación:', error);
  } finally {
    await pool.end();
  }
}

verificarPrefacturaCorregida();
