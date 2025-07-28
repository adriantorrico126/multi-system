const { pool } = require('./src/config/database');

async function debugSucursalMesa() {
  try {
    console.log('🔍 Diagnosticando problema de sucursal y mesa...');
    
    // Verificar todas las sucursales
    const sucursalesQuery = `
      SELECT id_sucursal, nombre, id_restaurante 
      FROM sucursales 
      WHERE id_restaurante = 1
      ORDER BY id_sucursal
    `;
    
    const sucursalesResult = await pool.query(sucursalesQuery);
    console.log('📋 Sucursales disponibles:');
    sucursalesResult.rows.forEach(sucursal => {
      console.log(`  - Sucursal ${sucursal.id_sucursal}: ${sucursal.nombre}`);
    });
    
    // Verificar mesas por sucursal
    console.log('\n📊 Mesas por sucursal:');
    for (const sucursal of sucursalesResult.rows) {
      const mesasQuery = `
        SELECT id_mesa, numero, estado, total_acumulado 
        FROM mesas 
        WHERE id_sucursal = $1 AND id_restaurante = 1
        ORDER BY numero
      `;
      
      const mesasResult = await pool.query(mesasQuery, [sucursal.id_sucursal]);
      console.log(`\n  Sucursal ${sucursal.id_sucursal} (${sucursal.nombre}):`);
      mesasResult.rows.forEach(mesa => {
        console.log(`    - Mesa ${mesa.numero}: ID=${mesa.id_mesa}, Estado=${mesa.estado}, Total=$${mesa.total_acumulado || 0}`);
      });
    }
    
    // Verificar ventas por sucursal
    console.log('\n💰 Ventas por sucursal:');
    for (const sucursal of sucursalesResult.rows) {
      const ventasQuery = `
        SELECT COUNT(*) as total_ventas, SUM(total) as total_ventas_sum
        FROM ventas 
        WHERE id_sucursal = $1 AND id_restaurante = 1
      `;
      
      const ventasResult = await pool.query(ventasQuery, [sucursal.id_sucursal]);
      console.log(`  Sucursal ${sucursal.id_sucursal}: ${ventasResult.rows[0].total_ventas} ventas, Total: $${ventasResult.rows[0].total_ventas_sum || 0}`);
    }
    
    // Verificar específicamente la mesa 32 y sus ventas
    console.log('\n🎯 Análisis específico de Mesa 32:');
    const mesa32Query = `
      SELECT m.*, s.nombre as nombre_sucursal
      FROM mesas m
      JOIN sucursales s ON m.id_sucursal = s.id_sucursal
      WHERE m.id_mesa = 32
    `;
    
    const mesa32Result = await pool.query(mesa32Query);
    if (mesa32Result.rows.length > 0) {
      const mesa = mesa32Result.rows[0];
      console.log(`  Mesa 32: Numero=${mesa.numero}, Sucursal=${mesa.id_sucursal} (${mesa.nombre_sucursal}), Estado=${mesa.estado}`);
      
      // Verificar ventas de esta mesa
      const ventasMesa32Query = `
        SELECT COUNT(*) as total_ventas, SUM(total) as total_ventas_sum
        FROM ventas 
        WHERE id_mesa = 32 AND id_restaurante = 1
      `;
      
      const ventasMesa32Result = await pool.query(ventasMesa32Query);
      console.log(`  Ventas de Mesa 32: ${ventasMesa32Result.rows[0].total_ventas} ventas, Total: $${ventasMesa32Result.rows[0].total_ventas_sum || 0}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

debugSucursalMesa(); 