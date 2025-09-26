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
 * Función para probar acceso a APIs según el plan
 */
async function testAPIAccess(planName) {
  try {
    console.log(`\n🧪 Probando acceso a APIs para el plan ${planName}...`);
    
    const headers = {
      'Authorization': `Bearer ${posToken}`,
      'Content-Type': 'application/json'
    };
    
    // Probar acceso a productos
    try {
      const productosResponse = await axios.get(`${POS_API_URL}/productos?id_restaurante=1`, { headers });
      console.log(`✅ Productos: Acceso permitido (${productosResponse.data.length} productos)`);
    } catch (error) {
      if (error.response?.status === 403) {
        console.log(`❌ Productos: Acceso denegado (403 Forbidden)`);
        console.log(`   Mensaje: ${error.response.data.message}`);
      } else {
        console.log(`⚠️ Productos: Error inesperado: ${error.response?.status}`);
      }
    }
    
    // Probar acceso a mesas
    try {
      const mesasResponse = await axios.get(`${POS_API_URL}/mesas/9?id_restaurante=1`, { headers });
      console.log(`✅ Mesas: Acceso permitido (${mesasResponse.data.length} mesas)`);
    } catch (error) {
      if (error.response?.status === 403) {
        console.log(`❌ Mesas: Acceso denegado (403 Forbidden)`);
        console.log(`   Mensaje: ${error.response.data.message}`);
      } else {
        console.log(`⚠️ Mesas: Error inesperado: ${error.response?.status}`);
      }
    }
    
    // Probar acceso a arqueo
    try {
      const arqueoResponse = await axios.get(`${POS_API_URL}/arqueo/actual`, { headers });
      console.log(`✅ Arqueo: Acceso permitido`);
    } catch (error) {
      if (error.response?.status === 403) {
        console.log(`❌ Arqueo: Acceso denegado (403 Forbidden)`);
        console.log(`   Mensaje: ${error.response.data.message}`);
      } else {
        console.log(`⚠️ Arqueo: Error inesperado: ${error.response?.status}`);
      }
    }
    
    // Probar acceso a inventario
    try {
      const inventarioResponse = await axios.get(`${POS_API_URL}/productos/inventario/resumen?id_restaurante=1`, { headers });
      console.log(`✅ Inventario: Acceso permitido`);
    } catch (error) {
      if (error.response?.status === 403) {
        console.log(`❌ Inventario: Acceso denegado (403 Forbidden)`);
        console.log(`   Mensaje: ${error.response.data.message}`);
      } else {
        console.log(`⚠️ Inventario: Error inesperado: ${error.response?.status}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error en pruebas de API:', error.message);
  }
}

/**
 * Función principal
 */
async function runTests() {
  console.log('🚀 Iniciando pruebas de restricciones de API...\n');
  
  // 1. Login en ambos sistemas
  const posLoginSuccess = await loginPOS();
  const adminLoginSuccess = await loginAdmin();
  
  if (!posLoginSuccess || !adminLoginSuccess) {
    console.log('❌ No se pudo completar el login. Abortando.');
    return;
  }
  
  // 2. Probar plan Profesional ($49)
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🧪 PROBANDO PLAN PROFESIONAL ($49)`);
  console.log(`${'='.repeat(60)}`);
  
  // Cambiar al plan
  await changeRestaurantPlan(2);
  
  // Esperar un momento para que se aplique el cambio
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Probar acceso a APIs
  await testAPIAccess('profesional');
  
  console.log('\n✅ Pruebas completadas!');
}

// Ejecutar pruebas
runTests().catch(console.error);


