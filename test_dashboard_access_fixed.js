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
      motivo: 'Prueba de acceso al dashboard'
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
 * Función para probar el acceso al dashboard
 */
async function testDashboardAccess(planName) {
  try {
    console.log(`\n🧪 Probando acceso al dashboard para el plan ${planName}...`);
    
    const planData = await getCurrentPlan();
    if (!planData) {
      console.log('❌ No se pudo obtener información del plan');
      return false;
    }
    
    const funcionalidades = planData.plan.funcionalidades;
    const dashboardValue = funcionalidades.dashboard;
    
    console.log(`📊 Dashboard value: ${JSON.stringify(dashboardValue)}`);
    
    // Simular la lógica del frontend
    const hasDashboardAccess = (() => {
      if (Array.isArray(dashboardValue)) {
        // Para el dashboard, verificar si el array contiene las funcionalidades requeridas
        const requiredFeatures = 'resumen productos categorias usuarios'.split(' ');
        return requiredFeatures.every(reqFeature => dashboardValue.includes(reqFeature));
      }
      return false;
    })();
    
    console.log(`✅ Acceso al dashboard: ${hasDashboardAccess ? 'SÍ' : 'NO'}`);
    
    if (hasDashboardAccess) {
      console.log('🎉 ¡El dashboard debería estar disponible!');
    } else {
      console.log('🚫 El dashboard NO debería estar disponible');
    }
    
    return hasDashboardAccess;
  } catch (error) {
    console.error('❌ Error verificando acceso al dashboard:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Función principal de pruebas
 */
async function runTests() {
  console.log('🚀 Iniciando pruebas de acceso al dashboard...\n');
  
  // 1. Login en ambos sistemas
  const posLoginSuccess = await loginPOS();
  const adminLoginSuccess = await loginAdmin();
  
  if (!posLoginSuccess || !adminLoginSuccess) {
    console.log('❌ No se pudo completar el login. Abortando pruebas.');
    return;
  }
  
  // 2. Probar cada plan
  const plans = [
    { id: 1, name: 'basico' },
    { id: 2, name: 'profesional' },
    { id: 3, name: 'avanzado' },
    { id: 4, name: 'enterprise' }
  ];
  
  for (const plan of plans) {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`🧪 PROBANDO PLAN ${plan.name.toUpperCase()}`);
    console.log(`${'='.repeat(50)}`);
    
    // Cambiar al plan
    await changeRestaurantPlan(plan.id);
    
    // Esperar un momento para que se aplique el cambio
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Verificar acceso al dashboard
    await testDashboardAccess(plan.name);
  }
  
  console.log('\n✅ Pruebas completadas!');
  console.log('\n📋 Resumen:');
  console.log('   - Se probaron todos los planes');
  console.log('   - Se verificó el acceso al dashboard');
  console.log('   - Se identificaron problemas si los hay');
}

// Ejecutar pruebas
runTests().catch(console.error);
