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
  console.log('🚀 Probando APIs con plan Enterprise...\n');
  
  // 1. Login en ambos sistemas
  const posLoginSuccess = await loginPOS();
  const adminLoginSuccess = await loginAdmin();
  
  if (!posLoginSuccess || !adminLoginSuccess) {
    console.log('❌ No se pudo completar el login. Abortando.');
    return;
  }
  
  // 2. Probar APIs con plan Enterprise
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🧪 PROBANDO PLAN ENTERPRISE`);
  console.log(`${'='.repeat(60)}`);
  
  // Probar acceso a APIs
  await testAPIAccess('enterprise');
  
  console.log('\n✅ Pruebas completadas!');
  console.log('\n📝 Resultado:');
  console.log('   Si todas las APIs devuelven ✅, el problema de los errores 403 está resuelto.');
  console.log('   El frontend ahora debería funcionar correctamente sin errores.');
}

// Ejecutar pruebas
runTests().catch(console.error);
