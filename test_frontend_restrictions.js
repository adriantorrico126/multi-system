const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';

async function testFrontendRestrictions() {
  try {
    console.log('🧪 Probando restricciones en el frontend...\n');

    // Login con usuario de prueba del plan básico
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'testbasico', // Usuario del plan básico
      password: '123456'
    });

    const token = loginResponse.data.token;
    console.log('✅ Login exitoso con plan básico');
    console.log(`Usuario: ${loginResponse.data.data.nombre}`);
    console.log(`Restaurante: ${loginResponse.data.data.id_restaurante}`);
    console.log('');

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // Probar APIs que deberían estar restringidas en el plan básico
    const restrictedAPIs = [
      {
        name: 'Mesas (RESTRINGIDO en plan básico)',
        url: '/mesas/sucursal/9?id_restaurante=7',
        method: 'GET'
      },
      {
        name: 'Arqueo (RESTRINGIDO en plan básico)',
        url: '/arqueo/actual',
        method: 'GET'
      },
      {
        name: 'Inventario Lotes (RESTRINGIDO en plan básico)',
        url: '/productos/inventario/resumen?id_restaurante=7',
        method: 'GET'
      }
    ];

    console.log('🔍 Probando APIs que deberían estar restringidas en el plan básico:');
    console.log('');

    for (const api of restrictedAPIs) {
      try {
        console.log(`🧪 Probando ${api.name}...`);
        const response = await axios({
          method: api.method,
          url: `${BASE_URL}${api.url}`,
          headers: headers
        });
        
        console.log(`❌ ERROR: ${api.name} debería estar restringido pero devolvió ${response.status} OK`);
        console.log(`   Esto indica que las restricciones no están funcionando correctamente`);
      } catch (error) {
        if (error.response?.status === 403) {
          console.log(`✅ CORRECTO: ${api.name} está restringido (403 Forbidden)`);
          console.log(`   Mensaje: ${error.response.data.message || error.response.data.error}`);
        } else {
          console.log(`⚠️  ${api.name}: ${error.response?.status || 'Error'} ${error.response?.statusText || ''}`);
        }
      }
      console.log('');
    }

    // Probar APIs que SÍ deberían funcionar en el plan básico
    const allowedAPIs = [
      {
        name: 'Productos (PERMITIDO en plan básico)',
        url: '/productos?id_restaurante=7&aplicarDescuentos=true',
        method: 'GET'
      }
    ];

    console.log('🔍 Probando APIs que SÍ deberían funcionar en el plan básico:');
    console.log('');

    for (const api of allowedAPIs) {
      try {
        console.log(`🧪 Probando ${api.name}...`);
        const response = await axios({
          method: api.method,
          url: `${BASE_URL}${api.url}`,
          headers: headers
        });
        
        console.log(`✅ CORRECTO: ${api.name} funciona correctamente (${response.status} OK)`);
      } catch (error) {
        console.log(`❌ ERROR: ${api.name} debería funcionar pero devolvió ${error.response?.status || 'Error'}`);
        console.log(`   Mensaje: ${error.response?.data?.message || error.response?.data?.error || error.message}`);
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

testFrontendRestrictions();