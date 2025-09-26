const fs = require('fs');

// Leer el archivo SalesHistory.tsx
const content = fs.readFileSync('sistema-pos/menta-resto-system-pro/src/components/pos/SalesHistory.tsx', 'utf8');

// Buscar específicamente en las líneas 764-766
const lines = content.split('\n');
console.log('=== ANÁLISIS DETALLADO LÍNEAS 764-766 ===');

for (let i = 763; i < 767; i++) {
  if (lines[i]) {
    const line = lines[i];
    console.log(`Línea ${i+1}: "${line}"`);
    console.log(`  Caracteres: ${line.split('').map((c, idx) => `${idx}:${c}`).join(' ')}`);
    
    // Contar paréntesis específicamente
    const openParens = (line.match(/\(/g) || []).length;
    const closeParens = (line.match(/\)/g) || []).length;
    console.log(`  Paréntesis abiertos: ${openParens}, cerrados: ${closeParens}`);
    console.log('');
  }
}

// Buscar el problema específico
console.log('=== BUSCANDO EL PROBLEMA ESPECÍFICO ===');
let parenCount = 0;
let problemFound = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const lineOpenParens = (line.match(/\(/g) || []).length;
  const lineCloseParens = (line.match(/\)/g) || []).length;
  
  parenCount += lineOpenParens - lineCloseParens;
  
  // Si llegamos a +3, hemos encontrado el problema
  if (parenCount === 3 && !problemFound) {
    console.log(`PROBLEMA ENCONTRADO en línea ${i+1}:`);
    console.log(`Línea: "${line}"`);
    console.log(`Balance acumulado: ${parenCount}`);
    problemFound = true;
    break;
  }
}
