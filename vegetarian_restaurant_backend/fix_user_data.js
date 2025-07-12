const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'sistempos',
  password: process.env.DB_PASSWORD || 'tu_password',
  port: process.env.DB_PORT || 5432,
});

async function fixUserData() {
  const client = await pool.connect();
  try {
    console.log('🔧 Actualizando datos de usuario...');
    
    // 1. Verificar que existe el restaurante por defecto
    const restauranteResult = await client.query('SELECT id_restaurante FROM restaurantes LIMIT 1');
    if (restauranteResult.rows.length === 0) {
      console.log('❌ No existe restaurante. Creando uno por defecto...');
      await client.query(`
        INSERT INTO restaurantes (nombre, direccion, ciudad, telefono, email)
        VALUES ('Restaurante Principal', 'Dirección Principal', 'Ciudad Principal', '123456789', 'info@restaurante.com')
      `);
    }
    
    const restauranteId = restauranteResult.rows[0]?.id_restaurante || 1;
    console.log(`✅ Usando restaurante ID: ${restauranteId}`);
    
    // 2. Actualizar el usuario admin para incluir id_restaurante
    const updateUserResult = await client.query(`
      UPDATE vendedores 
      SET id_restaurante = $1 
      WHERE username = 'admin'
      RETURNING id_vendedor, nombre, username, rol, id_sucursal, id_restaurante
    `, [restauranteId]);
    
    if (updateUserResult.rows.length > 0) {
      console.log('✅ Usuario admin actualizado con id_restaurante');
      console.log('Datos del usuario:', updateUserResult.rows[0]);
    } else {
      console.log('⚠️ Usuario admin no encontrado');
    }
    
    // 3. Verificar que todas las tablas tienen datos con id_restaurante
    const tables = ['categorias', 'productos', 'vendedores', 'metodos_pago', 'sucursales', 'mesas'];
    
    for (const table of tables) {
      const countResult = await client.query(`SELECT COUNT(*) FROM ${table} WHERE id_restaurante = $1`, [restauranteId]);
      console.log(`✅ Tabla ${table}: ${countResult.rows[0].count} registros con id_restaurante = ${restauranteId}`);
    }
    
    console.log('🎉 Datos de usuario corregidos exitosamente');
    
  } catch (error) {
    console.error('❌ Error durante la corrección:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

fixUserData(); 