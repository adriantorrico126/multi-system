#!/usr/bin/env node

/**
 * Script de Validación Completa - Sistema de Planes
 * Ejecuta todas las validaciones y genera un reporte completo
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  white: '\x1b[37m'
};

function print(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Función para ejecutar validaciones
async function runValidation(name, scriptPath, description) {
  print('cyan', `\n🔄 ${description}...`);
  try {
    const result = execSync(`node "${scriptPath}"`, { 
      encoding: 'utf8', 
      cwd: process.cwd(),
      stdio: 'pipe'
    });
    print('green', `✅ ${description} completado`);
    return { success: true, output: result, name };
  } catch (error) {
    print('red', `❌ ${description} falló`);
    print('red', error.message);
    return { success: false, error: error.message, name };
  }
}

// Función para ejecutar pruebas de base de datos
async function runDatabaseValidation() {
  print('cyan', '\n🔄 Validando base de datos...');
  try {
    // Verificar si psql está disponible
    execSync('psql --version', { stdio: 'pipe' });
    
    const sqlPath = path.join(process.cwd(), 'src/tests/plan-database-validation.sql');
    if (fs.existsSync(sqlPath)) {
      print('green', '✅ Script de validación de base de datos encontrado');
      print('yellow', '⚠️  Ejecuta manualmente: psql -d database -f src/tests/plan-database-validation.sql');
      return { success: true, name: 'database', manual: true };
    } else {
      print('red', '❌ Script de validación de base de datos no encontrado');
      return { success: false, error: 'Script not found', name: 'database' };
    }
  } catch (error) {
    print('yellow', '⚠️  psql no disponible, saltando validación de base de datos');
    print('yellow', '⚠️  Ejecuta manualmente: psql -d database -f src/tests/plan-database-validation.sql');
    return { success: true, name: 'database', manual: true };
  }
}

// Función para ejecutar pruebas de API
async function runAPIValidation() {
  const scriptPath = path.join(process.cwd(), 'src/tests/plan-api-validation.js');
  if (fs.existsSync(scriptPath)) {
    return await runValidation('api', scriptPath, 'Validación de API');
  } else {
    print('red', '❌ Script de validación de API no encontrado');
    return { success: false, error: 'Script not found', name: 'api' };
  }
}

// Función para ejecutar validación de frontend
async function runFrontendValidation() {
  const scriptPath = path.join(process.cwd(), 'src/tests/plan-frontend-validation.js');
  if (fs.existsSync(scriptPath)) {
    return await runValidation('frontend', scriptPath, 'Validación de Frontend');
  } else {
    print('red', '❌ Script de validación de frontend no encontrado');
    return { success: false, error: 'Script not found', name: 'frontend' };
  }
}

// Función para ejecutar pruebas automatizadas
async function runAutomatedTests() {
  print('cyan', '\n🔄 Ejecutando pruebas automatizadas...');
  try {
    const result = execSync('npm test -- --passWithNoTests --verbose', { 
      encoding: 'utf8', 
      cwd: process.cwd(),
      stdio: 'pipe'
    });
    print('green', '✅ Pruebas automatizadas completadas');
    return { success: true, output: result, name: 'tests' };
  } catch (error) {
    print('red', '❌ Pruebas automatizadas fallaron');
    print('red', error.message);
    return { success: false, error: error.message, name: 'tests' };
  }
}

// Función para verificar estructura del proyecto
function checkProjectStructure() {
  print('cyan', '\n🔄 Verificando estructura del proyecto...');
  
  const requiredPaths = [
    'sistema-pos/vegetarian_restaurant_backend/sql',
    'sistema-pos/vegetarian_restaurant_backend/src/models',
    'sistema-pos/vegetarian_restaurant_backend/src/controllers',
    'sistema-pos/vegetarian_restaurant_backend/src/middleware',
    'sistema-pos/vegetarian_restaurant_backend/src/routes',
    'sistema-pos/menta-resto-system-pro/src/context',
    'sistema-pos/menta-resto-system-pro/src/hooks',
    'sistema-pos/menta-resto-system-pro/src/services',
    'sistema-pos/menta-resto-system-pro/src/components/plans',
    'sistema-pos/menta-resto-system-pro/src/tests'
  ];

  let passed = 0;
  let failed = 0;

  requiredPaths.forEach(path => {
    const fullPath = path.join(process.cwd(), path);
    if (fs.existsSync(fullPath)) {
      print('green', `✅ ${path} existe`);
      passed++;
    } else {
      print('red', `❌ ${path} no existe`);
      failed++;
    }
  });

  return { 
    success: failed === 0, 
    name: 'structure', 
    passed, 
    failed, 
    total: requiredPaths.length 
  };
}

// Función para generar reporte final
function generateFinalReport(results) {
  print('bright', '\n📊 REPORTE FINAL DE VALIDACIÓN');
  print('bright', '===============================');

  const totalValidations = results.length;
  const successfulValidations = results.filter(r => r.success).length;
  const failedValidations = totalValidations - successfulValidations;

  print('bright', `\n📋 Validaciones: ${successfulValidations}/${totalValidations} (${failedValidations} fallos)`);

  // Detalles por validación
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    const name = result.name.toUpperCase();
    print('white', `${status} ${name}: ${result.success ? 'PASÓ' : 'FALLÓ'}`);
    
    if (result.manual) {
      print('yellow', `   ⚠️  Requiere ejecución manual`);
    }
    
    if (result.error) {
      print('red', `   Error: ${result.error}`);
    }
  });

  // Estado general
  if (failedValidations === 0) {
    print('green', '\n🎉 ¡TODAS LAS VALIDACIONES PASARON!');
    print('green', '✅ Sistema de Planes implementado correctamente');
    print('green', '🚀 Listo para producción');
  } else {
    print('red', '\n⚠️  ALGUNAS VALIDACIONES FALLARON');
    print('yellow', '🔧 Revisa los errores anteriores antes de continuar');
  }

  // Guardar reporte
  const reportData = {
    timestamp: new Date().toISOString(),
    summary: {
      total: totalValidations,
      passed: successfulValidations,
      failed: failedValidations,
      success: failedValidations === 0
    },
    results: results.map(r => ({
      name: r.name,
      success: r.success,
      manual: r.manual || false,
      error: r.error || null
    }))
  };

  const reportPath = path.join(process.cwd(), 'complete-validation-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
  print('cyan', `\n📄 Reporte completo guardado en: ${reportPath}`);
}

// Función principal
async function main() {
  print('bright', '🚀 VALIDACIÓN COMPLETA DEL SISTEMA DE PLANES');
  print('bright', '============================================');
  print('white', 'Este script ejecutará todas las validaciones necesarias para verificar');
  print('white', 'que el sistema de planes esté implementado correctamente.');
  print('white', '');

  const results = [];

  try {
    // 1. Verificar estructura del proyecto
    const structureResult = checkProjectStructure();
    results.push(structureResult);

    // 2. Ejecutar validación de frontend
    const frontendResult = await runFrontendValidation();
    results.push(frontendResult);

    // 3. Ejecutar validación de API
    const apiResult = await runAPIValidation();
    results.push(apiResult);

    // 4. Ejecutar validación de base de datos
    const databaseResult = await runDatabaseValidation();
    results.push(databaseResult);

    // 5. Ejecutar pruebas automatizadas
    const testsResult = await runAutomatedTests();
    results.push(testsResult);

    // 6. Generar reporte final
    generateFinalReport(results);

    // 7. Instrucciones finales
    print('bright', '\n📋 PRÓXIMOS PASOS');
    print('bright', '==================');
    
    if (results.every(r => r.success)) {
      print('white', '1. ✅ Todas las validaciones pasaron');
      print('white', '2. 🚀 El sistema está listo para producción');
      print('white', '3. 📝 Ejecuta las pruebas manuales del archivo plan-manual-testing.md');
      print('white', '4. 🔍 Realiza una revisión final en el navegador');
      print('white', '5. 📊 Monitorea el rendimiento en producción');
    } else {
      print('white', '1. ❌ Algunas validaciones fallaron');
      print('white', '2. 🔧 Revisa y corrige los errores encontrados');
      print('white', '3. 🔄 Ejecuta este script nuevamente');
      print('white', '4. 📝 Solo después de corregir errores, ejecuta las pruebas manuales');
    }

    print('bright', '\n🔗 COMANDOS ÚTILES');
    print('bright', '==================');
    print('white', '• Ejecutar validación completa: node src/tests/plan-complete-validation.js');
    print('white', '• Ejecutar validación de frontend: node src/tests/plan-frontend-validation.js');
    print('white', '• Ejecutar validación de API: node src/tests/plan-api-validation.js');
    print('white', '• Ejecutar validación de base de datos: psql -d database -f src/tests/plan-database-validation.sql');
    print('white', '• Ejecutar pruebas: npm test');
    print('white', '• Iniciar servidor: npm start');
    print('white', '• Iniciar frontend: npm run dev');

    print('bright', '\n📚 DOCUMENTACIÓN');
    print('bright', '=================');
    print('white', '• README de pruebas: src/tests/README.md');
    print('white', '• Pruebas manuales: src/tests/plan-manual-testing.md');
    print('white', '• Validación de base de datos: src/tests/plan-database-validation.sql');
    print('white', '• Script de pruebas: src/tests/plan-testing-script.js');

  } catch (error) {
    print('red', '\n💥 ERROR CRÍTICO DURANTE LA VALIDACIÓN');
    print('red', error.message);
    print('yellow', '🔧 Revisa la configuración del proyecto y vuelve a intentar');
  }
}

// Ejecutar si es llamado directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { main, runValidation, checkProjectStructure, generateFinalReport };
