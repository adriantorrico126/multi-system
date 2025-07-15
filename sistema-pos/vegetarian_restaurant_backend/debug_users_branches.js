const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'menta_restobar_db',
  user: 'postgres',
  password: '69512310Anacleta'
});

async function debugUsersBranches() {
  try {
    console.log('=== DEBUGGING USERS AND BRANCHES ===');
    
    // 1. Verificar todos los usuarios y sus sucursales
    const queryUsers = `
      SELECT 
        v.id_vendedor,
        v.nombre,
        v.username,
        v.rol,
        v.activo,
        v.id_sucursal,
        s.nombre as sucursal_nombre,
        s.ciudad as sucursal_ciudad
      FROM vendedores v
      LEFT JOIN sucursales s ON v.id_sucursal = s.id_sucursal
      ORDER BY v.id_vendedor;
    `;
    
    const { rows: users } = await pool.query(queryUsers);
    console.log('\n1. USUARIOS Y SUS SUCURSALES:');
    console.table(users);
    
    // 2. Verificar ventas por sucursal para el 6/7/2025
    const queryVentasPorSucursal = `
      SELECT 
        id_sucursal,
        COUNT(*) as total_ventas,
        SUM(total) as total_ingresos
      FROM ventas 
      WHERE DATE(fecha) = '2025-07-06'
      GROUP BY id_sucursal
      ORDER BY id_sucursal;
    `;
    
    const { rows: ventasPorSucursal } = await pool.query(queryVentasPorSucursal);
    console.log('\n2. VENTAS POR SUCURSAL (6/7/2025):');
    console.table(ventasPorSucursal);
    
    // 3. Verificar qué usuarios están activos y en qué sucursales
    const queryUsuariosActivos = `
      SELECT 
        v.id_vendedor,
        v.nombre,
        v.username,
        v.rol,
        v.id_sucursal,
        s.nombre as sucursal_nombre
      FROM vendedores v
      LEFT JOIN sucursales s ON v.id_sucursal = s.id_sucursal
      WHERE v.activo = true
      ORDER BY v.id_sucursal, v.nombre;
    `;
    
    const { rows: usuariosActivos } = await pool.query(queryUsuariosActivos);
    console.log('\n3. USUARIOS ACTIVOS POR SUCURSAL:');
    console.table(usuariosActivos);
    
    console.log('\n✅ Debug completado');
    
  } catch (error) {
    console.error('❌ Error en debug:', error);
  } finally {
    await pool.end();
  }
}

debugUsersBranches(); 