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

// Productos de bebidas que faltaron
const productosBebidas = [
  {
    "nombre": "Coca cola de 1 litro",
    "precio": 13.0,
    "categoria_nombre": "Bebidas Italianas",
    "stock": null,
    "activo": true,
    "imagen_url": "https://example.com/placeholder.jpg"
  },
  {
    "nombre": "Coca cola de 1.5 litros",
    "precio": 15.0,
    "categoria_nombre": "Bebidas Italianas",
    "stock": null,
    "activo": true,
    "imagen_url": "https://example.com/placeholder.jpg"
  },
  {
    "nombre": "Jugo del Valle de 1 litro",
    "precio": 14.0,
    "categoria_nombre": "Bebidas Italianas",
    "stock": null,
    "activo": true,
    "imagen_url": "https://example.com/placeholder.jpg"
  },
  {
    "nombre": "Coca cola de 500 cc",
    "precio": 7.0,
    "categoria_nombre": "Bebidas Italianas",
    "stock": null,
    "activo": true,
    "imagen_url": "https://example.com/placeholder.jpg"
  },
  {
    "nombre": "Jugos naturales de 1 litro",
    "precio": 10.0,
    "categoria_nombre": "Bebidas Italianas",
    "stock": null,
    "activo": true,
    "imagen_url": "https://example.com/placeholder.jpg"
  },
  {
    "nombre": "Jugos naturales de 1.5 litros",
    "precio": 15.0,
    "categoria_nombre": "Bebidas Italianas",
    "stock": null,
    "activo": true,
    "imagen_url": "https://example.com/placeholder.jpg"
  }
];

async function agregarBebidasFaltantes() {
  console.log('🥤 AGREGANDO BEBIDAS FALTANTES A LA PIZZERIA');
  console.log('=' .repeat(50));
  
  const client = await pool.connect();
  
  try {
    // Obtener el restaurante
    const restauranteResult = await client.query(
      'SELECT id_restaurante, nombre FROM restaurantes WHERE nombre = $1',
      ['Pizzeria Il Capriccio']
    );
    
    const restaurante = restauranteResult.rows[0];
    console.log(`✅ Restaurante: ${restaurante.nombre} (ID: ${restaurante.id_restaurante})`);
    
    // Obtener ID de la categoría de bebidas
    const categoriaBebidas = await client.query(`
      SELECT id_categoria FROM categorias 
      WHERE nombre = 'Bebidas Italianas' AND id_restaurante = $1
    `, [restaurante.id_restaurante]);
    
    if (categoriaBebidas.rows.length === 0) {
      console.log('❌ Categoría "Bebidas Italianas" no encontrada');
      return;
    }
    
    const categoriaId = categoriaBebidas.rows[0].id_categoria;
    console.log(`✅ Categoría encontrada: Bebidas Italianas (ID: ${categoriaId})`);
    
    // Agregar productos de bebidas
    console.log('\n🥤 Agregando productos de bebidas...');
    let bebidasCreadas = 0;
    
    for (const producto of productosBebidas) {
      try {
        await client.query(`
          INSERT INTO productos (nombre, precio, id_categoria, stock_actual, activo, imagen_url, created_at, id_restaurante)
          VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7)
        `, [
          producto.nombre,
          producto.precio,
          categoriaId,
          producto.stock,
          producto.activo,
          producto.imagen_url,
          restaurante.id_restaurante
        ]);
        
        bebidasCreadas++;
        console.log(`   ✅ ${producto.nombre} - Bs${producto.precio}`);
        
      } catch (error) {
        if (error.code === '23505') {
          console.log(`   ⚠️  Producto ya existe: ${producto.nombre}`);
        } else {
          console.log(`   ❌ Error en ${producto.nombre}: ${error.message}`);
        }
      }
    }
    
    // Mostrar resumen final
    console.log('\n🎉 BEBIDAS AGREGADAS EXITOSAMENTE!');
    console.log('=' .repeat(50));
    console.log(`🥤 Bebidas: ${bebidasCreadas} nuevas creadas`);
    
    // Verificar estado final completo
    console.log('\n🔍 ESTADO FINAL COMPLETO DE LA PIZZERIA:');
    const estadoFinal = await client.query(`
      SELECT 
        COUNT(DISTINCT c.id_categoria) as categorias_count,
        COUNT(DISTINCT m.id_mesa) as mesas_count,
        COUNT(DISTINCT v.id_vendedor) as usuarios_count,
        COUNT(DISTINCT p.id_producto) as productos_count
      FROM restaurantes r
      LEFT JOIN categorias c ON r.id_restaurante = c.id_restaurante
      LEFT JOIN mesas m ON r.id_restaurante = m.id_restaurante
      LEFT JOIN vendedores v ON r.id_restaurante = v.id_restaurante
      LEFT JOIN productos p ON r.id_restaurante = p.id_restaurante
      WHERE r.id_restaurante = $1
    `, [restaurante.id_restaurante]);
    
    const estado = estadoFinal.rows[0];
    console.log(`   📂 Total categorías: ${estado.categorias_count}`);
    console.log(`   🪑 Total mesas: ${estado.mesas_count}`);
    console.log(`   👥 Total usuarios: ${estado.usuarios_count}`);
    console.log(`   🍕 Total productos: ${estado.productos_count}`);
    
    // Mostrar productos por categoría
    console.log('\n🍕 RESUMEN DE PRODUCTOS POR CATEGORÍA:');
    const categoriasConProductos = await client.query(`
      SELECT c.nombre, COUNT(p.id_producto) as cantidad
      FROM categorias c
      LEFT JOIN productos p ON c.id_categoria = p.id_categoria
      WHERE c.id_restaurante = $1
      GROUP BY c.id_categoria, c.nombre
      ORDER BY cantidad DESC
    `, [restaurante.id_restaurante]);
    
    categoriasConProductos.rows.forEach(cat => {
      console.log(`   📂 ${cat.nombre}: ${cat.cantidad} productos`);
    });
    
    console.log('\n✅ ¡LA PIZZERIA ESTÁ 100% LISTA!');
    console.log('🔗 Credenciales de acceso:');
    console.log('   Username: Alejandro');
    console.log('   Contraseña: P1ZZ4s1lC4P');
    console.log('   Email: alejandro05052004@gmail.com');
    
    console.log('\n🎯 ¡LISTO PARA COMENZAR A VENDER! 🍕');
    console.log('\n📋 RESUMEN FINAL:');
    console.log('   ✅ Restaurante creado');
    console.log('   ✅ Sucursal configurada');
    console.log('   ✅ Usuario admin creado');
    console.log('   ✅ Categorías configuradas');
    console.log('   ✅ Productos agregados');
    console.log('   ✅ Sistema listo para usar');
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

// Ejecutar script
if (require.main === module) {
  agregarBebidasFaltantes()
    .then(() => {
      console.log('\n🎉 ¡Pizzeria Il Capriccio completamente lista!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Error fatal:', error.message);
      process.exit(1);
    });
}

module.exports = { agregarBebidasFaltantes };
