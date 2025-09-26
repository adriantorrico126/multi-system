const fs = require('fs');

// Leer el archivo SalesHistory.tsx
let content = fs.readFileSync('sistema-pos/menta-resto-system-pro/src/components/pos/SalesHistory.tsx', 'utf8');

// Buscar y corregir el problema específico en la línea 764
const lines = content.split('\n');

console.log('=== CORRIGIENDO EL PROBLEMA ===');
console.log('Línea 764 antes:', lines[763]);

// El problema está en que hay un paréntesis extra después de "productos.map(p => {"
// Necesitamos encontrar exactamente dónde está el paréntesis extra
const problemLine = lines[763];
const correctedLine = problemLine.replace('productos.map(p => {', 'productos.map(p => {');

// Si no hay cambio, significa que el problema está en otro lugar
if (correctedLine === problemLine) {
  // Buscar el patrón exacto con paréntesis extra
  const fixedLine = problemLine.replace(/productos\.map\(p\s*=>\s*\{/, 'productos.map(p => {');
  lines[763] = fixedLine;
  console.log('Línea 764 después:', lines[763]);
} else {
  lines[763] = correctedLine;
  console.log('Línea 764 después:', lines[763]);
}

// Escribir el archivo corregido
const correctedContent = lines.join('\n');
fs.writeFileSync('sistema-pos/menta-resto-system-pro/src/components/pos/SalesHistory.tsx', correctedContent);

console.log('✅ Archivo corregido');

// Verificar que se corrigió el problema
let parenCount = 0;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const lineOpenParens = (line.match(/\(/g) || []).length;
  const lineCloseParens = (line.match(/\)/g) || []).length;
  parenCount += lineOpenParens - lineCloseParens;
}

console.log(`Balance final de paréntesis: ${parenCount}`);
