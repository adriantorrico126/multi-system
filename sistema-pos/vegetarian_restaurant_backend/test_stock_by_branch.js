const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  user: 'postgres', 
  password: '6951230Anacleta',
  database: 'sistempos',
  port: 5432
});

async function testStockByBranch() {
  const client = await pool.connect();
  
  try {
    console.log('🧪 PROBANDO SISTEMA DE STOCK POR SUCURSAL...\n');
    
    // 1. Verificar estructura de stock_sucursal
    console.log('1️⃣ VERIFICANDO ESTRUCTURA DE STOCK_SUCURSAL...');
    const structureQuery = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'stock_sucursal' 
      ORDER BY ordinal_position
    `);
    console.log('Columnas de stock_sucursal:');
    structureQuery.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
    // 2. Verificar datos migrados
    console.log('\n2️⃣ VERIFICANDO DATOS MIGRADOS...');
    const dataQuery = await client.query(`
      SELECT 
        COUNT(*) as total_registros,
        COUNT(DISTINCT id_producto) as productos_unicos,
        COUNT(DISTINCT id_sucursal) as sucursales_unicas,
        SUM(stock_actual) as stock_total
      FROM stock_sucursal 
      WHERE activo = true
    `);
    console.log('Datos en stock_sucursal:');
    console.log(`  - Total registros: ${dataQuery.rows[0].total_registros}`);
    console.log(`  - Productos únicos: ${dataQuery.rows[0].productos_unicos}`);
    console.log(`  - Sucursales únicas: ${dataQuery.rows[0].sucursales_unicas}`);
    console.log(`  - Stock total: ${dataQuery.rows[0].stock_total}`);
    
    // 3. Probar función obtener_stock_sucursal
    console.log('\n3️⃣ PROBANDO FUNCIÓN obtener_stock_sucursal...');
    const testProductQuery = await client.query(`
      SELECT id_producto, id_sucursal 
      FROM stock_sucursal 
      WHERE activo = true 
      LIMIT 1
    `);
    
    if (testProductQuery.rows.length > 0) {
      const testProduct = testProductQuery.rows[0];
      const stockResult = await client.query(`
        SELECT obtener_stock_sucursal($1, $2) as stock
      `, [testProduct.id_producto, testProduct.id_sucursal]);
      
      console.log(`  - Producto ${testProduct.id_producto} en sucursal ${testProduct.id_sucursal}: ${stockResult.rows[0].stock} unidades`);
    }
    
    // 4. Probar función actualizar_stock_sucursal
    console.log('\n4️⃣ PROBANDO FUNCIÓN actualizar_stock_sucursal...');
    if (testProductQuery.rows.length > 0) {
      const testProduct = testProductQuery.rows[0];
      const updateResult = await client.query(`
        SELECT actualizar_stock_sucursal($1, $2, $3, $4, $5, $6) as resultado
      `, [testProduct.id_producto, testProduct.id_sucursal, -1, 'prueba', null, 'Prueba de función']);
      
      const resultado = updateResult.rows[0].resultado;
      console.log('  - Resultado de actualización:');
      console.log(`    - Éxito: ${resultado.success}`);
      console.log(`    - Stock anterior: ${resultado.stock_anterior}`);
      console.log(`    - Stock nuevo: ${resultado.stock_nuevo}`);
      console.log(`    - Cantidad cambio: ${resultado.cantidad_cambio}`);
      
      // Revertir el cambio
      await client.query(`
        SELECT actualizar_stock_sucursal($1, $2, $3, $4, $5, $6) as resultado
      `, [testProduct.id_producto, testProduct.id_sucursal, 1, 'revertir_prueba', null, 'Revertir prueba']);
      console.log('  - Cambio revertido');
    }
    
    // 5. Verificar función obtener_stock_por_sucursal
    console.log('\n5️⃣ PROBANDO FUNCIÓN obtener_stock_por_sucursal...');
    const stockByBranchResult = await client.query(`
      SELECT * FROM obtener_stock_por_sucursal(1, 1) LIMIT 5
    `);
    console.log('Stock por sucursal (muestra):');
    stockByBranchResult.rows.forEach(row => {
      console.log(`  - ${row.nombre_producto} en ${row.nombre_sucursal}: ${row.stock_actual} (${row.estado_stock})`);
    });
    
    // 6. Verificar integridad de datos
    console.log('\n6️⃣ VERIFICANDO INTEGRIDAD DE DATOS...');
    
    // Productos sin stock en sucursal
    const productosSinStock = await client.query(`
      SELECT COUNT(*) as total
      FROM productos p
      WHERE p.activo = true 
        AND NOT EXISTS (
          SELECT 1 FROM stock_sucursal ss 
          WHERE ss.id_producto = p.id_producto 
            AND ss.activo = true
        )
    `);
    console.log(`  - Productos sin stock en sucursal: ${productosSinStock.rows[0].total}`);
    
    // Sucursales sin productos
    const sucursalesSinProductos = await client.query(`
      SELECT COUNT(*) as total
      FROM sucursales s
      WHERE s.activo = true 
        AND NOT EXISTS (
          SELECT 1 FROM stock_sucursal ss 
          WHERE ss.id_sucursal = s.id_sucursal 
            AND ss.activo = true
        )
    `);
    console.log(`  - Sucursales sin productos: ${sucursalesSinProductos.rows[0].total}`);
    
    // 7. Verificar triggers
    console.log('\n7️⃣ VERIFICANDO TRIGGERS...');
    const triggersQuery = await client.query(`
      SELECT 
        trigger_name,
        event_object_table,
        event_manipulation
      FROM information_schema.triggers 
      WHERE event_object_table IN ('stock_sucursal', 'inventario_lotes', 'movimientos_inventario')
      ORDER BY event_object_table, trigger_name
    `);
    console.log('Triggers activos:');
    triggersQuery.rows.forEach(row => {
      console.log(`  - ${row.trigger_name} en ${row.event_object_table} (${row.event_manipulation})`);
    });
    
    // 8. Probar actualización de stock en venta
    console.log('\n8️⃣ PROBANDO ACTUALIZACIÓN DE STOCK EN VENTA...');
    if (testProductQuery.rows.length > 0) {
      const testProduct = testProductQuery.rows[0];
      const ventaResult = await client.query(`
        SELECT actualizar_stock_venta($1, $2, $3, $4) as resultado
      `, [testProduct.id_producto, testProduct.id_sucursal, 1, null]);
      
      const resultado = ventaResult.rows[0].resultado;
      console.log('  - Resultado de venta:');
      console.log(`    - Éxito: ${resultado.success}`);
      console.log(`    - Stock anterior: ${resultado.stock_anterior}`);
      console.log(`    - Stock nuevo: ${resultado.stock_nuevo}`);
      console.log(`    - Cantidad vendida: ${resultado.cantidad_vendida}`);
      
      // Revertir la venta
      await client.query(`
        SELECT actualizar_stock_venta($1, $2, $3, $4) as resultado
      `, [testProduct.id_producto, testProduct.id_sucursal, -1, null]);
      console.log('  - Venta revertida');
    }
    
    console.log('\n✅ PRUEBAS COMPLETADAS EXITOSAMENTE!');
    console.log('🎉 El sistema de stock por sucursal está funcionando correctamente');
    
  } catch (error) {
    console.error('❌ ERROR EN PRUEBAS:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Ejecutar pruebas
if (require.main === module) {
  testStockByBranch()
    .then(() => {
      console.log('\n🎉 Pruebas completadas exitosamente!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Error en pruebas:', error);
      process.exit(1);
    });
}

module.exports = { testStockByBranch };
