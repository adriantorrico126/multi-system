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
 * Función para cambiar el plan del restaurante usando la ruta correcta
 */
async function changeRestaurantPlan(newPlanId) {
  try {
    console.log(`\n🔄 Cambiando plan del restaurante a ID ${newPlanId}...`);
    
    // Usar la ruta correcta según la estructura de la base de datos
    const response = await axios.post(`${ADMIN_API_URL}/planes/restaurante/1/cambiar-plan`, {
      id_plan_nuevo: newPlanId,
      motivo: 'Prueba de restricciones por plan'
    }, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Plan cambiado exitosamente');
    console.log('📊 Nuevo plan:', response.data.plan?.nombre || 'No especificado');
    return response.data;
  } catch (error) {
    console.error('❌ Error cambiando plan:', error.response?.data || error.message);
    
    // Si falla la ruta, intentar con la ruta alternativa
    try {
      console.log('🔄 Intentando con ruta alternativa...');
      const altResponse = await axios.post(`${ADMIN_API_URL}/planes/restaurante/1/cambiar-plan`, {
        id_plan_nuevo: newPlanId,
        motivo: 'Prueba de restricciones por plan'
      }, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Plan cambiado exitosamente (ruta alternativa)');
      return altResponse.data;
    } catch (altError) {
      console.error('❌ Error en ruta alternativa:', altError.response?.data || altError.message);
      return null;
    }
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
 * Función para verificar restricciones por plan
 */
async function testPlanRestrictions(planName) {
  try {
    console.log(`\n🧪 Probando restricciones del plan ${planName}...`);
    
    const planData = await getCurrentPlan();
    if (!planData) {
      console.log('❌ No se pudo obtener información del plan');
      return false;
    }
    
    const funcionalidades = planData.plan.funcionalidades;
    
    // Configuración esperada según PLANES_FUNCIONALIDADES_COMPLETO.md
    const expectedRestrictions = {
      basico: {
        mesas: false,
        lotes: false,
        arqueo: false,
        cocina: false,
        egresos: false,
        delivery: false,
        reservas: false,
        analytics: false,
        promociones: false,
        api: false,
        white_label: false,
        sales: ['basico'],
        inventory: ['productos'],
        dashboard: ['resumen', 'productos', 'categorias', 'usuarios']
      },
      profesional: {
        mesas: true,
        lotes: true,
        arqueo: true,
        cocina: true,
        egresos: ['basico'],
        delivery: false,
        reservas: false,
        analytics: false,
        promociones: false,
        api: false,
        white_label: false,
        sales: ['basico', 'pedidos'],
        inventory: ['productos', 'lotes'],
        dashboard: ['resumen', 'productos', 'categorias', 'usuarios', 'mesas']
      },
      avanzado: {
        mesas: true,
        lotes: true,
        arqueo: true,
        cocina: true,
        egresos: ['basico', 'avanzado'],
        delivery: true,
        reservas: true,
        analytics: true,
        promociones: true,
        api: false,
        white_label: false,
        sales: ['basico', 'pedidos', 'avanzado'],
        inventory: ['productos', 'lotes', 'completo'],
        dashboard: ['resumen', 'productos', 'categorias', 'usuarios', 'mesas', 'completo']
      },
      enterprise: {
        mesas: true,
        lotes: true,
        arqueo: true,
        cocina: true,
        egresos: ['basico', 'avanzado'],
        delivery: true,
        reservas: true,
        analytics: true,
        promociones: true,
        api: true,
        white_label: true,
        sales: ['basico', 'pedidos', 'avanzado'],
        inventory: ['productos', 'lotes', 'completo'],
        dashboard: ['resumen', 'productos', 'categorias', 'usuarios', 'mesas', 'completo']
      }
    };
    
    const expected = expectedRestrictions[planName.toLowerCase()];
    if (!expected) {
      console.log('❌ Plan no reconocido');
      return false;
    }
    
    console.log(`\n📋 Verificando funcionalidades del plan ${planName}:`);
    
    let allCorrect = true;
    Object.entries(expected).forEach(([feature, expectedValue]) => {
      const actualValue = funcionalidades[feature];
      const isCorrect = JSON.stringify(actualValue) === JSON.stringify(expectedValue);
      
      const status = isCorrect ? '✅' : '❌';
      console.log(`   ${status} ${feature}: esperado ${JSON.stringify(expectedValue)}, actual ${JSON.stringify(actualValue)}`);
      
      if (!isCorrect) {
        allCorrect = false;
      }
    });
    
    if (allCorrect) {
      console.log(`\n🎉 ¡Todas las restricciones del plan ${planName} están correctas!`);
    } else {
      console.log(`\n⚠️  Algunas restricciones del plan ${planName} no coinciden con la documentación.`);
    }
    
    return allCorrect;
  } catch (error) {
    console.error('❌ Error verificando restricciones:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Función principal de pruebas
 */
async function runTests() {
  console.log('🚀 Iniciando pruebas de restricciones por plan...\n');
  
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
    
    // Verificar restricciones
    await testPlanRestrictions(plan.name);
  }
  
  console.log('\n✅ Pruebas completadas!');
  console.log('\n📋 Resumen:');
  console.log('   - Se probaron todos los planes');
  console.log('   - Se verificaron las restricciones según la documentación');
  console.log('   - Se identificaron discrepancias si las hay');
}

// Ejecutar pruebas
runTests().catch(console.error);
