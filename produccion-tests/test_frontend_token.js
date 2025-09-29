const axios = require('axios');

// =====================================================
// CONFIGURACIÓN
// =====================================================

const API_BASE_URL = 'https://api.forkast.vip/api/v1';
const RESTAURANT_ID = 10;

// Token que está usando el frontend (puedes obtenerlo del localStorage)
const FRONTEND_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJlc3RhdXJhbnRlSWQiOjEwLCJ1c2VybmFtZSI6ImFkbWluIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzM0NzQ0NzQ0LCJleHAiOjE3MzQ4MzExNDR9.4J8J8J8J8J8J8J8J8J8J8J8J8J8J8J8J8J8J8J8';

// =====================================================
// FUNCIÓN PARA DECODIFICAR JWT
// =====================================================

function decodeJWT(token) {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) {
            throw new Error('Token JWT inválido');
        }
        
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        return payload;
    } catch (error) {
        console.error('Error al decodificar JWT:', error.message);
        return null;
    }
}

// =====================================================
// FUNCIÓN PRINCIPAL
// =====================================================

async function testFrontendToken() {
    console.log('🔍 Analizando token del frontend...\n');
    
    // Decodificar el token
    const payload = decodeJWT(FRONTEND_TOKEN);
    if (payload) {
        console.log('📋 Información del token:');
        console.log(`   User ID: ${payload.userId}`);
        console.log(`   Restaurante ID: ${payload.restauranteId}`);
        console.log(`   Username: ${payload.username}`);
        console.log(`   Role: ${payload.role}`);
        console.log(`   Issued at: ${new Date(payload.iat * 1000).toLocaleString()}`);
        console.log(`   Expires at: ${new Date(payload.exp * 1000).toLocaleString()}`);
        
        const now = Math.floor(Date.now() / 1000);
        const isExpired = payload.exp < now;
        console.log(`   Status: ${isExpired ? '❌ EXPIRADO' : '✅ VÁLIDO'}`);
        console.log('');
    }
    
    // Probar el endpoint con el token del frontend
    try {
        console.log('📡 Probando endpoint con token del frontend...');
        
        const response = await axios.get(`${API_BASE_URL}/contadores-sistema/restaurante/${RESTAURANT_ID}/actual`, {
            headers: {
                'Authorization': `Bearer ${FRONTEND_TOKEN}`,
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });
        
        console.log(`✅ Endpoint funcionando - Status: ${response.status}`);
        console.log(`   Success: ${response.data?.success || 'N/A'}`);
        console.log(`   Message: ${response.data?.message || 'N/A'}`);
        
        if (response.data?.data) {
            console.log(`   Data keys: ${Object.keys(response.data.data).join(', ')}`);
        }
        
    } catch (error) {
        console.log(`❌ Error con token del frontend: ${error.response?.status || 'Network Error'}`);
        console.log(`   Message: ${error.response?.data?.message || error.message}`);
        
        if (error.response?.status === 401) {
            console.log('   💡 El token está expirado o es inválido');
            console.log('   💡 Solución: El usuario necesita hacer logout/login para obtener un token fresco');
        }
    }
    
    // Probar también el endpoint de planes para comparar
    try {
        console.log('\n📡 Probando endpoint de planes para comparar...');
        const response = await axios.get(`${API_BASE_URL}/planes-sistema/restaurante/${RESTAURANT_ID}/actual`, {
            headers: {
                'Authorization': `Bearer ${FRONTEND_TOKEN}`,
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

testFrontendToken()
    .then(() => {
        console.log('🏁 Prueba completada');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Error en la prueba:', error.message);
        process.exit(1);
    });
