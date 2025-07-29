const { pool } = require('./src/config/database');
const GrupoMesaModel = require('./src/models/grupoMesaModel');

async function testCerrarGrupo() {
  try {
    console.log('🧪 Probando función cerrarGrupo corregida...');
    
    // Verificar grupos activos antes
    const gruposAntes = await pool.query(`
      SELECT id_grupo_mesa, estado, created_at 
      FROM grupos_mesas 
      WHERE estado = 'ABIERTO'
      ORDER BY created_at DESC
    `);
    
    console.log('📋 Grupos activos antes de cerrar:');
    gruposAntes.rows.forEach(grupo => {
      console.log(`  - Grupo ${grupo.id_grupo_mesa} (creado: ${grupo.created_at})`);
    });
    
    if (gruposAntes.rows.length === 0) {
      console.log('❌ No hay grupos activos para probar');
      return;
    }
    
    // Tomar el primer grupo activo para probar
    const grupoParaCerrar = gruposAntes.rows[0];
    console.log(`\n🔧 Cerrando grupo ${grupoParaCerrar.id_grupo_mesa}...`);
    
    // Verificar mesas en el grupo antes de cerrar
    const mesasEnGrupoAntes = await pool.query(`
      SELECT mg.id_mesa, m.numero, m.id_grupo_mesa
      FROM mesas_en_grupo mg
      JOIN mesas m ON m.id_mesa = mg.id_mesa
      WHERE mg.id_grupo_mesa = $1
    `, [grupoParaCerrar.id_grupo_mesa]);
    
    console.log('📋 Mesas en el grupo antes de cerrar:');
    mesasEnGrupoAntes.rows.forEach(mesa => {
      console.log(`  - Mesa ${mesa.numero} (ID: ${mesa.id_mesa})`);
    });
    
    // Cerrar el grupo
    await GrupoMesaModel.cerrarGrupo(grupoParaCerrar.id_grupo_mesa);
    console.log('✅ Grupo cerrado exitosamente');
    
    // Verificar que las referencias se limpiaron correctamente
    const mesasEnGrupoDespues = await pool.query(`
      SELECT mg.id_mesa, m.numero, m.id_grupo_mesa
      FROM mesas_en_grupo mg
      JOIN mesas m ON m.id_mesa = mg.id_mesa
      WHERE mg.id_grupo_mesa = $1
    `, [grupoParaCerrar.id_grupo_mesa]);
    
    console.log('\n📋 Mesas en el grupo después de cerrar:');
    if (mesasEnGrupoDespues.rows.length === 0) {
      console.log('  ✅ No hay mesas en el grupo (correcto)');
    } else {
      console.log('  ❌ Aún hay mesas en el grupo (incorrecto)');
      mesasEnGrupoDespues.rows.forEach(mesa => {
        console.log(`    - Mesa ${mesa.numero} (ID: ${mesa.id_mesa})`);
      });
    }
    
    // Verificar estado de las mesas
    const mesasEstado = await pool.query(`
      SELECT id_mesa, numero, id_grupo_mesa
      FROM mesas
      WHERE id_mesa = ANY($1)
    `, [mesasEnGrupoAntes.rows.map(m => m.id_mesa)]);
    
    console.log('\n📋 Estado de las mesas después de cerrar el grupo:');
    mesasEstado.rows.forEach(mesa => {
      console.log(`  - Mesa ${mesa.numero} (ID: ${mesa.id_mesa}): grupo ${mesa.id_grupo_mesa || 'Ninguno'}`);
    });
    
    // Verificar grupos activos después
    const gruposDespues = await pool.query(`
      SELECT id_grupo_mesa, estado, created_at 
      FROM grupos_mesas 
      WHERE estado = 'ABIERTO'
      ORDER BY created_at DESC
    `);
    
    console.log('\n📋 Grupos activos después de cerrar:');
    gruposDespues.rows.forEach(grupo => {
      console.log(`  - Grupo ${grupo.id_grupo_mesa} (creado: ${grupo.created_at})`);
    });
    
    console.log('\n✅ Prueba completada exitosamente');
    
  } catch (error) {
    console.error('❌ Error durante la prueba:', error);
  } finally {
    await pool.end();
  }
}

testCerrarGrupo(); 