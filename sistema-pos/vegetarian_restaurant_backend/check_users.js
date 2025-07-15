require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function checkUsers() {
  const client = await pool.connect();
  try {
    console.log('🔍 Verificando usuarios en la base de datos...');
    
    const result = await client.query(`
      SELECT id_vendedor, username, nombre, rol, id_sucursal, id_restaurante
      FROM vendedores 
      ORDER BY id_vendedor
    `);
    
    console.log('📋 Usuarios encontrados:');
    result.rows.forEach(user => {
      console.log(`ID: ${user.id_vendedor}, Username: ${user.username}, Nombre: ${user.nombre}, Rol: ${user.rol}, Sucursal: ${user.id_sucursal}, Restaurante: ${user.id_restaurante}`);
    });
    
    if (result.rows.length === 0) {
      console.log('⚠️ No se encontraron usuarios en la base de datos');
    }
    
  } catch (error) {
    console.error('❌ Error al verificar usuarios:', error);
  } finally {
    client.release();
  }
  await pool.end();
}

checkUsers(); 