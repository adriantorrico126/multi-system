const { Pool } = require('pg');
const envConfig = require('./src/config/envConfig');

console.log('🔍 Configuración de DB:');
console.log('User:', envConfig.DB_USER);
console.log('Host:', envConfig.DB_HOST);
console.log('Database:', envConfig.DB_NAME);
console.log('Port:', envConfig.DB_PORT);

const pool = new Pool({
  user: envConfig.DB_USER,
  host: envConfig.DB_HOST,
  database: envConfig.DB_NAME,
  password: envConfig.DB_PASSWORD,
  port: envConfig.DB_PORT,
  ssl: false,
  connectionTimeoutMillis: 5000
});

async function testDbConnection() {
  try {
    console.log('🔍 Probando conexión a la base de datos...');
    
    const client = await pool.connect();
    console.log('✅ Conexión exitosa');
    
    const result = await client.query('SELECT COUNT(*) FROM contadores_uso WHERE id_restaurante = 1');
    console.log('Contadores del restaurante 1:', result.rows[0].count);
    
    client.release();
    
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
  } finally {
    await pool.end();
  }
}

testDbConnection();
