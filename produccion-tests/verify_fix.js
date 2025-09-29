const https = require('https');

// Función para hacer peticiones HTTPS sin verificar certificados
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

const verifyEnterprisePlanFix = async () => {
    console.log('🔍 VERIFYING ENTERPRISE PLAN FIX...\n');
    
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
            
            if (jsonBody.success && jsonBody.data && jsonBody.data.funcionalidades) {
                const funcionalidades = jsonBody.data.funcionalidades;
                
                console.log('\n🎯 VERIFICATION RESULTS:');
                console.log('─'.repeat(50));
                
                const criticalFeatures = {
                    'incluye_pos': '✅ ACCESS TO ORDERS',
                    'incluye_promociones': '✅ PROMOTIONS ACCESS',
                    'incluye_inventario_avanzado': '✅ ADVANCED INVENTORY',
                    'incluye_reservas': '✅ RESERVATIONS',
                    'incluye_arqueo_caja': '✅ CASH REGISTER'
                };
                
                console.log('🔍 CRITICAL FEATURES STATUS:');
                let allGood = true;
                
                Object.entries(criticalFeatures).forEach(([key, description]) => {
                    const status = funcionalidades[key] ? '✅' : '❌';
                    console.log(`   ${key}: ${status} ${description}`);
                    if (!funcionalidades[key]) {
                        allGood = false;
                    }
                });
                
                console.log('\n🏆 FINAL RESULT:');
                if (allGood) {
                    console.log('✅ ALL CRITICAL FEATURES ENABLED!');
                    console.log('🎉 Enterprise plan is now fully functional!');
                    console.log('\n🔄 NEXT STEPS FOR USER:');
                    console.log('1. Refresh the web application');
                    console.log('2. The Header should now show "Enterprise" with full access');
                    console.log('3. Check console: "Acceso a pedidos (orders): true"');
                } else {
                    console.log('⚠️ Some features still need to be enabled');
                    console.log('Check the individual status above');
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

verifyEnterprisePlanFix().catch(console.error);

