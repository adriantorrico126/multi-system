const fs = require('fs');
const path = require('path');
const { pool } = require('./src/config/database');

async function createModificadoresTables() {
  try {
    console.log('🔧 Creando tablas de modificadores...');
    
    // Leer el archivo SQL
    const sqlPath = path.join(__dirname, 'create_modificadores_tables.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Ejecutar el SQL
    await pool.query(sqlContent);
    
    console.log('✅ Tablas de modificadores creadas exitosamente');
    
    // Verificar que las tablas se crearon
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%modificador%'
    `);
    
    console.log('📋 Tablas de modificadores encontradas:', tablesResult.rows.map(r => r.table_name));
    
    // Verificar que hay datos de ejemplo
    const modificadoresResult = await pool.query(`
      SELECT COUNT(*) as total 
      FROM productos_modificadores
    `);
    
    console.log(`📊 Modificadores de ejemplo creados: ${modificadoresResult.rows[0].total}`);
    
  } catch (error) {
    console.error('❌ Error creando tablas de modificadores:', error);
  } finally {
    await pool.end();
  }
}

createModificadoresTables(); 