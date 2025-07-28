const { pool } = require('./src/config/database');

async function debugUserSucursal() {
  try {
    console.log('🔍 Verificando sucursal del usuario actual...');
    
    // Verificar usuarios y sus sucursales
    const usuariosQuery = `
      SELECT u.id_usuario, u.nombre, u.email, u.id_sucursal, s.nombre as nombre_sucursal
      FROM usuarios u
      JOIN sucursales s ON u.id_sucursal = s.id_sucursal
      WHERE s.id_restaurante = 1
      ORDER BY u.id_usuario
    `;
    
    const usuariosResult = await pool.query(usuariosQuery);
    console.log('👥 Usuarios y sus sucursales:');
    usuariosResult.rows.forEach(usuario => {
      console.log(`  - Usuario ${usuario.id_usuario}: ${usuario.nombre} (${usuario.email}) → Sucursal ${usuario.id_sucursal} (${usuario.nombre_sucursal})`);
    });
    
    // Verificar qué usuario está más activo (más ventas recientes)
    console.log('\n📊 Usuario más activo (más ventas recientes):');
    const usuarioActivoQuery = `
      SELECT u.id_usuario, u.nombre, u.id_sucursal, s.nombre as nombre_sucursal,
             COUNT(v.id_venta) as total_ventas
      FROM usuarios u
      JOIN sucursales s ON u.id_sucursal = s.id_sucursal
      LEFT JOIN ventas v ON u.id_usuario = v.id_usuario
      WHERE s.id_restaurante = 1
      GROUP BY u.id_usuario, u.nombre, u.id_sucursal, s.nombre
      ORDER BY total_ventas DESC
      LIMIT 3
    `;
    
    const usuarioActivoResult = await pool.query(usuarioActivoQuery);
    usuarioActivoResult.rows.forEach((usuario, index) => {
      console.log(`  ${index + 1}. Usuario ${usuario.id_usuario}: ${usuario.nombre} → Sucursal ${usuario.id_sucursal} (${usuario.nombre_sucursal}) - ${usuario.total_ventas} ventas`);
    });
    
    // Verificar ventas recientes por usuario
    console.log('\n🕒 Ventas recientes por usuario:');
    const ventasRecientesQuery = `
      SELECT v.id_venta, v.fecha, v.total, v.id_usuario, u.nombre as nombre_usuario, 
             v.id_sucursal, s.nombre as nombre_sucursal, v.id_mesa, m.numero as numero_mesa
      FROM ventas v
      JOIN usuarios u ON v.id_usuario = u.id_usuario
      JOIN sucursales s ON v.id_sucursal = s.id_sucursal
      JOIN mesas m ON v.id_mesa = m.id_mesa
      WHERE v.id_restaurante = 1
      ORDER BY v.fecha DESC
      LIMIT 10
    `;
    
    const ventasRecientesResult = await pool.query(ventasRecientesQuery);
    console.log('  Ventas más recientes:');
    ventasRecientesResult.rows.forEach(venta => {
      console.log(`    - Venta ${venta.id_venta}: $${venta.total} por ${venta.nombre_usuario} en Sucursal ${venta.id_sucursal} (${venta.nombre_sucursal}), Mesa ${venta.numero_mesa} (ID=${venta.id_mesa})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

debugUserSucursal(); 