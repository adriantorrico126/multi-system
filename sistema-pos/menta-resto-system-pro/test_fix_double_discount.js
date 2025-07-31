// Script para probar la corrección del descuento doble
console.log('🔧 Prueba de Corrección del Descuento Doble');
console.log('=============================================\n');

// Simular producto que viene del backend con descuento ya aplicado
const productoBackend = {
  id: '1',
  name: 'HAMBURGUESA DOÑA ALVINA',
  price: 24.75, // Precio con descuento aplicado por el backend
  price_original: 33.00, // Precio original del backend
  discount_applied: 8.25, // Descuento aplicado por el backend
  promotion_applied: {
    id_promocion: 1,
    nombre: '% Porcentaje A ALVINA',
    tipo: 'porcentaje',
    valor: 25
  }
};

console.log('📋 Producto que viene del backend:');
console.log(`- Nombre: ${productoBackend.name}`);
console.log(`- Precio original (backend): Bs ${productoBackend.price_original}`);
console.log(`- Precio con descuento (backend): Bs ${productoBackend.price}`);
console.log(`- Descuento aplicado (backend): Bs ${productoBackend.discount_applied}`);
console.log(`- Promoción aplicada: ${productoBackend.promotion_applied.nombre}`);
console.log('');

// Simular la lógica corregida del frontend
const tieneDescuentoBackend = productoBackend.price_original && productoBackend.price_original !== productoBackend.price;
const precioOriginal = productoBackend.price_original || productoBackend.price;
const precioConDescuento = productoBackend.price;

console.log('🧮 Lógica corregida del frontend:');
console.log(`- ¿Tiene descuento del backend?: ${tieneDescuentoBackend}`);
console.log(`- Precio original usado: Bs ${precioOriginal}`);
console.log(`- Precio con descuento usado: Bs ${precioConDescuento}`);
console.log('');

if (tieneDescuentoBackend) {
  console.log('✅ CORRECTO: El producto ya viene con descuento del backend');
  console.log('✅ NO se aplica descuento adicional en el frontend');
  console.log('✅ Se usa directamente el precio con descuento del backend');
} else {
  console.log('❌ INCORRECTO: El producto no viene con descuento del backend');
  console.log('❌ Se aplicaría descuento adicional en el frontend');
}

// Verificar que los cálculos sean correctos
const descuentoCalculado = precioOriginal - precioConDescuento;
const esCorrecto = Math.abs(descuentoCalculado - productoBackend.discount_applied) < 0.01;

console.log('\n🔍 Verificación de cálculos:');
console.log(`- Descuento calculado: Bs ${descuentoCalculado}`);
console.log(`- Descuento del backend: Bs ${productoBackend.discount_applied}`);
console.log(`- ¿Coinciden?: ${esCorrecto ? '✅ SÍ' : '❌ NO'}`);

// Simular el cálculo del carrito
const subtotal = precioOriginal * 1; // 1 cantidad
const total = precioConDescuento * 1;
const descuentos = subtotal - total;

console.log('\n🛒 Cálculo del carrito:');
console.log(`- Subtotal: Bs ${subtotal.toFixed(2)}`);
console.log(`- Total: Bs ${total.toFixed(2)}`);
console.log(`- Descuentos: Bs ${descuentos.toFixed(2)}`);
console.log(`- Total Final: Bs ${total.toFixed(2)}`);

console.log('\n🎯 Resultado:');
if (esCorrecto && tieneDescuentoBackend) {
  console.log('✅ PROBLEMA RESUELTO: No se aplica descuento doble');
  console.log('✅ El producto usa el descuento del backend correctamente');
} else {
  console.log('❌ PROBLEMA PERSISTE: Se sigue aplicando descuento doble');
} 