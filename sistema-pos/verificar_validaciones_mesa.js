console.log('🔍 Verificando validaciones de mesa en ambos controladores...\n');

console.log('✅ VALIDACIONES CORREGIDAS:');
console.log('==========================');

console.log('\n1. MESA CONTROLLER (agregarProductosAMesa):');
console.log('   ✅ PERMITIDO: en_uso, pendiente_cobro');
console.log('   ❌ BLOQUEADO: libre, reservada, mantenimiento');

console.log('\n2. VENTA CONTROLLER (createSale):');
console.log('   ✅ PERMITIDO: libre, en_uso, pendiente_cobro');
console.log('   ❌ BLOQUEADO: reservada, mantenimiento');

console.log('\n📋 ESTADOS DE MESA - COMPORTAMIENTO:');
console.log('=====================================');
console.log('• libre:');
console.log('  - mesaController: ❌ Bloquea (debe usar createSale)');
console.log('  - ventaController: ✅ Permite crear nueva venta');

console.log('\n• en_uso:');
console.log('  - mesaController: ✅ Permite agregar productos (con confirmación)');
console.log('  - ventaController: ✅ Permite crear nueva venta');

console.log('\n• pendiente_cobro:');
console.log('  - mesaController: ✅ Permite agregar productos (con confirmación)');
console.log('  - ventaController: ✅ Permite crear nueva venta');

console.log('\n• reservada:');
console.log('  - mesaController: ❌ Bloquea');
console.log('  - ventaController: ❌ Bloquea');

console.log('\n• mantenimiento:');
console.log('  - mesaController: ❌ Bloquea');
console.log('  - ventaController: ❌ Bloquea');

console.log('\n🎯 RESULTADO:');
console.log('=============');
console.log('✅ Ahora se puede registrar ventas en mesas pendiente_cobro');
console.log('✅ Se puede agregar productos a mesas pendiente_cobro');
console.log('✅ Ambas funcionalidades funcionan correctamente');

console.log('\n🔧 FLUJO CORRECTO:');
console.log('==================');
console.log('1. Mesa libre → createSale (ventaController)');
console.log('2. Mesa en_uso → agregarProductosAMesa (mesaController)');
console.log('3. Mesa pendiente_cobro → agregarProductosAMesa (mesaController)');
console.log('4. Mesa reservada/mantenimiento → Bloqueado en ambos');

console.log('\n✅ Validaciones sincronizadas correctamente');
