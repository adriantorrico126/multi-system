/**
 * Test para verificar el Header en producción
 * Verificar información del usuario, restaurante, sucursal y plan
 */

const axios = require('axios');

// Configuración de pruebas
const PRODUCTION_CONFIG = {
    baseURL: 'https://tu-url-produccion.com/api/v1', // Reemplazar con URL real
    headers: {
        'Content-Type': 'application/json'
    }
};

const RESTAURANT_ID = 10; // Restaurante específico a probar

class ProductionHeaderTester {
    constructor() {
        this.results = {
            user: null,
            restaurant: null,
            branch: null,
            plan: null,
            errors: []
        };
    }

    async runTests() {
        console.log('🔍 INICIANDO PRUEBAS DE HEADER EN PRODUCCIÓN');
        console.log('=' .repeat(50));
        
        try {
            await this.testUserAuthentication();
            await this.testRestaurantInfo();
            await this.testBranchInfo();
            await this.testPlanInfo();
            
            this.generateReport();
        } catch (error) {
            console.error('❌ Error en las pruebas:', error.message);
        }
    }

    async testUserAuthentication() {
        console.log('\n📋 1. PROBANDO AUTENTICACIÓN DE USUARIO...');
        
        try {
            // Simular login o usar token existente
            const response = await axios.post(`${PRODUCTION_CONFIG.baseURL}/auth/login`, {
                username: 'test_user', // Cambiar por usuario real
                password: 'test_password'
            });

            if (response.data.token) {
                PRODUCTION_CONFIG.headers.Authorization = `Bearer ${response.data.token}`;
                
                console.log('✅ Token obtenido:', response.data.token.substring(0, 20) + '...');
                console.log('👤 Datos del usuario:');
                console.log('   - Nombre:', response.data.data?.nombre);
                console.log('   - Rol:', response.data.data?.rol);
                console.log('   - Restaurante ID:', response.data.data?.id_restaurante);
                console.log('   - Sucursal ID:', response.data.data?.id_sucursal);
                
                // Verificar estructura de restaurante en respuesta
                if (response.data.data?.restaurante) {
                    console.log('🏪 Información del restaurante en login:');
                    console.log('   - Nombre:', response.data.data.restaurante.nombre);
                    console.log('   - Ciudad:', response.data.data.restaurante.ciudad);
                } else {
                    this.results.errors.push('❌ No se encontró información de restaurante en el login');
                }

                // Verificar estructura de sucursal en respuesta
                if (response.data.data?.sucursal) {
                    console.log('🏢 Información de sucursal en login:');
                    console.log('   - Nombre:', response.data.data.sucursal.nombre);
                    console.log('   - Ciudad:', response.data.data.sucursal.ciudad);
                } else {
                    this.results.errors.push('❌ No se encontró información de sucursal en el login');
                }

                this.results.user = response.data.data;
            }
        } catch (error) {
            console.error('❌ Error en autenticación:', error.response?.data || error.message);
            this.results.errors.push(`Error autenticación: ${error.message}`);
        }
    }

    async testRestaurantInfo() {
        console.log('\n🏪 2. PROBANDO INFORMACIÓN DEL RESTAURANTE...');
        
        try {
            const response = await axios.get(`${PRODUCTION_CONFIG.baseURL}/restaurantes/${RESTAURANT_ID}`, PRODUCTION_CONFIG.headers);
            
            if (response.data.success) {
                console.log('✅ Información del restaurante obtenida:');
                console.log('   - ID:', response.data.data.id_restaurante);
                console.log('   - Nombre:', response.data.data.nombre);
                console.log('   - Ciudad:', response.data.data.ciudad);
                console.log('   - Dirección:', response.data.data.direccion);
                console.log('   - Activo:', response.data.data.activo);
                
                this.results.restaurant = response.data.data;
            } else {
                this.results.errors.push('❌ No se pudo obtener información del restaurante');
            }
        } catch (error) {
            console.error('❌ Error obteniendo restaurante:', error.response?.data || error.message);
            this.results.errors.push(`Error restaurante: ${error.message}`);
        }
    }

    async testBranchInfo() {
        console.log('\n🏢 3. PROBANDO INFORMACIÓN DE LA SUCURSAL...');
        
        try {
            const response = await axios.get(`${PRODUCTION_CONFIG.baseURL}/sucursales/restaurante/${RESTAURANT_ID}`, PRODUCTION_CONFIG.headers);
            
            if (response.data.success && response.data.data.length > 0) {
                console.log('✅ Sucursales encontradas:', response.data.data.length);
                
                response.data.data.forEach((branch, index) => {
                    console.log(`   Sucursal ${index + 1}:`);
                    console.log('     - ID:', branch.id_sucursal);
                    console.log('     - Nombre:', branch.nombre);
                    console.log('     - Ciudad:', branch.ciudad);
                    console.log('     - Dirección:', branch.direccion);
                    console.log('     - Activa:', branch.activo);
                });
                
                this.results.branch = response.data.data;
            } else {
                this.results.errors.push('❌ No se encontraron sucursales');
            }
        } catch (error) {
            console.error('❌ Error obteniendo sucursales:', error.response?.data || error.message);
            this.results.errors.push(`Error sucursales: ${error.message}`);
        }
    }

    async testPlanInfo() {
        console.log('\n💎 4. PROBANDO INFORMACIÓN DEL PLAN...');
        
        try {
            const response = await axios.get(`${PRODUCTION_CONFIG.baseURL}/planes/restaurante/${RESTAURANT_ID}/actual`, PRODUCTION_CONFIG.headers);
            
            if (response.data.success) {
                console.log('✅ Información del plan obtenida:');
                console.log('   - ID Plan:', response.data.data.plan?.id_plan);
                console.log('   - Nombre Plan:', response.data.data.plan?.nombre);
                console.log('   - Estado Suscripción:', response.data.data.suscripcion?.estado);
                console.log('   - Fecha Inicio:', response.data.data.suscripcion?.fecha_inicio);
                console.log('   - Fecha Fin:', response.data.data.suscripcion?.fecha_fin);
                
                this.results.plan = response.data.data;
            } else {
                this.results.errors.push('❌ No se pudo obtener información del plan');
                console.log('⚠️ Respuesta:', response.data);
            }
        } catch (error) {
            console.error('❌ Error obteniendo plan:', error.response?.data || error.message);
            this.results.errors.push(`Error plan: ${error.message}`);
        }
    }

    generateReport() {
        console.log('\n📊 REPORTE FINAL DE PRUEBAS');
        console.log('=' .repeat(50));
        
        if (this.results.errors.length > 0) {
            console.log('❌ PROBLEMAS ENCONTRADOS:');
            this.results.errors.forEach(error => console.log('   ', error));
        } else {
            console.log('✅ TODAS LAS PRUEBAS COMPLETADAS EXITOSAMENTE');
        }
        
        console.log('\n🔍 RESUMEN DE DATOS OBTENIDOS:');
        
        if (this.results.user) {
            console.log('👤 Usuario:', this.results.user.nombre);
            console.log('🏪 Restaurante en login:', this.results.user.restaurante?.nombre || 'NO ENCONTRADO');
            console.log('🏢 Sucursal en login:', this.results.user.sucursal?.nombre || 'NO ENCONTRADO');
        }
        
        if (this.results.restaurant) {
            console.log('🏪 Restaurante BD:', this.results.restaurant.nombre);
        }
        
        if (this.results.plan) {
            console.log('💎 Plan:', this.results.plan.plan?.nombre || 'NO ENCONTRADO');
            console.log('📊 Estado:', this.results.plan.suscripcion?.estado || 'NO ENCONTRADO');
        }
        
        console.log('\n🎯 RECOMENDACIONES:');
        console.log('1. Verificar que el endpoint /auth/login incluya datos de restaurante y sucursal');
        console.log('2. Verificar que el endpoint /auth/refresh mantenga la misma estructura');
        console.log('3. Comprobar el contexto de auth en el frontend');
        console.log('4. Verificar que los datos se guarden correctamente en localStorage');
    }
}

// Ejecutar pruebas
if (require.main === module) {
    const tester = new ProductionHeaderTester();
    tester.runTests().catch(console.error);
}

module.exports = ProductionHeaderTester;
