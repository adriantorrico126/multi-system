const axios = require('axios');

// =====================================================
// CONFIGURACIÓN
// =====================================================

const API_BASE_URL = 'https://api.forkast.vip/api/v1';
const RESTAURANT_ID = 10;

// Credenciales para obtener un token fresco
const LOGIN_CREDENTIALS = {
    username: 'admin',
    password: 'admin123' // Ajusta según tus credenciales
};

// =====================================================
// FUNCIÓN PARA OBTENER TOKEN
// =====================================================

async function getFreshToken() {
    try {
        console.log('🔐 Obteniendo token de autenticación...');
        
        const response = await axios.post(`${API_BASE_URL}/auth/login`, LOGIN_CREDENTIALS, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });
        
        if (response.data.success && response.data.token) {
            console.log('✅ Token obtenido exitosamente');
            return response.data.token;
        } else {
            throw new Error('No se pudo obtener el token');
        }
        
    } catch (error) {
        console.error('❌ Error al obtener token:', error.response?.data?.message || error.message);
        throw error;
    }
}

// =====================================================
// FUNCIÓN PRINCIPAL
// =====================================================

async function testContadoresWithFreshToken() {
    try {
        // Obtener token fresco
        const token = await getFreshToken();
        
        console.log('\n🔍 Probando endpoint de contadores-sistema con token fresco...\n');
        
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
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 10000
                });
                
                console.log(`✅ ${endpoint} - Status: ${response.status}`);
                console.log(`   Success: ${response.data?.success || 'N/A'}`);
                console.log(`   Message: ${response.data?.message || 'N/A'}`);
                
                if (response.data?.data) {
                    console.log(`   Data keys: ${Object.keys(response.data.data).join(', ')}`);
                }
                console.log('');
                
            } catch (error) {
                console.log(`❌ ${endpoint} - Error: ${error.response?.status || 'Network Error'}`);
                console.log(`   Message: ${error.response?.data?.message || error.message}`);
                console.log('');
            }
        }
        
        // Probar también el endpoint de planes para comparar
        try {
            console.log('📡 Probando endpoint de planes para comparar...');
            const response = await axios.get(`${API_BASE_URL}/planes-sistema/restaurante/${RESTAURANT_ID}/actual`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
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
        
    } catch (error) {
        console.error('💥 Error en la prueba:', error.message);
    }
}

// =====================================================
// EJECUTAR PRUEBA
// =====================================================

testContadoresWithFreshToken()
    .then(() => {
        console.log('🏁 Prueba completada');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Error en la prueba:', error.message);
        process.exit(1);
    });
