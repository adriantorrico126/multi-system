const axios = require('axios');

async function testEgresosAPI() {
  try {
    console.log('🔄 Testing Egresos API...');
    
    // Primero hacer login para obtener un token válido
    const loginResponse = await axios.post('http://localhost:3000/api/v1/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful, token obtained');
    
    // Probar la ruta pendientes-aprobacion
    const pendientesResponse = await axios.get('http://localhost:3000/api/v1/egresos/pendientes-aprobacion', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Pendientes aprobación response:', pendientesResponse.status, pendientesResponse.data);
    
    // Probar otras rutas
    const categoriasResponse = await axios.get('http://localhost:3000/api/v1/categorias-egresos', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Categorias response:', categoriasResponse.status, categoriasResponse.data);
    
  } catch (error) {
    console.error('❌ Error details:');
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
    console.error('Message:', error.message);
    console.error('Code:', error.code);
    if (error.response?.data?.stack) {
      console.error('Stack:', error.response.data.stack);
    }
  }
}

testEgresosAPI();
