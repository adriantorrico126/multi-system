const axios = require('axios');

// =====================================================
// CONFIGURACIÓN
// =====================================================

const API_BASE_URL = 'https://api.forkast.vip/api/v1';
const RESTAURANT_ID = 10;

// =====================================================
// FUNCIÓN PRINCIPAL
// =====================================================

async function debugProductionErrors() {
    console.log('🔍 Diagnosticando errores de producción...\n');
    
    const endpoints = [
        {
            name: 'Contadores Sistema',
            url: `/contadores-sistema/restaurante/${RESTAURANT_ID}/actual`,
            expected: '200'
        },
        {
            name: 'Planes Sistema',
            url: `/planes-sistema/restaurante/${RESTAURANT_ID}/actual`,
            expected: '200'
        },
        {
            name: 'Suscripciones Sistema',
            url: `/suscripciones-sistema/restaurante/${RESTAURANT_ID}/activa`,
            expected: '200'
        },
        {
            name: 'Alertas Sistema',
            url: `/alertas-sistema/restaurante/${RESTAURANT_ID}`,
            expected: '200'
        }
    ];
    
    for (const endpoint of endpoints) {
        try {
            console.log(`📡 Probando: ${endpoint.name}`);
            console.log(`   URL: ${endpoint.url}`);
            
            const response = await axios.get(`${API_BASE_URL}${endpoint.url}`, {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            });
            
            console.log(`   ✅ Status: ${response.status} (esperado: ${endpoint.expected})`);
            console.log(`   Success: ${response.data?.success || 'N/A'}`);
            console.log(`   Message: ${response.data?.message || 'N/A'}`);
            
            if (response.data?.data) {
                console.log(`   Data keys: ${Object.keys(response.data.data).join(', ')}`);
            }
            console.log('');
            
        } catch (error) {
            console.log(`   ❌ Status: ${error.response?.status || 'Network Error'}`);
            console.log(`   Message: ${error.response?.data?.message || error.message}`);
            
            if (error.response?.status === 404) {
                console.log(`   🔍 Diagnóstico: Endpoint no encontrado - posible problema de despliegue`);
            } else if (error.response?.status === 500) {
                console.log(`   🔍 Diagnóstico: Error interno del servidor - revisar logs del backend`);
            } else if (error.response?.status === 401) {
                console.log(`   🔍 Diagnóstico: Requiere autenticación - endpoint existe`);
            }
            console.log('');
        }
    }
    
    // Probar también el endpoint de login para verificar que el backend esté funcionando
    try {
        console.log('📡 Probando endpoint de login...');
        const response = await axios.post(`${API_BASE_URL}/auth/login`, {
            username: 'admin',
            password: 'admin123'
        }, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });
        
        console.log(`   ✅ Login Status: ${response.status}`);
        console.log(`   Token recibido: ${response.data?.token ? 'Sí' : 'No'}`);
        console.log('');
        
    } catch (error) {
        console.log(`   ❌ Login Error: ${error.response?.status || 'Network Error'}`);
        console.log(`   Message: ${error.response?.data?.message || error.message}`);
        console.log('');
    }
}

// =====================================================
// EJECUTAR DIAGNÓSTICO
// =====================================================

debugProductionErrors()
    .then(() => {
        console.log('🏁 Diagnóstico completado');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Error en el diagnóstico:', error.message);
        process.exit(1);
    });















