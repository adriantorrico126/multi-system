const axios = require('axios');

// Configuración
const ADMIN_API_URL = 'http://localhost:4000/api';
const RESTAURANT_ID = 1; // Restaurante Principal
const NEW_PLAN_ID = 2; // Plan Profesional

// Credenciales de administrador
const ADMIN_CREDENTIALS = {
  email: 'admin@possolutions.com',
  password: 'admin123'
};

async function testPlanChange() {
  try {
    console.log('🧪 Iniciando prueba de cambio de plan...');
    
    // 1. Login como administrador
    console.log('1️⃣ Iniciando sesión como administrador...');
    const loginResponse = await axios.post(`${ADMIN_API_URL}/auth/login`, ADMIN_CREDENTIALS);
    const token = loginResponse.data.token;
    console.log('✅ Login exitoso');

    // 2. Obtener información actual del restaurante
    console.log('2️⃣ Obteniendo información actual del restaurante...');
    const currentSubscriptionResponse = await axios.get(
      `${ADMIN_API_URL}/planes/restaurante/${RESTAURANT_ID}/suscripcion`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const currentSubscription = currentSubscriptionResponse.data.data;
    console.log(`📊 Plan actual: ${currentSubscription.plan_nombre} (ID: ${currentSubscription.id_plan})`);

    // 3. Obtener estadísticas de uso actual
    console.log('3️⃣ Obteniendo estadísticas de uso...');
    const usageResponse = await axios.get(
      `${ADMIN_API_URL}/planes/restaurante/${RESTAURANT_ID}/uso`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const usage = usageResponse.data.data.uso;
    console.log('📈 Uso actual:');
    console.log(`   - Usuarios: ${usage.usuarios?.actual || 0}/${usage.usuarios?.limite || '∞'}`);
    console.log(`   - Sucursales: ${usage.sucursales?.actual || 0}/${usage.sucursales?.limite || '∞'}`);
    console.log(`   - Productos: ${usage.productos?.actual || 0}/${usage.productos?.limite || '∞'}`);

    // 4. Cambiar el plan
    console.log('4️⃣ Cambiando plan del restaurante...');
    const changePlanResponse = await axios.post(
      `${ADMIN_API_URL}/planes/restaurante/${RESTAURANT_ID}/cambiar-plan`,
      {
        id_plan_nuevo: NEW_PLAN_ID,
        motivo: 'Prueba de cambio de plan desde script de testing'
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    const newSubscription = changePlanResponse.data.data.suscripcion;
    const newPlan = changePlanResponse.data.data.plan;
    console.log(`✅ Plan cambiado exitosamente a: ${newPlan.nombre} (ID: ${newPlan.id_plan})`);

    // 5. Verificar el cambio en la base de datos
    console.log('5️⃣ Verificando cambio en la base de datos...');
    const verifyResponse = await axios.get(
      `${ADMIN_API_URL}/planes/restaurante/${RESTAURANT_ID}/suscripcion`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const verifiedSubscription = verifyResponse.data.data;
    console.log(`🔍 Verificación: Plan actual es ${verifiedSubscription.plan_nombre}`);

    // 6. Obtener nuevas estadísticas de uso
    console.log('6️⃣ Obteniendo nuevas estadísticas de uso...');
    const newUsageResponse = await axios.get(
      `${ADMIN_API_URL}/planes/restaurante/${RESTAURANT_ID}/uso`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const newUsage = newUsageResponse.data.data.uso;
    console.log('📈 Nuevo uso:');
    console.log(`   - Usuarios: ${newUsage.usuarios?.actual || 0}/${newUsage.usuarios?.limite || '∞'}`);
    console.log(`   - Sucursales: ${newUsage.sucursales?.actual || 0}/${newUsage.sucursales?.limite || '∞'}`);
    console.log(`   - Productos: ${newUsage.productos?.actual || 0}/${newUsage.productos?.limite || '∞'}`);

    console.log('\n🎉 Prueba completada exitosamente!');
    console.log('📡 Verifica en los logs del POS que se recibió la notificación de cambio de plan.');

  } catch (error) {
    console.error('❌ Error durante la prueba:', error.response?.data || error.message);
  }
}

// Ejecutar la prueba
testPlanChange();


