const { pool } = require('./src/config/database');

async function checkMesas37_38() {
  try {
    console.log('🔍 Verificando estado de mesas 37 y 38...');
    
    // Verificar estado actual de las mesas
    const { rows: mesas } = await pool.query(`
      SELECT id_mesa, numero, estado, id_grupo_mesa, id_sucursal 
      FROM mesas 
      WHERE id_mesa IN (37, 38)
    `);
    
    console.log('📊 Estado actual de las mesas:');
    mesas.forEach(mesa => {
      console.log(`  Mesa ${mesa.numero} (ID: ${mesa.id_mesa}):`);
      console.log(`    - Estado: ${mesa.estado}`);
      console.log(`    - Grupo: ${mesa.id_grupo_mesa || 'Ninguno'}`);
      console.log(`    - Sucursal: ${mesa.id_sucursal}`);
    });
    
    // Verificar si están en algún grupo activo
    const { rows: grupos } = await pool.query(`
      SELECT mg.id_grupo_mesa, mg.id_mesa, g.estado as grupo_estado
      FROM mesas_en_grupo mg
      JOIN grupos_mesas g ON g.id_grupo_mesa = mg.id_grupo_mesa
      WHERE mg.id_mesa IN (37, 38)
    `);
    
    console.log('\n📋 Grupos que contienen estas mesas:');
    grupos.forEach(grupo => {
      console.log(`  - Mesa ${grupo.id_mesa} en grupo ${grupo.id_grupo_mesa} (estado: ${grupo.grupo_estado})`);
    });
    
    // Verificar grupos activos
    const { rows: gruposActivos } = await pool.query(`
      SELECT id_grupo_mesa, estado, created_at
      FROM grupos_mesas 
      WHERE estado = 'ABIERTO'
      ORDER BY created_at DESC
    `);
    
    console.log('\n🏢 Grupos activos:');
    gruposActivos.forEach(grupo => {
      console.log(`  - Grupo ${grupo.id_grupo_mesa} (creado: ${grupo.created_at})`);
    });
    
    // Verificar todas las mesas en grupos
    const { rows: todasMesasEnGrupos } = await pool.query(`
      SELECT mg.id_grupo_mesa, mg.id_mesa, m.numero, g.estado as grupo_estado
      FROM mesas_en_grupo mg
      JOIN mesas m ON m.id_mesa = mg.id_mesa
      JOIN grupos_mesas g ON g.id_grupo_mesa = mg.id_grupo_mesa
      WHERE g.estado = 'ABIERTO'
      ORDER BY mg.id_grupo_mesa, mg.id_mesa
    `);
    
    console.log('\n📋 Todas las mesas en grupos activos:');
    let currentGroup = null;
    todasMesasEnGrupos.forEach(row => {
      if (currentGroup !== row.id_grupo_mesa) {
        currentGroup = row.id_grupo_mesa;
        console.log(`  Grupo ${row.id_grupo_mesa}:`);
      }
      console.log(`    - Mesa ${row.numero} (ID: ${row.id_mesa})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

checkMesas37_38(); 