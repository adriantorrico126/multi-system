const axios = require('axios');

const API_URL = 'http://localhost:3000/api/v1';

async function testKitchenAPI() {
  try {
    console.log('=== PROBANDO API DE COCINA ===');
    
    // 1. Primero hacer login como cocinero (usando las credenciales correctas)
    console.log('\n1. Haciendo login como cocinero...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      username: 'paola.torrico',
      password: 'pao123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login exitoso, token obtenido');
    console.log('Usuario:', loginResponse.data.data);
    
    // Configurar headers con el token
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // 2. Probar endpoint de cocina
    console.log('\n2. Probando endpoint /ventas/cocina...');
    const kitchenResponse = await axios.get(`${API_URL}/ventas/cocina`, { headers });
    console.log('✅ Respuesta de cocina:', kitchenResponse.data);
    console.log('Cantidad de pedidos:', kitchenResponse.data.data?.length || 0);
    
    // 3. Probar endpoint de prueba
    console.log('\n3. Probando endpoint de prueba...');
    const testResponse = await axios.get(`${API_URL}/ventas/test/pedidos`, { headers });
    console.log('✅ Respuesta de prueba:', testResponse.data);
    
    // 4. Probar todos los pedidos
    console.log('\n4. Probando todos los pedidos...');
    const allOrdersResponse = await axios.get(`${API_URL}/ventas/test/todos-pedidos`, { headers });
    console.log('✅ Respuesta de todos los pedidos:', allOrdersResponse.data);
    
    // 5. Verificar estadísticas
    console.log('\n5. Probando estadísticas...');
    const statsResponse = await axios.get(`${API_URL}/ventas/test/estadisticas-pedidos`, { headers });
    console.log('✅ Respuesta de estadísticas:', statsResponse.data);
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
    }
  }
}

testKitchenAPI(); 