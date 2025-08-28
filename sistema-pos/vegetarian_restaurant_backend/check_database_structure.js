const { Pool } = require('pg');
const dbConfig = require('./config_db_local');

const pool = new Pool(dbConfig);

async function checkDatabaseStructure() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 VERIFICANDO ESTRUCTURA COMPLETA DE LA BASE DE DATOS\n');
    console.log('=' .repeat(60));
    
    // 1. VERIFICAR CONEXIÓN
    console.log('\n📊 1. VERIFICANDO CONEXIÓN...');
    try {
      const connectionTest = await client.query('SELECT NOW() as current_time, version() as db_version');
      console.log('✅ Conexión exitosa a PostgreSQL');
      console.log(`   Hora actual: ${connectionTest.rows[0].current_time}`);
      console.log(`   Versión: ${connectionTest.rows[0].db_version.split(' ')[0]}`);
    } catch (error) {
      console.error('❌ Error de conexión:', error.message);
      return;
    }
    
    // 2. LISTAR TODAS LAS TABLAS
    console.log('\n📋 2. LISTANDO TODAS LAS TABLAS EXISTENTES...');
    try {
      const tablesResult = await client.query(`
        SELECT 
          table_name,
          table_type
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
      `);
      
      if (tablesResult.rows.length > 0) {
        console.log(`✅ Se encontraron ${tablesResult.rows.length} tablas:`);
        tablesResult.rows.forEach(table => {
          const type = table.table_type === 'BASE TABLE' ? '📊' : '👁️';
          console.log(`   ${type} ${table.table_name}`);
        });
      } else {
        console.log('❌ No se encontraron tablas en la base de datos');
        return;
      }
    } catch (error) {
      console.error('❌ Error listando tablas:', error.message);
      return;
    }
    
    // 3. VERIFICAR TABLAS CRÍTICAS DEL SISTEMA
    console.log('\n🏗️ 3. VERIFICANDO TABLAS CRÍTICAS DEL SISTEMA...');
    const criticalTables = [
      'restaurantes',
      'sucursales', 
      'vendedores',
      'usuarios',
      'mesas',
      'productos',
      'categorias',
      'ventas',
      'comandas'
    ];
    
    const existingTables = [];
    const missingTables = [];
    
    for (const table of criticalTables) {
      try {
        const tableExists = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = $1 AND table_schema = 'public'
          ) as exists
        `, [table]);
        
        if (tableExists.rows[0].exists) {
          const countResult = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
          existingTables.push({ name: table, count: countResult.rows[0].count });
          console.log(`✅ ${table}: ${countResult.rows[0].count} registros`);
        } else {
          missingTables.push(table);
          console.log(`❌ ${table}: NO EXISTE`);
        }
      } catch (error) {
        console.log(`⚠️  ${table}: Error - ${error.message}`);
      }
    }
    
    // 4. ANALIZAR TABLAS EXISTENTES
    console.log('\n🔍 4. ANALIZANDO TABLAS EXISTENTES...');
    for (const table of existingTables) {
      try {
        const structureResult = await client.query(`
          SELECT 
            column_name, 
            data_type, 
            is_nullable, 
            column_default,
            character_maximum_length
          FROM information_schema.columns 
          WHERE table_name = $1 AND table_schema = 'public'
          ORDER BY ordinal_position
        `, [table.name]);
        
        console.log(`\n📊 Estructura de ${table.name} (${table.count} registros):`);
        structureResult.rows.forEach(col => {
          const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
          const length = col.character_maximum_length ? `(${col.character_maximum_length})` : '';
          const defaultValue = col.column_default ? ` DEFAULT ${col.column_default}` : '';
          console.log(`   - ${col.column_name}: ${col.data_type}${length} ${nullable}${defaultValue}`);
        });
        
        // Mostrar algunos registros de ejemplo
        if (table.count > 0) {
          const sampleResult = await client.query(`SELECT * FROM ${table.name} LIMIT 3`);
          console.log(`   📝 Ejemplos de registros:`);
          sampleResult.rows.forEach((row, index) => {
            const sample = Object.entries(row).slice(0, 3).map(([key, value]) => `${key}: ${value}`).join(', ');
            console.log(`      ${index + 1}. ${sample}${Object.keys(row).length > 3 ? '...' : ''}`);
          });
        }
        
      } catch (error) {
        console.log(`   ⚠️  Error analizando ${table.name}: ${error.message}`);
      }
    }
    
    // 5. RECOMENDACIONES
    console.log('\n💡 5. RECOMENDACIONES...');
    console.log('=' .repeat(60));
    
    if (missingTables.length > 0) {
      console.log('❌ TABLAS FALTANTES CRÍTICAS:');
      missingTables.forEach(table => {
        console.log(`   - ${table}`);
      });
      
      if (missingTables.includes('restaurantes')) {
        console.log('\n🚨 PROBLEMA CRÍTICO: No hay tabla restaurantes');
        console.log('💡 Esta tabla es fundamental para el sistema multi-restaurante');
        console.log('💡 Necesitas crear la estructura básica del sistema primero');
      }
      
      if (missingTables.includes('vendedores')) {
        console.log('\n🚨 PROBLEMA CRÍTICO: No hay tabla vendedores');
        console.log('💡 Esta tabla es necesaria para el sistema de egresos');
        console.log('💡 Los egresos deben estar asociados a un vendedor');
      }
      
      console.log('\n🔧 ACCIONES REQUERIDAS:');
      console.log('   1. Crear tabla restaurantes (si no existe)');
      console.log('   2. Crear tabla sucursales (si no existe)');
      console.log('   3. Crear tabla vendedores (si no existe)');
      console.log('   4. Insertar datos básicos del sistema');
      console.log('   5. Luego crear el sistema de egresos');
      
    } else {
      console.log('✅ Todas las tablas críticas existen');
      console.log('💡 Puedes proceder con la migración del sistema de egresos');
    }
    
    // 6. RESUMEN FINAL
    console.log('\n🎯 6. RESUMEN FINAL...');
    console.log('=' .repeat(60));
    console.log(`📊 Total de tablas encontradas: ${existingTables.length}`);
    console.log(`❌ Tablas faltantes: ${missingTables.length}`);
    
    if (existingTables.length > 0) {
      const totalRecords = existingTables.reduce((sum, table) => sum + parseInt(table.count), 0);
      console.log(`📝 Total de registros en el sistema: ${totalRecords}`);
    }
    
    if (missingTables.length === 0) {
      console.log('\n🎉 ¡BASE DE DATOS COMPLETA!');
      console.log('💡 Puedes ejecutar: node migrate_egresos_simple_local.js');
    } else {
      console.log('\n⚠️  BASE DE DATOS INCOMPLETA');
      console.log('💡 Ejecuta: node check_database_structure.js');
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
  checkDatabaseStructure()
    .then(() => {
      console.log('\n✅ Verificación de estructura finalizada');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Verificación falló:', error);
      process.exit(1);
    });
}

module.exports = { checkDatabaseStructure };
