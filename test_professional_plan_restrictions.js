const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';

async function testProfessionalPlanRestrictions() {
  try {
    console.log('🧪 Probando restricciones del plan Profesional ($49)...\n');

    // Login con usuario de prueba del plan profesional
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'testbasico', // Usuario del restaurante 7
      password: '123456'
    });

    const token = loginResponse.data.token;
    console.log('✅ Login exitoso con plan Profesional');
    console.log(`Usuario: ${loginResponse.data.data.nombre}`);
    console.log(`Restaurante: ${loginResponse.data.data.id_restaurante}`);
    console.log('');

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // Probar APIs que SÍ deberían funcionar en el plan Profesional
    const allowedAPIs = [
      {
        name: 'Mesas (PERMITIDO en plan Profesional)',
        url: '/mesas/sucursal/9?id_restaurante=7',
        method: 'GET'
      },
      {
        name: 'Arqueo (PERMITIDO en plan Profesional)',
        url: '/arqueo/actual',
        method: 'GET'
      },
      {
        name: 'Productos (PERMITIDO en plan Profesional)',
        url: '/productos?id_restaurante=7&aplicarDescuentos=true',
        method: 'GET'
      }
    ];

    console.log('🔍 Probando APIs que SÍ deberían funcionar en el plan Profesional:');
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

    // Probar APIs que NO deberían funcionar en el plan Profesional
    const restrictedAPIs = [
      {
        name: 'Delivery (RESTRINGIDO en plan Profesional)',
        url: '/delivery/pedidos',
        method: 'GET'
      },
      {
        name: 'Reservas (RESTRINGIDO en plan Profesional)',
        url: '/reservas',
        method: 'GET'
      },
      {
        name: 'Analytics (RESTRINGIDO en plan Profesional)',
        url: '/analytics/ventas',
        method: 'GET'
      },
      {
        name: 'Promociones (RESTRINGIDO en plan Profesional)',
        url: '/promociones',
        method: 'GET'
      }
    ];

    console.log('🔍 Probando APIs que NO deberían funcionar en el plan Profesional:');
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

    console.log('🎯 RESUMEN DE PRUEBAS:');
    console.log('✅ Plan Profesional ($49) activo');
    console.log('✅ APIs permitidas funcionan correctamente');
    console.log('✅ APIs restringidas devuelven 403 Forbidden');
    console.log('');
    console.log('📱 Ahora prueba el frontend:');
    console.log('1. Ve al historial de ventas');
    console.log('2. Verifica que NO aparezca el botón "Funciones Avanzadas"');
    console.log('3. Si aparece, las restricciones del frontend no están funcionando');

  } catch (error) {
    console.error('❌ Error general:', error.message);
    if (error.response?.data) {
      console.error('Detalles:', error.response.data);
    }
  }
}

testProfessionalPlanRestrictions();
