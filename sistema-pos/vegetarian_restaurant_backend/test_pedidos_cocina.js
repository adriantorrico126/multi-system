require('dotenv').config();
const axios = require('axios');

const API_URL = 'http://localhost:3000/api/v1';

async function testPedidosCocina() {
  try {
    console.log('🍳 Probando endpoint de pedidos para cocina...');
    
    // Primero hacer login para obtener token
    console.log('🔐 Haciendo login...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      username: 'admin',
      password: 'superadmin123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login exitoso');
    
    // Probar el endpoint de pedidos para cocina
    console.log('📋 Obteniendo pedidos para cocina...');
    const pedidosResponse = await axios.get(`${API_URL}/ventas/cocina`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Pedidos obtenidos:', pedidosResponse.data);
    
    if (pedidosResponse.data.data && pedidosResponse.data.data.length > 0) {
      console.log(`🎉 ¡Perfecto! Hay ${pedidosResponse.data.data.length} pedidos para cocina`);
      pedidosResponse.data.data.forEach((pedido, index) => {
        console.log(`Pedido ${index + 1}: ID ${pedido.id_venta}, Estado: ${pedido.estado}, Mesa: ${pedido.mesa_numero}`);
      });
    } else {
      console.log('⚠️ No hay pedidos para cocina en este momento');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
    }
  }
}

testPedidosCocina(); 