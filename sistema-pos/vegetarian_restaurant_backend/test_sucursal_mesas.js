const { pool } = require('./src/config/database');

async function testSucursalMesas() {
  try {
    console.log('🔍 Verificando sucursal de las mesas...');
    
    // Verificar todas las mesas y su sucursal
    const todasLasMesas = await pool.query(`
      SELECT 
        m.id_mesa,
        m.numero,
        m.id_sucursal,
        m.estado,
        m.id_grupo_mesa,
        g.estado as estado_grupo,
        v.nombre as nombre_mesero
      FROM mesas m
      LEFT JOIN grupos_mesas g ON m.id_grupo_mesa = g.id_grupo_mesa
      LEFT JOIN vendedores v ON g.id_mesero = v.id_vendedor
      ORDER BY m.numero
    `);
    
    console.log('📊 Todas las mesas:');
    todasLasMesas.rows.forEach(mesa => {
      console.log(`  Mesa ${mesa.numero}: sucursal=${mesa.id_sucursal}, estado=${mesa.estado}, grupo=${mesa.id_grupo_mesa}, estado_grupo=${mesa.estado_grupo}, mesero=${mesa.nombre_mesero}`);
    });
    
    // Verificar qué sucursales existen
    const sucursales = await pool.query(`
      SELECT DISTINCT id_sucursal FROM mesas ORDER BY id_sucursal
    `);
    
    console.log('\n📊 Sucursales disponibles:');
    sucursales.rows.forEach(suc => {
      console.log(`  Sucursal ${suc.id_sucursal}`);
    });
    
    // Probar la consulta con diferentes sucursales
    console.log('\n🔍 Probando consulta con diferentes sucursales:');
    for (const suc of sucursales.rows) {
      const mesasSucursal = await pool.query(`
        SELECT 
          m.id_mesa,
          m.numero,
          m.estado,
          m.id_grupo_mesa,
          g.estado as estado_grupo,
          v.nombre as nombre_mesero
        FROM mesas m
        LEFT JOIN grupos_mesas g ON m.id_grupo_mesa = g.id_grupo_mesa
        LEFT JOIN vendedores v ON g.id_mesero = v.id_vendedor
        WHERE m.id_sucursal = $1 AND m.id_restaurante = 1
        ORDER BY m.numero
      `, [suc.id_sucursal]);
      
      console.log(`\n  Sucursal ${suc.id_sucursal}:`);
      mesasSucursal.rows.forEach(mesa => {
        console.log(`    Mesa ${mesa.numero}: estado=${mesa.estado}, grupo=${mesa.id_grupo_mesa}, estado_grupo=${mesa.estado_grupo}, mesero=${mesa.nombre_mesero}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

testSucursalMesas(); 