require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.POS_DB_USER || 'postgres',
  host: process.env.POS_DB_HOST || 'localhost',
  database: process.env.POS_DB_NAME || 'sistempos',
  password: process.env.POS_DB_PASSWORD || '6951230Anacleta',
  port: process.env.POS_DB_PORT || 5432,
});

async function verificarClavesPrimarias() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Verificando claves primarias...\n');
    
    const tablas = ['usuarios', 'restaurantes', 'sucursales', 'mesas', 'ventas'];
    
    for (const tabla of tablas) {
      console.log(`📋 Tabla: ${tabla}`);
      console.log('─'.repeat(50));
      
      const query = `
        SELECT 
          kcu.column_name,
          tc.constraint_name,
          tc.constraint_type
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        WHERE tc.table_name = $1 
          AND tc.table_schema = 'public'
          AND tc.constraint_type IN ('PRIMARY KEY', 'FOREIGN KEY')
        ORDER BY tc.constraint_type, kcu.ordinal_position;
      `;
      
      const result = await client.query(query, [tabla]);
      
      if (result.rows.length === 0) {
        console.log(`❌ No se encontraron constraints en ${tabla}`);
      } else {
        result.rows.forEach(row => {
          console.log(`  ${row.constraint_type}: ${row.column_name} (${row.constraint_name})`);
        });
      }
      
      console.log('');
    }
    
  } catch (error) {
    console.error('❌ Error al verificar claves primarias:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

verificarClavesPrimarias()
  .then(() => {
    console.log('✅ Verificación completada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error en la verificación:', error);
    process.exit(1);
  });


