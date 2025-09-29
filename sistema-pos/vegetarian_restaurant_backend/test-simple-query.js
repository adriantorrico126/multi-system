const { Pool } = require('pg');
const envConfig = require('./src/config/envConfig');

const pool = new Pool({
  user: envConfig.DB_USER,
  host: envConfig.DB_HOST,
  database: envConfig.DB_NAME,
  password: envConfig.DB_PASSWORD,
  port: envConfig.DB_PORT,
  ssl: false,
  connectionTimeoutMillis: 2000
});

async function testSimpleQuery() {
  try {
    console.log('🔍 Probando consulta simple...');
    
    // Consulta simple sin JOIN
    const simpleQuery = `
      SELECT *
      FROM contadores_uso
      WHERE id_restaurante = $1
      AND (fecha_medicion = CURRENT_DATE OR fecha_medicion IS NULL)
      ORDER BY recurso
      LIMIT 1
    `;
    
    const result = await pool.query(simpleQuery, [1]);
    console.log('Filas encontradas:', result.rows.length);
    
    if (result.rows.length > 0) {
      console.log('Primera fila:', result.rows[0]);
    } else {
      console.log('❌ No se encontraron contadores');
      
      // Verificar todos los contadores del restaurante 1
      const allQuery = 'SELECT * FROM contadores_uso WHERE id_restaurante = 1';
      const allResult = await pool.query(allQuery);
      console.log('Todos los contadores del restaurante 1:', allResult.rows.length);
      
      if (allResult.rows.length > 0) {
        console.log('Primer contador:', allResult.rows[0]);
        console.log('Fecha de medición:', allResult.rows[0].fecha_medicion);
        console.log('Fecha actual:', new Date().toISOString().split('T')[0]);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    pool.end();
  }
}

testSimpleQuery();
