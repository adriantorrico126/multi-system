const { pool } = require('./src/config/database');

async function testMesasGrupo() {
  try {
    console.log('🔍 Verificando estado de mesas en grupos...');
    
    // Verificar mesas que están en grupos
    const mesasEnGrupo = await pool.query(`
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
      WHERE m.id_grupo_mesa IS NOT NULL
      ORDER BY m.numero
    `);
    
    console.log('📊 Mesas en grupos:');
    mesasEnGrupo.rows.forEach(mesa => {
      console.log(`  Mesa ${mesa.numero}: estado=${mesa.estado}, grupo=${mesa.id_grupo_mesa}, estado_grupo=${mesa.estado_grupo}, mesero=${mesa.nombre_mesero}`);
    });
    
    // Verificar grupos activos
    const gruposActivos = await pool.query(`
      SELECT 
        g.id_grupo_mesa,
        g.estado,
        g.created_at,
        v.nombre as nombre_mesero,
        COUNT(mg.id_mesa) as cantidad_mesas
      FROM grupos_mesas g
      LEFT JOIN vendedores v ON g.id_mesero = v.id_vendedor
      LEFT JOIN mesas_en_grupo mg ON g.id_grupo_mesa = mg.id_grupo_mesa
      WHERE g.estado = 'ABIERTO'
      GROUP BY g.id_grupo_mesa, g.estado, g.created_at, v.nombre
      ORDER BY g.created_at DESC
    `);
    
    console.log('\n📊 Grupos activos:');
    gruposActivos.rows.forEach(grupo => {
      console.log(`  Grupo ${grupo.id_grupo_mesa}: ${grupo.cantidad_mesas} mesas, mesero=${grupo.nombre_mesero}, creado=${grupo.created_at}`);
    });
    
    // Verificar todas las mesas de una sucursal específica
    const todasLasMesas = await pool.query(`
      SELECT 
        m.id_mesa,
        m.numero,
        m.estado,
        m.id_grupo_mesa,
        g.estado as estado_grupo
      FROM mesas m
      LEFT JOIN grupos_mesas g ON m.id_grupo_mesa = g.id_grupo_mesa
      WHERE m.id_sucursal = 1 AND m.id_restaurante = 1
      ORDER BY m.numero
    `);
    
    console.log('\n📊 Todas las mesas (Sucursal 1, Restaurante 1):');
    todasLasMesas.rows.forEach(mesa => {
      console.log(`  Mesa ${mesa.numero}: estado=${mesa.estado}, grupo=${mesa.id_grupo_mesa || 'NULL'}, estado_grupo=${mesa.estado_grupo || 'NULL'}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

testMesasGrupo(); 