require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.POS_DB_USER || 'postgres',
  host: process.env.POS_DB_HOST || 'localhost',
  database: process.env.POS_DB_NAME || 'sistempos',
  password: process.env.POS_DB_PASSWORD || '6951230Anacleta',
  port: process.env.POS_DB_PORT || 5432,
});

async function analisisCompletoDB() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 ANÁLISIS COMPLETO DE BASE DE DATOS');
    console.log('=====================================\n');
    
    // 1. Obtener todas las tablas
    const tablesQuery = `
      SELECT table_name, 
             pg_size_pretty(pg_total_relation_size(quote_ident(table_name))) as size
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY pg_total_relation_size(quote_ident(table_name)) DESC;
    `;
    
    const tablesResult = await client.query(tablesQuery);
    
    console.log('📊 TODAS LAS TABLAS EN LA BASE DE DATOS:');
    console.log('==========================================');
    tablesResult.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.table_name} (${row.size})`);
    });
    
    console.log(`\n📈 Total: ${tablesResult.rows.length} tablas\n`);
    
    // 2. Analizar tablas problemáticas identificadas
    console.log('🚨 ANÁLISIS DE TABLAS PROBLEMÁTICAS:');
    console.log('====================================');
    
    const tablasProblematicas = [
      'planes_pos', 'usuarios', 'system_tasks', 'planes',
      'metodos_pago_backup', 'servicios_restaurante', 'vendedores'
    ];
    
    for (const tabla of tablasProblematicas) {
      const existe = tablesResult.rows.some(row => row.table_name === tabla);
      console.log(`${existe ? '✅' : '❌'} ${tabla} ${existe ? 'EXISTE' : 'NO EXISTE'}`);
      
      if (existe) {
        // Analizar estructura de la tabla
        const structureQuery = `
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_name = $1 AND table_schema = 'public'
          ORDER BY ordinal_position;
        `;
        
        const structureResult = await client.query(structureQuery, [tabla]);
        
        console.log(`   📋 Columnas (${structureResult.rows.length}):`);
        structureResult.rows.forEach(col => {
          console.log(`      - ${col.column_name} (${col.data_type})`);
        });
        
        // Contar registros
        const countQuery = `SELECT COUNT(*) as total FROM ${tabla}`;
        try {
          const countResult = await client.query(countQuery);
          console.log(`   📊 Registros: ${countResult.rows[0].total}`);
        } catch (error) {
          console.log(`   ❌ Error al contar registros: ${error.message}`);
        }
        
        console.log('');
      }
    }
    
    // 3. Identificar tablas duplicadas o similares
    console.log('🔄 ANÁLISIS DE DUPLICACIONES:');
    console.log('==============================');
    
    // Comparar planes vs planes_pos
    if (tablesResult.rows.some(row => row.table_name === 'planes') && 
        tablesResult.rows.some(row => row.table_name === 'planes_pos')) {
      console.log('⚠️  DUPLICACIÓN DETECTADA: planes y planes_pos');
      
      const planesQuery = `SELECT COUNT(*) as total FROM planes`;
      const planesPosQuery = `SELECT COUNT(*) as total FROM planes_pos`;
      
      const planesResult = await client.query(planesQuery);
      const planesPosResult = await client.query(planesPosQuery);
      
      console.log(`   - Tabla 'planes': ${planesResult.rows[0].total} registros`);
      console.log(`   - Tabla 'planes_pos': ${planesPosResult.rows[0].total} registros`);
    }
    
    // Comparar usuarios vs vendedores
    if (tablesResult.rows.some(row => row.table_name === 'usuarios') && 
        tablesResult.rows.some(row => row.table_name === 'vendedores')) {
      console.log('⚠️  DUPLICACIÓN DETECTADA: usuarios y vendedores');
      
      const usuariosQuery = `SELECT COUNT(*) as total FROM usuarios`;
      const vendedoresQuery = `SELECT COUNT(*) as total FROM vendedores`;
      
      const usuariosResult = await client.query(usuariosQuery);
      const vendedoresResult = await client.query(vendedoresQuery);
      
      console.log(`   - Tabla 'usuarios': ${usuariosResult.rows[0].total} registros`);
      console.log(`   - Tabla 'vendedores': ${vendedoresResult.rows[0].total} registros`);
    }
    
    // 4. Analizar tablas del sistema web que no deberían estar en POS
    console.log('\n🌐 TABLAS DEL SISTEMA WEB (POSIBLE CONTAMINACIÓN):');
    console.log('===================================================');
    
    const tablasWeb = [
      'leads_prospectos', 'demos_reuniones', 'solicitudes_demo',
      'casos_exito', 'testimonios_web', 'newsletter_suscriptores',
      'conversion_events', 'metricas_web', 'configuracion_web',
      'contenido_web', 'auditoria_admin', 'auditoria_planes',
      'auditoria_pos', 'system_tasks'
    ];
    
    for (const tabla of tablasWeb) {
      const existe = tablesResult.rows.some(row => row.table_name === tabla);
      if (existe) {
        const countQuery = `SELECT COUNT(*) as total FROM ${tabla}`;
        try {
          const countResult = await client.query(countQuery);
          console.log(`⚠️  ${tabla}: ${countResult.rows[0].total} registros`);
        } catch (error) {
          console.log(`❌ ${tabla}: Error al contar registros`);
        }
      }
    }
    
    // 5. Analizar foreign keys rotas o problemáticas
    console.log('\n🔗 ANÁLISIS DE FOREIGN KEYS:');
    console.log('============================');
    
    const fkQuery = `
      SELECT 
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        tc.constraint_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
      ORDER BY tc.table_name;
    `;
    
    const fkResult = await client.query(fkQuery);
    
    console.log(`📊 Total de Foreign Keys: ${fkResult.rows.length}`);
    
    // Verificar foreign keys problemáticas
    const fkProblematicas = fkResult.rows.filter(fk => 
      fk.foreign_table_name === 'usuarios' || 
      fk.foreign_table_name === 'planes_pos'
    );
    
    if (fkProblematicas.length > 0) {
      console.log('\n⚠️  FOREIGN KEYS PROBLEMÁTICAS:');
      fkProblematicas.forEach(fk => {
        console.log(`   - ${fk.table_name}.${fk.column_name} -> ${fk.foreign_table_name}.${fk.foreign_column_name}`);
      });
    }
    
    // 6. Recomendaciones
    console.log('\n💡 RECOMENDACIONES:');
    console.log('===================');
    console.log('1. 🗑️  ELIMINAR tablas del sistema web que no pertenecen al POS');
    console.log('2. 🔄 UNIFICAR tablas duplicadas (planes vs planes_pos)');
    console.log('3. 👥 USAR tabla "vendedores" en lugar de "usuarios"');
    console.log('4. 🧹 LIMPIAR tablas backup o temporales');
    console.log('5. 🔗 CORREGIR foreign keys rotas');
    console.log('6. 📊 OPTIMIZAR tablas con muchos registros vacíos');
    
  } catch (error) {
    console.error('❌ Error en el análisis:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

analisisCompletoDB()
  .then(() => {
    console.log('\n✅ Análisis completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error en el análisis:', error);
    process.exit(1);
  });


