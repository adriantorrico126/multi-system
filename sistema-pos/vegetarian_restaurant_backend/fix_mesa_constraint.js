const { Pool } = require('pg');

// Usar las credenciales correctas
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'sistempos',
  user: 'postgres',
  password: '69512310Anacleta'
});

async function fixMesaConstraint() {
  try {
    console.log('🔧 Fixing mesa constraint...');
    
    // Eliminar la restricción actual
    console.log('\n📋 Dropping current constraint...');
    await pool.query('ALTER TABLE mesas DROP CONSTRAINT IF EXISTS mesas_estado_check');
    console.log('✅ Constraint dropped successfully');
    
    // Crear la nueva restricción que incluye 'pagado'
    console.log('\n📋 Creating new constraint with "pagado" state...');
    await pool.query(`
      ALTER TABLE mesas ADD CONSTRAINT mesas_estado_check 
      CHECK (estado IN ('libre', 'en_uso', 'pendiente_cobro', 'reservada', 'mantenimiento', 'ocupada_por_grupo', 'pagado'))
    `);
    console.log('✅ New constraint created successfully');
    
    // Verificar que la restricción se creó correctamente
    console.log('\n📋 Verifying new constraint...');
    const constraintQuery = `
      SELECT 
        conname as constraint_name,
        pg_get_constraintdef(oid) as constraint_definition
      FROM pg_constraint 
      WHERE conrelid = 'mesas'::regclass 
        AND contype = 'c'
        AND conname = 'mesas_estado_check';
    `;
    
    const constraintResult = await pool.query(constraintQuery);
    if (constraintResult.rows.length > 0) {
      console.log('Constraint name:', constraintResult.rows[0].constraint_name);
      console.log('Constraint definition:', constraintResult.rows[0].constraint_definition);
    }
    
    // Probar que el estado 'pagado' ahora funciona
    console.log('\n🧪 Testing "pagado" state...');
    const testQuery = `
      UPDATE mesas 
      SET estado = 'pagado' 
      WHERE id_mesa = 36 
      RETURNING id_mesa, numero, estado;
    `;
    
    const testResult = await pool.query(testQuery);
    console.log('✅ Estado "pagado" funciona correctamente');
    console.log('Mesa actualizada:', testResult.rows[0]);
    
    // Revertir el cambio de prueba
    await pool.query('UPDATE mesas SET estado = $1 WHERE id_mesa = 36', ['en_uso']);
    console.log('✅ Cambio revertido');
    
    console.log('\n🎉 Mesa constraint fixed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing mesa constraint:', error);
    console.error('Error details:', error.message);
  } finally {
    await pool.end();
  }
}

fixMesaConstraint(); 