const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  password: '6951230Anacleta',
  host: 'localhost',
  port: 5432,
  database: 'sistempos'
});

async function checkUsersRestaurant7() {
  try {
    console.log('🔍 Verificando usuarios del restaurante 7...\n');

    // Verificar vendedores del restaurante (estos son los usuarios del POS)
    const vendedoresQuery = `
      SELECT id_vendedor, nombre, username, email, rol, activo, created_at, id_sucursal
      FROM vendedores 
      WHERE id_restaurante = 7
      ORDER BY created_at DESC
    `;
    const vendedoresResult = await pool.query(vendedoresQuery);
    
    console.log('📋 Vendedores del restaurante 7:');
    vendedoresResult.rows.forEach(vendedor => {
      console.log(`- ID: ${vendedor.id_vendedor}`);
      console.log(`  Nombre: ${vendedor.nombre}`);
      console.log(`  Username: ${vendedor.username}`);
      console.log(`  Email: ${vendedor.email}`);
      console.log(`  Rol: ${vendedor.rol}`);
      console.log(`  Sucursal: ${vendedor.id_sucursal}`);
      console.log(`  Activo: ${vendedor.activo}`);
      console.log(`  Creado: ${vendedor.created_at}`);
      console.log('');
    });

    // Verificar usuarios del sistema (si existen)
    const usuariosQuery = `
      SELECT id_usuario, nombre, email, rol_id, activo, creado_en, id_sucursal
      FROM usuarios 
      WHERE id_sucursal IN (
        SELECT id_sucursal FROM sucursales WHERE id_restaurante = 7
      )
      ORDER BY creado_en DESC
    `;
    const usuariosResult = await pool.query(usuariosQuery);
    
    console.log('📋 Usuarios del sistema (por sucursal):');
    usuariosResult.rows.forEach(user => {
      console.log(`- ID: ${user.id_usuario}`);
      console.log(`  Nombre: ${user.nombre}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Rol ID: ${user.rol_id}`);
      console.log(`  Sucursal: ${user.id_sucursal}`);
      console.log(`  Activo: ${user.activo}`);
      console.log(`  Creado: ${user.creado_en}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkUsersRestaurant7();
