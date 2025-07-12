const db = require('./src/config/database');

async function testSimpleVenta() {
  try {
    console.log('🧪 Probando creación simple de venta...');
    
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // 1. Crear venta
      console.log('1. Creando venta...');
      const ventaQuery = `
        INSERT INTO ventas (fecha, id_vendedor, id_pago, id_sucursal, tipo_servicio, total, mesa_numero, estado, id_restaurante)
        VALUES (NOW(), 19, 1, 4, 'Mesa', 30.00, 1, 'recibido', 1)
        RETURNING *
      `;
      
      const ventaResult = await client.query(ventaQuery);
      console.log('✅ Venta creada:', ventaResult.rows[0]);
      
      // 2. Crear detalle de venta
      console.log('2. Creando detalle de venta...');
      const detalleQuery = `
        INSERT INTO detalle_ventas (id_venta, id_producto, cantidad, precio_unitario, observaciones, id_restaurante)
        VALUES ($1, 114, 2, 15.00, 'Test', 1)
        RETURNING *
      `;
      
      const detalleResult = await client.query(detalleQuery, [ventaResult.rows[0].id_venta]);
      console.log('✅ Detalle creado:', detalleResult.rows[0]);
      
      // 3. Actualizar stock
      console.log('3. Actualizando stock...');
      const stockQuery = `
        UPDATE productos 
        SET stock_actual = GREATEST(0, stock_actual - 2) 
        WHERE id_producto = 114 AND id_restaurante = 1
      `;
      
      const stockResult = await client.query(stockQuery);
      console.log('✅ Stock actualizado, filas afectadas:', stockResult.rowCount);
      
      await client.query('COMMIT');
      console.log('✅ Transacción completada exitosamente');
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Error en transacción:', error);
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('❌ Error general:', error);
  } finally {
    await db.pool.end();
  }
}

testSimpleVenta(); 