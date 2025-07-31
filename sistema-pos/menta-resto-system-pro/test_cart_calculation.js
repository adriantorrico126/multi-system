// Script de prueba para verificar los cálculos del carrito
// Simula el comportamiento del carrito con promociones

console.log('🧮 Prueba de Cálculos del Carrito');
console.log('=====================================\n');

// Simular un producto con promoción
const producto = {
  id: '1',
  name: 'HAMBURGUESA DOÑA ALVINA',
  price: 24.75, // Precio con descuento aplicado
  originalPrice: 33.00, // Precio original
  quantity: 1,
  appliedPromocion: {
    id_promocion: 1,
    nombre: '% Porcentaje A ALVINA',
    tipo: 'porcentaje',
    valor: 25
  }
};

// Simular el carrito
const cartItems = [producto];
const appliedPromociones = [producto.appliedPromocion];

console.log('📋 Producto en el carrito:');
console.log(`- Nombre: ${producto.name}`);
console.log(`- Precio original: Bs ${producto.originalPrice}`);
console.log(`- Precio con descuento: Bs ${producto.price}`);
console.log(`- Cantidad: ${producto.quantity}`);
console.log(`- Promoción aplicada: ${producto.appliedPromocion.nombre} (${producto.appliedPromocion.valor}%)`);
console.log('');

// Calcular subtotal (usando originalPrice)
const subtotal = cartItems.reduce((sum, item) => {
  const originalPrice = item.originalPrice || item.price;
  return sum + (originalPrice * item.quantity);
}, 0);

console.log('💰 Cálculo del Subtotal:');
console.log(`- Subtotal = Bs ${producto.originalPrice} × ${producto.quantity} = Bs ${subtotal.toFixed(2)}`);

// Calcular total (usando price con descuento)
const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

console.log('💳 Cálculo del Total:');
console.log(`- Total = Bs ${producto.price} × ${producto.quantity} = Bs ${total.toFixed(2)}`);

// Calcular descuentos como diferencia
const totalDescuentos = subtotal - total;

console.log('📉 Cálculo de Descuentos:');
console.log(`- Descuentos = Subtotal - Total = Bs ${subtotal.toFixed(2)} - Bs ${total.toFixed(2)} = Bs ${totalDescuentos.toFixed(2)}`);

// Verificar el cálculo manual
const descuentoManual = producto.originalPrice * (producto.appliedPromocion.valor / 100);
console.log('🔍 Verificación Manual:');
console.log(`- Descuento manual = Bs ${producto.originalPrice} × ${producto.appliedPromocion.valor}% = Bs ${descuentoManual.toFixed(2)}`);

console.log('\n✅ Resultados:');
console.log(`- Subtotal: Bs ${subtotal.toFixed(2)}`);
console.log(`- Descuentos: Bs ${totalDescuentos.toFixed(2)}`);
console.log(`- Total Final: Bs ${total.toFixed(2)}`);

// Verificar que los cálculos sean correctos
const esCorrecto = Math.abs(totalDescuentos - descuentoManual) < 0.01;
console.log(`\n🎯 Verificación: ${esCorrecto ? '✅ CORRECTO' : '❌ INCORRECTO'}`);

if (!esCorrecto) {
  console.log('❌ Error en los cálculos detectado!');
  console.log(`- Descuento calculado: Bs ${totalDescuentos.toFixed(2)}`);
  console.log(`- Descuento esperado: Bs ${descuentoManual.toFixed(2)}`);
  console.log(`- Diferencia: Bs ${Math.abs(totalDescuentos - descuentoManual).toFixed(2)}`);
} else {
  console.log('✅ Los cálculos están correctos!');
} 