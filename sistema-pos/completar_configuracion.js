const { Pool } = require('pg');

// Configuración específica para DigitalOcean
const dbConfig = {
  host: process.env.DB_HOST || 'your-database-host-here',
  port: parseInt(process.env.DB_PORT) || 25060,
  database: process.env.DB_DATABASE || 'your-database-name',
  user: process.env.DB_USER || 'your-database-user',
  password: process.env.DB_PASSWORD || 'your-database-password',
  ssl: { rejectUnauthorized: false }
};

const pool = new Pool(dbConfig);

async function completarConfiguracionPizzeria() {
  console.log('🍕 COMPLETANDO CONFIGURACIÓN DE PIZZERIA IL CAPRICCIO');
  console.log('=' .repeat(60));
  
  const client = await pool.connect();
  
  try {
    // Obtener el restaurante
    console.log('🔍 Obteniendo información del restaurante...');
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
      'SELECT id_sucursal, nombre FROM sucursales WHERE id_restaurante = $1 LIMIT 1',
      [restaurante.id_restaurante]
    );
    
    const sucursal = sucursalResult.rows[0];
    console.log(`✅ Sucursal encontrada: ID ${sucursal.id_sucursal} - ${sucursal.nombre}`);
    
    // Crear categorías únicas para la pizzeria
    console.log('\n🍕 Creando categorías únicas para la pizzeria...');
    const categoriasPizzeria = [
      { nombre: 'Pizzas Il Capriccio' },
      { nombre: 'Pastas Caseras' },
      { nombre: 'Bebidas Italianas' },
      { nombre: 'Postres Tradicionales' },
      { nombre: 'Antipasti' },
      { nombre: 'Ensaladas Frescas' }
    ];
    
    let categoriasCreadas = 0;
    for (const categoria of categoriasPizzeria) {
      try {
        await client.query(`
          INSERT INTO categorias (nombre, activo, created_at, id_restaurante)
          VALUES ($1, true, NOW(), $2)
        `, [categoria.nombre, restaurante.id_restaurante]);
        categoriasCreadas++;
        console.log(`   ✅ Categoría creada: ${categoria.nombre}`);
      } catch (error) {
        if (error.code === '23505') {
          console.log(`   ⚠️  Categoría ya existe: ${categoria.nombre}`);
        } else {
          throw error;
        }
      }
    }
    
    // Crear mesas
    console.log('\n🪑 Creando mesas para la pizzeria...');
    let mesasCreadas = 0;
    
    for (let i = 1; i <= 15; i++) {
      try {
        const capacidad = i <= 10 ? 4 : 6;
        await client.query(`
          INSERT INTO mesas (numero, capacidad, estado, activo, created_at, id_sucursal, id_restaurante)
          VALUES ($1, $2, 'disponible', true, NOW(), $3, $4)
        `, [i, capacidad, sucursal.id_sucursal, restaurante.id_restaurante]);
        mesasCreadas++;
        console.log(`   ✅ Mesa ${i} creada (capacidad: ${capacidad})`);
      } catch (error) {
        if (error.code === '23505') {
          console.log(`   ⚠️  Mesa ${i} ya existe`);
        } else {
          throw error;
        }
      }
    }
    
    // Mostrar resumen final
    console.log('\n🎉 CONFIGURACIÓN COMPLETADA EXITOSAMENTE!');
    console.log('=' .repeat(60));
    console.log(`🏪 Restaurante: ${restaurante.nombre}`);
    console.log(`📍 ID: ${restaurante.id_restaurante}`);
    console.log(`🏢 Sucursal: ${sucursal.nombre} (ID: ${sucursal.id_sucursal})`);
    console.log(`📂 Categorías: ${categoriasCreadas} nuevas creadas`);
    console.log(`🪑 Mesas: ${mesasCreadas} nuevas creadas`);
    
    console.log('\n🍕 CATEGORÍAS DISPONIBLES:');
    categoriasPizzeria.forEach((cat, index) => {
      console.log(`   ${index + 1}. ${cat.nombre}`);
    });
    
    console.log('\n✅ ¡La pizzeria está completamente lista!');
    console.log('🔗 Credenciales de acceso:');
    console.log('   Username: Alejandro');
    console.log('   Contraseña: P1ZZ4s1lC4P');
    
    // Verificar estado final
    console.log('\n🔍 VERIFICACIÓN FINAL:');
    const estadoFinal = await client.query(`
      SELECT 
        COUNT(DISTINCT c.id_categoria) as categorias_count,
        COUNT(DISTINCT m.id_mesa) as mesas_count,
        COUNT(DISTINCT v.id_vendedor) as usuarios_count
      FROM restaurantes r
      LEFT JOIN categorias c ON r.id_restaurante = c.id_restaurante
      LEFT JOIN mesas m ON r.id_restaurante = m.id_restaurante
      LEFT JOIN vendedores v ON r.id_restaurante = v.id_restaurante
      WHERE r.id_restaurante = $1
    `, [restaurante.id_restaurante]);
    
    const estado = estadoFinal.rows[0];
    console.log(`   📂 Total categorías: ${estado.categorias_count}`);
    console.log(`   🪑 Total mesas: ${estado.mesas_count}`);
    console.log(`   👥 Total usuarios: ${estado.usuarios_count}`);
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

// Ejecutar script
if (require.main === module) {
  completarConfiguracionPizzeria()
    .then(() => {
      console.log('\n🎉 ¡Pizzeria Il Capriccio lista para usar!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Error fatal:', error.message);
      process.exit(1);
    });
}

module.exports = { completarConfiguracionPizzeria };
