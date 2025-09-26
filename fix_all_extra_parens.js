const fs = require('fs');

// Leer el archivo SalesHistory.tsx
let content = fs.readFileSync('sistema-pos/menta-resto-system-pro/src/components/pos/SalesHistory.tsx', 'utf8');

// Buscar TODAS las líneas con paréntesis extra
const lines = content.split('\n');

console.log('=== BUSCANDO TODAS LAS LÍNEAS CON PARÉNTESIS EXTRA ===');

let corrections = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const lineOpenParens = (line.match(/\(/g) || []).length;
  const lineCloseParens = (line.match(/\)/g) || []).length;
  
  // Si hay más paréntesis abiertos que cerrados en una línea
  if (lineOpenParens > lineCloseParens && lineOpenParens > 2) {
    console.log(`Línea ${i+1}: "${line}"`);
    console.log(`  Paréntesis abiertos: ${lineOpenParens}, cerrados: ${lineCloseParens}`);
    
    // Buscar patrones específicos y corregirlos
    let correctedLine = line;
    
    // Patrón 1: productos.map con paréntesis extra
    if (line.includes('productos.map') && lineOpenParens > 2) {
      correctedLine = correctedLine.replace(/productos\.map\(p => `\${p\.name} \(x\${p\.quantity}\)`\)\.join\('\; '\)/, 'productos.map(p => `${p.name} (x${p.quantity})`).join(\'; \')');
      if (correctedLine !== line) {
        lines[i] = correctedLine;
        corrections++;
        console.log(`  ✅ Corregida: "${correctedLine}"`);
        continue;
      }
    }
    
    // Patrón 2: new Set con paréntesis extra
    if (line.includes('new Set') && lineOpenParens > 3) {
      correctedLine = correctedLine.replace(/new Set\(\(/, 'new Set(');
      if (correctedLine !== line) {
        lines[i] = correctedLine;
        corrections++;
        console.log(`  ✅ Corregida: "${correctedLine}"`);
        continue;
      }
    }
    
    // Patrón 3: Cualquier línea con paréntesis extra
    if (lineOpenParens > lineCloseParens) {
      // Buscar el primer paréntesis extra y eliminarlo
      let parenCount = 0;
      let newLine = '';
      let foundExtra = false;
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '(') {
          parenCount++;
          if (parenCount > 2 && !foundExtra) {
            // Saltar este paréntesis extra
            foundExtra = true;
            continue;
          }
        }
        newLine += char;
      }
      
      if (foundExtra) {
        lines[i] = newLine;
        corrections++;
        console.log(`  ✅ Corregida (eliminado paréntesis extra): "${newLine}"`);
      }
    }
  }
}

console.log(`\n=== RESUMEN ===`);
console.log(`Correcciones realizadas: ${corrections}`);

// Escribir el archivo corregido
const correctedContent = lines.join('\n');
fs.writeFileSync('sistema-pos/menta-resto-system-pro/src/components/pos/SalesHistory.tsx', correctedContent);

console.log('✅ Archivo corregido y guardado');

// Verificar el balance final
let parenCount = 0;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const lineOpenParens = (line.match(/\(/g) || []).length;
  const lineCloseParens = (line.match(/\)/g) || []).length;
  parenCount += lineOpenParens - lineCloseParens;
}

console.log(`Balance final de paréntesis: ${parenCount}`);

