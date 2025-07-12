const axios = require('axios');

const API_URL = 'http://localhost:3000/api/v1';

async function testVentaSimple() {
  try {
    console.log('🚀 Probando registro de venta simple...\n');

    // 1. Login
    console.log('1. Haciendo login...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      username: 'admin',
      password: 'superadmin123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login exitoso');
    console.log('');

    // 2. Registrar una venta simple
    console.log('2. Registrando venta simple...');
    const saleData = {
      items: [
        {
          id_producto: 93,
          cantidad: 1,
          precio_unitario: 6.00,
          observaciones: 'Prueba simple'
        }
      ],
      total: 6.00,
      paymentMethod: 'Efectivo',
      cashier: 'admin',
      branch: 'Sucursal 16 de Julio',
      tipo_servicio: 'Mesa',
      mesa_numero: 5
    };

    const saleResponse = await axios.post(`${API_URL}/ventas`, saleData, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Venta registrada exitosamente');
    console.log('Respuesta completa:', JSON.stringify(saleResponse.data, null, 2));
    console.log('');

    // 3. Verificar comanda
    console.log('3. Verificando comanda...');
    const comandaResponse = await axios.get(`${API_URL}/ventas/cocina`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Comanda obtenida');
    console.log('Respuesta comanda:', JSON.stringify(comandaResponse.data, null, 2));

  } catch (error) {
    console.error('❌ Error en la prueba:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('Detalles del error:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testVentaSimple(); 