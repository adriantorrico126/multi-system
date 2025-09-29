const { Pool } = require('pg');

// Configuración de la base de datos
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'vegetarian_restaurant',
  password: 'postgres', // Cambia por tu contraseña
  port: 5432,
});

async function checkDatabaseStructure() {
  console.log('🔍 Verificando estructura de la base de datos...\n');
  
  try {
    // Verificar conexión
    await pool.query('SELECT NOW()');
    console.log('✅ Conexión a la base de datos establecida\n');
    
    // Verificar si existe la tabla contadores_uso
    console.log('📋 Verificando tabla contadores_uso...');
    const contadoresExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'contadores_uso'
      );
    `);
    
    if (contadoresExists.rows[0].exists) {
      console.log('  ✅ Tabla contadores_uso existe');
      
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
      console.log('  ❌ Tabla contadores_uso NO existe');
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
    
  } catch (error) {
    console.error('❌ Error durante la verificación:', error);
  } finally {
    await pool.end();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  checkDatabaseStructure();
}

module.exports = { checkDatabaseStructure };
