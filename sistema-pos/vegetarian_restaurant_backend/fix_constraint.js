// =====================================================
// SCRIPT PARA CORREGIR CONSTRAINT DE MESAS
// Ejecutar: node fix_constraint.js
// =====================================================

const { pool } = require('./src/config/database');

async function fixMesaConstraint() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Verificando constraint actual...');
    
    // Verificar constraint actual
    const currentConstraint = await client.query(`
      SELECT conname, pg_get_constraintdef(oid) as definition
      FROM pg_constraint 
      WHERE conrelid = (SELECT oid FROM pg_class WHERE relname = 'mesas')
      AND conname LIKE '%numero%'
    `);
    
    console.log('📋 Constraint actual:', currentConstraint.rows);
    
    // Verificar mesas duplicadas
    const duplicates = await client.query(`
      SELECT numero, id_sucursal, id_restaurante, COUNT(*) as duplicados
      FROM mesas 
      GROUP BY numero, id_sucursal, id_restaurante
      HAVING COUNT(*) > 1
    `);
    
    if (duplicates.rows.length > 0) {
      console.log('⚠️  Mesas duplicadas encontradas:', duplicates.rows);
    } else {
      console.log('✅ No hay mesas duplicadas');
    }
    
    console.log('🛠️  Aplicando corrección...');
    
    await client.query('BEGIN');
    
    // Eliminar constraint problemático
    await client.query('ALTER TABLE mesas DROP CONSTRAINT IF EXISTS mesas_numero_id_sucursal_key');
    console.log('✅ Constraint anterior eliminado');
    
    // Agregar constraint correcto
    await client.query(`
      ALTER TABLE mesas ADD CONSTRAINT mesas_numero_sucursal_restaurante_unique 
      UNIQUE (numero, id_sucursal, id_restaurante)
    `);
    console.log('✅ Nuevo constraint agregado');
    
    // Verificar nuevo constraint
    const newConstraint = await client.query(`
      SELECT conname, pg_get_constraintdef(oid) as definition
      FROM pg_constraint 
      WHERE conrelid = (SELECT oid FROM pg_class WHERE relname = 'mesas')
      AND conname LIKE '%numero%'
    `);
    
    console.log('📋 Nuevo constraint:', newConstraint.rows);
    
    await client.query('COMMIT');
    
    console.log('🎉 ¡Constraint corregido exitosamente!');
    console.log('💡 Ahora puedes registrar ventas sin problemas');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error al corregir constraint:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Ejecutar corrección
fixMesaConstraint()
  .then(() => {
    console.log('✅ Proceso completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
