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

// Productos de la pizzeria
const productos = [
  {
    "nombre": "Il Capriccio PEQUEÑO",
    "precio": 40.0,
    "categoria_nombre": "Pizzas",
    "stock": null,
    "activo": true,
    "imagen_url": "https://example.com/placeholder.jpg"
  },
  {
    "nombre": "Il Capriccio MEDIANO",
    "precio": 65.0,
    "categoria_nombre": "Pizzas",
    "stock": null,
    "activo": true,
    "imagen_url": "https://example.com/placeholder.jpg"
  },
  {
    "nombre": "Il Capriccio GRANDE",
    "precio": 85.0,
    "categoria_nombre": "Pizzas",
    "stock": null,
    "activo": true,
    "imagen_url": "https://example.com/placeholder.jpg"
  },
  {
    "nombre": "Delicata PEQUEÑO",
    "precio": 40.0,
    "categoria_nombre": "Pizzas",
    "stock": null,
    "activo": true,
    "imagen_url": "https://example.com/placeholder.jpg"
  },
  {
    "nombre": "Delicata MEDIANO",
    "precio": 65.0,
    "categoria_nombre": "Pizzas",
    "stock": null,
    "activo": true,
    "imagen_url": "https://example.com/placeholder.jpg"
  },
  {
    "nombre": "Delicata GRANDE",
    "precio": 80.0,
    "categoria_nombre": "Pizzas",
    "stock": null,
    "activo": true,
    "imagen_url": "https://example.com/placeholder.jpg"
  },
  {
    "nombre": "Hawaiana PEQUEÑO",
    "precio": 40.0,
    "categoria_nombre": "Pizzas",
    "stock": null,
    "activo": true,
    "imagen_url": "https://example.com/placeholder.jpg"
  },
  {
    "nombre": "Hawaiana MEDIANO",
    "precio": 60.0,
    "categoria_nombre": "Pizzas",
    "stock": null,
    "activo": true,
    "imagen_url": "https://example.com/placeholder.jpg"
  },
  {
    "nombre": "Hawaiana GRANDE",
    "precio": 75.0,
    "categoria_nombre": "Pizzas",
    "stock": null,
    "activo": true,
    "imagen_url": "https://example.com/placeholder.jpg"
  },
  {
    "nombre": "Vegetale PEQUEÑO",
    "precio": 40.0,
    "categoria_nombre": "Pizzas",
    "stock": null,
    "activo": true,
    "imagen_url": "https://example.com/placeholder.jpg"
  },
  {
    "nombre": "Vegetale MEDIANO",
    "precio": 60.0,
    "categoria_nombre": "Pizzas",
    "stock": null,
    "activo": true,
    "imagen_url": "https://example.com/placeholder.jpg"
  },
  {
    "nombre": "Vegetale GRANDE",
    "precio": 75.0,
    "categoria_nombre": "Pizzas",
    "stock": null,
    "activo": true,
    "imagen_url": "https://example.com/placeholder.jpg"
  },
  {
    "nombre": "Prosciutto PEQUEÑO",
    "precio": 40.0,
    "categoria_nombre": "Pizzas",
    "stock": null,
    "activo": true,
    "imagen_url": "https://example.com/placeholder.jpg"
  },
  {
    "nombre": "Prosciutto MEDIANO",
    "precio": 55.0,
    "categoria_nombre": "Pizzas",
    "stock": null,
    "activo": true,
    "imagen_url": "https://example.com/placeholder.jpg"
  },
  {
    "nombre": "Prosciutto GRANDE",
    "precio": 70.0,
    "categoria_nombre": "Pizzas",
    "stock": null,
    "activo": true,
    "imagen_url": "https://example.com/placeholder.jpg"
  },
  {
    "nombre": "Capresse PEQUEÑO",
    "precio": 40.0,
    "categoria_nombre": "Pizzas",
    "stock": null,
    "activo": true,
    "imagen_url": "https://example.com/placeholder.jpg"
  },
  {
    "nombre": "Capresse MEDIANO",
    "precio": 60.0,
    "categoria_nombre": "Pizzas",
    "stock": null,
    "activo": true,
    "imagen_url": "https://example.com/placeholder.jpg"
  },
  {
    "nombre": "Capresse GRANDE",
    "precio": 75.0,
    "categoria_nombre": "Pizzas",
    "stock": null,
    "activo": true,
    "imagen_url": "https://example.com/placeholder.jpg"
  },
  {
    "nombre": "Contadina PEQUEÑO",
    "precio": 40.0,
    "categoria_nombre": "Pizzas",
    "stock": null,
    "activo": true,
    "imagen_url": "https://example.com/placeholder.jpg"
  },
  {
    "nombre": "Contadina MEDIANO",
    "precio": 65.0,
    "categoria_nombre": "Pizzas",
    "stock": null,
    "activo": true,
    "imagen_url": "https://example.com/placeholder.jpg"
  },
  {
    "nombre": "Contadina GRANDE",
    "precio": 85.0,
    "categoria_nombre": "Pizzas",
    "stock": null,
    "activo": true,
    "imagen_url": "https://example.com/placeholder.jpg"
  },
  {
    "nombre": "Monte Rosso PEQUEÑO",
    "precio": 40.0,
    "categoria_nombre": "Pizzas",
    "stock": null,
    "activo": true,
    "imagen_url": "https://example.com/placeholder.jpg"
  },
  {
    "nombre": "Monte Rosso MEDIANO",
    "precio": 65.0,
    "categoria_nombre": "Pizzas",
    "stock": null,
    "activo": true,
    "imagen_url": "https://example.com/placeholder.jpg"
  },
  {
    "nombre": "Monte Rosso GRANDE",
    "precio": 80.0,
    "categoria_nombre": "Pizzas",
    "stock": null,
    "activo": true,
    "imagen_url": "https://example.com/placeholder.jpg"
  },
  {
    "nombre": "Prosciutto Funghi PEQUEÑO",
    "precio": 40.0,
    "categoria_nombre": "Pizzas",
    "stock": null,
    "activo": true,
    "imagen_url": "https://example.com/placeholder.jpg"
  },
  {
    "nombre": "Prosciutto Funghi MEDIANO",
    "precio": 60.0,
    "categoria_nombre": "Pizzas",
    "stock": null,
    "activo": true,
    "imagen_url": "https://example.com/placeholder.jpg"
  },
  {
    "nombre": "Prosciutto Funghi GRANDE",
    "precio": 75.0,
    "categoria_nombre": "Pizzas",
    "stock": null,
    "activo": true,
    "imagen_url": "https://example.com/placeholder.jpg"
  },
  {
    "nombre": "Tre Carni PEQUEÑO",
    "precio": 40.0,
    "categoria_nombre": "Pizzas",
    "stock": null,
    "activo": true,
    "imagen_url": "https://example.com/placeholder.jpg"
  },
  {
    "nombre": "Tre Carni MEDIANO",
    "precio": 65.0,
    "categoria_nombre": "Pizzas",
    "stock": null,
    "activo": true,
    "imagen_url": "https://example.com/placeholder.jpg"
  },
  {
    "nombre": "Tre Carni GRANDE",
    "precio": 85.0,
    "categoria_nombre": "Pizzas",
    "stock": null,
    "activo": true,
    "imagen_url": "https://example.com/placeholder.jpg"
  },
  {
    "nombre": "Di Maiz PEQUEÑO",
    "precio": 40.0,
    "categoria_nombre": "Pizzas",
    "stock": null,
    "activo": true,
    "imagen_url": "https://example.com/placeholder.jpg"
  },
  {
    "nombre": "Di Maiz MEDIANO",
    "precio": 60.0,
    "categoria_nombre": "Pizzas",
    "stock": null,
    "activo": true,
    "imagen_url": "https://example.com/placeholder.jpg"
  },
  {
    "nombre": "Di Maiz GRANDE",
    "precio": 75.0,
    "categoria_nombre": "Pizzas",
    "stock": null,
    "activo": true,
    "imagen_url": "https://example.com/placeholder.jpg"
  },
  {
    "nombre": "Bella Vita PEQUEÑO",
    "precio": 40.0,
    "categoria_nombre": "Pizzas",
    "stock": null,
    "activo": true,
    "imagen_url": "https://example.com/placeholder.jpg"
  },
  {
    "nombre": "Bella Vita MEDIANO",
    "precio": 60.0,
    "categoria_nombre": "Pizzas",
    "stock": null,
    "activo": true,
    "imagen_url": "https://example.com/placeholder.jpg"
  },
  {
    "nombre": "Bella Vita GRANDE",
    "precio": 75.0,
    "categoria_nombre": "Pizzas",
    "stock": null,
    "activo": true,
    "imagen_url": "https://example.com/placeholder.jpg"
  },
  {
    "nombre": "Calabresa PEQUEÑO",
    "precio": 40.0,
    "categoria_nombre": "Pizzas",
    "stock": null,
    "activo": true,
    "imagen_url": "https://example.com/placeholder.jpg"
  },
  {
    "nombre": "Calabresa MEDIANO",
    "precio": 60.0,
    "categoria_nombre": "Pizzas",
    "stock": null,
    "activo": true,
    "imagen_url": "https://example.com/placeholder.jpg"
  },
  {
    "nombre": "Calabresa GRANDE",
    "precio": 75.0,
    "categoria_nombre": "Pizzas",
    "stock": null,
    "activo": true,
    "imagen_url": "https://example.com/placeholder.jpg"
  },
  {
    "nombre": "Prosciutto Pomodoro PEQUEÑO",
    "precio": 40.0,
    "categoria_nombre": "Pizzas",
    "stock": null,
    "activo": true,
    "imagen_url": "https://example.com/placeholder.jpg"
  },
  {
    "nombre": "Prosciutto Pomodoro MEDIANO",
    "precio": 60.0,
    "categoria_nombre": "Pizzas",
    "stock": null,
    "activo": true,
    "imagen_url": "https://example.com/placeholder.jpg"
  },
  {
    "nombre": "Prosciutto Pomodoro GRANDE",
    "precio": 75.0,
    "categoria_nombre": "Pizzas",
    "stock": null,
    "activo": true,
    "imagen_url": "https://example.com/placeholder.jpg"
  },
  {
    "nombre": "Quattro Formaggi PEQUEÑO",
    "precio": 40.0,
    "categoria_nombre": "Pizzas",
    "stock": null,
    "activo": true,
    "imagen_url": "https://example.com/placeholder.jpg"
  },
  {
    "nombre": "Quattro Formaggi MEDIANO",
    "precio": 60.0,
    "categoria_nombre": "Pizzas",
    "stock": null,
    "activo": true,
    "imagen_url": "https://example.com/placeholder.jpg"
  },
  {
    "nombre": "Quattro Formaggi GRANDE",
    "precio": 80.0,
    "categoria_nombre": "Pizzas",
    "stock": null,
    "activo": true,
    "imagen_url": "https://example.com/placeholder.jpg"
  },
  {
    "nombre": "Forte PEQUEÑO",
    "precio": 40.0,
    "categoria_nombre": "Pizzas",
    "stock": null,
    "activo": true,
    "imagen_url": "https://example.com/placeholder.jpg"
  },
  {
    "nombre": "Forte MEDIANO",
    "precio": 65.0,
    "categoria_nombre": "Pizzas",
    "stock": null,
    "activo": true,
    "imagen_url": "https://example.com/placeholder.jpg"
  },
  {
    "nombre": "Forte GRANDE",
    "precio": 85.0,
    "categoria_nombre": "Pizzas",
    "stock": null,
    "activo": true,
    "imagen_url": "https://example.com/placeholder.jpg"
  },
  {
    "nombre": "Pastorella PEQUEÑO",
    "precio": 40.0,
    "categoria_nombre": "Pizzas",
    "stock": null,
    "activo": true,
    "imagen_url": "https://example.com/placeholder.jpg"
  },
  {
    "nombre": "Pastorella MEDIANO",
    "precio": 65.0,
    "categoria_nombre": "Pizzas",
    "stock": null,
    "activo": true,
    "imagen_url": "https://example.com/placeholder.jpg"
  },
  {
    "nombre": "Pastorella GRANDE",
    "precio": 80.0,
    "categoria_nombre": "Pizzas",
    "stock": null,
    "activo": true,
    "imagen_url": "https://example.com/placeholder.jpg"
  },
  {
    "nombre": "Fiore Di Sole PEQUEÑO",
    "precio": 40.0,
    "categoria_nombre": "Pizzas",
    "stock": null,
    "activo": true,
    "imagen_url": "https://example.com/placeholder.jpg"
  },
  {
    "nombre": "Fiore Di Sole MEDIANO",
    "precio": 60.0,
    "categoria_nombre": "Pizzas",
    "stock": null,
    "activo": true,
    "imagen_url": "https://example.com/placeholder.jpg"
  },
  {
    "nombre": "Fiore Di Sole GRANDE",
    "precio": 75.0,
    "categoria_nombre": "Pizzas",
    "stock": null,
    "activo": true,
    "imagen_url": "https://example.com/placeholder.jpg"
  },
  {
    "nombre": "Napoletana PEQUEÑO",
    "precio": 40.0,
    "categoria_nombre": "Pizzas",
    "stock": null,
    "activo": true,
    "imagen_url": "https://example.com/placeholder.jpg"
  },
  {
    "nombre": "Napoletana MEDIANO",
    "precio": 60.0,
    "categoria_nombre": "Pizzas",
    "stock": null,
    "activo": true,
    "imagen_url": "https://example.com/placeholder.jpg"
  },
  {
    "nombre": "Napoletana GRANDE",
    "precio": 75.0,
    "categoria_nombre": "Pizzas",
    "stock": null,
    "activo": true,
    "imagen_url": "https://example.com/placeholder.jpg"
  },
  {
    "nombre": "Affumicata PEQUEÑO",
    "precio": 40.0,
    "categoria_nombre": "Pizzas",
    "stock": null,
    "activo": true,
    "imagen_url": "https://example.com/placeholder.jpg"
  },
  {
    "nombre": "Affumicata MEDIANO",
    "precio": 65.0,
    "categoria_nombre": "Pizzas",
    "stock": null,
    "activo": true,
    "imagen_url": "https://example.com/placeholder.jpg"
  },
  {
    "nombre": "Affumicata GRANDE",
    "precio": 85.0,
    "categoria_nombre": "Pizzas",
    "stock": null,
    "activo": true,
    "imagen_url": "https://example.com/placeholder.jpg"
  },
  {
    "nombre": "Campagnola PEQUEÑO",
    "precio": 40.0,
    "categoria_nombre": "Pizzas",
    "stock": null,
    "activo": true,
    "imagen_url": "https://example.com/placeholder.jpg"
  },
  {
    "nombre": "Campagnola MEDIANO",
    "precio": 65.0,
    "categoria_nombre": "Pizzas",
    "stock": null,
    "activo": true,
    "imagen_url": "https://example.com/placeholder.jpg"
  },
  {
    "nombre": "Campagnola GRANDE",
    "precio": 85.0,
    "categoria_nombre": "Pizzas",
    "stock": null,
    "activo": true,
    "imagen_url": "https://example.com/placeholder.jpg"
  },
  {
    "nombre": "Lasaña",
    "precio": 40.0,
    "categoria_nombre": "Lasañas",
    "stock": null,
    "activo": true,
    "imagen_url": "https://example.com/placeholder.jpg"
  },
  {
    "nombre": "Calzone",
    "precio": 40.0,
    "categoria_nombre": "Calzones",
    "stock": null,
    "activo": true,
    "imagen_url": "https://example.com/placeholder.jpg"
  },
  {
    "nombre": "Coca cola de 1 litro",
    "precio": 13.0,
    "categoria_nombre": "Bebidas",
    "stock": null,
    "activo": true,
    "imagen_url": "https://example.com/placeholder.jpg"
  },
  {
    "nombre": "Coca cola de 1.5 litros",
    "precio": 15.0,
    "categoria_nombre": "Bebidas",
    "stock": null,
    "activo": true,
    "imagen_url": "https://example.com/placeholder.jpg"
  },
  {
    "nombre": "Jugo del Valle de 1 litro",
    "precio": 14.0,
    "categoria_nombre": "Bebidas",
    "stock": null,
    "activo": true,
    "imagen_url": "https://example.com/placeholder.jpg"
  },
  {
    "nombre": "Coca cola de 500 cc",
    "precio": 7.0,
    "categoria_nombre": "Bebidas",
    "stock": null,
    "activo": true,
    "imagen_url": "https://example.com/placeholder.jpg"
  },
  {
    "nombre": "Jugos naturales de 1 litro",
    "precio": 10.0,
    "categoria_nombre": "Bebidas",
    "stock": null,
    "activo": true,
    "imagen_url": "https://example.com/placeholder.jpg"
  },
  {
    "nombre": "Jugos naturales de 1.5 litros",
    "precio": 15.0,
    "categoria_nombre": "Bebidas",
    "stock": null,
    "activo": true,
    "imagen_url": "https://example.com/placeholder.jpg"
  }
];

async function configurarPizzeriaCompleta() {
  console.log('🍕 CONFIGURACIÓN COMPLETA DE PIZZERIA IL CAPRICCIO');
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
    console.log(`✅ Restaurante: ${restaurante.nombre} (ID: ${restaurante.id_restaurante})`);
    
    // Obtener la sucursal
    const sucursalResult = await client.query(
      'SELECT id_sucursal, nombre FROM sucursales WHERE id_restaurante = $1 LIMIT 1',
      [restaurante.id_restaurante]
    );
    
    const sucursal = sucursalResult.rows[0];
    console.log(`✅ Sucursal: ${sucursal.nombre} (ID: ${sucursal.id_sucursal})`);
    
    // 1. Crear mesas faltantes
    console.log('\n🪑 Creando mesas...');
    let mesasCreadas = 0;
    
    for (let i = 1; i <= 15; i++) {
      try {
        const capacidad = i <= 10 ? 4 : 6;
        await client.query(`
          INSERT INTO mesas (numero, capacidad, estado, created_at, id_sucursal, id_restaurante)
          VALUES ($1, $2, 'disponible', NOW(), $3, $4)
        `, [i, capacidad, sucursal.id_sucursal, restaurante.id_restaurante]);
        mesasCreadas++;
        console.log(`   ✅ Mesa ${i} creada (capacidad: ${capacidad})`);
      } catch (error) {
        if (error.code === '23505') {
          console.log(`   ⚠️  Mesa ${i} ya existe`);
        } else {
          console.log(`   ❌ Error en mesa ${i}: ${error.message}`);
        }
      }
    }
    
    // 2. Crear categorías adicionales necesarias
    console.log('\n📂 Creando categorías adicionales...');
    const categoriasAdicionales = [
      { nombre: 'Lasañas' },
      { nombre: 'Calzones' }
    ];
    
    let categoriasCreadas = 0;
    for (const categoria of categoriasAdicionales) {
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
    
    // 3. Obtener mapeo de categorías
    console.log('\n🔗 Obteniendo mapeo de categorías...');
    const categoriasResult = await client.query(`
      SELECT id_categoria, nombre FROM categorias 
      WHERE id_restaurante = $1
    `, [restaurante.id_restaurante]);
    
    const categoriasMap = {};
    categoriasResult.rows.forEach(cat => {
      categoriasMap[cat.nombre] = cat.id_categoria;
    });
    
    console.log('✅ Categorías disponibles:');
    Object.keys(categoriasMap).forEach(nombre => {
      console.log(`   • ${nombre} (ID: ${categoriasMap[nombre]})`);
    });
    
    // 4. Crear productos
    console.log('\n🍕 Creando productos de la pizzeria...');
    let productosCreados = 0;
    let productosExistentes = 0;
    
    for (const producto of productos) {
      try {
        const categoriaId = categoriasMap[producto.categoria_nombre];
        if (!categoriaId) {
          console.log(`   ❌ Categoría no encontrada: ${producto.categoria_nombre}`);
          continue;
        }
        
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
        
        productosCreados++;
        console.log(`   ✅ ${producto.nombre} - Bs${producto.precio} (${producto.categoria_nombre})`);
        
      } catch (error) {
        if (error.code === '23505') {
          productosExistentes++;
          console.log(`   ⚠️  Producto ya existe: ${producto.nombre}`);
        } else {
          console.log(`   ❌ Error en ${producto.nombre}: ${error.message}`);
        }
      }
    }
    
    // Mostrar resumen final
    console.log('\n🎉 CONFIGURACIÓN COMPLETADA EXITOSAMENTE!');
    console.log('=' .repeat(60));
    console.log(`🏪 Restaurante: ${restaurante.nombre}`);
    console.log(`📍 ID: ${restaurante.id_restaurante}`);
    console.log(`🏢 Sucursal: ${sucursal.nombre} (ID: ${sucursal.id_sucursal})`);
    console.log(`🪑 Mesas: ${mesasCreadas} nuevas creadas`);
    console.log(`📂 Categorías: ${categoriasCreadas} nuevas creadas`);
    console.log(`🍕 Productos: ${productosCreados} nuevos creados`);
    console.log(`⚠️  Productos existentes: ${productosExistentes}`);
    
    // Verificar estado final
    console.log('\n🔍 ESTADO FINAL DE LA PIZZERIA:');
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
    console.log('\n🍕 PRODUCTOS POR CATEGORÍA:');
    for (const [nombreCategoria, idCategoria] of Object.entries(categoriasMap)) {
      const productosCategoria = await client.query(`
        SELECT nombre, precio FROM productos 
        WHERE id_categoria = $1 AND id_restaurante = $2
        ORDER BY nombre
      `, [idCategoria, restaurante.id_restaurante]);
      
      console.log(`\n   📂 ${nombreCategoria} (${productosCategoria.rows.length} productos):`);
      productosCategoria.rows.forEach(prod => {
        console.log(`      • ${prod.nombre} - Bs${prod.precio}`);
      });
    }
    
    console.log('\n✅ ¡LA PIZZERIA ESTÁ COMPLETAMENTE LISTA!');
    console.log('🔗 Credenciales de acceso:');
    console.log('   Username: Alejandro');
    console.log('   Contraseña: P1ZZ4s1lC4P');
    console.log('   Email: alejandro05052004@gmail.com');
    
    console.log('\n🎯 PRÓXIMOS PASOS:');
    console.log('   1. Acceder al sistema POS con las credenciales');
    console.log('   2. Probar el sistema completo');
    console.log('   3. Configurar impresoras si es necesario');
    console.log('   4. Entrenar al personal');
    console.log('   5. ¡Comenzar a vender pizzas! 🍕');
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

// Ejecutar script
if (require.main === module) {
  configurarPizzeriaCompleta()
    .then(() => {
      console.log('\n🎉 ¡Pizzeria Il Capriccio completamente configurada!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Error fatal:', error.message);
      process.exit(1);
    });
}

module.exports = { configurarPizzeriaCompleta };
