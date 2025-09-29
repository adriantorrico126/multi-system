/**
 * Test específico para verificar datos del restaurante ID 10 en producción
 */

const axios = require('axios');

// Configuración de producción
const PRODUCTION_CONFIG = {
    baseURL: 'https://tu-url-produccion.com/api/v1', // Reemplazar con URL real
    headers: {
        'Content-Type': 'application/json'
    }
};

const RESTAURANT_ID = 10;

class RestaurantDataTester {
    constructor() {
        this.token = null;
        this.userData = null;
        this.results = {
            login: null,
            refresh: null,
            restaurant: null,
            plan: null,
            suscription: null
        };
    }

    async runCompleteTest() {
        console.log('🔍 PRUEBAS COMPLETAS PARA RESTAURANTE ID 10');
        console.log('=' .repeat(60));
        
        try {
            await this.testLoginFlow();
            await this.testRefreshTokenFlow();
            await this.testRestaurantDetails();
            await this.testPlanDetails();
            await this.testSuscriptionDetails();
            
            this.generateDetailedReport();
        } catch (error) {
            console.error('❌ Error en las pruebas:', error.message);
        }
    }

    async testLoginFlow() {
        console.log('\n📋 1. PRUEBA DE FLUJO DE LOGIN...');
        
        try {
            // Intentar login con credenciales de prueba
            const loginData = {
                username: process.env.TEST_USERNAME || 'test_user',
                password: process.env.TEST_PASSWORD || 'test_password'
            };
            
            console.log('🔐 Intentando login con:', loginData.username);
            
            const response = await axios.post(`${PRODUCTION_CONFIG.baseURL}/auth/login`, loginData);
            
            if (response.data.token) {
                this.token = response.data.token;
                PRODUCTION_CONFIG.headers.Authorization = `Bearer ${this.token}`;
                this.results.login = response.data;
                
                console.log('✅ Login exitoso');
                console.log('👤 Usuario:', response.data.data?.nombre);
                console.log('🏪 Restaurante:', response.data.data?.restaurante?.nombre || 'NO ENCONTRADO');
                console.log('🏢 Sucursal:', response.data.data?.sucursal?.nombre || 'NO ENCONTRADO');
                console.log('🎯 Target Restaurant ID:', response.data.data?.id_restaurante);
                
                // Verificar si es el restaurante correcto
                if (response.data.data?.id_restaurante !== RESTAURANT_ID) {
                    console.log('⚠️ ADVERTENCIA: El usuario no pertenece al restaurante ID 10');
                    console.log('   Usuario pertenece a:', response.data.data?.id_restaurante);
                }
                
                this.userData = response.data.data;
            }
        } catch (error) {
            console.error('❌ Error en login:', error.response?.data || error.message);
            this.results.login = { error: error.message };
        }
    }

    async testRefreshTokenFlow() {
        console.log('\n🔄 2. PRUEBA DE REFRESH TOKEN...');
        
        try {
            const response = await axios.post(`${PRODUCTION_CONFIG.baseURL}/auth/refresh`, {}, PRODUCTION_CONFIG.headers);
            
            if (response.data.token) {
                this.results.refresh = response.data;
                
                console.log('✅ Refresh token exitoso');
                console.log('👤 Usuario:', response.data.data?.nombre);
                console.log('🏪 Restaurante:', response.data.data?.restaurante?.nombre || 'NO ENCONTRADO');
                console.log('🏢 Sucursal:', response.data.data?.sucursal?.nombre || 'NO ENCONTRADO');
                
                // Comparar con datos del login
                const loginRestaurant = this.results.login?.data?.restaurante?.nombre;
                const refreshRestaurant = response.data.data?.restaurante?.nombre;
                
                if (loginRestaurant === refreshRestaurant) {
                    console.log('✅ Consistencia: Restaurante igual en login y refresh');
                } else {
                    console.log('⚠️ INCONSISTENCIA: Restaurante diferente entre login y refresh');
                    console.log('   Login:', loginRestaurant);
                    console.log('   Refresh:', refreshRestaurant);
                }
            }
        } catch (error) {
            console.error('❌ Error en refresh token:', error.response?.data || error.message);
            this.results.refresh = { error: error.message };
        }
    }

    async testRestaurantDetails() {
        console.log('\n🏪 3. PRUEBA DE DETALLES DEL RESTAURANTE 10...');
        
        try {
            // Probar diferentes endpoints para obtener datos del restaurante
            const endpoints = [
                `/restaurantes/${RESTAURANT_ID}`,
                `/restaurantes/${RESTAURANT_ID}/detalle`,
                `/restaurantes/detalle/${RESTAURANT_ID}`
            ];
            
            for (const endpoint of endpoints) {
                try {
                    console.log(`🔍 Probando endpoint: ${endpoint}`);
                    const response = await axios.get(`${PRODUCTION_CONFIG.baseURL}${endpoint}`, PRODUCTION_CONFIG.headers);
                    
                    if (response.data.success && response.data.data) {
                        console.log(`✅ ${endpoint} - Datos obtenidos:`);
                        console.log('   - ID:', response.data.data.id_restaurante);
                        console.log('   - Nombre:', response.data.data.nombre);
                        console.log('   - Ciudad:', response.data.data.ciudad);
                        console.log('   - Dirección:', response.data.data.direccion);
                        console.log('   - Teléfono:', response.data.data.telefono);
                        console.log('   - Email:', response.data.data.email);
                        console.log('   - Activo:', response.data.data.activo);
                        
                        this.results.restaurant = response.data.data;
                        break; // Usar el primer endpoint que funcione
                    }
                } catch (endpointError) {
                    console.log(`❌ ${endpoint} - Error:`, endpointError.response?.status, endpointError.response?.data?.message);
                }
            }
        } catch (error) {
            console.error('❌ Error obteniendo detalles del restaurante:', error.message);
            this.results.restaurant = { error: error.message };
        }
    }

    async testPlanDetails() {
        console.log('\n💎 4. PRUEBA DE DETALLES DEL PLAN...');
        
        try {
            const endpoints = [
                `/planes/restaurante/${RESTAURANT_ID}/actual`,
                `/planes/restaurante/${RESTAURANT_ID}/info`,
                `/planes/info/${RESTAURANT_ID}`,
                `/suscripciones/restaurante/${RESTAURANT_ID}/actual`
            ];
            
            for (const endpoint of endpoints) {
                try {
                    console.log(`🔍 Probando endpoint de plan: ${endpoint}`);
                    const response = await axios.get(`${PRODUCTION_CONFIG.baseURL}${endpoint}`, PRODUCTION_CONFIG.headers);
                    
                    if (response.data.success || response.data.data) {
                        console.log(`✅ ${endpoint} - Datos obtenidos:`);
                        
                        if (response.data.data.plan) {
                            console.log('   📋 Plan:');
                            console.log('     - ID:', response.data.data.plan.id_plan);
                            console.log('     - Nombre:', response.data.data.plan.nombre);
                            console.log('     - Descripción:', response.data.data.plan.descripcion);
                            console.log('     - Precio:', response.data.data.plan.precio);
                        }
                        
                        if (response.data.data.suscripcion) {
                            console.log('   📊 Suscripción:');
                            console.log('     - Estado:', response.data.data.suscripcion.estado);
                            console.log('     - Fecha Inicio:', response.data.data.suscripcion.fecha_inicio);
                            console.log('     - Fecha Fin:', response.data.data.suscripcion.fecha_fin);
                        }
                        
                        this.results.plan = response.data.data;
                        break;
                    }
                } catch (endpointError) {
                    console.log(`❌ ${endpoint} - Error:`, endpointError.response?.status, endpointError.response?.data?.message);
                }
            }
        } catch (error) {
            console.error('❌ Error obteniendo detalles del plan:', error.message);
            this.results.plan = { error: error.message };
        }
    }

    async testSuscriptionDetails() {
        console.log('\n📋 5. PRUEBA DE DETALLES DE SUSCRIPCIÓN...');
        
        try {
            const response = await axios.get(`${PRODUCTION_CONFIG.baseURL}/suscripciones/restaurante/${RESTAURANT_ID}`, PRODUCTION_CONFIG.headers);
            
            if (response.data.success && response.data.data.length > 0) {
                console.log('✅ Suscripciones encontradas:', response.data.data.length);
                
                // Buscar suscripción activa
                const activeSubscription = response.data.data.some(sub => sub.estado === 'activa');
                
                response.data.data.forEach((sub, index) => {
                    console.log(`   Suscripción ${index + 1}:`);
                    console.log('     - Estado:', sub.estado);
                    console.log('     - ID Plan:', sub.id_plan);
                    console.log('     - Fecha Inicio:', sub.fecha_inicio);
                    console.log('     - Fecha Fin:', sub.fecha_fin);
                    console.log('     - Activa:', activeSubscription ? '✅' : '❌');
                });
                
                this.results.suscription = response.data.data;
            } else {
                console.log('⚠️ No se encontraron suscripciones');
            }
        } catch (error) {
            console.error('❌ Error obteniendo suscripciones:', error.response?.data || error.message);
            this.results.suscription = { error: error.message };
        }
    }

    generateDetailedReport() {
        console.log('\n📊 REPORTE DETALLADO');
        console.log('=' .repeat(60));
        
        console.log('🎯 ANÁLISIS DEL PROBLEMA DEL HEADER:');
        
        // Analizar datos del usuario
        const loginRestaurant = this.results.login?.data?.restaurante?.nombre;
        const refreshRestaurant = this.results.refresh?.data?.restaurante?.nombre;
        const dbRestaurant = this.results.restaurant?.nombre;
        const planName = this.results.plan?.plan?.nombre;
        const subscriptionStatus = this.results.plan?.suscripcion?.estado;
        
        console.log('\n📋 DATOS OBTENIDOS:');
        console.log(`   Restaurant en Login: ${loginRestaurant || 'NO ENCONTRADO'}`);
        console.log(`   Restaurant en Refresh: ${refreshRestaurant || 'NO ENCONTRADO'}`);
        console.log(`   Restaurant'en BD: ${dbRestaurant || 'NO ENCONTRADO'}`);
        console.log(`   Nombre del Plan: ${planName || 'NO ENCONTRADO'}`);
        console.log(`   Estado Suscripción: ${subscriptionStatus || 'NO ENCONTRADO'}`);
        
        console.log('\n🔍 POSIBLES CAUSAS DEL PROBLEMA:');
        
        if (!loginRestaurant) {
          console.log('❌ 1. Problema en endpoint /auth/login: No incluye datos de restaurante');
        }
        
        if (!refreshRestaurant) {
          console.log('❌ 2. Problema en endpoint /auth/refresh: No incluye datos de restaurante');
        }
        
        if (!dbRestaurant) {
          console.log('❌ 3. Problema accediendo a datos del restaurante en BD');
        }
        
        if (!planName) {
          console.log('❌ 4. Problema obteniendo información del plan');
        }
        
        if (!subscriptionStatus) {
          console.log('❌ 5. Problema obteniendo estado de suscripción');
        }
        
        // Verificar consistencia
        if (loginRestaurant && refreshRestaurant && loginRestaurant !== refreshRestaurant) {
          console.log('❌ 6. Inconsistencia entre datos de login y refresh');
        }
        
        if (dbRestaurant && loginRestaurant && dbRestaurant !== loginRestaurant) {
          console.log('❌ 7. Inconsistencia entre BD y respuesta de login');
        }
        
        console.log('\n🛠️ RECOMENDACIONES DE SOLUCIÓN:');
        console.log('1. Verificar middleware de autenticación en el backend');
        console.log('2. Verificar que AuthContext reciba datos correctos del localStorage');
        console.log('3. Verificar que Header.component use user.restaurante?.nombre');
        console.log('4. Verificar que el sistema de planes funcione correctamente');
        console.log('5. Verificar refresco automático de datos del usuario');
        
        console.log('\n🎯 PRÓXIMOS PASOS:');
        console.log('1. Revisar código del authController.js en producción');
        console.log('2. Revisar AuthContext.tsx en el frontend');
        console.log('3. Revisar Header.tsx en el frontend');
        console.log('4. Revisar sistema de planes en producción');
    }
}

// Ejecutar pruebas
if (require.main === module) {
    const tester = new RestaurantDataTester();
    tester.runCompleteTest().catch(console.error);
}

module.exports = RestaurantDataTester;
