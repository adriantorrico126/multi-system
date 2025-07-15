require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function initDatabase() {
  const client = await pool.connect();
  try {
    console.log('🔧 Inicializando base de datos...');
    
    // Crear tabla prefacturas si no existe
    await client.query(`
      CREATE TABLE IF NOT EXISTS prefacturas (
          id_prefactura SERIAL PRIMARY KEY,
          id_restaurante INTEGER NOT NULL DEFAULT 1,
          id_mesa INTEGER,
          id_venta_principal INTEGER,
          total_acumulado DECIMAL(10,2) DEFAULT 0,
          estado VARCHAR(20) DEFAULT 'abierta' CHECK (estado IN ('abierta', 'cerrada', 'facturada')),
          fecha_apertura TIMESTAMP DEFAULT NOW(),
          fecha_cierre TIMESTAMP,
          observaciones TEXT,
          created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    console.log('✅ Tabla prefacturas creada/verificada');
    
    // Verificar que la tabla se creó correctamente
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'prefacturas' 
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Estructura de la tabla prefacturas:');
    result.rows.forEach(col => {
      console.log(`- ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    console.log('✅ Base de datos inicializada correctamente');
    
  } catch (error) {
    console.error('❌ Error al inicializar la base de datos:', error);
    throw error;
  } finally {
    client.release();
  }
  await pool.end();
}

initDatabase(); 