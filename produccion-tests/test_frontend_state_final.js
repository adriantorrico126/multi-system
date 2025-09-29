const axios = require('axios');

async function testFrontendState() {
    console.log('🔍 [DIAGNOSTIC] Verificando estado actual del frontend...\n');
    
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWRfdmVuZGVkb3IiOjEsInVzZXJuYW1lIjoiYWRtaW4iLCJyb2wiOiJhZG1pbiIsImlkX3N1Y3Vyc2FsIjo3LCJzdWN1cnNhbF9ub21icmUiOiJTdWN1cnNhbCBQcmluY2lwYWwiLCJpZF9yZXN0YXVyYW50ZSI6MSwicmVzdGF1cmFudGVfbm9tYnJlIjoiUmVzdGF1cmFudGUgUHJpbmNpcGFsIiwiaWF0IjoxNzU5MTE3MzUzLCJleHAiOjE3NTkyMDM3NTN9.b1o4x8pQ1Acc3IL69uvv1YJmYRXDwZcCb5s9S7ydh9M';

    try {
        // 1. Verificar plan actual
        console.log('📋 1. Verificando plan actual...');
        const planResponse = await axios.get('https://api.forkast.vip/api/v1/planes-sistema/restaurante/1/actual', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        console.log('✅ Plan Response:', planResponse.data.success);
        console.log('📊 Plan Data:', JSON.stringify(planResponse.data.data, null, 2));
        
        const planData = planResponse.data.data;
        console.log('\n🔍 Feature Analysis:');
        console.log(`- Plan Name: ${planData.plan?.nombre}`);
        console.log(`- incluye_pos: ${planData.funcionalidades?.incluye_pos}`);
        console.log(`- incluye_promociones: ${planData.funcionalidades?.incluye_promociones}`);
        console.log(`- incluye_inventario_avanzado: ${planData.funcionalidades?.incluye_inventario_avanzado}`);
        
        // 2. Verificar suscripción
        console.log('\n📋 2. Verificando suscripción...');
        const subResponse = await axios.get('https://api.forkast.vip/api/v1/suscripciones-sistema/restaurante/1/activa', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        console.log('✅ Subscription Response:', subResponse.data.success);
        console.log('📊 Subscription Data:', JSON.stringify(subResponse.data.data, null, 2));
        
        // 3. Test hasFeature simulation
        console.log('\n📋 3. Simulando hasFeature logic...');
        console.log(`🔍 Testing 'orders' -> incluye_pos: ${planData.funcionalidades?.incluye_pos}`);
        console.log(`🔍 Testing 'incluye_promociones' -> incluye_promociones: ${planData.funcionalidades?.incluye_promociones}`);
        
        // 4. Análisis final
        console.log('\n📋 4. Análisis Final:');
        const hasPosAccess = planData.funcionalidades?.incluye_pos === true;
        const hasPromoAccess = planData.funcionalidades?.incluye_promociones === true;
        
        console.log(`✅ Acceso a POS: ${hasPosAccess ? 'PERMITIDO' : 'BLOQUEADO'}`);
        console.log(`✅ Acceso a Promociones: ${hasPromoAccess ? 'PERMITIDO' : 'BLOQUEADO'}`);
        
        if (hasPosAccess && hasPromoAccess) {
            console.log('\n🎉 RESULTADO: Backend está CORRECTO - problema está en frontend');
            console.log('🔧 Acciones recomendadas:');
            console.log('   1. Limpiar localStorage: localStorage.clear()');
            console.log('   2. Refrescar página con Ctrl+F5');
            console.log('   3. Verificar si planInfo se actualiza en el frontend');
        } else {
            console.log('\n❌ RESULTADO: Backend tiene problemas - revisar base de datos');
        }
        
    } catch (error) {
        console.error('❌ Error en test:', error.message);
        if (error.response) {
            console.error('📊 Response Data:', error.response.data);
        }
    }
}

testFrontendState();
