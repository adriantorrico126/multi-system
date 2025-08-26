const { pool } = require('./src/config/database');

async function testPrefacturaCorregida() {
  try {
    console.log('🧪 TEST: VERIFICANDO PREFACTURA CORREGIDA CON ID_MESA\n');
    
    // 1. Verificar qué estados tienen las ventas realmente
    console.log('1️⃣ ESTADOS DE VENTAS EN LA BASE DE DATOS:');
    const estadosResult = await pool.query(`
      SELECT estado, COUNT(*) as cantidad
      FROM ventas 
      GROUP BY estado
      ORDER BY cantidad DESC
    `);
    
    estadosResult.rows.forEach(row => {
      console.log(`  - ${row.estado || 'NULL'}: ${row.cantidad} ventas`);
    });
    
    // 2. Encontrar una mesa con ventas
    console.log('\n2️⃣ BUSCANDO MESA CON VENTAS:');
    const mesaConVentas = await pool.query(`
      SELECT DISTINCT m.id_mesa, m.numero, m.id_sucursal, m.id_restaurante
      FROM mesas m
      JOIN ventas v ON v.id_mesa = m.id_mesa
      WHERE v.id_restaurante = 1
      LIMIT 1
    `);
    
    if (mesaConVentas.rows.length === 0) {
      console.log('❌ No se encontraron mesas con ventas');
      return;
    }
    
    const mesa = mesaConVentas.rows[0];
    console.log(`Probando con mesa ${mesa.numero} (ID: ${mesa.id_mesa}, Sucursal: ${mesa.id_sucursal}, Restaurante: ${mesa.id_restaurante})`);
    
    // 3. Probar la consulta CORREGIDA del total usando id_mesa
    console.log('\n3️⃣ PROBANDO CONSULTA CORREGIDA CON ID_MESA:');
    const totalQueryCorregida = `
      SELECT 
        COALESCE(SUM(dv.subtotal), 0) as total_acumulado,
        COUNT(DISTINCT v.id_venta) as total_ventas,
        COUNT(dv.id_detalle) as total_items
      FROM ventas v
      JOIN detalle_ventas dv ON dv.id_venta = v.id_venta
      WHERE v.id_mesa = $1 
        AND v.id_sucursal = $2
        AND v.id_restaurante = $3
        AND v.estado IN ('recibido', 'en_preparacion', 'listo_para_servir', 'entregado', 'cancelado', 'abierta', 'en_uso', 'pendiente_cobro', 'completada', 'pendiente', 'pagado')
    `;
    
    const totalResultCorregida = await pool.query(totalQueryCorregida, [mesa.id_mesa, mesa.id_sucursal, mesa.id_restaurante]);
    console.log(`✅ Total calculado con id_mesa: $${totalResultCorregida.rows[0].total_acumulado}, Ventas: ${totalResultCorregida.rows[0].total_ventas}, Items: ${totalResultCorregida.rows[0].total_items}`);
    
    // 4. Probar la consulta CORREGIDA del historial usando id_mesa
    console.log('\n4️⃣ PROBANDO HISTORIAL CORREGIDO CON ID_MESA:');
    const historialQueryCorregida = `
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
      LEFT JOIN detalle_ventas dv ON v.id_venta = dv.id_venta
      LEFT JOIN productos p ON dv.id_producto = p.id_producto
      LEFT JOIN vendedores vend ON v.id_vendedor = vend.id_vendedor
      WHERE v.id_mesa = $1
        AND v.id_sucursal = $2
        AND v.id_restaurante = $3
        AND v.estado IN ('recibido', 'en_preparacion', 'listo_para_servir', 'entregado', 'cancelado', 'abierta', 'en_uso', 'pendiente_cobro', 'completada', 'pendiente', 'pagado')
      ORDER BY v.fecha DESC
    `;
    
    const historialResultCorregida = await pool.query(historialQueryCorregida, [mesa.id_mesa, mesa.id_sucursal, mesa.id_restaurante]);
    console.log(`✅ Historial obtenido con id_mesa: ${historialResultCorregida.rows.length} registros`);
    
    if (historialResultCorregida.rows.length > 0) {
      console.log('📋 Productos encontrados:');
      historialResultCorregida.rows.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.nombre_producto} - ${item.cantidad}x $${item.precio_unitario} = $${item.subtotal} (Estado: ${item.estado})`);
      });
      
      // Verificar totales
      const totalCalculado = historialResultCorregida.rows.reduce((sum, item) => sum + parseFloat(item.subtotal || 0), 0);
      console.log(`\n💰 Total calculado desde productos: $${totalCalculado.toFixed(2)}`);
      console.log(`💰 Total desde consulta de total: $${totalResultCorregida.rows[0].total_acumulado}`);
      
      if (Math.abs(totalCalculado - parseFloat(totalResultCorregida.rows[0].total_acumulado)) < 0.01) {
        console.log('✅ Los totales coinciden perfectamente');
      } else {
        console.log('⚠️ Los totales no coinciden');
      }
    } else {
      console.log('❌ No se encontraron productos en el historial');
    }
    
    // 5. Comparar con la consulta anterior (incorrecta) usando mesa_numero
    console.log('\n5️⃣ COMPARANDO CON CONSULTA ANTERIOR (INCORRECTA):');
    const totalQueryIncorrecta = `
      SELECT 
        COALESCE(SUM(dv.subtotal), 0) as total_acumulado,
        COUNT(DISTINCT v.id_venta) as total_ventas,
        COUNT(dv.id_detalle) as total_items
      FROM ventas v
      JOIN detalle_ventas dv ON dv.id_venta = v.id_venta
      WHERE v.mesa_numero = $1 
        AND v.id_sucursal = $2
        AND v.id_restaurante = $3
        AND v.estado IN ('recibido', 'en_preparacion', 'listo_para_servir', 'entregado', 'cancelado', 'abierta', 'en_uso', 'pendiente_cobro', 'completada', 'pendiente', 'pagado')
    `;
    
    const totalResultIncorrecta = await pool.query(totalQueryIncorrecta, [mesa.numero, mesa.id_sucursal, mesa.id_restaurante]);
    console.log(`❌ Total calculado con mesa_numero: $${totalResultIncorrecta.rows[0].total_acumulado}, Ventas: ${totalResultIncorrecta.rows[0].total_ventas}, Items: ${totalResultIncorrecta.rows[0].total_items}`);
    
    console.log('\n🏁 TEST COMPLETADO');
    console.log('✅ La corrección debería resolver el problema de productos no visibles');
    
  } catch (error) {
    console.error('❌ Error en test:', error);
  } finally {
    await pool.end();
  }
}

testPrefacturaCorregida();
