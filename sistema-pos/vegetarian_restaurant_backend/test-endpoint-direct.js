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

async function testEndpointDirect() {
  try {
    console.log('🔍 Probando endpoint directamente...');
    
    // Simular exactamente lo que hace el controlador
    const ContadorUsoModel = require('./src/models/ContadorUsoModel');
    const contadorModel = new ContadorUsoModel();
    
    const uso = await contadorModel.getCurrentUsage(1);
    console.log('Resultado de getCurrentUsage:', uso);
    
    if (!uso) {
      console.log('❌ getCurrentUsage devolvió null - esto causaría 404');
    } else {
      console.log('✅ getCurrentUsage devolvió datos válidos');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    pool.end();
  }
}

testEndpointDirect();
















































