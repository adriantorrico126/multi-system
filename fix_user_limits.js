const axios = require('axios');

// Configuración
const POS_API_URL = 'http://localhost:3000/api/v1';
const ADMIN_API_URL = 'http://localhost:4000/api';

// Credenciales de prueba
const POS_CREDENTIALS = {
  username: 'admin',
  password: 'admin123'
};

const ADMIN_CREDENTIALS = {
  email: 'admin@possolutions.com',
  password: 'admin123'
};

let posToken = '';
let adminToken = '';

/**
 * Función para hacer login en el POS
 */
async function loginPOS() {
  try {
    console.log('🔐 Iniciando sesión en POS...');
    const response = await axios.post(`${POS_API_URL}/auth/login`, POS_CREDENTIALS);
    posToken = response.data.token;
    console.log('✅ Login POS exitoso');
    return true;
  } catch (error) {
    console.error('❌ Error en login POS:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Función para hacer login en Admin Console
 */
async function loginAdmin() {
  try {
    console.log('🔐 Iniciando sesión en Admin Console...');
    const response = await axios.post(`${ADMIN_API_URL}/auth/login`, ADMIN_CREDENTIALS);
    adminToken = response.data.token;
    console.log('✅ Login Admin exitoso');
    return true;
  } catch (error) {
    console.error('❌ Error en login Admin:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Función para cambiar el plan del restaurante
 */
async function changeRestaurantPlan(newPlanId) {
  try {
    console.log(`\n🔄 Cambiando plan del restaurante a ID ${newPlanId}...`);
    
    const response = await axios.post(`${ADMIN_API_URL}/planes/restaurante/1/cambiar-plan`, {
      id_plan_nuevo: newPlanId,
      motivo: 'Corrección de límites de usuarios'
    }, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Plan cambiado exitosamente');
    return response.data;
  } catch (error) {
    console.error('❌ Error cambiando plan:', error.response?.data || error.message);
    return null;
  }
}

/**
 * Función para obtener información del plan actual
 */
async function getCurrentPlan() {
  try {
    const response = await axios.get(`${POS_API_URL}/plans/current`, {
      headers: {
        'Authorization': `Bearer ${posToken}`
      }
    });
    
    return response.data.data;
  } catch (error) {
    console.error('❌ Error obteniendo información del plan:', error.response?.data || error.message);
    return null;
  }
}

/**
 * Función principal
 */
async function runTest() {
  console.log('🔍 Verificando límites de usuarios...\n');
  
  // 1. Login en ambos sistemas
  const posLoginSuccess = await loginPOS();
  const adminLoginSuccess = await loginAdmin();
  
  if (!posLoginSuccess || !adminLoginSuccess) {
    console.log('❌ No se pudo completar el login. Abortando.');
    return;
  }
  
  // 2. Verificar plan actual
  const planData = await getCurrentPlan();
  
  if (planData) {
    console.log(`📊 Plan actual: ${planData.plan.nombre}`);
    console.log(`📋 Límites del plan:`);
    console.log(`   - Usuarios: ${planData.uso_actual.usuarios}/${planData.limites.max_usuarios}`);
    console.log(`   - Productos: ${planData.uso_actual.productos}/${planData.limites.max_productos}`);
    console.log(`   - Sucursales: ${planData.uso_actual.sucursales}/${planData.limites.max_sucursales}`);
    
    // 3. Si hay límite excedido, cambiar a plan Enterprise
    if (planData.uso_actual.usuarios > planData.limites.max_usuarios) {
      console.log(`\n⚠️ Límite de usuarios excedido!`);
      console.log(`   Actual: ${planData.uso_actual.usuarios}`);
      console.log(`   Límite: ${planData.limites.max_usuarios}`);
      console.log(`\n🔄 Cambiando a plan Enterprise para resolver el problema...`);
      
      await changeRestaurantPlan(4);
      
      // Esperar un momento
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Verificar el cambio
      const newPlanData = await getCurrentPlan();
      if (newPlanData) {
        console.log(`\n✅ Nuevo plan: ${newPlanData.plan.nombre}`);
        console.log(`📋 Nuevos límites:`);
        console.log(`   - Usuarios: ${newPlanData.uso_actual.usuarios}/${newPlanData.limites.max_usuarios}`);
        console.log(`   - Productos: ${newPlanData.uso_actual.productos}/${newPlanData.limites.max_productos}`);
        console.log(`   - Sucursales: ${newPlanData.uso_actual.sucursales}/${newPlanData.limites.max_sucursales}`);
        console.log('\n🎉 ¡Los errores 403 deberían estar resueltos!');
      }
    } else {
      console.log('\n✅ Los límites están dentro del rango permitido.');
    }
  }
}

// Ejecutar prueba
runTest().catch(console.error);
