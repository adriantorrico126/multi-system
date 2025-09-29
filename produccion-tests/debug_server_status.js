const https = require('https');

process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

const debugServerStatus = async () => {
    console.log('🔍 DEBUGGING SERVER STATUS AFTER DB CHANGES...\n');
    
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWRfdmVuZGVkb3IiOjEsInVzZXJuYW1lIjoiYWRtaW4iLCJyb2wiOiJhZG1pbiIsImlkX3N1Y3Vyc2FsIjo3LCJzdWN1cnNhbF9ub21icmUiOiJTdWN1cnNhbCBQcmluY2lwYWwiLCJpZF9yZXN0YXVyYW50ZSI6MSwicmVzdGF1cmFudGVfbm9tYnJlIjoiUmVzdGF1cmFudGUgUHJpbmNpcGFsIiwiaWF0IjoxNzU5MTE2NDk0LCJleHAiOjE3NTkyMDI4OTR9.hpGfJOzEhWrdlRtUUXrxxb8kNbhrSNOQtoSAd8bFrnc';
    
    // Test multiple endpoints
    const endpoints = [
        'https://api.forkast.vip/api/v1/planes-sistema/restaurante/1/actual',
        'https://api.forkast.vip/api/v1/suscripciones-sistema/restaurante/1/activa',
        'https://api.forkast.vip/api/v1/contadores-sistema/restaurante/1/actual'
    ];
    
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    for (const endpoint of endpoints) {
        try {
            console.log(`📡 Testing: ${endpoint}`);
            const response = await makeRequest(endpoint, headers);
            
            if (response.statusCode === 500) {
                console.log(`❌ Status: ${response.statusCode} - SERVER ERROR`);
                
                if (response.body) {
                    try {
                        const jsonBody = JSON.parse(response.body);
                        console.log(`📋 Error Message: ${jsonBody.message || 'No message'}`);
                    } catch (e) {
                        console.log('📋 Raw Response:', response.body.substring(0, 200) + '...');
                    }
                }
            } else {
                console.log(`✅ Status: ${response.statusCode}`);
            }
            console.log('─'.repeat(50));
            
        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
            console.log('─'.repeat(50));
        }
        
        console.log(''); // Empty line between tests
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

debugServerStatus().catch(console.error);

