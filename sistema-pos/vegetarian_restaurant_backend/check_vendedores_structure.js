const { Pool } = require('pg');

// Configuración de la base de datos
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'sistempos',
  user: 'postgres',
  password: '69512310Anacleta'
});

async function checkVendedoresStructure() {
  const client = await pool.connect();
  try {
    console.log('🔍 Verificando estructura de la tabla vendedores...');
    
    // Verificar si la tabla vendedores existe
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'vendedores'
      );
    `);
    
    if (!tableExists.rows[0].exists) {
      console.log('❌ La tabla vendedores no existe');
      return;
    }
    
    console.log('✅ Tabla vendedores existe');
    
    // Verificar la estructura actual
    const structure = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'vendedores'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Estructura actual de vendedores:');
    structure.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    // Verificar si existe la columna id_mesero
    const hasIdMesero = structure.rows.some(col => col.column_name === 'id_mesero');
    
    if (!hasIdMesero) {
      console.log('\n🔧 Agregando columna id_mesero a vendedores...');
      await client.query(`
        ALTER TABLE vendedores ADD COLUMN id_mesero INTEGER;
      `);
      console.log('✅ Columna id_mesero agregada');
    } else {
      console.log('\n✅ La columna id_mesero ya existe');
    }
    
    // Verificar si existe la columna rol
    const hasRol = structure.rows.some(col => col.column_name === 'rol');
    
    if (!hasRol) {
      console.log('\n🔧 Agregando columna rol a vendedores...');
      await client.query(`
        ALTER TABLE vendedores ADD COLUMN rol VARCHAR(50) DEFAULT 'vendedor';
      `);
      console.log('✅ Columna rol agregada');
    } else {
      console.log('\n✅ La columna rol ya existe');
    }
    
    // Actualizar algunos registros para tener meseros
    console.log('\n🔧 Actualizando registros para crear meseros...');
    await client.query(`
      UPDATE vendedores 
      SET rol = 'mesero', id_mesero = id_vendedor 
      WHERE id_vendedor IN (1, 2, 3)
      ON CONFLICT DO NOTHING;
    `);
    
    // Verificar registros actualizados
    const meseros = await client.query(`
      SELECT id_vendedor, nombre, username, rol, id_mesero
      FROM vendedores 
      WHERE rol = 'mesero'
    `);
    
    console.log('\n📋 Meseros disponibles:');
    meseros.rows.forEach(mesero => {
      console.log(`  - ID: ${mesero.id_vendedor}, Nombre: ${mesero.nombre}, Username: ${mesero.username}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    client.release();
  }
  await pool.end();
}

// Ejecutar si se llama directamente
if (require.main === module) {
  checkVendedoresStructure()
    .then(() => {
      console.log('✅ Verificación completada');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error:', error);
      process.exit(1);
    });
}

module.exports = { checkVendedoresStructure }; 