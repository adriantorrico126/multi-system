// Script para probar el cálculo decimal exacto
console.log('🔍 Prueba de Cálculo Decimal Exacto');
console.log('=====================================\n');

// Simular el producto exacto de la imagen
const productoOriginal = {
  id: '1',
  name: 'HAMBURGUESA DOÑA ALVINA',
  price: 33.00, // Precio original
  quantity: 1
};

const promocion = {
  id_promocion: 1,
  nombre: '% Porcentaje A ALVINA',
  tipo: 'porcentaje',
  valor: 25
};

console.log('📋 Datos del producto:');
console.log(`- Nombre: ${productoOriginal.name}`);
console.log(`- Precio original: Bs ${productoOriginal.price}`);
console.log(`- Promoción: ${promocion.nombre} (${promocion.valor}%)`);
console.log('');

// Calcular el precio con descuento (como en addToCart)
const precioOriginal = productoOriginal.price;
const newPrice = precioOriginal * (1 - promocion.valor / 100);

console.log('🧮 Cálculo del descuento:');
console.log(`- Precio original: Bs ${precioOriginal}`);
console.log(`- Porcentaje de descuento: ${promocion.valor}%`);
console.log(`- Fórmula: Bs ${precioOriginal} × (1 - ${promocion.valor}/100)`);
console.log(`- Fórmula: Bs ${precioOriginal} × (1 - ${promocion.valor/100})`);
console.log(`- Fórmula: Bs ${precioOriginal} × ${1 - promocion.valor/100}`);
console.log(`- Resultado: Bs ${newPrice}`);
console.log(`- Resultado con 2 decimales: Bs ${newPrice.toFixed(2)}`);
console.log(`- Resultado con 4 decimales: Bs ${newPrice.toFixed(4)}`);
console.log('');

// Verificar si hay problemas de precisión
const descuentoCalculado = precioOriginal * (promocion.valor / 100);
const precioConDescuento = precioOriginal - descuentoCalculado;

console.log('🔍 Verificación paso a paso:');
console.log(`- Descuento: Bs ${precioOriginal} × ${promocion.valor}% = Bs ${descuentoCalculado}`);
console.log(`- Precio con descuento: Bs ${precioOriginal} - Bs ${descuentoCalculado} = Bs ${precioConDescuento}`);
console.log(`- Precio con descuento (2 decimales): Bs ${precioConDescuento.toFixed(2)}`);
console.log(`- Precio con descuento (4 decimales): Bs ${precioConDescuento.toFixed(4)}`);
console.log('');

// Verificar si los números coinciden
const esCorrecto = Math.abs(newPrice - precioConDescuento) < 0.0001;
console.log(`✅ Verificación: ${esCorrecto ? 'CORRECTO' : 'INCORRECTO'}`);

if (!esCorrecto) {
  console.log(`❌ Diferencia: ${Math.abs(newPrice - precioConDescuento)}`);
}

// Probar con diferentes métodos de redondeo
console.log('\n🎯 Diferentes métodos de redondeo:');
console.log(`- Math.round(): Bs ${Math.round(newPrice * 100) / 100}`);
console.log(`- toFixed(2): Bs ${newPrice.toFixed(2)}`);
console.log(`- parseFloat(toFixed(2)): Bs ${parseFloat(newPrice.toFixed(2))}`);

// Verificar si el problema está en la visualización
const precioParaMostrar = parseFloat(newPrice.toFixed(2));
console.log(`\n📱 Precio para mostrar en UI: Bs ${precioParaMostrar}`);

// Simular el cálculo del carrito
const subtotal = precioOriginal * productoOriginal.quantity;
const total = newPrice * productoOriginal.quantity;
const descuentos = subtotal - total;

console.log('\n🛒 Cálculo del carrito:');
console.log(`- Subtotal: Bs ${subtotal.toFixed(2)}`);
console.log(`- Total: Bs ${total.toFixed(2)}`);
console.log(`- Descuentos: Bs ${descuentos.toFixed(2)}`);
console.log(`- Total Final: Bs ${total.toFixed(2)}`); 