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
      motivo: 'Prueba de restricciones frontend'
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
  console.log('🚀 Iniciando prueba de restricciones...\n');
  
  // 1. Login en ambos sistemas
  const posLoginSuccess = await loginPOS();
  const adminLoginSuccess = await loginAdmin();
  
  if (!posLoginSuccess || !adminLoginSuccess) {
    console.log('❌ No se pudo completar el login. Abortando.');
    return;
  }
  
  // 2. Cambiar a plan Profesional ($49)
  console.log('\n🔄 Cambiando a plan Profesional ($49)...');
  await changeRestaurantPlan(2);
  
  // 3. Esperar un momento para que se aplique el cambio
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // 4. Verificar el plan actual
  const planData = await getCurrentPlan();
  
  if (planData) {
    console.log(`\n📊 Plan actual: ${planData.plan.nombre}`);
    console.log(`📋 Funcionalidades:`, JSON.stringify(planData.plan.funcionalidades, null, 2));
    
    // 5. Verificar qué funcionalidades debería tener acceso
    const funcionalidades = planData.plan.funcionalidades;
    
    console.log('\n🔍 Análisis de acceso:');
    console.log(`   - Productos: ${funcionalidades.inventory ? '✅ Permitido' : '❌ Restringido'}`);
    console.log(`   - Mesas: ${funcionalidades.mesas ? '✅ Permitido' : '❌ Restringido'}`);
    console.log(`   - Arqueo: ${funcionalidades.arqueo ? '✅ Permitido' : '❌ Restringido'}`);
    console.log(`   - Inventario: ${funcionalidades.inventario ? '✅ Permitido' : '❌ Restringido'}`);
    
    console.log('\n📝 Resultado esperado:');
    console.log('   El frontend debería mostrar mensajes profesionales cuando el usuario');
    console.log('   intente acceder a funcionalidades no incluidas en su plan.');
    console.log('\n📞 Contacto para actualizar plan:');
    console.log('   Teléfono: 69512310');
    console.log('   Email: forkasbib@gmail.com');
  }
}

// Ejecutar prueba
runTest().catch(console.error);
