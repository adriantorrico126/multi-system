const { pool } = require('./src/config/database');

async function debugPrefacturaProductos() {
  try {
    console.log('🔍 DEBUG: DIAGNÓSTICO DE PREFACTURA SIN PRODUCTOS\n');
    
    // 1. Verificar qué estados tienen las ventas realmente
    console.log('1️⃣ VERIFICANDO ESTADOS DE VENTAS...');
    const estadosResult = await pool.query(`
      SELECT estado, COUNT(*) as cantidad
      FROM ventas 
      GROUP BY estado
      ORDER BY cantidad DESC
    `);
    
    console.log('Estados encontrados en ventas:');
    estadosResult.rows.forEach(row => {
      console.log(`  - ${row.estado || 'NULL'}: ${row.cantidad} ventas`);
    });
    
    // 2. Verificar ventas de una mesa específica (ejemplo: mesa 1)
    console.log('\n2️⃣ VERIFICANDO VENTAS DE MESA 1...');
    const mesaVentasResult = await pool.query(`
      SELECT 
        v.id_venta,
        v.fecha,
        v.total,
        v.estado,
        v.mesa_numero,
        v.id_sucursal,
        COUNT(dv.id_detalle) as items_count
      FROM ventas v
      LEFT JOIN detalle_ventas dv ON v.id_venta = dv.id_venta
      WHERE v.mesa_numero = 1
      GROUP BY v.id_venta, v.fecha, v.total, v.estado, v.mesa_numero, v.id_sucursal
      ORDER BY v.fecha DESC
      LIMIT 5
    `);
    
    console.log(`Ventas encontradas para mesa 1: ${mesaVentasResult.rows.length}`);
    mesaVentasResult.rows.forEach((venta, index) => {
      console.log(`  Venta ${index + 1}: ID=${venta.id_venta}, Estado=${venta.estado}, Total=${venta.total}, Items=${venta.items_count}, Fecha=${venta.fecha}`);
    });
    
    // 3. Verificar detalle de ventas de una mesa
    console.log('\n3️⃣ VERIFICANDO DETALLE DE VENTAS DE MESA 1...');
    const detalleResult = await pool.query(`
      SELECT 
        v.id_venta,
        v.estado as estado_venta,
        v.mesa_numero,
        dv.id_detalle,
        dv.cantidad,
        dv.precio_unitario,
        dv.subtotal,
        p.nombre as nombre_producto,
        p.id_producto
      FROM ventas v
      JOIN detalle_ventas dv ON v.id_venta = dv.id_venta
      JOIN productos p ON dv.id_producto = p.id_producto
      WHERE v.mesa_numero = 1
      ORDER BY v.fecha DESC
      LIMIT 10
    `);
    
    console.log(`Detalles encontrados para mesa 1: ${detalleResult.rows.length}`);
    detalleResult.rows.forEach((detalle, index) => {
      console.log(`  ${index + 1}. Venta ${detalle.id_venta} (${detalle.estado_venta}): ${detalle.cantidad}x ${detalle.nombre_producto} = $${detalle.subtotal}`);
    });
    
    // 4. Probar la consulta exacta que usa generarPrefactura
    console.log('\n4️⃣ PROBANDO CONSULTA EXACTA DE generarPrefactura...');
    
    // Primero, obtener una mesa con ventas
    const mesaConVentas = await pool.query(`
      SELECT DISTINCT m.id_mesa, m.numero, m.id_sucursal
      FROM mesas m
      JOIN ventas v ON v.mesa_numero = m.numero
      WHERE v.id_restaurante = 1
      LIMIT 1
    `);
    
    if (mesaConVentas.rows.length === 0) {
      console.log('❌ No se encontraron mesas con ventas');
      return;
    }
    
    const mesa = mesaConVentas.rows[0];
    console.log(`Probando con mesa ${mesa.numero} (ID: ${mesa.id_mesa}, Sucursal: ${mesa.id_sucursal})`);
    
    // Probar la consulta del total
    const totalQuery = `
      SELECT 
        COALESCE(SUM(dv.subtotal), 0) as total_acumulado,
        COUNT(DISTINCT v.id_venta) as total_ventas,
        COUNT(dv.id_detalle) as total_items
      FROM ventas v
      JOIN detalle_ventas dv ON dv.id_venta = v.id_venta
      WHERE v.mesa_numero = $1 
        AND v.id_sucursal = $2
        AND v.id_restaurante = $3
        AND v.estado IN ('recibido', 'en_preparacion', 'listo_para_servir', 'entregado', 'cancelado')
    `;
    
    const totalResult = await pool.query(totalQuery, [mesa.numero, mesa.id_sucursal, 1]);
    console.log(`Total calculado: $${totalResult.rows[0].total_acumulado}, Ventas: ${totalResult.rows[0].total_ventas}, Items: ${totalResult.rows[0].total_items}`);
    
    // Probar la consulta del historial
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
      ORDER BY v.fecha DESC
    `;
    
    const historialResult = await pool.query(historialQuery, [mesa.numero, mesa.id_sucursal, 1]);
    console.log(`Historial obtenido: ${historialResult.rows.length} registros`);
    
    if (historialResult.rows.length > 0) {
      console.log('Primer registro del historial:');
      console.log(JSON.stringify(historialResult.rows[0], null, 2));
    }
    
    // 5. Probar con estados más amplios
    console.log('\n5️⃣ PROBANDO CON ESTADOS MÁS AMPLIOS...');
    const historialAmplioQuery = `
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
      ORDER BY v.fecha DESC
    `;
    
    const historialAmplioResult = await pool.query(historialAmplioQuery, [mesa.numero, mesa.id_sucursal, 1]);
    console.log(`Historial sin filtro de estado: ${historialAmplioResult.rows.length} registros`);
    
    if (historialAmplioResult.rows.length > 0) {
      console.log('Estados encontrados sin filtro:');
      const estadosSinFiltro = [...new Set(historialAmplioResult.rows.map(r => r.estado))];
      estadosSinFiltro.forEach(estado => {
        const count = historialAmplioResult.rows.filter(r => r.estado === estado).length;
        console.log(`  - ${estado}: ${count} registros`);
      });
    }
    
    // 6. Verificar si hay productos en la mesa
    console.log('\n6️⃣ VERIFICANDO PRODUCTOS EN LA MESA...');
    const productosMesaQuery = `
      SELECT 
        COUNT(DISTINCT v.id_venta) as total_ventas,
        COUNT(dv.id_detalle) as total_items,
        COUNT(DISTINCT p.id_producto) as productos_diferentes
      FROM ventas v
      JOIN detalle_ventas dv ON v.id_venta = dv.id_venta
      JOIN productos p ON dv.id_producto = p.id_producto
      WHERE v.mesa_numero = $1 AND v.id_sucursal = $2 AND v.id_restaurante = $3
    `;
    
    const productosResult = await pool.query(productosMesaQuery, [mesa.numero, mesa.id_sucursal, 1]);
    console.log(`Resumen de productos en mesa ${mesa.numero}:`);
    console.log(`  - Total ventas: ${productosResult.rows[0].total_ventas}`);
    console.log(`  - Total items: ${productosResult.rows[0].total_items}`);
    console.log(`  - Productos diferentes: ${productosResult.rows[0].productos_diferentes}`);
    
    console.log('\n🏁 DIAGNÓSTICO COMPLETADO');
    
  } catch (error) {
    console.error('❌ Error en diagnóstico:', error);
  } finally {
    await pool.end();
  }
}

debugPrefacturaProductos();
