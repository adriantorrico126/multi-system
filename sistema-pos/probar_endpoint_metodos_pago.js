const axios = require('axios');

async function probarEndpointMetodosPago() {
  try {
    console.log('🧪 [PRUEBA] Endpoint de métodos de pago');
    console.log('=====================================');

    // 1. Primero hacer login para obtener token
    console.log('\n🔐 Haciendo login...');
    const loginResponse = await axios.post('http://localhost:3000/api/v1/auth/login', {
      username: 'admin',
      password: 'admin123'
    });

    const token = loginResponse.data.token;
    console.log('✅ Login exitoso, token obtenido');

    // 2. Probar endpoint de métodos de pago
    console.log('\n💰 Probando endpoint de métodos de pago...');
    try {
      const metodosResponse = await axios.get('http://localhost:3000/api/v1/metodos-pago', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('✅ Métodos de pago obtenidos exitosamente');
      console.log('📊 Respuesta:', metodosResponse.data);
      
      if (metodosResponse.data.data && metodosResponse.data.data.length > 0) {
        console.log('\n📋 MÉTODOS DE PAGO DISPONIBLES:');
        metodosResponse.data.data.forEach((metodo, index) => {
          console.log(`${index + 1}. ${metodo.descripcion} (ID: ${metodo.id_pago}) - ${metodo.activo ? 'Activo' : 'Inactivo'}`);
        });
      } else {
        console.log('⚠️ No se encontraron métodos de pago en la respuesta');
      }

    } catch (error) {
      console.log('❌ Error obteniendo métodos de pago:', error.response?.data || error.message);
      console.log('🔍 Status:', error.response?.status);
      console.log('🔍 Headers:', error.response?.headers);
    }

    // 3. Probar endpoint de métodos activos específicamente
    console.log('\n💰 Probando endpoint de métodos activos...');
    try {
      const metodosActivosResponse = await axios.get('http://localhost:3000/api/v1/metodos-pago/activos', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('✅ Métodos activos obtenidos exitosamente');
      console.log('📊 Respuesta:', metodosActivosResponse.data);
      
      if (metodosActivosResponse.data.data && metodosActivosResponse.data.data.length > 0) {
        console.log('\n📋 MÉTODOS DE PAGO ACTIVOS:');
        metodosActivosResponse.data.data.forEach((metodo, index) => {
          console.log(`${index + 1}. ${metodo.descripcion} (ID: ${metodo.id_pago})`);
        });
      } else {
        console.log('⚠️ No se encontraron métodos de pago activos');
      }

    } catch (error) {
      console.log('❌ Error obteniendo métodos activos:', error.response?.data || error.message);
      console.log('🔍 Status:', error.response?.status);
    }

    console.log('\n🎉 [PRUEBA COMPLETADA]');

  } catch (error) {
    console.error('❌ Error general:', error.response?.data || error.message);
  }
}

probarEndpointMetodosPago();
