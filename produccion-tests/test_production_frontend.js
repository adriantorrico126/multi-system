const axios = require('axios');

async function testProductionFrontend() {
    console.log('🔍 [TEST] Verificando estado completo de producción...\n');
    
    // Usar el mismo token actualizado
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWRfdmVuZGVkb3IiOjEsInVzZXJuYW1lIjoiYWRtaW4iLCJyb2wiOiJhZG1pbiIsImlkX3N1Y3Vyc2FsIjo3LCJzdWN1cnNhbF9ub21icmUiOiJTdWN1cnNhbCBQcmluY2lwYWwiLCJpZF9yZXN0YXVyYW50ZSI6MSwicmVzdGF1cmFudGVfbm9tYnJlIjoiUmVzdGF1cmFudGUgUHJpbmNpcGFsIiwiaWF0IjoxNzU5MTE3ODQ1LCJleHAiOjE3NTkyMDQyNDV9.BBpLXZY5xCSKFtV0dKzMxFBdUZwGvnFvK2i71nkR8pU';

    const endpoints = [
        '/planes-sistema/restaurante/1/actual',
        '/suscripciones-sistema/restaurante/1/activa',
        '/contadores-sistema/restaurante/1/actual'
    ];

    console.log('📋 Probando todos los endpoints críticos...\n');

    for (let i = 0; i < endpoints.length; i++) {
        const endpoint = endpoints[i];
        console.log(`🔍 ${i + 1}. Probando ${endpoint}...`);

        try {
            const response = await axios.get(`https://api.forkast.vip/api/v1${endpoint}`, {
                headers: { 'Authorization': `Bearer ${token}` },
                timeout: 10000
            });

            console.log(`✅ Status: ${response.status} - ${response.data.success ? 'SUCCESS' : 'FAILED'}`);
            
            if (endpoint.includes('planes-sistema')) {
                const planData = response.data.data;
                console.log(`📊 Plan: ${planData?.plan?.nombre || 'N/A'}`);
                console.log(`📊 incluye_pos: ${planData?.funcionalidades?.incluye_pos || 'N/A'}`);
                console.log(`📊 incluye_promociones: ${planData?.funcionalidades?.incluye_promociones || 'N/A'}`);
            }
            
        } catch (error) {
            console.log(`❌ Status: ${error.response?.status || 'NO RESPONSE'} - FAILED`);
            if (error.response?.data?.message) {
                console.log(`📊 Error: ${error.response.data.message}`);
            }
        }
        
        console.log(''); // Línea en blanco
    }

    console.log('🎯 CONCLUSIÓN:');
    console.log('✅ Si todos los endpoints devuelven 200 OK con datos correctos:');
    console.log('   → El problema está en sincronización del frontend');
    console.log('   → SOLUCIÓN: Logout completo + Login fresco');
    console.log('');
    console.log('❌ Si algún endpoint devuelve error:');
    console.log('   → El problema está en el backend');
    console.log('   → SOLUCIÓN: Revisar logs del servidor');
}

testProductionFrontend();

