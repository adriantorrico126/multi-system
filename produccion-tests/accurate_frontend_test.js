const https = require('https');

process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

const accurateFrontendTest = async () => {
    console.log('🔍 TESTING EXACTLY LIKE FRONTEND DOES...\n');
    
    // Using EXACT token from frontend logs
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWRfdmVuZGVkb3IiOjEsInVzZXJuYW1lIjoiYWRtaW4iLCJyb2wiOiJhZG1pbiIsImlkX3N1Y3Vyc2FsIjo3LCJzdWN1cnNhbF9ub21icmUiOiJTdWN1cnNhbCBQcmluY2lwYWwiLCJpZF9yZXN0YXVyYW50ZSI6MSwicmVzdGF1cmFudGVfbm9tYnJlIjoiUmVzdGF1cmFudGUgUHJpbmNpcGFsIiwiaWF0IjoxNzg0OTExMzI1LCJleHAiOjE3ODQ5OTc3MjV9.hC5_TKoxRkUxDVxy9A7gVWzAZCuWUGk52XheDjqIDKs';
    
    const endpoint = 'https://api.forkast.vip/api/v1/planes-sistema/restaurante/1/actual';
    
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; Node.js client)'
    };

    try {
        console.log(`📡 Request URL: ${endpoint}`);
        console.log(`📋 Authorization Header: Bearer ${token.substring(0, 20)}...`);
        console.log(`📋 Content-Type: ${headers['Content-Type']}`);
        console.log('');
        
        const response = await makeRequest(endpoint, headers);
        
        console.log(`📊 Response Status: ${response.statusCode}`);
        console.log(`📋 Response Headers:`, JSON.stringify(response.headers, null, 2));
        
        if (response.body) {
            if (response.statusCode === 200) {
                try {
                    const jsonBody = JSON.parse(response.body);
                    console.log('\n✅ SUCCESS RESPONSE:');
                    console.log(JSON.stringify(jsonBody, null, 2));
                    
                    if (jsonBody.success && jsonBody.data && jsonBody.data.plan) {
                        console.log('\n🎯 PLAN FEATURES STATUS:');
                        const plan = jsonBody.data.plan;
                        console.log(`   incluye_pos: ${plan.incluye_pos}`);
                        console.log(`   incluye_promociones: ${plan.incluye_promociones}`);
                        console.log(`   incluye_inventario_avanzado: ${plan.incluye_inventario_avanzado}`);
                        
                        if (plan.incluye_pos === true) {
                            console.log(`\n🎉 SUCCESS: Plan features are enabled!`);
                        }
                    }
                    
                } catch (e) {
                    console.log('❌ Error parsing JSON response:', e.message);
                    console.log('Raw response:', response.body.substring(0, 500));
                }
            } else if (response.statusCode === 500) {
                console.log('\n❌ SERVER ERROR 500:');
                try {
                    const errorBody = JSON.parse(response.body);
                    console.log('Error details:', errorBody);
                } catch (e) {
                    console.log('Raw error response:', response.body.substring(0, 500));
                }
            } else {
                console.log('\n⚠️ UNEXPECTED STATUS:');
                console.log('Raw response:', response.body.substring(0, 500));
            }
        } else {
            console.log('❌ No response body');
        }
        
    } catch (error) {
        console.log(`❌ Network Error: ${error.message}`);
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

accurateFrontendTest().catch(console.error);

