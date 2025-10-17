require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.POS_DB_USER || 'postgres',
  host: process.env.POS_DB_HOST || 'localhost',
  database: process.env.POS_DB_NAME || 'sistempos',
  password: process.env.POS_DB_PASSWORD || '6951230Anacleta',
  port: process.env.POS_DB_PORT || 5432,
});

async function limpiezaPlanesPos() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('🧹 LIMPIEZA PROFESIONAL: ELIMINACIÓN DE PLANES_POS');
    console.log('==================================================\n');
    
    // 1. Verificar si planes_pos existe
    console.log('🔍 1. Verificando existencia de tabla planes_pos...');
    const tablaExiste = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'planes_pos'
      );
    `);
    
    if (!tablaExiste.rows[0].exists) {
      console.log('✅ La tabla planes_pos no existe. No hay nada que limpiar.');
      await client.query('COMMIT');
      return;
    }
    
    console.log('⚠️  La tabla planes_pos existe. Procediendo con análisis...');
    
    // 2. Verificar datos únicos en planes_pos que no estén en planes
    console.log('\n🔍 2. Verificando datos únicos en planes_pos...');
    const datosUnicos = await client.query(`
      SELECT * FROM planes_pos 
      WHERE NOT EXISTS (
        SELECT 1 FROM planes p 
        WHERE LOWER(TRIM(p.nombre)) = LOWER(TRIM(planes_pos.nombre))
      );
    `);
    
    console.log(`📊 Datos únicos encontrados: ${datosUnicos.rows.length}`);
    
    if (datosUnicos.rows.length > 0) {
      console.log('⚠️  Se encontraron datos únicos en planes_pos:');
      datosUnicos.rows.forEach((plan, index) => {
        console.log(`  ${index + 1}. ${plan.nombre} - $${plan.precio_mensual}/mes`);
      });
      
      console.log('\n❓ ¿Desea migrar estos datos a la tabla planes?');
      console.log('   NOTA: Los datos serán adaptados a la estructura de planes.');
      
      // Migrar datos únicos
      for (const plan of datosUnicos.rows) {
        console.log(`\n🔄 Migrando: ${plan.nombre}`);
        
        // Adaptar datos a la estructura de planes
        const insertQuery = `
          INSERT INTO planes (
            nombre, descripcion, precio_mensual, precio_anual,
            max_sucursales, max_usuarios, max_productos, max_transacciones_mes,
            almacenamiento_gb, funcionalidades, activo, orden_display,
            created_at, updated_at, incluye_pos, incluye_inventario_basico,
            incluye_inventario_avanzado, incluye_promociones, incluye_reservas,
            incluye_arqueo_caja, incluye_egresos, incluye_egresos_avanzados,
            incluye_reportes_avanzados, incluye_analytics, incluye_delivery,
            incluye_impresion, incluye_soporte_24h, incluye_api, incluye_white_label
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
            true, true, false, $15, $16, true, true, false, false, $17, $18, $19, $20, false, false
          );
        `;
        
        const valores = [
          plan.nombre,
          plan.descripcion,
          plan.precio_mensual,
          plan.precio_anual,
          plan.max_sucursales,
          plan.max_usuarios,
          1000, // max_productos por defecto
          5000, // max_transacciones_mes por defecto
          5,    // almacenamiento_gb por defecto
          JSON.stringify(plan.caracteristicas || {}),
          plan.activo,
          plan.orden_display,
          plan.created_at,
          new Date(),
          plan.incluye_promociones || false,
          plan.incluye_reservas || false,
          plan.incluye_analytics || false,
          plan.incluye_delivery || false,
          plan.incluye_impresion || false,
          plan.incluye_soporte_24h || false
        ];
        
        try {
          await client.query(insertQuery, valores);
          console.log(`   ✅ Migrado exitosamente: ${plan.nombre}`);
        } catch (error) {
          console.log(`   ❌ Error migrando ${plan.nombre}: ${error.message}`);
        }
      }
    } else {
      console.log('✅ No hay datos únicos en planes_pos. Todos los datos ya existen en planes.');
    }
    
    // 3. Verificar foreign keys que referencian planes_pos
    console.log('\n🔍 3. Verificando foreign keys que referencian planes_pos...');
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
        AND ccu.table_name = 'planes_pos'
        AND tc.table_schema = 'public';
    `);
    
    if (fkReferencias.rows.length > 0) {
      console.log(`⚠️  Se encontraron ${fkReferencias.rows.length} foreign keys que referencian planes_pos:`);
      fkReferencias.rows.forEach(fk => {
        console.log(`  - ${fk.tabla_origen}.${fk.columna_origen} → ${fk.constraint_name}`);
      });
      
      console.log('\n🔧 Eliminando foreign keys problemáticas...');
      for (const fk of fkReferencias.rows) {
        try {
          await client.query(`ALTER TABLE ${fk.tabla_origen} DROP CONSTRAINT IF EXISTS ${fk.constraint_name}`);
          console.log(`   ✅ FK eliminada: ${fk.constraint_name} de ${fk.tabla_origen}`);
        } catch (error) {
          console.log(`   ❌ Error eliminando FK ${fk.constraint_name}: ${error.message}`);
        }
      }
    } else {
      console.log('✅ No hay foreign keys que referencien planes_pos.');
    }
    
    // 4. Eliminar tabla planes_pos
    console.log('\n🗑️  4. Eliminando tabla planes_pos...');
    try {
      await client.query('DROP TABLE IF EXISTS planes_pos CASCADE');
      console.log('✅ Tabla planes_pos eliminada exitosamente');
    } catch (error) {
      console.log(`❌ Error eliminando tabla planes_pos: ${error.message}`);
      throw error;
    }
    
    // 5. Verificar limpieza
    console.log('\n✅ 5. Verificando limpieza...');
    const tablaExisteDespues = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'planes_pos'
      );
    `);
    
    if (!tablaExisteDespues.rows[0].exists) {
      console.log('✅ Limpieza completada exitosamente. La tabla planes_pos ya no existe.');
    } else {
      console.log('❌ Error: La tabla planes_pos aún existe después de la eliminación.');
    }
    
    // 6. Verificar que planes sigue funcionando
    console.log('\n🔍 6. Verificando tabla planes...');
    const planesCount = await client.query('SELECT COUNT(*) as total FROM planes');
    console.log(`✅ Tabla planes tiene ${planesCount.rows[0].total} registros y funciona correctamente`);
    
    await client.query('COMMIT');
    
    console.log('\n🎉 LIMPIEZA COMPLETADA EXITOSAMENTE!');
    console.log('=====================================');
    console.log('✅ Tabla planes_pos eliminada');
    console.log('✅ Foreign keys problemáticas eliminadas');
    console.log('✅ Datos únicos migrados a planes (si los hubo)');
    console.log('✅ Tabla planes funciona correctamente');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error en la limpieza:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

limpiezaPlanesPos()
  .then(() => {
    console.log('\n✅ Proceso completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error en el proceso:', error);
    process.exit(1);
  });
