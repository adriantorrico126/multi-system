const { pool } = require('./src/config/database');

async function fixMesasGrupo() {
  try {
    console.log('🔧 Verificando y corrigiendo mesas en grupos...');
    
    // 1. Verificar qué mesas están en grupos pero no tienen id_grupo_mesa actualizado
    const mesasInconsistentes = await pool.query(`
      SELECT 
        m.id_mesa,
        m.numero,
        m.estado,
        m.id_grupo_mesa as id_grupo_mesa_mesa,
        mg.id_grupo_mesa as id_grupo_mesa_relacion,
        g.estado as estado_grupo,
        v.nombre as nombre_mesero
      FROM mesas m
      LEFT JOIN mesas_en_grupo mg ON m.id_mesa = mg.id_mesa
      LEFT JOIN grupos_mesas g ON mg.id_grupo_mesa = g.id_grupo_mesa
      LEFT JOIN vendedores v ON g.id_mesero = v.id_vendedor
      WHERE mg.id_grupo_mesa IS NOT NULL
      ORDER BY m.numero
    `);
    
    console.log('📊 Mesas con inconsistencias:');
    mesasInconsistentes.rows.forEach(mesa => {
      console.log(`  Mesa ${mesa.numero}: estado=${mesa.estado}, id_grupo_mesa_mesa=${mesa.id_grupo_mesa_mesa}, id_grupo_mesa_relacion=${mesa.id_grupo_mesa_relacion}, estado_grupo=${mesa.estado_grupo}, mesero=${mesa.nombre_mesero}`);
    });
    
    // 2. Corregir las inconsistencias
    console.log('\n🔧 Corrigiendo inconsistencias...');
    
    for (const mesa of mesasInconsistentes.rows) {
      if (mesa.id_grupo_mesa_mesa !== mesa.id_grupo_mesa_relacion) {
        console.log(`  Corrigiendo Mesa ${mesa.numero}: actualizando id_grupo_mesa de ${mesa.id_grupo_mesa_mesa} a ${mesa.id_grupo_mesa_relacion}`);
        
        await pool.query(
          `UPDATE mesas SET id_grupo_mesa = $1 WHERE id_mesa = $2`,
          [mesa.id_grupo_mesa_relacion, mesa.id_mesa]
        );
      }
    }
    
    // 3. Verificar el resultado
    console.log('\n✅ Verificando resultado...');
    const mesasCorregidas = await pool.query(`
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
    
    console.log('📊 Mesas corregidas:');
    mesasCorregidas.rows.forEach(mesa => {
      console.log(`  Mesa ${mesa.numero}: estado=${mesa.estado}, grupo=${mesa.id_grupo_mesa}, estado_grupo=${mesa.estado_grupo}, mesero=${mesa.nombre_mesero}`);
    });
    
    console.log('\n✅ Proceso completado!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

fixMesasGrupo(); 