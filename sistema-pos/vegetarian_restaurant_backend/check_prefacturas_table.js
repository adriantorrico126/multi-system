require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function checkPrefacturasTable() {
  const client = await pool.connect();
  try {
    console.log('🔍 Verificando tabla prefacturas...');
    
    // Verificar si la tabla existe
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'prefacturas'
      );
    `);
    
    if (!tableExists.rows[0].exists) {
      console.log('❌ La tabla prefacturas NO existe');
      return;
    }
    
    console.log('✅ La tabla prefacturas existe');
    
    // Verificar la estructura de la tabla
    const structure = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'prefacturas' 
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Estructura de la tabla prefacturas:');
    structure.rows.forEach(col => {
      console.log(`- ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
    });
    
    // Verificar si existe la columna id_restaurante
    const hasIdRestaurante = structure.rows.some(col => col.column_name === 'id_restaurante');
    console.log(`\n🔍 ¿Tiene columna id_restaurante? ${hasIdRestaurante ? '✅ SÍ' : '❌ NO'}`);
    
    // Si no tiene la columna, agregarla
    if (!hasIdRestaurante) {
      console.log('🔧 Agregando columna id_restaurante...');
      await client.query(`
        ALTER TABLE prefacturas 
        ADD COLUMN id_restaurante INTEGER DEFAULT 1;
      `);
      
      await client.query(`
        UPDATE prefacturas 
        SET id_restaurante = 1 
        WHERE id_restaurante IS NULL;
      `);
      
      await client.query(`
        ALTER TABLE prefacturas 
        ALTER COLUMN id_restaurante SET NOT NULL;
      `);
      
      console.log('✅ Columna id_restaurante agregada correctamente');
    }
    
    // Mostrar algunos registros de ejemplo
    const sampleData = await client.query(`
      SELECT * FROM prefacturas LIMIT 3
    `);
    
    console.log('\n📋 Datos de ejemplo en prefacturas:');
    sampleData.rows.forEach((row, index) => {
      console.log(`Registro ${index + 1}:`, row);
    });
    
  } catch (error) {
    console.error('❌ Error al verificar tabla prefacturas:', error);
  } finally {
    client.release();
  }
  await pool.end();
}

checkPrefacturasTable(); 