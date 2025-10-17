require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.POS_DB_USER || 'postgres',
  host: process.env.POS_DB_HOST || 'localhost',
  database: process.env.POS_DB_NAME || 'sistempos',
  password: process.env.POS_DB_PASSWORD || '6951230Anacleta',
  port: process.env.POS_DB_PORT || 5432,
});

async function verificarEstructuraTablas() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Verificando estructura de tablas necesarias...\n');
    
    const tablas = ['usuarios', 'restaurantes', 'sucursales', 'mesas', 'ventas'];
    
    for (const tabla of tablas) {
      console.log(`📋 Tabla: ${tabla}`);
      console.log('─'.repeat(50));
      
      const query = `
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = $1 AND table_schema = 'public'
        ORDER BY ordinal_position;
      `;
      
      const result = await client.query(query, [tabla]);
      
      if (result.rows.length === 0) {
        console.log(`❌ Tabla ${tabla} no encontrada`);
      } else {
        result.rows.forEach(row => {
          console.log(`  ${row.column_name} (${row.data_type}) ${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
        });
      }
      
      console.log('');
    }
    
  } catch (error) {
    console.error('❌ Error al verificar estructura:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

verificarEstructuraTablas()
  .then(() => {
    console.log('✅ Verificación completada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error en la verificación:', error);
    process.exit(1);
  });


