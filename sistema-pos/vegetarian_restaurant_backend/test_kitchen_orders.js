const axios = require('axios');

async function testKitchenOrders() {
  try {
    console.log('🔍 Probando endpoint de cocina...');
    
    // Primero hacer login para obtener token
    const loginResponse = await axios.post('http://localhost:3000/api/v1/auth/login', {
      username: 'jose.torrico',
      password: 'jose123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login exitoso, token obtenido');
    
    // Probar el endpoint de cocina
    const kitchenResponse = await axios.get('http://localhost:3000/api/v1/ventas/cocina?id_restaurante=1', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Datos de cocina obtenidos:');
    console.log('Status:', kitchenResponse.status);
    console.log('Data:', JSON.stringify(kitchenResponse.data, null, 2));
    
    if (kitchenResponse.data.data && kitchenResponse.data.data.length > 0) {
      console.log(`📊 Se encontraron ${kitchenResponse.data.data.length} pedidos`);
      kitchenResponse.data.data.forEach((order, index) => {
        console.log(`\n--- Pedido ${index + 1} ---`);
        console.log('ID Venta:', order.id_venta);
        console.log('Estado:', order.estado);
        console.log('Mesa:', order.mesa_numero);
        console.log('Tipo Servicio:', order.tipo_servicio);
        console.log('Fecha:', order.fecha);
        console.log('Total:', order.total);
        if (order.productos) {
          console.log('Productos:', order.productos.length);
          order.productos.forEach(product => {
            console.log(`  - ${product.cantidad}x ${product.nombre_producto}`);
          });
        }
      });
    } else {
      console.log('⚠️ No se encontraron pedidos en cocina');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
    }
  }
}

testKitchenOrders(); 