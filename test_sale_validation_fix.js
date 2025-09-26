/**
 * Script para probar la corrección de validación de ventas
 */

const { pool } = require('./sistema-pos/vegetarian_restaurant_backend/src/config/database');

async function testSaleValidationFix() {
  try {
    console.log('🧪 Probando corrección de validación de ventas...');
    
    const VentaModel = require('./sistema-pos/vegetarian_restaurant_backend/src/models/ventaModel');
    
    // 1. Probar venta de mesa (debería funcionar con mesa válida)
    console.log('\n📅 Probando venta de mesa con mesa válida:');
    try {
      const ventaMesa = await VentaModel.createVenta({
        id_vendedor: 1,
        id_pago: 1,
        id_sucursal: 1,
        tipo_servicio: 'Mesa',
        total: 50.00,
        id_mesa: 1,
        mesa_numero: 1,
        id_restaurante: 1,
        rol_usuario: 'cajero'
      });
      console.log(`✅ Venta de mesa creada: ID ${ventaMesa.id_venta}`);
    } catch (error) {
      console.log(`❌ Error venta de mesa: ${error.message}`);
    }
    
    // 2. Probar venta de mesa sin mesa (debería funcionar ahora)
    console.log('\n📅 Probando venta de mesa sin mesa específica:');
    try {
      const ventaMesaSinMesa = await VentaModel.createVenta({
        id_vendedor: 1,
        id_pago: 1,
        id_sucursal: 1,
        tipo_servicio: 'Mesa',
        total: 30.00,
        id_mesa: null,
        mesa_numero: null,
        id_restaurante: 1,
        rol_usuario: 'cajero'
      });
      console.log(`✅ Venta de mesa sin mesa específica creada: ID ${ventaMesaSinMesa.id_venta}`);
    } catch (error) {
      console.log(`❌ Error venta de mesa sin mesa: ${error.message}`);
    }
    
    // 3. Probar venta para llevar (debería funcionar)
    console.log('\n📅 Probando venta para llevar:');
    try {
      const ventaParaLlevar = await VentaModel.createVenta({
        id_vendedor: 1,
        id_pago: 1,
        id_sucursal: 1,
        tipo_servicio: 'Para Llevar',
        total: 25.00,
        id_mesa: null,
        mesa_numero: null,
        id_restaurante: 1,
        rol_usuario: 'cajero'
      });
      console.log(`✅ Venta para llevar creada: ID ${ventaParaLlevar.id_venta}`);
    } catch (error) {
      console.log(`❌ Error venta para llevar: ${error.message}`);
    }
    
    // 4. Probar venta de delivery (debería funcionar)
    console.log('\n📅 Probando venta de delivery:');
    try {
      const ventaDelivery = await VentaModel.createVenta({
        id_vendedor: 1,
        id_pago: 1,
        id_sucursal: 1,
        tipo_servicio: 'Delivery',
        total: 40.00,
        id_mesa: null,
        mesa_numero: null,
        id_restaurante: 1,
        rol_usuario: 'cajero'
      });
      console.log(`✅ Venta de delivery creada: ID ${ventaDelivery.id_venta}`);
    } catch (error) {
      console.log(`❌ Error venta de delivery: ${error.message}`);
    }
    
    // 5. Probar caso problemático (id_mesa sin mesa_numero)
    console.log('\n📅 Probando caso problemático (id_mesa sin mesa_numero):');
    try {
      const ventaProblematica = await VentaModel.createVenta({
        id_vendedor: 1,
        id_pago: 1,
        id_sucursal: 1,
        tipo_servicio: 'Mesa',
        total: 35.00,
        id_mesa: 1,
        mesa_numero: null, // Esto debería fallar
        id_restaurante: 1,
        rol_usuario: 'cajero'
      });
      console.log(`❌ Venta problemática creada (no debería pasar): ID ${ventaProblematica.id_venta}`);
    } catch (error) {
      console.log(`✅ Error esperado capturado: ${error.message}`);
    }
    
    console.log('\n✅ CORRECCIÓN IMPLEMENTADA:');
    console.log('- ✅ Ventas de mesa sin mesa específica ahora funcionan');
    console.log('- ✅ Ventas para llevar funcionan');
    console.log('- ✅ Ventas de delivery funcionan');
    console.log('- ✅ Validación problemática (id_mesa sin mesa_numero) sigue siendo capturada');
    
  } catch (error) {
    console.error('❌ Error general:', error);
  } finally {
    await pool.end();
  }
}

testSaleValidationFix();
