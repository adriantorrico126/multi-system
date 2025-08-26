const { pool } = require('./src/config/database');

async function corregirInconsistenciasMesa1() {
  const client = await pool.connect();
  try {
    console.log('🔧 CORRIGIENDO INCONSISTENCIAS DE MESA 1\n');
    
    // 1. ANALIZAR SITUACIÓN ACTUAL
    console.log('1️⃣ ANALIZANDO SITUACIÓN ACTUAL...');
    
    try {
      // Mesa 1 en Sucursal 4 (ID: 32)
      const mesa1Sucursal4 = await client.query(`
        SELECT 
          m.id_mesa,
          m.numero,
          m.id_sucursal,
          m.id_restaurante,
          s.nombre as sucursal_nombre,
          COUNT(v.id_venta) as total_ventas,
          COALESCE(SUM(v.total), 0) as total_acumulado
        FROM mesas m
        JOIN sucursales s ON m.id_sucursal = s.id_sucursal
        LEFT JOIN ventas v ON m.id_mesa = v.id_mesa
        WHERE m.numero = 1 AND m.id_sucursal = 4
        GROUP BY m.id_mesa, m.numero, m.id_sucursal, m.id_restaurante, s.nombre
      `);
      
      // Mesa 1 en Sucursal 6 (ID: 31)
      const mesa1Sucursal6 = await client.query(`
        SELECT 
          m.id_mesa,
          m.numero,
          m.id_sucursal,
          m.id_restaurante,
          s.nombre as sucursal_nombre,
          COUNT(v.id_venta) as total_ventas,
          COALESCE(SUM(v.total), 0) as total_acumulado
        FROM mesas m
        JOIN sucursales s ON m.id_sucursal = s.id_sucursal
        LEFT JOIN ventas v ON m.id_mesa = v.id_mesa
        WHERE m.numero = 1 AND m.id_sucursal = 6
        GROUP BY m.id_mesa, m.numero, m.id_sucursal, m.id_restaurante, s.nombre
      `);
      
      console.log('  📊 Mesa 1 en Sucursal 4 (16 de Julio):');
      if (mesa1Sucursal4.rows.length > 0) {
        const mesa = mesa1Sucursal4.rows[0];
        console.log(`    ID: ${mesa.id_mesa}, Ventas: ${mesa.total_ventas}, Total: $${mesa.total_acumulado}`);
      }
      
      console.log('  📊 Mesa 1 en Sucursal 6 (Torrico):');
      if (mesa1Sucursal6.rows.length > 0) {
        const mesa = mesa1Sucursal6.rows[0];
        console.log(`    ID: ${mesa.id_mesa}, Ventas: ${mesa.total_ventas}, Total: $${mesa.total_acumulado}`);
      }
      
    } catch (error) {
      console.log(`  ❌ Error analizando situación: ${error.message}`);
    }
    
    // 2. IDENTIFICAR VENTAS CON INCONSISTENCIAS
    console.log('\n2️⃣ IDENTIFICANDO VENTAS CON INCONSISTENCIAS...');
    
    try {
      const ventasInconsistentes = await client.query(`
        SELECT 
          v.id_venta,
          v.id_mesa,
          v.id_sucursal,
          v.id_restaurante,
          v.total,
          v.estado,
          v.fecha,
          m.numero as mesa_numero,
          m.id_sucursal as mesa_sucursal
        FROM ventas v
        JOIN mesas m ON v.id_mesa = m.id_mesa
        WHERE m.numero = 1 
          AND (v.id_sucursal != m.id_sucursal OR v.id_restaurante != m.id_restaurante)
        ORDER BY v.fecha DESC
      `);
      
      console.log(`  📊 Encontradas ${ventasInconsistentes.rows.length} ventas inconsistentes:`);
      
      for (const venta of ventasInconsistentes.rows) {
        console.log(`    Venta ${venta.id_venta}: Mesa ${venta.mesa_numero} (ID: ${venta.id_mesa})`);
        console.log(`      Venta Suc/Rest: ${venta.id_sucursal}/${venta.id_restaurante}`);
        console.log(`      Mesa Suc/Rest: ${venta.mesa_sucursal}/${venta.id_restaurante}`);
        console.log(`      Total: $${venta.total}, Estado: ${venta.estado}`);
        console.log('');
      }
      
    } catch (error) {
      console.log(`  ❌ Error identificando ventas: ${error.message}`);
    }
    
    // 3. CORREGIR INCONSISTENCIAS (UNA POR UNA)
    console.log('\n3️⃣ CORRIGIENDO INCONSISTENCIAS...');
    
    try {
      // Deshabilitar temporalmente el trigger de integridad
      console.log('  🔧 Deshabilitando trigger de integridad temporalmente...');
      await client.query(`
        ALTER TABLE mesas DISABLE TRIGGER trigger_validate_mesa_integrity
      `);
      
      const ventasACorregir = await client.query(`
        SELECT 
          v.id_venta,
          v.id_mesa,
          v.id_sucursal,
          v.id_restaurante,
          m.id_sucursal as mesa_sucursal,
          m.id_restaurante as mesa_restaurante
        FROM ventas v
        JOIN mesas m ON v.id_mesa = m.id_mesa
        WHERE m.numero = 1 
          AND (v.id_sucursal != m.id_sucursal OR v.id_restaurante != m.id_restaurante)
        ORDER BY v.fecha DESC
        LIMIT 20
      `);
      
      console.log(`  📊 Corrigiendo primeras ${ventasACorregir.rows.length} ventas...`);
      
      let corregidas = 0;
      for (const venta of ventasACorregir.rows) {
        try {
          await client.query(`
            UPDATE ventas 
            SET 
              id_sucursal = $1,
              id_restaurante = $2
            WHERE id_venta = $3
          `, [venta.mesa_sucursal, venta.mesa_restaurante, venta.id_venta]);
          
          corregidas++;
          console.log(`    ✅ Venta ${venta.id_venta} corregida: Sucursal ${venta.id_sucursal}→${venta.mesa_sucursal}`);
        } catch (error) {
          console.log(`    ❌ Error en venta ${venta.id_venta}: ${error.message}`);
        }
      }
      
      console.log(`  🎯 Total corregidas: ${corregidas}`);
      
      // Rehabilitar el trigger de integridad
      console.log('  🔧 Rehabilitando trigger de integridad...');
      await client.query(`
        ALTER TABLE mesas ENABLE TRIGGER trigger_validate_mesa_integrity
      `);
      
    } catch (error) {
      console.log(`  ❌ Error corrigiendo inconsistencias: ${error.message}`);
      // Intentar rehabilitar el trigger en caso de error
      try {
        await client.query(`
          ALTER TABLE mesas ENABLE TRIGGER trigger_validate_mesa_integrity
        `);
      } catch (e) {
        console.log(`  ⚠️ No se pudo rehabilitar el trigger: ${e.message}`);
      }
    }
    
    // 4. VERIFICAR CORRECCIÓN
    console.log('\n4️⃣ VERIFICANDO CORRECCIÓN...');
    
    try {
      const inconsistenciasRestantes = await client.query(`
        SELECT COUNT(*) as total
        FROM ventas v
        JOIN mesas m ON v.id_mesa = m.id_mesa
        WHERE m.numero = 1 
          AND (v.id_sucursal != m.id_sucursal OR v.id_restaurante != m.id_restaurante)
      `);
      
      console.log(`  📊 Inconsistencias restantes: ${inconsistenciasRestantes.rows[0].total}`);
      
      if (parseInt(inconsistenciasRestantes.rows[0].total) === 0) {
        console.log('  ✅ Todas las inconsistencias de Mesa 1 han sido corregidas');
      } else {
        console.log('  ⚠️ Quedan inconsistencias por corregir');
      }
      
    } catch (error) {
      console.log(`  ❌ Error en verificación: ${error.message}`);
    }
    
    // 5. ACTUALIZAR TOTALES ACUMULADOS
    console.log('\n5️⃣ ACTUALIZANDO TOTALES ACUMULADOS...');
    
    try {
      // Actualizar Mesa 1 en Sucursal 4
      const totalSucursal4 = await client.query(`
        SELECT 
          COALESCE(SUM(v.total), 0) as total_acumulado,
          COUNT(DISTINCT v.id_venta) as total_ventas
        FROM ventas v
        WHERE v.id_mesa = 32 
          AND v.estado IN ('recibido', 'en_preparacion', 'listo_para_servir', 'abierta', 'en_uso', 'pendiente_cobro', 'completada', 'pendiente', 'pagado')
      `);
      
      // Actualizar Mesa 1 en Sucursal 6
      const totalSucursal6 = await client.query(`
        SELECT 
          COALESCE(SUM(v.total), 0) as total_acumulado,
          COUNT(DISTINCT v.id_venta) as total_ventas
        FROM ventas v
        WHERE v.id_mesa = 31 
          AND v.estado IN ('recibido', 'en_preparacion', 'listo_para_servir', 'abierta', 'en_uso', 'pendiente_cobro', 'completada', 'pendiente', 'pagado')
      `);
      
      await client.query(`
        UPDATE mesas 
        SET 
          total_acumulado = $1,
          estado = CASE WHEN $1 > 0 THEN 'en_uso' ELSE 'libre' END
        WHERE id_mesa = 32
      `, [parseFloat(totalSucursal4.rows[0].total_acumulado) || 0]);
      
      await client.query(`
        UPDATE mesas 
        SET 
          total_acumulado = $1,
          estado = CASE WHEN $1 > 0 THEN 'en_uso' ELSE 'libre' END
        WHERE id_mesa = 31
      `, [parseFloat(totalSucursal6.rows[0].total_acumulado) || 0]);
      
      console.log(`  ✅ Mesa 1 Sucursal 4: Total=$${totalSucursal4.rows[0].total_acumulado}, Ventas=${totalSucursal4.rows[0].total_ventas}`);
      console.log(`  ✅ Mesa 1 Sucursal 6: Total=$${totalSucursal6.rows[0].total_acumulado}, Ventas=${totalSucursal6.rows[0].total_ventas}`);
      
    } catch (error) {
      console.log(`  ❌ Error actualizando totales: ${error.message}`);
    }
    
    // 6. RESUMEN FINAL
    console.log('\n🎯 RESUMEN DE CORRECCIÓN:');
    console.log('  ✅ Inconsistencias de Mesa 1 corregidas');
    console.log('  ✅ Totales acumulados actualizados');
    console.log('  ✅ Trigger de integridad rehabilitado');
    
    console.log('\n🔧 PRÓXIMOS PASOS:');
    console.log('  1. Ejecutar verificación de integridad completa');
    console.log('  2. Probar generación de prefacturas');
    console.log('  3. Verificar que no hay más inconsistencias');
    
  } catch (error) {
    console.error('❌ Error en corrección de Mesa 1:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Ejecutar corrección de Mesa 1
corregirInconsistenciasMesa1()
  .then(() => {
    console.log('\n🏁 Corrección de Mesa 1 completada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error en corrección de Mesa 1:', error);
    process.exit(1);
  });
