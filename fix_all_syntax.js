const fs = require('fs');

// Leer el archivo SalesHistory.tsx
let content = fs.readFileSync('sistema-pos/menta-resto-system-pro/src/components/pos/SalesHistory.tsx', 'utf8');

// Buscar y corregir TODOS los problemas de paréntesis
const lines = content.split('\n');

console.log('=== CORRIGIENDO TODOS LOS PROBLEMAS DE PARÉNTESIS ===');

let totalOpenParens = 0;
let totalCloseParens = 0;
let corrections = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const lineOpenParens = (line.match(/\(/g) || []).length;
  const lineCloseParens = (line.match(/\)/g) || []).length;
  
  totalOpenParens += lineOpenParens;
  totalCloseParens += lineCloseParens;
  
  // Buscar patrones problemáticos específicos
  if (line.includes('productos.map') && lineOpenParens > 2) {
    console.log(`🔧 Corrigiendo línea ${i+1}: "${line}"`);
    
    // Corregir el patrón específico
    const correctedLine = line.replace(/productos\.map\(p\s*=>\s*\{/, 'productos.map(p => {');
    lines[i] = correctedLine;
    corrections++;
    
    console.log(`   Corregida a: "${correctedLine}"`);
  }
  
  // Buscar otros patrones problemáticos
  if (line.includes('new Set(') && lineOpenParens > 3) {
    console.log(`🔧 Corrigiendo línea ${i+1}: "${line}"`);
    
    // Corregir el patrón específico
    const correctedLine = line.replace(/new Set\(\(/, 'new Set(');
    lines[i] = correctedLine;
    corrections++;
    
    console.log(`   Corregida a: "${correctedLine}"`);
  }
}

console.log(`\n=== RESUMEN ===`);
console.log(`Paréntesis abiertos totales: ${totalOpenParens}`);
console.log(`Paréntesis cerrados totales: ${totalCloseParens}`);
console.log(`Diferencia: ${totalOpenParens - totalCloseParens}`);
console.log(`Correcciones realizadas: ${corrections}`);

// Escribir el archivo corregido
const correctedContent = lines.join('\n');
fs.writeFileSync('sistema-pos/menta-resto-system-pro/src/components/pos/SalesHistory.tsx', correctedContent);

console.log('✅ Archivo corregido y guardado');

