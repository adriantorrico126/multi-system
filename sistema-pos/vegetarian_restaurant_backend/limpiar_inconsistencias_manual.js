const { pool } = require('./src/config/database');

async function limpiarInconsistenciasManual() {
  const client = await pool.connect();
  try {
    console.log('🧹 LIMPIEZA MANUAL DE INCONSISTENCIAS\n');
    
    // 1. ANALIZAR PROBLEMAS CRÍTICOS
    console.log('1️⃣ ANALIZANDO PROBLEMAS CRÍTICOS...');
    
    try {
      // Ventas con mesa NULL o inexistente
      const ventasMesaNull = await client.query(`
        SELECT COUNT(*) as total
        FROM ventas v
        LEFT JOIN mesas m ON v.id_mesa = m.id_mesa
        WHERE m.id_mesa IS NULL
      `);
      
      // Ventas con sucursal NULL
      const ventasSucursalNull = await client.query(`
        SELECT COUNT(*) as total
        FROM ventas
        WHERE id_sucursal IS NULL
      `);
      
      // Ventas con restaurante NULL
      const ventasRestauranteNull = await client.query(`
        SELECT COUNT(*) as total
        FROM ventas
        WHERE id_restaurante IS NULL
      `);
      
      console.log(`  📊 Ventas con mesa inexistente: ${ventasMesaNull.rows[0].total}`);
      console.log(`  📊 Ventas con sucursal NULL: ${ventasSucursalNull.rows[0].total}`);
      console.log(`  📊 Ventas con restaurante NULL: ${ventasRestauranteNull.rows[0].total}`);
      
      if (parseInt(ventasMesaNull.rows[0].total) > 0) {
        console.log('  ⚠️ CRÍTICO: Hay ventas sin mesa válida');
      }
      
    } catch (error) {
      console.log(`  ❌ Error en análisis: ${error.message}`);
    }
    
    // 2. LIMPIAR VENTAS CORRUPTAS
    console.log('\n2️⃣ LIMPIANDO VENTAS CORRUPTAS...');
    
    try {
      // Eliminar ventas sin mesa válida
      const ventasEliminadas = await client.query(`
        DELETE FROM ventas
        WHERE id_mesa NOT IN (SELECT id_mesa FROM mesas)
      `);
      
      console.log(`  🗑️ Ventas eliminadas por mesa inexistente: ${ventasEliminadas.rowCount}`);
      
      // Eliminar ventas sin sucursal o restaurante
      const ventasSinDatos = await client.query(`
        DELETE FROM ventas
        WHERE id_sucursal IS NULL OR id_restaurante IS NULL
      `);
      
      console.log(`  🗑️ Ventas eliminadas por datos faltantes: ${ventasSinDatos.rowCount}`);
      
    } catch (error) {
      console.log(`  ❌ Error limpiando ventas: ${error.message}`);
    }
    
    // 3. CORREGIR INCONSISTENCIAS MESA-VENTA (UNA POR UNA)
    console.log('\n3️⃣ CORRIGIENDO INCONSISTENCIAS MESA-VENTA...');
    
    try {
      const inconsistencias = await client.query(`
        SELECT 
          v.id_venta,
          v.id_mesa,
          v.id_sucursal as venta_sucursal,
          v.id_restaurante as venta_restaurante,
          m.id_sucursal as mesa_sucursal,
          m.id_restaurante as mesa_restaurante
        FROM ventas v
        JOIN mesas m ON v.id_mesa = m.id_mesa
        WHERE v.id_sucursal != m.id_sucursal OR v.id_restaurante != m.id_restaurante
        ORDER BY v.fecha DESC
        LIMIT 10
      `);
      
      console.log(`  📊 Procesando primeras ${inconsistencias.rows.length} inconsistencias...`);
      
      let corregidas = 0;
      for (const inc of inconsistencias.rows) {
        try {
          // Verificar que la mesa existe antes de corregir
          const mesaExiste = await client.query(`
            SELECT 1 FROM mesas WHERE id_mesa = $1
          `, [inc.id_mesa]);
          
          if (mesaExiste.rows.length > 0) {
            await client.query(`
              UPDATE ventas 
              SET 
                id_sucursal = $1,
                id_restaurante = $2
              WHERE id_venta = $3
            `, [inc.mesa_sucursal, inc.mesa_restaurante, inc.id_venta]);
            
            corregidas++;
            console.log(`    ✅ Venta ${inc.id_venta} corregida`);
          } else {
            console.log(`    ⚠️ Mesa ${inc.id_mesa} no existe para venta ${inc.id_venta}`);
          }
        } catch (error) {
          console.log(`    ❌ Error en venta ${inc.id_venta}: ${error.message}`);
        }
      }
      
      console.log(`  🎯 Total corregidas: ${corregidas}`);
      
    } catch (error) {
      console.log(`  ❌ Error en corrección: ${error.message}`);
    }
    
    // 4. LIMPIAR DETALLES HUÉRFANOS
    console.log('\n4️⃣ LIMPIANDO DETALLES HUÉRFANOS...');
    
    try {
      // Eliminar detalles de ventas que ya no existen
      const detallesEliminados = await client.query(`
        DELETE FROM detalle_ventas
        WHERE id_venta NOT IN (SELECT id_venta FROM ventas)
      `);
      
      console.log(`  🗑️ Detalles eliminados: ${detallesEliminados.rowCount}`);
      
      // Eliminar detalles sin producto
      const detallesSinProducto = await client.query(`
        DELETE FROM detalle_ventas
        WHERE id_producto IS NULL
      `);
      
      console.log(`  🗑️ Detalles sin producto eliminados: ${detallesSinProducto.rowCount}`);
      
    } catch (error) {
      console.log(`  ❌ Error limpiando detalles: ${error.message}`);
    }
    
    // 5. CORREGIR VENTAS SIN DETALLES (ENFOQUE CONSERVADOR)
    console.log('\n5️⃣ CORRIGIENDO VENTAS SIN DETALLES...');
    
    try {
      const ventasSinDetalles = await client.query(`
        SELECT 
          v.id_venta,
          v.id_mesa,
          v.total,
          v.estado
        FROM ventas v
        LEFT JOIN detalle_ventas dv ON v.id_venta = dv.id_venta
        WHERE dv.id_detalle IS NULL
        ORDER BY v.fecha DESC
        LIMIT 20
      `);
      
      console.log(`  📊 Procesando primeras ${ventasSinDetalles.rows.length} ventas...`);
      
      let corregidas = 0;
      for (const venta of ventasSinDetalles.rows) {
        try {
          // Solo marcar como cancelada si no tiene total
          if (venta.total === 0 || venta.total === null) {
            await client.query(`
              UPDATE ventas 
              SET estado = 'cancelado'
              WHERE id_venta = $1
            `, [venta.id_venta]);
            
            corregidas++;
            console.log(`    ✅ Venta ${venta.id_venta} marcada como cancelada`);
          } else {
            console.log(`    ⚠️ Venta ${venta.id_venta} tiene total $${venta.total} - requiere revisión manual`);
          }
        } catch (error) {
          console.log(`    ❌ Error en venta ${venta.id_venta}: ${error.message}`);
        }
      }
      
      console.log(`  🎯 Total corregidas: ${corregidas}`);
      
    } catch (error) {
      console.log(`  ❌ Error en corrección: ${error.message}`);
    }
    
    // 6. VERIFICACIÓN FINAL
    console.log('\n6️⃣ VERIFICACIÓN FINAL...');
    
    try {
      const inconsistenciasFinal = await client.query(`
        SELECT COUNT(*) as total
        FROM ventas v
        JOIN mesas m ON v.id_mesa = m.id_mesa
        WHERE v.id_sucursal != m.id_sucursal OR v.id_restaurante != m.id_restaurante
      `);
      
      const ventasSinDetallesFinal = await client.query(`
        SELECT COUNT(*) as total
        FROM ventas v
        LEFT JOIN detalle_ventas dv ON v.id_venta = dv.id_venta
        WHERE dv.id_detalle IS NULL
      `);
      
      const detallesSinProductoFinal = await client.query(`
        SELECT COUNT(*) as total
        FROM detalle_ventas
        WHERE id_producto IS NULL
      `);
      
      console.log(`  📊 Inconsistencias mesa-venta restantes: ${inconsistenciasFinal.rows[0].total}`);
      console.log(`  📊 Ventas sin detalles restantes: ${ventasSinDetallesFinal.rows[0].total}`);
      console.log(`  📊 Detalles sin producto restantes: ${detallesSinProductoFinal.rows[0].total}`);
      
      const totalInconsistencias = parseInt(inconsistenciasFinal.rows[0].total) + 
                                  parseInt(ventasSinDetallesFinal.rows[0].total) + 
                                  parseInt(detallesSinProductoFinal.rows[0].total);
      
      if (totalInconsistencias === 0) {
        console.log('\n✅ TODAS LAS INCONSISTENCIAS HAN SIDO CORREGIDAS');
      } else {
        console.log(`\n⚠️ QUEDAN ${totalInconsistencias} INCONSISTENCIAS`);
        console.log('   🔧 Ejecuta este script nuevamente para continuar');
      }
      
    } catch (error) {
      console.log(`  ❌ Error en verificación: ${error.message}`);
    }
    
    // 7. RESUMEN
    console.log('\n🎯 RESUMEN DE LIMPIEZA:');
    console.log('  ✅ Ventas corruptas eliminadas');
    console.log('  ✅ Inconsistencias mesa-venta corregidas');
    console.log('  ✅ Detalles huérfanos limpiados');
    console.log('  ✅ Ventas sin detalles procesadas');
    
    console.log('\n🔧 PRÓXIMOS PASOS:');
    console.log('  1. Ejecutar verificación de integridad');
    console.log('  2. Si quedan inconsistencias, ejecutar este script nuevamente');
    console.log('  3. Probar generación de prefacturas');
    
  } catch (error) {
    console.error('❌ Error en limpieza manual:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Ejecutar limpieza manual
limpiarInconsistenciasManual()
  .then(() => {
    console.log('\n🏁 Limpieza manual completada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error en limpieza manual:', error);
    process.exit(1);
  });
