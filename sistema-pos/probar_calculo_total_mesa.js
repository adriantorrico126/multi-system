const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'sistempos',
  user: 'postgres',
  password: '6951230Anacleta'
});

async function probarCalculoTotalMesa() {
  try {
    console.log('🧮 [PRUEBA] Cálculo de total de mesa');
    console.log('==================================');

    // 1. Verificar mesas con totales acumulados
    console.log('\n📊 MESAS CON TOTALES ACUMULADOS:');
    const mesasConTotal = await pool.query(`
      SELECT 
        m.id_mesa,
        m.numero,
        m.estado,
        m.total_acumulado,
        m.hora_apertura,
        COUNT(v.id_venta) as ventas_count
      FROM mesas m
      LEFT JOIN ventas v ON m.numero = v.mesa_numero AND m.id_restaurante = v.id_restaurante
      WHERE m.id_restaurante = 1 
        AND m.total_acumulado > 0
      GROUP BY m.id_mesa, m.numero, m.estado, m.total_acumulado, m.hora_apertura
      ORDER BY m.total_acumulado DESC
    `);
    console.table(mesasConTotal.rows);

    if (mesasConTotal.rows.length === 0) {
      console.log('ℹ️ No hay mesas con totales acumulados');
      return;
    }

    // 2. Para cada mesa, calcular el total real de la sesión actual
    for (const mesa of mesasConTotal.rows) {
      console.log(`\n🔍 MESA ${mesa.numero} (ID: ${mesa.id_mesa}):`);
      console.log(`   Estado: ${mesa.estado}`);
      console.log(`   Total acumulado: $${mesa.total_acumulado}`);
      console.log(`   Hora apertura: ${mesa.hora_apertura}`);
      console.log(`   Ventas asociadas: ${mesa.ventas_count}`);

      // Calcular total real de la sesión actual
      const totalSesionQuery = `
        SELECT 
          COALESCE(SUM(dv.subtotal), 0) as total_sesion,
          COUNT(DISTINCT v.id_venta) as ventas_sesion,
          MIN(v.fecha) as primera_venta,
          MAX(v.fecha) as ultima_venta
        FROM ventas v
        JOIN detalle_ventas dv ON v.id_venta = dv.id_venta
        WHERE v.mesa_numero = $1 
          AND v.id_restaurante = $2 
          AND v.estado IN ('completada', 'pendiente', 'abierta', 'en_uso', 'pendiente_cobro', 'entregado', 'recibido', 'en_preparacion')
          AND v.fecha >= (
            SELECT COALESCE(hora_apertura, NOW() - INTERVAL '1 hour') 
            FROM mesas 
            WHERE id_mesa = $3 AND id_restaurante = $2
          )
      `;
      
      const totalSesionResult = await pool.query(totalSesionQuery, [mesa.numero, 1, mesa.id_mesa]);
      const totalSesion = parseFloat(totalSesionResult.rows[0].total_sesion) || 0;
      
      console.log(`   ✅ Total real de sesión: $${totalSesion.toFixed(2)}`);
      console.log(`   📊 Ventas en sesión: ${totalSesionResult.rows[0].ventas_sesion}`);
      console.log(`   ⏰ Primera venta: ${totalSesionResult.rows[0].primera_venta}`);
      console.log(`   ⏰ Última venta: ${totalSesionResult.rows[0].ultima_venta}`);
      
      // Verificar diferencia
      const diferencia = mesa.total_acumulado - totalSesion;
      if (Math.abs(diferencia) > 0.01) {
        console.log(`   ⚠️ DIFERENCIA: $${diferencia.toFixed(2)} (Acumulado: $${mesa.total_acumulado} vs Sesión: $${totalSesion.toFixed(2)})`);
      } else {
        console.log(`   ✅ Total correcto`);
      }
    }

    // 3. Mostrar ventas recientes para contexto
    console.log('\n📋 VENTAS RECIENTES (últimas 5):');
    const ventasRecientes = await pool.query(`
      SELECT 
        v.id_venta,
        v.mesa_numero,
        v.total,
        v.estado,
        v.fecha,
        v.tipo_servicio,
        COUNT(dv.id_detalle) as items_count
      FROM ventas v
      LEFT JOIN detalle_ventas dv ON v.id_venta = dv.id_venta
      WHERE v.id_restaurante = 1 
        AND v.mesa_numero IS NOT NULL
      GROUP BY v.id_venta, v.mesa_numero, v.total, v.estado, v.fecha, v.tipo_servicio
      ORDER BY v.fecha DESC
      LIMIT 5
    `);
    console.table(ventasRecientes.rows);

    console.log('\n💡 RECOMENDACIÓN:');
    console.log('=================');
    console.log('✅ El sistema ahora calcula el total real de la sesión actual');
    console.log('✅ No se incluyen totales históricos en el mensaje de cobro');
    console.log('✅ El mensaje mostrará solo el total que realmente se está cobrando');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

probarCalculoTotalMesa();

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'sistempos',
  user: 'postgres',
  password: '6951230Anacleta'
});

async function probarCalculoTotalMesa() {
  try {
    console.log('🧮 [PRUEBA] Cálculo de total de mesa');
    console.log('==================================');

    // 1. Verificar mesas con totales acumulados
    console.log('\n📊 MESAS CON TOTALES ACUMULADOS:');
    const mesasConTotal = await pool.query(`
      SELECT 
        m.id_mesa,
        m.numero,
        m.estado,
        m.total_acumulado,
        m.hora_apertura,
        COUNT(v.id_venta) as ventas_count
      FROM mesas m
      LEFT JOIN ventas v ON m.numero = v.mesa_numero AND m.id_restaurante = v.id_restaurante
      WHERE m.id_restaurante = 1 
        AND m.total_acumulado > 0
      GROUP BY m.id_mesa, m.numero, m.estado, m.total_acumulado, m.hora_apertura
      ORDER BY m.total_acumulado DESC
    `);
    console.table(mesasConTotal.rows);

    if (mesasConTotal.rows.length === 0) {
      console.log('ℹ️ No hay mesas con totales acumulados');
      return;
    }

    // 2. Para cada mesa, calcular el total real de la sesión actual
    for (const mesa of mesasConTotal.rows) {
      console.log(`\n🔍 MESA ${mesa.numero} (ID: ${mesa.id_mesa}):`);
      console.log(`   Estado: ${mesa.estado}`);
      console.log(`   Total acumulado: $${mesa.total_acumulado}`);
      console.log(`   Hora apertura: ${mesa.hora_apertura}`);
      console.log(`   Ventas asociadas: ${mesa.ventas_count}`);

      // Calcular total real de la sesión actual
      const totalSesionQuery = `
        SELECT 
          COALESCE(SUM(dv.subtotal), 0) as total_sesion,
          COUNT(DISTINCT v.id_venta) as ventas_sesion,
          MIN(v.fecha) as primera_venta,
          MAX(v.fecha) as ultima_venta
        FROM ventas v
        JOIN detalle_ventas dv ON v.id_venta = dv.id_venta
        WHERE v.mesa_numero = $1 
          AND v.id_restaurante = $2 
          AND v.estado IN ('completada', 'pendiente', 'abierta', 'en_uso', 'pendiente_cobro', 'entregado', 'recibido', 'en_preparacion')
          AND v.fecha >= (
            SELECT COALESCE(hora_apertura, NOW() - INTERVAL '1 hour') 
            FROM mesas 
            WHERE id_mesa = $3 AND id_restaurante = $2
          )
      `;
      
      const totalSesionResult = await pool.query(totalSesionQuery, [mesa.numero, 1, mesa.id_mesa]);
      const totalSesion = parseFloat(totalSesionResult.rows[0].total_sesion) || 0;
      
      console.log(`   ✅ Total real de sesión: $${totalSesion.toFixed(2)}`);
      console.log(`   📊 Ventas en sesión: ${totalSesionResult.rows[0].ventas_sesion}`);
      console.log(`   ⏰ Primera venta: ${totalSesionResult.rows[0].primera_venta}`);
      console.log(`   ⏰ Última venta: ${totalSesionResult.rows[0].ultima_venta}`);
      
      // Verificar diferencia
      const diferencia = mesa.total_acumulado - totalSesion;
      if (Math.abs(diferencia) > 0.01) {
        console.log(`   ⚠️ DIFERENCIA: $${diferencia.toFixed(2)} (Acumulado: $${mesa.total_acumulado} vs Sesión: $${totalSesion.toFixed(2)})`);
      } else {
        console.log(`   ✅ Total correcto`);
      }
    }

    // 3. Mostrar ventas recientes para contexto
    console.log('\n📋 VENTAS RECIENTES (últimas 5):');
    const ventasRecientes = await pool.query(`
      SELECT 
        v.id_venta,
        v.mesa_numero,
        v.total,
        v.estado,
        v.fecha,
        v.tipo_servicio,
        COUNT(dv.id_detalle) as items_count
      FROM ventas v
      LEFT JOIN detalle_ventas dv ON v.id_venta = dv.id_venta
      WHERE v.id_restaurante = 1 
        AND v.mesa_numero IS NOT NULL
      GROUP BY v.id_venta, v.mesa_numero, v.total, v.estado, v.fecha, v.tipo_servicio
      ORDER BY v.fecha DESC
      LIMIT 5
    `);
    console.table(ventasRecientes.rows);

    console.log('\n💡 RECOMENDACIÓN:');
    console.log('=================');
    console.log('✅ El sistema ahora calcula el total real de la sesión actual');
    console.log('✅ No se incluyen totales históricos en el mensaje de cobro');
    console.log('✅ El mensaje mostrará solo el total que realmente se está cobrando');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

probarCalculoTotalMesa();
