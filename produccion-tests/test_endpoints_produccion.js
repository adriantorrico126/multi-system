const axios = require('axios');

// Configuración para producción
const API_BASE = 'https://api.forkast.vip/api/v1';

// Token de prueba (usando el del usuario logueado)
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWRfdmVuZGVkb3IiOjEsInVzZXJuYW1lIjoiYWRtaW4iLCJyb2wiOiJhZG1pbiIsImlkX3N1Y3Vyc2FsIjo3LCJzdWN1cnNhbF9ub21icmUiOiJTdWN1cnNhbCBQcmluY2lwYWwiLCJpZF9yZXN0YXVyYW50ZSI6MSwicmVzdGF1cmFudGVfbm9tYnJlIjoiUmVzdGF1cmFudGUgUHJpbmNpcGFsIiwiaWF0IjoxNzU5MTExMzI1LCJleHAiOjE3NTkxOTc3MjV9.hC5_TKoxRkUxDVxy9A7gVWzAZCuWUGk52XheDjqIDKs';

const headers = {
    'Authorization': `Bearer ${TEST_TOKEN}`,
    'Content-Type': 'application/json'
};

async function testEndpoint(url, description) {
    try {
        console.log(`\n🔍 Probando: ${description}`);
        console.log(`URL: ${url}`);
        
        const response = await axios.get(url, { headers });
        
        console.log(`✅ Status: ${response.status}`);
        console.log(`📊 Response:`, JSON.stringify(response.data, null, 2));
        
    } catch (error) {
        console.log(`❌ Error: ${error.response?.status || error.message}`);
        console.log(`📋 Details:`, error.response?.data || error.message);
    }
}

async function runTests() {
    console.log('🚀 INICIANDO PRUEBAS DE ENDPOINTS DE PRODUCCIÓN');
    console.log('=' .repeat(60));
    
    // Endpoints críticos del sistema de planes
    const endpoints = [
        {
            url: `${API_BASE}/planes-sistema/restaurante/1/actual`,
            description: 'Plan actual del restaurante'
        },
        {
            url: `${API_BASE}/suscripciones-sistema/restaurante/1/activa`,
            description: 'Suscripción activa'
        },
        {
            url: `${API_BASE}/contadores-sistema/restaurante/1/actual`,
            description: 'Contadores de uso actuales'
        },
        {
            url: `${API_BASE}/alertas-sistema/restaurante/1/activas`,
            description: 'Alertas activas'
        },
        {
            url: `${API_BASE}/alertas-sistema/restaurante/1/resueltas`,
            description: 'Alertas resueltas'
        }
    ];
    
    for (const endpoint of endpoints) {
        await testEndpoint(endpoint.url, endpoint.description);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Esperar 1 segundo entre requests
    }
    
    console.log('\n🏁 PRUEBAS COMPLETADAS');
    console.log('=' .repeat(60));
}

runTests().catch(console.error);
