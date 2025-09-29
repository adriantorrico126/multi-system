const axios = require('axios');

async function simulateFrontendCall() {
    console.log('🔍 [SIMULATION] Simulando exactamente el comportamiento del frontend...\n');
    
    // Usar el mismo token que está en localStorage según los logs
    const token = 'eyJhbGciOiBhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWRfdmVuZGVkb3IiOjEsInVzZXJuYW1lIjoiYWRtaW4iLCJyb2wiOiJhZG1pbiIsImlkX3N1Y3Vyc2FsIjo3LCJzdWN1cnNhbF9ub21icmUiOiJTdWN1cnNhbCBQcmluY2lwYWwiLCJpZF9yZXN0YXVyYW50ZSI6MSwicmVzdGF1cmFudGVfbm9tYnJlIjoiUmVzdGF1cmFudGUgUHJpbmNpcGFsIiwiaWF0IjoxNzU5MTE3ODQ1LCJleHAiOjE3NTkyMDQyNDV9.BBpLXZY5xCSKFtV0dKzMxFBdUZwGvnFvK2i71nkR8pU';

    try {
        console.log('📋 1. Probando con configuración idéncia al frontend...');
        
        // Crear instancia de axios con configuración similar al frontend
        const api = axios.create({
            baseURL: 'https://api.forkast.vip/api/v1',
            headers: {
                'Content-Type': 'application/json',
            },
            timeout: 30000, // 30 segundos como el frontend
        });

        // Usar la misma URL que el frontend
        const response = await api.get('/planes-sistema/restaurante/1/actual', {
            headers: { 
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('✅ SUCCESS - Estado:', response.status);
        console.log('✅ SUCCESS - Datos:', JSON.stringify(response.data, null, 2));
        
        console.log('\n🎉 RESULTADO: ¡El endpoint funciona perfectamente!');
        console.log('🔧 PROBLEMA IDENTIFICADO: Es un issue específico del frontend');
        
    } catch (error) {
        console.error('❌ FAILED:', error.message);
        
        if (error.response) {
            console.error('📊 Status:', error.response.status);
            console.error('📊 Data:', JSON.stringify(error.response.data, null, 2));
            
            console.log('\n🔧 DIAGNÓSTICO:');
            
            if (error.response.status === 500) {
                console.log('❌ Error 500 - El servidor tiene problema real');
                console.log('📋 Acciones:');
                console.log('1. Verificar logs del servidor');
                console.log('2. Reiniciar el servidor');
                console.log('3. Verificar configuración de base de datos');
                
            } else if (error.response.status === 401) {
                console.log('❌ Error 401 - Token inválido o expirado');
                console.log('📋 Acciones:');
                console.log('1. Hacer nuevo login');
                console.log('2. Reiniciar sesión del usuario');
                
            } else if (error.response.status === 403) {
                console.log('❌ Error 403 - Permisos insuficientes');
                
            } else {
                console.log('❌ Error inesperado:', error.response.status);
            }
        }
        
        if (error.config) {
            console.log('📊 Config:', {
                url: error.config.url,
                method: error.config.method,
                headers: error.config.headers
            });
        }
    }
}

simulateFrontendCall();

