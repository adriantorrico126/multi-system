const { Pool } = require('pg');
const dbConfig = require('./config_db_production'); // Usar configuración de DigitalOcean

const pool = new Pool(dbConfig);

async function syncDatabaseStructures() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 SINCRONIZANDO ESTRUCTURAS DE BASE DE DATOS\n');
    console.log('=' .repeat(60));
    console.log('🎯 Objetivo: Sincronizar DigitalOcean con estructura local\n');
    
    // 1. VERIFICAR CONEXIÓN
    console.log('🔍 1. VERIFICANDO CONEXIÓN A DIGITAL OCEAN...');
    
    const versionResult = await client.query('SELECT version()');
    const currentDBResult = await client.query('SELECT current_database()');
    
    console.log('✅ Conexión exitosa a DigitalOcean');
    console.log(`   Base de datos: ${currentDBResult.rows[0].current_database}`);
    console.log(`   Versión: ${versionResult.rows[0].version.split(' ')[0]}`);
    
    // 2. ACTUALIZAR TABLA egresos
    console.log('\n🔧 2. ACTUALIZANDO TABLA egresos...');
    
    try {
      // Agregar columnas faltantes
      const alterEgresosQueries = [
        'ALTER TABLE egresos ADD COLUMN IF NOT EXISTS requiere_aprobacion BOOLEAN DEFAULT false',
        'ALTER TABLE egresos ADD COLUMN IF NOT EXISTS aprobado_por INTEGER',
        'ALTER TABLE egresos ADD COLUMN IF NOT EXISTS fecha_aprobacion TIMESTAMP WITHOUT TIME ZONE',
        'ALTER TABLE egresos ADD COLUMN IF NOT EXISTS comentario_aprobacion TEXT',
        'ALTER TABLE egresos ADD COLUMN IF NOT EXISTS es_deducible BOOLEAN DEFAULT false',
        'ALTER TABLE egresos ADD COLUMN IF NOT EXISTS numero_autorizacion_fiscal CHARACTER VARYING',
        'ALTER TABLE egresos ADD COLUMN IF NOT EXISTS codigo_control CHARACTER VARYING',
        'ALTER TABLE egresos ADD COLUMN IF NOT EXISTS es_recurrente BOOLEAN DEFAULT false',
        'ALTER TABLE egresos ADD COLUMN IF NOT EXISTS frecuencia_recurrencia CHARACTER VARYING',
        'ALTER TABLE egresos ADD COLUMN IF NOT EXISTS proxima_fecha_recurrencia DATE'
      ];
      
      for (const query of alterEgresosQueries) {
        try {
          await client.query(query);
          console.log(`   ✅ ${query.split('ADD COLUMN IF NOT EXISTS ')[1]?.split(' ')[0] || 'Columna agregada'}`);
        } catch (error) {
          if (error.code === '42701') { // Column already exists
            console.log(`   ℹ️  Columna ya existe`);
          } else {
            console.log(`   ⚠️  Error: ${error.message}`);
          }
        }
      }
      
      // Agregar columna JSONB para archivos adjuntos
      try {
        await client.query('ALTER TABLE egresos ADD COLUMN IF NOT EXISTS archivos_adjuntos JSONB');
        console.log('   ✅ archivos_adjuntos (JSONB)');
      } catch (error) {
        if (error.code === '42701') {
          console.log('   ℹ️  archivos_adjuntos ya existe');
        } else {
          console.log(`   ⚠️  Error archivos_adjuntos: ${error.message}`);
        }
      }
      
      console.log('   ✅ Tabla egresos actualizada');
      
    } catch (error) {
      console.log(`   ❌ Error actualizando egresos: ${error.message}`);
    }
    
    // 3. ACTUALIZAR TABLA presupuestos_egresos
    console.log('\n🔧 3. ACTUALIZANDO TABLA presupuestos_egresos...');
    
    try {
      // Verificar si existe monto_ejecutado o monto_gastado
      const checkColumnResult = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'presupuestos_egresos' 
        AND column_name IN ('monto_ejecutado', 'monto_gastado')
      `);
      
      if (checkColumnResult.rows.length === 0) {
        // No existe ninguna de las dos columnas, agregar monto_gastado
        await client.query('ALTER TABLE presupuestos_egresos ADD COLUMN monto_gastado NUMERIC DEFAULT 0');
        console.log('   ✅ monto_gastado agregado');
      } else if (checkColumnResult.rows.find(row => row.column_name === 'monto_ejecutado')) {
        // Existe monto_ejecutado, renombrar a monto_gastado
        await client.query('ALTER TABLE presupuestos_egresos RENAME COLUMN monto_ejecutado TO monto_gastado');
        console.log('   ✅ monto_ejecutado renombrado a monto_gastado');
      } else {
        console.log('   ℹ️  monto_gastado ya existe');
      }
      
      // Agregar columna activo si no existe
      try {
        await client.query('ALTER TABLE presupuestos_egresos ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT true');
        console.log('   ✅ activo agregado');
      } catch (error) {
        if (error.code === '42701') {
          console.log('   ℹ️  activo ya existe');
        } else {
          console.log(`   ⚠️  Error activo: ${error.message}`);
        }
      }
      
      console.log('   ✅ Tabla presupuestos_egresos actualizada');
      
    } catch (error) {
      console.log(`   ❌ Error actualizando presupuestos_egresos: ${error.message}`);
    }
    
    // 4. CREAR TABLA archivos_egresos
    console.log('\n🔧 4. CREANDO TABLA archivos_egresos...');
    
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS archivos_egresos (
          id_archivo SERIAL PRIMARY KEY,
          id_egreso INTEGER NOT NULL,
          nombre_archivo CHARACTER VARYING NOT NULL,
          ruta_archivo CHARACTER VARYING NOT NULL,
          tipo_archivo CHARACTER VARYING,
          tamaño_archivo INTEGER,
          subido_por INTEGER,
          fecha_subida TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
          FOREIGN KEY (id_egreso) REFERENCES egresos(id_egreso) ON DELETE CASCADE
        )
      `);
      console.log('   ✅ Tabla archivos_egresos creada');
      
    } catch (error) {
      console.log(`   ❌ Error creando archivos_egresos: ${error.message}`);
    }
    
    // 5. VERIFICAR ESTRUCTURA FINAL
    console.log('\n🔍 5. VERIFICANDO ESTRUCTURA FINAL...');
    
    const egresosColumns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'egresos' 
      ORDER BY ordinal_position
    `);
    
    console.log(`   📊 Tabla egresos: ${egresosColumns.rows.length} columnas`);
    
    const presupuestosColumns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'presupuestos_egresos' 
      ORDER BY ordinal_position
    `);
    
    console.log(`   📊 Tabla presupuestos_egresos: ${presupuestosColumns.rows.length} columnas`);
    
    const archivosColumns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'archivos_egresos' 
      ORDER BY ordinal_position
    `);
    
    console.log(`   📊 Tabla archivos_egresos: ${archivosColumns.rows.length} columnas`);
    
    console.log('\n🎉 ¡SINCRONIZACIÓN COMPLETADA!');
    console.log('💡 Las estructuras ahora están sincronizadas');
    console.log('🚀 El backend debería funcionar correctamente');
    
  } catch (error) {
    console.error('❌ Error durante la sincronización:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Ejecutar sincronización
if (require.main === module) {
  syncDatabaseStructures()
    .then(() => {
      console.log('\n✅ Sincronización finalizada');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Sincronización falló:', error);
      process.exit(1);
    });
}

module.exports = { syncDatabaseStructures };
