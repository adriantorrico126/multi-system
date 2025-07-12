const db = require('./src/config/database');

async function createTestVenta() {
  try {
    console.log('🚀 Creando venta de prueba...\n');
    
    // Obtener datos necesarios
    const vendedorResult = await db.query("SELECT id_vendedor FROM vendedores WHERE username = 'admin' LIMIT 1");
    const pagoResult = await db.query("SELECT id_pago FROM metodos_pago WHERE descripcion = 'Efectivo' LIMIT 1");
    const sucursalResult = await db.query("SELECT id_sucursal FROM sucursales WHERE nombre = 'Sucursal 16 de Julio' LIMIT 1");
    
    const vendedor = vendedorResult.rows[0];
    const pago = pagoResult.rows[0];
    const sucursal = sucursalResult.rows[0];
    
    if (!vendedor || !pago || !sucursal) {
      console.log('❌ No se encontraron los datos necesarios');
      return;
    }
    
    // Crear venta
    const ventaResult = await db.query(`
      INSERT INTO ventas (fecha, id_vendedor, id_pago, id_sucursal, tipo_servicio, total, mesa_numero, estado)
      VALUES (NOW(), $1, $2, $3, $4, $5, $6, 'recibido')
      RETURNING id_venta, fecha, estado, mesa_numero, total
    `, [vendedor.id_vendedor, pago.id_pago, sucursal.id_sucursal, 'Mesa', 12.00, 8]);
    
    const venta = ventaResult.rows[0];
    console.log('✅ Venta creada:', venta);
    
    // Crear detalle
    const detalleResult = await db.query(`
      INSERT INTO detalle_ventas (id_venta, id_producto, cantidad, precio_unitario, observaciones)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id_detalle, id_venta, id_producto, cantidad, precio_unitario
    `, [venta.id_venta, 93, 2, 6.00, 'Prueba desde script']);
    
    const detalle = detalleResult.rows[0];
    console.log('✅ Detalle creado:', detalle);
    
    console.log('✅ Venta de prueba creada exitosamente');
    
  } catch (error) {
    console.error('❌ Error creando venta de prueba:', error);
  }
}

async function checkVentaStates() {
  try {
    console.log('🔍 Verificando estados de las ventas...\n');
    
    // Verificar las últimas ventas y sus estados
    const ventasResult = await db.query(`
      SELECT id_venta, fecha, total, estado, mesa_numero 
      FROM ventas 
      ORDER BY id_venta DESC 
      LIMIT 10
    `);
    
    console.log('Últimas 10 ventas:');
    ventasResult.rows.forEach(venta => {
      console.log(`- Venta ${venta.id_venta}: ${venta.estado || 'NULL'} (mesa: ${venta.mesa_numero}, total: ${venta.total})`);
    });
    
    console.log('\n---');
    
    // Verificar cuántas ventas tienen cada estado
    const estadosResult = await db.query(`
      SELECT estado, COUNT(*) as cantidad
      FROM ventas 
      GROUP BY estado
      ORDER BY cantidad DESC
    `);
    
    console.log('Distribución de estados:');
    estadosResult.rows.forEach(row => {
      console.log(`- ${row.estado || 'NULL'}: ${row.cantidad} ventas`);
    });
    
    console.log('\n---');
    
    // Verificar ventas que deberían aparecer en cocina
    const cocinaResult = await db.query(`
      SELECT v.id_venta, v.estado, v.fecha, v.total
      FROM ventas v
      WHERE v.estado IN ('recibido', 'en_preparacion', 'listo_para_servir')
      ORDER BY v.fecha DESC
      LIMIT 5
    `);
    
    console.log('Ventas que aparecen en cocina:');
    cocinaResult.rows.forEach(venta => {
      console.log(`- Venta ${venta.id_venta}: ${venta.estado} (${venta.fecha})`);
    });
    
    console.log('\n---');
    
    // Verificar comanda completa
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
          v.estado IN ('recibido', 'en_preparacion', 'listo_para_servir')
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
    
    console.log('\n🏁 Verificación completada');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Ejecutar ambas funciones
async function main() {
  await createTestVenta();
  console.log('\n' + '='.repeat(50) + '\n');
  await checkVentaStates();
}

main(); 