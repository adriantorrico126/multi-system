const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
  user: 'postgres',
  password: '6951230Anacleta',
  host: 'localhost',
  port: 5432,
  database: 'sistempos'
});

async function createUserInActiveSucursal() {
  try {
    console.log('🔧 Creando usuario en sucursal activa...\n');

    // Obtener la sucursal activa del restaurante 7
    const sucursalQuery = `
      SELECT id_sucursal, nombre
      FROM sucursales 
      WHERE id_restaurante = 7 AND activo = true
      LIMIT 1
    `;
    const sucursalResult = await pool.query(sucursalQuery);
    
    if (sucursalResult.rows.length === 0) {
      console.log('❌ No se encontró sucursal activa');
      return;
    }
    
    const sucursal = sucursalResult.rows[0];
    console.log(`📍 Sucursal activa: ${sucursal.nombre} (ID: ${sucursal.id_sucursal})`);
    
    // Crear hash de la contraseña
    const passwordHash = await bcrypt.hash('123456', 10);

    // Crear usuario de prueba en la sucursal activa
    const insertQuery = `
      INSERT INTO vendedores (
        nombre, username, email, password_hash, rol, activo, 
        id_sucursal, id_restaurante, created_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, NOW()
      ) RETURNING id_vendedor
    `;

    const insertResult = await pool.query(insertQuery, [
      'Usuario Plan Básico',
      'testbasico',
      'testbasico@restaurant7.com',
      passwordHash,
      'admin',
      true,
      sucursal.id_sucursal,
      7
    ]);

    console.log('✅ Usuario de prueba creado exitosamente:');
    console.log(`- ID: ${insertResult.rows[0].id_vendedor}`);
    console.log(`- Nombre: Usuario Plan Básico`);
    console.log(`- Username: testbasico`);
    console.log(`- Email: testbasico@restaurant7.com`);
    console.log(`- Rol: admin`);
    console.log(`- Restaurante: 7`);
    console.log(`- Sucursal: ${sucursal.nombre} (ID: ${sucursal.id_sucursal})`);
    console.log('');
    console.log('🔑 Credenciales de prueba:');
    console.log('- Username: testbasico');
    console.log('- Password: 123456');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

createUserInActiveSucursal();

