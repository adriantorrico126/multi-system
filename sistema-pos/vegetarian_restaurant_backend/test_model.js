const db = require('./src/config/database');
const Venta = require('./src/models/ventaModel');

async function testModel() {
  try {
    console.log('🚀 Probando modelo de venta directamente...\n');

    // 1. Probar creación de venta
    console.log('1. Probando creación de venta...');
    try {
      const venta = await Venta.createVenta({
        id_vendedor: 1,
        id_pago: 1,
        id_sucursal: 4,
        tipo_servicio: 'Mesa',
        total: 12.00,
        mesa_numero: 10
      });
      console.log('✅ Venta creada exitosamente:', venta);
      
      // 2. Probar creación de detalle
      console.log('\n2. Probando creación de detalle...');
      const detalles = await Venta.createDetalleVenta(venta.id_venta, [
        {
          id_producto: 93,
          cantidad: 2,
          precio_unitario: 6.00,
          observaciones: 'Prueba modelo'
        }
      ]);
      console.log('✅ Detalles creados exitosamente:', detalles);
      
    } catch (error) {
      console.error('❌ Error en modelo:', error.message);
    }

    console.log('\n🏁 Prueba completada');

  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

testModel(); 