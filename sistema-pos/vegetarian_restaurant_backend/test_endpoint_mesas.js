const axios = require('axios');

async function testEndpointMesas() {
  try {
    console.log('=== TESTING ENDPOINT MESAS ===');
    
    // Primero hacer login para obtener token
    const loginResponse = await axios.post('http://localhost:3000/api/v1/auth/login', {
      username: 'jose.torrico',
      password: '123456'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login exitoso, token obtenido');
    
    // Probar el endpoint de mesas
    const mesasResponse = await axios.get('http://localhost:3000/api/v1/mesas/sucursal/4', {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      params: {
        id_restaurante: 1
      }
    });
    
    console.log('\n📊 Respuesta del endpoint mesas:');
    console.log('Status:', mesasResponse.status);
    console.log('Data:', JSON.stringify(mesasResponse.data, null, 2));
    
    // Verificar cada mesa
    if (mesasResponse.data.data) {
      console.log('\n🔍 Análisis de mesas:');
      mesasResponse.data.data.forEach(mesa => {
        console.log(`Mesa ${mesa.numero}:`, {
          estado: mesa.estado,
          id_grupo_mesa: mesa.id_grupo_mesa,
          nombre_mesero_grupo: mesa.nombre_mesero_grupo,
          estado_grupo: mesa.estado_grupo
        });
      });
    }
    
    console.log('\n=== TEST COMPLETED ===');
  } catch (error) {
    console.error('❌ Error en test:', error.response?.data || error.message);
  }
}

testEndpointMesas(); 