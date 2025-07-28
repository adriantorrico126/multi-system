const { Pool } = require('pg');

// Configuración de la base de datos
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'sistempos',
  user: 'postgres',
  password: '69512310Anacleta'
});

async function checkMesasEnGrupoStructure() {
  const client = await pool.connect();
  try {
    console.log('🔍 Verificando estructura de mesas_en_grupo...');
    
    // Verificar si la tabla existe
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'mesas_en_grupo'
      );
    `);
    
    if (!tableExists.rows[0].exists) {
      console.log('❌ La tabla mesas_en_grupo NO existe');
      return;
    }
    
    console.log('✅ La tabla mesas_en_grupo existe');
    
    // Verificar estructura de la tabla
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'mesas_en_grupo'
      ORDER BY ordinal_position;
    `);
    
    console.log('\n📋 Estructura de la tabla mesas_en_grupo:');
    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
    });
    
    // Verificar restricciones únicas de forma más simple
    const uniqueConstraints = await client.query(`
      SELECT 
        tc.constraint_name,
        tc.constraint_type,
        kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_name = 'mesas_en_grupo'
        AND tc.constraint_type IN ('PRIMARY KEY', 'UNIQUE')
      ORDER BY tc.constraint_name, kcu.ordinal_position;
    `);
    
    console.log('\n📋 Restricciones únicas:');
    if (uniqueConstraints.rows.length === 0) {
      console.log('  - No hay restricciones únicas');
    } else {
      let currentConstraint = '';
      uniqueConstraints.rows.forEach(row => {
        if (row.constraint_name !== currentConstraint) {
          currentConstraint = row.constraint_name;
          console.log(`  - ${row.constraint_name}: ${row.constraint_type} (${row.column_name}`);
        } else {
          console.log(`    ${row.column_name}`);
        }
      });
    }
    
    // Verificar restricciones de clave foránea
    const foreignKeys = await client.query(`
      SELECT 
        tc.constraint_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_name = 'mesas_en_grupo';
    `);
    
    console.log('\n📋 Claves foráneas:');
    if (foreignKeys.rows.length === 0) {
      console.log('  - No hay claves foráneas');
    } else {
      foreignKeys.rows.forEach(fk => {
        console.log(`  - ${fk.constraint_name}: ${fk.column_name} -> ${fk.foreign_table_name}.${fk.foreign_column_name}`);
      });
    }
    
    // Verificar datos existentes
    const existingData = await client.query(`
      SELECT COUNT(*) as total_rows
      FROM mesas_en_grupo;
    `);
    
    console.log(`\n📋 Datos existentes: ${existingData.rows[0].total_rows} filas`);
    
    if (existingData.rows[0].total_rows > 0) {
      const sampleData = await client.query(`
        SELECT * FROM mesas_en_grupo LIMIT 5;
      `);
      
      console.log('\n📋 Muestra de datos:');
      sampleData.rows.forEach(row => {
        console.log(`  - ${JSON.stringify(row)}`);
      });
    }
    
    // Verificar específicamente la restricción uq_mesa_en_grupo
    const specificConstraint = await client.query(`
      SELECT 
        tc.constraint_name,
        tc.constraint_type,
        kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_name = 'mesas_en_grupo'
        AND tc.constraint_name = 'uq_mesa_en_grupo';
    `);
    
    console.log('\n📋 Restricción específica uq_mesa_en_grupo:');
    if (specificConstraint.rows.length === 0) {
      console.log('  - La restricción uq_mesa_en_grupo NO existe');
    } else {
      specificConstraint.rows.forEach(row => {
        console.log(`  - ${row.constraint_name}: ${row.constraint_type} en columna ${row.column_name}`);
      });
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
  checkMesasEnGrupoStructure()
    .then(() => {
      console.log('\n✅ Verificación completada');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error:', error);
      process.exit(1);
    });
}

module.exports = { checkMesasEnGrupoStructure }; 