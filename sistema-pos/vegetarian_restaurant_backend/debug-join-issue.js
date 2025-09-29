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

async function debugJoinIssue() {
  try {
    console.log('🔍 Depurando problema de JOIN...');
    
    // Verificar contadores del restaurante 1
    const contadoresQuery = 'SELECT * FROM contadores_uso WHERE id_restaurante = 1';
    const contadoresResult = await pool.query(contadoresQuery);
    console.log('Contadores del restaurante 1:');
    contadoresResult.rows.forEach(row => {
      console.log(`  - ID: ${row.id_contador}, Plan: ${row.id_plan}, Recurso: ${row.recurso}`);
    });
    
    // Verificar planes disponibles
    const planesQuery = 'SELECT * FROM planes ORDER BY id_plan';
    const planesResult = await pool.query(planesQuery);
    console.log('\nPlanes disponibles:');
    planesResult.rows.forEach(row => {
      console.log(`  - ID: ${row.id_plan}, Nombre: ${row.nombre}`);
    });
    
    // Verificar JOIN específico
    const joinQuery = `
      SELECT 
        cu.id_contador,
        cu.id_plan as contador_plan,
        p.id_plan as plan_id,
        p.nombre as plan_nombre
      FROM contadores_uso cu
      LEFT JOIN planes p ON cu.id_plan = p.id_plan
      WHERE cu.id_restaurante = 1
    `;
    
    const joinResult = await pool.query(joinQuery);
    console.log('\nResultado del JOIN:');
    joinResult.rows.forEach(row => {
      console.log(`  - Contador Plan: ${row.contador_plan}, Plan ID: ${row.plan_id}, Plan Nombre: ${row.plan_nombre}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    pool.end();
  }
}

debugJoinIssue();



