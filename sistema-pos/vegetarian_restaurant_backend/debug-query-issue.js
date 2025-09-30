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

async function debugQueryIssue() {
  try {
    console.log('🔍 Depurando consulta de getCurrentUsage...');
    
    // Probar la consulta exacta del modelo
    const query = `
      SELECT 
        cu.id_contador,
        cu.id_restaurante,
        cu.id_plan,
        cu.recurso,
        cu.uso_actual,
        cu.limite_plan,
        cu.fecha_medicion,
        cu.created_at,
        cu.updated_at,
        p.nombre as nombre_plan,
        ROUND((cu.uso_actual::DECIMAL / NULLIF(cu.limite_plan, 0)) * 100, 2) as porcentaje_uso
      FROM contadores_uso cu
      JOIN planes p ON cu.id_plan = p.id_plan
      WHERE cu.id_restaurante = $1
      AND (cu.fecha_medicion = CURRENT_DATE OR cu.fecha_medicion IS NULL)
      ORDER BY cu.recurso
      LIMIT 1
    `;
    
    console.log('Ejecutando consulta con parámetro:', 1);
    const result = await pool.query(query, [1]);
    console.log('Filas encontradas:', result.rows.length);
    
    if (result.rows.length > 0) {
      console.log('Primera fila:', result.rows[0]);
    } else {
      console.log('❌ No se encontraron resultados');
      
      // Probar sin JOIN
      const simpleQuery = `
        SELECT *
        FROM contadores_uso
        WHERE id_restaurante = $1
        AND (fecha_medicion = CURRENT_DATE OR fecha_medicion IS NULL)
        ORDER BY recurso
        LIMIT 1
      `;
      
      const simpleResult = await pool.query(simpleQuery, [1]);
      console.log('Sin JOIN - Filas encontradas:', simpleResult.rows.length);
      
      if (simpleResult.rows.length > 0) {
        console.log('Primera fila sin JOIN:', simpleResult.rows[0]);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    pool.end();
  }
}

debugQueryIssue();









