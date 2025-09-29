#!/usr/bin/env node

/**
 * Script de Pruebas del Sistema de Planes
 * Ejecuta todas las pruebas y genera un reporte
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// Función para imprimir con colores
function print(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Función para ejecutar comandos
function runCommand(command, description) {
  print('cyan', `\n🔄 ${description}...`);
  try {
    const result = execSync(command, { 
      encoding: 'utf8', 
      cwd: process.cwd(),
      stdio: 'pipe'
    });
    print('green', `✅ ${description} completado`);
    return { success: true, output: result };
  } catch (error) {
    print('red', `❌ ${description} falló`);
    print('red', error.message);
    return { success: false, error: error.message };
  }
}

// Función para verificar archivos
function checkFile(filePath, description) {
  print('cyan', `\n🔍 Verificando ${description}...`);
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    print('green', `✅ ${description} existe (${stats.size} bytes)`);
    return true;
  } else {
    print('red', `❌ ${description} no existe`);
    return false;
  }
}

// Función para verificar directorios
function checkDirectory(dirPath, description) {
  print('cyan', `\n🔍 Verificando ${description}...`);
  if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
    const files = fs.readdirSync(dirPath);
    print('green', `✅ ${description} existe (${files.length} archivos)`);
    return true;
  } else {
    print('red', `❌ ${description} no existe`);
    return false;
  }
}

// Función principal
function main() {
  print('bright', '🚀 INICIANDO PRUEBAS DEL SISTEMA DE PLANES');
  print('bright', '==========================================');
  
  const results = {
    files: {},
    tests: {},
    summary: { passed: 0, failed: 0, total: 0 }
  };

  // 1. Verificar estructura de archivos
  print('bright', '\n📁 VERIFICANDO ESTRUCTURA DE ARCHIVOS');
  print('bright', '=====================================');

  const filesToCheck = [
    // Backend
    'vegetarian_restaurant_backend/sql/sistema_planes_unificado.sql',
    'vegetarian_restaurant_backend/sql/migracion_planes_existentes.sql',
    'vegetarian_restaurant_backend/sql/triggers_automaticos_planes.sql',
    'vegetarian_restaurant_backend/sql/ejecutar_sistema_planes.sql',
    'vegetarian_restaurant_backend/src/models/PlanModel.js',
    'vegetarian_restaurant_backend/src/models/SuscripcionModel.js',
    'vegetarian_restaurant_backend/src/models/ContadorUsoModel.js',
    'vegetarian_restaurant_backend/src/models/AlertaLimiteModel.js',
    'vegetarian_restaurant_backend/src/controllers/PlanController.js',
    'vegetarian_restaurant_backend/src/controllers/SuscripcionController.js',
    'vegetarian_restaurant_backend/src/controllers/ContadorUsoController.js',
    'vegetarian_restaurant_backend/src/controllers/AlertaLimiteController.js',
    'vegetarian_restaurant_backend/src/middleware/planLimitsMiddleware.js',
    'vegetarian_restaurant_backend/src/middleware/usageTrackingMiddleware.js',
    'vegetarian_restaurant_backend/src/middleware/planValidationMiddleware.js',
    'vegetarian_restaurant_backend/src/middleware/index.js',
    'vegetarian_restaurant_backend/src/routes/planesRoutes.js',
    'vegetarian_restaurant_backend/src/routes/suscripcionesRoutes.js',
    'vegetarian_restaurant_backend/src/routes/contadoresRoutes.js',
    'vegetarian_restaurant_backend/src/routes/alertasRoutes.js',
    'vegetarian_restaurant_backend/src/app.js',
    
    // Frontend
    'menta-resto-system-pro/src/context/PlanSystemContext.tsx',
    'menta-resto-system-pro/src/hooks/usePlan.ts',
    'menta-resto-system-pro/src/hooks/usePlanFeatures.ts',
    'menta-resto-system-pro/src/hooks/usePlanLimits.ts',
    'menta-resto-system-pro/src/hooks/usePlanFeaturesNew.ts',
    'menta-resto-system-pro/src/hooks/usePlanAlerts.ts',
    'menta-resto-system-pro/src/services/planesApi.ts',
    'menta-resto-system-pro/src/components/plans/PlanFeatureGate.tsx',
    'menta-resto-system-pro/src/components/plans/PlanLimitAlert.tsx',
    'menta-resto-system-pro/src/components/plans/PlanStatusCard.tsx',
    'menta-resto-system-pro/src/components/plans/index.ts',
    'menta-resto-system-pro/src/App.tsx',
    'menta-resto-system-pro/src/pages/InventoryPage.tsx',
    'menta-resto-system-pro/src/pages/EgresosPage.tsx',
    
    // Tests
    'menta-resto-system-pro/src/tests/plan-system.test.tsx',
    'menta-resto-system-pro/src/tests/plan-integration.test.tsx',
    'menta-resto-system-pro/src/tests/plan-limits.test.tsx',
    'menta-resto-system-pro/src/tests/plan-api.test.ts',
    'menta-resto-system-pro/src/tests/plan-performance.test.ts',
    'menta-resto-system-pro/src/tests/plan-security.test.ts',
    'menta-resto-system-pro/src/tests/plan-e2e.test.tsx',
    'menta-resto-system-pro/src/tests/plan-validation.test.tsx',
    'menta-resto-system-pro/src/tests/plan-manual-testing.md',
    'menta-resto-system-pro/src/tests/README.md'
  ];

  filesToCheck.forEach(file => {
    const fullPath = path.join(process.cwd(), file);
    const exists = checkFile(fullPath, file);
    results.files[file] = exists;
    if (exists) results.summary.passed++;
    else results.summary.failed++;
    results.summary.total++;
  });

  // 2. Verificar directorios
  print('bright', '\n📂 VERIFICANDO DIRECTORIOS');
  print('bright', '==========================');

  const directoriesToCheck = [
    'vegetarian_restaurant_backend/sql',
    'vegetarian_restaurant_backend/src/models',
    'vegetarian_restaurant_backend/src/controllers',
    'vegetarian_restaurant_backend/src/middleware',
    'vegetarian_restaurant_backend/src/routes',
    'menta-resto-system-pro/src/context',
    'menta-resto-system-pro/src/hooks',
    'menta-resto-system-pro/src/services',
    'menta-resto-system-pro/src/components/plans',
    'menta-resto-system-pro/src/tests'
  ];

  directoriesToCheck.forEach(dir => {
    const fullPath = path.join(process.cwd(), dir);
    const exists = checkDirectory(fullPath, dir);
    results.files[dir] = exists;
    if (exists) results.summary.passed++;
    else results.summary.failed++;
    results.summary.total++;
  });

  // 3. Ejecutar pruebas
  print('bright', '\n🧪 EJECUTANDO PRUEBAS');
  print('bright', '====================');

  const testCommands = [
    { command: 'npm test -- --testNamePattern="Plan System Implementation Validation"', description: 'Pruebas de Validación' },
    { command: 'npm test -- --testNamePattern="Plan Integration Tests"', description: 'Pruebas de Integración' },
    { command: 'npm test -- --testNamePattern="Plan Limits Tests"', description: 'Pruebas de Límites' },
    { command: 'npm test -- --testNamePattern="Plan API Tests"', description: 'Pruebas de API' },
    { command: 'npm test -- --testNamePattern="Plan Performance Tests"', description: 'Pruebas de Rendimiento' },
    { command: 'npm test -- --testNamePattern="Plan Security Tests"', description: 'Pruebas de Seguridad' },
    { command: 'npm test -- --testNamePattern="Plan E2E Tests"', description: 'Pruebas E2E' }
  ];

  testCommands.forEach(test => {
    const result = runCommand(test.command, test.description);
    results.tests[test.description] = result;
    if (result.success) results.summary.passed++;
    else results.summary.failed++;
    results.summary.total++;
  });

  // 4. Verificar package.json
  print('bright', '\n📦 VERIFICANDO DEPENDENCIAS');
  print('bright', '===========================');

  const packageJsonPath = path.join(process.cwd(), 'menta-resto-system-pro/package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const testDeps = [
      '@testing-library/react',
      '@testing-library/jest-dom',
      '@testing-library/user-event',
      'jest',
      'jest-environment-jsdom'
    ];

    testDeps.forEach(dep => {
      if (packageJson.devDependencies && packageJson.devDependencies[dep]) {
        print('green', `✅ ${dep} está instalado`);
      } else {
        print('red', `❌ ${dep} no está instalado`);
      }
    });
  }

  // 5. Generar reporte
  print('bright', '\n📊 REPORTE FINAL');
  print('bright', '================');

  const totalFiles = Object.keys(results.files).length;
  const passedFiles = Object.values(results.files).filter(Boolean).length;
  const failedFiles = totalFiles - passedFiles;

  const totalTests = Object.keys(results.tests).length;
  const passedTests = Object.values(results.tests).filter(t => t.success).length;
  const failedTests = totalTests - passedTests;

  print('bright', `\n📁 Archivos: ${passedFiles}/${totalFiles} (${failedFiles} fallos)`);
  print('bright', `🧪 Pruebas: ${passedTests}/${totalTests} (${failedTests} fallos)`);

  if (failedFiles === 0 && failedTests === 0) {
    print('green', '\n🎉 ¡TODAS LAS PRUEBAS PASARON!');
    print('green', '✅ Sistema de Planes implementado correctamente');
  } else {
    print('red', '\n⚠️  ALGUNAS PRUEBAS FALLARON');
    print('yellow', '🔧 Revisa los errores anteriores');
  }

  // 6. Guardar reporte
  const reportPath = path.join(process.cwd(), 'plan-testing-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  print('cyan', `\n📄 Reporte guardado en: ${reportPath}`);

  // 7. Instrucciones finales
  print('bright', '\n📋 PRÓXIMOS PASOS');
  print('bright', '==================');
  print('white', '1. Revisa el reporte de pruebas');
  print('white', '2. Ejecuta las pruebas manuales del archivo plan-manual-testing.md');
  print('white', '3. Verifica la base de datos con los scripts SQL');
  print('white', '4. Prueba la API con los endpoints documentados');
  print('white', '5. Verifica la UI en el navegador');

  print('bright', '\n🔗 COMANDOS ÚTILES');
  print('bright', '==================');
  print('white', '• Ejecutar todas las pruebas: npm test');
  print('white', '• Ejecutar con cobertura: npm test -- --coverage');
  print('white', '• Verificar base de datos: psql -d database -f sql/ejecutar_sistema_planes.sql');
  print('white', '• Iniciar servidor: npm start');
  print('white', '• Iniciar frontend: npm run dev');

  return results;
}

// Ejecutar si es llamado directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main, runCommand, checkFile, checkDirectory };
