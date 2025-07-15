const db = require('./src/config/database');

async function fixMovimientosTable() {
  try {
    console.log('🔍 Verificando tabla movimientos_inventario...');
    
    // Verificar si la tabla existe
    const tableExists = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'movimientos_inventario'
      );
    `);
    
    if (!tableExists.rows[0].exists) {
      console.log('❌ Tabla movimientos_inventario no existe. Creándola...');
      
      await db.query(`
        CREATE TABLE IF NOT EXISTS movimientos_inventario (
          id_movimiento SERIAL PRIMARY KEY,
          id_restaurante INTEGER NOT NULL REFERENCES restaurantes(id_restaurante) ON DELETE CASCADE,
          id_producto INTEGER REFERENCES productos(id_producto),
          tipo_movimiento VARCHAR(50) NOT NULL,
          cantidad INTEGER NOT NULL,
          stock_anterior INTEGER,
          stock_actual INTEGER,
          fecha_movimiento TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          id_vendedor INTEGER REFERENCES vendedores(id_vendedor)
        );
      `);
      
      // Crear índice
      await db.query(`
        CREATE INDEX IF NOT EXISTS idx_movimientos_inventario_restaurante 
        ON movimientos_inventario(id_restaurante);
      `);
      
      console.log('✅ Tabla movimientos_inventario creada exitosamente');
    } else {
      console.log('✅ Tabla movimientos_inventario ya existe');
    }
    
    // Verificar la estructura de la tabla
    const columns = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'movimientos_inventario' 
      ORDER BY ordinal_position;
    `);
    
    console.log('\n📋 Estructura de la tabla movimientos_inventario:');
    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });
    
    // Verificar si hay datos
    const count = await db.query('SELECT COUNT(*) as total FROM movimientos_inventario');
    console.log(`\n📊 Total de movimientos en la tabla: ${count.rows[0].total}`);
    
    // Crear algunos movimientos de prueba si no hay datos
    if (parseInt(count.rows[0].total) === 0) {
      console.log('\n📝 Creando movimientos de prueba...');
      
      // Obtener algunos productos y vendedores
      const productos = await db.query('SELECT id_producto FROM productos WHERE id_restaurante = 1 LIMIT 3');
      const vendedores = await db.query('SELECT id_vendedor FROM vendedores WHERE id_restaurante = 1 LIMIT 1');
      
      if (productos.rows.length > 0 && vendedores.rows.length > 0) {
        const testMovements = [
          {
            id_producto: productos.rows[0].id_producto,
            tipo_movimiento: 'entrada',
            cantidad: 10,
            stock_anterior: 40,
            stock_actual: 50,
            id_vendedor: vendedores.rows[0].id_vendedor,
            id_restaurante: 1
          },
          {
            id_producto: productos.rows[0].id_producto,
            tipo_movimiento: 'salida',
            cantidad: 5,
            stock_anterior: 50,
            stock_actual: 45,
            id_vendedor: vendedores.rows[0].id_vendedor,
            id_restaurante: 1
          }
        ];
        
        for (const movement of testMovements) {
          await db.query(`
            INSERT INTO movimientos_inventario (id_producto, tipo_movimiento, cantidad, stock_anterior, stock_actual, id_vendedor, id_restaurante)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
          `, [
            movement.id_producto,
            movement.tipo_movimiento,
            movement.cantidad,
            movement.stock_anterior,
            movement.stock_actual,
            movement.id_vendedor,
            movement.id_restaurante
          ]);
        }
        
        console.log('✅ Movimientos de prueba creados');
      }
    }
    
    console.log('\n🎉 Verificación completada exitosamente');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

fixMovimientosTable(); 