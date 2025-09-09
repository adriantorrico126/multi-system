require('dotenv').config();
const { Pool } = require('pg');

// Las credenciales de base de datos se deben configurar a través de variables de entorno.
// Ejemplo en un archivo .env:
// DATABASE_URL="postgresql://[REDACTED_USER]:[SECRET_REDACTED]@db-postgresql-nyc3-64232-do-user-24932517-0.j.db.ondigitalocean.com:25060/defaultdb?sslmode=require"
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Datos pre-configurados para Pizzeria Il Capriccio
const datosRestaurante = {
  nombre: 'Pizzeria Il Capriccio',
  direccion: 'Av. Ecológica, Cochabamba, Bolivia',
  ciudad: 'Cochabamba',
  telefono: '75998430',
  email: null
};

const datosAdmin = {
  nombre: 'Alejandro Padilla Castellón',
  username: 'Alejandro',
  email: 'alejandro05052004@gmail.com',
  password: 'P1ZZ4s1lC4P'
};

async function crearPizzeriaCompleta() {
  console.log('🍕 CREANDO PIZZERIA IL CAPRICCIO EN PRODUCCIÓN');
  console.log('=' .repeat(60));
  console.log(`🏪 Restaurante: ${datosRestaurante.nombre}`);
  console.log(`📍 Ubicación: ${datosRestaurante.ciudad}`);
  console.log(`👤 Admin: ${datosAdmin.nombre} (${datosAdmin.username})`);
  console.log('=' .repeat(60));
  
  const client = await pool.connect();
  
  try {
    // Verificar conexión
    console.log('\n🔌 Verificando conexión a DigitalOcean...');
    const testResult = await client.query('SELECT NOW()');
    console.log(`✅ Conexión exitosa - Hora del servidor: ${testResult.rows[0].now}`);
    
    // Verificar si el restaurante ya existe
    console.log('\n🔍 Verificando si el restaurante ya existe...');
    const existingRestaurant = await client.query(
      'SELECT id_restaurante, nombre FROM restaurantes WHERE nombre = $1',
      [datosRestaurante.nombre]
    );
    
    let restaurante, sucursal, usuario;
    
    if (existingRestaurant.rows.length > 0) {
      console.log(`⚠️  El restaurante "${datosRestaurante.nombre}" ya existe con ID: ${existingRestaurant.rows[0].id_restaurante}`);
      restaurante = existingRestaurant.rows[0];
      
      // Obtener sucursal existente
      const sucursalResult = await client.query(
        'SELECT id_sucursal, nombre FROM sucursales WHERE id_restaurante = $1 LIMIT 1',
        [restaurante.id_restaurante]
      );
      sucursal = sucursalResult.rows[0];
      
      // Obtener usuario existente
      const usuarioResult = await client.query(
        'SELECT id_vendedor, nombre, username, email, rol FROM vendedores WHERE id_restaurante = $1 AND rol = $2 LIMIT 1',
        [restaurante.id_restaurante, 'admin']
      );
      usuario = usuarioResult.rows[0];
      
      console.log('✅ Usando datos existentes del restaurante');
    } else {
      console.log('✅ Restaurante no existe, procediendo con la creación completa...');
      
      await client.query('BEGIN');
      
      // 1. Crear restaurante
      console.log('\n🏪 Creando restaurante...');
      const restauranteResult = await client.query(`
        INSERT INTO restaurantes (nombre, direccion, ciudad, telefono, email, activo, created_at)
        VALUES ($1, $2, $3, $4, $5, true, NOW())
        RETURNING id_restaurante, nombre, direccion, ciudad
      `, [
        datosRestaurante.nombre,
        datosRestaurante.direccion,
        datosRestaurante.ciudad,
        datosRestaurante.telefono,
        datosRestaurante.email
      ]);
      
      restaurante = restauranteResult.rows[0];
      console.log(`✅ Restaurante creado: ID ${restaurante.id_restaurante} - ${restaurante.nombre}`);
      
      // 2. Crear sucursal principal
      console.log('\n🏢 Creando sucursal principal...');
      const sucursalResult = await client.query(`
        INSERT INTO sucursales (nombre, ciudad, direccion, activo, created_at, id_restaurante)
        VALUES ($1, $2, $3, true, NOW(), $4)
        RETURNING id_sucursal, nombre
      `, ['Sucursal Principal', datosRestaurante.ciudad, datosRestaurante.direccion, restaurante.id_restaurante]);
      
      sucursal = sucursalResult.rows[0];
      console.log(`✅ Sucursal creada: ID ${sucursal.id_sucursal} - ${sucursal.nombre}`);
      
      // 3. Crear usuario admin
      console.log('\n👤 Creando usuario administrador...');
      const bcrypt = require('bcrypt');
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
      
      usuario = usuarioResult.rows[0];
      console.log(`✅ Usuario admin creado: ID ${usuario.id_vendedor} - ${usuario.username}`);
      
      await client.query('COMMIT');
    }
    
    // 4. Crear categorías específicas para pizzeria
    console.log('\n🍕 Creando categorías específicas para pizzeria...');
    const categoriasPizzeria = [
      { nombre: 'Pizzas' },
      { nombre: 'Pastas' },
      { nombre: 'Bebidas' },
      { nombre: 'Postres' },
      { nombre: 'Entradas' },
      { nombre: 'Ensaladas' }
    ];
    
    let categoriasCreadas = 0;
    for (const categoria of categoriasPizzeria) {
      // Verificar si la categoría ya existe
      const existingCategoria = await client.query(
        'SELECT id_categoria FROM categorias WHERE nombre = $1 AND id_restaurante = $2',
        [categoria.nombre, restaurante.id_restaurante]
      );
      
      if (existingCategoria.rows.length === 0) {
        await client.query(`
          INSERT INTO categorias (nombre, activo, created_at, id_restaurante)
          VALUES ($1, true, NOW(), $2)
        `, [categoria.nombre, restaurante.id_restaurante]);
        categoriasCreadas++;
        console.log(`   ✅ Categoría creada: ${categoria.nombre}`);
      } else {
        console.log(`   ⚠️  Categoría ya existe: ${categoria.nombre}`);
      }
    }
    
    // 5. Crear mesas (usando la estructura correcta)
    console.log('\n🪑 Creando mesas para la pizzeria...');
    let mesasCreadas = 0;
    
    for (let i = 1; i <= 15; i++) {
      // Verificar si la mesa ya existe
      const existingMesa = await client.query(
        'SELECT id_mesa FROM mesas WHERE numero = $1 AND id_restaurante = $2',
        [i, restaurante.id_restaurante]
      );
      
      if (existingMesa.rows.length === 0) {
        const capacidad = i <= 10 ? 4 : 6; // Mesas más grandes para grupos
        await client.query(`
          INSERT INTO mesas (numero, capacidad, estado, activo, created_at, id_sucursal, id_restaurante)
          VALUES ($1, $2, 'disponible', true, NOW(), $3, $4)
        `, [i, capacidad, sucursal.id_sucursal, restaurante.id_restaurante]);
        mesasCreadas++;
        console.log(`   ✅ Mesa ${i} creada (capacidad: ${capacidad})`);
      } else {
        console.log(`   ⚠️  Mesa ${i} ya existe`);
      }
    }
    
    // Mostrar resumen completo
    console.log('\n🎉 PIZZERIA IL CAPRICCIO CONFIGURADA EXITOSAMENTE!');
    console.log('=' .repeat(60));
    console.log(`🏪 Restaurante: ${restaurante.nombre}`);
    console.log(`📍 Dirección: ${datosRestaurante.direccion}`);
    console.log(`🏢 Sucursal: ${sucursal.nombre} (ID: ${sucursal.id_sucursal})`);
    console.log(`👤 Admin: ${usuario.username} (${usuario.email})`);
    console.log(`🔑 Contraseña: ${datosAdmin.password}`);
    console.log(`📂 Categorías: ${categoriasCreadas} nuevas creadas`);
    console.log(`🪑 Mesas: ${mesasCreadas} nuevas creadas`);
    
    console.log('\n📋 INFORMACIÓN TÉCNICA:');
    console.log(`   • ID del Restaurante: ${restaurante.id_restaurante}`);
    console.log(`   • ID de la Sucursal: ${sucursal.id_sucursal}`);
    console.log(`   • ID del Usuario: ${usuario.id_vendedor}`);
    console.log(`   • Username: ${usuario.username}`);
    console.log(`   • Email: ${usuario.email}`);
    console.log(`   • Rol: ${usuario.rol}`);
    
    console.log('\n🍕 CATEGORÍAS DISPONIBLES:');
    categoriasPizzeria.forEach((cat, index) => {
      console.log(`   ${index + 1}. ${cat.nombre}`);
    });
    
    console.log('\n✅ ¡La pizzeria está lista para usar en producción!');
    console.log('🔗 Puedes acceder al sistema POS con las credenciales del admin');
    
    return {
      success: true,
      restaurante,
      sucursal,
      usuario,
      categorias: categoriasCreadas,
      mesas: mesasCreadas
    };
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('   Detalles:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Función para verificar el estado del restaurante
async function verificarEstadoRestaurante() {
  const client = await pool.connect();
  
  try {
    console.log('\n🔍 VERIFICANDO ESTADO DE LA PIZZERIA...');
    
    const result = await client.query(`
      SELECT 
        r.id_restaurante, r.nombre, r.direccion, r.ciudad, r.telefono, r.activo,
        s.id_sucursal, s.nombre as sucursal_nombre,
        COUNT(DISTINCT v.id_vendedor) as usuarios_count,
        COUNT(DISTINCT c.id_categoria) as categorias_count,
        COUNT(DISTINCT m.id_mesa) as mesas_count
      FROM restaurantes r
      LEFT JOIN sucursales s ON r.id_restaurante = s.id_restaurante
      LEFT JOIN vendedores v ON r.id_restaurante = v.id_restaurante
      LEFT JOIN categorias c ON r.id_restaurante = c.id_restaurante
      LEFT JOIN mesas m ON r.id_restaurante = m.id_restaurante
      WHERE r.nombre = $1
      GROUP BY r.id_restaurante, s.id_sucursal
    `, [datosRestaurante.nombre]);
    
    if (result.rows.length > 0) {
      const info = result.rows[0];
      console.log('✅ Pizzeria encontrada:');
      console.log(`   ID: ${info.id_restaurante}`);
      console.log(`   Nombre: ${info.nombre}`);
      console.log(`   Ciudad: ${info.ciudad}`);
      console.log(`   Estado: ${info.activo ? 'Activo' : 'Inactivo'}`);
      console.log(`   Usuarios: ${info.usuarios_count}`);
      console.log(`   Categorías: ${info.categorias_count}`);
      console.log(`   Mesas: ${info.mesas_count}`);
      
      // Mostrar usuarios
      const usuarios = await client.query(`
        SELECT nombre, username, email, rol FROM vendedores 
        WHERE id_restaurante = $1
      `, [info.id_restaurante]);
      
      console.log('\n👥 USUARIOS:');
      usuarios.rows.forEach(usuario => {
        console.log(`   • ${usuario.nombre} (${usuario.username}) - ${usuario.rol}`);
      });
      
      // Mostrar categorías
      const categorias = await client.query(`
        SELECT nombre FROM categorias 
        WHERE id_restaurante = $1 AND activo = true
        ORDER BY nombre
      `, [info.id_restaurante]);
      
      console.log('\n📂 CATEGORÍAS:');
      categorias.rows.forEach((cat, index) => {
        console.log(`   ${index + 1}. ${cat.nombre}`);
      });
      
    } else {
      console.log('❌ Pizzeria Il Capriccio no encontrada');
    }
    
  } finally {
    client.release();
  }
}

// Ejecutar script
if (require.main === module) {
  crearPizzeriaCompleta()
    .then(() => {
      console.log('\n🎉 Script completado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Error fatal:', error.message);
      process.exit(1);
    });
}

module.exports = {
  crearPizzeriaCompleta,
  verificarEstadoRestaurante
};
