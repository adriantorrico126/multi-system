const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  host: 'localhost',
  user: 'postgres', 
  password: '6951230Anacleta',
  database: 'sistempos',
  port: 5432
});

async function createBackupBeforeMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🛡️ CREANDO BACKUP DE SEGURIDAD ANTES DE LA MIGRACIÓN...\n');
    
    // Crear directorio de backup si no existe
    const backupDir = path.join(__dirname, 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `backup_pre_migration_${timestamp}.sql`;
    const backupFilePath = path.join(backupDir, backupFileName);
    
    console.log('1️⃣ CREANDO BACKUP DE BASE DE DATOS...');
    
    // Usar pg_dump para crear backup completo
    const { spawn } = require('child_process');
    
    const pgDumpArgs = [
      '--host=localhost',
      '--port=5432',
      '--username=postgres',
      '--dbname=sistempos',
      '--verbose',
      '--clean',
      '--create',
      '--if-exists',
      '--no-password',
      '--file=' + backupFilePath
    ];
    
    return new Promise((resolve, reject) => {
      const pgDump = spawn('pg_dump', pgDumpArgs, {
        env: { ...process.env, PGPASSWORD: '6951230Anacleta' }
      });
      
      pgDump.stdout.on('data', (data) => {
        console.log(`   ${data}`);
      });
      
      pgDump.stderr.on('data', (data) => {
        console.log(`   ${data}`);
      });
      
      pgDump.on('close', (code) => {
        if (code === 0) {
          console.log(`   ✅ Backup creado exitosamente: ${backupFileName}`);
          console.log(`   📁 Ubicación: ${backupFilePath}`);
          resolve(backupFilePath);
        } else {
          console.error(`   ❌ Error creando backup. Código: ${code}`);
          reject(new Error(`pg_dump falló con código ${code}`));
        }
      });
    });
    
  } catch (error) {
    console.error('❌ ERROR CREANDO BACKUP:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Función alternativa usando SQL directo para tablas específicas
async function createBackupTables() {
  const client = await pool.connect();
  
  try {
    console.log('\n2️⃣ CREANDO BACKUP DE TABLAS ESPECÍFICAS...');
    
    const backupDir = path.join(__dirname, 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // Tablas críticas para el inventario
    const criticalTables = [
      'productos',
      'inventario_lotes', 
      'movimientos_inventario',
      'alertas_inventario',
      'sucursales',
      'restaurantes'
    ];
    
    for (const tableName of criticalTables) {
      console.log(`   📋 Respaldo tabla: ${tableName}`);
      
      const query = `SELECT * FROM ${tableName}`;
      const result = await client.query(query);
      
      const backupFileName = `backup_${tableName}_${timestamp}.json`;
      const backupFilePath = path.join(backupDir, backupFileName);
      
      const backupData = {
        table: tableName,
        timestamp: new Date().toISOString(),
        rowCount: result.rows.length,
        data: result.rows
      };
      
      fs.writeFileSync(backupFilePath, JSON.stringify(backupData, null, 2));
      console.log(`     ✅ ${tableName}: ${result.rows.length} registros respaldados`);
    }
    
    console.log('\n   🎉 Backup de tablas completado exitosamente');
    
  } catch (error) {
    console.error('❌ ERROR EN BACKUP DE TABLAS:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Función para verificar integridad antes de la migración
async function verifyDataIntegrity() {
  const client = await pool.connect();
  
  try {
    console.log('\n3️⃣ VERIFICANDO INTEGRIDAD DE DATOS...');
    
    // Verificar productos activos
    const productosQuery = await client.query(`
      SELECT COUNT(*) as total, SUM(stock_actual) as stock_total
      FROM productos WHERE activo = true
    `);
    console.log(`   📦 Productos activos: ${productosQuery.rows[0].total}`);
    console.log(`   📊 Stock total: ${productosQuery.rows[0].stock_total}`);
    
    // Verificar sucursales activas
    const sucursalesQuery = await client.query(`
      SELECT COUNT(*) as total
      FROM sucursales WHERE activo = true
    `);
    console.log(`   🏪 Sucursales activas: ${sucursalesQuery.rows[0].total}`);
    
    // Verificar lotes activos
    const lotesQuery = await client.query(`
      SELECT COUNT(*) as total, SUM(cantidad_actual) as stock_total
      FROM inventario_lotes WHERE activo = true
    `);
    console.log(`   📦 Lotes activos: ${lotesQuery.rows[0].total}`);
    console.log(`   📊 Stock en lotes: ${lotesQuery.rows[0].stock_total}`);
    
    // Verificar movimientos recientes
    const movimientosQuery = await client.query(`
      SELECT COUNT(*) as total
      FROM movimientos_inventario 
      WHERE fecha_movimiento >= CURRENT_DATE - INTERVAL '7 days'
    `);
    console.log(`   📈 Movimientos últimos 7 días: ${movimientosQuery.rows[0].total}`);
    
    console.log('   ✅ Verificación de integridad completada');
    
  } catch (error) {
    console.error('❌ ERROR EN VERIFICACIÓN:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

// Ejecutar backup completo
async function executeFullBackup() {
  try {
    await verifyDataIntegrity();
    await createBackupTables();
    console.log('\n🛡️ BACKUP COMPLETO FINALIZADO EXITOSAMENTE!');
    console.log('📁 Los archivos de backup están en: ./backups/');
    console.log('🚀 Ahora es seguro proceder con la migración');
  } catch (error) {
    console.error('💥 ERROR EN BACKUP COMPLETO:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  executeFullBackup()
    .then(() => {
      console.log('\n✅ Backup completado exitosamente!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Error en backup:', error);
      process.exit(1);
    });
}

module.exports = { 
  createBackupBeforeMigration, 
  createBackupTables, 
  verifyDataIntegrity,
  executeFullBackup 
};
