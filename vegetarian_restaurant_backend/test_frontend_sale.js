require('dotenv').config();
const axios = require('axios');

const API_URL = 'http://localhost:3000/api/v1';

// Simular los datos que envía el frontend
const testSaleData = {
  items: [
    {
      id_producto: 114,
      cantidad: 2,
      precio_unitario: 15.00,
      observaciones: 'Test desde frontend'
    }
  ],
  total: 30.00,
  paymentMethod: 'Efectivo',
  cashier: 'cajero1',
  branch: 'Sucursal Principal',
  tipo_servicio: 'Mesa',
  mesa_numero: 1,
  invoiceData: null,
  id_restaurante: 1
};

async function testFrontendSale() {
  try {
    console.log('🧪 Probando venta con datos del frontend...');
    console.log('📤 Datos enviados:', JSON.stringify(testSaleData, null, 2));
    
    const response = await axios.post(`${API_URL}/ventas`, testSaleData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      }
    });
    
    console.log('✅ Respuesta exitosa:', response.data);
  } catch (error) {
    console.error('❌ Error en la prueba:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
    }
  }
}

testFrontendSale(); 