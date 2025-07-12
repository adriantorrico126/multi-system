const axios = require('axios');

const API_URL = 'http://localhost:3000/api/v1';

async function testFrontendComanda() {
  try {
    console.log('🚀 Probando comanda desde frontend...\n');

    // 1. Login
    console.log('1. Haciendo login...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      username: 'admin',
      password: 'superadmin123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login exitoso');
    console.log('');

    // 2. Probar endpoint de cocina
    console.log('2. Probando endpoint de cocina...');
    const comandaResponse = await axios.get(`${API_URL}/ventas/cocina`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Comanda obtenida exitosamente');
    console.log('Respuesta completa:', JSON.stringify(comandaResponse.data, null, 2));
    console.log('');

    // 3. Probar endpoint de prueba
    console.log('3. Probando endpoint de prueba...');
    const testResponse = await axios.get(`${API_URL}/ventas/test/pedidos`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Test obtenido exitosamente');
    console.log('Respuesta test:', JSON.stringify(testResponse.data, null, 2));

  } catch (error) {
    console.error('❌ Error en la prueba:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('Detalles del error:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testFrontendComanda(); 