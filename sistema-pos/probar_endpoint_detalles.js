const axios = require('axios');

async function probarEndpointDetalles() {
  try {
    console.log('🔍 [PRUEBA ENDPOINT] Probando getVentaConDetalles...\n');

    // URL del endpoint
    const url = 'http://localhost:3000/api/v1/ventas/490/detalles';
    
    // Headers de autenticación (token de prueba)
    const headers = {
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsInJvbGUiOiJhZG1pbiIsImlkX3Jlc3RhdXJhbnRlIjoxLCJpZF9zdWN1cnNhbCI6NywiaWF0IjoxNzM1Mjg1NzYyLCJleHAiOjE3MzUzNzIxNjJ9.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8',
      'Content-Type': 'application/json'
    };

    console.log('📡 Enviando petición a:', url);
    
    const response = await axios.get(url, { headers });
    
    console.log('✅ Respuesta recibida:');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error en la petición:');
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else if (error.request) {
      console.error('No se recibió respuesta del servidor');
      console.error('Request:', error.request);
    } else {
      console.error('Error:', error.message);
    }
  }
}

probarEndpointDetalles();

async function probarEndpointDetalles() {
  try {
    console.log('🔍 [PRUEBA ENDPOINT] Probando getVentaConDetalles...\n');

    // URL del endpoint
    const url = 'http://localhost:3000/api/v1/ventas/490/detalles';
    
    // Headers de autenticación (token de prueba)
    const headers = {
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsInJvbGUiOiJhZG1pbiIsImlkX3Jlc3RhdXJhbnRlIjoxLCJpZF9zdWN1cnNhbCI6NywiaWF0IjoxNzM1Mjg1NzYyLCJleHAiOjE3MzUzNzIxNjJ9.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8',
      'Content-Type': 'application/json'
    };

    console.log('📡 Enviando petición a:', url);
    
    const response = await axios.get(url, { headers });
    
    console.log('✅ Respuesta recibida:');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error en la petición:');
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else if (error.request) {
      console.error('No se recibió respuesta del servidor');
      console.error('Request:', error.request);
    } else {
      console.error('Error:', error.message);
    }
  }
}

probarEndpointDetalles();
