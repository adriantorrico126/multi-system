const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'sistempos',
  password: process.env.DB_PASSWORD || 'tu_password',
  port: process.env.DB_PORT || 5432,
});

async function fixConstraints() {
  const client = await pool.connect();
  try {
    console.log('🔗 Corrigiendo restricciones de clave foránea...');
    
    const tables = ['categorias', 'productos', 'vendedores', 'metodos_pago', 'sucursales', 'mesas', 'ventas', 'detalle_ventas'];
    
    for (const table of tables) {
      try {
        // Primero eliminar la restricción si existe
        await client.query(`ALTER TABLE ${table} DROP CONSTRAINT IF EXISTS fk_${table}_restaurante`);
        
        // Crear la restricción correctamente
        await client.query(`
          ALTER TABLE ${table} 
          ADD CONSTRAINT fk_${table}_restaurante 
          FOREIGN KEY (id_restaurante) REFERENCES restaurantes(id_restaurante) ON DELETE CASCADE
        `);
        console.log(`✅ Restricción FK corregida en ${table}`);
      } catch (error) {
        console.log(`⚠️ Error con restricción FK en ${table}: ${error.message}`);
      }
    }
    
    console.log('🎉 Restricciones corregidas exitosamente');
    
  } catch (error) {
    console.error('❌ Error durante la corrección de restricciones:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

fixConstraints(); 