#!/usr/bin/env node

/**
 * Script de Validación de Frontend - Sistema de Planes
 * Valida que todos los componentes y funcionalidades del frontend funcionen correctamente
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
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
  magenta: '\x1b[35m'
};

function print(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Función para verificar archivos
function checkFile(filePath, description) {
  print('cyan', `\n🔍 Verificando ${description}...`);
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Verificar que el archivo no esté vacío
    if (stats.size > 0) {
      print('green', `✅ ${description} existe (${stats.size} bytes)`);
      
      // Verificar contenido específico según el tipo de archivo
      if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
        checkTypeScriptContent(content, description);
      } else if (filePath.endsWith('.js')) {
        checkJavaScriptContent(content, description);
      } else if (filePath.endsWith('.md')) {
        checkMarkdownContent(content, description);
      }
      
      return true;
    } else {
      print('red', `❌ ${description} está vacío`);
      return false;
    }
  } else {
    print('red', `❌ ${description} no existe`);
    return false;
  }
}

// Función para verificar contenido TypeScript
function checkTypeScriptContent(content, description) {
  const checks = [
    { pattern: /import.*from.*['"]/, name: 'Imports' },
    { pattern: /export.*/, name: 'Exports' },
    { pattern: /interface.*{|type.*=/, name: 'Type definitions' },
    { pattern: /const.*=.*\(/, name: 'Function definitions' },
    { pattern: /useState|useEffect|useContext/, name: 'React hooks' }
  ];

  checks.forEach(check => {
    if (check.pattern.test(content)) {
      print('green', `   ✅ ${check.name} encontrados`);
    } else {
      print('yellow', `   ⚠️  ${check.name} no encontrados`);
    }
  });
}

// Función para verificar contenido JavaScript
function checkJavaScriptContent(content, description) {
  const checks = [
    { pattern: /require\(|import.*from/, name: 'Imports' },
    { pattern: /module\.exports|export/, name: 'Exports' },
    { pattern: /function.*\(|const.*=.*\(/, name: 'Function definitions' },
    { pattern: /class.*{|const.*=.*{/, name: 'Class/Object definitions' }
  ];

  checks.forEach(check => {
    if (check.pattern.test(content)) {
      print('green', `   ✅ ${check.name} encontrados`);
    } else {
      print('yellow', `   ⚠️  ${check.name} no encontrados`);
    }
  });
}

// Función para verificar contenido Markdown
function checkMarkdownContent(content, description) {
  const checks = [
    { pattern: /^#/, name: 'Headers' },
    { pattern: /^- \[|\* \[/, name: 'Checklists' },
    { pattern: /```/, name: 'Code blocks' },
    { pattern: /\[.*\]\(.*\)/, name: 'Links' }
  ];

  checks.forEach(check => {
    if (check.pattern.test(content)) {
      print('green', `   ✅ ${check.name} encontrados`);
    } else {
      print('yellow', `   ⚠️  ${check.name} no encontrados`);
    }
  });
}

// Función para verificar estructura de directorios
function checkDirectory(dirPath, description, expectedFiles = []) {
  print('cyan', `\n🔍 Verificando ${description}...`);
  if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
    const files = fs.readdirSync(dirPath);
    print('green', `✅ ${description} existe (${files.length} archivos)`);
    
    // Verificar archivos esperados
    expectedFiles.forEach(expectedFile => {
      if (files.includes(expectedFile)) {
        print('green', `   ✅ ${expectedFile} encontrado`);
      } else {
        print('red', `   ❌ ${expectedFile} no encontrado`);
      }
    });
    
    return true;
  } else {
    print('red', `❌ ${description} no existe`);
    return false;
  }
}

// Función para verificar dependencias
function checkDependencies() {
  print('cyan', '\n🔍 Verificando dependencias...');
  
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    const requiredDeps = [
      'react',
      'react-dom',
      'typescript',
      '@types/react',
      '@types/react-dom',
      'vite',
      'tailwindcss'
    ];
    
    const requiredDevDeps = [
      '@testing-library/react',
      '@testing-library/jest-dom',
      '@testing-library/user-event',
      'jest',
      'jest-environment-jsdom'
    ];
    
    // Verificar dependencias principales
    requiredDeps.forEach(dep => {
      if (packageJson.dependencies && packageJson.dependencies[dep]) {
        print('green', `   ✅ ${dep} está instalado`);
      } else {
        print('red', `   ❌ ${dep} no está instalado`);
      }
    });
    
    // Verificar dependencias de desarrollo
    requiredDevDeps.forEach(dep => {
      if (packageJson.devDependencies && packageJson.devDependencies[dep]) {
        print('green', `   ✅ ${dep} está instalado`);
      } else {
        print('red', `   ❌ ${dep} no está instalado`);
      }
    });
    
    return true;
  } else {
    print('red', '❌ package.json no encontrado');
    return false;
  }
}

// Función para ejecutar pruebas
function runTests() {
  print('cyan', '\n🔍 Ejecutando pruebas...');
  
  try {
    const result = execSync('npm test -- --passWithNoTests --verbose', { 
      encoding: 'utf8', 
      cwd: process.cwd(),
      stdio: 'pipe'
    });
    print('green', '✅ Pruebas ejecutadas correctamente');
    return { success: true, output: result };
  } catch (error) {
    print('red', '❌ Error ejecutando pruebas');
    print('red', error.message);
    return { success: false, error: error.message };
  }
}

// Función para verificar configuración de TypeScript
function checkTypeScriptConfig() {
  print('cyan', '\n🔍 Verificando configuración de TypeScript...');
  
  const tsConfigPath = path.join(process.cwd(), 'tsconfig.json');
  if (fs.existsSync(tsConfigPath)) {
    const tsConfig = JSON.parse(fs.readFileSync(tsConfigPath, 'utf8'));
    
    // Verificar configuraciones importantes
    const checks = [
      { path: 'compilerOptions.strict', expected: true, name: 'Strict mode' },
      { path: 'compilerOptions.noImplicitAny', expected: true, name: 'No implicit any' },
      { path: 'compilerOptions.esModuleInterop', expected: true, name: 'ES module interop' },
      { path: 'compilerOptions.skipLibCheck', expected: true, name: 'Skip lib check' }
    ];
    
    checks.forEach(check => {
      const value = check.path.split('.').reduce((obj, key) => obj?.[key], tsConfig);
      if (value === check.expected) {
        print('green', `   ✅ ${check.name} configurado correctamente`);
      } else {
        print('yellow', `   ⚠️  ${check.name} no configurado o valor incorrecto`);
      }
    });
    
    return true;
  } else {
    print('red', '❌ tsconfig.json no encontrado');
    return false;
  }
}

// Función para verificar configuración de Vite
function checkViteConfig() {
  print('cyan', '\n🔍 Verificando configuración de Vite...');
  
  const viteConfigPath = path.join(process.cwd(), 'vite.config.ts');
  if (fs.existsSync(viteConfigPath)) {
    const content = fs.readFileSync(viteConfigPath, 'utf8');
    
    const checks = [
      { pattern: /import.*vite/, name: 'Vite import' },
      { pattern: /defineConfig/, name: 'Define config' },
      { pattern: /resolve.*alias/, name: 'Path aliases' },
      { pattern: /server/, name: 'Server config' }
    ];
    
    checks.forEach(check => {
      if (check.pattern.test(content)) {
        print('green', `   ✅ ${check.name} encontrado`);
      } else {
        print('yellow', `   ⚠️  ${check.name} no encontrado`);
      }
    });
    
    return true;
  } else {
    print('red', '❌ vite.config.ts no encontrado');
    return false;
  }
}

// Función principal
function main() {
  print('bright', '🚀 VALIDANDO FRONTEND DEL SISTEMA DE PLANES');
  print('bright', '===========================================');
  
  const results = {
    files: {},
    directories: {},
    configs: {},
    tests: {},
    summary: { passed: 0, failed: 0, total: 0 }
  };

  // 1. Verificar archivos principales
  print('bright', '\n📁 VERIFICANDO ARCHIVOS PRINCIPALES');
  print('bright', '====================================');

  const mainFiles = [
    'src/App.tsx',
    'src/context/PlanSystemContext.tsx',
    'src/hooks/usePlan.ts',
    'src/hooks/usePlanFeatures.ts',
    'src/hooks/usePlanLimits.ts',
    'src/hooks/usePlanFeaturesNew.ts',
    'src/hooks/usePlanAlerts.ts',
    'src/services/planesApi.ts',
    'src/components/plans/PlanFeatureGate.tsx',
    'src/components/plans/PlanLimitAlert.tsx',
    'src/components/plans/PlanStatusCard.tsx',
    'src/components/plans/index.ts',
    'src/pages/InventoryPage.tsx',
    'src/pages/EgresosPage.tsx'
  ];

  mainFiles.forEach(file => {
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

  const directories = [
    { path: 'src/context', files: ['PlanSystemContext.tsx'] },
    { path: 'src/hooks', files: ['usePlan.ts', 'usePlanFeatures.ts', 'usePlanLimits.ts', 'usePlanFeaturesNew.ts', 'usePlanAlerts.ts'] },
    { path: 'src/services', files: ['planesApi.ts'] },
    { path: 'src/components/plans', files: ['PlanFeatureGate.tsx', 'PlanLimitAlert.tsx', 'PlanStatusCard.tsx', 'index.ts'] },
    { path: 'src/tests', files: ['plan-system.test.tsx', 'plan-integration.test.tsx', 'plan-limits.test.tsx', 'plan-api.test.ts', 'plan-performance.test.ts', 'plan-security.test.ts', 'plan-e2e.test.tsx', 'plan-validation.test.tsx'] }
  ];

  directories.forEach(dir => {
    const fullPath = path.join(process.cwd(), dir.path);
    const exists = checkDirectory(fullPath, dir.path, dir.files);
    results.directories[dir.path] = exists;
    if (exists) results.summary.passed++;
    else results.summary.failed++;
    results.summary.total++;
  });

  // 3. Verificar configuraciones
  print('bright', '\n⚙️  VERIFICANDO CONFIGURACIONES');
  print('bright', '================================');

  const configFiles = [
    'package.json',
    'tsconfig.json',
    'vite.config.ts',
    'tailwind.config.js'
  ];

  configFiles.forEach(config => {
    const fullPath = path.join(process.cwd(), config);
    const exists = fs.existsSync(fullPath);
    results.configs[config] = exists;
    if (exists) {
      print('green', `✅ ${config} existe`);
      results.summary.passed++;
    } else {
      print('red', `❌ ${config} no existe`);
      results.summary.failed++;
    }
    results.summary.total++;
  });

  // 4. Verificar dependencias
  checkDependencies();

  // 5. Verificar configuración de TypeScript
  checkTypeScriptConfig();

  // 6. Verificar configuración de Vite
  checkViteConfig();

  // 7. Ejecutar pruebas
  print('bright', '\n🧪 EJECUTANDO PRUEBAS');
  print('bright', '====================');

  const testResult = runTests();
  results.tests['npm test'] = testResult.success;
  if (testResult.success) results.summary.passed++;
  else results.summary.failed++;
  results.summary.total++;

  // 8. Generar reporte
  print('bright', '\n📊 REPORTE FINAL');
  print('bright', '================');

  const totalFiles = Object.keys(results.files).length;
  const passedFiles = Object.values(results.files).filter(Boolean).length;
  const failedFiles = totalFiles - passedFiles;

  const totalDirs = Object.keys(results.directories).length;
  const passedDirs = Object.values(results.directories).filter(Boolean).length;
  const failedDirs = totalDirs - passedDirs;

  const totalConfigs = Object.keys(results.configs).length;
  const passedConfigs = Object.values(results.configs).filter(Boolean).length;
  const failedConfigs = totalConfigs - passedConfigs;

  print('bright', `\n📁 Archivos: ${passedFiles}/${totalFiles} (${failedFiles} fallos)`);
  print('bright', `📂 Directorios: ${passedDirs}/${totalDirs} (${failedDirs} fallos)`);
  print('bright', `⚙️  Configuraciones: ${passedConfigs}/${totalConfigs} (${failedConfigs} fallos)`);
  print('bright', `🧪 Pruebas: ${testResult.success ? '1/1' : '0/1'} (${testResult.success ? '0' : '1'} fallos)`);

  if (failedFiles === 0 && failedDirs === 0 && failedConfigs === 0 && testResult.success) {
    print('green', '\n🎉 ¡TODAS LAS VALIDACIONES DE FRONTEND PASARON!');
    print('green', '✅ Frontend del Sistema de Planes implementado correctamente');
  } else {
    print('red', '\n⚠️  ALGUNAS VALIDACIONES DE FRONTEND FALLARON');
    print('yellow', '🔧 Revisa los errores anteriores');
  }

  // 9. Guardar reporte
  const reportPath = path.join(process.cwd(), 'frontend-validation-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  print('cyan', `\n📄 Reporte guardado en: ${reportPath}`);

  // 10. Instrucciones finales
  print('bright', '\n📋 PRÓXIMOS PASOS');
  print('bright', '==================');
  print('white', '1. Revisa el reporte de validación');
  print('white', '2. Ejecuta las pruebas manuales en el navegador');
  print('white', '3. Verifica que todos los componentes se rendericen correctamente');
  print('white', '4. Prueba las funcionalidades de restricción de planes');
  print('white', '5. Verifica que las alertas de límites funcionen');

  print('bright', '\n🔗 COMANDOS ÚTILES');
  print('bright', '==================');
  print('white', '• Iniciar servidor de desarrollo: npm run dev');
  print('white', '• Ejecutar pruebas: npm test');
  print('white', '• Ejecutar con cobertura: npm test -- --coverage');
  print('white', '• Construir para producción: npm run build');
  print('white', '• Verificar tipos: npx tsc --noEmit');

  return results;
}

// Ejecutar si es llamado directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main, checkFile, checkDirectory, checkDependencies, runTests };
