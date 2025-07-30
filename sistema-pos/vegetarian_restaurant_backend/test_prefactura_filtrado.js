const { pool } = require('./src/config/database');

async function testPrefacturaFiltrado() {
  try {
    console.log('🔍 Probando filtrado por fecha en prefacturas...');
    
    // 1. Buscar una mesa que tenga ventas
    const mesaQuery = `
      SELECT DISTINCT m.id_mesa, m.numero, m.estado, m.total_acumulado, m.hora_apertura
      FROM mesas m
      JOIN ventas v ON m.numero = v.mesa_numero
      WHERE v.estado IN ('abierta', 'en_uso', 'pendiente_cobro', 'entregado', 'pagado', 'completada', 'pendiente', 'recibido')
      LIMIT 1
    `;
    
    const mesaResult = await pool.query(mesaQuery);
    if (mesaResult.rows.length === 0) {
      console.log('❌ No se encontraron mesas con ventas para probar');
      return;
    }
    
    const mesa = mesaResult.rows[0];
    console.log(`✅ Mesa encontrada: ID=${mesa.id_mesa}, Número=${mesa.numero}, Estado=${mesa.estado}, Total=${mesa.total_acumulado}`);
    
    // 2. Verificar prefactura actual
    const prefacturaQuery = `
      SELECT id_prefactura, fecha_apertura, estado
      FROM prefacturas
      WHERE id_mesa = $1 AND estado = 'abierta'
      ORDER BY fecha_apertura DESC
      LIMIT 1
    `;
    
    const prefacturaResult = await pool.query(prefacturaQuery, [mesa.id_mesa]);
    let fechaApertura = null;
    if (prefacturaResult.rows.length > 0) {
      const prefactura = prefacturaResult.rows[0];
      fechaApertura = prefactura.fecha_apertura;
      console.log(`📊 Prefactura abierta: ID=${prefactura.id_prefactura}, Fecha=${fechaApertura}`);
    } else {
      fechaApertura = mesa.hora_apertura;
      console.log(`📊 No hay prefactura abierta, usando hora_apertura: ${fechaApertura}`);
    }
    
    // 3. Verificar todas las ventas de la mesa
    const todasVentasQuery = `
      SELECT 
        v.id_venta,
        v.fecha,
        v.total,
        v.estado,
        COUNT(dv.id_detalle) as items_count
      FROM ventas v
      LEFT JOIN detalle_ventas dv ON v.id_venta = dv.id_venta
      WHERE v.mesa_numero = $1
      GROUP BY v.id_venta, v.fecha, v.total, v.estado
      ORDER BY v.fecha DESC
    `;
    
    const todasVentasResult = await pool.query(todasVentasQuery, [mesa.numero]);
    console.log(`📊 Todas las ventas de mesa ${mesa.numero}: ${todasVentasResult.rows.length}`);
    
    // Separar ventas por fecha
    const ventasAntes = [];
    const ventasDespues = [];
    
    todasVentasResult.rows.forEach(venta => {
      if (fechaApertura && new Date(venta.fecha) >= new Date(fechaApertura)) {
        ventasDespues.push(venta);
      } else {
        ventasAntes.push(venta);
      }
    });
    
    console.log(`📅 Ventas antes de ${fechaApertura}: ${ventasAntes.length}`);
    console.log(`📅 Ventas después de ${fechaApertura}: ${ventasDespues.length}`);
    
    // 4. Verificar productos antes del filtro
    const productosAntesQuery = `
      SELECT 
        p.nombre as nombre_producto,
        SUM(dv.cantidad) as cantidad_total,
        dv.precio_unitario,
        SUM(dv.subtotal) as subtotal_total
      FROM ventas v
      JOIN detalle_ventas dv ON v.id_venta = dv.id_venta
      JOIN productos p ON dv.id_producto = p.id_producto
      WHERE v.mesa_numero = $1
        AND v.estado IN ('abierta', 'en_uso', 'pendiente_cobro', 'entregado', 'pagado', 'completada', 'pendiente', 'recibido')
      GROUP BY p.nombre, dv.precio_unitario
      ORDER BY p.nombre
    `;
    
    const productosAntesResult = await pool.query(productosAntesQuery, [mesa.numero]);
    console.log(`🍽️ Productos totales (sin filtro): ${productosAntesResult.rows.length}`);
    
    // 5. Verificar productos después del filtro
    const productosDespuesQuery = `
      SELECT 
        p.nombre as nombre_producto,
        SUM(dv.cantidad) as cantidad_total,
        dv.precio_unitario,
        SUM(dv.subtotal) as subtotal_total
      FROM ventas v
      JOIN detalle_ventas dv ON v.id_venta = dv.id_venta
      JOIN productos p ON dv.id_producto = p.id_producto
      WHERE v.mesa_numero = $1
        AND v.estado IN ('abierta', 'en_uso', 'pendiente_cobro', 'entregado', 'pagado', 'completada', 'pendiente', 'recibido')
        ${fechaApertura ? 'AND v.fecha >= $2' : ''}
      GROUP BY p.nombre, dv.precio_unitario
      ORDER BY p.nombre
    `;
    
    const productosDespuesParams = fechaApertura ? [mesa.numero, fechaApertura] : [mesa.numero];
    const productosDespuesResult = await pool.query(productosDespuesQuery, productosDespuesParams);
    console.log(`🍽️ Productos filtrados (después de ${fechaApertura}): ${productosDespuesResult.rows.length}`);
    
    // 6. Mostrar diferencias
    console.log('\n📊 Comparación de productos:');
    console.log('Productos sin filtro:');
    productosAntesResult.rows.forEach((prod, index) => {
      console.log(`  ${index + 1}. ${prod.nombre_producto}: ${prod.cantidad_total} x $${prod.precio_unitario} = $${prod.subtotal_total}`);
    });
    
    console.log('\nProductos con filtro:');
    productosDespuesResult.rows.forEach((prod, index) => {
      console.log(`  ${index + 1}. ${prod.nombre_producto}: ${prod.cantidad_total} x $${prod.precio_unitario} = $${prod.subtotal_total}`);
    });
    
    // 7. Calcular totales
    const totalSinFiltro = productosAntesResult.rows.reduce((sum, prod) => sum + parseFloat(prod.subtotal_total), 0);
    const totalConFiltro = productosDespuesResult.rows.reduce((sum, prod) => sum + parseFloat(prod.subtotal_total), 0);
    
    console.log(`\n💰 Totales:`);
    console.log(`  Sin filtro: $${totalSinFiltro}`);
    console.log(`  Con filtro: $${totalConFiltro}`);
    console.log(`  Diferencia: $${totalSinFiltro - totalConFiltro}`);
    
    console.log('\n✅ Prueba de filtrado completada');
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  } finally {
    await pool.end();
  }
}

testPrefacturaFiltrado(); 