const { Pool } = require('pg');

// Configuración de la base de datos
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'sistempos',
  user: 'postgres',
  password: '69512310Anacleta'
});

async function checkAndCreateMeseros() {
  const client = await pool.connect();
  try {
    console.log('🔍 Verificando meseros existentes...');
    
    // Verificar meseros existentes
    const meseros = await client.query(`
      SELECT id_vendedor, nombre, username, rol, activo
      FROM vendedores 
      WHERE rol = 'mesero' AND activo = true
    `);
    
    console.log(`\n📋 Meseros activos encontrados: ${meseros.rows.length}`);
    meseros.rows.forEach(mesero => {
      console.log(`  - ID: ${mesero.id_vendedor}, Nombre: ${mesero.nombre}, Username: ${mesero.username}`);
    });
    
    // Si no hay meseros, crear algunos de prueba
    if (meseros.rows.length === 0) {
      console.log('\n🔧 Creando meseros de prueba...');
      
      await client.query(`
        INSERT INTO vendedores (nombre, username, email, password_hash, rol, activo, id_sucursal, id_restaurante) 
        VALUES 
          ('Juan Pérez', 'juan.mesero', 'juan@restaurante.com', '$2b$10$dummy.hash.for.testing', 'mesero', true, 1, 1),
          ('María García', 'maria.mesero', 'maria@restaurante.com', '$2b$10$dummy.hash.for.testing', 'mesero', true, 1, 1),
          ('Carlos López', 'carlos.mesero', 'carlos@restaurante.com', '$2b$10$dummy.hash.for.testing', 'mesero', true, 1, 1)
        ON CONFLICT (username) DO NOTHING
      `);
      
      console.log('✅ Meseros de prueba creados');
      
      // Verificar los meseros creados
      const nuevosMeseros = await client.query(`
        SELECT id_vendedor, nombre, username, rol, activo
        FROM vendedores 
        WHERE rol = 'mesero' AND activo = true
      `);
      
      console.log('\n📋 Meseros disponibles después de la creación:');
      nuevosMeseros.rows.forEach(mesero => {
        console.log(`  - ID: ${mesero.id_vendedor}, Nombre: ${mesero.nombre}, Username: ${mesero.username}`);
      });
    } else {
      console.log('\n✅ Ya hay meseros disponibles, no es necesario crear más');
    }
    
    // Verificar que la tabla grupos_mesas tiene la columna id_mesero
    const estructura = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'grupos_mesas' AND column_name = 'id_mesero'
    `);
    
    if (estructura.rows.length > 0) {
      console.log('\n✅ La tabla grupos_mesas tiene la columna id_mesero');
    } else {
      console.log('\n❌ La tabla grupos_mesas NO tiene la columna id_mesero');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    client.release();
  }
  await pool.end();
}

// Ejecutar si se llama directamente
if (require.main === module) {
  checkAndCreateMeseros()
    .then(() => {
      console.log('\n✅ Verificación completada');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error:', error);
      process.exit(1);
    });
}

module.exports = { checkAndCreateMeseros }; 