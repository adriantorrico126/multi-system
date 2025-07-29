const { pool } = require('./src/config/database');

async function debugExport() {
  try {
    console.log('🔍 Debuggeando problema con método de pago...');
    
    // 1. Verificar si hay ventas sin método de pago
    console.log('\n1. Verificando ventas sin método de pago:');
    const ventasSinPago = await pool.query(`
      SELECT id_venta, id_pago, total, fecha 
      FROM ventas 
      WHERE id_pago IS NULL OR id_pago = 0
      LIMIT 5
    `);
    console.log('Ventas sin método de pago:', ventasSinPago.rows);
    
    // 2. Verificar métodos de pago disponibles
    console.log('\n2. Métodos de pago disponibles:');
    const metodosPago = await pool.query(`
      SELECT id_pago, descripcion, activo 
      FROM metodos_pago 
      WHERE id_restaurante = 1
    `);
    console.log('Métodos de pago:', metodosPago.rows);
    
    // 3. Verificar algunas ventas con sus métodos de pago
    console.log('\n3. Verificando ventas con métodos de pago:');
    const ventasConPago = await pool.query(`
      SELECT 
        v.id_venta,
        v.id_pago,
        v.total,
        v.fecha,
        mp.descripcion as metodo_pago
      FROM ventas v
      LEFT JOIN metodos_pago mp ON v.id_pago = mp.id_pago
      WHERE v.id_restaurante = 1
      ORDER BY v.fecha DESC
      LIMIT 5
    `);
    console.log('Ventas con métodos de pago:', ventasConPago.rows);
    
    // 4. Probar la consulta completa de exportación
    console.log('\n4. Probando consulta completa de exportación:');
    const consultaCompleta = await pool.query(`
      SELECT 
        v.id_venta as id,
        v.fecha as timestamp,
        u.nombre as cashier,
        s.nombre as branch,
        v.total,
        mp.descripcion as paymentMethod,
        v.tipo_servicio,
        v.estado,
        v.mesa_numero,
        v.created_at
      FROM ventas v
      JOIN usuarios u ON v.id_vendedor = u.id_usuario
      JOIN sucursales s ON v.id_sucursal = s.id_sucursal
      LEFT JOIN metodos_pago mp ON v.id_pago = mp.id_pago
      WHERE v.id_restaurante = 1
      ORDER BY v.fecha DESC
      LIMIT 3
    `);
    console.log('Resultado de consulta completa:', consultaCompleta.rows);
    
  } catch (error) {
    console.error('❌ Error durante el debug:', error);
  } finally {
    await pool.end();
  }
}

debugExport(); 