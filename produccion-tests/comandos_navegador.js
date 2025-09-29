
// INSTRUCCIONES PARA EL NAVEGADOR (PRESIÓNAN F12 Y EJECUTE EN CONSOLE)

// 1. Verificar estado actual del localStorage
console.log('=== DIAGNÓSTICO HEADER ===');
console.log('User actual:', JSON.parse(localStorage.getItem('currentUser')) || 'VACÍO');
console.log('Token:', localStorage.getItem('token') ? 'EXISTE' : 'NO EXISTE');
console.log('Plan info:', JSON.parse(localStorage.getItem('currentPlanInfo')) || 'VACÍO');

// 2. Hacer llama manual al refresh token
(async function testRefreshAPI() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('❌ No hay token disponible');
            return;
        }
        
        console.log('🔍 Probando API refresh token...');
        const response = await fetch('/api/v1/auth/refresh', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        console.log('✅ Respuesta del refresh token:', data);
        
        if (data.user?.restaurante?.nombre) {
            console.log('✅ Datos de restaurante encontrados en respuesta');
            console.log('   Restaurante:', data.user.restaurante.nombre);
            console.log('   Sucursal:', data.user.sucursal?.nombre);
        } else {
            console.log('❌ NO se encontraron datos de restaurante en la respuesta');
            console.log('   Datos recibidos:', data.user);
        }
        
    } catch (error) {
        console.error('❌ Error en API refresh:', error);
    }
})();

// 3. Verificar después del refresh
setTimeout(() => {
    console.log('=== VERIFICACIÓN DESPUÉS DEL REFRESH ===');
    console.log('User actualizado:', JSON.parse(localStorage.getItem('currentUser')));
    console.log('Plan actualizado:', JSON.parse(localStorage.getItem('currentPlanInfo')));
}, 2000);
