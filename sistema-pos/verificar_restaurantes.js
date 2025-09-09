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

async function verificarRestaurantes() {
  console.log('🔍 VERIFICANDO RESTAURANTES EN LA BASE DE DATOS');
  console.log('=' .repeat(60));
  
  const client = await pool.connect();
  
  try {
    // Verificar conexión
    console.log('🔌 Verificando conexión...');
    const testResult = await client.query('SELECT NOW()');
    console.log(`✅ Conexión exitosa - Hora: ${testResult.rows[0].now}`);
    
    // Listar todos los restaurantes
    console.log('\n📋 RESTAURANTES EXISTENTES:');
    const restaurantes = await client.query(`
      SELECT 
        r.id_restaurante, r.nombre, r.direccion, r.ciudad, r.telefono, r.activo, r.created_at,
        COUNT(DISTINCT s.id_sucursal) as sucursales_count,
        COUNT(DISTINCT v.id_vendedor) as usuarios_count,
        COUNT(DISTINCT c.id_categoria) as categorias_count,
        COUNT(DISTINCT m.id_mesa) as mesas_count
      FROM restaurantes r
      LEFT JOIN sucursales s ON r.id_restaurante = s.id_restaurante
      LEFT JOIN vendedores v ON r.id_restaurante = v.id_restaurante
      LEFT JOIN categorias c ON r.id_restaurante = c.id_restaurante
      LEFT JOIN mesas m ON r.id_restaurante = m.id_restaurante
      GROUP BY r.id_restaurante, r.nombre, r.direccion, r.ciudad, r.telefono, r.activo, r.created_at
      ORDER BY r.created_at DESC
    `);
    
    if (restaurantes.rows.length === 0) {
      console.log('❌ No hay restaurantes en la base de datos');
    } else {
      console.log(`✅ Se encontraron ${restaurantes.rows.length} restaurante(s):`);
      console.log('');
      
      restaurantes.rows.forEach((rest, index) => {
        console.log(`${index + 1}. 🏪 ${rest.nombre}`);
        console.log(`   ID: ${rest.id_restaurante}`);
        console.log(`   📍 ${rest.direccion}, ${rest.ciudad}`);
        console.log(`   📞 ${rest.telefono || 'No especificado'}`);
        console.log(`   🔄 Estado: ${rest.activo ? 'Activo' : 'Inactivo'}`);
        console.log(`   📅 Creado: ${rest.created_at}`);
        console.log(`   🏢 Sucursales: ${rest.sucursales_count}`);
        console.log(`   👥 Usuarios: ${rest.usuarios_count}`);
        console.log(`   📂 Categorías: ${rest.categorias_count}`);
        console.log(`   🪑 Mesas: ${rest.mesas_count}`);
        console.log('');
      });
    }
    
    // Buscar específicamente "Pizzeria Il Capriccio"
    console.log('🔍 BUSCANDO "Pizzeria Il Capriccio"...');
    const pizzeria = await client.query(`
      SELECT * FROM restaurantes WHERE nombre ILIKE '%pizzeria%' OR nombre ILIKE '%capriccio%'
    `);
    
    if (pizzeria.rows.length > 0) {
      console.log('✅ Se encontraron restaurantes similares:');
      pizzeria.rows.forEach(rest => {
        console.log(`   • ${rest.nombre} (ID: ${rest.id_restaurante})`);
      });
    } else {
      console.log('❌ No se encontraron restaurantes con "pizzeria" o "capriccio"');
    }
    
    // Verificar estructura de tablas
    console.log('\n🔧 VERIFICANDO ESTRUCTURA DE TABLAS...');
    
    const tablas = ['restaurantes', 'sucursales', 'vendedores', 'categorias', 'mesas'];
    
    for (const tabla of tablas) {
      try {
        const result = await client.query(`SELECT COUNT(*) FROM ${tabla}`);
        console.log(`   ✅ ${tabla}: ${result.rows[0].count} registros`);
      } catch (error) {
        console.log(`   ❌ ${tabla}: Error - ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

// Ejecutar script
if (require.main === module) {
  verificarRestaurantes()
    .then(() => {
      console.log('\n🎉 Verificación completada');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Error fatal:', error.message);
      process.exit(1);
    });
}

module.exports = { verificarRestaurantes };
