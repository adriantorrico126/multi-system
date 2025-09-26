const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
  user: 'postgres',
  password: '6951230Anacleta',
  host: 'localhost',
  port: 5432,
  database: 'sistempos'
});

async function createTestUser() {
  try {
    console.log('🔍 Creando usuario de prueba para el restaurante 7...\n');

    // Verificar si ya existe un usuario de prueba
    const existingUserQuery = `
      SELECT id_vendedor, username, email
      FROM vendedores 
      WHERE id_restaurante = 7 AND username = 'testuser'
    `;
    const existingResult = await pool.query(existingUserQuery);
    
    if (existingResult.rows.length > 0) {
      console.log('✅ Usuario de prueba ya existe:');
      console.log(`- ID: ${existingResult.rows[0].id_vendedor}`);
      console.log(`- Username: ${existingResult.rows[0].username}`);
      console.log(`- Email: ${existingResult.rows[0].email}`);
      console.log('');
      console.log('🔑 Credenciales de prueba:');
      console.log('- Username: testuser');
      console.log('- Password: 123456');
      return;
    }

    // Crear hash de la contraseña
    const passwordHash = await bcrypt.hash('123456', 10);

    // Obtener una sucursal del restaurante 7
    const sucursalQuery = `
      SELECT id_sucursal FROM sucursales 
      WHERE id_restaurante = 7 AND activo = true 
      LIMIT 1
    `;
    const sucursalResult = await pool.query(sucursalQuery);
    
    if (sucursalResult.rows.length === 0) {
      console.log('❌ No se encontró sucursal activa para el restaurante 7');
      return;
    }

    const sucursalId = sucursalResult.rows[0].id_sucursal;
    console.log(`📍 Usando sucursal ID: ${sucursalId}`);

    // Crear usuario de prueba
    const insertQuery = `
      INSERT INTO vendedores (
        nombre, username, email, password_hash, rol, activo, 
        id_sucursal, id_restaurante, created_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, NOW()
      ) RETURNING id_vendedor
    `;

    const insertResult = await pool.query(insertQuery, [
      'Usuario de Prueba',
      'testuser',
      'test@restaurant7.com',
      passwordHash,
      'admin',
      true,
      sucursalId,
      7
    ]);

    console.log('✅ Usuario de prueba creado exitosamente:');
    console.log(`- ID: ${insertResult.rows[0].id_vendedor}`);
    console.log(`- Nombre: Usuario de Prueba`);
    console.log(`- Username: testuser`);
    console.log(`- Email: test@restaurant7.com`);
    console.log(`- Rol: admin`);
    console.log(`- Restaurante: 7`);
    console.log(`- Sucursal: ${sucursalId}`);
    console.log('');
    console.log('🔑 Credenciales de prueba:');
    console.log('- Username: testuser');
    console.log('- Password: 123456');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

createTestUser();
