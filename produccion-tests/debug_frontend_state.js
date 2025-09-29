const https = require('https');

process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

const debugFrontendState = async () => {
    console.log('🔍 DEBUGGING CURRENT FRONTEND STATE...\n');
    
    // Use the EXACT token from current session
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWRfdmVuZGVkb3IiOjEsInVzZXJuYW1lIjoiYWRtaW4iLCJyb2wiOiJhZG1pbiIsImlkX3N1Y3Vyc2FsIjo3LCJzdWN1cnNhbF9ub21icmUiOiJTdWN1cnNhbCBQcmluY2lwYWwiLCJpZF9yZXN0YXVyYW50ZSI6MSwicmVzdGF1cmFudGVfbm9tYnJlIjoiUmVzdGF1cmFudGUgUHJpbmNpcGFsIiwiaWF0IjoxNzg0OTExMzI1LCJleHAiOjE3ODQ5OTc3MjV9.hC5_TKoxRkUxDVxy9A7gVWzAZCuWUGk52XheDjqIDKs';
    
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    try {
        console.log('📡 Testing plan endpoint WITH CURRENT TOKEN...');
        const endpoint = 'https://api.forkast.vip/api/v1/planes-sistema/restaurante/1/actual';
        
        const response = await makeRequest(endpoint, headers);
        
        if (response.statusCode === 200 && response.body) {
            const jsonBody = JSON.parse(response.body);
            
            if (jsonBody.success && jsonBody.data) {
                const { plan, funcionalidades, suscripcion } = jsonBody.data;
                
                console.log('\n🎯 CURRENT PLAN STATUS:');
                console.log('─'.repeat(50));
                console.log(`📋 Plan Name: ${plan.nombre}`);
                console.log(`📋 Plan ID: ${plan.id_plan}`);
                console.log(`🔗 Subscription Status: ${suscripcion.estado}`);
                
                console.log('\n🎯 PLAN FEATURES STATUS:');
                console.log('─'.repeat(50));
                console.log(`✅ incluye_pos: ${plan.incluye_pos}`);
                console.log(`✅ incluye_promociones: ${plan.incluye_promociones}`);
                console.log(`✅ incluye_inventario_avanzado: ${plan.incluye_inventario_avanzado}`);
                console.log(`✅ incluye_reservas: ${plan.incluye_reservas}`);
                console.log(`✅ incluye_arqueo_caja: ${plan.incluye_arqueo_caja}`);
                
                console.log('\n🎯 FUNCIONALIDADES OBJECT:');
                console.log('─'.repeat(50));
                console.log(`⚙️ incluye_pos: ${funcionalidades.incluye_pos}`);
                console.log(`⚙️ incluye_promociones: ${funcionalidades.incluye_promociones}`);
                console.log(`⚙️ incluye_inventario_avanzado: ${funcionalidades.incluye_inventario_avanzado}`);
                
                console.log('\n🔍 ANALYSIS:');
                console.log('─'.repeat(50));
                if (plan.incluye_pos === true && funcionalidades.incluye_pos === true) {
                    console.log('✅ BACKEND STATUS: All features are ENABLED');
                    console.log('⚠️  FRONTEND STATUS: Still showing RESTRICTIONS');
                    console.log('');
                    console.log('🎯 SOLUTION: Frontend needs to:');
                    console.log('   1. Clear browser cache completely');
                    console.log('   2. Logout and login again');
                    console.log('   3. Wait for all API calls to complete');
                    console.log('');
                    console.log('🔧 Manual verification: Check browser console');
                    console.log('    Look for: hasFeature: orders -> incluye_pos = true');
                } else {
                    console.log('❌ PROBLEM: Features not enabled in database');
                }
            }
        } else {
            console.log(`❌ Error: ${response.statusCode}`);
            console.log('Response:', response.body?.substring(0, 200));
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

debugFrontendState().catch(console.error);

