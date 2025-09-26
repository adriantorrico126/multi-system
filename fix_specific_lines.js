const fs = require('fs');

// Leer el archivo SalesHistory.tsx
let content = fs.readFileSync('sistema-pos/menta-resto-system-pro/src/components/pos/SalesHistory.tsx', 'utf8');

// Buscar específicamente las líneas problemáticas que identificamos
const lines = content.split('\n');

console.log('=== CORRIGIENDO LÍNEAS ESPECÍFICAS PROBLEMÁTICAS ===');

let corrections = 0;

// Línea 335: productos.map con paréntesis extra
if (lines[334] && lines[334].includes('productos.map')) {
  console.log(`Línea 335 antes: "${lines[334]}"`);
  const correctedLine = lines[334].replace(/productos\.map\(p => `\${p\.name} \(x\${p\.quantity}\)`\)\.join\('\; '\)/, 'productos.map(p => `${p.name} (x${p.quantity})`).join(\'; \')');
  if (correctedLine !== lines[334]) {
    lines[334] = correctedLine;
    corrections++;
    console.log(`Línea 335 después: "${lines[334]}"`);
  }
}

// Línea 764: productos.map con paréntesis extra
if (lines[763] && lines[763].includes('productos.map')) {
  console.log(`Línea 764 antes: "${lines[763]}"`);
  const correctedLine = lines[763].replace(/productos\.map\(p => \{/, 'productos.map(p => {');
  if (correctedLine !== lines[763]) {
    lines[763] = correctedLine;
    corrections++;
    console.log(`Línea 764 después: "${lines[763]}"`);
  }
}

// Buscar otras líneas problemáticas específicas
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('productos.map') && line.includes('(x${p.quantity})')) {
    const lineOpenParens = (line.match(/\(/g) || []).length;
    const lineCloseParens = (line.match(/\)/g) || []).length;
    
    if (lineOpenParens > lineCloseParens) {
      console.log(`Línea ${i+1} problemática: "${line}"`);
      console.log(`  Paréntesis abiertos: ${lineOpenParens}, cerrados: ${lineCloseParens}`);
      
      // Corregir eliminando un paréntesis extra
      const correctedLine = line.replace(/productos\.map\(p => `\${p\.name} \(x\${p\.quantity}\)`\)\.join\('\; '\)/, 'productos.map(p => `${p.name} (x${p.quantity})`).join(\'; \')');
      if (correctedLine !== line) {
        lines[i] = correctedLine;
        corrections++;
        console.log(`  ✅ Corregida: "${correctedLine}"`);
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

