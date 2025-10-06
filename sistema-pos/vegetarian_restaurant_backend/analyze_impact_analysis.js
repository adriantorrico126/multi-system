const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  user: 'postgres', 
  password: '6951230Anacleta',
  database: 'sistempos',
  port: 5432
});

async function analyzeImpact() {
  const client = await pool.connect();
  try {
    console.log('🔍 ANÁLISIS DE IMPACTO PARA IMPLEMENTACIÓN DE STOCK POR SUCURSAL...\n');
    
    // 1. Analizar productos existentes y sus stocks
    console.log('1️⃣ ANÁLISIS PRODUCTOS EXISTENTES:');
    const productosQuery = await client.query(`
      SELECT 
        p.id_producto,
        p.nombre,
        p.stock_actual,
        p.id_restaurante,
        r.nombre as restaurante_nombre,
        COUNT(s.id_sucursal) as total_sucursales
      FROM productos p
      JOIN restaurantes r ON p.id_restaurante = r.id_restaurante
      LEFT JOIN sucursales s ON s.id_restaurante = p.id_restaurante AND s.activo = true
      WHERE p.activo = true
      GROUP BY p.id_producto, p.nombre, p.stock_actual, p.id_restaurante, r.nombre
      ORDER BY p.id_restaurante, p.nombre
      LIMIT 10
    `);
    console.log('Productos con stock actual (muestra):');
    productosQuery.rows.forEach(row => {
      console.log(`  - ${row.nombre} (ID: ${row.id_producto}) - Stock: ${row.stock_actual} - Restaurante: ${row.restaurante_nombre} - Sucursales: ${row.total_sucursales}`);
    });
    
    // 2. Analizar sucursales por restaurante
    console.log('\n2️⃣ ANÁLISIS SUCURSALES POR RESTAURANTE:');
    const sucursalesQuery = await client.query(`
      SELECT 
        r.id_restaurante,
        r.nombre as restaurante_nombre,
        COUNT(s.id_sucursal) as total_sucursales,
        STRING_AGG(s.nombre, ', ') as nombres_sucursales
      FROM restaurantes r
      LEFT JOIN sucursales s ON r.id_restaurante = s.id_restaurante AND s.activo = true
      GROUP BY r.id_restaurante, r.nombre
      ORDER BY r.id_restaurante
    `);
    console.log('Sucursales por restaurante:');
    sucursalesQuery.rows.forEach(row => {
      console.log(`  - ${row.restaurante_nombre} (ID: ${row.id_restaurante}) - Sucursales: ${row.total_sucursales}`);
      console.log(`    Sucursales: ${row.nombres_sucursales || 'Ninguna'}`);
    });
    
    // 3. Analizar movimientos de inventario recientes
    console.log('\n3️⃣ ANÁLISIS MOVIMIENTOS RECIENTES:');
    const movimientosQuery = await client.query(`
      SELECT 
        tipo_movimiento,
        COUNT(*) as total_movimientos,
        SUM(cantidad) as cantidad_total,
        MIN(fecha_movimiento) as fecha_mas_antigua,
        MAX(fecha_movimiento) as fecha_mas_reciente
      FROM movimientos_inventario 
      WHERE fecha_movimiento >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY tipo_movimiento
      ORDER BY total_movimientos DESC
    `);
    console.log('Movimientos últimos 30 días:');
    movimientosQuery.rows.forEach(row => {
      console.log(`  - ${row.tipo_movimiento}: ${row.total_movimientos} movimientos, cantidad: ${row.cantidad_total}`);
    });
    
    // 4. Analizar ventas recientes para entender el impacto
    console.log('\n4️⃣ ANÁLISIS VENTAS RECIENTES:');
    const ventasQuery = await client.query(`
      SELECT 
        v.id_sucursal,
        s.nombre as sucursal_nombre,
        COUNT(v.id_venta) as total_ventas,
        SUM(v.total) as total_monto,
        COUNT(DISTINCT dv.id_producto) as productos_vendidos
      FROM ventas v
      JOIN sucursales s ON v.id_sucursal = s.id_sucursal
      LEFT JOIN detalle_ventas dv ON v.id_venta = dv.id_venta
      WHERE v.fecha >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY v.id_sucursal, s.nombre
      ORDER BY total_ventas DESC
    `);
    console.log('Ventas por sucursal últimos 7 días:');
    ventasQuery.rows.forEach(row => {
      console.log(`  - ${row.sucursal_nombre} (ID: ${row.id_sucursal}): ${row.total_ventas} ventas, $${row.total_monto}, ${row.productos_vendidos} productos únicos`);
    });
    
    // 5. Analizar inventario_lotes por restaurante
    console.log('\n5️⃣ ANÁLISIS INVENTARIO LOTES:');
    const lotesQuery = await client.query(`
      SELECT 
        id_restaurante,
        COUNT(*) as total_lotes,
        SUM(cantidad_actual) as stock_total_lotes,
        COUNT(DISTINCT id_producto) as productos_con_lotes
      FROM inventario_lotes 
      WHERE activo = true
      GROUP BY id_restaurante
      ORDER BY id_restaurante
    `);
    console.log('Lotes por restaurante:');
    lotesQuery.rows.forEach(row => {
      console.log(`  - Restaurante ${row.id_restaurante}: ${row.total_lotes} lotes, stock total: ${row.stock_total_lotes}, productos: ${row.productos_con_lotes}`);
    });
    
    // 6. Verificar integridad de datos actual
    console.log('\n6️⃣ VERIFICACIÓN INTEGRIDAD:');
    
    // Productos sin sucursal asociada
    const productosSinSucursal = await client.query(`
      SELECT COUNT(*) as total
      FROM productos p
      WHERE NOT EXISTS (
        SELECT 1 FROM sucursales s 
        WHERE s.id_restaurante = p.id_restaurante AND s.activo = true
      )
    `);
    console.log(`Productos sin sucursal activa: ${productosSinSucursal.rows[0].total}`);
    
    // Inconsistencias entre stock de productos y lotes
    const inconsistencias = await client.query(`
      SELECT 
        p.id_producto,
        p.nombre,
        p.stock_actual as stock_producto,
        COALESCE(SUM(il.cantidad_actual), 0) as stock_lotes,
        (p.stock_actual - COALESCE(SUM(il.cantidad_actual), 0)) as diferencia
      FROM productos p
      LEFT JOIN inventario_lotes il ON p.id_producto = il.id_producto AND il.activo = true
      GROUP BY p.id_producto, p.nombre, p.stock_actual
      HAVING ABS(p.stock_actual - COALESCE(SUM(il.cantidad_actual), 0)) > 0
      LIMIT 5
    `);
    console.log('Inconsistencias stock productos vs lotes (muestra):');
    inconsistencias.rows.forEach(row => {
      console.log(`  - ${row.nombre}: Producto=${row.stock_producto}, Lotes=${row.stock_lotes}, Diferencia=${row.diferencia}`);
    });
    
    // 7. Analizar funciones que necesitarán modificación
    console.log('\n7️⃣ FUNCIONES QUE NECESITARÁN MODIFICACIÓN:');
    const funcionesQuery = await client.query(`
      SELECT 
        routine_name,
        routine_type
      FROM information_schema.routines 
      WHERE routine_definition ILIKE '%productos%' 
         OR routine_definition ILIKE '%stock%'
         OR routine_definition ILIKE '%inventario%'
      ORDER BY routine_name
    `);
    console.log('Funciones que requerirán actualización:');
    funcionesQuery.rows.forEach(row => {
      console.log(`  - ${row.routine_name} (${row.routine_type})`);
    });
    
    // 8. Analizar triggers que necesitarán modificación
    console.log('\n8️⃣ TRIGGERS QUE NECESITARÁN MODIFICACIÓN:');
    const triggersQuery = await client.query(`
      SELECT 
        trigger_name,
        event_object_table,
        event_manipulation
      FROM information_schema.triggers 
      WHERE event_object_table IN ('productos', 'movimientos_inventario', 'inventario_lotes')
      ORDER BY event_object_table, trigger_name
    `);
    console.log('Triggers que requerirán actualización:');
    triggersQuery.rows.forEach(row => {
      console.log(`  - ${row.trigger_name} en ${row.event_object_table} (${row.event_manipulation})`);
    });
    
    // 9. Calcular impacto estimado
    console.log('\n9️⃣ IMPACTO ESTIMADO:');
    const totalProductos = productosQuery.rows.length;
    const totalSucursales = sucursalesQuery.rows.reduce((sum, row) => sum + parseInt(row.total_sucursales), 0);
    const totalLotes = lotesQuery.rows.reduce((sum, row) => sum + parseInt(row.total_lotes), 0);
    
    console.log(`Total productos activos: ${totalProductos}`);
    console.log(`Total sucursales activas: ${totalSucursales}`);
    console.log(`Total lotes activos: ${totalLotes}`);
    console.log(`Registros estimados en nueva tabla stock_sucursal: ${totalProductos * totalSucursales}`);
    console.log(`Migración estimada de lotes: ${totalLotes} registros`);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

analyzeImpact();






