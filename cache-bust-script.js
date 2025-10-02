#!/usr/bin/env node

/**
 * Script para generar version hash única para cache busting
 * Ejecutar antes de cada deploy: node cache-bust-script.js
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Generar hash único basado en timestamp y contenido de archivos críticos
function generateVersionHash() {
  const timestamp = Date.now().toString();
  const packageContent = fs.readFileSync('./package.json', 'utf8');
  const viteConfigContent = fs.readFileSync('./vite.config.ts', 'utf8');
  
  const hash = crypto
    .createHash('md5')
    .update(timestamp + packageContent + viteConfigContent)
    .digest('hex')
    .substring(0, 8);
    
  return hash;
}

// Actualizar index.html con nueva versión
function updateVersionInHTML(version) {
  const indexPath = './index.html';
  let htmlContent = fs.readFileSync(indexPath, 'utf8');
  
  // Reemplazar la versión existente
  htmlContent = htmlContent.replace(
    /const currentVersion = ['"](.*?)['"]/,
    `const currentVersion = '${version}'`
  );
  
  fs.writeFileSync(indexPath, htmlContent);
  console.log(`✅ Versión actualizada a: ${version}`);
}

// Actualizar package.json con nueva versión
function updatePackageVersion(version) {
  const packagePath = './package.json';
  const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  packageContent.version = version;
  
  fs.writeFileSync(packagePath, JSON.stringify(packageContent, null, 2));
  console.log(`✅ Package.json actualizado a versión: ${version}`);
}

// Función principal
function main() {
  const version = generateVersionHash();
  
  console.log('🚀 Generando nueva versión para cache busting...');
  console.log(`📦 Nueva versión: ${version}`);
  
  updateVersionInHTML(version);
  updatePackageVersion(version);
  
  console.log('✅ Cache busting configurado correctamente');
  console.log('💡 Esta versión forzará a los usuarios a descargar la nueva versión');
}

main();
