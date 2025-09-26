const db = require('./src/config/database');

async function checkComanda() {
  try {
    console.log('🔍 Verificando comanda...\n');
    
    // Verificar pedidos en comanda (estados: recibido, en_preparacion, listo_para_servir)
    const comandaQuery = `
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
          v.estado IN ('recibido', 'en_preparacion')
      GROUP BY
          v.id_venta, v.fecha, v.mesa_numero, v.tipo_servicio, v.estado, v.total
      ORDER BY
          v.fecha ASC;
    `;
    
    const comandaResult = await db.query(comandaQuery);
    console.log('📋 Pedidos en comanda:', comandaResult.rows.length);
    
    if (comandaResult.rows.length > 0) {
      comandaResult.rows.forEach((pedido, index) => {
        console.log(`\n- Pedido ${index + 1}:`);
        console.log(`  Venta: ${pedido.id_venta}`);
        console.log(`  Estado: ${pedido.estado}`);
        console.log(`  Mesa: ${pedido.mesa_numero}`);
        console.log(`  Total: ${pedido.total}`);
        console.log(`  Fecha: ${pedido.fecha}`);
        console.log(`  Productos: ${pedido.productos.length}`);
        pedido.productos.forEach((producto, pIndex) => {
          console.log(`    ${pIndex + 1}. ${producto.cantidad}x ${producto.nombre_producto} - ${producto.observaciones || 'Sin observaciones'}`);
        });
      });
    } else {
      console.log('❌ No hay pedidos en la comanda');
    }
    
    console.log('\n---');
    
    // Verificar todas las ventas recientes
    const ventasQuery = `
      SELECT id_venta, fecha, estado, mesa_numero, total
      FROM ventas 
      ORDER BY id_venta DESC 
      LIMIT 10
    `;
    
    const ventasResult = await db.query(ventasQuery);
    console.log('📊 Últimas 10 ventas:');
    ventasResult.rows.forEach(venta => {
      console.log(`- Venta ${venta.id_venta}: ${venta.estado} (mesa: ${venta.mesa_numero}, total: ${venta.total})`);
    });
    
    console.log('\n🏁 Verificación completada');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkComanda(); 