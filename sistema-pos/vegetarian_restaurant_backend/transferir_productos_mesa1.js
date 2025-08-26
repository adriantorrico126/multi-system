const { pool } = require('./src/config/database');

async function transferirProductosMesa1() {
  const client = await pool.connect();
  try {
    console.log('🔄 TRANSFIRIENDO PRODUCTOS DE MESA 1 SUCURSAL 4 A MESA 1 SUCURSAL 6\n');
    
    await client.query('BEGIN');
    
    // 1. Identificar las mesas
    console.log('1️⃣ IDENTIFICANDO MESAS:');
    
    // Mesa 1 Sucursal 4 (origen con productos)
    const mesaOrigen = await client.query(`
      SELECT id_mesa, numero, id_sucursal, id_restaurante, estado, total_acumulado
      FROM mesas 
      WHERE numero = 1 AND id_sucursal = 4 AND id_restaurante = 1
    `);
    
    if (mesaOrigen.rows.length === 0) {
      console.log('❌ Mesa 1 Sucursal 4 no encontrada');
      return;
    }
    
    const mesaOrigenData = mesaOrigen.rows[0];
    console.log(`✅ Mesa origen: ID=${mesaOrigenData.id_mesa}, Número=${mesaOrigenData.numero}, Sucursal=${mesaOrigenData.id_sucursal}, Estado=${mesaOrigenData.estado}, Total=${mesaOrigenData.total_acumulado}`);
    
    // Mesa 1 Sucursal 6 (destino sin productos)
    const mesaDestino = await client.query(`
      SELECT id_mesa, numero, id_sucursal, id_restaurante, estado, total_acumulado
      FROM mesas 
      WHERE numero = 1 AND id_sucursal = 6 AND id_restaurante = 1
    `);
    
    if (mesaDestino.rows.length === 0) {
      console.log('❌ Mesa 1 Sucursal 6 no encontrada');
      return;
    }
    
    const mesaDestinoData = mesaDestino.rows[0];
    console.log(`✅ Mesa destino: ID=${mesaDestinoData.id_mesa}, Número=${mesaDestinoData.numero}, Sucursal=${mesaDestinoData.id_sucursal}, Estado=${mesaDestinoData.estado}, Total=${mesaDestinoData.total_acumulado}`);
    
    // 2. Verificar ventas en mesa origen
    console.log('\n2️⃣ VERIFICANDO VENTAS EN MESA ORIGEN:');
    const ventasOrigen = await client.query(`
      SELECT 
        v.id_venta,
        v.estado,
        v.total,
        v.fecha,
        COUNT(dv.id_detalle) as items_count
      FROM ventas v
      LEFT JOIN detalle_ventas dv ON v.id_venta = dv.id_venta
      WHERE v.id_mesa = $1
      GROUP BY v.id_venta, v.estado, v.total, v.fecha
      ORDER BY v.fecha DESC
    `, [mesaOrigenData.id_mesa]);
    
    console.log(`Ventas encontradas en mesa origen: ${ventasOrigen.rows.length}`);
    ventasOrigen.rows.forEach((venta, index) => {
      console.log(`  ${index + 1}. ID=${venta.id_venta}, Estado=${venta.estado}, Total=${venta.total}, Items=${venta.items_count}, Fecha=${venta.fecha}`);
    });
    
    if (ventasOrigen.rows.length === 0) {
      console.log('❌ No hay ventas para transferir');
      await client.query('ROLLBACK');
      return;
    }
    
    // 3. Transferir ventas a mesa destino
    console.log('\n3️⃣ TRANSFIRIENDO VENTAS:');
    let ventasTransferidas = 0;
    let totalTransferido = 0;
    
    for (const venta of ventasOrigen.rows) {
      // Solo transferir ventas activas (no entregadas)
      if (['recibido', 'en_preparacion', 'listo_para_servir', 'abierta', 'en_uso', 'pendiente_cobro', 'completada', 'pendiente', 'pagado'].includes(venta.estado)) {
        console.log(`  🔄 Transferiendo venta ${venta.id_venta} (${venta.estado})`);
        
        // Actualizar la venta para que apunte a la mesa destino
        await client.query(`
          UPDATE ventas 
          SET id_mesa = $1, mesa_numero = $2, id_sucursal = $3
          WHERE id_venta = $4
        `, [mesaDestinoData.id_mesa, mesaDestinoData.numero, mesaDestinoData.id_sucursal, venta.id_venta]);
        
        ventasTransferidas++;
        totalTransferido += parseFloat(venta.total || 0);
        console.log(`    ✅ Venta transferida`);
      } else {
        console.log(`  ⏭️ Saltando venta ${venta.id_venta} (estado: ${venta.estado})`);
      }
    }
    
    console.log(`\n✅ Ventas transferidas: ${ventasTransferidas}, Total: $${totalTransferido.toFixed(2)}`);
    
    // 4. Actualizar totales de las mesas
    console.log('\n4️⃣ ACTUALIZANDO TOTALES:');
    
    // Mesa origen: recalcular total
    const totalOrigenQuery = `
      SELECT COALESCE(SUM(v.total), 0) as total
      FROM ventas v
      WHERE v.id_mesa = $1 AND v.estado IN ('recibido', 'en_preparacion', 'listo_para_servir', 'abierta', 'en_uso', 'pendiente_cobro', 'completada', 'pendiente', 'pagado')
    `;
    const totalOrigenResult = await client.query(totalOrigenQuery, [mesaOrigenData.id_mesa]);
    const nuevoTotalOrigen = parseFloat(totalOrigenResult.rows[0].total) || 0;
    
    await client.query(`
      UPDATE mesas 
      SET total_acumulado = $1, estado = $2
      WHERE id_mesa = $3
    `, [nuevoTotalOrigen, nuevoTotalOrigen > 0 ? 'en_uso' : 'libre', mesaOrigenData.id_mesa]);
    
    console.log(`✅ Mesa origen actualizada: Total=${nuevoTotalOrigen}, Estado=${nuevoTotalOrigen > 0 ? 'en_uso' : 'libre'}`);
    
    // Mesa destino: actualizar total
    const totalDestinoQuery = `
      SELECT COALESCE(SUM(v.total), 0) as total
      FROM ventas v
      WHERE v.id_mesa = $1 AND v.estado IN ('recibido', 'en_preparacion', 'listo_para_servir', 'abierta', 'en_uso', 'pendiente_cobro', 'completada', 'pendiente', 'pagado')
    `;
    const totalDestinoResult = await client.query(totalDestinoQuery, [mesaDestinoData.id_mesa]);
    const nuevoTotalDestino = parseFloat(totalDestinoResult.rows[0].total) || 0;
    
    await client.query(`
      UPDATE mesas 
      SET total_acumulado = $1, estado = $2
      WHERE id_mesa = $3
    `, [nuevoTotalDestino, 'en_uso', mesaDestinoData.id_mesa]);
    
    console.log(`✅ Mesa destino actualizada: Total=${nuevoTotalDestino}, Estado=en_uso`);
    
    // 5. Verificar transferencia
    console.log('\n5️⃣ VERIFICANDO TRANSFERENCIA:');
    
    const ventasDestino = await client.query(`
      SELECT 
        v.id_venta,
        v.estado,
        v.total,
        COUNT(dv.id_detalle) as items_count,
        STRING_AGG(p.nombre, ', ') as productos
      FROM ventas v
      LEFT JOIN detalle_ventas dv ON v.id_venta = dv.id_venta
      LEFT JOIN productos p ON dv.id_producto = p.id_producto
      WHERE v.id_mesa = $1
      GROUP BY v.id_venta, v.estado, v.total
      ORDER BY v.fecha DESC
    `, [mesaDestinoData.id_mesa]);
    
    console.log(`Ventas en mesa destino después de transferencia: ${ventasDestino.rows.length}`);
    if (ventasDestino.rows.length > 0) {
      ventasDestino.rows.forEach((venta, index) => {
        console.log(`  ${index + 1}. ID=${venta.id_venta}, Estado=${venta.estado}, Total=${venta.total}, Items=${venta.items_count}, Productos=${venta.productos || 'N/A'}`);
      });
    }
    
    await client.query('COMMIT');
    console.log('\n🎉 TRANSFERENCIA COMPLETADA EXITOSAMENTE');
    console.log(`📊 RESUMEN:`);
    console.log(`  - Ventas transferidas: ${ventasTransferidas}`);
    console.log(`  - Total transferido: $${totalTransferido.toFixed(2)}`);
    console.log(`  - Mesa origen (Sucursal 4): Total=${nuevoTotalOrigen}, Estado=${nuevoTotalOrigen > 0 ? 'en_uso' : 'libre'}`);
    console.log(`  - Mesa destino (Sucursal 6): Total=${nuevoTotalDestino}, Estado=en_uso`);
    console.log('\n💡 Ahora la prefactura de la Mesa 1 de Sucursal 6 debería mostrar los productos correctamente');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error en transferencia:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

transferirProductosMesa1();
