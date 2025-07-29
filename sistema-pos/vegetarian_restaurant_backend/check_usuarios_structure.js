const { pool } = require('./src/config/database');

async function checkUsuariosStructure() {
  try {
    console.log('=== CHECKING USUARIOS TABLE STRUCTURE ===');
    
    // Verificar la estructura de la tabla usuarios
    const structureRes = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'usuarios'
      ORDER BY ordinal_position
    `);
    
    console.log('Columnas de la tabla usuarios:');
    structureRes.rows.forEach(col => {
      console.log(`- ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`);
    });
    
    // Verificar algunos registros de ejemplo
    const sampleRes = await pool.query('SELECT * FROM usuarios LIMIT 3');
    console.log('\nRegistros de ejemplo:');
    sampleRes.rows.forEach((row, index) => {
      console.log(`Registro ${index + 1}:`, row);
    });
    
    console.log('=== STRUCTURE CHECK COMPLETED ===');
  } catch (error) {
    console.error('Error checking structure:', error);
    console.error('Error stack:', error.stack);
  } finally {
    await pool.end();
  }
}

checkUsuariosStructure(); 