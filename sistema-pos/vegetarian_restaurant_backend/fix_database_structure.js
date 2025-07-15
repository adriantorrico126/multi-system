const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'sistempos',
  password: process.env.DB_PASSWORD || 'tu_password',
  port: process.env.DB_PORT || 5432,
});

async function fixDatabaseStructure() {
  const client = await pool.connect();
  try {
    console.log('🔧 Verificando y corrigiendo estructura de la base de datos...');
    
    // 1. Verificar que la tabla restaurantes existe
    const restaurantesExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'restaurantes'
      );
    `);
    
    if (!restaurantesExists.rows[0].exists) {
      console.log('❌ Tabla restaurantes no existe. Creando...');
      await client.query(`
        CREATE TABLE restaurantes (
          id_restaurante SERIAL PRIMARY KEY,
          nombre VARCHAR(255) NOT NULL UNIQUE,
          direccion TEXT,
          ciudad VARCHAR(100),
          telefono VARCHAR(20),
          email VARCHAR(255),
          activo BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);
    } else {
      console.log('✅ Tabla restaurantes existe');
    }
    
    // 2. Insertar restaurante por defecto si no existe
    const restauranteCount = await client.query('SELECT COUNT(*) FROM restaurantes');
    if (parseInt(restauranteCount.rows[0].count) === 0) {
      console.log('📝 Insertando restaurante por defecto...');
      await client.query(`
        INSERT INTO restaurantes (nombre, direccion, ciudad, telefono, email)
        VALUES ('Restaurante Principal', 'Dirección Principal', 'Ciudad Principal', '123456789', 'info@restaurante.com')
      `);
    }
    
    // 3. Verificar y agregar columna id_restaurante a todas las tablas
    const tables = ['categorias', 'productos', 'vendedores', 'metodos_pago', 'sucursales', 'mesas', 'ventas', 'detalle_ventas'];
    
    for (const table of tables) {
      try {
        // Verificar si la columna existe
        const columnExists = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = '${table}' 
            AND column_name = 'id_restaurante'
          );
        `);
        
        if (!columnExists.rows[0].exists) {
          console.log(`❌ Columna id_restaurante no existe en ${table}. Agregando...`);
          await client.query(`ALTER TABLE ${table} ADD COLUMN id_restaurante INTEGER DEFAULT 1`);
        } else {
          console.log(`✅ Columna id_restaurante existe en ${table}`);
        }
        
        // Actualizar registros existentes
        await client.query(`UPDATE ${table} SET id_restaurante = 1 WHERE id_restaurante IS NULL`);
        
      } catch (error) {
        console.log(`⚠️ Error con tabla ${table}: ${error.message}`);
      }
    }
    
    // 4. Verificar restricciones de clave foránea
    console.log('🔗 Verificando restricciones de clave foránea...');
    for (const table of tables) {
      try {
        await client.query(`
          ALTER TABLE ${table} 
          ADD CONSTRAINT IF NOT EXISTS fk_${table}_restaurante 
          FOREIGN KEY (id_restaurante) REFERENCES restaurantes(id_restaurante) ON DELETE CASCADE
        `);
        console.log(`✅ Restricción FK agregada a ${table}`);
      } catch (error) {
        console.log(`⚠️ Error con restricción FK en ${table}: ${error.message}`);
      }
    }
    
    // 5. Crear índices
    console.log('📊 Creando índices...');
    const indexQueries = [
      'CREATE INDEX IF NOT EXISTS idx_categorias_restaurante ON categorias(id_restaurante)',
      'CREATE INDEX IF NOT EXISTS idx_productos_restaurante ON productos(id_restaurante)',
      'CREATE INDEX IF NOT EXISTS idx_vendedores_restaurante ON vendedores(id_restaurante)',
      'CREATE INDEX IF NOT EXISTS idx_ventas_restaurante ON ventas(id_restaurante)',
      'CREATE INDEX IF NOT EXISTS idx_mesas_restaurante ON mesas(id_restaurante)',
      'CREATE INDEX IF NOT EXISTS idx_sucursales_restaurante ON sucursales(id_restaurante)'
    ];
    
    for (const query of indexQueries) {
      try {
        await client.query(query);
        console.log(`✅ Índice creado: ${query.split('ON ')[1]}`);
      } catch (error) {
        console.log(`⚠️ Error creando índice: ${error.message}`);
      }
    }
    
    console.log('🎉 Estructura de base de datos corregida exitosamente');
    
  } catch (error) {
    console.error('❌ Error durante la corrección:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

fixDatabaseStructure(); 