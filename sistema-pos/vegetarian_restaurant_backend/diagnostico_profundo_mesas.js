const { pool } = require('./src/config/database');

async function diagnosticoProfundoMesas() {
  const client = await pool.connect();
  try {
    console.log('🔍 DIAGNÓSTICO PROFUNDO DEL PROBLEMA DE MESAS\n');
    
    // 1. ANALIZAR MESAS DUPLICADAS
    console.log('1️⃣ ANALIZANDO MESAS DUPLICADAS...');
    
    try {
      const mesasDuplicadas = await client.query(`
        SELECT 
          numero,
          COUNT(*) as total_mesas,
          STRING_AGG(CONCAT('ID:', id_mesa, '(Suc:', id_sucursal, ',Rest:', id_restaurante, ')'), ' | ') as detalles
        FROM mesas
        GROUP BY numero, id_restaurante
        HAVING COUNT(*) > 1
        ORDER BY numero, id_restaurante
      `);
      
      console.log(`  📊 Encontradas ${mesasDuplicadas.rows.length} configuraciones de mesas duplicadas:`);
      
      for (const mesa of mesasDuplicadas.rows) {
        console.log(`    Mesa ${mesa.numero}: ${mesa.total_mesas} instancias - ${mesa.detalles}`);
      }
      
    } catch (error) {
      console.log(`  ❌ Error analizando mesas duplicadas: ${error.message}`);
    }
    
    // 2. ANALIZAR VENTAS PROBLEMÁTICAS
    console.log('\n2️⃣ ANALIZANDO VENTAS PROBLEMÁTICAS...');
    
    try {
      // Ventas que están causando el error
      const ventasProblematicas = await client.query(`
        SELECT 
          v.id_venta,
          v.id_mesa,
          v.id_sucursal,
          v.id_restaurante,
          v.total,
          v.estado,
          v.fecha,
          m.numero as mesa_numero,
          m.id_sucursal as mesa_sucursal,
          m.id_restaurante as mesa_restaurante
        FROM ventas v
        JOIN mesas m ON v.id_mesa = m.id_mesa
        WHERE v.id_sucursal != m.id_sucursal OR v.id_restaurante != m.id_restaurante
        ORDER BY v.fecha DESC
        LIMIT 15
      `);
      
      console.log(`  📊 Ventas con inconsistencias (primeras 15):`);
      
      for (const venta of ventasProblematicas.rows) {
        console.log(`    Venta ${venta.id_venta}:`);
        console.log(`      Mesa: ${venta.id_mesa} (${venta.mesa_numero})`);
        console.log(`      Venta Suc/Rest: ${venta.id_sucursal}/${venta.id_restaurante}`);
        console.log(`      Mesa Suc/Rest: ${venta.mesa_sucursal}/${venta.mesa_restaurante}`);
        console.log(`      Total: $${venta.total}, Estado: ${venta.estado}`);
        console.log(`      Fecha: ${venta.fecha}`);
        console.log('');
      }
      
    } catch (error) {
      console.log(`  ❌ Error analizando ventas: ${error.message}`);
    }
    
    // 3. ANALIZAR ESTRUCTURA DE SUCURSALES Y RESTAURANTES
    console.log('\n3️⃣ ANALIZANDO ESTRUCTURA DE SUCURSALES Y RESTAURANTES...');
    
    try {
      const sucursales = await client.query(`
        SELECT 
          s.id_sucursal,
          s.nombre as sucursal_nombre,
          s.id_restaurante,
          r.nombre as restaurante_nombre
        FROM sucursales s
        JOIN restaurantes r ON s.id_restaurante = r.id_restaurante
        ORDER BY s.id_restaurante, s.id_sucursal
      `);
      
      console.log(`  📊 Estructura de sucursales y restaurantes:`);
      
      for (const suc of sucursales.rows) {
        console.log(`    Sucursal ${suc.id_sucursal} (${suc.sucursal_nombre}) → Restaurante ${suc.id_restaurante} (${suc.restaurante_nombre})`);
      }
      
    } catch (error) {
      console.log(`  ❌ Error analizando estructura: ${error.message}`);
    }
    
    // 4. ANALIZAR MESAS POR SUCURSAL
    console.log('\n4️⃣ ANALIZANDO MESAS POR SUCURSAL...');
    
    try {
      const mesasPorSucursal = await client.query(`
        SELECT 
          m.id_sucursal,
          s.nombre as sucursal_nombre,
          m.id_restaurante,
          r.nombre as restaurante_nombre,
          COUNT(*) as total_mesas,
          STRING_AGG(CONCAT(m.numero, '(ID:', m.id_mesa, ')'), ', ') as mesas
        FROM mesas m
        JOIN sucursales s ON m.id_sucursal = s.id_sucursal
        JOIN restaurantes r ON m.id_restaurante = r.id_restaurante
        GROUP BY m.id_sucursal, s.nombre, m.id_restaurante, r.nombre
        ORDER BY m.id_restaurante, m.id_sucursal
      `);
      
      console.log(`  📊 Distribución de mesas por sucursal:`);
      
      for (const mesa of mesasPorSucursal.rows) {
        console.log(`    Sucursal ${mesa.id_sucursal} (${mesa.sucursal_nombre}): ${mesa.total_mesas} mesas`);
        console.log(`      Restaurante: ${mesa.id_restaurante} (${mesa.restaurante_nombre})`);
        console.log(`      Mesas: ${mesa.mesas}`);
        console.log('');
      }
      
    } catch (error) {
      console.log(`  ❌ Error analizando mesas por sucursal: ${error.message}`);
    }
    
    // 5. ANALIZAR VENTAS RECIENTES
    console.log('\n5️⃣ ANALIZANDO VENTAS RECIENTES...');
    
    try {
      const ventasRecientes = await client.query(`
        SELECT 
          v.id_venta,
          v.id_mesa,
          v.id_sucursal,
          v.id_restaurante,
          v.total,
          v.estado,
          v.fecha,
          m.numero as mesa_numero
        FROM ventas v
        JOIN mesas m ON v.id_mesa = m.id_mesa
        ORDER BY v.fecha DESC
        LIMIT 10
      `);
      
      console.log(`  📊 Ventas más recientes:`);
      
      for (const venta of ventasRecientes.rows) {
        console.log(`    Venta ${venta.id_venta}: Mesa ${venta.mesa_numero} (ID: ${venta.id_mesa})`);
        console.log(`      Sucursal: ${venta.id_sucursal}, Restaurante: ${venta.id_restaurante}`);
        console.log(`      Total: $${venta.total}, Estado: ${venta.estado}`);
        console.log(`      Fecha: ${venta.fecha}`);
        console.log('');
      }
      
    } catch (error) {
      console.log(`  ❌ Error analizando ventas recientes: ${error.message}`);
    }
    
    // 6. RECOMENDACIONES
    console.log('\n6️⃣ RECOMENDACIONES PARA SOLUCIONAR EL PROBLEMA...');
    
    console.log('\n🔧 PROBLEMA IDENTIFICADO:');
    console.log('   El trigger de integridad está previniendo correcciones porque detecta');
    console.log('   mesas duplicadas por número en el mismo restaurante.');
    
    console.log('\n💡 SOLUCIONES POSIBLES:');
    console.log('   1. TEMPORAL: Deshabilitar temporalmente el trigger de integridad');
    console.log('   2. CORRECCIÓN: Eliminar mesas duplicadas y consolidar en una sola');
    console.log('   3. MIGRACIÓN: Transferir todas las ventas a la mesa correcta');
    console.log('   4. REESTRUCTURACIÓN: Reorganizar la numeración de mesas');
    
    console.log('\n🚨 ACCIÓN INMEDIATA REQUERIDA:');
    console.log('   El trigger está bloqueando todas las correcciones automáticas.');
    console.log('   Se necesita intervención manual para resolver las inconsistencias.');
    
  } catch (error) {
    console.error('❌ Error en diagnóstico profundo:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Ejecutar diagnóstico profundo
diagnosticoProfundoMesas()
  .then(() => {
    console.log('\n🏁 Diagnóstico profundo completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error en diagnóstico profundo:', error);
    process.exit(1);
  });
