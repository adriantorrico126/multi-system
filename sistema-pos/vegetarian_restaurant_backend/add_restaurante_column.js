const db = require('./src/config/database');

async function addRestauranteColumn() {
  try {
    console.log('🔍 Verificando columna id_restaurante en movimientos_inventario...');
    
    // Verificar si la columna existe
    const columnExists = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'movimientos_inventario' 
        AND column_name = 'id_restaurante'
      );
    `);
    
    if (!columnExists.rows[0].exists) {
      console.log('❌ Columna id_restaurante no existe. Agregándola...');
      
      // Agregar la columna
      await db.query(`
        ALTER TABLE movimientos_inventario 
        ADD COLUMN id_restaurante INTEGER NOT NULL DEFAULT 1 
        REFERENCES restaurantes(id_restaurante) ON DELETE CASCADE;
      `);
      
      // Crear índice si no existe
      await db.query(`
        CREATE INDEX IF NOT EXISTS idx_movimientos_inventario_restaurante 
        ON movimientos_inventario(id_restaurante);
      `);
      
      console.log('✅ Columna id_restaurante agregada exitosamente');
    } else {
      console.log('✅ Columna id_restaurante ya existe');
    }
    
    // Verificar la estructura actualizada
    const columns = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'movimientos_inventario' 
      ORDER BY ordinal_position;
    `);
    
    console.log('\n📋 Estructura actualizada de la tabla movimientos_inventario:');
    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });
    
    // Actualizar registros existentes si es necesario
    const count = await db.query('SELECT COUNT(*) as total FROM movimientos_inventario WHERE id_restaurante IS NULL');
    if (parseInt(count.rows[0].total) > 0) {
      console.log(`\n📝 Actualizando ${count.rows[0].total} registros existentes...`);
      await db.query('UPDATE movimientos_inventario SET id_restaurante = 1 WHERE id_restaurante IS NULL');
      console.log('✅ Registros actualizados');
    }
    
    console.log('\n🎉 Verificación completada exitosamente');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

addRestauranteColumn(); 