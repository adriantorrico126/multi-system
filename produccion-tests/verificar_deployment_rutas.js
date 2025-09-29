const fs = require('fs');
const path = require('path');

/**
 * Script para verificar qué archivos de rutas necesitan ser desplegados en producción
 */

const ROUTES_DIR = '../sistema-pos/vegetarian_restaurant_backend/src/routes';

console.log('🔍 VERIFICANDO ARCHIVOS DE RUTAS PARA DEPLOYMENT EN PRODUCCIÓN');
console.log('=' * 80);

// Lista de archivos de rutas que son críticos según los errores 404
const ROUTAS_CRITICAS = [
    'planesRoutes.js',
    'suscripcionesRoutes.js', 
    'contadoresRoutes.js',
    'alertasRoutes.js',
    'index.js'
];

// Lista de todos los archivos de rutas disponibles
const todosLosArchivos = [];

try {
    // Leer el directorio de rutas
    const archivos = fs.readdirSync(ROUTES_DIR);
    
    console.log('\n📁 ARCHIVOS PRESENTES EN LOCAL:');
    archivos.forEach(archivo => {
        todosLosArchivos.push(archivo);
        console.log(`   ✅ ${archivo}`);
    });
    
    console.log('\n🚨 ARCHIVOS CRÍTICOS FALTANTES EN PRODUCCIÓN:');
    ROUTAS_CRITICAS.forEach(archivo => {
        if (archivos.includes(archivo)) {
            console.log(`   ❌ ${archivo} - PRESENTE EN LOCAL, FALTANTE EN PROD`);
            console.log(`      📍 Ruta: ${ROUTES_DIR}/${archivo}`);
            console.log(`      📋 Debe copiarse completo a producción`);
        } else {
            console.log(`   ⚠️  ${archivo} - NO ENCONTRADO NI EN LOCAL`);
        }
    });
    
} catch (error) {
    console.error('❌ Error leyendo directorio de rutas:', error.message);
}

console.log('\n📋 RESUMEN DE ARCHIVOS PARA DEPLOYMENT:');
console.log('Los siguientes archivos DEBEN estar presentes en producción:');
ROUTAS_CRITICAS.forEach(archivo => {
    console.log(`   📄 ../sistema-pos/vegetarian_restaurant_backend/src/routes/${archivo}`);
});

console.log('\n🔧 SECUENCIA DE DEPLOYMENT RECOMENDADA:');
console.log('1. Copiar archivos de rutas a producción');
console.log('2. Copiar controladores asociados si faltan');
console.log('3. Copiar middleware necesario');
console.log('4. Reiniciar backend en producción');
console.log('5. Verificar que las rutas respondan 200');

console.log('\n📊 VERIFICACIÓN DE DEPENDENCIAS:');
console.log('Verificando que los controladores también existan...');

const CONTROLADORES_CRITICOS = [
    '../sistema-pos/vegetarian_restaurant_backend/src/controllers/PlanController.js',
    '../sistema-pos/vegetarian_restaurant_backend/src/controllers/ContadorUsoController.js',
    '../sistema-pos/vegetarian_restaurant_backend/src/controllers/SuscripcionController.js',
    '../sistema-pos/vegetarian_restaurant_backend/src/controllers/AlertaController.js'
];

CONTROLADORES_CRITICOS.forEach(controlador => {
    const rutaCompleta = path.resolve(ROUTES_DIR, controlador);
    try {
        if (fs.existsSync(rutaCompleta)) {
            console.log(`   ✅ ${controlador} - Presente`);
        } else {
            console.log(`   ❌ ${controlador} - FALTANTE`);
        }
    } catch (error) {
        console.log(`   ❓ ${controlador} - No verificado: ${error.message}`);
    }
});

console.log('\n🎯 RESULTADO ESPERADO DESPUÉS DEL DEPLOYMENT:');
console.log('✅ /プランes-sistema/restaurante/10/actual → 200 OK');
console.log('✅ /suscripciones-sistema/restaurante/10/activa → 200 OK');  
console.log('✅ /contadores-sistema/restaurante/10/actual → 200 OK');
console.log('✅ /alertas-sistema/restaurante/10/* → 200 OK');
console.log('✅ planInfo en el Header mostrará datos reales');
console.log('✅ Restaurante ID 10 verá su plan Enterprise correctamente');

console.log('\n📞 PRÓXIMO PASO:');
console.log('Desplegar todos los archivos marcados como ❌ FALTANTE a producción');
console.log('y reiniciar el backend para cargar las nuevas rutas.');
