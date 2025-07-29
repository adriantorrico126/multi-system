const { pool } = require('./src/config/database');

async function testPedidosPendientes() {
  try {
    console.log('🔍 Verificando pedidos pendientes de aprobación...');
    
    // 1. Verificar ventas con estado pendiente_aprobacion
    const ventasQuery = `
      SELECT 
        v.id_venta,
        v.fecha,
        v.total,
        v.tipo_servicio,
        v.mesa_numero,
        v.estado,
        vend.nombre as nombre_mesero,
        vend.username as username_mesero,
        vend.rol as rol_mesero
      FROM ventas v
      JOIN vendedores vend ON v.id_vendedor = vend.id_vendedor
      WHERE v.estado = 'pendiente_aprobacion'
      ORDER BY v.fecha DESC
      LIMIT 10
    `;
    
    const ventasResult = await pool.query(ventasQuery);
    console.log('\n📊 Ventas con estado pendiente_aprobacion:');
    console.log('Total encontradas:', ventasResult.rows.length);
    ventasResult.rows.forEach(venta => {
      console.log(`- Venta #${venta.id_venta}: ${venta.tipo_servicio} - ${venta.nombre_mesero} (${venta.rol_mesero}) - Bs ${venta.total}`);
    });
    
    // 2. Verificar todos los estados de ventas
    const estadosQuery = `
      SELECT 
        estado,
        COUNT(*) as cantidad
      FROM ventas 
      GROUP BY estado
      ORDER BY cantidad DESC
    `;
    
    const estadosResult = await pool.query(estadosQuery);
    console.log('\n📈 Estados de ventas en el sistema:');
    estadosResult.rows.forEach(estado => {
      console.log(`- ${estado.estado}: ${estado.cantidad} ventas`);
    });
    
    // 3. Verificar ventas de meseros específicamente
    const meserosQuery = `
      SELECT 
        v.id_venta,
        v.fecha,
        v.total,
        v.tipo_servicio,
        v.estado,
        vend.nombre as nombre_mesero,
        vend.username as username_mesero,
        vend.rol as rol_mesero
      FROM ventas v
      JOIN vendedores vend ON v.id_vendedor = vend.id_vendedor
      WHERE vend.rol = 'mesero'
      ORDER BY v.fecha DESC
      LIMIT 10
    `;
    
    const meserosResult = await pool.query(meserosQuery);
    console.log('\n👨‍💼 Ventas de meseros:');
    console.log('Total encontradas:', meserosResult.rows.length);
    meserosResult.rows.forEach(venta => {
      console.log(`- Venta #${venta.id_venta}: ${venta.tipo_servicio} - ${venta.nombre_mesero} - Estado: ${venta.estado} - Bs ${venta.total}`);
    });
    
    // 4. Verificar la función específica de pedidos pendientes
    const pendientesQuery = `
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
        AND vend.rol = 'mesero'
      GROUP BY 
        v.id_venta, v.fecha, v.total, v.tipo_servicio, 
        v.mesa_numero, v.estado, vend.nombre, vend.username
      ORDER BY v.fecha ASC
    `;
    
    const pendientesResult = await pool.query(pendientesQuery);
    console.log('\n⏳ Pedidos pendientes de aprobación (función específica):');
    console.log('Total encontrados:', pendientesResult.rows.length);
    pendientesResult.rows.forEach(pedido => {
      console.log(`- Pedido #${pedido.id_venta}: ${pedido.tipo_servicio} - ${pedido.nombre_mesero} - Bs ${pedido.total}`);
      console.log(`  Productos: ${pedido.productos.length} items`);
    });
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  } finally {
    await pool.end();
  }
}

testPedidosPendientes(); 