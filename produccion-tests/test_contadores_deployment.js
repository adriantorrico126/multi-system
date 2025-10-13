const axios = require('axios');

// =====================================================
// CONFIGURACIÓN
// =====================================================

const API_BASE_URL = 'https://api.forkast.vip/api/v1';
const RESTAURANT_ID = 1; // El que está fallando en la consola

// =====================================================
// FUNCIÓN PRINCIPAL
// =====================================================

async function testContadoresDeployment() {
    console.log('🔍 Analizando despliegue del endpoint contadores-sistema...\n');
    
    // 1. Verificar si el endpoint existe (sin autenticación)
    try {
        console.log('📡 1. Probando endpoint sin autenticación...');
        const response = await axios.get(`${API_BASE_URL}/contadores-sistema/restaurante/${RESTAURANT_ID}/actual`, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });
        
        console.log(`   ✅ Status: ${response.status}`);
        console.log(`   Success: ${response.data?.success || 'N/A'}`);
        
    } catch (error) {
        console.log(`   ❌ Status: ${error.response?.status || 'Network Error'}`);
        console.log(`   Message: ${error.response?.data?.message || error.message}`);
        
        if (error.response?.status === 401) {
            console.log('   ✅ El endpoint existe y está funcionando (requiere autenticación)');
        } else if (error.response?.status === 404) {
            console.log('   ❌ El endpoint no existe (404) - problema de despliegue');
        }
    }
    
    // 2. Verificar otros endpoints del sistema para comparar
    const endpoints = [
        {
            name: 'Planes Sistema',
            url: `/planes-sistema/restaurante/${RESTAURANT_ID}/actual`
        },
        {
            name: 'Suscripciones Sistema',
            url: `/suscripciones-sistema/restaurante/${RESTAURANT_ID}/activa`
        },
        {
            name: 'Alertas Sistema',
            url: `/alertas-sistema/restaurante/${RESTAURANT_ID}`
        }
    ];
    
    console.log('\n📡 2. Comparando con otros endpoints del sistema...');
    
    for (const endpoint of endpoints) {
        try {
            const response = await axios.get(`${API_BASE_URL}${endpoint.url}`, {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            });
            
            console.log(`   ✅ ${endpoint.name}: ${response.status}`);
            
        } catch (error) {
            console.log(`   ❌ ${endpoint.name}: ${error.response?.status || 'Network Error'}`);
        }
    }
    
    // 3. Verificar si hay problemas de base de datos
    console.log('\n📡 3. Probando endpoint de login para verificar conectividad...');
    
    try {
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
        
        if (response.data?.token) {
            // 4. Probar con token válido
            console.log('\n📡 4. Probando contadores-sistema con token válido...');
            
            try {
                const contadoresResponse = await axios.get(`${API_BASE_URL}/contadores-sistema/restaurante/${RESTAURANT_ID}/actual`, {
                    headers: {
                        'Authorization': `Bearer ${response.data.token}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 10000
                });
                
                console.log(`   ✅ Contadores con token: ${contadoresResponse.status}`);
                console.log(`   Success: ${contadoresResponse.data?.success || 'N/A'}`);
                
                if (contadoresResponse.data?.data) {
                    console.log(`   Data keys: ${Object.keys(contadoresResponse.data.data).join(', ')}`);
                }
                
            } catch (error) {
                console.log(`   ❌ Contadores con token: ${error.response?.status || 'Network Error'}`);
                console.log(`   Message: ${error.response?.data?.message || error.message}`);
                
                if (error.response?.data?.details) {
                    console.log(`   Details:`, JSON.stringify(error.response.data.details, null, 2));
                }
            }
        }
        
    } catch (error) {
        console.log(`   ❌ Login Error: ${error.response?.status || 'Network Error'}`);
        console.log(`   Message: ${error.response?.data?.message || error.message}`);
    }
    
    // 5. Análisis de conclusiones
    console.log('\n🔍 5. Análisis de conclusiones:');
    console.log('   - Si el endpoint devuelve 401 sin token: ✅ Está desplegado correctamente');
    console.log('   - Si el endpoint devuelve 404: ❌ No está desplegado');
    console.log('   - Si el endpoint devuelve 500 con token: ❌ Error en el código o base de datos');
    console.log('   - Si otros endpoints funcionan pero contadores no: ❌ Problema específico de contadores');
}

// =====================================================
// EJECUTAR ANÁLISIS
// =====================================================

testContadoresDeployment()
    .then(() => {
        console.log('\n🏁 Análisis completado');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Error en el análisis:', error.message);
        process.exit(1);
    });















