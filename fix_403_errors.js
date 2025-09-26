const axios = require('axios');

// Configuración
const POS_API_URL = 'http://localhost:3000/api/v1';
const ADMIN_API_URL = 'http://localhost:5001/api';

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
 * Función para cambiar el plan del restaurante
 */
async function changeRestaurantPlan(newPlanId) {
  try {
    console.log(`\n🔄 Cambiando plan del restaurante a ID ${newPlanId}...`);
    
    const response = await axios.post(`${ADMIN_API_URL}/planes/restaurante/1/cambiar-plan`, {
      id_plan_nuevo: newPlanId,
      motivo: 'Corrección de errores 403'
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
 * Función principal
 */
async function checkAndFixPlan() {
  console.log('🔍 Verificando plan actual y corrigiendo errores 403...\n');
  
  // 1. Login en ambos sistemas
  const posLoginSuccess = await loginPOS();
  const adminLoginSuccess = await loginAdmin();
  
  if (!posLoginSuccess || !adminLoginSuccess) {
    console.log('❌ No se pudo completar el login. Abortando.');
    return;
  }
  
  // 2. Verificar plan actual
  console.log('📊 Verificando plan actual...');
  const planData = await getCurrentPlan();
  
  if (!planData) {
    console.log('❌ No se pudo obtener información del plan');
    return;
  }
  
  console.log(`🎯 Plan actual: ${planData.plan.nombre}`);
  console.log(`📋 Funcionalidades:`, JSON.stringify(planData.plan.funcionalidades, null, 2));
  
  // 3. Cambiar a plan Enterprise para resolver los errores 403
  console.log('\n🔧 Cambiando a plan Enterprise para resolver errores 403...');
  await changeRestaurantPlan(4);
  
  // 4. Verificar el cambio
  await new Promise(resolve => setTimeout(resolve, 2000));
  const newPlanData = await getCurrentPlan();
  
  if (newPlanData) {
    console.log(`\n✅ Nuevo plan: ${newPlanData.plan.nombre}`);
    console.log(`📋 Nuevas funcionalidades:`, JSON.stringify(newPlanData.plan.funcionalidades, null, 2));
    console.log('\n🎉 ¡Los errores 403 deberían estar resueltos!');
  }
}

// Ejecutar verificación y corrección
checkAndFixPlan().catch(console.error);


