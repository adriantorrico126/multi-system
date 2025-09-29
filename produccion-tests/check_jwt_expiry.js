const https = require('https');

process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

const checkJWTExpiry = () => {
    console.log('🔍 CHECKING JWT EXPIRY...\n');
    
    // Token from frontend logs
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWRfdmVuZGVkb3IiOjEsInVzZXJuYW1lIjoiYWRtaW4iLCJyb2wiOiJhZG1pbiIsImlkX3N1Y3Vyc2FsIjo3LCJzdWN1cnNhbF9ub21icmUiOiJTdWN1cnNhbCBQcmluY2lwYWwiLCJpZF9yZXN0YXVyYW50ZSI6MSwicmVzdGF1cmFudGVfbm9tYnJlIjoiUmVzdGF1cmFudGUgUHJpbmNpcGFsIiwiaWF0IjoxNzU5MTE2NDk0LCJleHAiOjE3NTkyMDI4OTR9.hpGfJOzEhWrdlRtUUXrxxb8kNbhrSNOQtoSAd8bFrnc';
    
    // Decode JWT payload
    try {
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        
        console.log('📋 JWT PAYLOAD:');
        console.log(`   ID: ${payload.id}`);
        console.log(`   Username: ${payload.username}`);
        console.log(`   Role: ${payload.rol}`);
        console.log(`   Restaurant ID: ${payload.id_restaurante}`);
        
        const now = Math.floor(Date.now() / 1000);
        const iat = payload.iat;
        const exp = payload.exp;
        
        console.log('\n🕒 TIMING INFO:');
        console.log(`   Issued At (iat): ${iat} - ${new Date(iat * 1000).toLocaleString()}`);
        console.log(`   Expires At (exp): ${exp} - ${new Date(exp * 1000).toLocaleString()}`);
        console.log(`   Current Time: ${now} - ${new Date().toLocaleString()}`);
        
        const timeUntilExpiry = exp - now;
        const minutesUntilExpiry = Math.floor(timeUntilExpiry / 60);
        
        if (timeUntilExpiry > 0) {
            console.log(`   ⏰ Time until expiry: ${minutesUntilExpiry} minutes`);
            console.log('   ✅ Token is still valid');
        } else {
            console.log(`   ❌ Token EXPIRED ${Math.abs(minutesUntilExpiry)} minutes ago`);
            console.log('   🔧 SOLUTION: User needs to logout and login again');
        }
        
    } catch (error) {
        console.log('❌ Error decoding JWT:', error.message);
    }
};

checkJWTExpiry();

