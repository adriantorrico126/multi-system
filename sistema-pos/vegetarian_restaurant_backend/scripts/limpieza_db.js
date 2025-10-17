require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.POS_DB_USER || 'postgres',
  host: process.env.POS_DB_HOST || 'localhost',
  database: process.env.POS_DB_NAME || 'sistempos',
  password: process.env.POS_DB_PASSWORD || '6951230Anacleta',
  port: process.env.POS_DB_PORT || 5432,
});

async function limpiezaDB() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('🧹 INICIANDO LIMPIEZA DE BASE DE DATOS');
    console.log('=====================================\n');
    
    // 1. Crear backup de datos importantes antes de eliminar
    console.log('💾 Creando backup de datos importantes...');
    
    // Backup de planes_pos antes de eliminar
    const backupPlanesPos = await client.query(`
      CREATE TABLE IF NOT EXISTS backup_planes_pos AS 
      SELECT * FROM planes_pos
    `);
    console.log('✅ Backup de planes_pos creado');
    
    // 2. Eliminar tablas del sistema web que no pertenecen al POS
    console.log('\n🗑️  Eliminando tablas del sistema web...');
    
    const tablasWebAEliminar = [
      'leads_prospectos',
      'demos_reuniones', 
      'solicitudes_demo',
      'casos_exito',
      'testimonios_web',
      'newsletter_suscriptores',
      'conversion_events',
      'metricas_web',
      'configuracion_web',
      'contenido_web',
      'auditoria_admin',
      'auditoria_planes',
      'auditoria_pos',
      'system_tasks',
      'admin_users',
      'roles_admin',
      'user_sessions'
    ];
    
    for (const tabla of tablasWebAEliminar) {
      try {
        await client.query(`DROP TABLE IF EXISTS ${tabla} CASCADE`);
        console.log(`✅ Tabla ${tabla} eliminada`);
      } catch (error) {
        console.log(`❌ Error eliminando ${tabla}: ${error.message}`);
      }
    }
    
    // 3. Migrar datos de planes_pos a planes si es necesario
    console.log('\n🔄 Verificando migración de planes...');
    
    const planesPosCount = await client.query('SELECT COUNT(*) as total FROM planes_pos');
    const planesCount = await client.query('SELECT COUNT(*) as total FROM planes');
    
    console.log(`   - planes_pos: ${planesPosCount.rows[0].total} registros`);
    console.log(`   - planes: ${planesCount.rows[0].total} registros`);
    
    if (planesPosCount.rows[0].total > 0 && planesCount.rows[0].total < planesPosCount.rows[0].total) {
      console.log('⚠️  Migrando datos de planes_pos a planes...');
      
      // Insertar datos que no existen en planes
      await client.query(`
        INSERT INTO planes (
          nombre, descripcion, precio_mensual, precio_anual,
          max_sucursales, max_usuarios, activo, created_at
        )
        SELECT 
          nombre, descripcion, precio_mensual, precio_anual,
          max_sucursales, max_usuarios, activo, created_at
        FROM planes_pos
        WHERE NOT EXISTS (
          SELECT 1 FROM planes p WHERE p.nombre = planes_pos.nombre
        )
      `);
      console.log('✅ Datos migrados de planes_pos a planes');
    }
    
    // 4. Eliminar tabla planes_pos duplicada
    console.log('\n🗑️  Eliminando tabla planes_pos duplicada...');
    await client.query('DROP TABLE IF EXISTS planes_pos CASCADE');
    console.log('✅ Tabla planes_pos eliminada');
    
    // 5. Verificar y corregir foreign keys
    console.log('\n🔗 Verificando foreign keys...');
    
    // Verificar si hay foreign keys que apunten a tablas eliminadas
    const fkQuery = `
      SELECT 
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        tc.constraint_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND ccu.table_name IN ('planes_pos', 'usuarios')
      ORDER BY tc.table_name;
    `;
    
    const fkProblematicas = await client.query(fkQuery);
    
    if (fkProblematicas.rows.length > 0) {
      console.log('⚠️  Eliminando foreign keys problemáticas...');
      for (const fk of fkProblematicas.rows) {
        try {
          await client.query(`ALTER TABLE ${fk.table_name} DROP CONSTRAINT IF EXISTS ${fk.constraint_name}`);
          console.log(`✅ FK ${fk.constraint_name} eliminada de ${fk.table_name}`);
        } catch (error) {
          console.log(`❌ Error eliminando FK ${fk.constraint_name}: ${error.message}`);
        }
      }
    }
    
    // 6. Limpiar tablas backup
    console.log('\n🧹 Limpiando tablas backup...');
    
    const tablasBackup = [
      'metodos_pago_backup'
    ];
    
    for (const tabla of tablasBackup) {
      try {
        await client.query(`DROP TABLE IF EXISTS ${tabla}`);
        console.log(`✅ Tabla backup ${tabla} eliminada`);
      } catch (error) {
        console.log(`❌ Error eliminando ${tabla}: ${error.message}`);
      }
    }
    
    // 7. Verificar tabla usuarios vs vendedores
    console.log('\n👥 Analizando tabla usuarios vs vendedores...');
    
    const usuariosCount = await client.query('SELECT COUNT(*) as total FROM usuarios');
    const vendedoresCount = await client.query('SELECT COUNT(*) as total FROM vendedores');
    
    console.log(`   - usuarios: ${usuariosCount.rows[0].total} registros`);
    console.log(`   - vendedores: ${vendedoresCount.rows[0].total} registros`);
    
    if (usuariosCount.rows[0].total > 0) {
      console.log('⚠️  La tabla usuarios tiene datos. Verificar si se necesita migrar a vendedores.');
      console.log('   RECOMENDACIÓN: Revisar manualmente antes de eliminar usuarios.');
    }
    
    // 8. Actualizar sistema de pensionados para usar vendedores
    console.log('\n🔄 Actualizando sistema de pensionados...');
    
    // Verificar si la tabla pensionados tiene foreign key a usuarios
    const pensionadosFK = await client.query(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'pensionados' 
        AND constraint_type = 'FOREIGN KEY'
        AND constraint_name LIKE '%usuarios%'
    `);
    
    if (pensionadosFK.rows.length > 0) {
      console.log('⚠️  Sistema de pensionados tiene FK a usuarios. Actualizar manualmente.');
    } else {
      console.log('✅ Sistema de pensionados no tiene FK problemáticas');
    }
    
    // 9. Estadísticas finales
    console.log('\n📊 ESTADÍSTICAS FINALES:');
    console.log('========================');
    
    const tablasFinales = await client.query(`
      SELECT COUNT(*) as total
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log(`📈 Total de tablas restantes: ${tablasFinales.rows[0].total}`);
    
    // Listar tablas críticas del POS
    const tablasCriticas = await client.query(`
      SELECT table_name
      FROM information_schema.tables 
      WHERE table_schema = 'public'
        AND table_name IN ('vendedores', 'planes', 'restaurantes', 'sucursales', 
                          'mesas', 'ventas', 'productos', 'pensionados', 
                          'consumo_pensionados', 'prefacturas_pensionados')
      ORDER BY table_name
    `);
    
    console.log('\n🎯 Tablas críticas del POS:');
    tablasCriticas.rows.forEach(row => {
      console.log(`   ✅ ${row.table_name}`);
    });
    
    await client.query('COMMIT');
    console.log('\n🎉 LIMPIEZA COMPLETADA EXITOSAMENTE!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error en la limpieza:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

limpiezaDB()
  .then(() => {
    console.log('\n✅ Limpieza completada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error en la limpieza:', error);
    process.exit(1);
  });
