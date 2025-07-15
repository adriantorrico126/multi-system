const axios = require('axios');

async function testEndpoint() {
  try {
    console.log('🔍 Probando endpoint de configuración de mesas...');
    
    // Simular una petición al endpoint
    const response = await axios.get('http://localhost:3000/api/v1/mesas/configuracion/sucursal/3', {
      headers: {
        'Authorization': 'Bearer test-token',
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

testEndpoint(); 