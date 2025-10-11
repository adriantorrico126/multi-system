const { Pool } = require('pg');

// Configuración de la base de datos real
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'sistempos',
  password: '6951230Anacleta',
  port: 5432,
});

async function checkSistemposDB() {
  console.log('🔍 Verificando base de datos sistempos...\n');
  
  try {
    // Verificar conexión
    await pool.query('SELECT NOW()');
    console.log('✅ Conexión a la base de datos sistempos establecida\n');
    
    // Verificar si existe la tabla contadores_uso
    console.log('📋 Verificando tabla contadores_uso...');
    const contadoresExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'contadores_uso'
      );
    `);
    
    console.log('  Existe contadores_uso:', contadoresExists.rows[0].exists);
    
    if (contadoresExists.rows[0].exists) {
      // Verificar estructura
      const contadoresStructure = await pool.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'contadores_uso'
        ORDER BY ordinal_position;
      `);
      
      console.log('  📋 Columnas de contadores_uso:');
      contadoresStructure.rows.forEach(row => {
        console.log(`    • ${row.column_name}: ${row.data_type} ${row.is_nullable === 'YES' ? '(nullable)' : '(not null)'}`);
      });
    } else {
      console.log('  ❌ Tabla contadores_uso NO existe en sistempos');
    }
    
    // Verificar estructura de alertas_limites
    console.log('\n📋 Verificando tabla alertas_limites...');
    const alertasStructure = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'alertas_limites'
      ORDER BY ordinal_position;
    `);
    
    console.log('  📋 Columnas de alertas_limites:');
    alertasStructure.rows.forEach(row => {
      console.log(`    • ${row.column_name}: ${row.data_type} ${row.is_nullable === 'YES' ? '(nullable)' : '(not null)'}`);
    });
    
    // Verificar si existe la columna nivel_urgencia
    const nivelUrgenciaExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'alertas_limites'
        AND column_name = 'nivel_urgencia'
      );
    `);
    
    console.log('  Existe nivel_urgencia:', nivelUrgenciaExists.rows[0].exists);
    
    // Verificar estructura de suscripciones
    console.log('\n📋 Verificando tabla suscripciones...');
    const suscripcionesStructure = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'suscripciones'
      ORDER BY ordinal_position;
    `);
    
    console.log('  📋 Columnas de suscripciones:');
    suscripcionesStructure.rows.forEach(row => {
      console.log(`    • ${row.column_name}: ${row.data_type} ${row.is_nullable === 'YES' ? '(nullable)' : '(not null)'}`);
    });
    
    // Verificar estructura de planes
    console.log('\n📋 Verificando tabla planes...');
    const planesStructure = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'planes'
      ORDER BY ordinal_position;
    `);
    
    console.log('  📋 Columnas de planes:');
    planesStructure.rows.forEach(row => {
      console.log(`    • ${row.column_name}: ${row.data_type} ${row.is_nullable === 'YES' ? '(nullable)' : '(not null)'}`);
    });
    
    // Verificar datos existentes
    console.log('\n📋 Verificando datos existentes...');
    const alertasCount = await pool.query('SELECT COUNT(*) FROM alertas_limites');
    const contadoresCount = await pool.query('SELECT COUNT(*) FROM contadores_uso');
    const planesCount = await pool.query('SELECT COUNT(*) FROM planes');
    const suscripcionesCount = await pool.query('SELECT COUNT(*) FROM suscripciones');
    
    console.log('  alertas_limites:', alertasCount.rows[0].count, 'registros');
    console.log('  contadores_uso:', contadoresCount.rows[0].count, 'registros');
    console.log('  planes:', planesCount.rows[0].count, 'registros');
    console.log('  suscripciones:', suscripcionesCount.rows[0].count, 'registros');
    
  } catch (error) {
    console.error('❌ Error durante la verificación:', error);
  } finally {
    await pool.end();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  checkSistemposDB();
}

module.exports = { checkSistemposDB };








































