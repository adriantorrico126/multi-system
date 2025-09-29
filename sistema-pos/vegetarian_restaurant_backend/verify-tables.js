const { Pool } = require('pg');

// Configuración de la base de datos
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'vegetarian_restaurant',
  password: 'postgres', // Cambia por tu contraseña
  port: 5432,
});

async function verifyTables() {
  console.log('🔍 Verificando tablas específicas...\n');
  
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
    
  } catch (error) {
    console.error('❌ Error durante la verificación:', error);
  } finally {
    await pool.end();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  verifyTables();
}

module.exports = { verifyTables };

