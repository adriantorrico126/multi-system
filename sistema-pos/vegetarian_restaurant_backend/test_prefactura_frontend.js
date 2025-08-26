const { pool } = require('./src/config/database');

async function testPrefacturaFrontend() {
  const client = await pool.connect();
  try {
    console.log('🔍 PROBANDO API DE PREFACTURA PARA FRONTEND\n');
    
    // 1. PROBAR CON MESA 1 (ID: 31) - Sucursal 6
    console.log('1️⃣ PROBANDO CON MESA 1 (ID: 31) - Sucursal 6...');
    
    try {
      // Simular exactamente lo que hace el backend
      const mesa = await client.query(`
        SELECT 
          m.id_mesa,
          m.numero,
          m.capacidad,
          m.estado,
          m.total_acumulado,
          m.created_at as fecha_apertura,
          s.nombre as sucursal_nombre,
          r.nombre as restaurante_nombre
        FROM mesas m
        JOIN sucursales s ON m.id_sucursal = s.id_sucursal
        JOIN restaurantes r ON m.id_restaurante = r.id_restaurante
        WHERE m.id_mesa = 31
      `);
      
      if (mesa.rows.length === 0) {
        console.log('  ❌ Mesa 31 no encontrada');
        return;
      }
      
      const mesaData = mesa.rows[0];
      console.log('  📊 Mesa encontrada:', {
        id_mesa: mesaData.id_mesa,
        numero: mesaData.numero,
        estado: mesaData.estado,
        total_acumulado: mesaData.total_acumulado,
        sucursal: mesaData.sucursal_nombre,
        restaurante: mesaData.restaurante_nombre
      });
      
      // 2. OBTENER VENTAS DE LA MESA
      console.log('\n2️⃣ OBTENIENDO VENTAS DE LA MESA...');
      
      const ventas = await client.query(`
        SELECT 
          v.id_venta,
          v.total,
          v.estado,
          v.fecha,
          v.id_mesa,
          v.id_sucursal,
          v.id_restaurante
        FROM ventas v
        WHERE v.id_mesa = 31
          AND v.estado IN ('recibido', 'en_preparacion', 'listo_para_servir', 'abierta', 'en_uso', 'pendiente_cobro', 'completada', 'pendiente', 'pagado')
        ORDER BY v.fecha DESC
      `);
      
      console.log(`  📊 Ventas encontradas: ${ventas.rows.length}`);
      
      for (const venta of ventas.rows) {
        console.log(`    Venta ${venta.id_venta}: $${venta.total} - ${venta.estado} - ${venta.fecha}`);
      }
      
      // 3. OBTENER DETALLES DE VENTAS
      console.log('\n3️⃣ OBTENIENDO DETALLES DE VENTAS...');
      
      if (ventas.rows.length > 0) {
        const ventaIds = ventas.rows.map(v => v.id_venta);
        
        const detalles = await client.query(`
          SELECT 
            dv.id_detalle,
            dv.id_venta,
            dv.id_producto,
            dv.cantidad,
            dv.precio_unitario,
            dv.subtotal,
            dv.observaciones,
            p.nombre as nombre_producto,
            p.activo as producto_activo
          FROM detalle_ventas dv
          LEFT JOIN productos p ON dv.id_producto = p.id_producto
          WHERE dv.id_venta = ANY($1)
          ORDER BY dv.id_venta, dv.id_detalle
        `, [ventaIds]);
        
        console.log(`  📊 Detalles encontrados: ${detalles.rows.length}`);
        
        for (const detalle of detalles.rows) {
          console.log(`    Detalle ${detalle.id_detalle}: ${detalle.nombre_producto || 'SIN NOMBRE'} - ${detalle.cantidad}x $${detalle.precio_unitario} = $${detalle.subtotal}`);
        }
        
        // 4. SIMULAR RESPUESTA DE LA API
        console.log('\n4️⃣ SIMULANDO RESPUESTA DE LA API...');
        
        const totalAcumulado = ventas.rows.reduce((sum, v) => sum + parseFloat(v.total || 0), 0);
        const totalVentas = ventas.rows.length;
        
        const historialDetallado = detalles.rows.map(d => ({
          id_detalle: d.id_detalle,
          id_venta: d.id_venta,
          id_producto: d.id_producto,
          nombre_producto: d.nombre_producto || 'Producto Desconocido',
          cantidad: d.cantidad,
          precio_unitario: d.precio_unitario,
          subtotal: d.subtotal,
          observaciones: d.observaciones || '-'
        }));
        
        const historial = ventas.rows.map(v => ({
          id_venta: v.id_venta,
          fecha: v.fecha,
          total: v.total,
          estado: v.estado
        }));
        
        const respuestaAPI = {
          success: true,
          data: {
            mesa: mesaData,
            historial: historial,
            historial_detallado: historialDetallado,
            total_acumulado: totalAcumulado,
            total_ventas: totalVentas,
            fecha_apertura: mesaData.fecha_apertura,
            estado_prefactura: 'abierta'
          }
        };
        
        console.log('  📊 Respuesta simulada de la API:');
        console.log('    - Mesa:', respuestaAPI.data.mesa.numero);
        console.log('    - Total acumulado: $' + respuestaAPI.data.total_acumulado);
        console.log('    - Total ventas:', respuestaAPI.data.total_ventas);
        console.log('    - Historial detallado:', respuestaAPI.data.historial_detallado.length, 'productos');
        console.log('    - Historial:', respuestaAPI.data.historial.length, 'ventas');
        
        // 5. VERIFICAR ESTRUCTURA DE DATOS
        console.log('\n5️⃣ VERIFICANDO ESTRUCTURA DE DATOS...');
        
        if (respuestaAPI.data.historial_detallado.length === 0) {
          console.log('  ⚠️ PROBLEMA: No hay productos en historial_detallado');
          console.log('  🔍 Esto explica por qué el frontend muestra "No hay productos"');
        } else {
          console.log('  ✅ Hay productos en historial_detallado');
        }
        
        if (respuestaAPI.data.historial.length === 0) {
          console.log('  ⚠️ PROBLEMA: No hay ventas en historial');
        } else {
          console.log('  ✅ Hay ventas en historial');
        }
        
        // 6. DIAGNÓSTICO DEL PROBLEMA
        console.log('\n6️⃣ DIAGNÓSTICO DEL PROBLEMA...');
        
        if (ventas.rows.length === 0) {
          console.log('  🚨 PROBLEMA PRINCIPAL: No hay ventas activas para la mesa 31');
          console.log('  💡 SOLUCIÓN: Verificar que las ventas tengan el estado correcto');
        } else if (detalles.rows.length === 0) {
          console.log('  🚨 PROBLEMA PRINCIPAL: Hay ventas pero no tienen detalles');
          console.log('  💡 SOLUCIÓN: Verificar que las ventas tengan detalle_ventas');
        } else {
          console.log('  ✅ Los datos están correctos, el problema puede estar en el frontend');
        }
        
      } else {
        console.log('  ❌ No hay ventas para esta mesa');
      }
      
    } catch (error) {
      console.log(`  ❌ Error en prueba: ${error.message}`);
    }
    
  } catch (error) {
    console.error('❌ Error general:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Ejecutar prueba
testPrefacturaFrontend()
  .then(() => {
    console.log('\n🏁 Prueba completada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error en prueba:', error);
    process.exit(1);
  });
