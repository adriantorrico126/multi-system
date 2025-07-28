const { pool } = require('./src/config/database');

async function debugMesa32() {
  try {
    console.log('🔍 Diagnosticando Mesa 32 específicamente...');
    
    // Verificar estado actual de la mesa 32
    const mesa32Query = `
      SELECT * FROM mesas WHERE id_mesa = 32
    `;
    
    const mesa32Result = await pool.query(mesa32Query);
    console.log('📋 Estado actual de Mesa 32:');
    console.log(mesa32Result.rows[0]);
    
    // Verificar ventas de la mesa 32
    const ventasMesa32Query = `
      SELECT id_venta, fecha, total, estado
      FROM ventas 
      WHERE id_mesa = 32 
      ORDER BY fecha DESC
      LIMIT 10
    `;
    
    const ventasMesa32Result = await pool.query(ventasMesa32Query);
    console.log('\n💰 Ventas de Mesa 32:');
    ventasMesa32Result.rows.forEach(venta => {
      console.log(`  - Venta ${venta.id_venta}: $${venta.total}, Estado: ${venta.estado}, Fecha: ${venta.fecha}`);
    });
    
    // Verificar prefactura de la mesa 32
    const prefacturaMesa32Query = `
      SELECT p.*, 
             COUNT(v.id_venta) as total_ventas,
             SUM(v.total) as total_ventas_sum
      FROM prefacturas p
      LEFT JOIN ventas v ON p.id_mesa = v.id_mesa 
        AND v.estado IN ('recibido', 'en_preparacion', 'completada', 'pendiente')
        AND v.fecha >= p.fecha_apertura
      WHERE p.id_mesa = 32
      GROUP BY p.id_prefactura, p.fecha_apertura, p.total_acumulado, p.estado
    `;
    
    const prefacturaMesa32Result = await pool.query(prefacturaMesa32Query);
    console.log('\n📄 Prefactura de Mesa 32:');
    if (prefacturaMesa32Result.rows.length > 0) {
      prefacturaMesa32Result.rows.forEach(prefactura => {
        console.log(`  - Prefactura ${prefactura.id_prefactura}: $${prefactura.total_acumulado}, Estado: ${prefactura.estado}`);
        console.log(`    Ventas incluidas: ${prefactura.total_ventas}, Total ventas: $${prefactura.total_ventas_sum}`);
      });
    } else {
      console.log('  ❌ No hay prefactura para Mesa 32');
    }
    
    // Verificar ventas que deberían estar en la prefactura
    const ventasPrefacturaQuery = `
      SELECT v.id_venta, v.fecha, v.total, v.estado,
             p.fecha_apertura
      FROM ventas v
      LEFT JOIN prefacturas p ON v.id_mesa = p.id_mesa AND p.estado = 'abierta'
      WHERE v.id_mesa = 32 
        AND v.estado IN ('recibido', 'en_preparacion', 'completada', 'pendiente')
      ORDER BY v.fecha DESC
    `;
    
    const ventasPrefacturaResult = await pool.query(ventasPrefacturaQuery);
    console.log('\n🔍 Ventas que deberían estar en prefactura:');
    ventasPrefacturaResult.rows.forEach(venta => {
      const enPrefactura = venta.fecha_apertura ? 
        (new Date(venta.fecha) >= new Date(venta.fecha_apertura)) : false;
      console.log(`  - Venta ${venta.id_venta}: $${venta.total}, Estado: ${venta.estado}, En prefactura: ${enPrefactura}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

debugMesa32(); 