const { pool } = require('./src/config/database');

async function checkMesasConstraint() {
  try {
    console.log('🔍 Verificando restricción de estados en tabla mesas...');
    
    // Verificar la estructura de la tabla
    const tableInfo = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'mesas' AND column_name = 'estado'
    `);
    
    console.log('📊 Información de la columna estado:', tableInfo.rows);
    
    // Verificar la restricción check
    const constraintInfo = await pool.query(`
      SELECT conname, pg_get_constraintdef(oid) as definition
      FROM pg_constraint 
      WHERE conrelid = 'mesas'::regclass 
      AND contype = 'c'
      AND conname LIKE '%estado%'
    `);
    
    console.log('📊 Restricciones check encontradas:', constraintInfo.rows);
    
    // Verificar estados actuales en la tabla
    const currentStates = await pool.query(`
      SELECT DISTINCT estado FROM mesas
    `);
    
    console.log('📊 Estados actuales en la tabla:', currentStates.rows);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

checkMesasConstraint(); 