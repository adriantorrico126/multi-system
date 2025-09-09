#!/usr/bin/env node

/**
 * Script para probar las rutas de eliminación de mesas
 * Ejecutar con: node test_rutas_mesas.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';
const TEST_TOKEN = 'tu_token_de_prueba_aqui'; // Reemplazar con un token válido

async function testRutas() {
  console.log('🧪 Probando rutas de eliminación de mesas...\n');
  
  const headers = {
    'Authorization': `Bearer ${TEST_TOKEN}`,
    'Content-Type': 'application/json'
  };
  
  try {
    // 1. Probar ruta normal
    console.log('1️⃣ Probando ruta normal: DELETE /mesas/configuracion/38');
    try {
      const response = await axios.delete(`${BASE_URL}/mesas/configuracion/38?id_restaurante=1`, { headers });
      console.log('✅ Ruta normal funciona:', response.status);
    } catch (error) {
      console.log('📝 Ruta normal respuesta:', error.response?.status, error.response?.data?.message);
    }
    
    // 2. Probar ruta forzada
    console.log('\n2️⃣ Probando ruta forzada: DELETE /mesas/configuracion/38/forzar');
    try {
      const response = await axios.delete(`${BASE_URL}/mesas/configuracion/38/forzar?id_restaurante=1&forzar=true`, { headers });
      console.log('✅ Ruta forzada funciona:', response.status);
    } catch (error) {
      console.log('📝 Ruta forzada respuesta:', error.response?.status, error.response?.data?.message);
    }
    
    // 3. Verificar que las rutas están registradas
    console.log('\n3️⃣ Verificando rutas disponibles...');
    try {
      const response = await axios.get(`${BASE_URL}/mesas/configuracion/sucursal/1`, { headers });
      console.log('✅ Ruta de configuración funciona:', response.status);
    } catch (error) {
      console.log('📝 Ruta de configuración respuesta:', error.response?.status);
    }
    
  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

// Función para verificar si el servidor está corriendo
async function verificarServidor() {
  try {
    const response = await axios.get('http://localhost:3000/health');
    console.log('✅ Servidor backend está corriendo');
    return true;
  } catch (error) {
    console.log('❌ Servidor backend no está corriendo o no responde');
    console.log('   Asegúrate de ejecutar: npm run dev en el directorio backend');
    return false;
  }
}

async function main() {
  console.log('🔍 Verificando servidor...');
  const servidorOk = await verificarServidor();
  
  if (servidorOk) {
    await testRutas();
  } else {
    console.log('\n💡 Para probar las rutas:');
    console.log('1. Ejecuta: cd sistema-pos/vegetarian_restaurant_backend');
    console.log('2. Ejecuta: npm run dev');
    console.log('3. Ejecuta: node test_rutas_mesas.js');
  }
}

main();
