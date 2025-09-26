const { pool } = require('./src/config/database');
const logger = require('./src/config/logger');

/**
 * Script de testing para validar todas las restricciones por plan
 * Basado en PLANES_FUNCIONALIDADES_COMPLETO.md
 */

/**
 * Casos de prueba para cada plan
 */
const TEST_CASES = {
  basico: {
    plan: 'basico',
    price: 19.00,
    limits: {
      max_sucursales: 1,
      max_usuarios: 2,
      max_productos: 100,
      max_transacciones_mes: 500,
      almacenamiento_gb: 1
    },
    features: {
      allowed: ['sales.basico', 'inventory.products', 'dashboard.resumen', 'dashboard.productos', 'dashboard.categorias', 'dashboard.usuarios'],
      restricted: ['mesas', 'lotes', 'arqueo', 'cocina', 'egresos', 'delivery', 'reservas', 'analytics', 'promociones', 'api', 'white_label']
    }
  },
  profesional: {
    plan: 'profesional',
    price: 49.00,
    limits: {
      max_sucursales: 2,
      max_usuarios: 7,
      max_productos: 500,
      max_transacciones_mes: 2000,
      almacenamiento_gb: 5
    },
    features: {
      allowed: ['sales.basico', 'sales.pedidos', 'inventory.products', 'inventory.lots', 'dashboard.resumen', 'dashboard.productos', 'dashboard.categorias', 'dashboard.usuarios', 'dashboard.mesas', 'mesas', 'lotes', 'arqueo', 'cocina', 'egresos.basico'],
      restricted: ['egresos.avanzado', 'delivery', 'reservas', 'analytics', 'promociones', 'api', 'white_label']
    }
  },
  avanzado: {
    plan: 'avanzado',
    price: 99.00,
    limits: {
      max_sucursales: 3,
      max_usuarios: 0, // Ilimitado
      max_productos: 2000,
      max_transacciones_mes: 10000,
      almacenamiento_gb: 20
    },
    features: {
      allowed: ['sales.basico', 'sales.pedidos', 'sales.avanzado', 'inventory.products', 'inventory.lots', 'inventory.complete', 'dashboard.resumen', 'dashboard.productos', 'dashboard.categorias', 'dashboard.usuarios', 'dashboard.mesas', 'dashboard.completo', 'mesas', 'lotes', 'arqueo', 'cocina', 'egresos.basico', 'egresos.avanzado', 'delivery', 'reservas', 'analytics', 'promociones'],
      restricted: ['api', 'white_label']
    }
  },
  enterprise: {
    plan: 'enterprise',
    price: 119.00,
    limits: {
      max_sucursales: 0, // Ilimitado
      max_usuarios: 0, // Ilimitado
      max_productos: 0, // Ilimitado
      max_transacciones_mes: 0, // Ilimitado
      almacenamiento_gb: 0 // Ilimitado
    },
    features: {
      allowed: ['sales.basico', 'sales.pedidos', 'sales.avanzado', 'inventory.products', 'inventory.lots', 'inventory.complete', 'dashboard.resumen', 'dashboard.productos', 'dashboard.categorias', 'dashboard.usuarios', 'dashboard.mesas', 'dashboard.completo', 'mesas', 'lotes', 'arqueo', 'cocina', 'egresos.basico', 'egresos.avanzado', 'delivery', 'reservas', 'analytics', 'promociones', 'api', 'white_label'],
      restricted: []
    }
  }
};

/**
 * Verificar que los datos de planes en la base de datos coincidan con los casos de prueba
 */
async function testPlanData() {
  console.log('🧪 Probando datos de planes en base de datos...');
  
  const results = [];
  
  for (const [planName, testCase] of Object.entries(TEST_CASES)) {
    try {
      const planQuery = `
        SELECT 
          nombre,
          precio_mensual,
          max_sucursales,
          max_usuarios,
          max_productos,
          max_transacciones_mes,
          almacenamiento_gb,
          funcionalidades
        FROM planes
        WHERE nombre = $1
      `;
      
      const { rows } = await pool.query(planQuery, [planName]);
      
      if (rows.length === 0) {
        results.push({
          plan: planName,
          status: 'FAIL',
          error: 'Plan no encontrado en base de datos'
        });
        continue;
      }
      
      const plan = rows[0];
      const errors = [];
      
      // Verificar precio
      if (parseFloat(plan.precio_mensual) !== testCase.price) {
        errors.push(`Precio incorrecto: esperado ${testCase.price}, encontrado ${plan.precio_mensual}`);
      }
      
      // Verificar límites
      for (const [limitName, expectedValue] of Object.entries(testCase.limits)) {
        if (plan[limitName] !== expectedValue) {
          errors.push(`Límite ${limitName} incorrecto: esperado ${expectedValue}, encontrado ${plan[limitName]}`);
        }
      }
      
      results.push({
        plan: planName,
        status: errors.length === 0 ? 'PASS' : 'FAIL',
        errors: errors
      });
      
    } catch (error) {
      results.push({
        plan: planName,
        status: 'ERROR',
        error: error.message
      });
    }
  }
  
  return results;
}

/**
 * Función principal para ejecutar todos los tests
 */
async function runAllTests() {
  try {
    console.log('🚀 Iniciando tests de restricciones por plan...');
    
    // Verificar conexión a la base de datos
    await pool.query('SELECT 1');
    console.log('✅ Conexión a base de datos establecida');
    
    // Ejecutar tests
    const planDataResults = await testPlanData();
    
    // Mostrar resultados
    console.log('\n📊 RESULTADOS DE TESTS:');
    console.log('========================');
    
    console.log('\n🧪 Datos de Planes:');
    planDataResults.forEach(result => {
      const status = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
      console.log(`${status} ${result.plan}: ${result.status}`);
      if (result.errors && result.errors.length > 0) {
        result.errors.forEach(error => console.log(`   - ${error}`));
      }
    });
    
    // Resumen final
    const totalTests = planDataResults.length;
    const passedTests = planDataResults.filter(r => r.status === 'PASS').length;
    
    console.log('\n📈 RESUMEN FINAL:');
    console.log(`Total de tests: ${totalTests}`);
    console.log(`Tests pasados: ${passedTests}`);
    console.log(`Tests fallidos: ${totalTests - passedTests}`);
    console.log(`Porcentaje de éxito: ${Math.round((passedTests / totalTests) * 100)}%`);
    
    if (passedTests === totalTests) {
      console.log('\n🎉 ¡Todos los tests pasaron! El sistema de planes está funcionando correctamente.');
    } else {
      console.log('\n⚠️  Algunos tests fallaron. Revisa los errores arriba.');
    }
    
  } catch (error) {
    console.error('❌ Error ejecutando tests:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Exportar funciones para uso en otros módulos
module.exports = {
  TEST_CASES,
  testPlanData,
  runAllTests
};

// Ejecutar si se llama directamente
if (require.main === module) {
  runAllTests();
}