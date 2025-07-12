const axios = require('axios');

async function testVentaAPI() {
  try {
    console.log('🧪 Probando API de ventas directamente...');
    
    // Primero hacer login para obtener el token
    console.log('\n🔐 Haciendo login...');
    const loginResponse = await axios.post('http://localhost:3000/api/v1/auth/login', {
      username: 'jose.torrico',
      password: '123456'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login exitoso, token obtenido');
    
    // Configurar headers con el token
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // Simular la petición exacta que hace el frontend
    const ventaData = {
      items: [
        {
          id_producto: 114, // Coca Cola
          cantidad: 2,
          precio_unitario: 15.00,
          observaciones: 'Test'
        }
      ],
      total: 30.00,
      paymentMethod: 'Efectivo',
      cashier: 'jose.torrico',
      branch: 'Sucursal 16 de Julio',
      tipo_servicio: 'Mesa',
      mesa_numero: 1,
      invoiceData: null
    };
    
    console.log('\n📤 Enviando petición de venta:', ventaData);
    
    const ventaResponse = await axios.post('http://localhost:3000/api/v1/ventas', ventaData, { headers });
    
    console.log('✅ Venta creada exitosamente:', ventaResponse.data);
    
  } catch (error) {
    console.error('❌ Error en la petición:', error.message);
    if (error.response) {
      console.error('Error response data:', error.response.data);
      console.error('Error response status:', error.response.status);
    }
  }
}

// Esperar un poco para que el servidor esté listo
setTimeout(() => {
  testVentaAPI();
}, 2000); 