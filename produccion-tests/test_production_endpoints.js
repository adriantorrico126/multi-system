const https = require('https');

// Función para hacer peticiones HTTPS sin verificar certificados
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

const testEndpoints = async () => {
    console.log('🔍 TESTING PRODUCTION ENDPOINTS...\n');
    
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWRfdmVuZGVkb3IiOjEsInVzZXJuYW1lIjoiYWRtaW4iLCJyb2wiOiJhZG1pbiIsImlkX3N1Y3Vyc2FsIjo3LCJzdWN1cnNhbF9ub21icmUiOiJTdWN1cnNhbCBQcmluY2lwYWwiLCJpZF9yZXN0YXVyYW50ZSI6MSwicmVzdGF1cmFudGVfbm9tYnJlIjoiUmVzdGF1cmFudGUgUHJpbmNpcGFsIiwiaWF0IjoxNzU5MTExMzI1LCJleHAiOjE3NTkxOTc3MjV9.hC5_TKoxRkUxDVxy9A7gVWzAZCuWUGk52XheDjqIDKs';
    
    const endpoints = [
        'https://api.forkast.vip/api/v1/planes-sistema/restaurante/1/actual',
        'https://api.forkast.vip/api/v1/contadores-sistema/restaurante/1/actual',
        'https://api.forkast.vip/api/v1/suscripciones-sistema/restaurante/1/activa'
    ];
    
   const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    for (const endpoint of endpoints) {
        try {
            console.log(`📡 Testing: ${endpoint}`);
            
            const response = await makeRequest(endpoint, headers);
            console.log(`✅ Status: ${response.statusCode}`);
            
            if (response.body) {
                const jsonBody = JSON.parse(response.body);
                console.log(`📊 Response:`, {
                    success: jsonBody.success,
                    message: jsonBody.message?.substring(0, 100),
                    data: jsonBody.data ? Object.keys(jsonBody.data) : 'N/A'
                });
            }
            
        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
        }
        
        console.log('─'.repeat(80));
    }
    
    console.log('\n🎯 ANALYSIS:');
    console.log('✅ If planes endpoint returns 200 → Server restarted successfully');
    console.log('❌ If planes endpoint returns 500 → Server still running old code');
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

testEndpoints().catch(console.error);

