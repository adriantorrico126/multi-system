const https = require('https');

// Función para hacer peticiones HTTPS sin verificar certificados
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

const testPlanDetails = async () => {
    console.log('🔍 TESTING PLAN ENTERPRISE DETAILS...\n');
    
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWRfdmVuZGVkb3IiOjEsInVzZXJuYW1lIjoiYWRtaW4iLCJyb2wiOiJhZG1pbiIsImlkX3N1Y3Vyc2FsIjo3LCJzdWN1cnNhbF9ub21icmUiOiJTdWN1cnNhbCBQcmluY2lwYWwiLCJpZF9yZXN0YXVyYW50ZSI6MSwicmVzdGF1cmFudGVfbm9tYnJlIjoiUmVzdGF1cmFudGUgUHJpbmNpcGFsIiwiaWF0IjoxNzU5MTExMzI1LCJleHAiOjE3NTkxOTc3MjV9.hC5_TKoxRkUxDVxy9A7gVWzAZCuWUGk52XheDjqIDKs';
    
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
                
                console.log('\n🎯 PLAN ENTERPRISE DETAILS:');
                console.log('─'.repeat(50));
                
                if (plan) {
                    console.log('📋 PLAN INFO:');
                    console.log(`   ID: ${plan.id_plan}`);
                    console.log(`   Nombre: ${plan.nombre}`);
                    console.log(`   Descripción: ${plan.descripcion}`);
                    console.log(`   Precio Mensual: ${plan.precio_mensual}`);
                    console.log(`   Precio Anual: ${plan.precio_anual}`);
                }
                
                if (suscripcion) {
                    console.log('\n🔐 SUSCRIPCIÓN:');
                    console.log(`   Estado: ${suscripcion.estado}`);
                    console.log(`   Fecha Inicio: ${suscripcion.fecha_inicio}`);
                    console.log(`   Plan ID: ${suscripcion.id_plan}`);
                }
                
                if (funcionalidades) {
                    console.log('\n⚙️ CARACTERÍSTICAS DEL PLAN:');
                    console.log('─'.repeat(50));
                    
                    Object.entries(funcionalidades).forEach(([key, value]) => {
                        const status = value ? '✅' : '❌';
                        console.log(`   ${key}: ${status} (${value})`);
                    });
                    
                    console.log('\n🔍 ANÁLISIS CRÍTICO:');
                    console.log(`   incluye_pos: ${funcionalidades.incluye_pos ? '✅ HABILITADO' : '❌ DESHABILITADO'}`);
                    console.log(`   incluye_promociones: ${funcionalidades.incluye_promociones ? '✅ HABILITADO' : '❌ DESHABILITADO'}`);
                    
                    if (!funcionalidades.incluye_pos) {
                        console.log('\n⚠️ PROBLEMA IDENTIFICADO:');
                        console.log('   El plan Enterprise no tiene incluye_pos = true');
                        console.log('   Esto impide el acceso a pedidos/pedidos');
                    }
                }
                
            } else {
                console.log('❌ Error en respuesta:', jsonBody);
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

testPlanDetails().catch(console.error);

