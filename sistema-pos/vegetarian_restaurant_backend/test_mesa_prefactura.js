const { pool } = require('./src/config/database');

async function testMesaPrefactura() {
  try {
    console.log('🔍 Probando lógica de prefactura de mesas individuales...');
    
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
    console.log(`✅ Mesa encontrada: ID=${mesa.id_mesa}, Número=${mesa.numero}, Total=${mesa.total_acumulado}`);
    
    // 2. Verificar prefacturas de esta mesa
    const prefacturasQuery = `
      SELECT 
        p.id_prefactura,
        p.fecha_apertura,
        p.fecha_cierre,
        p.estado,
        p.total_acumulado
      FROM prefacturas p
      WHERE p.id_mesa = $1
      ORDER BY p.fecha_apertura DESC
    `;
    
    const prefacturasResult = await pool.query(prefacturasQuery, [mesa.id_mesa]);
    console.log(`📊 Prefacturas encontradas para mesa ${mesa.numero}: ${prefacturasResult.rows.length}`);
    prefacturasResult.rows.forEach((prefactura, index) => {
      console.log(`  Prefactura ${index + 1}: ID=${prefactura.id_prefactura}, Estado=${prefactura.estado}, Total=${prefactura.total_acumulado}, Apertura=${prefactura.fecha_apertura}, Cierre=${prefactura.fecha_cierre}`);
    });
    
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
    `;
    
    const ventasResult = await pool.query(ventasQuery, [mesa.numero]);
    console.log(`📊 Ventas encontradas para mesa ${mesa.numero}: ${ventasResult.rows.length}`);
    ventasResult.rows.forEach((venta, index) => {
      console.log(`  Venta ${index + 1}: ID=${venta.id_venta}, Total=${venta.total}, Items=${venta.items_count}, Estado=${venta.estado}, Fecha=${venta.fecha}`);
    });
    
    // 4. Verificar productos de esta mesa
    const productosQuery = `
      SELECT 
        p.nombre as nombre_producto,
        SUM(dv.cantidad) as cantidad_total,
        dv.precio_unitario,
        SUM(dv.subtotal) as subtotal_total,
        dv.observaciones
      FROM ventas v
      JOIN detalle_ventas dv ON v.id_venta = dv.id_venta
      JOIN productos p ON dv.id_producto = p.id_producto
      WHERE v.mesa_numero = $1
        AND v.estado IN ('abierta', 'en_uso', 'pendiente_cobro', 'entregado', 'pagado', 'completada', 'pendiente', 'recibido')
      GROUP BY p.nombre, dv.precio_unitario, dv.observaciones
      ORDER BY p.nombre
    `;
    
    const productosResult = await pool.query(productosQuery, [mesa.numero]);
    console.log(`🍽️ Productos encontrados para mesa ${mesa.numero}: ${productosResult.rows.length}`);
    productosResult.rows.forEach((producto, index) => {
      console.log(`  Producto ${index + 1}: ${producto.nombre_producto}, Cantidad=${producto.cantidad_total}, Subtotal=${producto.subtotal_total}`);
    });
    
    // 5. Simular la función de prefactura de mesa individual
    console.log('\n🔧 Simulando función de prefactura de mesa individual...');
    
    // Obtener prefactura abierta
    const prefacturaAbiertaQuery = `
      SELECT id_prefactura, fecha_apertura
      FROM prefacturas
      WHERE id_mesa = $1 AND estado = 'abierta'
      ORDER BY fecha_apertura DESC
      LIMIT 1
    `;
    
    const prefacturaAbiertaResult = await pool.query(prefacturaAbiertaQuery, [mesa.id_mesa]);
    const prefacturaAbierta = prefacturaAbiertaResult.rows[0];
    let fechaAperturaPrefactura = null;
    if (prefacturaAbierta) {
      fechaAperturaPrefactura = prefacturaAbierta.fecha_apertura;
      console.log(`📅 Prefactura abierta desde: ${fechaAperturaPrefactura}`);
    } else {
      console.log(`📅 No hay prefactura abierta, usando hora_apertura de la mesa: ${mesa.hora_apertura}`);
      fechaAperturaPrefactura = mesa.hora_apertura;
    }
    
    // Calcular total acumulado de la sesión actual
    let totalAcumulado = 0;
    let totalVentas = 0;
    if (fechaAperturaPrefactura) {
      const totalSesionQuery = `
        SELECT 
          COALESCE(SUM(dv.subtotal), 0) as total_acumulado,
          COUNT(DISTINCT v.id_venta) as total_ventas
        FROM ventas v
        JOIN detalle_ventas dv ON dv.id_venta = v.id_venta
        WHERE v.mesa_numero = $1 
          AND v.fecha >= $2
          AND v.estado IN ('abierta', 'en_uso', 'pendiente_cobro', 'entregado', 'completada', 'pendiente', 'recibido')
      `;
      const totalSesionResult = await pool.query(totalSesionQuery, [mesa.numero, fechaAperturaPrefactura]);
      totalAcumulado = parseFloat(totalSesionResult.rows[0].total_acumulado) || 0;
      totalVentas = parseInt(totalSesionResult.rows[0].total_ventas) || 0;
    }
    
    console.log(`💰 Total acumulado de la sesión actual: ${totalAcumulado}`);
    console.log(`📊 Total ventas de la sesión actual: ${totalVentas}`);
    
    // Obtener historial de la sesión actual
    const historialQuery = `
      SELECT 
        v.id_venta,
        v.fecha,
        v.total,
        v.estado,
        v.tipo_servicio,
        dv.cantidad,
        dv.precio_unitario,
        dv.subtotal,
        dv.observaciones,
        p.nombre as nombre_producto,
        vend.nombre as nombre_vendedor,
        dv.id_detalle,
        dv.id_producto
      FROM ventas v
      JOIN detalle_ventas dv ON v.id_venta = dv.id_venta
      JOIN productos p ON dv.id_producto = p.id_producto
      JOIN vendedores vend ON v.id_vendedor = vend.id_vendedor
      WHERE v.mesa_numero = $1
        AND v.estado IN ('abierta', 'en_uso', 'pendiente_cobro', 'entregado', 'pagado', 'completada', 'pendiente', 'recibido')
        ${fechaAperturaPrefactura ? 'AND v.fecha >= $2' : ''}
      ORDER BY v.fecha DESC
    `;
    
    const historialParams = fechaAperturaPrefactura 
      ? [mesa.numero, fechaAperturaPrefactura]
      : [mesa.numero];
    const historialResult = await pool.query(historialQuery, historialParams);
    
    console.log(`📋 Historial de la sesión actual: ${historialResult.rows.length} registros`);
    
    // Agrupar productos
    const productosAgrupados = {};
    historialResult.rows.forEach((item) => {
      const key = item.nombre_producto;
      if (!productosAgrupados[key]) {
        productosAgrupados[key] = {
          nombre_producto: key,
          cantidad_total: 0,
          precio_unitario: parseFloat(item.precio_unitario) || 0,
          subtotal_total: 0,
          observaciones: item.observaciones || '-'
        };
      }
      
      const cantidad = parseInt(item.cantidad) || 0;
      const subtotal = parseFloat(item.subtotal) || 0;
      
      productosAgrupados[key].cantidad_total += cantidad;
      productosAgrupados[key].subtotal_total += subtotal;
    });
    
    const historialAgrupado = Object.values(productosAgrupados);
    console.log(`🍽️ Productos de la sesión actual: ${historialAgrupado.length} productos diferentes`);
    
    historialAgrupado.forEach((producto, index) => {
      console.log(`  ${index + 1}. ${producto.nombre_producto}: ${producto.cantidad_total} x $${producto.precio_unitario} = $${producto.subtotal_total}`);
    });
    
    // 6. Simular cierre y apertura de mesa
    console.log('\n🔄 Simulando cierre y apertura de mesa...');
    
    // Simular cierre de mesa
    const cerrarMesaQuery = `
      UPDATE mesas 
      SET estado = 'libre', 
          hora_cierre = NOW(),
          id_venta_actual = NULL,
          total_acumulado = 0
      WHERE id_mesa = $1
      RETURNING *
    `;
    const cerrarMesaResult = await pool.query(cerrarMesaQuery, [mesa.id_mesa]);
    console.log('✅ Mesa cerrada');
    
    // Cerrar prefactura si existe
    if (prefacturaAbierta) {
      const cerrarPrefacturaQuery = `
        UPDATE prefacturas 
        SET estado = 'cerrada', 
            fecha_cierre = NOW(),
            total_acumulado = $2
        WHERE id_prefactura = $1
      `;
      await pool.query(cerrarPrefacturaQuery, [prefacturaAbierta.id_prefactura, totalAcumulado]);
      console.log('✅ Prefactura cerrada');
    }
    
    // Simular apertura de mesa
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
    
    // Crear nueva prefactura
    const nuevaPrefacturaQuery = `
      INSERT INTO prefacturas (id_mesa, id_venta_principal, total_acumulado, estado, id_restaurante)
      VALUES ($1, NULL, 0, 'abierta', $2)
      RETURNING *
    `;
    const nuevaPrefacturaResult = await pool.query(nuevaPrefacturaQuery, [mesa.id_mesa, 1]); // Asumiendo id_restaurante = 1
    console.log('✅ Nueva prefactura creada');
    
    console.log('\n✅ Prueba de prefactura de mesa individual completada');
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  } finally {
    await pool.end();
  }
}

testMesaPrefactura(); 