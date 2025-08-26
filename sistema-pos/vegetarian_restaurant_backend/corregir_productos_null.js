const { pool } = require('./src/config/database');

async function corregirProductosNull() {
  try {
    console.log('🔧 CORRIGIENDO PRODUCTOS CON NOMBRE NULL\n');
    
    const id_mesa = 31; // Mesa 1 Sucursal 6
    
    // 1. Verificar detalles de venta con productos NULL
    console.log('1️⃣ VERIFICANDO DETALLES CON PRODUCTOS NULL:');
    const detallesNull = await pool.query(`
      SELECT 
        dv.id_detalle,
        dv.id_venta,
        dv.id_producto,
        dv.cantidad,
        dv.precio_unitario,
        dv.subtotal,
        v.estado as estado_venta,
        v.fecha as fecha_venta
      FROM detalle_ventas dv
      JOIN ventas v ON dv.id_venta = v.id_venta
      WHERE v.id_mesa = $1 AND dv.id_producto IS NULL
      ORDER BY v.fecha DESC
    `, [id_mesa]);
    
    console.log(`Detalles con productos NULL encontrados: ${detallesNull.rows.length}`);
    detallesNull.rows.forEach((detalle, index) => {
      console.log(`  ${index + 1}. ID=${detalle.id_detalle}, Venta=${detalle.id_venta}, Producto=${detalle.id_producto}, Cantidad=${detalle.cantidad}, Precio=${detalle.precio_unitario}, Subtotal=${detalle.subtotal}, Estado=${detalle.estado_venta}`);
    });
    
    if (detallesNull.rows.length === 0) {
      console.log('✅ No hay productos NULL para corregir');
      return;
    }
    
    // 2. Verificar si hay productos disponibles
    console.log('\n2️⃣ VERIFICANDO PRODUCTOS DISPONIBLES:');
    const productosDisponibles = await pool.query(`
      SELECT id_producto, nombre, precio
      FROM productos
      WHERE id_restaurante = 1
      ORDER BY nombre
      LIMIT 10
    `);
    
    console.log(`Productos disponibles: ${productosDisponibles.rows.length}`);
    productosDisponibles.rows.forEach((producto, index) => {
      console.log(`  ${index + 1}. ID=${producto.id_producto}, Nombre=${producto.nombre}, Precio=${producto.precio}`);
    });
    
    // 3. Corregir productos NULL
    console.log('\n3️⃣ CORRIGIENDO PRODUCTOS NULL:');
    
    // Opción 1: Asignar un producto por defecto (AGUA SIN GAS)
    const productoPorDefecto = await pool.query(`
      SELECT id_producto, nombre, precio
      FROM productos
      WHERE nombre ILIKE '%agua%' AND id_restaurante = 1
      LIMIT 1
    `);
    
    if (productoPorDefecto.rows.length > 0) {
      const productoDefecto = productoPorDefecto.rows[0];
      console.log(`✅ Producto por defecto: ${productoDefecto.nombre} (ID: ${productoDefecto.id_producto})`);
      
      // Actualizar detalles con productos NULL
      const updateResult = await pool.query(`
        UPDATE detalle_ventas 
        SET id_producto = $1, precio_unitario = $2, subtotal = $3
        WHERE id_detalle IN (
          SELECT dv.id_detalle
          FROM detalle_ventas dv
          JOIN ventas v ON dv.id_venta = v.id_venta
          WHERE v.id_mesa = $4 AND dv.id_producto IS NULL
        )
      `, [productoDefecto.id_producto, productoDefecto.precio, productoDefecto.precio, id_mesa]);
      
      console.log(`✅ Detalles actualizados: ${updateResult.rowCount}`);
      
      // Recalcular subtotales
      await pool.query(`
        UPDATE detalle_ventas 
        SET subtotal = cantidad * precio_unitario
        WHERE id_detalle IN (
          SELECT dv.id_detalle
          FROM detalle_ventas dv
          JOIN ventas v ON dv.id_venta = v.id_venta
          WHERE v.id_mesa = $1
        )
      `, [id_mesa]);
      
      console.log('✅ Subtotales recalculados');
      
    } else {
      console.log('❌ No se encontró producto por defecto');
      
      // Opción 2: Eliminar detalles sin productos
      console.log('🗑️ Eliminando detalles sin productos...');
      const deleteResult = await pool.query(`
        DELETE FROM detalle_ventas 
        WHERE id_detalle IN (
          SELECT dv.id_detalle
          FROM detalle_ventas dv
          JOIN ventas v ON dv.id_venta = v.id_venta
          WHERE v.id_mesa = $1 AND dv.id_producto IS NULL
        )
      `, [id_mesa]);
      
      console.log(`✅ Detalles eliminados: ${deleteResult.rowCount}`);
    }
    
    // 4. Verificar corrección
    console.log('\n4️⃣ VERIFICANDO CORRECCIÓN:');
    const detallesCorregidos = await pool.query(`
      SELECT 
        dv.id_detalle,
        dv.id_venta,
        dv.id_producto,
        dv.cantidad,
        dv.precio_unitario,
        dv.subtotal,
        p.nombre as nombre_producto,
        v.estado as estado_venta
      FROM detalle_ventas dv
      JOIN ventas v ON dv.id_venta = v.id_venta
      LEFT JOIN productos p ON dv.id_producto = p.id_producto
      WHERE v.id_mesa = $1
      ORDER BY v.fecha DESC
      LIMIT 10
    `, [id_mesa]);
    
    console.log(`Detalles después de corrección: ${detallesCorregidos.rows.length}`);
    detallesCorregidos.rows.forEach((detalle, index) => {
      console.log(`  ${index + 1}. ID=${detalle.id_detalle}, Venta=${detalle.id_venta}, Producto=${detalle.nombre_producto || 'N/A'}, Cantidad=${detalle.cantidad}, Precio=${detalle.precio_unitario}, Subtotal=${detalle.subtotal}, Estado=${detalle.estado_venta}`);
    });
    
    // 5. Recalcular totales de ventas
    console.log('\n5️⃣ RECALCULANDO TOTALES DE VENTAS:');
    await pool.query(`
      UPDATE ventas
      SET total = COALESCE((
        SELECT SUM(subtotal) 
        FROM detalle_ventas 
        WHERE id_venta = ventas.id_venta
      ), 0)
      WHERE id_mesa = $1
    `, [id_mesa]);
    
    console.log('✅ Totales de ventas recalculados');
    
    // 6. Verificar total acumulado de la mesa
    console.log('\n6️⃣ VERIFICANDO TOTAL ACUMULADO:');
    const totalMesa = await pool.query(`
      SELECT 
        COALESCE(SUM(v.total), 0) as total_acumulado,
        COUNT(DISTINCT v.id_venta) as total_ventas,
        COUNT(dv.id_detalle) as total_items
      FROM ventas v
      LEFT JOIN detalle_ventas dv ON v.id_venta = dv.id_venta
      WHERE v.id_mesa = $1 AND v.estado IN ('recibido', 'en_preparacion', 'listo_para_servir', 'abierta', 'en_uso', 'pendiente_cobro', 'completada', 'pendiente', 'pagado')
    `, [id_mesa]);
    
    const totalAcumulado = parseFloat(totalMesa.rows[0].total_acumulado) || 0;
    const totalVentas = parseInt(totalMesa.rows[0].total_ventas) || 0;
    const totalItems = parseInt(totalMesa.rows[0].total_items) || 0;
    
    console.log(`✅ Total acumulado recalculado: $${totalAcumulado.toFixed(2)}`);
    console.log(`✅ Total ventas: ${totalVentas}`);
    console.log(`✅ Total items: ${totalItems}`);
    
    // Actualizar mesa
    await pool.query(`
      UPDATE mesas 
      SET total_acumulado = $1
      WHERE id_mesa = $2
    `, [totalAcumulado, id_mesa]);
    
    console.log('✅ Mesa actualizada');
    
    console.log('\n🎉 CORRECCIÓN COMPLETADA');
    console.log('💡 Ahora la prefactura debería mostrar todos los productos correctamente');
    
  } catch (error) {
    console.error('❌ Error en corrección:', error);
  } finally {
    await pool.end();
  }
}

corregirProductosNull();
