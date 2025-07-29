const { pool } = require('./src/config/database');

async function cleanClosedGroups() {
  try {
    console.log('🧹 Limpiando referencias de grupos cerrados...');
    
    // Verificar grupos cerrados que tienen mesas en mesas_en_grupo
    const { rows: closedGroupsWithMesas } = await pool.query(`
      SELECT DISTINCT g.id_grupo_mesa, g.estado, COUNT(mg.id_mesa) as mesas_count
      FROM grupos_mesas g
      JOIN mesas_en_grupo mg ON mg.id_grupo_mesa = g.id_grupo_mesa
      WHERE g.estado = 'CERRADO'
      GROUP BY g.id_grupo_mesa, g.estado
    `);
    
    console.log('📋 Grupos cerrados con mesas:');
    closedGroupsWithMesas.forEach(group => {
      console.log(`  - Grupo ${group.id_grupo_mesa}: ${group.mesas_count} mesas`);
    });
    
    if (closedGroupsWithMesas.length > 0) {
      console.log('\n🗑️ Eliminando referencias de grupos cerrados...');
      
      // Eliminar referencias de mesas_en_grupo para grupos cerrados
      const { rowCount: deletedMesas } = await pool.query(`
        DELETE FROM mesas_en_grupo 
        WHERE id_grupo_mesa IN (
          SELECT id_grupo_mesa FROM grupos_mesas WHERE estado = 'CERRADO'
        )
      `);
      
      console.log(`✅ Eliminadas ${deletedMesas} referencias de mesas en grupos cerrados`);
      
      // Verificar que las mesas no tengan id_grupo_mesa incorrecto
      const { rows: mesasWithInvalidGroup } = await pool.query(`
        SELECT m.id_mesa, m.numero, m.id_grupo_mesa, g.estado as grupo_estado
        FROM mesas m
        LEFT JOIN grupos_mesas g ON g.id_grupo_mesa = m.id_grupo_mesa
        WHERE m.id_grupo_mesa IS NOT NULL AND (g.estado = 'CERRADO' OR g.id_grupo_mesa IS NULL)
      `);
      
      if (mesasWithInvalidGroup.length > 0) {
        console.log('\n🔧 Limpiando referencias incorrectas en mesas:');
        mesasWithInvalidGroup.forEach(mesa => {
          console.log(`  - Mesa ${mesa.numero} (ID: ${mesa.id_mesa}): grupo ${mesa.id_grupo_mesa} (${mesa.grupo_estado || 'NO EXISTE'})`);
        });
        
        // Limpiar referencias incorrectas
        const { rowCount: updatedMesas } = await pool.query(`
          UPDATE mesas 
          SET id_grupo_mesa = NULL 
          WHERE id_grupo_mesa IN (
            SELECT id_grupo_mesa FROM grupos_mesas WHERE estado = 'CERRADO'
          )
        `);
        
        console.log(`✅ Actualizadas ${updatedMesas} mesas con referencias incorrectas`);
      }
    } else {
      console.log('✅ No hay grupos cerrados con referencias de mesas');
    }
    
    // Verificar estado final
    console.log('\n📊 Estado final después de la limpieza:');
    
    const { rows: finalMesas } = await pool.query(`
      SELECT id_mesa, numero, estado, id_grupo_mesa 
      FROM mesas 
      WHERE id_mesa IN (37, 38)
    `);
    
    console.log('Mesas 37 y 38:');
    finalMesas.forEach(mesa => {
      console.log(`  - Mesa ${mesa.numero} (ID: ${mesa.id_mesa}):`);
      console.log(`    - Estado: ${mesa.estado}`);
      console.log(`    - Grupo: ${mesa.id_grupo_mesa || 'Ninguno'}`);
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
    
    console.log('\n✅ Limpieza completada exitosamente');
    
  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
  } finally {
    await pool.end();
  }
}

cleanClosedGroups(); 