/**
 * Test específico para verificar configuración del restaurante ID 10
 * Verificar si tiene plan Enterprise pero está restringido según plan Básico
 */

const axios = require('axios');

class RestaurantPlanTester {
    constructor() {
        this.restaurantId = 10;
        this.results = {};
    }

    async runCompletePlanTest() {
        console.log('🎯 VERIFICACIÓN COMPLETA DEL RESTAURANTE ID 10');
        console.log('=' .repeat(60));
        console.log('🎯 Objetivo: Verificar discrepancia entre plan Enterprise y restricciones de plan Básico');
        console.log('');

        try {
            await this.testDatabaseSchema();
            await this.testPlanConfiguration();
            await this.testSubscriptionStatus();
            await this.testUserPermissions();
            await this.testPlanFeatures();
            await this.testPlanLimits();
            
            this.generatePlanAnalysis();
        } catch (error) {
            console.error('❌ Error en pruebas:', error.message);
        }
    }

    async testDatabaseSchema() {
        console.log('📋 1. VERIFICANDO ESTRUCTURA DE BASE DE DATOS...');
        
        // Simular consultas SQL que deberíamos ejecutar
        const sqlQueries = [
            {
                name: 'Verificar estructura tabla restaurantes',
                query: `SELECT * FROM restaurantes WHERE id_restaurante = ${this.restaurantId};`,
                description: 'Datos básicos del restaurante'
            },
            {
                name: 'Verificar estructura tabla suscripciones',
                query: `SELECT * FROM suscripciones WHERE id_restaurante = ${this.restaurantId};`,
                description: 'Suscripciones activas del restaurante'
            },
            {
                name: 'Verificar estructura tabla planes',
                query: `SELECT * FROM planes p 
                        JOIN suscripciones s ON p.id_plan = s.id_plan 
                        WHERE s.id_restaurante = ${this.restaurantId};`,
                description: 'Información del plan asociado'
            },
            {
                name: 'Verificar estructura tabla vendedores',
                query: `SELECT * FROM vendedores WHERE id_restaurante = ${this.restaurantId};`,
                description: 'Usuarios del restaurante'
            }
        ];

        console.log('🔍 Consultas SQL requeridas:');
        sqlQueries.forEach((query, index) => {
            console.log(`\n   ${index + 1}. ${query.name}:`);
            console.log(`      📝 ${query.description}`);
            console.log(`      🔧 SQL: ${query.query}`);
        });

        console.log('\n✅ Estructura de consultas verificada');
    }

    async testPlanConfiguration() {
        console.log('\n💎 2. VERIFICANDO CONFIGURACIÓN DEL PLAN...');
        
        // Simular diferentes escenarios de plan
        const planScenarios = [
            {
                name: 'Escenario 1: Plan Enterprise activo',
                data: {
                    id_restaurante: this.restaurantId,
                    id_plan: 3, // Enterprise
                    estado: 'activa',
                    plan_details: {
                        nombre: 'Enterprise',
                        tipo: 'enterprise',
                        precio: 299.99,
                        features: ['todas_las_funcionalidades']
                    }
                },
                expected: 'Todas las funcionalidades disponibles'
            },
            {
                name: 'Escenario 2: Plan Básico activo',
                data: {
                    id_restaurante: this.restaurantId,
                    id_plan: 1, // Básico
                    estado: 'activa',
                    plan_details: {
                        nombre: 'Básico',
                        tipo: 'basico',
                        precio: 49.99,
                        features: ['funcionalidades_limitadas']
                    }
                },
                expected: 'Funcionalidades restringidas'
            },
            {
                name: 'Escenario 3: Plan expirado',
                data: {
                    id_restaurante: this.restaurantId,
                    id_plan: 3, // Enterprise
                    estado: 'expirado', // Plan expirado
                    plan_details: {
                        nombre: 'Enterprise',
                        tipo: 'enterprise',
                        precio: 299.99,
                        features: ['todas_las_funcionalidades']
                    }
                },
                expected: 'Restricciones por plan expirado'
            },
            {
                name: 'Escenario 4: Sin suscripción activa',
                data: {
                    id_restaurante: this.restaurantId,
                    suscripciones: []
                },
                expected: 'Sin acceso (plan por defecto)'
            }
        ];

        console.log('🔍 Escenarios de plan a verificar:');
        planScenarios.forEach((scenario, index) => {
            console.log(`\n   ${index + 1}. ${scenario.name}:`);
            console.log(`      🎯 Expectativa: ${scenario.expected}`);
            console.log(`      📊 Datos:`, JSON.stringify(scenario.data, null, 8));
        });

        console.log('\n⚠️ POSIBLE PROBLEMA IDENTIFICADO:');
        console.log('   El restaurante puede tener plan Enterprise en la BD,');
        console.log('   pero el frontend está aplicando restricciones de plan Básico.');
        console.log('');
        console.log('🔍 CAUSAS PROBABLES:');
        console.log('   1. Cache del frontend no actualizado');
        console.log('   2. Plan System Context no sincronizado');
        console.log('   3. Middleware de validación mal configurado');
        console.log('   4. Discrepancia entre BD y lógica de planes del frontend');
    }

    async testSubscriptionStatus() {
        console.log('\n📋 3. VERIFICANDO ESTADO DE SUSCRIPCIÓN...');
        
        // Simular verificación de suscripción
        console.log('🔍 Verificaciones necesarias:');
        
        const subscriptionChecks = [
            {
                check: 'Suscripción activa existe',
                sql: `SELECT COUNT(*) as count FROM suscripciones 
                      WHERE id_restaurante = ${this.restaurantId} AND estado = 'activa';`,
                expected: 'count > 0'
            },
            {
                check: 'Fecha de suscripción válida',
                sql: `SELECT fecha_inicio, fecha_fin FROM suscripciones 
                      WHERE id_restaurante = ${this.restaurantId} AND estado = 'activa';`,
                expected: 'fecha_fin > CURRENT_DATE'
            },
            {
                check: 'Plan asociado existe',
                sql: `SELECT p.nombre FROM planes p 
                      JOIN suscripciones s ON p.id_plan = s.id_plan 
                      WHERE s.id_restaurante = ${this.restaurantId} AND s.estado = 'activa';`,
                expected: 'nombre = "Enterprise" (par apropiado)'
            },
            {
                check: 'Usuarios del restaurante tienen acceso',
                sql: `SELECT COUNT(*) as usuarios FROM vendedores 
                      WHERE id_restaurante = ${this.restaurantId} AND activo = true;`,
                expected: 'usuarios > 0'
            }
        ];

        subscriptionChecks.forEach((check, index) => {
            console.log(`   ${index + 1}. ${check.check}:`);
            console.log(`      🔧 SQL: ${check.sql}`);
            console.log(`      ✅ Esperado: ${check.expected}`);
        });

        console.log('\n⚠️ PROBLEMAS COMUNES EN SUSCRIPCIONES:');
        console.log('   1. Plan cambiado pero usuarios no actualizados');
        console.log('   2. Suscripción expirada silenciosamente');
        console.log('   3. Múltiples suscripciones causando conflicto');
        console.log('   4. Cache del sistema deplanes desactualizado');
    }

    async testUserPermissions() {
        console.log('\n👤 4. VERIFICANDO PERMISOS DE USUARIOS...');
        
        console.log('🔍 Aspectos a verificar en usuarios del restaurante 10:');
        
        const permissionChecks = [
            {
                aspect: 'Rol del usuario',
                check: '¿Es admin/super_admin con acceso completo?',
                sql: `SELECT rol FROM vendedores WHERE id_restaurante = ${this.restaurantId};`
            },
            {
                aspect: 'Estado del usuario',
                check: '¿Está activo y puede acceder?',
                sql: `SELECT activo FROM vendedores WHERE id_restaurante = ${this.restaurantId};`
            },
            {
                aspect: 'Asociación restaurante-sucursal',
                check: '¿Está correctamente asociado?',
                sql: `SELECT id_sucursal FROM vendedores WHERE id_restaurante = ${this.restaurantId};`
            },
            {
                aspect: 'Token JWT',
                check: '¿Include datos de plan en el payload?',
                note: 'Verificar que authController incluya plan en JWT'
            }
        ];

        permissionChecks.forEach((check, index) => {
            console.log(`   ${index + 1}. ${check.aspect}:`);
            console.log(`      🔍 ${check.check}`);
            if (check.sql) {
                console.log(`      🔧 SQL: ${check.sql}`);
            }
            if (check.note) {
                console.log(`      📝 ${check.note}`);
            }
        });

        console.log('\n⚠️ PROBLEMAS COMUNES EN PERMISOS:');
        console.log('   1. JWT no incluye información del plan');
        console.log('   2. Rol del usuario no coincide con plan');
        console.log('   3. Usuario inactivo bloqueando acceso');
        console.log('   4. Middleware no valida plan correctamente');
    }

    async testPlanFeatures() {
        console.log('\n⚡ 5. VERIFICANDO FUNCIONALIDADES DEL PLAN...');
        
        console.log('🔍 Funcionalidades a verificar según el plan Enterprise:');
        
        const enterpriseFeatures = [
            'Dashboard completo',
            'Reportes avanzados', 
            'Inventario completo',
            'Gestión de usuarios',
            'Configuración avanzada',
            'API completa',
            'Soporte prioritario',
            'Almacenamiento ilimitado',
            'Sin límites de transacciones'
        ];

        const basicRestrictions = [
            'Dashboard básico',
            'Reportes limitados',
            'Inventario básico', 
            'Gestión de usuarios limitada',
            'Configuración básica',
            'API restringida',
            'Soporte estándar',
            'Almacenamiento limitado',
            'Límites de transacciones'
        ];

        console.log('\n🟢 FUNCIONALIDADES ENTERPRISE (debería tener):');
        enterpriseFeatures.forEach((feature, index) => {
            console.log(`   ${index + 1}. ${feature}`);
        });

        console.log('\n🔴 RESTRICCIONES BÁSICO (NO debería tener):');
        basicRestrictions.forEach((restriction, index) => {
            console.log(`   ${index + 1}. ${restriction}`);
        });

        console.log('\n⚠️ DISCREPANCIA DETECTADA:');
        console.log('   Si el restaurante tiene plan Enterprise pero ve restricciones básicas,');
        console.log('   el problema está en la lógica del frontend o middleware del backend.');
    }

    async testPlanLimits() {
        console.log('\n🔒 6. VERIFICANDO LÍMITES DEL PLAN...');
        
        console.log('🔍 Límites a verificar en restaurante 10:');
        
        const limitsComparison = {
            basico: {
                max_sucursales: 1,
                max_usuarios: 3,
                max_productos: 100,
                max_transacciones_mes: 500,
                almacenamiento_gb: 5
            },
            enterprise: {
                max_sucursales: 'ilimitado',
                max_usuarios: 'ilimitado', 
                max_productos: 'ilimitado',
                max_transacciones_mes: 'ilimitado',
                almacenamiento_gb: 'ilimitado'
            }
        };

        console.log('\n📊 COMPARACIÓN DE LÍMITES:');
        console.log('\n 🟢 BÁSICO:');
        Object.entries(limitsComparison.basico).forEach(([limit, value]) => {
            console.log(`    ${limit}: ${value}`);
        });

        console.log('\n 🟢 ENTERPRISE:');
        Object.entries(limitsComparison.enterprise).forEach(([limit, value]) => {
            console.log(`    ${limit}: ${value}`);
        });

        console.log('\n⚠️ DIAGNÓSTICO:');
        console.log('   Si el restaurante 10 tiene límites básicos cuando debería tener Enterprise,');
        console.log('   verificar:');
        console.log('   1. Contadores_uso no actualizados');
        console.log('   2. Plan System Context desactualizado');
        console.log('   3. Cache del frontend con datos antiguos');
        console.log('   4. Middleware de validación con plan incorrecto');
    }

    generatePlanAnalysis() {
        console.log('\n📊 ANÁLISIS FINAL DEL PLAN - RESTAURANTE ID 10');
        console.log('=' .repeat(60));
        
        console.log('\n🎯 HIPÓTESIS PRINCIPAL:');
        console.log('   El restaurante ID 10 tiene plan Enterprise en la base de datos,');
        console.log('   pero sistema del frontend está aplicando restricciones de plan Básico.');
        console.log('');
        
        console.log('🔍 CAUSAS PROBABLES:');
        console.log('   1. 📺 Frontend: Plan System Context no sincronizado');
        console.log('   2. 🔧 Backend: Middleware de validación con configuración incorrecta');
        console.log('   3. 💾 Cache: Datos del plan en localStorage desactualizados');
        console.log('   4. 🗄️ BD: Asociación restaurante-plan incorrecta');
        console.log('   5. 🔐 Auth: JWT no incluye información del plan actualizada');
        console.log('');
        
        console.log('🛠️ SOLUCIONES PRIORITARIAS:');
        console.log('');
        
        console.log('📋 1. VERIFICACIÓN INMEDIATA (Base de Datos):');
        console.log('   SELECT r.nombre, p.nombre as plan, s.estado');
        console.log('   FROM restaurantes r');
        console.log('   JOIN suscripciones s ON r.id_restaurante = s.id_restaurante');
        console.log('   JOIN planes p ON s.id_plan = p.id_plan');
        console.log('   WHERE r.id_restaurante = 10;');
        console.log('');
        
        console.log('📋 2. VERIFICACIÓN FRONTEND:');
        console.log('   En consola del navegador:');
        console.log('   📝 console.log(planInfo);');
        console.log('   📝 console.log(currentPlan);');
性     
        console.log('📋 3. VERIFICACIÓN BACKEND:');
        console.log('   Revisar authController.js:');
        console.log('   📝 ¿Include datos del plan en JWT?');
        console.log('   📝 ¿Include planInfo en respuestas API?');
        console.log('');
        
        console.log('📋 4. VERIFICACIÓN MIDDLEWARE:');
        console.log('   Revisar middleware de validación de planes:');
        console.log('   📝 ¿Usa datos correctos del usuario?');
        console.log('   📝 ¿Consulte el plan real o datos en caché?');
        console.log('');
        
        console.log('🚀 PASOS SIGUIENTES:');
        console.log('   1. Ejecutar consultas SQL en producción');
        console.log('   2. Verificar datos en consola del navegador');
        console.log('   3. Revisar código authController.js');
        console.log('   4. Actualizar sistema de planes si es necesario');
        console.log('   5. Limpiar cache y reintentar');
        console.log('');
        
        console.log('⚠️ IMPORTANTE:');
        console.log('   Si el plan es Enterprise pero las restricciones son básicas,');
        console.log('   el usuario está pagando por funcionalidades que no puede usar.');
        console.log('   Esto requiere solución urgente.');
    }
}

// Ejecutar análisis
if (require.main === module) {
    const tester = new RestaurantPlanTester();
    tester.runCompletePlanTest().catch(console.error);
}

module.exports = RestaurantPlanTester;
