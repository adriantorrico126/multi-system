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

async function completarCreacionPizzeria() {
  console.log('🍕 COMPLETANDO CREACIÓN DE PIZZERIA IL CAPRICCIO');
  console.log('=' .repeat(60));
  
  const client = await pool.connect();
  
  try {
    // Obtener el restaurante existente
    console.log('\n🔍 Obteniendo información del restaurante existente...');
    const restauranteResult = await client.query(
      'SELECT id_restaurante, nombre FROM restaurantes WHERE nombre = $1',
      ['Pizzeria Il Capriccio']
    );
    
    if (restauranteResult.rows.length === 0) {
      throw new Error('Restaurante Pizzeria Il Capriccio no encontrado');
    }
    
    const restaurante = restauranteResult.rows[0];
    console.log(`✅ Restaurante encontrado: ID ${restaurante.id_restaurante} - ${restaurante.nombre}`);
    
    // Obtener la sucursal
    const sucursalResult = await client.query(
      'SELECT id_sucursal, nombre FROM sucursales WHERE id_restaurante = $1',
      [restaurante.id_restaurante]
    );
    
    const sucursal = sucursalResult.rows[0];
    console.log(`✅ Sucursal encontrada: ID ${sucursal.id_sucursal} - ${sucursal.nombre}`);
    
    await client.query('BEGIN');
    
    // Crear categorías específicas para pizzeria
    console.log('\n🍕 Creando categorías específicas para pizzeria...');
    const categoriasPizzeria = [
      { nombre: 'Pizzas' },
      { nombre: 'Pastas' },
      { nombre: 'Bebidas' },
      { nombre: 'Postres' },
      { nombre: 'Entradas' },
      { nombre: 'Ensaladas' }
    ];
    
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
        console.log(`   ✅ Categoría creada: ${categoria.nombre}`);
      } else {
        console.log(`   ⚠️  Categoría ya existe: ${categoria.nombre}`);
      }
    }
    
    // Crear mesas (más mesas para pizzeria)
    console.log('\n🪑 Creando mesas para la pizzeria...');
    let mesasCreadas = 0;
    
    for (let i = 1; i <= 15; i++) {
      // Verificar si la mesa ya existe
      const existingMesa = await client.query(
        'SELECT id_mesa FROM mesas WHERE numero_mesa = $1 AND id_restaurante = $2',
        [i, restaurante.id_restaurante]
      );
      
      if (existingMesa.rows.length === 0) {
        const capacidad = i <= 10 ? 4 : 6; // Mesas más grandes para grupos
        await client.query(`
          INSERT INTO mesas (numero_mesa, capacidad, estado, activo, created_at, id_sucursal, id_restaurante)
          VALUES ($1, $2, 'disponible', true, NOW(), $3, $4)
        `, [i, capacidad, sucursal.id_sucursal, restaurante.id_restaurante]);
        mesasCreadas++;
        console.log(`   ✅ Mesa ${i} creada (capacidad: ${capacidad})`);
      } else {
        console.log(`   ⚠️  Mesa ${i} ya existe`);
      }
    }
    
    await client.query('COMMIT');
    
    // Mostrar resumen
    console.log('\n🎉 CREACIÓN COMPLETADA EXITOSAMENTE!');
    console.log('=' .repeat(60));
    console.log(`🏪 Restaurante: ${restaurante.nombre} (ID: ${restaurante.id_restaurante})`);
    console.log(`🏢 Sucursal: ${sucursal.nombre} (ID: ${sucursal.id_sucursal})`);
    console.log(`📂 Categorías: ${categoriasPizzeria.length} específicas para pizzeria`);
    console.log(`🪑 Mesas: ${mesasCreadas} nuevas mesas creadas`);
    
    console.log('\n🍕 CATEGORÍAS DISPONIBLES:');
    categoriasPizzeria.forEach((cat, index) => {
      console.log(`   ${index + 1}. ${cat.nombre}`);
    });
    
    console.log('\n✅ ¡La pizzeria está completamente lista para usar!');
    console.log('🔗 Puedes acceder al sistema POS con:');
    console.log('   Username: Alejandro');
    console.log('   Contraseña: P1ZZ4s1lC4P');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ ERROR:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

// Función para verificar el estado completo
async function verificarEstadoCompleto() {
  const client = await pool.connect();
  
  try {
    console.log('\n🔍 VERIFICANDO ESTADO COMPLETO DE LA PIZZERIA...');
    
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
      WHERE r.nombre = 'Pizzeria Il Capriccio'
      GROUP BY r.id_restaurante, s.id_sucursal
    `);
    
    if (result.rows.length > 0) {
      const info = result.rows[0];
      console.log('✅ ESTADO DE LA PIZZERIA:');
      console.log(`   🏪 Restaurante: ${info.nombre}`);
      console.log(`   📍 Ubicación: ${info.ciudad}`);
      console.log(`   🏢 Sucursal: ${info.sucursal_nombre}`);
      console.log(`   👥 Usuarios: ${info.usuarios_count}`);
      console.log(`   📂 Categorías: ${info.categorias_count}`);
      console.log(`   🪑 Mesas: ${info.mesas_count}`);
      console.log(`   🔄 Estado: ${info.activo ? 'Activo' : 'Inactivo'}`);
      
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
  completarCreacionPizzeria()
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
  completarCreacionPizzeria,
  verificarEstadoCompleto
};
