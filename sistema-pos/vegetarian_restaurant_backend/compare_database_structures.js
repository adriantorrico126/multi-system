const { Pool } = require('pg');
const dbConfigLocal = require('./config_db_backend'); // Configuración local
const dbConfigProduction = require('./config_db_production'); // Configuración DigitalOcean

const poolLocal = new Pool(dbConfigLocal);
const poolProduction = new Pool(dbConfigProduction);

async function compareDatabaseStructures() {
  const clientLocal = await poolLocal.connect();
  const clientProduction = await poolProduction.connect();
  
  try {
    console.log('🔍 COMPARANDO ESTRUCTURAS DE BASE DE DATOS\n');
    console.log('=' .repeat(60));
    console.log('🎯 Objetivo: Identificar diferencias entre local y DigitalOcean\n');
    
    // 1. VERIFICAR CONEXIONES
    console.log('🔍 1. VERIFICANDO CONEXIONES...');
    
    const localVersion = await clientLocal.query('SELECT version()');
    const localDB = await clientLocal.query('SELECT current_database()');
    const productionVersion = await clientProduction.query('SELECT version()');
    const productionDB = await clientProduction.query('SELECT current_database()');
    
    console.log('✅ Conexión LOCAL exitosa:');
    console.log(`   Base de datos: ${localDB.rows[0].current_database}`);
    console.log(`   Versión: ${localVersion.rows[0].version.split(' ')[0]}`);
    
    console.log('✅ Conexión DIGITAL OCEAN exitosa:');
    console.log(`   Base de datos: ${productionDB.rows[0].current_database}`);
    console.log(`   Versión: ${productionVersion.rows[0].version.split(' ')[0]}`);
    
    // 2. CONTAR TOTAL DE COLUMNAS
    console.log('\n📊 2. CONTEO TOTAL DE COLUMNAS:');
    
    const localColumnsCount = await clientLocal.query(`
      SELECT COUNT(*) as total_columns
      FROM information_schema.columns 
      WHERE table_schema = 'public'
    `);
    
    const productionColumnsCount = await clientProduction.query(`
      SELECT COUNT(*) as total_columns
      FROM information_schema.columns 
      WHERE table_schema = 'public'
    `);
    
    const localCount = localColumnsCount.rows[0].total_columns;
    const productionCount = productionColumnsCount.rows[0].total_columns;
    const difference = localCount - productionCount;
    
    console.log(`   📊 LOCAL: ${localCount} columnas`);
    console.log(`   📊 DIGITAL OCEAN: ${productionCount} columnas`);
    console.log(`   🔍 DIFERENCIA: ${difference} columnas`);
    
    // 3. LISTAR TABLAS EN AMBAS BASES
    console.log('\n📋 3. COMPARANDO TABLAS:');
    
    const localTables = await clientLocal.query(`
      SELECT table_name, COUNT(*) as column_count
      FROM information_schema.columns 
      WHERE table_schema = 'public'
      GROUP BY table_name
      ORDER BY table_name
    `);
    
    const productionTables = await clientProduction.query(`
      SELECT table_name, COUNT(*) as column_count
      FROM information_schema.columns 
      WHERE table_schema = 'public'
      GROUP BY table_name
      ORDER BY table_name
    `);
    
    const localTableNames = localTables.rows.map(row => row.table_name);
    const productionTableNames = productionTables.rows.map(row => row.table_name);
    
    // Tablas solo en LOCAL
    const onlyInLocal = localTableNames.filter(name => !productionTableNames.includes(name));
    
    // Tablas solo en PRODUCTION
    const onlyInProduction = productionTableNames.filter(name => !localTableNames.includes(name));
    
    // Tablas en ambas
    const commonTables = localTableNames.filter(name => productionTableNames.includes(name));
    
    console.log(`   📊 TOTAL TABLAS LOCAL: ${localTableNames.length}`);
    console.log(`   📊 TOTAL TABLAS PRODUCTION: ${productionTableNames.length}`);
    console.log(`   🔗 TABLAS EN AMBAS: ${commonTables.length}`);
    
    if (onlyInLocal.length > 0) {
      console.log(`\n❌ TABLAS SOLO EN LOCAL (${onlyInLocal.length}):`);
      onlyInLocal.forEach(table => {
        const tableInfo = localTables.rows.find(row => row.table_name === table);
        console.log(`   📋 ${table} (${tableInfo.column_count} columnas)`);
      });
    }
    
    if (onlyInProduction.length > 0) {
      console.log(`\n➕ TABLAS SOLO EN PRODUCTION (${onlyInProduction.length}):`);
      onlyInProduction.forEach(table => {
        const tableInfo = productionTables.rows.find(row => row.table_name === table);
        console.log(`   📋 ${table} (${tableInfo.column_count} columnas)`);
      });
    }
    
    // 4. COMPARAR COLUMNAS EN TABLAS COMUNES
    console.log('\n🔍 4. COMPARANDO COLUMNAS EN TABLAS COMUNES:');
    
    let totalColumnDifference = 0;
    
    for (const tableName of commonTables) {
      const localTableColumns = await clientLocal.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position
      `, [tableName]);
      
      const productionTableColumns = await clientProduction.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position
      `, [tableName]);
      
      const localColumnNames = localTableColumns.rows.map(row => row.column_name);
      const productionColumnNames = productionTableColumns.rows.map(row => row.column_name);
      
      const onlyInLocalColumns = localColumnNames.filter(name => !productionColumnNames.includes(name));
      const onlyInProductionColumns = productionColumnNames.filter(name => !localColumnNames.includes(name));
      
      if (onlyInLocalColumns.length > 0 || onlyInProductionColumns.length > 0) {
        console.log(`\n   📋 TABLA: ${tableName}`);
        console.log(`      📊 LOCAL: ${localColumnNames.length} columnas`);
        console.log(`      📊 PRODUCTION: ${productionColumnNames.length} columnas`);
        
        if (onlyInLocalColumns.length > 0) {
          console.log(`      ❌ COLUMNAS SOLO EN LOCAL:`);
          onlyInLocalColumns.forEach(col => {
            const colInfo = localTableColumns.rows.find(row => row.column_name === col);
            console.log(`         - ${col} (${colInfo.data_type})`);
          });
        }
        
        if (onlyInProductionColumns.length > 0) {
          console.log(`      ➕ COLUMNAS SOLO EN PRODUCTION:`);
          onlyInProductionColumns.forEach(col => {
            const colInfo = productionTableColumns.rows.find(row => row.column_name === col);
            console.log(`         - ${col} (${colInfo.data_type})`);
          });
        }
        
        totalColumnDifference += Math.abs(localColumnNames.length - productionColumnNames.length);
      }
    }
    
    // 5. RESUMEN FINAL
    console.log('\n📈 5. RESUMEN DE DIFERENCIAS:');
    console.log(`   🔍 DIFERENCIA TOTAL DE COLUMNAS: ${difference}`);
    console.log(`   📋 TABLAS FALTANTES EN PRODUCTION: ${onlyInLocal.length}`);
    console.log(`   📋 TABLAS EXTRA EN PRODUCTION: ${onlyInProduction.length}`);
    console.log(`   🔗 COLUMNAS DIFERENTES EN TABLAS COMUNES: ${totalColumnDifference}`);
    
    if (difference > 0) {
      console.log(`\n⚠️  RECOMENDACIONES:`);
      console.log(`   📋 Migrar tablas faltantes: ${onlyInLocal.join(', ')}`);
      console.log(`   🔧 Sincronizar estructuras de tablas comunes`);
      console.log(`   ✅ Verificar que todas las columnas estén presentes`);
    } else {
      console.log(`\n✅ ¡ESTRUCTURAS IDÉNTICAS!`);
    }
    
  } catch (error) {
    console.error('❌ Error durante la comparación:', error);
    throw error;
  } finally {
    clientLocal.release();
    clientProduction.release();
    await poolLocal.end();
    await poolProduction.end();
  }
}

// Ejecutar comparación
if (require.main === module) {
  compareDatabaseStructures()
    .then(() => {
      console.log('\n✅ Comparación finalizada');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Comparación falló:', error);
      process.exit(1);
    });
}

module.exports = { compareDatabaseStructures };
