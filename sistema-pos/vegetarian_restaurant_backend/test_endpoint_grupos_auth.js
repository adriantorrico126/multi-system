const axios = require('axios');

async function testEndpointWithAuth() {
  try {
    console.log('=== TESTING ENDPOINT WITH AUTH ===');
    
    // Primero hacer login para obtener token
    const loginResponse = await axios.post('http://localhost:3000/api/v1/auth/login', {
      username: 'jose.torrico',
      password: 'jose123'
    });
    
    const token = loginResponse.data.token;
    console.log('Token obtenido:', token ? 'Sí' : 'No');
    
    // Configurar headers con token
    const config = {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
    
    // Probar el endpoint con autenticación
    const response = await axios.get('http://localhost:3000/api/v1/grupos-mesas/activos/completos?id_restaurante=1', config);
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    
    if (response.data.grupos && response.data.grupos.length > 0) {
      const grupo = response.data.grupos[0];
      console.log('\nPrimer grupo:');
      console.log('- ID:', grupo.id_grupo_mesa);
      console.log('- Mesero:', grupo.nombre_mesero);
      console.log('- Mesas:', grupo.mesas ? grupo.mesas.length : 'No hay mesas');
      console.log('- Total acumulado:', grupo.total_acumulado_grupo);
      
      if (grupo.mesas) {
        console.log('\nDetalles de mesas:');
        grupo.mesas.forEach((mesa, index) => {
          console.log(`  Mesa ${index + 1}:`, mesa);
        });
      }
    } else {
      console.log('\nNo hay grupos activos o la respuesta está vacía');
    }
    
    console.log('=== ENDPOINT TEST COMPLETED ===');
  } catch (error) {
    console.error('Error testing endpoint:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testEndpointWithAuth(); 