require('dotenv').config();
const axios = require('axios');

const API_URL = 'http://localhost:3000/api/v1';

async function testAuthStatus() {
  try {
    console.log('🔐 Probando estado de autenticación...');
    
    // Primero, intentar hacer login
    console.log('📝 Intentando login...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      username: 'jose.torrico',
      password: 'jose123'
    });
    
    console.log('✅ Login exitoso:', loginResponse.data);
    const token = loginResponse.data.token;
    
    // Ahora probar una venta con el token válido
    console.log('🛒 Probando venta con token válido...');
    const testSaleData = {
      items: [
        {
          id_producto: 114,
          cantidad: 2,
          precio_unitario: 15.00,
          observaciones: 'Test con token válido'
        }
      ],
      total: 30.00,
      paymentMethod: 'Efectivo',
      cashier: 'jose.torrico',
      branch: 'Sucursal 16 de Julio',
      tipo_servicio: 'Mesa',
      mesa_numero: 1,
      invoiceData: null,
      id_restaurante: 1
    };
    
    const saleResponse = await axios.post(`${API_URL}/ventas`, testSaleData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Venta exitosa con token válido:', saleResponse.data);
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
    }
  }
}

testAuthStatus(); 