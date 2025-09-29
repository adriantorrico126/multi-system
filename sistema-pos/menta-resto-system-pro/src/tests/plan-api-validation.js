#!/usr/bin/env node

/**
 * Script de Validación de API - Sistema de Planes
 * Valida que todos los endpoints de la API funcionen correctamente
 */

import axios from 'axios';
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function print(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Configuración de la API
const API_BASE_URL = 'http://localhost:3000/api/v1';
const TEST_RESTAURANT_ID = 1;
const TEST_PLAN_ID = 1;

// Función para hacer peticiones HTTP
async function makeRequest(method, endpoint, data = null, headers = {}) {
  try {
    const config = {
      method,
      url: `${API_BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message, 
      status: error.response?.status || 500 
    };
  }
}

// Función para validar endpoint
async function validateEndpoint(endpoint, method = 'GET', data = null, expectedStatus = 200) {
  const result = await makeRequest(method, endpoint, data);
  
  if (result.success && result.status === expectedStatus) {
    print('green', `✅ ${method} ${endpoint} - OK (${result.status})`);
    return { success: true, data: result.data };
  } else {
    print('red', `❌ ${method} ${endpoint} - FAILED (${result.status})`);
    if (result.error) {
      print('red', `   Error: ${JSON.stringify(result.error)}`);
    }
    return { success: false, error: result.error };
  }
}

// Función para validar estructura de respuesta
function validateResponseStructure(data, expectedFields) {
  const missingFields = expectedFields.filter(field => !(field in data));
  
  if (missingFields.length === 0) {
    print('green', `   ✅ Estructura de respuesta correcta`);
    return true;
  } else {
    print('red', `   ❌ Campos faltantes: ${missingFields.join(', ')}`);
    return false;
  }
}

// Función principal de validación
async function main() {
  print('bright', '🚀 VALIDANDO API DEL SISTEMA DE PLANES');
  print('bright', '======================================');
  
  const results = {
    endpoints: {},
    summary: { passed: 0, failed: 0, total: 0 }
  };

  // =====================================================
  // 1. VALIDAR ENDPOINTS DE PLANES
  // =====================================================
  print('bright', '\n📋 VALIDANDO ENDPOINTS DE PLANES');
  print('bright', '==================================');

  // GET /planes-sistema - Listar todos los planes
  const planesResult = await validateEndpoint('/planes-sistema');
  if (planesResult.success) {
    validateResponseStructure(planesResult.data[0], ['id', 'nombre', 'precio_mensual', 'descripcion', 'funcionalidades']);
    results.endpoints['GET /planes-sistema'] = planesResult.success;
  }

  // GET /planes-sistema/:id - Obtener plan específico
  const planResult = await validateEndpoint(`/planes-sistema/${TEST_PLAN_ID}`);
  if (planResult.success) {
    validateResponseStructure(planResult.data, ['id', 'nombre', 'precio_mensual', 'descripcion', 'funcionalidades']);
    results.endpoints['GET /planes-sistema/:id'] = planResult.success;
  }

  // POST /planes-sistema/:id/validate-feature - Validar funcionalidad
  const validateFeatureResult = await validateEndpoint(
    `/planes-sistema/${TEST_PLAN_ID}/validate-feature`,
    'POST',
    { feature: 'incluye_inventario_basico' }
  );
  if (validateFeatureResult.success) {
    validateResponseStructure(validateFeatureResult.data, ['hasFeature', 'reason']);
    results.endpoints['POST /planes-sistema/:id/validate-feature'] = validateFeatureResult.success;
  }

  // POST /planes-sistema/compare - Comparar planes
  const compareResult = await validateEndpoint(
    '/planes-sistema/compare',
    'POST',
    { plan1Id: 1, plan2Id: 2 }
  );
  if (compareResult.success) {
    validateResponseStructure(compareResult.data, ['plan1', 'plan2', 'differences']);
    results.endpoints['POST /planes-sistema/compare'] = compareResult.success;
  }

  // =====================================================
  // 2. VALIDAR ENDPOINTS DE SUSCRIPCIONES
  // =====================================================
  print('bright', '\n📋 VALIDANDO ENDPOINTS DE SUSCRIPCIONES');
  print('bright', '========================================');

  // GET /suscripciones-sistema/restaurant/:id - Obtener suscripción
  const suscripcionResult = await validateEndpoint(`/suscripciones-sistema/restaurant/${TEST_RESTAURANT_ID}`);
  if (suscripcionResult.success) {
    validateResponseStructure(suscripcionResult.data, ['id', 'id_restaurante', 'id_plan', 'estado', 'fecha_inicio']);
    results.endpoints['GET /suscripciones-sistema/restaurant/:id'] = suscripcionResult.success;
  }

  // POST /suscripciones-sistema - Crear suscripción (si no existe)
  const createSuscripcionResult = await validateEndpoint(
    '/suscripciones-sistema',
    'POST',
    {
      id_restaurante: TEST_RESTAURANT_ID,
      id_plan: TEST_PLAN_ID,
      fecha_inicio: new Date().toISOString().split('T')[0],
      fecha_fin: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    },
    201
  );
  if (createSuscripcionResult.success) {
    validateResponseStructure(createSuscripcionResult.data, ['id', 'id_restaurante', 'id_plan', 'estado']);
    results.endpoints['POST /suscripciones-sistema'] = createSuscripcionResult.success;
  }

  // =====================================================
  // 3. VALIDAR ENDPOINTS DE CONTADORES
  // =====================================================
  print('bright', '\n📋 VALIDANDO ENDPOINTS DE CONTADORES');
  print('bright', '====================================');

  // GET /contadores-sistema/restaurant/:id - Obtener contadores
  const contadoresResult = await validateEndpoint(`/contadores-sistema/restaurant/${TEST_RESTAURANT_ID}`);
  if (contadoresResult.success) {
    validateResponseStructure(contadoresResult.data, ['id', 'id_restaurante', 'contador_sucursales', 'contador_usuarios', 'contador_productos']);
    results.endpoints['GET /contadores-sistema/restaurant/:id'] = contadoresResult.success;
  }

  // PUT /contadores-sistema/:id - Actualizar contadores
  if (contadoresResult.success && contadoresResult.data.id) {
    const updateContadoresResult = await validateEndpoint(
      `/contadores-sistema/${contadoresResult.data.id}`,
      'PUT',
      { contador_productos: 25 }
    );
    if (updateContadoresResult.success) {
      validateResponseStructure(updateContadoresResult.data, ['id', 'id_restaurante', 'contador_productos']);
      results.endpoints['PUT /contadores-sistema/:id'] = updateContadoresResult.success;
    }
  }

  // POST /contadores-sistema/:id/validate-limit - Validar límite
  if (contadoresResult.success && contadoresResult.data.id) {
    const validateLimitResult = await validateEndpoint(
      `/contadores-sistema/${contadoresResult.data.id}/validate-limit`,
      'POST',
      { resource: 'productos', amount: 10 }
    );
    if (validateLimitResult.success) {
      validateResponseStructure(validateLimitResult.data, ['canAdd', 'current', 'limit', 'remaining']);
      results.endpoints['POST /contadores-sistema/:id/validate-limit'] = validateLimitResult.success;
    }
  }

  // GET /contadores-sistema/global-stats - Estadísticas globales
  const globalStatsResult = await validateEndpoint('/contadores-sistema/global-stats');
  if (globalStatsResult.success) {
    validateResponseStructure(globalStatsResult.data, ['totalRestaurants', 'totalSucursales', 'totalUsuarios', 'totalProductos']);
    results.endpoints['GET /contadores-sistema/global-stats'] = globalStatsResult.success;
  }

  // =====================================================
  // 4. VALIDAR ENDPOINTS DE ALERTAS
  // =====================================================
  print('bright', '\n📋 VALIDANDO ENDPOINTS DE ALERTAS');
  print('bright', '===================================');

  // GET /alertas-sistema/restaurant/:id - Obtener alertas
  const alertasResult = await validateEndpoint(`/alertas-sistema/restaurant/${TEST_RESTAURANT_ID}`);
  if (alertasResult.success) {
    // Las alertas pueden estar vacías, pero la estructura debe ser correcta
    if (Array.isArray(alertasResult.data)) {
      print('green', `   ✅ Estructura de respuesta correcta (${alertasResult.data.length} alertas)`);
      results.endpoints['GET /alertas-sistema/restaurant/:id'] = true;
    } else {
      print('red', `   ❌ Estructura de respuesta incorrecta`);
      results.endpoints['GET /alertas-sistema/restaurant/:id'] = false;
    }
  }

  // GET /alertas-sistema/restaurant/:id/stats - Estadísticas de alertas
  const alertasStatsResult = await validateEndpoint(`/alertas-sistema/restaurant/${TEST_RESTAURANT_ID}/stats`);
  if (alertasStatsResult.success) {
    validateResponseStructure(alertasStatsResult.data, ['total', 'pending', 'resolved', 'ignored']);
    results.endpoints['GET /alertas-sistema/restaurant/:id/stats'] = alertasStatsResult.success;
  }

  // =====================================================
  // 5. VALIDAR ENDPOINTS DE INFORMACIÓN
  // =====================================================
  print('bright', '\n📋 VALIDANDO ENDPOINTS DE INFORMACIÓN');
  print('bright', '======================================');

  // GET /info - Información general
  const infoResult = await validateEndpoint('/info');
  if (infoResult.success) {
    validateResponseStructure(infoResult.data, ['success', 'message', 'version', 'endpoints']);
    results.endpoints['GET /info'] = infoResult.success;
  }

  // =====================================================
  // 6. VALIDAR MANEJO DE ERRORES
  // =====================================================
  print('bright', '\n📋 VALIDANDO MANEJO DE ERRORES');
  print('bright', '================================');

  // GET /planes-sistema/999 - Plan inexistente
  const planNotFoundResult = await validateEndpoint('/planes-sistema/999', 'GET', null, 404);
  results.endpoints['GET /planes-sistema/999 (404)'] = planNotFoundResult.success;

  // GET /suscripciones-sistema/restaurant/999 - Restaurante inexistente
  const restaurantNotFoundResult = await validateEndpoint('/suscripciones-sistema/restaurant/999', 'GET', null, 404);
  results.endpoints['GET /suscripciones-sistema/restaurant/999 (404)'] = restaurantNotFoundResult.success;

  // POST /planes-sistema/compare - Datos inválidos
  const invalidDataResult = await validateEndpoint(
    '/planes-sistema/compare',
    'POST',
    { plan1Id: 'invalid', plan2Id: 'invalid' },
    400
  );
  results.endpoints['POST /planes-sistema/compare (400)'] = invalidDataResult.success;

  // =====================================================
  // 7. RESUMEN DE VALIDACIÓN
  // =====================================================
  print('bright', '\n📊 RESUMEN DE VALIDACIÓN');
  print('bright', '========================');

  const totalEndpoints = Object.keys(results.endpoints).length;
  const passedEndpoints = Object.values(results.endpoints).filter(Boolean).length;
  const failedEndpoints = totalEndpoints - passedEndpoints;

  print('bright', `\n📋 Endpoints: ${passedEndpoints}/${totalEndpoints} (${failedEndpoints} fallos)`);

  if (failedEndpoints === 0) {
    print('green', '\n🎉 ¡TODAS LAS PRUEBAS DE API PASARON!');
    print('green', '✅ API del Sistema de Planes funcionando correctamente');
  } else {
    print('red', '\n⚠️  ALGUNAS PRUEBAS DE API FALLARON');
    print('yellow', '🔧 Revisa los errores anteriores');
  }

  // =====================================================
  // 8. INSTRUCCIONES FINALES
  // =====================================================
  print('bright', '\n📋 PRÓXIMOS PASOS');
  print('bright', '==================');
  print('cyan', '1. Asegúrate de que el servidor esté ejecutándose en http://localhost:3000');
  print('cyan', '2. Verifica que la base de datos esté configurada correctamente');
  print('cyan', '3. Ejecuta las pruebas de base de datos: plan-database-validation.sql');
  print('cyan', '4. Ejecuta las pruebas de frontend: npm test');
  print('cyan', '5. Realiza pruebas manuales en el navegador');

  print('bright', '\n🔗 COMANDOS ÚTILES');
  print('bright', '==================');
  print('cyan', '• Iniciar servidor: npm start');
  print('cyan', '• Verificar logs: tail -f logs/app.log');
  print('cyan', '• Probar endpoint específico: curl http://localhost:3000/api/v1/planes-sistema');
  print('cyan', '• Verificar base de datos: psql -d database -f plan-database-validation.sql');

  return results;
}

// Ejecutar si es llamado directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { main, validateEndpoint, makeRequest };
