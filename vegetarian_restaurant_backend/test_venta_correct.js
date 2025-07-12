const db = require('./src/config/database');

async function testVentaCorrect() {
  try {
    console.log('🧪 Probando creación de venta con datos correctos...');
    
    // Simular datos de una venta con la sucursal correcta
    const testData = {
      items: [
        {
          id_producto: 114, // Coca Cola - producto que existe
          cantidad: 2,
          precio_unitario: 15.00,
          observaciones: 'Test'
        }
      ],
      total: 30.00,
      paymentMethod: 'Efectivo',
      cashier: 'jose.torrico',
      branch: 'Sucursal 16 de Julio', // Nombre correcto de la sucursal
      tipo_servicio: 'Mesa',
      mesa_numero: 1,
      id_restaurante: 1
    };
    
    console.log('📊 Datos de prueba:', testData);
    
    // 1. Verificar que el vendedor existe
    console.log('\n🔍 Verificando vendedor...');
    const vendedorResult = await db.query(
      'SELECT * FROM vendedores WHERE username = $1 AND id_restaurante = $2 LIMIT 1', 
      [testData.cashier, testData.id_restaurante]
    );
    console.log('Vendedor encontrado:', vendedorResult.rows[0]);
    
    if (!vendedorResult.rows[0]) {
      console.log('❌ Vendedor no encontrado');
      return;
    }
    
    // 2. Verificar que la sucursal existe
    console.log('\n🔍 Verificando sucursal...');
    const sucursalResult = await db.query(
      'SELECT * FROM sucursales WHERE nombre = $1 AND id_restaurante = $2 LIMIT 1', 
      [testData.branch, testData.id_restaurante]
    );
    console.log('Sucursal encontrada:', sucursalResult.rows[0]);
    
    if (!sucursalResult.rows[0]) {
      console.log('❌ Sucursal no encontrada');
      return;
    }
    
    // 3. Verificar que el método de pago existe
    console.log('\n🔍 Verificando método de pago...');
    const pagoResult = await db.query(
      'SELECT * FROM metodos_pago WHERE descripcion = $1 AND id_restaurante = $2 LIMIT 1', 
      [testData.paymentMethod, testData.id_restaurante]
    );
    console.log('Método de pago encontrado:', pagoResult.rows[0]);
    
    if (!pagoResult.rows[0]) {
      console.log('❌ Método de pago no encontrado');
      return;
    }
    
    // 4. Verificar que los productos existen
    console.log('\n🔍 Verificando productos...');
    for (const item of testData.items) {
      const productoResult = await db.query(
        'SELECT * FROM productos WHERE id_producto = $1 AND id_restaurante = $2 LIMIT 1', 
        [item.id_producto, testData.id_restaurante]
      );
      console.log(`Producto ${item.id_producto}:`, productoResult.rows[0]);
      
      if (!productoResult.rows[0]) {
        console.log(`❌ Producto ${item.id_producto} no encontrado`);
        return;
      }
    }
    
    console.log('✅ Todos los datos verificados correctamente');
    console.log('🎯 La venta debería funcionar ahora con el nombre correcto de la sucursal');
    
  } catch (error) {
    console.error('❌ Error en prueba:', error);
  } finally {
    await db.pool.end();
  }
}

testVentaCorrect(); 