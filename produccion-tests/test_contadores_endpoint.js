const axios = require('axios');

// =====================================================
// CONFIGURACIÓN
// =====================================================

const API_BASE_URL = 'https://api.forkast.vip/api/v1';
const RESTAURANT_ID = 10; // ID del restaurante que está fallando

// Token de autenticación (puedes obtenerlo del localStorage del navegador)
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJlc3RhdXJhbnRlSWQiOjEwLCJ1c2VybmFtZSI6ImFkbWluIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzM0NzQ0NzQ0LCJleHAiOjE3MzQ4MzExNDR9.4J8J8J8J8J8J8J8J8J8J8J8J8J8J8J8J8J8J8J8';

// =====================================================
// FUNCIÓN PRINCIPAL
// =====================================================

async function testContadoresEndpoint() {
    console.log('🔍 Probando endpoint de contadores-sistema...\n');
    
    const endpoints = [
        `/contadores-sistema/restaurante/${RESTAURANT_ID}/actual`,
        `/contadores-sistema/restaurante/${RESTAURANT_ID}/resumen`,
        `/contadores-sistema/restaurante/${RESTAURANT_ID}/limites`,
        `/contadores-sistema/restaurante/${RESTAURANT_ID}/historial`
    ];
    
    for (const endpoint of endpoints) {
        try {
            console.log(`📡 Probando: ${endpoint}`);
            
            const response = await axios.get(`${API_BASE_URL}${endpoint}`, {
                headers: {
                    'Authorization': `Bearer ${AUTH_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            });
            
            console.log(`✅ ${endpoint} - Status: ${response.status}`);
            console.log(`   Response: ${JSON.stringify(response.data, null, 2).substring(0, 200)}...\n`);
            
        } catch (error) {
            console.log(`❌ ${endpoint} - Error: ${error.response?.status || 'Network Error'}`);
            console.log(`   Message: ${error.response?.data?.message || error.message}\n`);
        }
    }
    
    // Probar también el endpoint de planes para comparar
    try {
        console.log('📡 Probando endpoint de planes para comparar...');
        const response = await axios.get(`${API_BASE_URL}/planes-sistema/restaurante/${RESTAURANT_ID}/actual`, {
            headers: {
                'Authorization': `Bearer ${AUTH_TOKEN}`,
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });
        
        console.log(`✅ /planes-sistema/restaurante/${RESTAURANT_ID}/actual - Status: ${response.status}`);
        console.log(`   Plan: ${response.data?.data?.nombre_plan || 'N/A'}\n`);
        
    } catch (error) {
        console.log(`❌ /planes-sistema/restaurante/${RESTAURANT_ID}/actual - Error: ${error.response?.status || 'Network Error'}`);
        console.log(`   Message: ${error.response?.data?.message || error.message}\n`);
    }
}

// =====================================================
// EJECUTAR PRUEBA
// =====================================================

testContadoresEndpoint()
    .then(() => {
        console.log('🏁 Prueba completada');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Error en la prueba:', error.message);
        process.exit(1);
    });
