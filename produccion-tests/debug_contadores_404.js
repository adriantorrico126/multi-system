const axios = require('axios');

async function debugContadores404() {
    console.log('🔍 [DEBUG] Investigating contadores-sistema 404 error...\n');
    
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWRfdmVuZGVkb3IiOjEsInVzZXJuYW1lIjoiYWRtaW4iLCJyb2wiOiJhZG1pbiIsImlkX3N1Y3Vyc2FsIjo3LCJzdWN1cnNhbF9ub21icmUiOiJTdWN1cnNhbCBQcmluY2lwYWwiLCJpZF9yZXN0YXVyYW50ZSI6MSwicmVzdGF1cmFudGVfbm9tYnJlIjoiUmVzdGF1cmFudGUgUHJpbmNpcGFsIiwiaWF0IjoxNzU5MTE3ODQ1LCJleHAiOjE3NTkyMDQyNDV9.BBpLXZY5xCSKFtV0dKzMxFBdUZwGvnFvK2i71nkR8pU';

    // Test diferentes variaciones del endpoint
    const variations = [
        '/contadores-sistema/restaurante/1/actual',
        '/contadores/restaurante/1/actual', 
        '/usos/restaurante/1/actual',
        '/contadores-uso/restaurante/1/actual',
        '/usage/restaurante/1/actual'
    ];

    console.log('📋 Probando diferentes variaciones del endpoint...\n');

    for (let i = 0; i < variations.length; i++) {
        const endpoint = variations[i];
        console.log(`🔍 ${i + 1}. Probando ${endpoint}...`);

        try {
            const response = await axios.get(`https://api.forkast.vip/api/v1${endpoint}`, {
                headers: { 'Authorization': `Bearer ${token}` },
                timeout: 5000
            });

            console.log(`✅ Status: ${response.status} - FOUND!`);
            console.log(`📊 Data: ${JSON.stringify(response.data, null, 2)}`);
            
        } catch (error) {
            console.log(`❌ Status: ${error.response?.status || 'TIMEOUT'} - NOT FOUND`);
            
            if (error.response?.status === 404) {
                console.log(`📊 Reason: Endpoint doesn't exist`);
            } else if (error.response?.status === 500) {
                console.log(`❌ Error: Server error - ${error.response.data?.message || 'Unknown'}`);
            }
        }
        
        console.log(''); // Línea en blanco
    }

    console.log('🎯 DIAGNÓSTICO:');
    console.log('✅ Si todos devuelven 404 → El endpoint no existe en el backend');
    console.log('❌ Si alguno devuelve 500 → Error en el servidor');
    console.log('✅ Si alguno funciona → Encontrar el endpoint correcto');
    
    console.log('\n🔧 SOLUCIONES POSIBLES:');
    console.log('1. Verificar que el archivo contadoresRoutes.js existe en el backend');
    console.log('2. Verificar que está registrado en app.js');
    console.log('3. El endpoint puede llamarse diferente');
    console.log('4. Puede no ser necesario para la funcionalidad básica');
}

debugContadores404();

