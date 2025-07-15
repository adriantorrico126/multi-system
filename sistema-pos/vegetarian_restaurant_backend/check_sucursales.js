const db = require('./src/config/database');

async function checkSucursales() {
  try {
    console.log('🔍 Verificando sucursales en la base de datos...');
    
    // Verificar todas las sucursales
    const result = await db.query('SELECT * FROM sucursales ORDER BY id_sucursal');
    
    console.log('\n📊 Sucursales encontradas:');
    console.log('Total de sucursales:', result.rows.length);
    
    if (result.rows.length === 0) {
      console.log('❌ No hay sucursales registradas en la base de datos.');
    } else {
      console.log('\n📋 Lista de sucursales:');
      result.rows.forEach((row, index) => {
        console.log(`${index + 1}. ID: ${row.id_sucursal}, Nombre: "${row.nombre}", Ciudad: ${row.ciudad}, Restaurante: ${row.id_restaurante}, Activo: ${row.activo}`);
      });
    }
    
    // Verificar usuarios por sucursal
    console.log('\n👥 Usuarios por sucursal:');
    const usersResult = await db.query(`
      SELECT v.id_vendedor, v.nombre, v.username, v.rol, v.id_sucursal, s.nombre as sucursal_nombre
      FROM vendedores v
      LEFT JOIN sucursales s ON v.id_sucursal = s.id_sucursal
      WHERE v.activo = true
      ORDER BY v.id_sucursal, v.nombre
    `);
    
    usersResult.rows.forEach(user => {
      console.log(`- ${user.nombre} (${user.username}) - Rol: ${user.rol} - Sucursal: ${user.sucursal_nombre} (ID: ${user.id_sucursal})`);
    });
    
  } catch (error) {
    console.error('❌ Error verificando sucursales:', error);
  } finally {
    await db.pool.end();
  }
}

checkSucursales(); 