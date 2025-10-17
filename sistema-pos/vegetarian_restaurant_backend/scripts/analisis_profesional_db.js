require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.POS_DB_USER || 'postgres',
  host: process.env.POS_DB_HOST || 'localhost',
  database: process.env.POS_DB_NAME || 'sistempos',
  password: process.env.POS_DB_PASSWORD || '6951230Anacleta',
  port: process.env.POS_DB_PORT || 5432,
});

async function analisisProfesionalDB() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 ANÁLISIS PROFESIONAL COMPLETO DE BASE DE DATOS');
    console.log('================================================\n');
    
    // 1. ANÁLISIS DE TABLAS
    console.log('📊 1. ANÁLISIS DE TABLAS');
    console.log('========================');
    
    const tablesQuery = `
      SELECT 
        t.table_name,
        t.table_type,
        pg_size_pretty(pg_total_relation_size(quote_ident(t.table_name))) as size,
        obj_description(c.oid) as comment
      FROM information_schema.tables t
      LEFT JOIN pg_class c ON c.relname = t.table_name
      WHERE t.table_schema = 'public' 
      ORDER BY pg_total_relation_size(quote_ident(t.table_name)) DESC;
    `;
    
    const tablesResult = await client.query(tablesQuery);
    
    console.log(`Total de tablas: ${tablesResult.rows.length}\n`);
    
    // Agrupar por tipo
    const tablasPorTipo = {};
    tablesResult.rows.forEach(row => {
      if (!tablasPorTipo[row.table_type]) {
        tablasPorTipo[row.table_type] = [];
      }
      tablasPorTipo[row.table_type].push(row);
    });
    
    Object.keys(tablasPorTipo).forEach(tipo => {
      console.log(`${tipo.toUpperCase()}: ${tablasPorTipo[tipo].length} tablas`);
      tablasPorTipo[tipo].forEach(tabla => {
        console.log(`  - ${tabla.table_name} (${tabla.size})`);
      });
      console.log('');
    });
    
    // 2. ANÁLISIS DE FUNCIONES
    console.log('⚙️  2. ANÁLISIS DE FUNCIONES');
    console.log('============================');
    
    const functionsQuery = `
      SELECT 
        p.proname as function_name,
        pg_get_function_result(p.oid) as return_type,
        pg_get_function_arguments(p.oid) as arguments,
        l.lanname as language,
        obj_description(p.oid) as comment
      FROM pg_proc p
      LEFT JOIN pg_language l ON p.prolang = l.oid
      WHERE p.pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
      ORDER BY p.proname;
    `;
    
    const functionsResult = await client.query(functionsQuery);
    
    console.log(`Total de funciones: ${functionsResult.rows.length}\n`);
    functionsResult.rows.forEach(func => {
      console.log(`📋 ${func.function_name}`);
      console.log(`   Lenguaje: ${func.language}`);
      console.log(`   Argumentos: ${func.arguments}`);
      console.log(`   Retorna: ${func.return_type}`);
      if (func.comment) console.log(`   Comentario: ${func.comment}`);
      console.log('');
    });
    
    // 3. ANÁLISIS DE TRIGGERS
    console.log('🔄 3. ANÁLISIS DE TRIGGERS');
    console.log('==========================');
    
    const triggersQuery = `
      SELECT 
        t.trigger_name,
        t.event_object_table,
        t.action_timing,
        t.event_manipulation,
        t.action_statement,
        obj_description(t.oid) as comment
      FROM information_schema.triggers t
      LEFT JOIN pg_trigger tr ON tr.tgname = t.trigger_name
      WHERE t.trigger_schema = 'public'
      ORDER BY t.event_object_table, t.trigger_name;
    `;
    
    const triggersResult = await client.query(triggersQuery);
    
    console.log(`Total de triggers: ${triggersResult.rows.length}\n`);
    
    const triggersPorTabla = {};
    triggersResult.rows.forEach(trigger => {
      if (!triggersPorTabla[trigger.event_object_table]) {
        triggersPorTabla[trigger.event_object_table] = [];
      }
      triggersPorTabla[trigger.event_object_table].push(trigger);
    });
    
    Object.keys(triggersPorTabla).forEach(tabla => {
      console.log(`📋 Tabla: ${tabla}`);
      triggersPorTabla[tabla].forEach(trigger => {
        console.log(`  🔄 ${trigger.trigger_name}`);
        console.log(`     Evento: ${trigger.action_timing} ${trigger.event_manipulation}`);
        console.log(`     Función: ${trigger.action_statement}`);
      });
      console.log('');
    });
    
    // 4. ANÁLISIS DE VISTAS
    console.log('👁️  4. ANÁLISIS DE VISTAS');
    console.log('=========================');
    
    const viewsQuery = `
      SELECT 
        v.table_name,
        v.view_definition,
        obj_description(c.oid) as comment
      FROM information_schema.views v
      LEFT JOIN pg_class c ON c.relname = v.table_name
      WHERE v.table_schema = 'public'
      ORDER BY v.table_name;
    `;
    
    const viewsResult = await client.query(viewsQuery);
    
    console.log(`Total de vistas: ${viewsResult.rows.length}\n`);
    viewsResult.rows.forEach(view => {
      console.log(`📋 ${view.table_name}`);
      if (view.comment) console.log(`   Comentario: ${view.comment}`);
      console.log(`   Definición: ${view.view_definition.substring(0, 100)}...`);
      console.log('');
    });
    
    // 5. ANÁLISIS DE ÍNDICES
    console.log('🔍 5. ANÁLISIS DE ÍNDICES');
    console.log('==========================');
    
    const indexesQuery = `
      SELECT 
        i.indexname,
        i.tablename,
        i.indexdef,
        pg_size_pretty(pg_relation_size(quote_ident(i.indexname))) as size
      FROM pg_indexes i
      WHERE i.schemaname = 'public'
      ORDER BY pg_relation_size(quote_ident(i.indexname)) DESC;
    `;
    
    const indexesResult = await client.query(indexesQuery);
    
    console.log(`Total de índices: ${indexesResult.rows.length}\n`);
    
    const indexesPorTabla = {};
    indexesResult.rows.forEach(index => {
      if (!indexesPorTabla[index.tablename]) {
        indexesPorTabla[index.tablename] = [];
      }
      indexesPorTabla[index.tablename].push(index);
    });
    
    Object.keys(indexesPorTabla).forEach(tabla => {
      console.log(`📋 Tabla: ${tabla} (${indexesPorTabla[tabla].length} índices)`);
      indexesPorTabla[tabla].forEach(index => {
        console.log(`  🔍 ${index.indexname} (${index.size})`);
        if (index.indexname.includes('pkey')) {
          console.log(`     PRIMARY KEY`);
        } else if (index.indexname.includes('fkey')) {
          console.log(`     FOREIGN KEY`);
        } else {
          console.log(`     ${index.indexdef}`);
        }
      });
      console.log('');
    });
    
    // 6. ANÁLISIS DE CONSTRAINTS
    console.log('🔗 6. ANÁLISIS DE CONSTRAINTS');
    console.log('=============================');
    
    const constraintsQuery = `
      SELECT 
        tc.table_name,
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
      WHERE tc.table_schema = 'public'
      ORDER BY tc.table_name, tc.constraint_type;
    `;
    
    const constraintsResult = await client.query(constraintsQuery);
    
    console.log(`Total de constraints: ${constraintsResult.rows.length}\n`);
    
    const constraintsPorTipo = {};
    const constraintsPorTabla = {};
    
    constraintsResult.rows.forEach(constraint => {
      // Por tipo
      if (!constraintsPorTipo[constraint.constraint_type]) {
        constraintsPorTipo[constraint.constraint_type] = [];
      }
      constraintsPorTipo[constraint.constraint_type].push(constraint);
      
      // Por tabla
      if (!constraintsPorTabla[constraint.table_name]) {
        constraintsPorTabla[constraint.table_name] = [];
      }
      constraintsPorTabla[constraint.table_name].push(constraint);
    });
    
    Object.keys(constraintsPorTipo).forEach(tipo => {
      console.log(`📋 ${tipo}: ${constraintsPorTipo[tipo].length} constraints`);
    });
    console.log('');
    
    // 7. ANÁLISIS ESPECÍFICO DE TABLAS PROBLEMÁTICAS
    console.log('🚨 7. ANÁLISIS DE TABLAS PROBLEMÁTICAS');
    console.log('======================================');
    
    const tablasProblematicas = ['planes', 'planes_pos', 'usuarios', 'vendedores'];
    
    for (const tabla of tablasProblematicas) {
      const existe = tablesResult.rows.some(row => row.table_name === tabla);
      console.log(`\n📋 Tabla: ${tabla}`);
      console.log('─'.repeat(50));
      
      if (!existe) {
        console.log(`❌ NO EXISTE`);
        continue;
      }
      
      // Estructura detallada
      const structureQuery = `
        SELECT 
          c.column_name,
          c.data_type,
          c.character_maximum_length,
          c.is_nullable,
          c.column_default,
          c.ordinal_position,
          obj_description(pgc.oid) as comment
        FROM information_schema.columns c
        LEFT JOIN pg_class pgc ON pgc.relname = c.table_name
        WHERE c.table_name = $1 AND c.table_schema = 'public'
        ORDER BY c.ordinal_position;
      `;
      
      const structureResult = await client.query(structureQuery, [tabla]);
      
      console.log(`📊 Estructura (${structureResult.rows.length} columnas):`);
      structureResult.rows.forEach(col => {
        let tipo = col.data_type;
        if (col.character_maximum_length) {
          tipo += `(${col.character_maximum_length})`;
        }
        console.log(`  ${col.ordinal_position}. ${col.column_name}: ${tipo} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
        if (col.column_default) {
          console.log(`     DEFAULT: ${col.column_default}`);
        }
        if (col.comment) {
          console.log(`     COMMENT: ${col.comment}`);
        }
      });
      
      // Constraints específicos
      const tablaConstraints = constraintsPorTabla[tabla] || [];
      if (tablaConstraints.length > 0) {
        console.log(`\n🔗 Constraints (${tablaConstraints.length}):`);
        tablaConstraints.forEach(constraint => {
          console.log(`  - ${constraint.constraint_type}: ${constraint.constraint_name}`);
          if (constraint.constraint_type === 'FOREIGN KEY') {
            console.log(`    ${constraint.column_name} → ${constraint.foreign_table_name}.${constraint.foreign_column_name}`);
          }
        });
      }
      
      // Índices específicos
      const tablaIndexes = indexesPorTabla[tabla] || [];
      if (tablaIndexes.length > 0) {
        console.log(`\n🔍 Índices (${tablaIndexes.length}):`);
        tablaIndexes.forEach(index => {
          console.log(`  - ${index.indexname} (${index.size})`);
        });
      }
      
      // Triggers específicos
      const tablaTriggers = triggersPorTabla[tabla] || [];
      if (tablaTriggers.length > 0) {
        console.log(`\n🔄 Triggers (${tablaTriggers.length}):`);
        tablaTriggers.forEach(trigger => {
          console.log(`  - ${trigger.trigger_name}: ${trigger.action_timing} ${trigger.event_manipulation}`);
        });
      }
      
      // Conteo de registros
      try {
        const countQuery = `SELECT COUNT(*) as total FROM ${tabla}`;
        const countResult = await client.query(countQuery);
        console.log(`\n📊 Registros: ${countResult.rows[0].total}`);
        
        // Muestra algunos registros de ejemplo
        if (parseInt(countResult.rows[0].total) > 0 && parseInt(countResult.rows[0].total) <= 10) {
          const sampleQuery = `SELECT * FROM ${tabla} LIMIT 3`;
          const sampleResult = await client.query(sampleQuery);
          console.log(`📋 Muestra de registros:`);
          sampleResult.rows.forEach((row, index) => {
            console.log(`  ${index + 1}. ${JSON.stringify(row)}`);
          });
        }
      } catch (error) {
        console.log(`❌ Error al consultar registros: ${error.message}`);
      }
    }
    
    // 8. ANÁLISIS DE DEPENDENCIAS
    console.log('\n🔗 8. ANÁLISIS DE DEPENDENCIAS');
    console.log('==============================');
    
    const dependenciesQuery = `
      SELECT DISTINCT
        ccu.table_name as dependent_table,
        ccu.column_name as dependent_column,
        tc.table_name as referenced_table,
        ccu2.column_name as referenced_column,
        tc.constraint_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
      JOIN information_schema.constraint_column_usage ccu2
        ON ccu2.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
        AND ccu.table_name != tc.table_name
      ORDER BY ccu.table_name, tc.table_name;
    `;
    
    const dependenciesResult = await client.query(dependenciesQuery);
    
    console.log(`Total de dependencias: ${dependenciesResult.rows.length}\n`);
    
    const dependenciesPorTabla = {};
    dependenciesResult.rows.forEach(dep => {
      if (!dependenciesPorTabla[dep.dependent_table]) {
        dependenciesPorTabla[dep.dependent_table] = [];
      }
      dependenciesPorTabla[dep.dependent_table].push(dep);
    });
    
    Object.keys(dependenciesPorTabla).forEach(tabla => {
      console.log(`📋 ${tabla} depende de:`);
      dependenciesPorTabla[tabla].forEach(dep => {
        console.log(`  - ${dep.dependent_column} → ${dep.referenced_table}.${dep.referenced_column}`);
      });
      console.log('');
    });
    
    // 9. RECOMENDACIONES FINALES
    console.log('\n💡 9. RECOMENDACIONES FINALES');
    console.log('============================');
    
    console.log('🎯 TABLAS A ELIMINAR:');
    console.log('  - planes_pos (duplicada de planes)');
    console.log('  - Tablas del sistema web (17 tablas identificadas)');
    console.log('  - Tablas backup obsoletas');
    
    console.log('\n🔧 CORRECCIONES NECESARIAS:');
    console.log('  - Verificar foreign keys rotas');
    console.log('  - Actualizar referencias de planes_pos a planes');
    console.log('  - Revisar triggers y funciones obsoletas');
    
    console.log('\n📊 OPTIMIZACIONES:');
    console.log('  - Revisar índices no utilizados');
    console.log('  - Limpiar vistas obsoletas');
    console.log('  - Actualizar estadísticas de tablas');
    
  } catch (error) {
    console.error('❌ Error en el análisis:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

analisisProfesionalDB()
  .then(() => {
    console.log('\n✅ Análisis profesional completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error en el análisis:', error);
    process.exit(1);
  });
