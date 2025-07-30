const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';

async function testReservasDebug() {
  console.log('🔍 [DEBUG] Iniciando prueba de debug de reservas...');

  try {
    // 1. Probar ruta de prueba sin autenticación
    console.log('\n🔍 [DEBUG] 1. Probando ruta de prueba sin autenticación...');
    const testResponse = await axios.get(`${BASE_URL}/test-reservas`);
    console.log('✅ [DEBUG] Ruta de prueba exitosa:', testResponse.data);

    // 2. Hacer login para obtener token
    console.log('\n🔍 [DEBUG] 2. Haciendo login para obtener token...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'jose.torrico',
      password: 'jose123'
    });

    const token = loginResponse.data.token;
    console.log('✅ [DEBUG] Login exitoso, token obtenido');
    console.log('🔍 [DEBUG] Token:', token.substring(0, 50) + '...');

    // 3. Decodificar el token para ver el rol
    const tokenParts = token.split('.');
    const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
    console.log('🔍 [DEBUG] Token payload:', payload);
    console.log('🔍 [DEBUG] Rol del usuario:', payload.rol);

    // 4. Configurar headers con token
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // 5. Probar crear una reserva
    const reservaData = {
      id_mesa: 32,
      nombre_cliente: 'Test Cliente',
      telefono_cliente: '+591 70012345',
      email_cliente: 'test@email.com',
      fecha_hora_inicio: '2025-07-31T16:00:00', // Mañana
      fecha_hora_fin: '2025-07-31T18:00:00', // Mañana
      numero_personas: 2,
      observaciones: 'Reserva de prueba'
    };

    console.log('\n🔍 [DEBUG] 3. Probando crear reserva...');
    console.log('🔍 [DEBUG] Datos de reserva:', reservaData);
    console.log('🔍 [DEBUG] Headers:', headers);
    
    const createResponse = await axios.post(`${BASE_URL}/reservas`, reservaData, { headers });
    console.log('✅ [DEBUG] Reserva creada exitosamente:', createResponse.data);

    // 6. Probar obtener reservas
    console.log('\n🔍 [DEBUG] 4. Probando obtener reservas...');
    const getReservasResponse = await axios.get(`${BASE_URL}/reservas/sucursal/4`, { headers });
    console.log('✅ [DEBUG] Reservas obtenidas exitosamente:', getReservasResponse.data);

  } catch (error) {
    console.error('❌ [DEBUG] Error:', error.response ? error.response.data : error.message);
    console.error('❌ [DEBUG] Status:', error.response ? error.response.status : 'N/A');
    console.error('❌ [DEBUG] Headers:', error.response ? error.response.headers : 'N/A');
    
    if (error.response && error.response.data) {
      console.error('❌ [DEBUG] Error details:', error.response.data);
    }
  }
}

testReservasDebug(); 