const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';

async function testPlanAccess() {
  try {
    console.log('🔍 Probando acceso a APIs con plan BÁSICO...\n');

    // Primero necesitamos hacer login para obtener el token
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'testbasico', // Username del usuario de prueba con plan básico
      password: '123456' // Contraseña por defecto
    });

    const token = loginResponse.data.token;
    console.log('✅ Login exitoso');
    console.log(`Token obtenido: ${token ? 'Sí' : 'No'}`);
    console.log(`Respuesta completa:`, JSON.stringify(loginResponse.data, null, 2));
    console.log('');

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // Probar las APIs que están fallando
    const apisToTest = [
      {
        name: 'Productos',
        url: '/productos?id_restaurante=7&aplicarDescuentos=true',
        method: 'GET'
      },
      {
        name: 'Mesas por sucursal',
        url: '/mesas/sucursal/9?id_restaurante=7',
        method: 'GET'
      },
      {
        name: 'Arqueo actual',
        url: '/arqueo/actual',
        method: 'GET'
      },
      {
        name: 'Inventario resumen',
        url: '/productos/inventario/resumen?id_restaurante=7',
        method: 'GET'
      },
      {
        name: 'Estadísticas de mesas',
        url: '/mesas/sucursal/9/estadisticas?id_restaurante=7',
        method: 'GET'
      }
    ];

    for (const api of apisToTest) {
      try {
        console.log(`🧪 Probando ${api.name}...`);
        const response = await axios({
          method: api.method,
          url: `${BASE_URL}${api.url}`,
          headers: headers
        });
        
        console.log(`✅ ${api.name}: ${response.status} OK`);
        if (response.data && typeof response.data === 'object') {
          console.log(`   Datos recibidos: ${Object.keys(response.data).length} elementos`);
        }
      } catch (error) {
        console.log(`❌ ${api.name}: ${error.response?.status || 'Error'} ${error.response?.statusText || ''}`);
        if (error.response?.data) {
          console.log(`   Mensaje: ${error.response.data.message || error.response.data.error}`);
          if (error.response.data.code) {
            console.log(`   Código: ${error.response.data.code}`);
          }
        }
      }
      console.log('');
    }

  } catch (error) {
    console.error('❌ Error general:', error.message);
    if (error.response?.data) {
      console.error('Detalles:', error.response.data);
    }
  }
}

testPlanAccess();
