const db = require('./src/config/database');

async function testVenta() {
  try {
    console.log('🧪 Probando creación de venta...');
    
    // Simular datos de una venta
    const testData = {
      items: [
        {
          id_producto: 1,
          cantidad: 2,
          precio_unitario: 25.00,
          observaciones: 'Test'
        }
      ],
      total: 50.00,
      paymentMethod: 'Efectivo',
      cashier: 'jose.torrico',
      branch: 'Sucursal Centro',
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
    
    // 5. Intentar crear la venta
    console.log('\n🔍 Intentando crear venta...');
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Crear venta
      const ventaQuery = `
        INSERT INTO ventas (id_vendedor, id_pago, id_sucursal, tipo_servicio, total, mesa_numero, id_restaurante)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      
      const ventaValues = [
        vendedorResult.rows[0].id_vendedor,
        pagoResult.rows[0].id_pago,
        sucursalResult.rows[0].id_sucursal,
        testData.tipo_servicio,
        testData.total,
        testData.mesa_numero,
        testData.id_restaurante
      ];
      
      console.log('Valores para venta:', ventaValues);
      
      const ventaResult = await client.query(ventaQuery, ventaValues);
      console.log('✅ Venta creada:', ventaResult.rows[0]);
      
      // Crear detalles de venta
      for (const item of testData.items) {
        const detalleQuery = `
          INSERT INTO detalle_ventas (id_venta, id_producto, cantidad, precio_unitario, observaciones, id_restaurante)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING *
        `;
        
        const detalleValues = [
          ventaResult.rows[0].id_venta,
          item.id_producto,
          item.cantidad,
          item.precio_unitario,
          item.observaciones,
          testData.id_restaurante
        ];
        
        console.log('Valores para detalle:', detalleValues);
        
        const detalleResult = await client.query(detalleQuery, detalleValues);
        console.log('✅ Detalle creado:', detalleResult.rows[0]);
      }
      
      await client.query('COMMIT');
      console.log('✅ Transacción completada exitosamente');
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Error en transacción:', error);
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('❌ Error en prueba:', error);
  } finally {
    await db.pool.end();
  }
}

testVenta(); 