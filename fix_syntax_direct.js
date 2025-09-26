const fs = require('fs');

// Leer el archivo SalesHistory.tsx
let content = fs.readFileSync('sistema-pos/menta-resto-system-pro/src/components/pos/SalesHistory.tsx', 'utf8');

// Buscar el problema específico
const lines = content.split('\n');

console.log('=== BUSCANDO EL PROBLEMA EXACTO ===');

// Buscar en las líneas problemáticas
for (let i = 760; i < 770; i++) {
  if (lines[i]) {
    const line = lines[i];
    console.log(`Línea ${i+1}: "${line}"`);
    
    // Buscar patrones problemáticos
    if (line.includes('productos.map')) {
      console.log('  ⚠️  Línea con productos.map encontrada');
      
      // Verificar si hay paréntesis extra
      const openParens = (line.match(/\(/g) || []).length;
      const closeParens = (line.match(/\)/g) || []).length;
      console.log(`  Paréntesis abiertos: ${openParens}, cerrados: ${closeParens}`);
      
      // Si hay más de 2 paréntesis abiertos, hay un problema
      if (openParens > 2) {
        console.log('  🔧 CORRIGIENDO: Eliminando paréntesis extra');
        
        // Corregir la línea eliminando el paréntesis extra
        const correctedLine = line.replace(/productos\.map\(p\s*=>\s*\{/, 'productos.map(p => {');
        lines[i] = correctedLine;
        console.log(`  Línea corregida: "${correctedLine}"`);
      }
    }
  }
}

// Escribir el archivo corregido
const correctedContent = lines.join('\n');
fs.writeFileSync('sistema-pos/menta-resto-system-pro/src/components/pos/SalesHistory.tsx', correctedContent);

console.log('✅ Archivo corregido');

// Verificar el balance final
let parenCount = 0;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const lineOpenParens = (line.match(/\(/g) || []).length;
  const lineCloseParens = (line.match(/\)/g) || []).length;
  parenCount += lineOpenParens - lineCloseParens;
}

console.log(`Balance final de paréntesis: ${parenCount}`);

