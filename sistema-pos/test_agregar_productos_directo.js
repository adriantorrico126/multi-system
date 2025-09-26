const axios = require('axios');

async function testAgregarProductos() {
  try {
    console.log('🔍 Probando agregar productos directamente...\n');

    // Datos de prueba basados en lo que vemos en los logs
    const testData = {
      id_mesa: 59, // Mesa que aparece en los logs
      items: [
        {
          id_producto: 1,
          cantidad: 1,
          precio_unitario: 10.00,
          observaciones: 'Test directo'
        }
      ],
      total: 10.00
    };

    console.log('📤 Datos enviados:', JSON.stringify(testData, null, 2));

    const response = await axios.post('http://localhost:3000/api/v1/mesas/agregar-productos', testData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJqaG9zZXAiLCJpZF9yZXN0YXVyYW50ZSI6MSwiaWF0IjoxNzM1MjU0OTM0LCJleHAiOjE3MzUyNTg1MzR9.8QZ8QZ8QZ8QZ8QZ8QZ8QZ8QZ8QZ8QZ8QZ8QZ8QZ8QZ' // Token de ejemplo
      }
    });

    console.log('✅ Respuesta exitosa:', response.data);

  } catch (error) {
    console.error('❌ Error completo:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    
    if (error.response?.data) {
      console.log('\n🔍 Detalles del error del servidor:');
      console.log(JSON.stringify(error.response.data, null, 2));
    }
  }
}

testAgregarProductos();
