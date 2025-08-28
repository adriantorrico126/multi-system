const { Pool } = require('pg');
const dbConfig = require('./config_db');

// Configuración de la base de datos
const pool = new Pool(dbConfig);

async function checkVendedoresTable() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Verificando tabla vendedores...\n');
    
    // Verificar si la tabla vendedores existe
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'vendedores'
      ) as exists
    `);
    
    if (tableExists.rows[0].exists) {
      console.log('✅ Tabla vendedores EXISTE');
      
      // Contar registros
      const countResult = await client.query('SELECT COUNT(*) as count FROM vendedores');
      console.log(`   📊 Registros: ${countResult.rows[0].count}`);
      
      // Mostrar estructura de la tabla
      const structureResult = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'vendedores' 
        ORDER BY ordinal_position
      `);
      
      console.log(`   🏗️  Estructura:`);
      structureResult.rows.forEach(col => {
        const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        const defaultValue = col.column_default ? ` DEFAULT ${col.column_default}` : '';
        console.log(`      - ${col.column_name}: ${col.data_type} ${nullable}${defaultValue}`);
      });
      
      // Mostrar algunos vendedores
      const vendedoresResult = await client.query('SELECT id_vendedor, nombre, username, rol FROM vendedores LIMIT 5');
      if (vendedoresResult.rows.length > 0) {
        console.log(`   👥 Vendedores:`);
        vendedoresResult.rows.forEach(v => {
          console.log(`      - ID: ${v.id_vendedor}, Nombre: ${v.nombre}, Username: ${v.username}, Rol: ${v.rol}`);
        });
      }
      
    } else {
      console.log('❌ Tabla vendedores NO EXISTE');
      
      // Verificar qué tablas de usuarios existen
      const userTablesResult = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_name LIKE '%user%' OR table_name LIKE '%vendedor%' OR table_name LIKE '%empleado%'
      `);
      
      if (userTablesResult.rows.length > 0) {
        console.log(`   🔍 Tablas relacionadas con usuarios encontradas:`);
        userTablesResult.rows.forEach(t => {
          console.log(`      - ${t.table_name}`);
        });
      } else {
        console.log(`   🔍 No se encontraron tablas relacionadas con usuarios`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error durante la verificación:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Ejecutar verificación
if (require.main === module) {
  checkVendedoresTable()
    .then(() => {
      console.log('✅ Verificación completada');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Verificación falló:', error);
      process.exit(1);
    });
}

module.exports = { checkVendedoresTable };
