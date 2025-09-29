const axios = require('axios');

// =====================================================
// CONFIGURACIÓN
// =====================================================

const API_BASE_URL = 'https://api.forkast.vip/api/v1';
const RESTAURANT_ID = 10;

// =====================================================
// FUNCIÓN PRINCIPAL
// =====================================================

async function testContadoresNoAuth() {
    console.log('🔍 Probando endpoint de contadores-sistema sin autenticación...\n');
    
    const endpoints = [
        `/contadores-sistema/restaurante/${RESTAURANT_ID}/actual`,
        `/contadores-sistema/restaurante/${RESTAURANT_ID}/resumen`,
        `/contadores-sistema/restaurante/${RESTAURANT_ID}/limites`
    ];
    
    for (const endpoint of endpoints) {
        try {
            console.log(`📡 Probando: ${endpoint}`);
            
            const response = await axios.get(`${API_BASE_URL}${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            });
            
            console.log(`✅ ${endpoint} - Status: ${response.status}`);
            console.log(`   Success: ${response.data?.success || 'N/A'}`);
            console.log(`   Message: ${response.data?.message || 'N/A'}\n`);
            
        } catch (error) {
            console.log(`❌ ${endpoint} - Error: ${error.response?.status || 'Network Error'}`);
            console.log(`   Message: ${error.response?.data?.message || error.message}`);
            
            // Si es 401, significa que el endpoint existe pero requiere autenticación
            if (error.response?.status === 401) {
                console.log(`   ✅ El endpoint existe y está funcionando (requiere autenticación)\n`);
            } else if (error.response?.status === 404) {
                console.log(`   ❌ El endpoint no existe (404)\n`);
            } else {
                console.log(`   ⚠️  Error inesperado\n`);
            }
        }
    }
    
    // Probar también el endpoint de planes para comparar
    try {
        console.log('📡 Probando endpoint de planes para comparar...');
        const response = await axios.get(`${API_BASE_URL}/planes-sistema/restaurante/${RESTAURANT_ID}/actual`, {
            headers: {
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

testContadoresNoAuth()
    .then(() => {
        console.log('🏁 Prueba completada');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Error en la prueba:', error.message);
        process.exit(1);
    });
