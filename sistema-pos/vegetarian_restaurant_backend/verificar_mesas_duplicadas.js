const { pool } = require('./src/config/database');

async function verificarMesasDuplicadas() {
  try {
    console.log('🔍 VERIFICANDO MESAS DUPLICADAS POR NÚMERO\n');
    
    // 1. Verificar mesas con número 1 en todas las sucursales
    console.log('1️⃣ MESAS CON NÚMERO 1 EN TODAS LAS SUCURSALES:');
    const mesasNumero1 = await pool.query(`
      SELECT 
        m.id_mesa,
        m.numero,
        m.id_sucursal,
        m.id_restaurante,
        m.estado,
        m.total_acumulado,
        m.hora_apertura,
        COUNT(v.id_venta) as ventas_count,
        COALESCE(SUM(v.total), 0) as total_ventas
      FROM mesas m
      LEFT JOIN ventas v ON m.id_mesa = v.id_mesa
      WHERE m.numero = 1
      GROUP BY m.id_mesa, m.numero, m.id_sucursal, m.id_restaurante, m.estado, m.total_acumulado, m.hora_apertura
      ORDER BY m.id_sucursal, m.id_mesa
    `);
    
    console.log(`Mesas con número 1 encontradas: ${mesasNumero1.rows.length}`);
    mesasNumero1.rows.forEach((mesa, index) => {
      console.log(`  ${index + 1}. ID=${mesa.id_mesa}, Número=${mesa.numero}, Sucursal=${mesa.id_sucursal}, Restaurante=${mesa.id_restaurante}, Estado=${mesa.estado}, Total Acumulado=${mesa.total_acumulado}, Ventas=${mesa.ventas_count}, Total Ventas=${mesa.total_ventas}`);
    });
    
    // 2. Verificar ventas para cada mesa con número 1
    console.log('\n2️⃣ VENTAS PARA CADA MESA CON NÚMERO 1:');
    for (const mesa of mesasNumero1.rows) {
      console.log(`\n📋 Mesa ${mesa.numero} (ID: ${mesa.id_mesa}) - Sucursal ${mesa.id_sucursal}:`);
      
      const ventasMesa = await pool.query(`
        SELECT 
          v.id_venta,
          v.estado,
          v.total,
          v.fecha,
          COUNT(dv.id_detalle) as items_count,
          STRING_AGG(p.nombre, ', ') as productos
        FROM ventas v
        LEFT JOIN detalle_ventas dv ON v.id_venta = dv.id_venta
        LEFT JOIN productos p ON dv.id_producto = p.id_producto
        WHERE v.id_mesa = $1
        GROUP BY v.id_venta, v.estado, v.total, v.fecha
        ORDER BY v.fecha DESC
        LIMIT 5
      `, [mesa.id_mesa]);
      
      if (ventasMesa.rows.length > 0) {
        console.log(`  ✅ Ventas encontradas: ${ventasMesa.rows.length}`);
        ventasMesa.rows.forEach((venta, index) => {
          console.log(`    ${index + 1}. ID=${venta.id_venta}, Estado=${venta.estado}, Total=${venta.total}, Items=${venta.items_count}, Productos=${venta.productos || 'N/A'}, Fecha=${venta.fecha}`);
        });
      } else {
        console.log(`  ❌ No hay ventas para esta mesa`);
      }
    }
    
    // 3. Verificar si hay inconsistencias en la configuración
    console.log('\n3️⃣ VERIFICANDO INCONSISTENCIAS:');
    
    // Buscar mesas con el mismo número en la misma sucursal
    const mesasDuplicadas = await pool.query(`
      SELECT 
        numero,
        id_sucursal,
        id_restaurante,
        COUNT(*) as cantidad,
        ARRAY_AGG(id_mesa ORDER BY id_mesa) as ids_mesas
      FROM mesas
      GROUP BY numero, id_sucursal, id_restaurante
      HAVING COUNT(*) > 1
      ORDER BY numero, id_sucursal
    `);
    
    if (mesasDuplicadas.rows.length > 0) {
      console.log('⚠️ MESAS DUPLICADAS ENCONTRADAS:');
      mesasDuplicadas.rows.forEach((dup, index) => {
        console.log(`  ${index + 1}. Número=${dup.numero}, Sucursal=${dup.id_sucursal}, Restaurante=${dup.id_restaurante}, Cantidad=${dup.cantidad}, IDs: ${dup.ids_mesas.join(', ')}`);
      });
    } else {
      console.log('✅ No hay mesas duplicadas en la misma sucursal');
    }
    
    // 4. Recomendaciones
    console.log('\n4️⃣ RECOMENDACIONES:');
    
    if (mesasNumero1.rows.length > 1) {
      console.log('🔧 PROBLEMA DETECTADO:');
      console.log('  - Hay múltiples mesas con el número 1 en diferentes sucursales');
      console.log('  - Los productos están en una mesa (Sucursal 4)');
      console.log('  - Pero estás viendo otra mesa (Sucursal 6)');
      console.log('');
      console.log('💡 SOLUCIONES POSIBLES:');
      console.log('  1. Transferir los productos de la mesa Sucursal 4 a la mesa Sucursal 6');
      console.log('  2. Eliminar la mesa duplicada de Sucursal 6 y usar solo la de Sucursal 4');
      console.log('  3. Corregir la configuración para que solo haya una Mesa 1 por restaurante');
    }
    
    console.log('\n🏁 VERIFICACIÓN COMPLETADA');
    
  } catch (error) {
    console.error('❌ Error en verificación:', error);
  } finally {
    await pool.end();
  }
}

verificarMesasDuplicadas();
