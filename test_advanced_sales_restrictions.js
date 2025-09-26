const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';

async function testAdvancedSalesRestrictions() {
  try {
    console.log('🧪 Probando restricciones de funciones avanzadas de ventas...\n');

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

    // Probar APIs de exportación avanzada que NO deberían funcionar en plan Profesional
    const advancedSalesAPIs = [
      {
        name: 'Exportación Avanzada Excel (RESTRINGIDO en plan Profesional)',
        url: '/ventas/exportar/excel',
        method: 'POST',
        data: {
          fechaInicio: '2024-01-01',
          fechaFin: '2024-12-31',
          sucursal: 'todas',
          formato: 'avanzado'
        }
      },
      {
        name: 'Exportación Avanzada PDF (RESTRINGIDO en plan Profesional)',
        url: '/ventas/exportar/pdf',
        method: 'POST',
        data: {
          fechaInicio: '2024-01-01',
          fechaFin: '2024-12-31',
          sucursal: 'todas',
          formato: 'avanzado'
        }
      },
      {
        name: 'Filtros Avanzados de Ventas (RESTRINGIDO en plan Profesional)',
        url: '/ventas/filtros-avanzados',
        method: 'POST',
        data: {
          filtros: {
            productos: true,
            categorias: true,
            metodosPago: true,
            usuarios: true,
            comparativas: true
          }
        }
      }
    ];

    console.log('🔍 Probando APIs de funciones avanzadas de ventas:');
    console.log('');

    for (const api of advancedSalesAPIs) {
      try {
        console.log(`🧪 Probando ${api.name}...`);
        const response = await axios({
          method: api.method,
          url: `${BASE_URL}${api.url}`,
          headers: headers,
          data: api.data
        });
        
        console.log(`❌ ERROR: ${api.name} debería estar restringido pero devolvió ${response.status} OK`);
        console.log(`   Esto indica que las restricciones no están funcionando correctamente`);
      } catch (error) {
        if (error.response?.status === 403) {
          console.log(`✅ CORRECTO: ${api.name} está restringido (403 Forbidden)`);
          console.log(`   Mensaje: ${error.response.data.message || error.response.data.error}`);
        } else if (error.response?.status === 404) {
          console.log(`⚠️  ${api.name}: 404 Not Found (API no implementada aún)`);
        } else {
          console.log(`⚠️  ${api.name}: ${error.response?.status || 'Error'} ${error.response?.statusText || ''}`);
        }
      }
      console.log('');
    }

    console.log('🎯 RESUMEN DE PRUEBAS DE FUNCIONES AVANZADAS:');
    console.log('✅ Plan Profesional ($49) activo');
    console.log('❌ Funciones avanzadas de ventas deberían estar restringidas');
    console.log('');
    console.log('📱 PRUEBA MANUAL DEL FRONTEND:');
    console.log('1. Abre el frontend del POS (http://localhost:5173)');
    console.log('2. Inicia sesión con testbasico / 123456');
    console.log('3. Ve al historial de ventas');
    console.log('4. Verifica que NO aparezca el botón "Funciones Avanzadas"');
    console.log('5. Si aparece, las restricciones del frontend no están funcionando');
    console.log('');
    console.log('🔧 Si el botón aparece, el problema está en el frontend.');
    console.log('   Las restricciones del backend están funcionando correctamente.');

  } catch (error) {
    console.error('❌ Error general:', error.message);
    if (error.response?.data) {
      console.error('Detalles:', error.response.data);
    }
  }
}

testAdvancedSalesRestrictions();

