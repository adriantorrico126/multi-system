require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.POS_DB_USER || 'postgres',
  host: process.env.POS_DB_HOST || 'localhost',
  database: process.env.POS_DB_NAME || 'sistempos',
  password: process.env.POS_DB_PASSWORD || '6951230Anacleta',
  port: process.env.POS_DB_PORT || 5432,
});

async function verificarTablas() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Verificando tablas existentes...\n');
    
    // Obtener todas las tablas
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;
    
    const result = await client.query(tablesQuery);
    
    console.log('📋 Tablas encontradas:');
    result.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.table_name}`);
    });
    
    console.log(`\n✅ Total: ${result.rows.length} tablas`);
    
    // Verificar tablas específicas que necesitamos
    const tablasNecesarias = ['usuarios', 'restaurantes', 'sucursales', 'mesas', 'ventas'];
    console.log('\n🔍 Verificando tablas necesarias para pensionados:');
    
    for (const tabla of tablasNecesarias) {
      const existe = result.rows.some(row => row.table_name === tabla);
      console.log(`  ${existe ? '✅' : '❌'} ${tabla}`);
    }
    
  } catch (error) {
    console.error('❌ Error al verificar tablas:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

verificarTablas()
  .then(() => {
    console.log('\n✅ Verificación completada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error en la verificación:', error);
    process.exit(1);
  });
