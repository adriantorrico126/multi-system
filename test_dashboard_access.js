const axios = require('axios');

// Configuración
const POS_API_URL = 'http://localhost:3000/api/v1';

// Credenciales de prueba
const POS_CREDENTIALS = {
  username: 'admin',
  password: 'admin123'
};

let posToken = '';

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
 * Función para obtener información del plan actual
 */
async function getCurrentPlan() {
  try {
    console.log('\n📊 Obteniendo información del plan actual...');
    
    const response = await axios.get(`${POS_API_URL}/plans/current`, {
      headers: {
        'Authorization': `Bearer ${posToken}`
      }
    });
    
    console.log('✅ Información del plan obtenida:');
    console.log(`   Plan: ${response.data.data.plan.nombre}`);
    console.log(`   ID: ${response.data.data.plan.id}`);
    console.log(`   Descripción: ${response.data.data.plan.descripcion}`);
    console.log(`   Precio mensual: $${response.data.data.plan.precio_mensual}`);
    
    console.log('\n📋 Funcionalidades del plan:');
    const funcionalidades = response.data.data.plan.funcionalidades;
    Object.entries(funcionalidades).forEach(([key, value]) => {
      console.log(`   ${key}: ${JSON.stringify(value)}`);
    });
    
    console.log('\n📊 Límites del plan:');
    const limites = response.data.data.limites;
    Object.entries(limites).forEach(([key, value]) => {
      console.log(`   ${key}: ${value}`);
    });
    
    console.log('\n📈 Uso actual:');
    const uso = response.data.data.uso_actual;
    Object.entries(uso).forEach(([key, value]) => {
      console.log(`   ${key}: ${value}`);
    });
    
    return response.data.data;
  } catch (error) {
    console.error('❌ Error obteniendo información del plan:', error.response?.data || error.message);
    return null;
  }
}

/**
 * Función para verificar acceso al dashboard
 */
async function testDashboardAccess() {
  try {
    console.log('\n🧪 Probando acceso al dashboard...');
    
    // Simular la verificación que hace el frontend
    const planData = await getCurrentPlan();
    if (!planData) {
      console.log('❌ No se pudo obtener información del plan');
      return false;
    }
    
    const funcionalidades = planData.plan.funcionalidades;
    const dashboardFeature = funcionalidades.dashboard;
    
    console.log(`\n🔍 Verificando funcionalidad dashboard:`);
    console.log(`   Valor: ${JSON.stringify(dashboardFeature)}`);
    console.log(`   Tipo: ${typeof dashboardFeature}`);
    
    // Lógica de verificación (igual que en el frontend)
    let hasAccess = false;
    
    if (typeof dashboardFeature === 'boolean') {
      hasAccess = dashboardFeature;
    } else if (typeof dashboardFeature === 'string') {
      hasAccess = dashboardFeature !== '' && dashboardFeature !== 'false';
    } else {
      // Para el dashboard específicamente, si no está definido, asumir que tiene acceso básico
      hasAccess = true;
    }
    
    console.log(`\n✅ Resultado de verificación:`);
    console.log(`   ¿Tiene acceso al dashboard? ${hasAccess ? 'SÍ' : 'NO'}`);
    
    if (hasAccess) {
      console.log('🎉 ¡El dashboard debería estar disponible!');
    } else {
      console.log('🚫 El dashboard no está disponible según la configuración actual');
    }
    
    return hasAccess;
  } catch (error) {
    console.error('❌ Error verificando acceso al dashboard:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Función para probar otras funcionalidades
 */
async function testOtherFeatures() {
  try {
    console.log('\n🧪 Probando otras funcionalidades...');
    
    const planData = await getCurrentPlan();
    if (!planData) return;
    
    const funcionalidades = planData.plan.funcionalidades;
    
    const featuresToTest = [
      'mesas', 'lotes', 'arqueo', 'cocina', 'egresos', 
      'delivery', 'reservas', 'analytics', 'promociones', 
      'api', 'white_label', 'sales', 'inventory'
    ];
    
    console.log('\n📋 Estado de funcionalidades:');
    featuresToTest.forEach(feature => {
      const value = funcionalidades[feature];
      const hasAccess = typeof value === 'boolean' ? value : (typeof value === 'string' ? value !== '' && value !== 'false' : false);
      console.log(`   ${feature}: ${hasAccess ? '✅ Disponible' : '❌ No disponible'} (${JSON.stringify(value)})`);
    });
    
  } catch (error) {
    console.error('❌ Error probando otras funcionalidades:', error.response?.data || error.message);
  }
}

/**
 * Función principal de pruebas
 */
async function runTests() {
  console.log('🚀 Iniciando pruebas de acceso al dashboard...\n');
  
  // 1. Login en el POS
  const loginSuccess = await loginPOS();
  if (!loginSuccess) {
    console.log('❌ No se pudo completar el login. Abortando pruebas.');
    return;
  }
  
  // 2. Obtener información del plan
  const planData = await getCurrentPlan();
  if (!planData) {
    console.log('❌ No se pudo obtener información del plan. Abortando pruebas.');
    return;
  }
  
  // 3. Probar acceso al dashboard
  const dashboardAccess = await testDashboardAccess();
  
  // 4. Probar otras funcionalidades
  await testOtherFeatures();
  
  console.log('\n✅ Pruebas completadas!');
  console.log('\n📋 Resumen:');
  console.log(`   Plan actual: ${planData.plan.nombre}`);
  console.log(`   Dashboard disponible: ${dashboardAccess ? 'SÍ' : 'NO'}`);
  
  if (dashboardAccess) {
    console.log('\n💡 El dashboard debería estar funcionando correctamente en el frontend.');
  } else {
    console.log('\n⚠️  Hay un problema con la configuración del dashboard.');
  }
}

// Ejecutar pruebas
runTests().catch(console.error);
