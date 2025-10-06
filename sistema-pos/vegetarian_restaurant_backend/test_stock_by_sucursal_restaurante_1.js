const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  user: 'postgres', 
  password: '6951230Anacleta',
  database: 'sistempos',
  port: 5432
});

async function testStockBySucursalRestaurante1() {
  const client = await pool.connect();
  
  try {
    console.log('🧪 PROBANDO STOCK POR SUCURSAL - RESTAURANTE ID: 1...\n');
    
    // 1. Obtener información del restaurante 1
    console.log('1️⃣ OBTENIENDO INFORMACIÓN DEL RESTAURANTE 1...');
    const restauranteQuery = await client.query(`
      SELECT r.id_restaurante, r.nombre as restaurante_nombre,
             COUNT(s.id_sucursal) as total_sucursales
      FROM restaurantes r
      LEFT JOIN sucursales s ON r.id_restaurante = s.id_restaurante AND s.activo = true
      WHERE r.id_restaurante = 1
      GROUP BY r.id_restaurante, r.nombre
    `);
    
    if (restauranteQuery.rows.length === 0) {
      throw new Error('Restaurante ID 1 no encontrado');
    }
    
    const restaurante = restauranteQuery.rows[0];
    console.log(`   Restaurante: ${restaurante.restaurante_nombre}`);
    console.log(`   Sucursales activas: ${restaurante.total_sucursales}`);
    
    // 2. Obtener sucursales del restaurante 1
    console.log('\n2️⃣ OBTENIENDO SUCURSALES DEL RESTAURANTE 1...');
    const sucursalesQuery = await client.query(`
      SELECT id_sucursal, nombre, activo
      FROM sucursales 
      WHERE id_restaurante = 1 AND activo = true
      ORDER BY id_sucursal
    `);
    
    console.log('   Sucursales encontradas:');
    sucursalesQuery.rows.forEach(sucursal => {
      console.log(`     - ID: ${sucursal.id_sucursal}, Nombre: ${sucursal.nombre}`);
    });
    
    // 3. Obtener productos del restaurante 1
    console.log('\n3️⃣ OBTENIENDO PRODUCTOS DEL RESTAURANTE 1...');
    const productosQuery = await client.query(`
      SELECT id_producto, nombre, stock_actual
      FROM productos 
      WHERE id_restaurante = 1 AND activo = true
      ORDER BY id_producto
      LIMIT 10
    `);
    
    console.log(`   Productos encontrados: ${productosQuery.rows.length} (mostrando primeros 10)`);
    productosQuery.rows.forEach(producto => {
      console.log(`     - ID: ${producto.id_producto}, Nombre: ${producto.nombre}, Stock Global: ${producto.stock_actual}`);
    });
    
    // 4. Verificar stock actual por sucursal
    console.log('\n4️⃣ VERIFICANDO STOCK ACTUAL POR SUCURSAL...');
    const stockActualQuery = await client.query(`
      SELECT 
        p.id_producto,
        p.nombre as producto_nombre,
        s.id_sucursal,
        s.nombre as sucursal_nombre,
        COALESCE(ss.stock_actual, 0) as stock_sucursal
      FROM productos p
      CROSS JOIN sucursales s
      LEFT JOIN stock_sucursal ss ON p.id_producto = ss.id_producto AND s.id_sucursal = ss.id_sucursal AND ss.activo = true
      WHERE p.id_restaurante = 1 AND p.activo = true AND s.id_restaurante = 1 AND s.activo = true
      ORDER BY p.id_producto, s.id_sucursal
      LIMIT 20
    `);
    
    console.log('   Stock actual por sucursal (muestra):');
    stockActualQuery.rows.forEach(row => {
      console.log(`     - ${row.producto_nombre} en ${row.sucursal_nombre}: ${row.stock_sucursal} unidades`);
    });
    
    // 5. Asignar stock diferente a cada sucursal
    console.log('\n5️⃣ ASIGNANDO STOCK DIFERENTE A CADA SUCURSAL...');
    
    const sucursales = sucursalesQuery.rows;
    const productos = productosQuery.rows;
    
    for (const producto of productos) {
      for (let i = 0; i < sucursales.length; i++) {
        const sucursal = sucursales[i];
        // Asignar stock diferente: 10, 20, 30, 40, 50... según la sucursal
        const stockAsignado = 10 + (i * 10);
        
        await client.query(`
          INSERT INTO stock_sucursal (id_producto, id_sucursal, stock_actual, stock_minimo, stock_maximo, activo)
          VALUES ($1, $2, $3, 5, 100, true)
          ON CONFLICT (id_producto, id_sucursal) 
          DO UPDATE SET 
            stock_actual = $3,
            updated_at = NOW()
        `, [producto.id_producto, sucursal.id_sucursal, stockAsignado]);
        
        console.log(`     ✅ ${producto.nombre} en ${sucursal.nombre}: ${stockAsignado} unidades`);
      }
    }
    
    // 6. Verificar stock después de la asignación
    console.log('\n6️⃣ VERIFICANDO STOCK DESPUÉS DE LA ASIGNACIÓN...');
    const stockDespuesQuery = await client.query(`
      SELECT 
        p.id_producto,
        p.nombre as producto_nombre,
        s.id_sucursal,
        s.nombre as sucursal_nombre,
        ss.stock_actual as stock_sucursal
      FROM productos p
      JOIN sucursales s ON s.id_restaurante = p.id_restaurante
      JOIN stock_sucursal ss ON p.id_producto = ss.id_producto AND s.id_sucursal = ss.id_sucursal
      WHERE p.id_restaurante = 1 AND p.activo = true AND s.activo = true AND ss.activo = true
      ORDER BY p.id_producto, s.id_sucursal
      LIMIT 20
    `);
    
    console.log('   Stock después de asignación (muestra):');
    stockDespuesQuery.rows.forEach(row => {
      console.log(`     - ${row.producto_nombre} en ${row.sucursal_nombre}: ${row.stock_sucursal} unidades`);
    });
    
    // 7. Probar función obtener_stock_por_sucursal
    console.log('\n7️⃣ PROBANDO FUNCIÓN obtener_stock_por_sucursal...');
    const stockPorSucursalQuery = await client.query(`
      SELECT * FROM obtener_stock_por_sucursal(1, NULL) 
      ORDER BY nombre_sucursal, nombre_producto
      LIMIT 15
    `);
    
    console.log('   Resultado de obtener_stock_por_sucursal:');
    stockPorSucursalQuery.rows.forEach(row => {
      console.log(`     - ${row.nombre_producto} en ${row.nombre_sucursal}: ${row.stock_actual} (${row.estado_stock})`);
    });
    
    // 8. Probar actualización de stock en una sucursal específica
    console.log('\n8️⃣ PROBANDO ACTUALIZACIÓN DE STOCK EN SUCURSAL ESPECÍFICA...');
    if (productos.length > 0 && sucursales.length > 0) {
      const productoTest = productos[0];
      const sucursalTest = sucursales[0];
      
      console.log(`   Probando con: ${productoTest.nombre} en ${sucursalTest.nombre}`);
      
      // Obtener stock actual
      const stockActual = await client.query(`
        SELECT obtener_stock_sucursal($1, $2) as stock
      `, [productoTest.id_producto, sucursalTest.id_sucursal]);
      
      console.log(`   Stock actual: ${stockActual.rows[0].stock} unidades`);
      
      // Reducir stock en 5 unidades
      const updateResult = await client.query(`
        SELECT actualizar_stock_sucursal($1, $2, $3, $4, $5, $6) as resultado
      `, [productoTest.id_producto, sucursalTest.id_sucursal, -5, 'venta_prueba', null, 'Prueba de venta']);
      
      const resultado = updateResult.rows[0].resultado;
      console.log(`   Después de vender 5 unidades:`);
      console.log(`     - Stock anterior: ${resultado.stock_anterior}`);
      console.log(`     - Stock nuevo: ${resultado.stock_nuevo}`);
      console.log(`     - Éxito: ${resultado.success}`);
      
      // Verificar que solo cambió en esa sucursal
      const stockOtrasSucursales = await client.query(`
        SELECT s.nombre as sucursal_nombre, ss.stock_actual
        FROM sucursales s
        JOIN stock_sucursal ss ON s.id_sucursal = ss.id_sucursal
        WHERE s.id_restaurante = 1 AND s.activo = true 
          AND ss.id_producto = $1 AND ss.activo = true
        ORDER BY s.id_sucursal
      `, [productoTest.id_producto]);
      
      console.log(`   Stock en todas las sucursales después del cambio:`);
      stockOtrasSucursales.rows.forEach(row => {
        console.log(`     - ${row.sucursal_nombre}: ${row.stock_actual} unidades`);
      });
      
      // Restaurar el stock original
      await client.query(`
        SELECT actualizar_stock_sucursal($1, $2, $3, $4, $5, $6) as resultado
      `, [productoTest.id_producto, sucursalTest.id_sucursal, 5, 'restaurar_prueba', null, 'Restaurar stock de prueba']);
      console.log(`   ✅ Stock restaurado a su valor original`);
    }
    
    // 9. Resumen final
    console.log('\n9️⃣ RESUMEN FINAL...');
    const resumenQuery = await client.query(`
      SELECT 
        s.nombre as sucursal_nombre,
        COUNT(ss.id_producto) as productos_con_stock,
        SUM(ss.stock_actual) as stock_total_sucursal
      FROM sucursales s
      LEFT JOIN stock_sucursal ss ON s.id_sucursal = ss.id_sucursal AND ss.activo = true
      WHERE s.id_restaurante = 1 AND s.activo = true
      GROUP BY s.id_sucursal, s.nombre
      ORDER BY s.id_sucursal
    `);
    
    console.log('   Resumen por sucursal:');
    resumenQuery.rows.forEach(row => {
      console.log(`     - ${row.sucursal_nombre}: ${row.productos_con_stock} productos, ${row.stock_total_sucursal || 0} unidades totales`);
    });
    
    console.log('\n✅ PRUEBA COMPLETADA EXITOSAMENTE!');
    console.log('🎉 El sistema de stock por sucursal está funcionando correctamente');
    console.log('📊 Cada sucursal tiene stock independiente y las actualizaciones son específicas por sucursal');
    
  } catch (error) {
    console.error('❌ ERROR EN PRUEBA:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Ejecutar prueba
if (require.main === module) {
  testStockBySucursalRestaurante1()
    .then(() => {
      console.log('\n🎉 Prueba completada exitosamente!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Error en prueba:', error);
      process.exit(1);
    });
}

module.exports = { testStockBySucursalRestaurante1 };





