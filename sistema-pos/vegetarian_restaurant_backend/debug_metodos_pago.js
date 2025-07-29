const { pool } = require('./src/config/database');

async function debugMetodosPago() {
  try {
    console.log('🔍 Debuggeando problema con métodos de pago...');
    
    // 1. Verificar métodos de pago disponibles
    console.log('\n1. Métodos de pago en la base de datos:');
    const metodosPago = await pool.query(`
      SELECT id_pago, descripcion, activo, id_restaurante 
      FROM metodos_pago 
      ORDER BY id_pago
    `);
    console.log('Métodos de pago:', metodosPago.rows);
    
    // 2. Verificar algunas ventas y sus métodos de pago
    console.log('\n2. Ventas recientes con sus métodos de pago:');
    const ventasConPago = await pool.query(`
      SELECT 
        v.id_venta,
        v.id_pago,
        v.total,
        v.fecha,
        mp.descripcion as metodo_pago,
        mp.id_pago as mp_id
      FROM ventas v
      LEFT JOIN metodos_pago mp ON v.id_pago = mp.id_pago
      WHERE v.id_restaurante = 1
      ORDER BY v.fecha DESC
      LIMIT 10
    `);
    console.log('Ventas con métodos de pago:', ventasConPago.rows);
    
    // 3. Verificar ventas sin método de pago
    console.log('\n3. Ventas sin método de pago:');
    const ventasSinPago = await pool.query(`
      SELECT 
        v.id_venta,
        v.id_pago,
        v.total,
        v.fecha
      FROM ventas v
      WHERE v.id_pago IS NULL OR v.id_pago = 0
      ORDER BY v.fecha DESC
      LIMIT 5
    `);
    console.log('Ventas sin método de pago:', ventasSinPago.rows);
    
    // 4. Verificar si hay ventas con id_pago pero sin método correspondiente
    console.log('\n4. Ventas con id_pago pero sin método correspondiente:');
    const ventasSinMetodo = await pool.query(`
      SELECT 
        v.id_venta,
        v.id_pago,
        v.total,
        v.fecha
      FROM ventas v
      LEFT JOIN metodos_pago mp ON v.id_pago = mp.id_pago
      WHERE v.id_pago IS NOT NULL AND v.id_pago != 0 AND mp.id_pago IS NULL
      ORDER BY v.fecha DESC
      LIMIT 5
    `);
    console.log('Ventas con id_pago pero sin método:', ventasSinMetodo.rows);
    
    // 5. Probar la consulta completa de exportación
    console.log('\n5. Probando consulta completa de exportación:');
    const consultaCompleta = await pool.query(`
      SELECT 
        v.id_venta as id,
        v.fecha as timestamp,
        u.nombre as cashier,
        s.nombre as branch,
        v.total,
        COALESCE(mp.descripcion, 'No especificado') as paymentMethod,
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
      LIMIT 5
    `);
    console.log('Resultado de consulta completa:', consultaCompleta.rows);
    
  } catch (error) {
    console.error('❌ Error durante el debug:', error);
  } finally {
    await pool.end();
  }
}

debugMetodosPago(); 