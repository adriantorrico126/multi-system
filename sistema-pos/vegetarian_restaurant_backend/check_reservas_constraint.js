const { pool } = require('./src/config/database');

async function checkReservasConstraint() {
  try {
    console.log('🔍 Verificando restricción de estados en tabla reservas...');
    
    // Verificar la estructura de la tabla
    const tableInfo = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'reservas' AND column_name = 'estado'
    `);
    
    console.log('📊 Información de la columna estado:', tableInfo.rows);
    
    // Verificar la restricción check
    const constraintInfo = await pool.query(`
      SELECT conname, pg_get_constraintdef(oid) as definition
      FROM pg_constraint 
      WHERE conrelid = 'reservas'::regclass 
      AND contype = 'c'
      AND conname LIKE '%estado%'
    `);
    
    console.log('📊 Restricciones check encontradas:', constraintInfo.rows);
    
    // Verificar estados actuales en la tabla
    const currentStates = await pool.query(`
      SELECT DISTINCT estado FROM reservas
    `);
    
    console.log('📊 Estados actuales en la tabla:', currentStates.rows);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

checkReservasConstraint(); 