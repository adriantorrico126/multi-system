const axios = require('axios');

async function testConnection() {
  try {
    console.log('🧪 Probando conexión con Admin Console Backend...');
    
    // Probar health check
    const healthResponse = await axios.get('http://localhost:5001/health');
    console.log('✅ Admin Console Backend está funcionando:', healthResponse.data);
    
    // Probar login
    console.log('🔐 Probando login...');
    const loginResponse = await axios.post('http://localhost:5001/api/auth/login', {
      email: 'admin@possolutions.com',
      password: 'admin123'
    });
    console.log('✅ Login exitoso');
    
    // Probar endpoint de planes
    const token = loginResponse.data.token;
    const planesResponse = await axios.get('http://localhost:5001/api/planes', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Planes obtenidos:', planesResponse.data.data.length, 'planes disponibles');
    
    console.log('\n🎉 Todas las pruebas de conexión pasaron exitosamente!');
    
  } catch (error) {
    console.error('❌ Error en las pruebas:', error.response?.data || error.message);
  }
}

testConnection();
