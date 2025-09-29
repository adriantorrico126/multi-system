const https = require('https');

// Función para hacer peticiones HTTPS sin verificar certificados
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

const updateEnterprisePlanFeatures = async () => {
    console.log('🚀 UPDATING ENTERPRISE PLAN FEATURES...\n');
    
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWRfdmVuZGVkb3IiOjEsInVzZXJuYW1lIjoiYWRtaW4iLCJyb2wiOiJhZG1pbiIsImlkX3N1Y3Vyc2FsIjo3LCJzdWN1cnNhbF9ub21icmUiOiJTdWN1cnNhbCBQcmluY2lwYWwiLCJpZF9yZXN0YXVyYW50ZSI6MSwicmVzdGF1cmFudGVfbm9tYnJlIjoiUmVzdGF1cmFudGUgUHJpbmNpcGFsIiwiaWF0IjoxNzU5MTExMzI1LCJleHAiOjE3NTkxOTc3MjV9.hC5_TKoxRkUxDVxy9A7gVWzAZCuWUGk52XheDjqIDKs';
    
    const endpoint = 'https://api.forkast.vip/api/v1/planes-system/plan/4/update-features';
    
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    // Características que deben estar habilitadas para Enterprise
    const enterpriseFeatures = {
        incluye_pos: true,
        incluye_inventario_basico: true,
        incluye_inventario_avanzado: true,
        incluye_promociones: true,
        incluye_reservas: true,
        incluye_arqueo_caja: true,
        incluye_egresos: true,
        incluye_egresos_avanzados: true,
        incluye_reportes_avanzados: true,
        incluye_analytics: true,
        incluye_delivery: true,
        incluye_impresion: true,
        incluye_soporte_24h: true,
        incluye_api: true,
        incluye_white_label: true
    };

    const requestData = JSON.stringify(enterpriseFeatures);

    try {
        console.log(`📡 Updating plan features at: ${endpoint}`);
        console.log('🎯 Enterprise features to enable:');
        Object.entries(enterpriseFeatures).forEach(([key, value]) => {
            console.log(`   ${key}: ✅`);
        });
        
        const response = await makeRequest(endpoint, headers, requestData);
        console.log(`✅ Status: ${response.statusCode}`);
        
        if (response.body) {
            const jsonBody = JSON.parse(response.body);
            console.log('📊 Response:', jsonBody);
            
            if (jsonBody.success) {
                console.log('\n🎉 SUCCESS! Enterprise plan updated successfully!');
                console.log('✅ All features enabled for Enterprise plan');
                console.log('\n🔄 Next steps:');
                console.log('1. Refresh the web application');
                console.log('2. Check that "Acceso a pedidos" now returns true');
                console.log('3. Verify Header shows plan features correctly');
            } else {
                console.log('❌ Update failed:', jsonBody.message);
            }
        }
        
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
        console.log('\n💡 This might be because:');
        console.log('- The endpoint doesn\'t exist yet');
        console.log('- You need admin privileges');
        console.log('- We need to create the endpoint first');
        
        console.log('\n🔧 Alternative approach: Direct database update');
        await suggestDatabaseUpdate();
    }
};

const suggestDatabaseUpdate = async () => {
    console.log('\n📝 SQL COMMAND TO FIX ENTERPRISE PLAN:');
    console.log('─'.repeat(80));
    console.log(`
UPDATE planes SET 
    incluye_pos = true,
    incluye_inventario_basico = true,
    incluye_inventario_avanzado = true,
    incluye_promociones = true,
    incluye_reservas = true,
    incluye_arqueo_caja = true,
    incluye_egresos = true,
    incluye_egresos_avanzados = true
WHERE id_plan = 4 AND nombre = 'enterprise';
    `);
    console.log('─'.repeat(80));
    console.log('Execute this SQL in your production database to enable Enterprise features.');
};

const makeRequest = (url, headers, data = null) => {
    return new Promise((resolve, reject) => {
        const options = {
            method: data ? 'PUT' : 'GET',
            headers: headers
        };
        
        const req = https.request(url, options, (res) => {
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
        
        if (data) {
            req.write(data);
        }
        
        req.end();
    });
};

updateEnterprisePlanFeatures().catch(console.error);

