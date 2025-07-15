const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'sistempos',
  password: process.env.DB_PASSWORD || 'tu_password',
  port: process.env.DB_PORT || 5432,
});

async function checkMigration() {
  const client = await pool.connect();
  try {
    console.log('🔍 Verificando migración multi-tenancy...');
    
    // Verificar tabla restaurantes
    const restaurantesResult = await client.query('SELECT COUNT(*) FROM restaurantes');
    console.log(`✅ Tabla restaurantes: ${restaurantesResult.rows[0].count} registros`);
    
    // Verificar columnas id_restaurante
    const tables = ['categorias', 'productos', 'vendedores', 'metodos_pago', 'sucursales', 'mesas', 'ventas', 'detalle_ventas'];
    
    for (const table of tables) {
      try {
        const result = await client.query(`SELECT COUNT(*) FROM ${table} WHERE id_restaurante IS NOT NULL`);
        console.log(`✅ Tabla ${table}: ${result.rows[0].count} registros con id_restaurante`);
      } catch (error) {
        console.log(`❌ Error en tabla ${table}: ${error.message}`);
      }
    }
    
    // Verificar restricciones
    const constraintsResult = await client.query(`
      SELECT constraint_name, table_name 
      FROM information_schema.table_constraints 
      WHERE constraint_name LIKE '%restaurante%'
    `);
    console.log(`✅ Restricciones encontradas: ${constraintsResult.rows.length}`);
    
    console.log('🎉 Verificación completada');
    
  } catch (error) {
    console.error('❌ Error durante la verificación:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkMigration(); 