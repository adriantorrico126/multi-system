const { Pool } = require('pg');
const bcrypt = require('bcrypt');

// Configuración de la base de datos de producción
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'restaurant_pos',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
};

const pool = new Pool(dbConfig);

/**
 * Función para crear un restaurante completo con usuario admin
 * @param {Object} datosRestaurante - Datos del restaurante
 * @param {Object} datosAdmin - Datos del usuario admin
 * @returns {Object} Resultado de la creación
 */
async function crearRestauranteCompleto(datosRestaurante, datosAdmin) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // 1. Crear restaurante
    const restauranteResult = await client.query(`
      INSERT INTO restaurantes (nombre, direccion, ciudad, telefono, email, activo, created_at)
      VALUES ($1, $2, $3, $4, $5, true, NOW())
      RETURNING id_restaurante, nombre, direccion, ciudad
    `, [
      datosRestaurante.nombre,
      datosRestaurante.direccion,
      datosRestaurante.ciudad,
      datosRestaurante.telefono || null,
      datosRestaurante.email || null
    ]);
    
    const restaurante = restauranteResult.rows[0];
    
    // 2. Crear sucursal principal
    const sucursalResult = await client.query(`
      INSERT INTO sucursales (nombre, ciudad, direccion, activo, created_at, id_restaurante)
      VALUES ($1, $2, $3, true, NOW(), $4)
      RETURNING id_sucursal, nombre
    `, ['Sucursal Principal', datosRestaurante.ciudad, datosRestaurante.direccion, restaurante.id_restaurante]);
    
    const sucursal = sucursalResult.rows[0];
    
    // 3. Crear usuario admin
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(datosAdmin.password, saltRounds);
    
    const usuarioResult = await client.query(`
      INSERT INTO vendedores (nombre, username, email, password_hash, rol, activo, created_at, id_sucursal, id_restaurante)
      VALUES ($1, $2, $3, $4, 'admin', true, NOW(), $5, $6)
      RETURNING id_vendedor, nombre, username, email, rol
    `, [
      datosAdmin.nombre,
      datosAdmin.username,
      datosAdmin.email,
      passwordHash,
      sucursal.id_sucursal,
      restaurante.id_restaurante
    ]);
    
    const usuario = usuarioResult.rows[0];
    
    // 4. Crear categorías básicas
    const categoriasBasicas = [
      { nombre: 'Platos Principales', descripcion: 'Platos principales del menú' },
      { nombre: 'Bebidas', descripcion: 'Bebidas y refrescos' },
      { nombre: 'Postres', descripcion: 'Postres y dulces' },
      { nombre: 'Entradas', descripcion: 'Entradas y aperitivos' }
    ];
    
    for (const categoria of categoriasBasicas) {
      await client.query(`
        INSERT INTO categorias (nombre, descripcion, activo, created_at, id_restaurante)
        VALUES ($1, $2, true, NOW(), $3)
      `, [categoria.nombre, categoria.descripcion, restaurante.id_restaurante]);
    }
    
    // 5. Crear mesas básicas
    for (let i = 1; i <= 10; i++) {
      await client.query(`
        INSERT INTO mesas (numero_mesa, capacidad, estado, activo, created_at, id_sucursal, id_restaurante)
        VALUES ($1, $2, 'disponible', true, NOW(), $3, $4)
      `, [i, 4, sucursal.id_sucursal, restaurante.id_restaurante]);
    }
    
    await client.query('COMMIT');
    
    return {
      success: true,
      restaurante,
      sucursal,
      usuario,
      categorias: categoriasBasicas.length,
      mesas: 10
    };
    
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Función para crear un restaurante de ejemplo
 */
async function crearRestauranteEjemplo() {
  const datosRestaurante = {
    nombre: 'Restaurante Ejemplo',
    direccion: 'Av. Principal 123',
    ciudad: 'La Paz',
    telefono: '+591 123456789',
    email: 'info@restaurante-ejemplo.com'
  };
  
  const datosAdmin = {
    nombre: 'Administrador',
    username: 'admin',
    email: 'admin@restaurante-ejemplo.com',
    password: 'admin123'
  };
  
  try {
    console.log('🏪 Creando restaurante de ejemplo...');
    const resultado = await crearRestauranteCompleto(datosRestaurante, datosAdmin);
    
    console.log('✅ Restaurante creado exitosamente!');
    console.log(`   ID: ${resultado.restaurante.id_restaurante}`);
    console.log(`   Nombre: ${resultado.restaurante.nombre}`);
    console.log(`   Usuario: ${resultado.usuario.username}`);
    console.log(`   Contraseña: ${datosAdmin.password}`);
    
    return resultado;
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

/**
 * Función para verificar si un restaurante existe
 */
async function verificarRestaurante(nombre) {
  const client = await pool.connect();
  
  try {
    const result = await client.query(
      'SELECT id_restaurante, nombre FROM restaurantes WHERE nombre = $1',
      [nombre]
    );
    
    return result.rows.length > 0 ? result.rows[0] : null;
  } finally {
    client.release();
  }
}

/**
 * Función para obtener información completa de un restaurante
 */
async function obtenerInfoRestaurante(idRestaurante) {
  const client = await pool.connect();
  
  try {
    const result = await client.query(`
      SELECT 
        r.id_restaurante, r.nombre, r.direccion, r.ciudad, r.telefono, r.email, r.activo,
        s.id_sucursal, s.nombre as sucursal_nombre,
        COUNT(DISTINCT v.id_vendedor) as usuarios_count,
        COUNT(DISTINCT c.id_categoria) as categorias_count,
        COUNT(DISTINCT m.id_mesa) as mesas_count
      FROM restaurantes r
      LEFT JOIN sucursales s ON r.id_restaurante = s.id_restaurante
      LEFT JOIN vendedores v ON r.id_restaurante = v.id_restaurante
      LEFT JOIN categorias c ON r.id_restaurante = c.id_restaurante
      LEFT JOIN mesas m ON r.id_restaurante = m.id_restaurante
      WHERE r.id_restaurante = $1
      GROUP BY r.id_restaurante, s.id_sucursal
    `, [idRestaurante]);
    
    return result.rows[0] || null;
  } finally {
    client.release();
  }
}

// Ejecutar ejemplo si se llama directamente
if (require.main === module) {
  crearRestauranteEjemplo()
    .then(() => {
      console.log('🎉 Script completado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error fatal:', error);
      process.exit(1);
    });
}

module.exports = {
  crearRestauranteCompleto,
  crearRestauranteEjemplo,
  verificarRestaurante,
  obtenerInfoRestaurante
};
