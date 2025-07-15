const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';

// Simular token de autenticación (en producción esto vendría del login)
const AUTH_TOKEN = 'your-auth-token-here';

const headers = {
  'Authorization': `Bearer ${AUTH_TOKEN}`,
  'Content-Type': 'application/json'
};

async function testMesaSystem() {
  console.log('🧪 TESTING MESA SYSTEM...\n');

  try {
    // Test 1: Obtener mesas de una sucursal
    console.log('1. Obteniendo mesas de la sucursal...');
    try {
      const mesasResponse = await axios.get(`${BASE_URL}/mesas/sucursal/1`, { headers });
      console.log('✅ Mesas obtenidas:', mesasResponse.data.data.length, 'mesas');
      console.log('Primera mesa:', mesasResponse.data.data[0]);
    } catch (error) {
      console.log('❌ Error obteniendo mesas:', error.response?.data?.message || error.message);
    }

    // Test 2: Abrir una mesa
    console.log('\n2. Abriendo mesa 1...');
    try {
      const abrirResponse = await axios.post(`${BASE_URL}/mesas/abrir`, {
        numero: 1,
        id_sucursal: 1
      }, { headers });
      console.log('✅ Mesa abierta exitosamente:', abrirResponse.data.data);
    } catch (error) {
      console.log('❌ Error abriendo mesa:', error.response?.data?.message || error.message);
    }

    // Test 3: Agregar productos a mesa
    console.log('\n3. Agregando productos a mesa 1...');
    try {
      const productosResponse = await axios.post(`${BASE_URL}/mesas/agregar-productos`, {
        numero: 1,
        id_sucursal: 1,
        items: [
          {
            id_producto: 1,
            cantidad: 2,
            precio_unitario: 8.50,
            observaciones: 'Sin cebolla'
          },
          {
            id_producto: 2,
            cantidad: 1,
            precio_unitario: 6.00,
            observaciones: ''
          }
        ],
        total: 23.00
      }, { headers });
      console.log('✅ Productos agregados exitosamente:', productosResponse.data.data);
    } catch (error) {
      console.log('❌ Error agregando productos:', error.response?.data?.message || error.message);
    }

    // Test 4: Generar prefactura
    console.log('\n4. Generando prefactura de mesa 1...');
    try {
      const prefacturaResponse = await axios.get(`${BASE_URL}/mesas/1/prefactura`, { headers });
      console.log('✅ Prefactura generada:', prefacturaResponse.data.data);
    } catch (error) {
      console.log('❌ Error generando prefactura:', error.response?.data?.message || error.message);
    }

    // Test 5: Obtener estadísticas
    console.log('\n5. Obteniendo estadísticas de mesas...');
    try {
      const statsResponse = await axios.get(`${BASE_URL}/mesas/sucursal/1/estadisticas`, { headers });
      console.log('✅ Estadísticas obtenidas:', statsResponse.data.data);
    } catch (error) {
      console.log('❌ Error obteniendo estadísticas:', error.response?.data?.message || error.message);
    }

    // Test 6: Cerrar mesa con facturación
    console.log('\n6. Cerrando mesa 1 con facturación...');
    try {
      const cerrarResponse = await axios.post(`${BASE_URL}/ventas/cerrar-mesa`, {
        mesa_numero: 1,
        id_sucursal: 1,
        paymentMethod: 'Efectivo',
        invoiceData: {
          nit: '123456789',
          businessName: 'Cliente de Prueba'
        }
      }, { headers });
      console.log('✅ Mesa cerrada y facturada:', cerrarResponse.data.data);
    } catch (error) {
      console.log('❌ Error cerrando mesa:', error.response?.data?.message || error.message);
    }

    console.log('\n🎯 MESA SYSTEM TEST COMPLETED');

  } catch (error) {
    console.error('❌ Critical error:', error.message);
  }
}

// Función para probar el flujo completo
async function testCompleteFlow() {
  console.log('🔄 TESTING COMPLETE MESA FLOW...\n');

  try {
    // 1. Abrir mesa
    console.log('1. Abriendo mesa 2...');
    const abrirResponse = await axios.post(`${BASE_URL}/mesas/abrir`, {
      numero: 2,
      id_sucursal: 1
    }, { headers });
    console.log('✅ Mesa 2 abierta');

    // 2. Agregar productos
    console.log('\n2. Agregando productos...');
    await axios.post(`${BASE_URL}/mesas/agregar-productos`, {
      numero: 2,
      id_sucursal: 1,
      items: [
        { id_producto: 1, cantidad: 1, precio_unitario: 8.50, observaciones: 'Test' }
      ],
      total: 8.50
    }, { headers });
    console.log('✅ Productos agregados');

    // 3. Agregar más productos (acumulación)
    console.log('\n3. Agregando más productos...');
    await axios.post(`${BASE_URL}/mesas/agregar-productos`, {
      numero: 2,
      id_sucursal: 1,
      items: [
        { id_producto: 2, cantidad: 2, precio_unitario: 6.00, observaciones: 'Test adicional' }
      ],
      total: 12.00
    }, { headers });
    console.log('✅ Productos adicionales agregados');

    // 4. Generar prefactura
    console.log('\n4. Generando prefactura...');
    const prefacturaResponse = await axios.get(`${BASE_URL}/mesas/2/prefactura`, { headers });
    console.log('✅ Prefactura generada con total:', prefacturaResponse.data.data.total_acumulado);

    // 5. Cerrar mesa
    console.log('\n5. Cerrando mesa...');
    const cerrarResponse = await axios.post(`${BASE_URL}/ventas/cerrar-mesa`, {
      mesa_numero: 2,
      id_sucursal: 1,
      paymentMethod: 'Tarjeta de Crédito'
    }, { headers });
    console.log('✅ Mesa cerrada exitosamente');

    console.log('\n🎉 COMPLETE FLOW TEST SUCCESSFUL');

  } catch (error) {
    console.error('❌ Error en flujo completo:', error.response?.data?.message || error.message);
  }
}

// Ejecutar tests
if (require.main === module) {
  testMesaSystem().then(() => {
    console.log('\n---');
    return testCompleteFlow();
  }).catch(console.error);
}

module.exports = { testMesaSystem, testCompleteFlow }; 