const db = require('./src/config/database');

async function checkStockDirect() {
  try {
    console.log('🔍 Verificando stock directamente en la base de datos...\n');
    
    // Verificar stock actual
    const { rows } = await db.query('SELECT id_producto, nombre, stock_actual FROM productos WHERE id_producto = 93');
    console.log('Stock actual del producto 93:', rows[0]);
    
    // Verificar la última venta registrada
    const ventaResult = await db.query('SELECT id_venta, fecha, total FROM ventas ORDER BY id_venta DESC LIMIT 1');
    console.log('\nÚltima venta registrada:', ventaResult.rows[0]);
    
    // Verificar los detalles de la última venta
    if (ventaResult.rows[0]) {
      const detalleResult = await db.query('SELECT id_producto, cantidad FROM detalle_ventas WHERE id_venta = $1', [ventaResult.rows[0].id_venta]);
      console.log('\nDetalles de la última venta:', detalleResult.rows);
    }
    
    console.log('\n🏁 Verificación completada');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkStockDirect(); 