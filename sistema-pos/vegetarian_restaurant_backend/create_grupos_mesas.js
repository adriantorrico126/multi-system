const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuración de la base de datos
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'sistempos',
  user: 'postgres',
  password: '69512310Anacleta'
});

async function createGruposMesas() {
  const client = await pool.connect();
  try {
    console.log('🔧 Creando tabla grupos_mesas...');
    
    // Leer el archivo SQL
    const sqlPath = path.join(__dirname, 'create_grupos_mesas.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Ejecutar el SQL
    await client.query(sqlContent);
    
    console.log('✅ Tabla grupos_mesas creada exitosamente');
    
    // Verificar que las tablas se crearon
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name IN ('grupos_mesas', 'mesas_en_grupo')
      AND table_schema = 'public'
    `);
    
    console.log('📋 Tablas creadas:');
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    // Verificar la estructura de grupos_mesas
    const structureResult = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'grupos_mesas'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Estructura de grupos_mesas:');
    structureResult.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
  } catch (error) {
    console.error('❌ Error al crear grupos_mesas:', error);
    throw error;
  } finally {
    client.release();
  }
  await pool.end();
}

// Ejecutar si se llama directamente
if (require.main === module) {
  createGruposMesas()
    .then(() => {
      console.log('✅ Script completado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error:', error);
      process.exit(1);
    });
}

module.exports = { createGruposMesas }; 