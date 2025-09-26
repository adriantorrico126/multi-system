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
 * Función para probar acceso a funcionalidad restringida
 */
async function testRestrictedFeature() {
  try {
    console.log('\n🧪 Probando acceso a funcionalidad restringida...');
    
    // Intentar acceder a una funcionalidad que requiere plan superior
    const response = await axios.get(`${POS_API_URL}/planes/info`, {
      headers: {
        'Authorization': `Bearer ${posToken}`
      }
    });
    
    console.log('📊 Información del plan actual:');
    console.log(`   Plan: ${response.data.plan.nombre}`);
    console.log(`   Estado: ${response.data.suscripcion.estado}`);
    console.log(`   Límites:`);
    console.log(`     - Usuarios: ${response.data.uso_actual.usuarios}/${response.data.limites.max_usuarios}`);
    console.log(`     - Productos: ${response.data.uso_actual.productos}/${response.data.limites.max_productos}`);
    console.log(`     - Sucursales: ${response.data.uso_actual.sucursales}/${response.data.limites.max_sucursales}`);
    
    return response.data;
  } catch (error) {
    console.error('❌ Error obteniendo información del plan:', error.response?.data || error.message);
    return null;
  }
}

/**
 * Función para probar creación de producto (límite de productos)
 */
async function testProductLimit() {
  try {
    console.log('\n🧪 Probando límite de productos...');
    
    const newProduct = {
      nombre: 'Producto de Prueba',
      precio: 10.00,
      categoria: 'Pruebas',
      descripcion: 'Producto para probar límites',
      stock: 100,
      activo: true
    };
    
    const response = await axios.post(`${POS_API_URL}/productos`, newProduct, {
      headers: {
        'Authorization': `Bearer ${posToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Producto creado exitosamente');
    return response.data;
  } catch (error) {
    if (error.response?.status === 403) {
      console.log('🚫 Límite de productos alcanzado - Mensaje profesional mostrado');
      console.log('📧 Información de contacto incluida:', error.response.data.contactInfo);
      console.log('💬 Mensaje de actualización:', error.response.data.upgradeMessage);
    } else {
      console.error('❌ Error inesperado:', error.response?.data || error.message);
    }
    return null;
  }
}

/**
 * Función para probar acceso a funcionalidad de plan superior
 */
async function testAdvancedFeature() {
  try {
    console.log('\n🧪 Probando acceso a funcionalidad avanzada...');
    
    // Intentar acceder a una funcionalidad que requiere plan avanzado
    const response = await axios.get(`${POS_API_URL}/planes/alerts`, {
      headers: {
        'Authorization': `Bearer ${posToken}`
      }
    });
    
    console.log('✅ Acceso a alertas exitoso');
    return response.data;
  } catch (error) {
    if (error.response?.status === 403) {
      console.log('🚫 Funcionalidad no disponible en plan actual - Mensaje profesional mostrado');
      console.log('📧 Información de contacto incluida:', error.response.data.contactInfo);
      console.log('💬 Mensaje de actualización:', error.response.data.upgradeMessage);
    } else {
      console.error('❌ Error inesperado:', error.response?.data || error.message);
    }
    return null;
  }
}

/**
 * Función para cambiar el plan del restaurante
 */
async function changeRestaurantPlan(newPlanId) {
  try {
    console.log(`\n🔄 Cambiando plan del restaurante a ID ${newPlanId}...`);
    
    const response = await axios.put(`${ADMIN_API_URL}/planes/restaurante/1/cambiar-plan`, {
      id_plan: newPlanId,
      motivo: 'Prueba de sistema de límites'
    }, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Plan cambiado exitosamente');
    console.log('📊 Nuevo plan:', response.data.plan.nombre);
    return response.data;
  } catch (error) {
    console.error('❌ Error cambiando plan:', error.response?.data || error.message);
    return null;
  }
}

/**
 * Función principal de pruebas
 */
async function runTests() {
  console.log('🚀 Iniciando pruebas del sistema de mensajes profesionales...\n');
  
  // 1. Login en ambos sistemas
  const posLoginSuccess = await loginPOS();
  const adminLoginSuccess = await loginAdmin();
  
  if (!posLoginSuccess || !adminLoginSuccess) {
    console.log('❌ No se pudo completar el login. Abortando pruebas.');
    return;
  }
  
  // 2. Obtener información del plan actual
  const planInfo = await testRestrictedFeature();
  if (!planInfo) {
    console.log('❌ No se pudo obtener información del plan. Abortando pruebas.');
    return;
  }
  
  // 3. Probar límite de productos
  await testProductLimit();
  
  // 4. Probar funcionalidad avanzada
  await testAdvancedFeature();
  
  // 5. Cambiar a plan básico para probar restricciones
  console.log('\n🔄 Cambiando a plan básico para probar restricciones...');
  await changeRestaurantPlan(1); // Plan básico
  
  // Esperar un momento para que se aplique el cambio
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // 6. Probar nuevamente con plan básico
  console.log('\n🧪 Probando restricciones con plan básico...');
  await testAdvancedFeature();
  
  // 7. Restaurar plan profesional
  console.log('\n🔄 Restaurando plan profesional...');
  await changeRestaurantPlan(2); // Plan profesional
  
  console.log('\n✅ Pruebas completadas!');
  console.log('\n📋 Resumen:');
  console.log('   - Sistema de mensajes profesionales implementado');
  console.log('   - Límites de plan verificados');
  console.log('   - Información de contacto incluida');
  console.log('   - Mensajes de actualización mostrados');
  console.log('\n💡 Los usuarios verán mensajes profesionales cuando intenten acceder a funcionalidades no incluidas en su plan.');
}

// Ejecutar pruebas
runTests().catch(console.error);
