const { pool } = require('./src/config/database');

async function testMesasEstado() {
  try {
    console.log('=== TESTING MESAS ESTADO ===');
    
    const id_restaurante = 1;
    const id_sucursal = 4;
    
    // Verificar estado actual de las mesas
    console.log('\n1. Estado actual de las mesas:');
    const mesasActuales = await pool.query(
      `SELECT id_mesa, numero, estado, id_grupo_mesa FROM mesas WHERE id_sucursal = $1 ORDER BY numero`,
      [id_sucursal]
    );
    
    mesasActuales.rows.forEach(mesa => {
      console.log(`Mesa ${mesa.numero}: ${mesa.estado} (Grupo: ${mesa.id_grupo_mesa || 'Ninguno'})`);
    });
    
    // Verificar grupos activos
    console.log('\n2. Grupos activos:');
    const gruposActivos = await pool.query(
      `SELECT g.*, v.nombre as nombre_mesero FROM grupos_mesas g
       LEFT JOIN vendedores v ON g.id_mesero = v.id_vendedor
       WHERE g.estado = 'ABIERTO' AND g.id_restaurante = $1`,
      [id_restaurante]
    );
    
    gruposActivos.rows.forEach(grupo => {
      console.log(`Grupo ${grupo.id_grupo_mesa}: ${grupo.nombre_mesero || 'Sin mesero'}`);
    });
    
    // Verificar mesas en grupos
    console.log('\n3. Mesas en grupos:');
    const mesasEnGrupos = await pool.query(
      `SELECT m.numero, m.estado, g.id_grupo_mesa, v.nombre as nombre_mesero
       FROM mesas m
       JOIN mesas_en_grupo mg ON m.id_mesa = mg.id_mesa
       JOIN grupos_mesas g ON mg.id_grupo_mesa = g.id_grupo_mesa
       LEFT JOIN vendedores v ON g.id_mesero = v.id_vendedor
       WHERE g.estado = 'ABIERTO' AND g.id_restaurante = $1
       ORDER BY m.numero`,
      [id_restaurante]
    );
    
    mesasEnGrupos.rows.forEach(mesa => {
      console.log(`Mesa ${mesa.numero}: ${mesa.estado} (Grupo ${mesa.id_grupo_mesa}, Mesero: ${mesa.nombre_mesero})`);
    });
    
    console.log('\n=== TEST COMPLETED ===');
  } catch (error) {
    console.error('Error en test:', error);
    console.error('Error stack:', error.stack);
  } finally {
    await pool.end();
  }
}

testMesasEstado(); 