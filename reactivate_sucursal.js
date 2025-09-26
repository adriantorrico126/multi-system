const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  password: '6951230Anacleta',
  host: 'localhost',
  port: 5432,
  database: 'sistempos'
});

async function reactivateSucursal() {
  try {
    console.log('🔧 Reactivando sucursal del usuario testuser...\n');

    // Verificar la sucursal del usuario testuser
    const userQuery = `
      SELECT id_vendedor, nombre, username, id_sucursal, id_restaurante
      FROM vendedores 
      WHERE username = 'testuser'
    `;
    const userResult = await pool.query(userQuery);
    
    if (userResult.rows.length === 0) {
      console.log('❌ Usuario testuser no encontrado');
      return;
    }

    const user = userResult.rows[0];
    console.log(`📋 Usuario encontrado: ${user.nombre} (${user.username})`);
    console.log(`📍 Sucursal ID: ${user.id_sucursal}`);
    console.log('');

    // Verificar estado de la sucursal
    const sucursalQuery = `
      SELECT id_sucursal, nombre, ciudad, direccion, activo
      FROM sucursales 
      WHERE id_sucursal = $1
    `;
    const sucursalResult = await pool.query(sucursalQuery, [user.id_sucursal]);
    
    if (sucursalResult.rows.length === 0) {
      console.log('❌ Sucursal no encontrada');
      return;
    }

    const sucursal = sucursalResult.rows[0];
    console.log(`📋 Sucursal: ${sucursal.nombre}`);
    console.log(`📍 Ciudad: ${sucursal.ciudad}`);
    console.log(`📍 Dirección: ${sucursal.direccion}`);
    console.log(`🔘 Estado actual: ${sucursal.activo ? 'Activa' : 'Inactiva'}`);
    console.log('');

    if (!sucursal.activo) {
      // Reactivar la sucursal
      const activateQuery = `
        UPDATE sucursales 
        SET activo = true 
        WHERE id_sucursal = $1
      `;
      await pool.query(activateQuery, [user.id_sucursal]);
      console.log('✅ Sucursal reactivada exitosamente');
    } else {
      console.log('✅ La sucursal ya está activa');
    }

    // Verificar todas las sucursales del restaurante 7
    const allSucursalesQuery = `
      SELECT id_sucursal, nombre, ciudad, activo
      FROM sucursales 
      WHERE id_restaurante = 7
      ORDER BY created_at DESC
    `;
    const allSucursalesResult = await pool.query(allSucursalesQuery);
    
    console.log('');
    console.log('📋 Estado de todas las sucursales del restaurante 7:');
    allSucursalesResult.rows.forEach(suc => {
      console.log(`- ${suc.nombre} (ID: ${suc.id_sucursal}): ${suc.activo ? 'Activa' : 'Inactiva'}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

reactivateSucursal();
