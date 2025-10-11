const axios = require('axios');

// =====================================================
// CONFIGURACIÓN
// =====================================================

const API_BASE_URL = 'https://api.forkast.vip/api/v1';
const RESTAURANT_ID = 10;

// =====================================================
// FUNCIÓN PRINCIPAL
// =====================================================

async function debugPlanes500() {
    console.log('🔍 Diagnosticando error 500 en planes-sistema...\n');
    
    try {
        console.log('📡 Probando endpoint de planes-sistema...');
        console.log(`   URL: ${API_BASE_URL}/planes-sistema/restaurante/${RESTAURANT_ID}/actual`);
        
        const response = await axios.get(`${API_BASE_URL}/planes-sistema/restaurante/${RESTAURANT_ID}/actual`, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 15000
        });
        
        console.log(`   ✅ Status: ${response.status}`);
        console.log(`   Success: ${response.data?.success || 'N/A'}`);
        console.log(`   Message: ${response.data?.message || 'N/A'}`);
        
        if (response.data?.data) {
            console.log(`   Data keys: ${Object.keys(response.data.data).join(', ')}`);
            if (response.data.data.plan) {
                console.log(`   Plan: ${response.data.data.plan.nombre || 'N/A'}`);
            }
        }
        
    } catch (error) {
        console.log(`   ❌ Status: ${error.response?.status || 'Network Error'}`);
        console.log(`   Message: ${error.response?.data?.message || error.message}`);
        
        if (error.response?.data) {
            console.log(`   Error details:`, JSON.stringify(error.response.data, null, 2));
        }
        
        if (error.response?.status === 500) {
            console.log(`   🔍 Diagnóstico: Error interno del servidor`);
            console.log(`   Posibles causas:`);
            console.log(`   - Error en la base de datos`);
            console.log(`   - Error en el middleware validateActiveSubscriptionPlan`);
            console.log(`   - Error en el controlador getCurrentRestaurantPlan`);
            console.log(`   - Error en los modelos (SuscripcionModel, PlanModel, ContadorUsoModel)`);
        }
    }
    
    // Probar también el endpoint de suscripciones para comparar
    try {
        console.log('\n📡 Probando endpoint de suscripciones para comparar...');
        const response = await axios.get(`${API_BASE_URL}/suscripciones-sistema/restaurante/${RESTAURANT_ID}/activa`, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });
        
        console.log(`   ✅ Suscripciones Status: ${response.status}`);
        console.log(`   Success: ${response.data?.success || 'N/A'}`);
        
        if (response.data?.data) {
            console.log(`   Suscripción activa: ${response.data.data.activa || 'N/A'}`);
            console.log(`   Plan ID: ${response.data.data.id_plan || 'N/A'}`);
        }
        
    } catch (error) {
        console.log(`   ❌ Suscripciones Error: ${error.response?.status || 'Network Error'}`);
        console.log(`   Message: ${error.response?.data?.message || error.message}`);
    }
    
    // Probar el endpoint de contadores
    try {
        console.log('\n📡 Probando endpoint de contadores...');
        const response = await axios.get(`${API_BASE_URL}/contadores-sistema/restaurante/${RESTAURANT_ID}/actual`, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });
        
        console.log(`   ✅ Contadores Status: ${response.status}`);
        console.log(`   Success: ${response.data?.success || 'N/A'}`);
        
    } catch (error) {
        console.log(`   ❌ Contadores Error: ${error.response?.status || 'Network Error'}`);
        console.log(`   Message: ${error.response?.data?.message || error.message}`);
        
        if (error.response?.status === 404) {
            console.log(`   🔍 Diagnóstico: Endpoint contadores-sistema no encontrado`);
            console.log(`   Esto confirma que el archivo contadoresSistemaRoutes.js no está desplegado`);
        }
    }
}

// =====================================================
// EJECUTAR DIAGNÓSTICO
// =====================================================

debugPlanes500()
    .then(() => {
        console.log('\n🏁 Diagnóstico completado');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Error en el diagnóstico:', error.message);
        process.exit(1);
    });












