const { pool } = require('./src/config/database');

async function debugInconsistenciaVentas() {
  try {
    console.log('🔍 DEBUG: INVESTIGANDO INCONSISTENCIA EN VENTAS\n');
    
    // 1. Verificar todas las ventas en el sistema
    console.log('1️⃣ TODAS LAS VENTAS EN EL SISTEMA:');
    const todasVentas = await pool.query(`
      SELECT 
        v.id_venta,
        v.id_mesa,
        v.mesa_numero,
        v.id_sucursal,
        v.id_restaurante,
        v.estado,
        v.total,
        v.fecha,
        COUNT(dv.id_detalle) as items_count
      FROM ventas v
      LEFT JOIN detalle_ventas dv ON v.id_venta = dv.id_venta
      GROUP BY v.id_venta, v.id_mesa, v.mesa_numero, v.id_sucursal, v.id_restaurante, v.estado, v.total, v.fecha
      ORDER BY v.fecha DESC
      LIMIT 20
    `);
    
    console.log(`Total ventas en sistema: ${todasVentas.rows.length}`);
    todasVentas.rows.forEach((venta, index) => {
      console.log(`  ${index + 1}. ID=${venta.id_venta}, Mesa=${venta.mesa_numero} (ID:${venta.id_mesa}), Sucursal=${venta.id_sucursal}, Restaurante=${venta.id_restaurante}, Estado=${venta.estado}, Total=${venta.total}, Items=${venta.items_count}, Fecha=${venta.fecha}`);
    });
    
    // 2. Verificar ventas específicamente para mesa 1
    console.log('\n2️⃣ VENTAS PARA MESA 1 (número):');
    const ventasMesa1 = await pool.query(`
      SELECT 
        v.id_venta,
        v.id_mesa,
        v.mesa_numero,
        v.id_sucursal,
        v.id_restaurante,
        v.estado,
        v.total,
        v.fecha,
        COUNT(dv.id_detalle) as items_count
      FROM ventas v
      LEFT JOIN detalle_ventas dv ON v.id_venta = dv.id_venta
      WHERE v.mesa_numero = 1
      GROUP BY v.id_venta, v.id_mesa, v.mesa_numero, v.id_sucursal, v.id_restaurante, v.estado, v.total, v.fecha
      ORDER BY v.fecha DESC
    `);
    
    console.log(`Ventas para mesa número 1: ${ventasMesa1.rows.length}`);
    ventasMesa1.rows.forEach((venta, index) => {
      console.log(`  ${index + 1}. ID=${venta.id_venta}, Mesa=${venta.mesa_numero} (ID:${venta.id_mesa}), Sucursal=${venta.id_sucursal}, Restaurante=${venta.id_restaurante}, Estado=${venta.estado}, Total=${venta.total}, Items=${venta.items_count}, Fecha=${venta.fecha}`);
    });
    
    // 3. Verificar ventas para mesa ID 31
    console.log('\n3️⃣ VENTAS PARA MESA ID 31:');
    const ventasMesa31 = await pool.query(`
      SELECT 
        v.id_venta,
        v.id_mesa,
        v.mesa_numero,
        v.id_sucursal,
        v.id_restaurante,
        v.estado,
        v.total,
        v.fecha,
        COUNT(dv.id_detalle) as items_count
      FROM ventas v
      LEFT JOIN detalle_ventas dv ON v.id_venta = dv.id_venta
      WHERE v.id_mesa = 31
      GROUP BY v.id_venta, v.id_mesa, v.mesa_numero, v.id_sucursal, v.id_restaurante, v.estado, v.total, v.fecha
      ORDER BY v.fecha DESC
    `);
    
    console.log(`Ventas para mesa ID 31: ${ventasMesa31.rows.length}`);
    ventasMesa31.rows.forEach((venta, index) => {
      console.log(`  ${index + 1}. ID=${venta.id_venta}, Mesa=${venta.mesa_numero} (ID:${venta.id_mesa}), Sucursal=${venta.id_sucursal}, Restaurante=${venta.id_restaurante}, Estado=${venta.estado}, Total=${venta.total}, Items=${venta.items_count}, Fecha=${venta.fecha}`);
    });
    
    // 4. Verificar ventas para sucursal 6
    console.log('\n4️⃣ VENTAS PARA SUCURSAL 6:');
    const ventasSucursal6 = await pool.query(`
      SELECT 
        v.id_venta,
        v.id_mesa,
        v.mesa_numero,
        v.id_sucursal,
        v.id_restaurante,
        v.estado,
        v.total,
        v.fecha,
        COUNT(dv.id_detalle) as items_count
      FROM ventas v
      LEFT JOIN detalle_ventas dv ON v.id_venta = dv.id_venta
      WHERE v.id_sucursal = 6
      GROUP BY v.id_venta, v.id_mesa, v.mesa_numero, v.id_sucursal, v.id_restaurante, v.estado, v.total, v.fecha
      ORDER BY v.fecha DESC
      LIMIT 10
    `);
    
    console.log(`Ventas para sucursal 6: ${ventasSucursal6.rows.length}`);
    ventasSucursal6.rows.forEach((venta, index) => {
      console.log(`  ${index + 1}. ID=${venta.id_venta}, Mesa=${venta.mesa_numero} (ID:${venta.id_mesa}), Sucursal=${venta.id_sucursal}, Restaurante=${venta.id_restaurante}, Estado=${venta.estado}, Total=${venta.total}, Items=${venta.items_count}, Fecha=${venta.fecha}`);
    });
    
    // 5. Verificar ventas para restaurante 1
    console.log('\n5️⃣ VENTAS PARA RESTAURANTE 1:');
    const ventasRestaurante1 = await pool.query(`
      SELECT 
        v.id_venta,
        v.id_mesa,
        v.mesa_numero,
        v.id_sucursal,
        v.id_restaurante,
        v.estado,
        v.total,
        v.fecha,
        COUNT(dv.id_detalle) as items_count
      FROM ventas v
      LEFT JOIN detalle_ventas dv ON v.id_venta = dv.id_venta
      WHERE v.id_restaurante = 1
      GROUP BY v.id_venta, v.id_mesa, v.mesa_numero, v.id_sucursal, v.id_restaurante, v.estado, v.total, v.fecha
      ORDER BY v.fecha DESC
      LIMIT 10
    `);
    
    console.log(`Ventas para restaurante 1: ${ventasRestaurante1.rows.length}`);
    ventasRestaurante1.rows.forEach((venta, index) => {
      console.log(`  ${index + 1}. ID=${venta.id_venta}, Mesa=${venta.mesa_numero} (ID:${venta.id_mesa}), Sucursal=${venta.id_sucursal}, Restaurante=${venta.id_restaurante}, Estado=${venta.estado}, Total=${venta.total}, Items=${venta.items_count}, Fecha=${venta.fecha}`);
    });
    
    // 6. Verificar si hay detalles de venta sin ventas
    console.log('\n6️⃣ DETALLES DE VENTA SIN VENTAS:');
    const detallesSinVentas = await pool.query(`
      SELECT 
        dv.id_detalle,
        dv.id_venta,
        dv.id_producto,
        dv.cantidad,
        dv.subtotal,
        p.nombre as nombre_producto
      FROM detalle_ventas dv
      LEFT JOIN productos p ON dv.id_producto = p.id_producto
      WHERE dv.id_venta NOT IN (SELECT id_venta FROM ventas)
      LIMIT 10
    `);
    
    console.log(`Detalles sin ventas: ${detallesSinVentas.rows.length}`);
    detallesSinVentas.rows.forEach((detalle, index) => {
      console.log(`  ${index + 1}. ID=${detalle.id_detalle}, Venta=${detalle.id_venta}, Producto=${detalle.nombre_producto}, Cantidad=${detalle.cantidad}, Subtotal=${detalle.subtotal}`);
    });
    
    // 7. Verificar la estructura de la tabla ventas
    console.log('\n7️⃣ ESTRUCTURA DE TABLA VENTAS:');
    const estructuraVentas = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'ventas'
      ORDER BY ordinal_position
    `);
    
    console.log('Columnas de tabla ventas:');
    estructuraVentas.rows.forEach((col, index) => {
      console.log(`  ${index + 1}. ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    console.log('\n🏁 INVESTIGACIÓN COMPLETADA');
    
  } catch (error) {
    console.error('❌ Error en investigación:', error);
  } finally {
    await pool.end();
  }
}

debugInconsistenciaVentas();
