// Script para verificar variables de entorno en el navegador
// Ejecutar en la consola del navegador en https://pos.forkast.vip

console.log('🔍 VERIFICANDO VARIABLES DE ENTORNO EN FRONTEND POS');
console.log('==================================================');

// Verificar si estamos en el frontend POS
if (window.location.hostname === 'pos.forkast.vip') {
    console.log('✅ Estamos en el frontend POS correcto');
} else {
    console.log('⚠️ No estamos en pos.forkast.vip');
}

// Verificar variables de entorno (si están disponibles)
console.log('\n📊 VARIABLES DE ENTORNO:');
console.log('VITE_BACKEND_URL:', import.meta?.env?.VITE_BACKEND_URL || 'NO DISPONIBLE');
console.log('VITE_PRINT_SERVER_URL:', import.meta?.env?.VITE_PRINT_SERVER_URL || 'NO DISPONIBLE');
console.log('NODE_ENV:', import.meta?.env?.NODE_ENV || 'NO DISPONIBLE');

// Construir URLs de prueba
const backendUrl = import.meta?.env?.VITE_BACKEND_URL || 'http://localhost:3000/api/v1';
console.log('\n🔗 URLS CONSTRUIDAS:');
console.log('Backend base:', backendUrl);
console.log('Login URL:', `${backendUrl}/auth/login`);
console.log('Productos URL:', `${backendUrl}/productos`);
console.log('Dashboard URL:', `${backendUrl}/dashboard/stats`);

// Verificar si la URL está correcta
const expectedUrl = 'https://api.forkast.vip/api/v1';
if (backendUrl === expectedUrl) {
    console.log('\n✅ URL CORRECTA:', backendUrl);
} else {
    console.log('\n❌ URL INCORRECTA:');
    console.log('Esperada:', expectedUrl);
    console.log('Actual:', backendUrl);
}

// Función para probar conexión al backend
async function testBackendConnection() {
    console.log('\n🧪 PROBANDO CONEXIÓN AL BACKEND...');
    
    try {
        // Probar endpoint de health
        const healthUrl = backendUrl.replace('/api/v1', '') + '/health';
        console.log('Probando health endpoint:', healthUrl);
        
        const response = await fetch(healthUrl);
        console.log('Status:', response.status);
        console.log('Headers:', Object.fromEntries(response.headers.entries()));
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Conexión exitosa:', data);
        } else {
            console.log('❌ Error HTTP:', response.status);
        }
    } catch (error) {
        console.log('❌ Error de conexión:', error.message);
    }
}

// Función para probar login endpoint
async function testLoginEndpoint() {
    console.log('\n🔐 PROBANDO ENDPOINT DE LOGIN...');
    
    try {
        const loginUrl = `${backendUrl}/auth/login`;
        console.log('Login URL:', loginUrl);
        
        // Solo verificar que el endpoint responde (sin enviar credenciales)
        const response = await fetch(loginUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: 'test',
                password: 'test'
            })
        });
        
        console.log('Status:', response.status);
        console.log('Headers:', Object.fromEntries(response.headers.entries()));
        
        if (response.status === 401) {
            console.log('✅ Endpoint responde (401 es esperado sin credenciales válidas)');
        } else {
            console.log('⚠️ Status inesperado:', response.status);
        }
    } catch (error) {
        console.log('❌ Error de conexión:', error.message);
    }
}

// Función para verificar CORS
async function testCORS() {
    console.log('\n🌐 PROBANDO CORS...');
    
    try {
        const testUrl = `${backendUrl}/auth/login`;
        console.log('Probando CORS en:', testUrl);
        
        const response = await fetch(testUrl, {
            method: 'OPTIONS'
        });
        
        console.log('Status:', response.status);
        console.log('CORS Headers:');
        console.log('Access-Control-Allow-Origin:', response.headers.get('Access-Control-Allow-Origin'));
        console.log('Access-Control-Allow-Methods:', response.headers.get('Access-Control-Allow-Methods'));
        console.log('Access-Control-Allow-Headers:', response.headers.get('Access-Control-Allow-Headers'));
        
        if (response.headers.get('Access-Control-Allow-Origin')) {
            console.log('✅ CORS configurado correctamente');
        } else {
            console.log('❌ CORS no configurado');
        }
    } catch (error) {
        console.log('❌ Error probando CORS:', error.message);
    }
}

// Ejecutar todas las pruebas
console.log('\n🚀 EJECUTANDO PRUEBAS...');
console.log('Para ejecutar las pruebas manualmente, usa:');
console.log('testBackendConnection()');
console.log('testLoginEndpoint()');
console.log('testCORS()');

// Exportar funciones para uso manual
window.testBackendConnection = testBackendConnection;
window.testLoginEndpoint = testLoginEndpoint;
window.testCORS = testCORS;

console.log('\n✨ Script de verificación cargado. Usa las funciones en la consola.');
