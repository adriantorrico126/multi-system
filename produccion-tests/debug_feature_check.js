const https = require('https');

process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

const debugFeatureCheck = async () => {
    console.log('🔍 DEBUGGING FEATURE CHECK LOGIC...\n');
    
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWRfdmVuZGVkb3IiOjEsInVzZXJuYW1lIjoiYWRtaW4iLCJyb2wiOiJhZG1pbiIsImlkX3N1Y3Vyc2FsIjo3LCJzdWN1cnNhbF9ub21icmUiOiJTdWN1cnNhbCBQcmluY2lwYWwiLCJpZF9yZXN0YXVyYW50ZSI6MSwicmVzdGF1cmFudGVfbm9tYnJlIjoiUmVzdGF1cmFudGUgUHJpbmNpcGFsIiwiaWF0IjoxNzg0OTExMzI1LCJleHAiOjE3ODQ5OTc3MjV9.hC5_TKoxRkUxDVxy9A7gVWzAZCuWUGk52XheDjqIDKs';
    
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    try {
        const endpoint = 'https://api.forkast.vip/api/v1/planes-sistema/restaurante/1/actual';
        const response = await makeRequest(endpoint, headers);
        
        if (response.statusCode === 200 && response.body) {
            const jsonBody = JSON.parse(response.body);
            
            if (jsonBody.success && jsonBody.data) {
                const data = jsonBody.data;
                
                console.log('🎯 SIMULANDO LÓGICA DEL FRONTEND:\n');
                
                // Simulate frontend hasFeature logic
                console.log('📋 Testing hasFeature("orders"):');
                console.log('─'.repeat(50));
                
                // Check different possible paths the frontend might use
                const paths = [
                    'data.plan.incluye_pos',
                    'data.funcionalidades.incluye_pos'
                ];
                
                paths.forEach(path => {
                    const value = getNestedValue(data, path);
                    console.log(`🔍 ${path}: ${value}`);
                    
                    if (path === 'data.plan.incluye_pos' || path === 'data.funcionalidades.incluye_pos') {
                        if (value === true) {
                            console.log(`   ✅ Correct - Orders access ENABLED`);
                        } else if (value === false) {
                            console.log(`   ❌ INCORRECT - Orders access DISABLED`);
                        } else {
                            console.log(`   ⚠️  UNDEFINED - ${value}`);
                        }
                    }
                });
                
                console.log('\n🎯 FRONTEND LOGIC SIMULATION:');
                console.log('─'.repeat(50));
                
                // Simulate the hasFeature function that frontend uses
                const hasFeatureOrders = (planInfo) => {
                    console.log('📋 hasFeature("orders") called');
                    console.log(`   planInfo: ${planInfo ? 'exists' : 'null'}`);
                    
                    if (!planInfo) {
                        console.log('   ❌ Result: false - no planInfo');
                        return false;
                    }
                    
                    if (!planInfo.plan) {
                        console.log('   ❌ Result: false - no planInfo.plan');
                        return false;
                    }
                    
                    if (!planInfo.suscripcion) {
                        console.log('   ❌ Result: false - no planInfo.suscripcion');
                        return false;
                    }
                    
                    // Check subscription status
                    if (planInfo.suscripcion.estado !== 'activa') {
                        console.log(`   ❌ Result: false - subscription not active (${planInfo.suscripcion.estado})`);
                        return false;
                    }
                    
                    // Check if includes POS
                    const includesOrders = planInfo.plan.incluye_pos === true;
                    console.log(`   🔍 planInfo.plan.incluye_pos: ${planInfo.plan.incluye_pos}`);
                    console.log(`   ✅ Result: ${includesOrders}`);
                    
                    return includesOrders;
                };
                
                // Test with actual data
                const testPlanInfo = {
                    plan: data.plan,
                    suscripcion: data.suscripcion,
                    funcionalidades: data.funcionalidades
                };
                
                const result = hasFeatureOrders(testPlanInfo);
                
                console.log('\n🎯 FINAL RESULT:');
                console.log('─'.repeat(50));
                if (result) {
                    console.log('✅ FEATURE CHECK: SUCCESS');
                    console.log('🎉 Orders access should be ENABLED');
                    console.log('');
                    console.log('💡 If frontend still shows restrictions:');
                    console.log('   → Check browser console for errors');
                    console.log('   → Verify API calls are completing successfully');
                    console.log('   → Check if component is re-rendering after data loads');
                } else {
                    console.log('❌ FEATURE CHECK: FAILED');
                    console.log('🚫 Orders access will be DISABLED');
                }
            }
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
};

const getNestedValue = (obj, path) => {
    return path.split('.').reduce((current, key) => {
        return current && current[key] !== undefined ? current[key] : undefined;
    }, { data: obj });
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

debugFeatureCheck().catch(console.error);

