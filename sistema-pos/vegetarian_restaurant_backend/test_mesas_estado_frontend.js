const { pool } = require('./src/config/database');

async function testMesasEstadoFrontend() {
  try {
    console.log('=== TESTING MESAS ESTADO FRONTEND ===');
    
    const id_restaurante = 1;
    const id_sucursal = 4;
    
    // Simular la consulta que hace el frontend
    console.log('\n1. Consulta getMesasBySucursal (como la hace el frontend):');
    const query = `
      SELECT 
        m.id_mesa,
        m.numero,
        m.capacidad,
        m.estado,
        m.total_acumulado,
        m.hora_apertura,
        m.hora_cierre,
        m.id_restaurante,
        m.id_grupo_mesa,
        v.id_venta as id_venta_actual,
        v.total as total_venta_actual,
        v.fecha as fecha_venta_actual,
        g.estado as estado_grupo,
        vd.nombre as nombre_mesero_grupo
      FROM mesas m
      LEFT JOIN ventas v ON m.id_venta_actual = v.id_venta
      LEFT JOIN grupos_mesas g ON m.id_grupo_mesa = g.id_grupo_mesa
      LEFT JOIN vendedores vd ON g.id_mesero = vd.id_vendedor
      WHERE m.id_sucursal = $1 AND m.id_restaurante = $2
      ORDER BY m.numero
    `;
    
    const { rows: mesasFrontend } = await pool.query(query, [id_sucursal, id_restaurante]);
    
    mesasFrontend.forEach(mesa => {
      console.log(`Mesa ${mesa.numero}: ${mesa.estado} (Grupo: ${mesa.id_grupo_mesa || 'Ninguno'}, Mesero: ${mesa.nombre_mesero_grupo || 'Ninguno'})`);
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

testMesasEstadoFrontend(); 