const https = require('https');

process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

const debugPlanStructure = async () => {
    console.log('🔍 DEBUGGING PLAN STRUCTURE...\n');
    
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWRfdmVuZGVkb3IiOjEsInVzZXJuYW1lIjoiYWRtaW4iLCJyb2wiOiJhZG2pbiIsImlkX3N1Y3Vyc2FsIjo3LCJzdWN1cnNhbF9ub21icmUiOiJTdWN1cnNhbCBQcmluY2lwYWwiLCJpZF9yZXN0YXVyYW50ZSI6MSwicmVzdGF1cmFudGVfbm9tYnJlIjoiUmVzdGF1cmFudGUgUHJpbmNpcGFsIiwiaWF0IjoxNzU5MTExMzI1LCJleHAiOjE3NTkxOTc3MjV9.hC5_TKoxRkUxDVxy9A7gVWzAZCuWUGk52XheDjqIDKs';
    
    const endpoint = 'https://api.forkast.vip/api/v1/planes-sistema/restaurante/1/actual';
    
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    try {
        console.log(`📡 Testing: ${endpoint}`);
        
        const response = await makeRequest(endpoint, headers);
        console.log(`✅ Status: ${response.statusCode}`);
        
        if (response.body) {
            const jsonBody = JSON.parse(response.body);
            
            if (jsonBody.success && jsonBody.data) {
                const { plan, suscripcion, funcionalidades } = jsonBody.data;
                
                console.log('\n🎯 PLAN OBJECT STRUCTURE:');
                console.log('─'.repeat(50));
                if (plan) {
                    console.log('📋 plan.incluye_pos:', plan.incluye_pos);
                    console.log('📋 plan.incluye_promociones:', plan.incluye_promociones);
                    console.log('📋 plan.incluye_inventario_avanzado:', plan.incluye_inventario_avanzado);
                }
                
                console.log('\n🎯 FUNCIONALIDADES OBJECT:');
                console.log('─'.repeat(50));
                if (funcionalidades) {
                    console.log('⚙️ funcionalidades.incluye_pos:', funcionalidades.incluye_pos);
                    console.log('⚙️ funcionalidades.incluye_promociones:', funcionalidades.incluye_promociones);
                    console.log('⚙️ funcionalidades.incluye_inventario_avanzado:', funcionalidades.incluye_inventario_avanzado);
                }
                
                console.log('\n🔍 ANÁLISIS:');
                console.log('─'.repeat(50));
                if (plan && funcionalidades) {
                    if (plan.incluye_pos === false && funcionalidades.incluye_pos === true) {
                        console.log('⚠️ PROBLEMA IDENTIFICADO:');
                        console.log('  - El objeto "plan" tiene incluye_pos = false');
                        console.log('  - El objeto "funcionalidades" tiene incluye_pos = true');
                        console.log('⚠️ La aplicación está leyendo del objeto "plan" en lugar de "funcionalidades"');
                        
                        console.log('\n💡 Configuración correcta:');
                        console.log('  ✅ funcionalidades.incluye_pos = true (correcto)');
                        console.log('  ❌ plan.incluye_pos = false (incorrecto - fuente del problema)');
                    }
                }
                
            } else {
                console.log('❌ Unexpected response format:', jsonBody);
            }
        }
        
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
};

const makeRequest = (url, headers) => {
    return new Promise((resolve, reject) => {
        const req = https.request(url, {
            method: 'GET',
            headers: headers
        }, (res) => {
            let body = '';
            
            res.on('data', (chunk) => {
                body += chunk;
            });
            
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body: body
                });
            });
        });
        
        req.on('error', (error) => {
            reject(error);
        });
        
        req.end();
    });
};

debugPlanStructure().catch(console.error);

