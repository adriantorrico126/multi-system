const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

// Configuración de la base de datos
const pool = new Pool({
  host: process.env.POS_DB_HOST || 'localhost',
  port: Number(process.env.POS_DB_PORT) || 5432,
  user: process.env.POS_DB_USER || 'postgres',
  password: process.env.POS_DB_PASSWORD || '6951230Anacleta',
  database: process.env.POS_DB_NAME || 'sistempos',
  ssl: false,
});

async function createAdminUser() {
  try {
    console.log('🔧 Creando usuario administrador...');
    
    // Verificar si ya existe
    const existingUser = await pool.query('SELECT * FROM admin_users WHERE username = $1', ['admin_global']);
    
    if (existingUser.rows.length > 0) {
      console.log('✅ Usuario admin_global ya existe');
      return;
    }
    
    // Crear hash de la contraseña
    const passwordHash = await bcrypt.hash('admin', 10);
    
    // Insertar usuario administrador
    const result = await pool.query(`
      INSERT INTO admin_users (username, password_hash, nombre, rol, activo, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING *
    `, ['admin_global', passwordHash, 'Admin Global', 'superadmin', true]);
    
    console.log('✅ Usuario administrador creado exitosamente:');
    console.log(`   Username: ${result.rows[0].username}`);
    console.log(`   Nombre: ${result.rows[0].nombre}`);
    console.log(`   Rol: ${result.rows[0].rol}`);
    console.log(`   Password: admin`);
    
  } catch (error) {
    console.error('❌ Error creando usuario administrador:', error.message);
  } finally {
    await pool.end();
  }
}

createAdminUser();
