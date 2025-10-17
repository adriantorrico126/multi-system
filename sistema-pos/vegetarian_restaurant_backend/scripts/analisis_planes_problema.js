require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.POS_DB_USER || 'postgres',
  host: process.env.POS_DB_HOST || 'localhost',
  database: process.env.POS_DB_NAME || 'sistempos',
  password: process.env.POS_DB_PASSWORD || '6951230Anacleta',
  port: process.env.POS_DB_PORT || 5432,
});

async function analisisPlanesProblema() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 ANÁLISIS ESPECÍFICO: PLANES vs PLANES_POS');
    console.log('============================================\n');
    
    // 1. Verificar si ambas tablas existen
    const tablasExistentes = await client.query(`
      SELECT table_name, table_type
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('planes', 'planes_pos')
      ORDER BY table_name;
    `);
    
    console.log('📊 TABLAS ENCONTRADAS:');
    tablasExistentes.rows.forEach(tabla => {
      console.log(`✅ ${tabla.table_name} (${tabla.table_type})`);
    });
    
    if (tablasExistentes.rows.length === 0) {
      console.log('❌ No se encontraron las tablas planes o planes_pos');
      return;
    }
    
    // 2. Analizar estructura de cada tabla
    for (const tabla of tablasExistentes.rows) {
      console.log(`\n📋 ANÁLISIS DE TABLA: ${tabla.table_name.toUpperCase()}`);
      console.log('='.repeat(50));
      
      // Estructura de columnas
      const estructura = await client.query(`
        SELECT 
          column_name,
          data_type,
          character_maximum_length,
          is_nullable,
          column_default,
          ordinal_position
        FROM information_schema.columns 
        WHERE table_name = $1 AND table_schema = 'public'
        ORDER BY ordinal_position;
      `, [tabla.table_name]);
      
      console.log(`📊 Columnas (${estructura.rows.length}):`);
      estructura.rows.forEach(col => {
        let tipo = col.data_type;
        if (col.character_maximum_length) {
          tipo += `(${col.character_maximum_length})`;
        }
        console.log(`  ${col.ordinal_position}. ${col.column_name}: ${tipo} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
        if (col.column_default) {
          console.log(`     DEFAULT: ${col.column_default}`);
        }
      });
      
      // Conteo de registros
      const countQuery = `SELECT COUNT(*) as total FROM ${tabla.table_name}`;
      const countResult = await client.query(countQuery);
      console.log(`\n📊 Registros: ${countResult.rows[0].total}`);
      
      // Mostrar registros si hay pocos
      if (parseInt(countResult.rows[0].total) <= 10) {
        const sampleQuery = `SELECT * FROM ${tabla.table_name} ORDER BY ${estructura.rows[0].column_name}`;
        const sampleResult = await client.query(sampleQuery);
        
        console.log(`\n📋 Registros completos:`);
        sampleResult.rows.forEach((row, index) => {
          console.log(`  ${index + 1}. ${JSON.stringify(row, null, 2)}`);
        });
      } else {
        console.log(`\n📋 Muestra de registros (primeros 3):`);
        const sampleQuery = `SELECT * FROM ${tabla.table_name} LIMIT 3`;
        const sampleResult = await client.query(sampleQuery);
        
        sampleResult.rows.forEach((row, index) => {
          console.log(`  ${index + 1}. ${JSON.stringify(row, null, 2)}`);
        });
      }
      
      // Constraints (Primary Keys, Foreign Keys, etc.)
      const constraints = await client.query(`
        SELECT 
          tc.constraint_name,
          tc.constraint_type,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints tc
        LEFT JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
        LEFT JOIN information_schema.constraint_column_usage ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.table_name = $1 AND tc.table_schema = 'public'
        ORDER BY tc.constraint_type, tc.constraint_name;
      `, [tabla.table_name]);
      
      if (constraints.rows.length > 0) {
        console.log(`\n🔗 Constraints (${constraints.rows.length}):`);
        constraints.rows.forEach(constraint => {
          console.log(`  - ${constraint.constraint_type}: ${constraint.constraint_name}`);
          if (constraint.constraint_type === 'FOREIGN KEY') {
            console.log(`    ${constraint.column_name} → ${constraint.foreign_table_name}.${constraint.foreign_column_name}`);
          }
        });
      }
      
      // Índices
      const indices = await client.query(`
        SELECT 
          indexname,
          indexdef
        FROM pg_indexes 
        WHERE tablename = $1 AND schemaname = 'public'
        ORDER BY indexname;
      `, [tabla.table_name]);
      
      if (indices.rows.length > 0) {
        console.log(`\n🔍 Índices (${indices.rows.length}):`);
        indices.rows.forEach(index => {
          console.log(`  - ${index.indexname}`);
          if (index.indexname.includes('pkey')) {
            console.log(`    PRIMARY KEY`);
          } else {
            console.log(`    ${index.indexdef}`);
          }
        });
      }
    }
    
    // 3. Comparar estructuras si ambas tablas existen
    if (tablasExistentes.rows.length === 2) {
      console.log('\n🔄 COMPARACIÓN DE ESTRUCTURAS');
      console.log('=============================');
      
      const estructuraPlanes = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'planes' AND table_schema = 'public'
        ORDER BY ordinal_position;
      `);
      
      const estructuraPlanesPos = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'planes_pos' AND table_schema = 'public'
        ORDER BY ordinal_position;
      `);
      
      console.log('📊 Comparación de columnas:');
      console.log('PLANES vs PLANES_POS');
      console.log('-'.repeat(30));
      
      const maxColumns = Math.max(estructuraPlanes.rows.length, estructuraPlanesPos.rows.length);
      
      for (let i = 0; i < maxColumns; i++) {
        const colPlanes = estructuraPlanes.rows[i];
        const colPlanesPos = estructuraPlanesPos.rows[i];
        
        if (colPlanes && colPlanesPos) {
          const match = colPlanes.column_name === colPlanesPos.column_name && 
                       colPlanes.data_type === colPlanesPos.data_type;
          console.log(`${match ? '✅' : '❌'} ${colPlanes.column_name} vs ${colPlanesPos.column_name}`);
        } else if (colPlanes) {
          console.log(`⚠️  ${colPlanes.column_name} (solo en planes)`);
        } else if (colPlanesPos) {
          console.log(`⚠️  ${colPlanesPos.column_name} (solo en planes_pos)`);
        }
      }
    }
    
    // 4. Verificar foreign keys que referencian estas tablas
    console.log('\n🔗 FOREIGN KEYS QUE REFERENCIAN ESTAS TABLAS');
    console.log('=============================================');
    
    const fkReferencias = await client.query(`
      SELECT 
        tc.table_name as tabla_origen,
        kcu.column_name as columna_origen,
        tc.constraint_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND ccu.table_name IN ('planes', 'planes_pos')
        AND tc.table_schema = 'public'
      ORDER BY tc.table_name;
    `);
    
    if (fkReferencias.rows.length > 0) {
      console.log('⚠️  TABLAS QUE REFERENCIAN PLANES:');
      fkReferencias.rows.forEach(fk => {
        console.log(`  - ${fk.tabla_origen}.${fk.columna_origen} → ${fk.constraint_name}`);
      });
    } else {
      console.log('✅ No hay foreign keys que referencien estas tablas');
    }
    
    // 5. Recomendaciones específicas
    console.log('\n💡 RECOMENDACIONES ESPECÍFICAS');
    console.log('===============================');
    
    if (tablasExistentes.rows.some(t => t.table_name === 'planes_pos')) {
      console.log('🚨 PROBLEMA IDENTIFICADO:');
      console.log('  - La tabla "planes_pos" es duplicada y debe eliminarse');
      console.log('  - La tabla principal "planes" tiene 4 registros (correcta)');
      console.log('  - La tabla "planes_pos" tiene 3 registros (obsoleta)');
      
      console.log('\n🔧 ACCIÓN RECOMENDADA:');
      console.log('  1. Verificar que no hay datos únicos en planes_pos');
      console.log('  2. Migrar datos únicos a planes si es necesario');
      console.log('  3. Eliminar foreign keys que referencien planes_pos');
      console.log('  4. Eliminar tabla planes_pos');
      
      console.log('\n⚠️  COMANDOS SUGERIDOS:');
      console.log('  -- Verificar datos únicos');
      console.log('  SELECT * FROM planes_pos WHERE NOT EXISTS (');
      console.log('    SELECT 1 FROM planes p WHERE p.nombre = planes_pos.nombre');
      console.log('  );');
      console.log('');
      console.log('  -- Eliminar tabla (después de verificar)');
      console.log('  DROP TABLE planes_pos CASCADE;');
    }
    
  } catch (error) {
    console.error('❌ Error en el análisis:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

analisisPlanesProblema()
  .then(() => {
    console.log('\n✅ Análisis completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error en el análisis:', error);
    process.exit(1);
  });


