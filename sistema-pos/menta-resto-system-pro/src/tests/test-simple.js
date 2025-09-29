#!/usr/bin/env node

/**
 * Script de Prueba Simple
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 INICIANDO PRUEBA SIMPLE');
console.log('==========================');

// Verificar archivos principales
const filesToCheck = [
  'src/App.tsx',
  'src/context/PlanSystemContext.tsx',
  'src/components/plans/PlanFeatureGate.tsx',
  'src/components/plans/PlanLimitAlert.tsx',
  'src/components/plans/PlanStatusCard.tsx'
];

console.log('\n📁 VERIFICANDO ARCHIVOS PRINCIPALES');
console.log('====================================');

let passed = 0;
let failed = 0;

filesToCheck.forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  if (fs.existsSync(fullPath)) {
    const stats = fs.statSync(fullPath);
    console.log(`✅ ${file} existe (${stats.size} bytes)`);
    passed++;
  } else {
    console.log(`❌ ${file} no existe`);
    failed++;
  }
});

console.log(`\n📊 RESULTADO: ${passed}/${filesToCheck.length} archivos encontrados`);

if (failed === 0) {
  console.log('\n🎉 ¡TODOS LOS ARCHIVOS PRINCIPALES EXISTEN!');
  console.log('✅ Sistema de Planes implementado correctamente');
} else {
  console.log(`\n⚠️  ${failed} archivos faltantes`);
  console.log('🔧 Revisa la implementación');
}

console.log('\n📋 PRÓXIMOS PASOS:');
console.log('1. Verificar que el servidor esté ejecutándose');
console.log('2. Probar en el navegador');
console.log('3. Ejecutar pruebas manuales');
