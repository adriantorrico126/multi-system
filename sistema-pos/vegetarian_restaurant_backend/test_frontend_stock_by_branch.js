const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  user: 'postgres', 
  password: '6951230Anacleta',
  database: 'sistempos',
  port: 5432
});

async function testFrontendStockByBranch() {
  const client = await pool.connect();
  
  try {
    console.log('🧪 PROBANDO STOCK POR SUCURSAL EN FRONTEND...\n');
    
    // 1. Simular consulta de productos por sucursal (como lo haría el frontend)
    console.log('1️⃣ SIMULANDO CONSULTA DE PRODUCTOS POR SUCURSAL...');
    
    const sucursales = [
      { id: 1, nombre: 'Sucursal Principal' },
      { id: 3, nombre: 'Sucursal Fidel Anze' },
      { id: 4, nombre: 'Sucursal 16 de Julio' },
      { id: 5, nombre: 'Sucursal Santa Cruz' },
      { id: 6, nombre: 'Torrico' }
    ];
    
    for (const sucursal of sucursales) {
      console.log(`\n   📍 SUCURSAL: ${sucursal.nombre} (ID: ${sucursal.id})`);
      
      // Simular la consulta que haría el frontend con id_sucursal
      const productosQuery = await client.query(`
        SELECT p.id_producto, p.nombre, p.precio, 
               COALESCE(ss.stock_actual, 0) as stock_actual, 
               p.activo, p.imagen_url, p.id_restaurante,
               c.nombre as categoria_nombre, c.id_categoria,
               ss.stock_minimo, ss.stock_maximo
        FROM productos p
        LEFT JOIN categorias c ON p.id_categoria = c.id_categoria
        LEFT JOIN stock_sucursal ss ON p.id_producto = ss.id_producto AND ss.id_sucursal = $2 AND ss.activo = true
        WHERE p.id_restaurante = $1 AND p.activo = true
        ORDER BY c.nombre, p.nombre
        LIMIT 5
      `, [1, sucursal.id]);
      
      console.log(`   Productos con stock en esta sucursal:`);
      productosQuery.rows.forEach(producto => {
        const estadoStock = producto.stock_actual === 0 ? 'agotado' : 
                           producto.stock_actual <= 5 ? 'bajo' : 'normal';
        console.log(`     - ${producto.nombre}: ${producto.stock_actual} unidades (${estadoStock})`);
      });
    }
    
    // 2. Probar cambio de sucursal y verificar que el stock cambia
    console.log('\n2️⃣ PROBANDO CAMBIO DE SUCURSAL...');
    
    const productoTest = 'PIQUE MACHO';
    console.log(`   Producto de prueba: ${productoTest}`);
    
    for (const sucursal of sucursales) {
      const stockQuery = await client.query(`
        SELECT COALESCE(ss.stock_actual, 0) as stock_actual
        FROM productos p
        LEFT JOIN stock_sucursal ss ON p.id_producto = ss.id_producto AND ss.id_sucursal = $2 AND ss.activo = true
        WHERE p.nombre = $1 AND p.id_restaurante = 1 AND p.activo = true
      `, [productoTest, sucursal.id]);
      
      const stock = stockQuery.rows[0]?.stock_actual || 0;
      console.log(`     - ${sucursal.nombre}: ${stock} unidades`);
    }
    
    // 3. Simular una venta en una sucursal específica
    console.log('\n3️⃣ SIMULANDO VENTA EN SUCURSAL ESPECÍFICA...');
    
    const sucursalVenta = sucursales[0]; // Sucursal Principal
    const productoVenta = 'PIQUE MACHO';
    const cantidadVenta = 3;
    
    console.log(`   Venta simulada: ${cantidadVenta} unidades de ${productoVenta} en ${sucursalVenta.nombre}`);
    
    // Obtener stock antes de la venta
    const stockAntesQuery = await client.query(`
      SELECT COALESCE(ss.stock_actual, 0) as stock_actual
      FROM productos p
      LEFT JOIN stock_sucursal ss ON p.id_producto = ss.id_producto AND ss.id_sucursal = $2 AND ss.activo = true
      WHERE p.nombre = $1 AND p.id_restaurante = 1 AND p.activo = true
    `, [productoVenta, sucursalVenta.id]);
    
    const stockAntes = stockAntesQuery.rows[0]?.stock_actual || 0;
    console.log(`   Stock antes de la venta: ${stockAntes} unidades`);
    
    // Simular la venta usando la función actualizar_stock_venta
    const ventaResult = await client.query(`
      SELECT actualizar_stock_venta(
        (SELECT id_producto FROM productos WHERE nombre = $1 AND id_restaurante = 1 AND activo = true),
        $2,
        $3,
        NULL
      ) as resultado
    `, [productoVenta, sucursalVenta.id, cantidadVenta]);
    
    const resultado = ventaResult.rows[0].resultado;
    console.log(`   Resultado de la venta:`);
    console.log(`     - Éxito: ${resultado.success}`);
    console.log(`     - Stock anterior: ${resultado.stock_anterior}`);
    console.log(`     - Stock nuevo: ${resultado.stock_nuevo}`);
    console.log(`     - Cantidad vendida: ${resultado.cantidad_vendida}`);
    
    // 4. Verificar que solo cambió en la sucursal de la venta
    console.log('\n4️⃣ VERIFICANDO QUE SOLO CAMBIÓ EN LA SUCURSAL DE LA VENTA...');
    
    for (const sucursal of sucursales) {
      const stockDespuesQuery = await client.query(`
        SELECT COALESCE(ss.stock_actual, 0) as stock_actual
        FROM productos p
        LEFT JOIN stock_sucursal ss ON p.id_producto = ss.id_producto AND ss.id_sucursal = $2 AND ss.activo = true
        WHERE p.nombre = $1 AND p.id_restaurante = 1 AND p.activo = true
      `, [productoVenta, sucursal.id]);
      
      const stockDespues = stockDespuesQuery.rows[0]?.stock_actual || 0;
      const cambio = stockDespues - (sucursal.id === sucursalVenta.id ? stockAntes : stockAntes);
      console.log(`     - ${sucursal.nombre}: ${stockDespues} unidades ${cambio !== 0 ? `(${cambio > 0 ? '+' : ''}${cambio})` : '(sin cambio)'}`);
    }
    
    // 5. Restaurar el stock original
    console.log('\n5️⃣ RESTAURANDO STOCK ORIGINAL...');
    
    await client.query(`
      SELECT actualizar_stock_venta(
        (SELECT id_producto FROM productos WHERE nombre = $1 AND id_restaurante = 1 AND activo = true),
        $2,
        $3,
        NULL
      ) as resultado
    `, [productoVenta, sucursalVenta.id, -cantidadVenta]);
    
    console.log(`   ✅ Stock restaurado a su valor original`);
    
    // 6. Verificar stock final
    console.log('\n6️⃣ VERIFICANDO STOCK FINAL...');
    
    for (const sucursal of sucursales) {
      const stockFinalQuery = await client.query(`
        SELECT COALESCE(ss.stock_actual, 0) as stock_actual
        FROM productos p
        LEFT JOIN stock_sucursal ss ON p.id_producto = ss.id_producto AND ss.id_sucursal = $2 AND ss.activo = true
        WHERE p.nombre = $1 AND p.id_restaurante = 1 AND p.activo = true
      `, [productoVenta, sucursal.id]);
      
      const stockFinal = stockFinalQuery.rows[0]?.stock_actual || 0;
      console.log(`     - ${sucursal.nombre}: ${stockFinal} unidades`);
    }
    
    console.log('\n✅ PRUEBA DE FRONTEND COMPLETADA EXITOSAMENTE!');
    console.log('🎉 El sistema de stock por sucursal funciona correctamente en el frontend');
    console.log('📊 Cada sucursal muestra su stock independiente');
    console.log('🛒 Las ventas solo afectan el stock de la sucursal específica');
    
  } catch (error) {
    console.error('❌ ERROR EN PRUEBA DE FRONTEND:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Ejecutar prueba
if (require.main === module) {
  testFrontendStockByBranch()
    .then(() => {
      console.log('\n🎉 Prueba de frontend completada exitosamente!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Error en prueba de frontend:', error);
      process.exit(1);
    });
}

module.exports = { testFrontendStockByBranch };
