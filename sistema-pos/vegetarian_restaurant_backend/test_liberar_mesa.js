const { pool } = require('./src/config/database');

async function testLiberarMesa() {
  try {
    console.log('🔍 Probando lógica de liberar mesa...');
    
    // 1. Buscar una mesa que tenga ventas
    const mesaQuery = `
      SELECT DISTINCT m.id_mesa, m.numero, m.estado, m.total_acumulado, m.hora_apertura
      FROM mesas m
      JOIN ventas v ON m.numero = v.mesa_numero
      WHERE v.estado IN ('abierta', 'en_uso', 'pendiente_cobro', 'entregado', 'pagado', 'completada', 'pendiente', 'recibido')
      LIMIT 1
    `;
    
    const mesaResult = await pool.query(mesaQuery);
    if (mesaResult.rows.length === 0) {
      console.log('❌ No se encontraron mesas con ventas para probar');
      return;
    }
    
    const mesa = mesaResult.rows[0];
    console.log(`✅ Mesa encontrada: ID=${mesa.id_mesa}, Número=${mesa.numero}, Estado=${mesa.estado}, Total=${mesa.total_acumulado}`);
    
    // 2. Verificar prefactura actual
    const prefacturaQuery = `
      SELECT 
        p.id_prefactura,
        p.fecha_apertura,
        p.fecha_cierre,
        p.estado,
        p.total_acumulado
      FROM prefacturas p
      WHERE p.id_mesa = $1 AND p.estado = 'abierta'
      ORDER BY p.fecha_apertura DESC
      LIMIT 1
    `;
    
    const prefacturaResult = await pool.query(prefacturaQuery, [mesa.id_mesa]);
    if (prefacturaResult.rows.length > 0) {
      const prefactura = prefacturaResult.rows[0];
      console.log(`📊 Prefactura actual: ID=${prefactura.id_prefactura}, Estado=${prefactura.estado}, Total=${prefactura.total_acumulado}, Apertura=${prefactura.fecha_apertura}`);
    } else {
      console.log('📊 No hay prefactura abierta');
    }
    
    // 3. Verificar ventas de esta mesa
    const ventasQuery = `
      SELECT 
        v.id_venta,
        v.fecha,
        v.total,
        v.estado,
        COUNT(dv.id_detalle) as items_count
      FROM ventas v
      LEFT JOIN detalle_ventas dv ON v.id_venta = dv.id_venta
      WHERE v.mesa_numero = $1
      GROUP BY v.id_venta, v.fecha, v.total, v.estado
      ORDER BY v.fecha DESC
      LIMIT 5
    `;
    
    const ventasResult = await pool.query(ventasQuery, [mesa.numero]);
    console.log(`📊 Últimas 5 ventas para mesa ${mesa.numero}: ${ventasResult.rows.length}`);
    ventasResult.rows.forEach((venta, index) => {
      console.log(`  Venta ${index + 1}: ID=${venta.id_venta}, Total=${venta.total}, Items=${venta.items_count}, Estado=${venta.estado}, Fecha=${venta.fecha}`);
    });
    
    // 4. Simular liberar mesa
    console.log('\n🔄 Simulando liberar mesa...');
    
    // Cerrar prefactura actual si existe
    if (prefacturaResult.rows.length > 0) {
      const prefactura = prefacturaResult.rows[0];
      const cerrarPrefacturaQuery = `
        UPDATE prefacturas 
        SET estado = 'cerrada', 
            fecha_cierre = NOW(),
            total_acumulado = 0
        WHERE id_prefactura = $1
      `;
      await pool.query(cerrarPrefacturaQuery, [prefactura.id_prefactura]);
      console.log('✅ Prefactura anterior cerrada');
    }
    
    // Liberar mesa
    const liberarMesaQuery = `
      UPDATE mesas 
      SET estado = 'libre', 
          hora_cierre = NOW(),
          id_venta_actual = NULL,
          total_acumulado = 0
      WHERE id_mesa = $1
      RETURNING *
    `;
    const liberarMesaResult = await pool.query(liberarMesaQuery, [mesa.id_mesa]);
    console.log('✅ Mesa liberada');
    
    // Crear nueva prefactura limpia
    const nuevaPrefacturaQuery = `
      INSERT INTO prefacturas (id_mesa, id_venta_principal, total_acumulado, estado, id_restaurante)
      VALUES ($1, NULL, 0, 'abierta', $2)
      RETURNING *
    `;
    const nuevaPrefacturaResult = await pool.query(nuevaPrefacturaQuery, [mesa.id_mesa, 1]); // Asumiendo id_restaurante = 1
    console.log('✅ Nueva prefactura limpia creada');
    
    // 5. Verificar estado después de liberar
    console.log('\n📊 Estado después de liberar mesa:');
    
    // Verificar mesa
    const mesaDespuesQuery = `
      SELECT id_mesa, numero, estado, total_acumulado, hora_apertura, hora_cierre
      FROM mesas
      WHERE id_mesa = $1
    `;
    const mesaDespuesResult = await pool.query(mesaDespuesQuery, [mesa.id_mesa]);
    const mesaDespues = mesaDespuesResult.rows[0];
    console.log(`  Mesa: Estado=${mesaDespues.estado}, Total=${mesaDespues.total_acumulado}`);
    
    // Verificar prefactura nueva
    const prefacturaNuevaQuery = `
      SELECT 
        p.id_prefactura,
        p.fecha_apertura,
        p.fecha_cierre,
        p.estado,
        p.total_acumulado
      FROM prefacturas p
      WHERE p.id_mesa = $1 AND p.estado = 'abierta'
      ORDER BY p.fecha_apertura DESC
      LIMIT 1
    `;
    const prefacturaNuevaResult = await pool.query(prefacturaNuevaQuery, [mesa.id_mesa]);
    if (prefacturaNuevaResult.rows.length > 0) {
      const prefacturaNueva = prefacturaNuevaResult.rows[0];
      console.log(`  Prefactura nueva: ID=${prefacturaNueva.id_prefactura}, Estado=${prefacturaNueva.estado}, Total=${prefacturaNueva.total_acumulado}, Apertura=${prefacturaNueva.fecha_apertura}`);
    }
    
    // 6. Simular abrir mesa nuevamente
    console.log('\n🔄 Simulando abrir mesa nuevamente...');
    
    // Abrir mesa
    const abrirMesaQuery = `
      UPDATE mesas 
      SET estado = 'en_uso', 
          hora_apertura = NOW(),
          total_acumulado = 0,
          id_venta_actual = NULL
      WHERE id_mesa = $1
      RETURNING *
    `;
    const abrirMesaResult = await pool.query(abrirMesaQuery, [mesa.id_mesa]);
    console.log('✅ Mesa abierta nuevamente');
    
    // Verificar que la prefactura sigue siendo la misma (no se crea una nueva)
    const prefacturaFinalQuery = `
      SELECT 
        p.id_prefactura,
        p.fecha_apertura,
        p.fecha_cierre,
        p.estado,
        p.total_acumulado
      FROM prefacturas p
      WHERE p.id_mesa = $1 AND p.estado = 'abierta'
      ORDER BY p.fecha_apertura DESC
      LIMIT 1
    `;
    const prefacturaFinalResult = await pool.query(prefacturaFinalQuery, [mesa.id_mesa]);
    if (prefacturaFinalResult.rows.length > 0) {
      const prefacturaFinal = prefacturaFinalResult.rows[0];
      console.log(`  Prefactura final: ID=${prefacturaFinal.id_prefactura}, Estado=${prefacturaFinal.estado}, Total=${prefacturaFinal.total_acumulado}`);
    }
    
    console.log('\n✅ Prueba de liberar mesa completada');
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  } finally {
    await pool.end();
  }
}

testLiberarMesa(); 