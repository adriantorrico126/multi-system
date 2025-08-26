const { pool } = require('./src/config/database');

async function testPrefacturaFix() {
  try {
    console.log('🧪 TEST: VERIFICANDO PREFACTURA CON ESTADOS AMPLIOS\n');
    
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
      JOIN ventas v ON v.mesa_numero = m.numero
      WHERE v.id_restaurante = 1
      LIMIT 1
    `);
    
    if (mesaConVentas.rows.length === 0) {
      console.log('❌ No se encontraron mesas con ventas');
      return;
    }
    
    const mesa = mesaConVentas.rows[0];
    console.log(`✅ Mesa encontrada: ${mesa.numero} (ID: ${mesa.id_mesa}, Sucursal: ${mesa.id_sucursal})`);
    
    // 3. Probar la consulta del total con estados amplios
    console.log('\n3️⃣ PROBANDO CONSULTA DE TOTAL CON ESTADOS AMPLIOS:');
    const estadosValidos = [
      'recibido', 'en_preparacion', 'listo_para_servir', 'entregado', 'cancelado',
      'abierta', 'en_uso', 'pendiente_cobro', 'completada', 'pendiente', 'pagado'
    ];
    
    const totalQuery = `
      SELECT 
        COALESCE(SUM(dv.subtotal), 0) as total_acumulado,
        COUNT(DISTINCT v.id_venta) as total_ventas,
        COUNT(dv.id_detalle) as total_items
      FROM ventas v
      JOIN detalle_ventas dv ON dv.id_venta = v.id_venta
      WHERE v.mesa_numero = $1 
        AND v.id_sucursal = $2
        AND v.id_restaurante = $3
        AND v.estado = ANY($4)
    `;
    
    const totalResult = await pool.query(totalQuery, [mesa.numero, mesa.id_sucursal, mesa.id_restaurante, estadosValidos]);
    console.log(`✅ Total calculado: $${totalResult.rows[0].total_acumulado}`);
    console.log(`✅ Total ventas: ${totalResult.rows[0].total_ventas}`);
    console.log(`✅ Total items: ${totalResult.rows[0].total_items}`);
    
    // 4. Probar la consulta del historial con estados amplios
    console.log('\n4️⃣ PROBANDO CONSULTA DE HISTORIAL CON ESTADOS AMPLIOS:');
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
      LEFT JOIN detalle_ventas dv ON v.id_venta = dv.id_venta
      LEFT JOIN productos p ON dv.id_producto = p.id_producto
      LEFT JOIN vendedores vend ON v.id_vendedor = vend.id_vendedor
      WHERE v.mesa_numero = $1
        AND v.id_sucursal = $2
        AND v.id_restaurante = $3
        AND v.estado = ANY($4)
      ORDER BY v.fecha DESC
    `;
    
    const historialResult = await pool.query(historialQuery, [mesa.numero, mesa.id_sucursal, mesa.id_restaurante, estadosValidos]);
    console.log(`✅ Historial obtenido: ${historialResult.rows.length} registros`);
    
    if (historialResult.rows.length > 0) {
      console.log('\n📋 PRIMEROS 3 REGISTROS DEL HISTORIAL:');
      historialResult.rows.slice(0, 3).forEach((registro, index) => {
        console.log(`  ${index + 1}. Venta ${registro.id_venta} (${registro.estado}): ${registro.cantidad}x ${registro.nombre_producto} = $${registro.subtotal}`);
      });
      
      // Agrupar productos
      const productosAgrupados = {};
      historialResult.rows.forEach(item => {
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
      
      console.log('\n🍽️ PRODUCTOS AGRUPADOS:');
      Object.values(productosAgrupados).forEach((producto, index) => {
        console.log(`  ${index + 1}. ${producto.nombre_producto}: ${producto.cantidad_total}x = $${producto.subtotal_total.toFixed(2)}`);
      });
      
      const totalCalculado = Object.values(productosAgrupados).reduce((sum, item) => sum + parseFloat(item.subtotal_total), 0);
      console.log(`\n💰 Total calculado desde productos: $${totalCalculado.toFixed(2)}`);
      console.log(`💰 Total desde DB: $${totalResult.rows[0].total_acumulado}`);
      
    } else {
      console.log('❌ No se encontraron registros de historial');
    }
    
    // 5. Verificar qué estados específicos tienen las ventas de esta mesa
    console.log('\n5️⃣ ESTADOS ESPECÍFICOS DE LAS VENTAS DE ESTA MESA:');
    const estadosMesaQuery = `
      SELECT v.estado, COUNT(*) as cantidad
      FROM ventas v
      WHERE v.mesa_numero = $1 AND v.id_sucursal = $2 AND v.id_restaurante = $3
      GROUP BY v.estado
      ORDER BY cantidad DESC
    `;
    
    const estadosMesaResult = await pool.query(estadosMesaQuery, [mesa.numero, mesa.id_sucursal, mesa.id_restaurante]);
    estadosMesaResult.rows.forEach(row => {
      console.log(`  - ${row.estado || 'NULL'}: ${row.cantidad} ventas`);
    });
    
    console.log('\n🏁 TEST COMPLETADO - PREFACTURA DEBERÍA FUNCIONAR AHORA');
    
  } catch (error) {
    console.error('❌ Error en test:', error);
  } finally {
    await pool.end();
  }
}

testPrefacturaFix(); 