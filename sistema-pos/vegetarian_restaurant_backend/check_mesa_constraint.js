const { Pool } = require('pg');

// Usar las credenciales correctas
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'sistempos',
  user: 'postgres',
  password: '69512310Anacleta'
});

async function checkMesaConstraint() {
  try {
    console.log('🔍 Checking mesa constraint...');
    
    // Verificar la restricción check de la tabla mesas
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
    console.log('\n📋 Mesa constraint:');
    if (constraintResult.rows.length > 0) {
      console.log('Constraint name:', constraintResult.rows[0].constraint_name);
      console.log('Constraint definition:', constraintResult.rows[0].constraint_definition);
    } else {
      console.log('No se encontró la restricción mesas_estado_check');
    }

    // Verificar qué valores están permitidos actualmente
    const enumQuery = `
      SELECT unnest(enum_range(NULL::estado_mesa)) as allowed_values;
    `;
    
    try {
      const enumResult = await pool.query(enumQuery);
      console.log('\n📋 Valores permitidos para estado:');
      enumResult.rows.forEach(row => {
        console.log(`  - ${row.allowed_values}`);
      });
    } catch (error) {
      console.log('\n❌ No es un enum, verificando restricción check directamente');
    }

    // Probar diferentes estados para ver cuáles funcionan
    console.log('\n🧪 Testing different states:');
    const testStates = ['libre', 'en_uso', 'pendiente_cobro', 'pagado', 'cerrada', 'abierta'];
    
    for (const estado of testStates) {
      try {
        const testQuery = `
          UPDATE mesas 
          SET estado = $1 
          WHERE id_mesa = 36 
          RETURNING id_mesa, numero, estado;
        `;
        const testResult = await pool.query(testQuery, [estado]);
        console.log(`✅ Estado '${estado}' - FUNCIONA`);
        
        // Revertir el cambio
        await pool.query('UPDATE mesas SET estado = $1 WHERE id_mesa = 36', ['en_uso']);
      } catch (error) {
        console.log(`❌ Estado '${estado}' - NO FUNCIONA: ${error.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Error checking mesa constraint:', error);
    console.error('Error details:', error.message);
  } finally {
    await pool.end();
  }
}

checkMesaConstraint(); 