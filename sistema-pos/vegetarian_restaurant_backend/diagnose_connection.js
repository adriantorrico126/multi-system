const { Pool } = require('pg');
const dbConfig = require('./config_db_production');

console.log('🔍 DIAGNÓSTICO DE CONEXIÓN A BASE DE DATOS\n');
console.log('=' .repeat(60));

console.log('📋 CONFIGURACIÓN ACTUAL:');
console.log(`   Host: ${dbConfig.host}`);
console.log(`   Port: ${dbConfig.port}`);
console.log(`   Database: ${dbConfig.database}`);
console.log(`   User: ${dbConfig.user}`);
console.log(`   SSL: ${dbConfig.ssl}`);
console.log(`   Password: ${dbConfig.password ? '***CONFIGURADO***' : 'NO CONFIGURADO'}`);

console.log('\n🔗 INTENTANDO CONEXIÓN...');

const pool = new Pool(dbConfig);

async function diagnoseConnection() {
  const client = await pool.connect();
  
  try {
    console.log('✅ Conexión exitosa!');
    
    // 1. VERIFICAR INFORMACIÓN DE LA CONEXIÓN
    console.log('\n📊 INFORMACIÓN DE LA CONEXIÓN:');
    
    const versionResult = await client.query('SELECT version()');
    console.log(`   Versión PostgreSQL: ${versionResult.rows[0].version}`);
    
    const currentDBResult = await client.query('SELECT current_database()');
    console.log(`   Base de datos actual: ${currentDBResult.rows[0].current_database}`);
    
    const currentUserResult = await client.query('SELECT current_user');
    console.log(`   Usuario actual: ${currentUserResult.rows[0].current_user}`);
    
    const currentHostResult = await client.query('SELECT inet_server_addr(), inet_server_port()');
    console.log(`   Servidor: ${currentHostResult.rows[0].inet_server_addr}:${currentHostResult.rows[0].inet_server_port}`);
    
    // 2. VERIFICAR TABLAS EXISTENTES
    console.log('\n📋 TABLAS EN LA BASE DE DATOS:');
    
    const tablesResult = await client.query(`
      SELECT table_name, table_schema
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    if (tablesResult.rows.length > 0) {
      console.log(`   Total de tablas: ${tablesResult.rows.length}`);
      tablesResult.rows.forEach(table => {
        console.log(`   - ${table.table_name}`);
      });
    } else {
      console.log('   ❌ No hay tablas en esta base de datos');
    }
    
    // 3. VERIFICAR DATOS EN TABLAS CRÍTICAS
    console.log('\n💰 VERIFICANDO DATOS EN TABLAS CRÍTICAS:');
    
    const criticalTables = ['restaurantes', 'sucursales', 'vendedores', 'categorias_egresos', 'egresos', 'presupuestos_egresos'];
    
    for (const table of criticalTables) {
      try {
        const countResult = await client.query(`SELECT COUNT(*) FROM ${table}`);
        const count = parseInt(countResult.rows[0].count);
        console.log(`   📊 ${table}: ${count} registros`);
        
        if (count > 0) {
          const sampleResult = await client.query(`SELECT * FROM ${table} LIMIT 1`);
          const sample = sampleResult.rows[0];
          const keys = Object.keys(sample).slice(0, 3);
          const sampleData = keys.map(key => `${key}: ${sample[key]}`).join(', ');
          console.log(`      📝 Ejemplo: ${sampleData}...`);
        }
      } catch (error) {
        console.log(`   ❌ ${table}: Error - ${error.message}`);
      }
    }
    
    // 4. VERIFICAR ESTRUCTURA DE TABLAS
    console.log('\n🏗️ ESTRUCTURA DE TABLAS CRÍTICAS:');
    
    for (const table of criticalTables) {
      try {
        const structureResult = await client.query(`
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns 
          WHERE table_name = $1 AND table_schema = 'public'
          ORDER BY ordinal_position
        `, [table]);
        
        if (structureResult.rows.length > 0) {
          console.log(`   📋 ${table}: ${structureResult.rows.length} columnas`);
          structureResult.rows.slice(0, 3).forEach(col => {
            console.log(`      - ${col.column_name}: ${col.data_type} (${col.is_nullable})`);
          });
        }
      } catch (error) {
        console.log(`   ❌ Error verificando estructura de ${table}: ${error.message}`);
      }
    }
    
    console.log('\n🎯 DIAGNÓSTICO COMPLETADO');
    console.log('💡 Compara esta información con tu configuración de DBeaver');
    
  } catch (error) {
    console.error('❌ Error durante el diagnóstico:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Ejecutar diagnóstico
diagnoseConnection()
  .then(() => {
    console.log('\n✅ Diagnóstico finalizado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Diagnóstico falló:', error);
    process.exit(1);
  });
