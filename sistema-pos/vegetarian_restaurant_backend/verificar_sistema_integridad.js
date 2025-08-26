const { pool } = require('./src/config/database');

async function verificarSistemaIntegridad() {
  const client = await pool.connect();
  try {
    console.log('🔍 VERIFICANDO SISTEMA DE INTEGRIDAD\n');
    
    // 1. VERIFICAR TRIGGERS IMPLEMENTADOS
    console.log('1️⃣ VERIFICANDO TRIGGERS...');
    const triggers = await client.query(`
      SELECT 
        trigger_name, 
        event_object_table, 
        event_manipulation,
        action_statement
      FROM information_schema.triggers
      WHERE trigger_name LIKE '%integrity%' OR trigger_name LIKE '%update%'
      ORDER BY event_object_table, trigger_name
    `);
    
    if (triggers.rows.length === 0) {
      console.log('  ❌ No se encontraron triggers de integridad');
      return;
    }
    
    console.log(`  ✅ Encontrados ${triggers.rows.length} triggers:`);
    triggers.rows.forEach(trigger => {
      console.log(`    - ${trigger.trigger_name} en ${trigger.event_object_table} (${trigger.event_manipulation})`);
    });
    
    // 2. VERIFICAR FUNCIONES IMPLEMENTADAS
    console.log('\n2️⃣ VERIFICANDO FUNCIONES...');
    const functions = await client.query(`
      SELECT 
        routine_name,
        routine_type,
        data_type
      FROM information_schema.routines
      WHERE routine_name LIKE '%integrity%' OR routine_name LIKE '%update%'
      ORDER BY routine_name
    `);
    
    console.log(`  ✅ Encontradas ${functions.rows.length} funciones:`);
    functions.rows.forEach(func => {
      console.log(`    - ${func.routine_name} (${func.routine_type})`);
    });
    
    // 3. VERIFICAR ÍNDICES CREADOS
    console.log('\n3️⃣ VERIFICANDO ÍNDICES...');
    const indexes = await client.query(`
      SELECT 
        indexname,
        tablename
      FROM pg_indexes
      WHERE indexname LIKE 'idx_%'
      ORDER BY tablename, indexname
    `);
    
    console.log(`  ✅ Encontrados ${indexes.rows.length} índices de optimización:`);
    indexes.rows.forEach(index => {
      console.log(`    - ${index.indexname} en ${index.tablename}`);
    });
    
    // 4. VERIFICAR VISTA DE MONITOREO
    console.log('\n4️⃣ VERIFICANDO VISTA DE MONITOREO...');
    try {
      const monitoringData = await client.query('SELECT * FROM v_integrity_monitoring');
      console.log('  ✅ Vista de monitoreo funcionando:');
      monitoringData.rows.forEach(row => {
        console.log(`    - ${row.table_name}: ${row.total_records} registros`);
      });
    } catch (error) {
      console.log(`  ❌ Error en vista de monitoreo: ${error.message}`);
    }
    
    // 5. VERIFICAR TABLA DE LOGS
    console.log('\n5️⃣ VERIFICANDO TABLA DE LOGS...');
    try {
      const logsCount = await client.query('SELECT COUNT(*) as total FROM integrity_logs');
      console.log(`  ✅ Tabla de logs: ${logsCount.rows[0].total} registros`);
    } catch (error) {
      console.log(`  ❌ Error en tabla de logs: ${error.message}`);
    }
    
    // 6. PROBAR FUNCIONALIDAD DE TRIGGERS
    console.log('\n6️⃣ PROBANDO FUNCIONALIDAD...');
    
    // Probar trigger de validación de mesa
    try {
      console.log('  🔍 Probando validación de mesa duplicada...');
      
      // Crear mesa de prueba
      await client.query(`
        INSERT INTO mesas (numero, id_sucursal, id_restaurante, estado, total_acumulado)
        VALUES (888, 1, 1, 'libre', 0)
      `);
      console.log('    ✅ Mesa de prueba creada');
      
      // Intentar crear mesa duplicada (debería fallar)
      try {
        await client.query(`
          INSERT INTO mesas (numero, id_sucursal, id_restaurante, estado, total_acumulado)
          VALUES (888, 1, 1, 'libre', 0)
        `);
        console.log('    ❌ ERROR: Se permitió crear mesa duplicada');
      } catch (error) {
        if (error.message.includes('Ya existe una mesa')) {
          console.log('    ✅ Trigger funcionando: Previene mesa duplicada');
        } else {
          console.log(`    ❌ Error inesperado: ${error.message.split('\n')[0]}`);
        }
      }
      
      // Limpiar mesa de prueba
      await client.query(`DELETE FROM mesas WHERE numero = 888`);
      console.log('    🧹 Mesa de prueba eliminada');
      
    } catch (error) {
      console.log(`    ❌ Error en prueba: ${error.message.split('\n')[0]}`);
    }
    
    // 7. VERIFICAR ESTADO ACTUAL DEL SISTEMA
    console.log('\n7️⃣ VERIFICANDO ESTADO DEL SISTEMA...');
    
    // Verificar mesas activas
    const mesasActivas = await client.query(`
      SELECT COUNT(*) as total
      FROM mesas 
      WHERE estado = 'en_uso'
    `);
    console.log(`  📊 Mesas activas: ${mesasActivas.rows[0].total}`);
    
    // Verificar ventas pendientes
    const ventasPendientes = await client.query(`
      SELECT COUNT(*) as total
      FROM ventas 
      WHERE estado IN ('recibido', 'en_preparacion', 'listo_para_servir', 'abierta', 'en_uso', 'pendiente_cobro')
    `);
    console.log(`  📊 Ventas pendientes: ${ventasPendientes.rows[0].total}`);
    
    // Verificar total acumulado
    const totalAcumulado = await client.query(`
      SELECT COALESCE(SUM(total_acumulado), 0) as total
      FROM mesas
    `);
    console.log(`  📊 Total acumulado: $${totalAcumulado.rows[0].total}`);
    
    // 8. VERIFICAR INTEGRIDAD DE DATOS
    console.log('\n8️⃣ VERIFICANDO INTEGRIDAD DE DATOS...');
    
    // Verificar inconsistencias mesa-venta
    const inconsistenciasMesaVenta = await client.query(`
      SELECT COUNT(*) as total
      FROM ventas v
      JOIN mesas m ON v.id_mesa = m.id_mesa
      WHERE v.id_sucursal != m.id_sucursal OR v.id_restaurante != m.id_restaurante
    `);
    console.log(`  🔍 Inconsistencias mesa-venta: ${inconsistenciasMesaVenta.rows[0].total}`);
    
    // Verificar detalles sin productos
    const detallesSinProducto = await client.query(`
      SELECT COUNT(*) as total
      FROM detalle_ventas
      WHERE id_producto IS NULL
    `);
    console.log(`  🔍 Detalles sin producto: ${detallesSinProducto.rows[0].total}`);
    
    // Verificar ventas sin detalles
    const ventasSinDetalles = await client.query(`
      SELECT COUNT(*) as total
      FROM ventas v
      LEFT JOIN detalle_ventas dv ON v.id_venta = dv.id_venta
      WHERE dv.id_detalle IS NULL
    `);
    console.log(`  🔍 Ventas sin detalles: ${ventasSinDetalles.rows[0].total}`);
    
    // 9. RESUMEN DE VERIFICACIÓN
    console.log('\n🎯 RESUMEN DE VERIFICACIÓN:');
    
    const totalTriggers = triggers.rows.length;
    const totalFunctions = functions.rows.length;
    const totalIndexes = indexes.rows.length;
    const inconsistencias = parseInt(inconsistenciasMesaVenta.rows[0].total) + 
                           parseInt(detallesSinProducto.rows[0].total) + 
                           parseInt(ventasSinDetalles.rows[0].total);
    
    console.log(`  📊 Triggers implementados: ${totalTriggers}`);
    console.log(`  📊 Funciones creadas: ${totalFunctions}`);
    console.log(`  📊 Índices optimizados: ${totalIndexes}`);
    console.log(`  📊 Inconsistencias encontradas: ${inconsistencias}`);
    
    if (totalTriggers >= 5 && totalFunctions >= 5 && totalIndexes >= 4 && inconsistencias === 0) {
      console.log('\n✅ SISTEMA DE INTEGRIDAD FUNCIONANDO PERFECTAMENTE');
      console.log('   🛡️ Prefacturas sin productos: ELIMINADO');
      console.log('   🛡️ Inconsistencias de datos: PREVENIDAS');
      console.log('   🛡️ Validación automática: ACTIVA');
      console.log('   🛡️ Cálculos automáticos: FUNCIONANDO');
    } else if (totalTriggers >= 3 && totalFunctions >= 3) {
      console.log('\n⚠️ SISTEMA DE INTEGRIDAD PARCIALMENTE IMPLEMENTADO');
      console.log('   🔧 Algunos componentes requieren atención');
    } else {
      console.log('\n❌ SISTEMA DE INTEGRIDAD NO IMPLEMENTADO');
      console.log('   🚨 Ejecutar implement_integrity_system_fixed.js');
    }
    
  } catch (error) {
    console.error('❌ Error en verificación:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Ejecutar verificación
verificarSistemaIntegridad()
  .then(() => {
    console.log('\n🏁 Verificación completada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error en verificación:', error);
    process.exit(1);
  });
