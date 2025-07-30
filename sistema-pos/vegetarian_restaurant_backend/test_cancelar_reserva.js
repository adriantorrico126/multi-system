const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';

async function testCancelarReserva() {
  try {
    console.log('🔍 [DEBUG] Iniciando prueba de cancelación de reserva...');

    // 1. Hacer login para obtener token
    console.log('🔍 [DEBUG] 1. Haciendo login...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'jose.torrico',
      password: 'jose123'
    });

    const token = loginResponse.data.token;
    console.log('✅ [DEBUG] Login exitoso, token obtenido');

    // 2. Obtener reservas existentes
    console.log('🔍 [DEBUG] 2. Obteniendo reservas existentes...');
    const reservasResponse = await axios.get(`${BASE_URL}/reservas`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✅ [DEBUG] Reservas obtenidas:', reservasResponse.data);

    if (reservasResponse.data.data && reservasResponse.data.data.length > 0) {
      const reserva = reservasResponse.data.data[0];
      console.log('🔍 [DEBUG] Reserva seleccionada para cancelar:', reserva);

      // 3. Cancelar la reserva
      console.log('🔍 [DEBUG] 3. Cancelando reserva...');
      const cancelarResponse = await axios.patch(`${BASE_URL}/reservas/${reserva.id_reserva}/cancelar`, {
        motivo: 'Prueba de cancelación'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('✅ [DEBUG] Reserva cancelada exitosamente:', cancelarResponse.data);

      // 4. Verificar que la mesa se liberó
      console.log('🔍 [DEBUG] 4. Verificando estado de la mesa...');
      const mesasResponse = await axios.get(`${BASE_URL}/mesas/sucursal/4`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const mesaReservada = mesasResponse.data.data.find(m => m.id_mesa === reserva.id_mesa);
      console.log('✅ [DEBUG] Estado de la mesa después de cancelar:', mesaReservada);

    } else {
      console.log('⚠️ [DEBUG] No hay reservas para cancelar');
    }

  } catch (error) {
    console.error('❌ [DEBUG] Error:', error.response?.data || error.message);
  }
}

testCancelarReserva(); 