const fs = require('fs');

// Leer el archivo SalesHistory.tsx
let content = fs.readFileSync('sistema-pos/menta-resto-system-pro/src/components/pos/SalesHistory.tsx', 'utf8');

// Buscar y corregir la línea 335 específicamente
const lines = content.split('\n');

console.log('=== CORRIGIENDO LÍNEA 335 ===');
console.log('Línea 335 antes:', lines[334]);

// El problema está en que hay un paréntesis extra en la línea 335
// Buscar el patrón exacto y corregirlo
const problemLine = lines[334];
const correctedLine = problemLine.replace(/productos\.map\(p => `\${p\.name} \(x\${p\.quantity}\)`\)\.join\('\; '\)/, 'productos.map(p => `${p.name} (x${p.quantity})`).join(\'; \')');

if (correctedLine !== problemLine) {
  lines[334] = correctedLine;
  console.log('Línea 335 después:', lines[334]);
} else {
  // Si no se encontró el patrón, buscar otros patrones problemáticos
  const correctedLine2 = problemLine.replace(/productos\.map\(p => `\${p\.name} \(x\${p\.quantity}\)`\)\.join\('\; '\)/, 'productos.map(p => `${p.name} (x${p.quantity})`).join(\'; \')');
  if (correctedLine2 !== problemLine) {
    lines[334] = correctedLine2;
    console.log('Línea 335 después (patrón 2):', lines[334]);
  } else {
    // Buscar el patrón más simple
    const correctedLine3 = problemLine.replace(/productos\.map\(p => `\${p\.name} \(x\${p\.quantity}\)`\)\.join\('\; '\)/, 'productos.map(p => `${p.name} (x${p.quantity})`).join(\'; \')');
    if (correctedLine3 !== problemLine) {
      lines[334] = correctedLine3;
      console.log('Línea 335 después (patrón 3):', lines[334]);
    } else {
      console.log('No se pudo corregir la línea 335');
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

