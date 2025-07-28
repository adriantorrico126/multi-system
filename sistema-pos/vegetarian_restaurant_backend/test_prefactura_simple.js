const { Pool } = require('pg');

// Usar las credenciales correctas
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'sistempos',
  user: 'postgres',
  password: '69512310Anacleta'
});

async function testPrefacturaSimple() {
  try {
    console.log('🔍 Testing prefactura simple...');
    
    // Test the exact query that's failing in the backend
    console.log('\n🧪 Testing the exact query from mesaController:');
    const testQuery = `
      SELECT 
        v.id_venta,
        v.mesa_numero,
        v.id_sucursal,
        v.estado,
        v.total,
        v.fecha,
        COUNT(dv.id_detalle) as items_count
      FROM ventas v
      LEFT JOIN detalle_ventas dv ON v.id_venta = dv.id_venta
      WHERE v.mesa_numero = 1 
        AND v.id_sucursal = 4
        AND v.id_restaurante = 1
      GROUP BY v.id_venta, v.mesa_numero, v.id_sucursal, v.estado, v.total, v.fecha
      ORDER BY v.fecha DESC
    `;
    
    const testResult = await pool.query(testQuery);
    console.log(`✅ Query executed successfully! Found ${testResult.rows.length} records`);
    
    if (testResult.rows.length > 0) {
      console.log('Sample result:', testResult.rows[0]);
    }

    // Test the total query
    console.log('\n🧪 Testing total query:');
    const totalQuery = `
      SELECT 
        COALESCE(SUM(dv.subtotal), 0) as total_acumulado,
        COUNT(DISTINCT v.id_venta) as total_ventas,
        COUNT(dv.id_detalle) as total_items
      FROM ventas v
      JOIN detalle_ventas dv ON dv.id_venta = v.id_venta
      WHERE v.mesa_numero = 1 
        AND v.id_sucursal = 4
        AND v.id_restaurante = 1
        AND v.estado IN ('abierta', 'en_uso', 'pendiente_cobro', 'entregado', 'pagado')
    `;
    
    const totalResult = await pool.query(totalQuery);
    console.log(`✅ Total query executed successfully!`);
    console.log('Total acumulado:', totalResult.rows[0].total_acumulado);
    console.log('Total ventas:', totalResult.rows[0].total_ventas);
    console.log('Total items:', totalResult.rows[0].total_items);

    // Test the historial query
    console.log('\n🧪 Testing historial query:');
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
      WHERE v.mesa_numero = 1
        AND v.id_sucursal = 4
        AND v.id_restaurante = 1
        AND v.estado IN ('abierta', 'en_uso', 'pendiente_cobro', 'entregado', 'pagado')
      ORDER BY v.fecha DESC
      LIMIT 5;
    `;
    
    const historialResult = await pool.query(historialQuery);
    console.log(`✅ Historial query executed successfully! Found ${historialResult.rows.length} records`);
    
    if (historialResult.rows.length > 0) {
      console.log('Sample historial result:', historialResult.rows[0]);
    }

  } catch (error) {
    console.error('❌ Error testing prefactura:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
  } finally {
    await pool.end();
  }
}

testPrefacturaSimple(); 