const axios = require('axios');

async function testAgregarProductosMesa() {
  try {
    console.log('🔍 Probando agregar productos a mesa...\n');

    // Datos de prueba
    const testData = {
      id_mesa: 1, // Cambiar por una mesa que exista
      items: [
        {
          id_producto: 1, // Cambiar por un producto que exista
          cantidad: 2,
          precio_unitario: 10.50,
          observaciones: 'Test desde script'
        }
      ],
      total: 21.00
    };

    console.log('📤 Datos enviados:', JSON.stringify(testData, null, 2));

    const response = await axios.post('http://localhost:3000/api/v1/mesas/agregar-productos', testData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token' // Necesitarás un token válido
      }
    });

    console.log('✅ Respuesta exitosa:', response.data);

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response?.status === 500) {
      console.log('\n🔍 Error 500 - Revisar logs del backend');
    }
  }
}

testAgregarProductosMesa();
