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

async function crearMesasFinal() {
  console.log('🪑 CREANDO MESAS PARA PIZZERIA IL CAPRICCIO');
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
    
    // Obtener la sucursal
    const sucursalResult = await client.query(
      'SELECT id_sucursal, nombre FROM sucursales WHERE id_restaurante = $1 LIMIT 1',
      [restaurante.id_restaurante]
    );
    
    const sucursal = sucursalResult.rows[0];
    console.log(`✅ Sucursal: ${sucursal.nombre} (ID: ${sucursal.id_sucursal})`);
    
    // Crear mesas (sin columna activo)
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
    
    // Mostrar resumen final completo
    console.log('\n🎉 PIZZERIA IL CAPRICCIO COMPLETAMENTE CONFIGURADA!');
    console.log('=' .repeat(60));
    console.log(`🏪 Restaurante: ${restaurante.nombre}`);
    console.log(`📍 ID: ${restaurante.id_restaurante}`);
    console.log(`🏢 Sucursal: ${sucursal.nombre} (ID: ${sucursal.id_sucursal})`);
    console.log(`🪑 Mesas: ${mesasCreadas} nuevas creadas`);
    
    // Verificar estado final completo
    console.log('\n🔍 ESTADO FINAL DE LA PIZZERIA:');
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
    
    // Mostrar categorías disponibles
    const categorias = await client.query(`
      SELECT nombre FROM categorias 
      WHERE id_restaurante = $1
      ORDER BY nombre
    `, [restaurante.id_restaurante]);
    
    console.log('\n🍕 CATEGORÍAS DISPONIBLES:');
    categorias.rows.forEach((cat, index) => {
      console.log(`   ${index + 1}. ${cat.nombre}`);
    });
    
    // Mostrar usuarios
    const usuarios = await client.query(`
      SELECT nombre, username, email, rol FROM vendedores 
      WHERE id_restaurante = $1
    `, [restaurante.id_restaurante]);
    
    console.log('\n👥 USUARIOS:');
    usuarios.rows.forEach(usuario => {
      console.log(`   • ${usuario.nombre} (${usuario.username}) - ${usuario.rol}`);
    });
    
    console.log('\n✅ ¡LA PIZZERIA ESTÁ LISTA PARA USAR!');
    console.log('🔗 Credenciales de acceso:');
    console.log('   Username: Alejandro');
    console.log('   Contraseña: P1ZZ4s1lC4P');
    console.log('   Email: alejandro05052004@gmail.com');
    
    console.log('\n🎯 PRÓXIMOS PASOS:');
    console.log('   1. Acceder al sistema POS con las credenciales');
    console.log('   2. Configurar productos en cada categoría');
    console.log('   3. Probar el sistema completo');
    console.log('   4. Entrenar al personal');
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

// Ejecutar script
if (require.main === module) {
  crearMesasFinal()
    .then(() => {
      console.log('\n🎉 ¡Configuración completada exitosamente!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Error fatal:', error.message);
      process.exit(1);
    });
}

module.exports = { crearMesasFinal };
