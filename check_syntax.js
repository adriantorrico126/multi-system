const fs = require('fs');

// Leer el archivo SalesHistory.tsx
const content = fs.readFileSync('sistema-pos/menta-resto-system-pro/src/components/pos/SalesHistory.tsx', 'utf8');

// Contar llaves de apertura y cierre
let openBraces = 0;
let closeBraces = 0;
let openParens = 0;
let closeParens = 0;

for (let i = 0; i < content.length; i++) {
  const char = content[i];
  if (char === '{') openBraces++;
  if (char === '}') closeBraces++;
  if (char === '(') openParens++;
  if (char === ')') closeParens++;
}

console.log('=== ANÁLISIS DE SINTAXIS ===');
console.log(`Llaves de apertura { : ${openBraces}`);
console.log(`Llaves de cierre } : ${closeBraces}`);
console.log(`Paréntesis de apertura ( : ${openParens}`);
console.log(`Paréntesis de cierre ) : ${closeParens}`);
console.log(`Diferencia de llaves: ${openBraces - closeBraces}`);
console.log(`Diferencia de paréntesis: ${openParens - closeParens}`);

// Buscar líneas problemáticas alrededor de la línea 1907
const lines = content.split('\n');
console.log('\n=== LÍNEAS ALREDEDOR DE 1907 ===');
for (let i = 1900; i <= 1915; i++) {
  if (lines[i-1]) {
    console.log(`${i}: ${lines[i-1]}`);
  }
}

// Buscar funciones no cerradas
console.log('\n=== BUSCANDO FUNCIONES NO CERRADAS ===');
let functionCount = 0;
let braceCount = 0;
let inFunction = false;
let currentFunction = '';

for (let i = 0; i < content.length; i++) {
  const char = content[i];
  const prevChar = i > 0 ? content[i-1] : '';
  const nextChar = i < content.length - 1 ? content[i+1] : '';
  
  if (char === '{') {
    braceCount++;
    if (prevChar === '=' && nextChar === '>') {
      // Arrow function
      inFunction = true;
      functionCount++;
    }
  }
  
  if (char === '}') {
    braceCount--;
    if (braceCount === 0 && inFunction) {
      inFunction = false;
    }
  }
}

console.log(`Funciones encontradas: ${functionCount}`);
console.log(`Nivel de llaves final: ${braceCount}`);
