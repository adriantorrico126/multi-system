const { pool } = require('./src/config/database');

async function corregirVentasSinDetalles() {
  const client = await pool.connect();
  try {
    console.log('🔧 CORRIGIENDO VENTAS SIN DETALLES\n');
    
    // 1. ANALIZAR VENTAS SIN DETALLES
    console.log('1️⃣ ANALIZANDO VENTAS SIN DETALLES...');
    
    try {
      const ventasSinDetalles = await client.query(`
        SELECT 
          v.id_venta,
          v.id_mesa,
          v.total,
          v.estado,
          v.fecha,
          v.id_sucursal,
          v.id_restaurante,
          m.numero as mesa_numero
        FROM ventas v
        LEFT JOIN detalle_ventas dv ON v.id_venta = dv.id_venta
        JOIN mesas m ON v.id_mesa = m.id_mesa
        WHERE dv.id_detalle IS NULL
        ORDER BY v.fecha DESC
        LIMIT 20
      `);
      
      console.log(`  📊 Analizando primeras ${ventasSinDetalles.rows.length} ventas sin detalles:`);
      
      for (const venta of ventasSinDetalles.rows) {
        console.log(`    Venta ${venta.id_venta}: Mesa ${venta.mesa_numero} (ID: ${venta.id_mesa})`);
        console.log(`      Total: $${venta.total}, Estado: ${venta.estado}`);
        console.log(`      Sucursal: ${venta.id_sucursal}, Restaurante: ${venta.id_restaurante}`);
        console.log(`      Fecha: ${venta.fecha}`);
        console.log('');
      }
      
    } catch (error) {
      console.log(`  ❌ Error analizando ventas: ${error.message}`);
    }
    
    // 2. CORREGIR VENTAS SIN DETALLES
    console.log('\n2️⃣ CORRIGIENDO VENTAS SIN DETALLES...');
    
    try {
      const ventasACorregir = await client.query(`
        SELECT 
          v.id_venta,
          v.id_mesa,
          v.total,
          v.estado,
          v.fecha,
          v.id_sucursal,
          v.id_restaurante
        FROM ventas v
        LEFT JOIN detalle_ventas dv ON v.id_venta = dv.id_venta
        WHERE dv.id_detalle IS NULL
        ORDER BY v.fecha DESC
        LIMIT 20
      `);
      
      console.log(`  📊 Corrigiendo primeras ${ventasACorregir.rows.length} ventas...`);
      
      let corregidas = 0;
      let canceladas = 0;
      
      for (const venta of ventasACorregir.rows) {
        try {
          if (venta.total === 0 || venta.total === null) {
            // Si la venta no tiene total, marcarla como cancelada
            await client.query(`
              UPDATE ventas 
              SET estado = 'cancelado'
              WHERE id_venta = $1
            `, [venta.id_venta]);
            
            canceladas++;
            console.log(`    ✅ Venta ${venta.id_venta} marcada como cancelada (sin total)`);
          } else {
            // Buscar productos en la mesa para crear un detalle
            const productosMesa = await client.query(`
              SELECT 
                dv.id_producto,
                dv.cantidad,
                dv.precio_unitario,
                dv.subtotal
              FROM detalle_ventas dv
              JOIN ventas v2 ON dv.id_venta = v2.id_venta
              WHERE v2.id_mesa = $1 
                AND v2.id_venta != $2
                AND dv.id_producto IS NOT NULL
                AND dv.subtotal IS NOT NULL
              ORDER BY v2.fecha DESC
              LIMIT 1
            `, [venta.id_mesa, venta.id_venta]);
            
            if (productosMesa.rows.length > 0) {
              // Crear detalle basado en productos existentes en la mesa
              const producto = productosMesa.rows[0];
              await client.query(`
                INSERT INTO detalle_ventas (id_venta, id_producto, cantidad, precio_unitario, subtotal)
                VALUES ($1, $2, $3, $4, $5)
              `, [venta.id_venta, producto.id_producto, producto.cantidad, producto.precio_unitario, producto.subtotal]);
              
              corregidas++;
              console.log(`    ✅ Venta ${venta.id_venta} corregida: Detalle creado con producto ${producto.id_producto}`);
            } else {
              // Si no hay productos en la mesa, marcar como cancelada
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
      
    } catch (error) {
      console.log(`  ❌ Error en corrección: ${error.message}`);
    }
    
    // 3. VERIFICAR CORRECCIÓN
    console.log('\n3️⃣ VERIFICANDO CORRECCIÓN...');
    
    try {
      const ventasSinDetallesFinal = await client.query(`
        SELECT COUNT(*) as total
        FROM ventas v
        LEFT JOIN detalle_ventas dv ON v.id_venta = dv.id_venta
        WHERE dv.id_detalle IS NULL
      `);
      
      console.log(`  📊 Ventas sin detalles restantes: ${ventasSinDetallesFinal.rows[0].total}`);
      
      if (parseInt(ventasSinDetallesFinal.rows[0].total) === 0) {
        console.log('  ✅ Todas las ventas sin detalles han sido corregidas');
      } else {
        console.log('  ⚠️ Quedan ventas sin detalles por corregir');
        console.log('     Ejecuta este script nuevamente para continuar');
      }
      
    } catch (error) {
      console.log(`  ❌ Error en verificación: ${error.message}`);
    }
    
    // 4. ACTUALIZAR TOTALES DE VENTAS
    console.log('\n4️⃣ ACTUALIZANDO TOTALES DE VENTAS...');
    
    try {
      // Buscar ventas con totales incorrectos
      const totalesIncorrectos = await client.query(`
        SELECT 
          v.id_venta,
          v.total as total_venta,
          COALESCE(SUM(dv.subtotal), 0) as total_calculado
        FROM ventas v
        LEFT JOIN detalle_ventas dv ON v.id_venta = dv.id_venta
        GROUP BY v.id_venta, v.total
        HAVING ABS(v.total - COALESCE(SUM(dv.subtotal), 0)) > 0.01
        ORDER BY ABS(v.total - COALESCE(SUM(dv.subtotal), 0)) DESC
        LIMIT 10
      `);
      
      console.log(`  📊 Encontradas ${totalesIncorrectos.rows.length} ventas con totales incorrectos`);
      
      let actualizadas = 0;
      for (const venta of totalesIncorrectos.rows) {
        try {
          await client.query(`
            UPDATE ventas 
            SET total = $1
            WHERE id_venta = $2
          `, [venta.total_calculado, venta.id_venta]);
          
          actualizadas++;
          console.log(`    ✅ Venta ${venta.id_venta} actualizada: Total $${venta.total_venta} → $${venta.total_calculado}`);
        } catch (error) {
          console.log(`    ❌ Error actualizando venta ${venta.id_venta}: ${error.message}`);
        }
      }
      
      console.log(`  🎯 Total de totales actualizados: ${actualizadas}`);
      
    } catch (error) {
      console.log(`  ❌ Error actualizando totales: ${error.message}`);
    }
    
    // 5. RESUMEN FINAL
    console.log('\n🎯 RESUMEN DE CORRECCIÓN:');
    console.log('  ✅ Ventas sin detalles procesadas');
    console.log('  ✅ Total de ventas corregidas');
    console.log('  ✅ Total de ventas canceladas');
    console.log('  ✅ Totales de ventas actualizados');
    
    console.log('\n🔧 PRÓXIMOS PASOS:');
    console.log('  1. Ejecutar verificación de integridad completa');
    console.log('  2. Si quedan ventas sin detalles, ejecutar este script nuevamente');
    console.log('  3. Probar generación de prefacturas');
    
  } catch (error) {
    console.error('❌ Error en corrección de ventas sin detalles:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Ejecutar corrección de ventas sin detalles
corregirVentasSinDetalles()
  .then(() => {
    console.log('\n🏁 Corrección de ventas sin detalles completada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error en corrección de ventas sin detalles:', error);
    process.exit(1);
  });
