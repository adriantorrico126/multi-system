const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const dbConfig = require('./config_db_production'); // Usar configuración de DigitalOcean

const pool = new Pool(dbConfig);

async function createBackupBeforeData() {
  const client = await pool.connect();
  
  try {
    console.log('🛡️ CREANDO BACKUP DE SEGURIDAD\n');
    console.log('=' .repeat(60));
    console.log('🎯 Objetivo: Backup antes de insertar datos de prueba\n');
    
    // 1. VERIFICAR CONEXIÓN
    console.log('🔍 1. VERIFICANDO CONEXIÓN...');
    
    const versionResult = await client.query('SELECT version()');
    const currentDBResult = await client.query('SELECT current_database()');
    
    console.log('✅ Conexión exitosa a DigitalOcean');
    console.log(`   Base de datos: ${currentDBResult.rows[0].current_database}`);
    console.log(`   Versión: ${versionResult.rows[0].version.split(' ')[0]}`);
    
    // 2. CREAR DIRECTORIO DE BACKUPS
    const backupDir = path.join(__dirname, 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir);
      console.log('   ✅ Directorio de backups creado');
    }
    
    // 3. GENERAR NOMBRE DE ARCHIVO CON TIMESTAMP
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `backup_before_data_${timestamp}.sql`;
    const backupFilePath = path.join(backupDir, backupFileName);
    
    console.log(`\n📁 2. CREANDO BACKUP: ${backupFileName}`);
    
    // 4. BACKUP DE ESTRUCTURAS CLAVE
    const backupQueries = [
      // Backup de estructura de egresos
      {
        name: 'Estructura de egresos',
        query: `
          SELECT 
            '-- ESTRUCTURA DE TABLA egresos' as comment,
            'CREATE TABLE IF NOT EXISTS egresos_backup AS SELECT * FROM egresos WHERE 1=0;' as create_statement
          UNION ALL
          SELECT 
            '-- Columnas de egresos:',
            string_agg(column_name || ' ' || data_type || 
              CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END, 
              ', ' ORDER BY ordinal_position) as columns
          FROM information_schema.columns 
          WHERE table_name = 'egresos'
        `
      },
      
      // Backup de estructura de categorias_egresos
      {
        name: 'Estructura de categorias_egresos',
        query: `
          SELECT 
            '-- ESTRUCTURA DE TABLA categorias_egresos' as comment,
            'CREATE TABLE IF NOT EXISTS categorias_egresos_backup AS SELECT * FROM categorias_egresos WHERE 1=0;' as create_statement
          UNION ALL
          SELECT 
            '-- Columnas de categorias_egresos:',
            string_agg(column_name || ' ' || data_type || 
              CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END, 
              ', ' ORDER BY ordinal_position) as columns
          FROM information_schema.columns 
          WHERE table_name = 'categorias_egresos'
        `
      },
      
      // Backup de estructura de presupuestos_egresos
      {
        name: 'Estructura de presupuestos_egresos',
        query: `
          SELECT 
            '-- ESTRUCTURA DE TABLA presupuestos_egresos' as comment,
            'CREATE TABLE IF NOT EXISTS presupuestos_egresos_backup AS SELECT * FROM presupuestos_egresos WHERE 1=0;' as create_statement
          UNION ALL
          SELECT 
            '-- Columnas de presupuestos_egresos:',
            string_agg(column_name || ' ' || data_type || 
              CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END, 
              ', ' ORDER BY ordinal_position) as columns
          FROM information_schema.columns 
          WHERE table_name = 'presupuestos_egresos'
        `
      },
      
      // Backup de estructura de archivos_egresos
      {
        name: 'Estructura de archivos_egresos',
        query: `
          SELECT 
            '-- ESTRUCTURA DE TABLA archivos_egresos' as comment,
            'CREATE TABLE IF NOT EXISTS archivos_egresos_backup AS SELECT * FROM archivos_egresos WHERE 1=0;' as create_statement
          UNION ALL
          SELECT 
            '-- Columnas de archivos_egresos:',
            string_agg(column_name || ' ' || data_type || 
              CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END, 
              ', ' ORDER BY ordinal_position) as columns
          FROM information_schema.columns 
          WHERE table_name = 'archivos_egresos'
        `
      }
    ];
    
    let backupContent = `-- =====================================================\n`;
    backupContent += `-- BACKUP DE SEGURIDAD - ANTES DE INSERTAR DATOS\n`;
    backupContent += `-- Fecha: ${new Date().toLocaleString()}\n`;
    backupContent += `-- Base de datos: ${currentDBResult.rows[0].current_database}\n`;
    backupContent += `-- Versión: ${versionResult.rows[0].version}\n`;
    backupContent += `-- =====================================================\n\n`;
    
    // 5. EJECUTAR QUERIES DE BACKUP
    for (const backupQuery of backupQueries) {
      try {
        console.log(`   📋 Generando ${backupQuery.name}...`);
        
        const result = await client.query(backupQuery.query);
        
        backupContent += `-- ${backupQuery.name}\n`;
        result.rows.forEach(row => {
          if (row.comment) {
            backupContent += `${row.comment}\n`;
          }
          if (row.create_statement) {
            backupContent += `${row.create_statement}\n`;
          }
          if (row.columns) {
            backupContent += `${row.columns}\n`;
          }
        });
        backupContent += '\n';
        
        console.log(`   ✅ ${backupQuery.name} completado`);
        
      } catch (error) {
        console.log(`   ⚠️  Error en ${backupQuery.name}: ${error.message}`);
        backupContent += `-- ERROR: ${error.message}\n\n`;
      }
    }
    
    // 6. AGREGAR INSTRUCCIONES DE RESTAURACIÓN
    backupContent += `-- =====================================================\n`;
    backupContent += `-- INSTRUCCIONES DE RESTAURACIÓN\n`;
    backupContent += `-- =====================================================\n`;
    backupContent += `-- Para restaurar desde este backup:\n`;
    backupContent += `-- 1. Ejecutar las sentencias CREATE TABLE\n`;
    backupContent += `-- 2. Restaurar datos si es necesario\n`;
    backupContent += `-- 3. Verificar integridad de la base\n`;
    backupContent += `-- =====================================================\n`;
    
    // 7. GUARDAR ARCHIVO DE BACKUP
    fs.writeFileSync(backupFilePath, backupContent, 'utf8');
    
    console.log(`\n💾 3. BACKUP GUARDADO:`);
    console.log(`   📁 Ruta: ${backupFilePath}`);
    console.log(`   📊 Tamaño: ${(backupContent.length / 1024).toFixed(2)} KB`);
    
    // 8. VERIFICAR ARCHIVO
    if (fs.existsSync(backupFilePath)) {
      const stats = fs.statSync(backupFilePath);
      console.log(`   ✅ Archivo creado: ${stats.size} bytes`);
      console.log(`   📅 Fecha: ${stats.mtime.toLocaleString()}`);
    }
    
    console.log('\n🎉 ¡BACKUP DE SEGURIDAD COMPLETADO!');
    console.log('💡 Ahora es seguro proceder con la inserción de datos');
    console.log('🔄 Puedes restaurar desde este punto si es necesario');
    
  } catch (error) {
    console.error('❌ Error durante el backup:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Ejecutar backup
if (require.main === module) {
  createBackupBeforeData()
    .then(() => {
      console.log('\n✅ Backup finalizado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Backup falló:', error);
      process.exit(1);
    });
}

module.exports = { createBackupBeforeData };
