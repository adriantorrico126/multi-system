const axios = require('axios');

async function testFrontendAPI() {
  try {
    // Primero hacer login para obtener token
    const loginResponse = await axios.post('http://localhost:3000/api/v1/auth/login', {
      username: 'admin',
      password: 'superadmin123'
    });
    
    const token = loginResponse.data.token;
    console.log('Token obtenido:', token ? 'SÍ' : 'NO');
    console.log('User data:', loginResponse.data.data);
    
    // Probar endpoint de ventas de hoy con parámetros como el frontend
    const ventasResponse = await axios.get('http://localhost:3000/api/v1/ventas/ventas-hoy?sucursal=3&fecha=2025-07-11', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Respuesta de ventas con parámetros:', ventasResponse.data);
    
    // Probar endpoint de ventas ordenadas
    const ordenadasResponse = await axios.get('http://localhost:3000/api/v1/ventas/ordenadas?limit=50&sucursal=3', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Respuesta de ventas ordenadas:', ordenadasResponse.data);
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testFrontendAPI(); 