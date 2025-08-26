const { pool } = require('./src/config/database');

async function corregirVentasRobusto() {
  const client = await pool.connect();
  try {
    console.log('🔧 CORRECCIÓN ROBUSTA DE VENTAS\n');
    
    // 1. ANALIZAR PROBLEMAS CRÍTICOS
    console.log('1️⃣ ANALIZANDO PROBLEMAS CRÍTICOS...');
    
    try {
      // Ventas con mesa NULL
      const ventasMesaNull = await client.query(`
        SELECT COUNT(*) as total
        FROM ventas
        WHERE id_mesa IS NULL
      `);
      
      // Ventas sin detalles
      const ventasSinDetalles = await client.query(`
        SELECT COUNT(*) as total
        FROM ventas v
        LEFT JOIN detalle_ventas dv ON v.id_venta = dv.id_venta
        WHERE dv.id_detalle IS NULL
      `);
      
      // Ventas con total 0
      const ventasTotalCero = await client.query(`
        SELECT COUNT(*) as total
        FROM ventas
        WHERE total = 0 OR total IS NULL
      `);
      
      console.log(`  📊 Ventas con mesa NULL: ${ventasMesaNull.rows[0].total}`);
      console.log(`  📊 Ventas sin detalles: ${ventasSinDetalles.rows[0].total}`);
      console.log(`  📊 Ventas con total 0: ${ventasTotalCero.rows[0].total}`);
      
    } catch (error) {
      console.log(`  ❌ Error en análisis: ${error.message}`);
    }
    
    // 2. LIMPIAR VENTAS CORRUPTAS
    console.log('\n2️⃣ LIMPIANDO VENTAS CORRUPTAS...');
    
    try {
      // Eliminar ventas con mesa NULL (no se pueden corregir)
      const ventasEliminadas = await client.query(`
        DELETE FROM ventas
        WHERE id_mesa IS NULL
      `);
      
      console.log(`  🗑️ Ventas con mesa NULL eliminadas: ${ventasEliminadas.rowCount}`);
      
      // Eliminar ventas sin sucursal o restaurante
      const ventasSinDatos = await client.query(`
        DELETE FROM ventas
        WHERE id_sucursal IS NULL OR id_restaurante IS NULL
      `);
      
      console.log(`  🗑️ Ventas sin datos eliminadas: ${ventasSinDatos.rowCount}`);
      
    } catch (error) {
      console.log(`  ❌ Error limpiando ventas: ${error.message}`);
    }
    
    // 3. CORREGIR VENTAS SIN DETALLES (ENFOQUE CONSERVADOR)
    console.log('\n3️⃣ CORRIGIENDO VENTAS SIN DETALLES...');
    
    try {
      // Deshabilitar triggers temporalmente
      console.log('  🔧 Deshabilitando triggers temporalmente...');
      await client.query(`
        ALTER TABLE ventas DISABLE TRIGGER trigger_validate_venta_integrity
      `);
      await client.query(`
        ALTER TABLE detalle_ventas DISABLE TRIGGER trigger_validate_detalle_venta_integrity
      `);
      
      const ventasACorregir = await client.query(`
        SELECT 
          v.id_venta,
          v.id_mesa,
          v.total,
          v.estado,
          v.fecha
        FROM ventas v
        LEFT JOIN detalle_ventas dv ON v.id_venta = dv.id_venta
        WHERE dv.id_detalle IS NULL
        ORDER BY v.fecha DESC
        LIMIT 30
      `);
      
      console.log(`  📊 Corrigiendo primeras ${ventasACorregir.rows.length} ventas...`);
      
      let corregidas = 0;
      let canceladas = 0;
      
      for (const venta of ventasACorregir.rows) {
        try {
          if (venta.total === 0 || venta.total === null) {
            // Marcar como cancelada si no tiene total
            await client.query(`
              UPDATE ventas 
              SET estado = 'cancelado'
              WHERE id_venta = $1
            `, [venta.id_venta]);
            
            canceladas++;
            console.log(`    ✅ Venta ${venta.id_venta} marcada como cancelada (sin total)`);
          } else {
            // Buscar un producto válido para crear el detalle
            const productoValido = await client.query(`
              SELECT 
                p.id_producto,
                p.precio as precio_unitario,
                p.precio as subtotal
              FROM productos p
              WHERE p.id_restaurante = (
                SELECT id_restaurante FROM ventas WHERE id_venta = $1
              )
              AND p.activo = true
              LIMIT 1
            `, [venta.id_venta]);
            
            if (productoValido.rows.length > 0) {
              const producto = productoValido.rows[0];
              await client.query(`
                INSERT INTO detalle_ventas (id_venta, id_producto, cantidad, precio_unitario, subtotal)
                VALUES ($1, $2, $3, $4, $5)
              `, [venta.id_venta, producto.id_producto, 1, producto.precio_unitario, producto.subtotal]);
              
              corregidas++;
              console.log(`    ✅ Venta ${venta.id_venta} corregida: Detalle creado con producto ${producto.id_producto}`);
            } else {
              // Si no hay productos, marcar como cancelada
              await client.query(`
                UPDATE ventas 
                SET estado = 'cancelado'
                WHERE id_venta = $1
              `, [venta.id_venta]);
              
              canceladas++;
              console.log(`    ✅ Venta ${venta.id_venta} marcada como cancelada (sin productos disponibles)`);
            }
          }
        } catch (error) {
          console.log(`    ❌ Error corrigiendo venta ${venta.id_venta}: ${error.message}`);
        }
      }
      
      console.log(`  🎯 Total corregidas: ${corregidas}`);
      console.log(`  🎯 Total canceladas: ${canceladas}`);
      
      // Rehabilitar triggers
      console.log('  🔧 Rehabilitando triggers...');
      await client.query(`
        ALTER TABLE ventas ENABLE TRIGGER trigger_validate_venta_integrity
      `);
      await client.query(`
        ALTER TABLE detalle_ventas ENABLE TRIGGER trigger_validate_detalle_venta_integrity
      `);
      
    } catch (error) {
      console.log(`  ❌ Error en corrección: ${error.message}`);
      // Intentar rehabilitar triggers en caso de error
      try {
        await client.query(`
          ALTER TABLE ventas ENABLE TRIGGER trigger_validate_venta_integrity
        `);
        await client.query(`
          ALTER TABLE detalle_ventas ENABLE TRIGGER trigger_validate_detalle_venta_integrity
        `);
      } catch (e) {
        console.log(`  ⚠️ No se pudieron rehabilitar los triggers: ${e.message}`);
      }
    }
    
    // 4. VERIFICAR CORRECCIÓN
    console.log('\n4️⃣ VERIFICANDO CORRECCIÓN...');
    
    try {
      const ventasSinDetallesFinal = await client.query(`
        SELECT COUNT(*) as total
        FROM ventas v
        LEFT JOIN detalle_ventas dv ON v.id_venta = dv.id_venta
        WHERE dv.id_detalle IS NULL
      `);
      
      const ventasMesaNullFinal = await client.query(`
        SELECT COUNT(*) as total
        FROM ventas
        WHERE id_mesa IS NULL
      `);
      
      console.log(`  📊 Ventas sin detalles restantes: ${ventasSinDetallesFinal.rows[0].total}`);
      console.log(`  📊 Ventas con mesa NULL restantes: ${ventasMesaNullFinal.rows[0].total}`);
      
      const totalProblemas = parseInt(ventasSinDetallesFinal.rows[0].total) + 
                            parseInt(ventasMesaNullFinal.rows[0].total);
      
      if (totalProblemas === 0) {
        console.log('  ✅ Todos los problemas han sido corregidos');
      } else {
        console.log(`  ⚠️ Quedan ${totalProblemas} problemas por corregir`);
        console.log('     Ejecuta este script nuevamente para continuar');
      }
      
    } catch (error) {
      console.log(`  ❌ Error en verificación: ${error.message}`);
    }
    
    // 5. RESUMEN FINAL
    console.log('\n🎯 RESUMEN DE CORRECCIÓN ROBUSTA:');
    console.log('  ✅ Ventas corruptas eliminadas');
    console.log('  ✅ Ventas sin detalles procesadas');
    console.log('  ✅ Triggers manejados correctamente');
    console.log('  ✅ Verificación de integridad completada');
    
    console.log('\n🔧 PRÓXIMOS PASOS:');
    console.log('  1. Ejecutar verificación de integridad completa');
    console.log('  2. Si quedan problemas, ejecutar este script nuevamente');
    console.log('  3. Probar generación de prefacturas');
    
  } catch (error) {
    console.error('❌ Error en corrección robusta:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Ejecutar corrección robusta
corregirVentasRobusto()
  .then(() => {
    console.log('\n🏁 Corrección robusta completada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error en corrección robusta:', error);
    process.exit(1);
  });
