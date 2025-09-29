const axios = require('axios');

async function testPlanesEndpoint() {
    console.log('🔍 [DEBUG] Probando endpoint /planes-sistema/restaurante/1/actual...\n');
    
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWRfdmVuZGVkb3IiOjEsInVzZXJuYW1lIjoiYWRtaW4iLCJyb2wiOiJhZG1pbiIsImlkX3N1Y3Vyc2FsIjo3LCJzdWN1cnNhbF9ub21icmUiOiJTdWN1cnNhbCBQcmluY2lwYWwiLCJpZF9yZXN0YXVyYW50ZSI6MSwicmVzdGF1cmFudGVfbm9tYnJlIjoiUmVzdGF1cmFudGUgUHJpbmNpcGFsIiwiaWF0IjoxNzU5MTE3ODQ1LCJleHAiOjE3NTkyMDQyNDV9.BBpLXZY5xCSKFtV0dKzMxFBdUZwGvnFvK2i71nkR8pU';

    try {
        console.log('📋 1. Probando endpoint con token...');
        
        const response = await axios.get('https://api.forkast.vip/api/v1/planes-sistema/restaurante/1/actual', {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });
        
        console.log('✅ Response Status:', response.status);
        console.log('✅ Response Success:', response.data.success);
        
        if (response.data.success) {
            console.log('📊 Plan Data:', JSON.stringify(response.data.data, null, 2));
        } else {
            console.log('❌ Error Response:', response.data.message);
        }
        
    } catch (error) {
        console.error('❌ Error completo:', error.message);
        
        if (error.response) {
            console.error('📊 Status:', error.response.status);
            console.error('📊 Headers:', JSON.stringify(error.response.headers, null, 2));
            console.error('📊 Data:', JSON.stringify(error.response.data, null, 2));
            
            // Intentar obtener más detalles sobre el error 500
            if (error.response.status === 500) {
                console.log('\n🔧 ANÁLISIS DEL ERROR 500:');
                console.log('El servidor está devolviendo un error interno.');
                console.log('Posibles causas:');
                console.log('1. Error en el controlador planController.js');
                console.log('2. Error en la conexión a la base de datos');
                console.log('3. Modelos faltantes o con errores');
                console.log('4. Error en la validación del JWT token');
                console.log('\n🔧 ACCIONES RECOMENDADAS:');
                console.log('1. Verificar logs del servidor en DigitalOcean');
                console.log('2. Reiniciar el servidor');
                console.log('3. Verificar que todos los modelos estén desplegados');
            }
        }
        
        if (error.request) {
            console.error('📊 Request config:', error.config);
        }
    }
}

testPlanesEndpoint();

