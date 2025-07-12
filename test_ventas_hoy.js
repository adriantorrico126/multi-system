const axios = require('axios');

async function testVentasHoy() {
  try {
    // Primero hacer login para obtener token
    const loginResponse = await axios.post('http://localhost:3000/api/v1/auth/login', {
      username: 'admin',
      password: 'superadmin123'
    });
    
    const token = loginResponse.data.token;
    console.log('Token obtenido:', token ? 'SÍ' : 'NO');
    
    // Probar endpoint de ventas de hoy
    const ventasResponse = await axios.get('http://localhost:3000/api/v1/ventas/ventas-hoy', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Respuesta de ventas:', ventasResponse.data);
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testVentasHoy(); 