require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const readline = require('readline');

// Las credenciales de base de datos se deben configurar a través de variables de entorno.
// Ejemplo en un archivo .env:
// DATABASE_URL="postgresql://[REDACTED_USER]:[SECRET_REDACTED]@db-postgresql-nyc3-64232-do-user-24932517-0.j.db.ondigitalocean.com:25060/defaultdb?sslmode=require"
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Interfaz para leer input del usuario
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function crearRestauranteCompleto() {
  console.log('🏪 CREAR NUEVO RESTAURANTE PARA PRODUCCIÓN');
  console.log('=' .repeat(50));
  
  try {
    // 1. Obtener datos del restaurante
    console.log('\n📝 DATOS DEL RESTAURANTE:');
    const nombre = await question('Nombre del restaurante: ');
    const direccion = await question('Dirección: ');
    const ciudad = await question('Ciudad: ');
    const telefono = await question('Teléfono (opcional): ');
    const email = await question('Email (opcional): ');
    
    // 2. Obtener datos del usuario admin
    console.log('\n👤 DATOS DEL USUARIO ADMIN:');
    const admin_nombre = await question('Nombre del administrador: ');
    const admin_username = await question('Username del admin: ');
    const admin_email = await question('Email del admin: ');
    const admin_password = await question('Contraseña del admin: ');
    
    // Validaciones básicas
    if (!nombre || !direccion || !ciudad || !admin_nombre || !admin_username || !admin_password) {
      throw new Error('Faltan campos requeridos');
    }
    
    console.log('\n🔄 CREANDO RESTAURANTE...');
    
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // 1. Crear restaurante
      console.log('   📍 Creando restaurante...');
      const restauranteResult = await client.query(`
        INSERT INTO restaurantes (nombre, direccion, ciudad, telefono, email, activo, created_at)
        VALUES ($1, $2, $3, $4, $5, true, NOW())
        RETURNING id_restaurante, nombre, direccion, ciudad
      `, [nombre, direccion, ciudad, telefono || null, email || null]);
      
      const restaurante = restauranteResult.rows[0];
      console.log(`   ✅ Restaurante creado: ID ${restaurante.id_restaurante} - ${restaurante.nombre}`);
      
      // 2. Crear sucursal principal
      console.log('   🏢 Creando sucursal principal...');
      const sucursalResult = await client.query(`
        INSERT INTO sucursales (nombre, ciudad, direccion, activo, created_at, id_restaurante)
        VALUES ($1, $2, $3, true, NOW(), $4)
        RETURNING id_sucursal, nombre
      `, ['Sucursal Principal', ciudad, direccion, restaurante.id_restaurante]);
      
      const sucursal = sucursalResult.rows[0];
      console.log(`   ✅ Sucursal creada: ID ${sucursal.id_sucursal} - ${sucursal.nombre}`);
      
      // 3. Crear usuario admin
      console.log('   👤 Creando usuario administrador...');
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(admin_password, saltRounds);
      
      const usuarioResult = await client.query(`
        INSERT INTO vendedores (nombre, username, email, password_hash, rol, activo, created_at, id_sucursal, id_restaurante)
        VALUES ($1, $2, $3, $4, 'admin', true, NOW(), $5, $6)
        RETURNING id_vendedor, nombre, username, email, rol
      `, [admin_nombre, admin_username, admin_email, passwordHash, sucursal.id_sucursal, restaurante.id_restaurante]);
      
      const usuario = usuarioResult.rows[0];
      console.log(`   ✅ Usuario admin creado: ID ${usuario.id_vendedor} - ${usuario.username}`);
      
      // 4. Crear categorías básicas
      console.log('   📂 Creando categorías básicas...');
      const categoriasBasicas = [
        { nombre: 'Platos Principales', descripcion: 'Platos principales del menú', activo: true },
        { nombre: 'Bebidas', descripcion: 'Bebidas y refrescos', activo: true },
        { nombre: 'Postres', descripcion: 'Postres y dulces', activo: true },
        { nombre: 'Entradas', descripcion: 'Entradas y aperitivos', activo: true }
      ];
      
      for (const categoria of categoriasBasicas) {
        await client.query(`
          INSERT INTO categorias (nombre, descripcion, activo, created_at, id_restaurante)
          VALUES ($1, $2, $3, NOW(), $4)
        `, [categoria.nombre, categoria.descripcion, categoria.activo, restaurante.id_restaurante]);
      }
      console.log('   ✅ Categorías básicas creadas');
      
      // 5. Crear mesas básicas
      console.log('   🪑 Creando mesas básicas...');
      for (let i = 1; i <= 10; i++) {
        await client.query(`
          INSERT INTO mesas (numero_mesa, capacidad, estado, activo, created_at, id_sucursal, id_restaurante)
          VALUES ($1, $2, 'disponible', true, NOW(), $3, $4)
        `, [i, 4, sucursal.id_sucursal, restaurante.id_restaurante]);
      }
      console.log('   ✅ 10 mesas básicas creadas');
      
      await client.query('COMMIT');
      
      // Mostrar resumen
      console.log('\n🎉 RESTAURANTE CREADO EXITOSAMENTE!');
      console.log('=' .repeat(50));
      console.log(`🏪 Restaurante: ${restaurante.nombre}`);
      console.log(`📍 Dirección: ${restaurante.direccion}, ${restaurante.ciudad}`);
      console.log(`🏢 Sucursal: ${sucursal.nombre} (ID: ${sucursal.id_sucursal})`);
      console.log(`👤 Admin: ${usuario.username} (${usuario.email})`);
      console.log(`🔑 Contraseña: ${admin_password}`);
      console.log(`📂 Categorías: 4 básicas creadas`);
      console.log(`🪑 Mesas: 10 mesas básicas creadas`);
      
      console.log('\n📋 INFORMACIÓN IMPORTANTE:');
      console.log(`   • ID del Restaurante: ${restaurante.id_restaurante}`);
      console.log(`   • ID de la Sucursal: ${sucursal.id_sucursal}`);
      console.log(`   • ID del Usuario: ${usuario.id_vendedor}`);
      console.log(`   • Username: ${usuario.username}`);
      console.log(`   • Email: ${usuario.email}`);
      console.log(`   • Rol: ${usuario.rol}`);
      
      console.log('\n✅ El restaurante está listo para usar en producción!');
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('   Detalles:', error);
  } finally {
    rl.close();
    await pool.end();
  }
}

// Función para verificar conexión
async function verificarConexion() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log('✅ Conexión a la base de datos exitosa');
    console.log(`   Hora del servidor: ${result.rows[0].now}`);
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    return false;
  }
}

// Función para listar restaurantes existentes
async function listarRestaurantes() {
  try {
    const client = await pool.connect();
    const result = await client.query(`
      SELECT r.id_restaurante, r.nombre, r.ciudad, r.activo, 
             COUNT(v.id_vendedor) as usuarios_count
      FROM restaurantes r
      LEFT JOIN vendedores v ON r.id_restaurante = v.id_restaurante
      GROUP BY r.id_restaurante, r.nombre, r.ciudad, r.activo
      ORDER BY r.created_at DESC
    `);
    
    console.log('\n📋 RESTAURANTES EXISTENTES:');
    console.log('=' .repeat(80));
    console.log('ID  | Nombre                    | Ciudad        | Estado  | Usuarios');
    console.log('-' .repeat(80));
    
    result.rows.forEach(row => {
      const estado = row.activo ? 'Activo' : 'Inactivo';
      console.log(`${row.id_restaurante.toString().padStart(3)} | ${row.nombre.padEnd(25)} | ${row.ciudad.padEnd(13)} | ${estado.padEnd(7)} | ${row.usuarios_count}`);
    });
    
    client.release();
  } catch (error) {
    console.error('❌ Error al listar restaurantes:', error.message);
  }
}

// Función principal
async function main() {
  console.log('🚀 SCRIPT DE CREACIÓN DE RESTAURANTES PARA PRODUCCIÓN');
  console.log('=' .repeat(60));
  
  // Verificar conexión
  const conexionOk = await verificarConexion();
  if (!conexionOk) {
    console.log('\n❌ No se puede continuar sin conexión a la base de datos');
    return;
  }
  
  // Mostrar opciones
  console.log('\n📋 OPCIONES DISPONIBLES:');
  console.log('1. Crear nuevo restaurante');
  console.log('2. Listar restaurantes existentes');
  console.log('3. Salir');
  
  const opcion = await question('\nSelecciona una opción (1-3): ');
  
  switch (opcion) {
    case '1':
      await crearRestauranteCompleto();
      break;
    case '2':
      await listarRestaurantes();
      break;
    case '3':
      console.log('👋 ¡Hasta luego!');
      break;
    default:
      console.log('❌ Opción inválida');
  }
}

// Ejecutar script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  crearRestauranteCompleto,
  verificarConexion,
  listarRestaurantes
};


