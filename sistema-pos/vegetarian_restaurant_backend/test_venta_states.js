const { pool } = require('./src/config/database');

async function testVentaStates() {
  try {
    console.log('🔍 Verificando estados de ventas...');
    
    // Verificar qué estados tienen las ventas recientes
    const ventasQuery = `
      SELECT 
        v.id_venta,
        v.mesa_numero,
        v.estado,
        v.total,
        v.fecha,
        COUNT(dv.id_detalle) as items_count
      FROM ventas v
      LEFT JOIN detalle_ventas dv ON v.id_venta = dv.id_venta
      WHERE v.id_restaurante = 1
      GROUP BY v.id_venta, v.mesa_numero, v.estado, v.total, v.fecha
      ORDER BY v.fecha DESC
      LIMIT 10
    `;
    
    const ventasResult = await pool.query(ventasQuery);
    console.log('📊 Ventas recientes:');
    ventasResult.rows.forEach((venta, index) => {
      console.log(`  ${index + 1}. Venta ${venta.id_venta}: Mesa ${venta.mesa_numero}, Estado: ${venta.estado}, Total: $${venta.total}, Items: ${venta.items_count}, Fecha: ${venta.fecha}`);
    });
    
    // Verificar estados únicos
    const estadosQuery = `
      SELECT DISTINCT estado, COUNT(*) as cantidad
      FROM ventas 
      WHERE id_restaurante = 1
      GROUP BY estado
      ORDER BY cantidad DESC
    `;
    
    const estadosResult = await pool.query(estadosQuery);
    console.log('\n📈 Estados de ventas:');
    estadosResult.rows.forEach(estado => {
      console.log(`  - ${estado.estado}: ${estado.cantidad} ventas`);
    });
    
    // Verificar prefactura de una mesa específica
    const mesaId = 32; // Mesa que mencionaste
    console.log(`\n🔍 Verificando prefactura para mesa ${mesaId}...`);
    
    const prefacturaQuery = `
      SELECT 
        v.id_venta,
        v.mesa_numero,
        v.estado,
        v.total,
        v.fecha,
        p.nombre as producto,
        dv.cantidad,
        dv.subtotal
      FROM ventas v
      JOIN detalle_ventas dv ON v.id_venta = dv.id_venta
      JOIN productos p ON dv.id_producto = p.id_producto
      WHERE v.id_mesa = $1 
        AND v.id_restaurante = 1
        AND v.estado IN ('abierta', 'en_uso', 'pendiente_cobro', 'entregado', 'completada', 'pendiente', 'recibido')
      ORDER BY v.fecha DESC
    `;
    
    const prefacturaResult = await pool.query(prefacturaQuery, [mesaId]);
    console.log(`📋 Productos en prefactura para mesa ${mesaId}:`);
    prefacturaResult.rows.forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.producto} x${item.cantidad} = $${item.subtotal} (Estado: ${item.estado})`);
    });
    
    console.log(`\n✅ Total productos en prefactura: ${prefacturaResult.rows.length}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

testVentaStates(); 