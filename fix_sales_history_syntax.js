const fs = require('fs');
const path = require('path');

// Leer el archivo
const filePath = path.join(__dirname, 'sistema-pos/menta-resto-system-pro/src/components/pos/SalesHistory.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Corregir el paréntesis extra en la línea 2308
content = content.replace(
  /        \)\s*\)\}/g,
  '        )}'
);

// Escribir el archivo corregido
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Archivo SalesHistory.tsx corregido');
