const axios = require('axios');

const API_URL = 'http://localhost:3000/api/v1';

async function testStockUpdate() {
  try {
    console.log('🚀 Iniciando prueba de actualización de stock...\n');

    // 1. Hacer login para obtener token válido
    console.log('1. Haciendo login con admin...');
    
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      username: 'admin',
      password: 'superadmin123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login exitoso con admin');
    console.log('');

    // 2. Verificar stock actual
    console.log('2. Verificando stock actual del producto 93...');
    const inventoryResponse = await axios.get(`${API_URL}/productos/inventario/resumen`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const product93 = inventoryResponse.data.data.find(p => p.id_producto === 93);
    console.log('Stock actual del producto 93:', product93?.stock_actual || 'No encontrado');
    console.log('Producto:', product93?.nombre || 'No encontrado');
    console.log('');

    // 3. Hacer una venta de prueba
    console.log('3. Registrando venta de prueba...');
    const saleData = {
      items: [
        {
          id_producto: 93,
          cantidad: 1,
          precio_unitario: 6.00,
          observaciones: 'Prueba de stock'
        }
      ],
      total: 6.00,
      paymentMethod: 'Efectivo',
      cashier: 'admin',
      branch: 'Sucursal 16 de Julio',
      tipo_servicio: 'Mesa',
      mesa_numero: 1
    };

    const saleResponse = await axios.post(`${API_URL}/ventas`, saleData, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Venta registrada exitosamente');
    console.log('ID de venta:', saleResponse.data.venta?.id_venta);
    console.log('');

    // 4. Verificar stock después de la venta
    console.log('4. Verificando stock después de la venta...');
    const inventoryResponseAfter = await axios.get(`${API_URL}/productos/inventario/resumen`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const product93After = inventoryResponseAfter.data.data.find(p => p.id_producto === 93);
    console.log('Stock después de la venta:', product93After?.stock_actual || 'No encontrado');
    console.log('');

    // 5. Verificar directamente en la base de datos
    console.log('5. Verificando directamente en la base de datos...');
    const db = require('./vegetarian_restaurant_backend/src/config/database');
    const dbResult = await db.query('SELECT id_producto, nombre, stock_actual FROM productos WHERE id_producto = 93');
    console.log('Stock en BD:', dbResult.rows[0]);

    console.log('\n🏁 Prueba completada');

  } catch (error) {
    console.error('❌ Error en la prueba:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('Detalles del error:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testStockUpdate(); 