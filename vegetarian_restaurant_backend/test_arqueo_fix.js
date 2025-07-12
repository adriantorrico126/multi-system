const axios = require('axios');

const API_URL = 'http://localhost:3000/api/v1';

async function testArqueoFix() {
  try {
    console.log('🚀 Probando arqueo con nueva lógica de sucursales...\n');

    // 1. Login como admin
    console.log('1. Haciendo login como admin...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      username: 'admin',
      password: 'superadmin123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login exitoso como admin');
    console.log('Admin user data:', loginResponse.data.data);
    console.log('');

    // 2. Probar arqueo para el 6/7/2025 (sin especificar sucursal)
    console.log('2. Probando arqueo sin especificar sucursal...');
    const arqueoResponse1 = await axios.get(`${API_URL}/ventas/arqueo?startDate=2025-07-06&endDate=2025-07-06`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Arqueo sin sucursal específica:');
    console.log('Respuesta:', JSON.stringify(arqueoResponse1.data, null, 2));
    console.log('');

    // 3. Probar arqueo especificando sucursal 3
    console.log('3. Probando arqueo con sucursal 3...');
    const arqueoResponse2 = await axios.get(`${API_URL}/ventas/arqueo?startDate=2025-07-06&endDate=2025-07-06&sucursal=3`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Arqueo con sucursal 3:');
    console.log('Respuesta:', JSON.stringify(arqueoResponse2.data, null, 2));
    console.log('');

    // 4. Probar arqueo especificando sucursal 4
    console.log('4. Probando arqueo con sucursal 4...');
    const arqueoResponse3 = await axios.get(`${API_URL}/ventas/arqueo?startDate=2025-07-06&endDate=2025-07-06&sucursal=4`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Arqueo con sucursal 4:');
    console.log('Respuesta:', JSON.stringify(arqueoResponse3.data, null, 2));
    console.log('');

    // 5. Probar arqueo especificando sucursal 5 (sin datos)
    console.log('5. Probando arqueo con sucursal 5 (sin datos)...');
    const arqueoResponse4 = await axios.get(`${API_URL}/ventas/arqueo?startDate=2025-07-06&endDate=2025-07-06&sucursal=5`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Arqueo con sucursal 5:');
    console.log('Respuesta:', JSON.stringify(arqueoResponse4.data, null, 2));
    console.log('');

    console.log('🏁 Prueba completada exitosamente');

  } catch (error) {
    console.error('❌ Error en la prueba:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('Detalles del error:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testArqueoFix(); 