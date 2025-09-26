const fs = require('fs');

// Leer el archivo SalesHistory.tsx
const content = fs.readFileSync('sistema-pos/menta-resto-system-pro/src/components/pos/SalesHistory.tsx', 'utf8');

// Buscar paréntesis desbalanceados
const lines = content.split('\n');
let parenCount = 0;
let problemLines = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const lineNum = i + 1;
  
  // Contar paréntesis en esta línea
  let lineOpenParens = (line.match(/\(/g) || []).length;
  let lineCloseParens = (line.match(/\)/g) || []).length;
  
  parenCount += lineOpenParens - lineCloseParens;
  
  // Si hay un desbalance significativo, marcar la línea
  if (Math.abs(parenCount) > 2) {
    problemLines.push({
      line: lineNum,
      content: line.trim(),
      balance: parenCount
    });
  }
}

console.log('=== LÍNEAS CON DESBALANCE DE PARÉNTESIS ===');
problemLines.forEach(p => {
  console.log(`Línea ${p.line} (balance: ${p.balance}): ${p.content.substring(0, 100)}...`);
});

// Buscar específicamente en el área problemática (líneas 1900-1920)
console.log('\n=== ANÁLISIS DETALLADO LÍNEAS 1900-1920 ===');
let localParenCount = 0;
for (let i = 1899; i < 1920; i++) {
  if (lines[i]) {
    const line = lines[i];
    const lineOpenParens = (line.match(/\(/g) || []).length;
    const lineCloseParens = (line.match(/\)/g) || []).length;
    localParenCount += lineOpenParens - lineCloseParens;
    
    console.log(`${i+1}: (${localParenCount}) ${line.trim()}`);
  }
}
