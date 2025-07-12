const axios = require('axios');

async function testWithAuth() {
  try {
    console.log('🔍 Probando autenticación y endpoint...');
    
    // 1. Primero obtener un token válido
    console.log('\n1. Obteniendo token de autenticación...');
    const loginResponse = await axios.post('http://localhost:3000/api/v1/auth/login', {
      username: 'admin',
      password: 'superadmin123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Token obtenido:', token ? 'Válido' : 'No válido');
    
    // 2. Probar el endpoint con el token válido
    console.log('\n2. Probando endpoint con token válido...');
    const response = await axios.get('http://localhost:3000/api/v1/mesas/configuracion/sucursal/3', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Respuesta exitosa:', response.data);
    
  } catch (error) {
    console.error('❌ Error en la petición:');
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
    console.error('Message:', error.message);
    
    if (error.response?.data?.error) {
      console.error('Error details:', error.response.data.error);
    }
  }
}

testWithAuth(); 