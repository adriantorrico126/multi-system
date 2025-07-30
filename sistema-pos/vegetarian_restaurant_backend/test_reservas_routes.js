const axios = require('axios');

async function testReservasRoutes() {
  try {
    console.log('🔍 [TEST] Probando rutas de reservas...');
    
    // Probar ruta de prueba SIN autenticación
    console.log('🔍 [TEST] Probando ruta de prueba sin autenticación...');
    const testResponse = await axios.get('http://localhost:3000/api/v1/test-reservas');
    console.log('✅ [TEST] Ruta de prueba exitosa:', testResponse.data);
    
    // Ahora hacer login para obtener token
    console.log('🔍 [TEST] Haciendo login para obtener token...');
    const loginResponse = await axios.post('http://localhost:3000/api/v1/auth/login', {
      username: 'jose.torrico',
      password: 'jose123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ [TEST] Login exitoso, token obtenido');
    console.log('🔍 [TEST] Token:', token.substring(0, 50) + '...');
    
    // Configurar headers con token
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // Probar crear una reserva
    console.log('🔍 [TEST] Probando crear reserva...');
    const reservaData = {
      id_mesa: 32,
      nombre_cliente: 'Test Cliente',
      telefono_cliente: '+591 70012345',
      email_cliente: 'test@email.com',
      fecha_hora_inicio: '2025-07-30T16:00:00',
      fecha_hora_fin: '2025-07-30T18:00:00',
      numero_personas: 2,
      observaciones: 'Reserva de prueba'
    };
    
    console.log('🔍 [TEST] Datos de reserva a enviar:', reservaData);
    const createResponse = await axios.post('http://localhost:3000/api/v1/reservas', reservaData, { headers });
    console.log('✅ [TEST] Reserva creada exitosamente:', createResponse.data);
    
  } catch (error) {
    console.error('❌ [TEST] Error:', error.response?.data || error.message);
    console.error('❌ [TEST] Status:', error.response?.status);
    console.error('❌ [TEST] Headers:', error.response?.headers);
  }
}

testReservasRoutes(); 