const { Pool } = require('pg');

// Configuración de la base de datos
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'sistempos',
  user: 'postgres',
  password: '69512310Anacleta'
});

async function cleanGruposExistentes() {
  const client = await pool.connect();
  try {
    console.log('🧹 Limpiando grupos existentes...');
    
    // Verificar grupos existentes antes de limpiar
    const gruposAntes = await client.query(`
      SELECT id_grupo_mesa, estado, created_at
      FROM grupos_mesas 
      ORDER BY id_grupo_mesa
    `);
    
    console.log('\n📋 Grupos existentes antes de limpiar:');
    if (gruposAntes.rows.length === 0) {
      console.log('  - No hay grupos existentes');
    } else {
      gruposAntes.rows.forEach(grupo => {
        console.log(`  - Grupo ${grupo.id_grupo_mesa}: estado=${grupo.estado}, creado=${grupo.created_at}`);
      });
    }
    
    // Verificar mesas en grupos antes de limpiar
    const mesasEnGruposAntes = await client.query(`
      SELECT mg.id_mesa, m.numero, mg.id_grupo_mesa
      FROM mesas_en_grupo mg
      JOIN mesas m ON mg.id_mesa = m.id_mesa
      ORDER BY mg.id_grupo_mesa, m.numero
    `);
    
    console.log('\n📋 Mesas en grupos antes de limpiar:');
    if (mesasEnGruposAntes.rows.length === 0) {
      console.log('  - No hay mesas en grupos');
    } else {
      mesasEnGruposAntes.rows.forEach(mesa => {
        console.log(`  - Mesa ${mesa.numero} (ID: ${mesa.id_mesa}) en grupo ${mesa.id_grupo_mesa}`);
      });
    }
    
    // Limpiar mesas_en_grupo
    console.log('\n🧹 Limpiando tabla mesas_en_grupo...');
    const deleteMesasEnGrupo = await client.query(`DELETE FROM mesas_en_grupo`);
    console.log(`  - Eliminadas ${deleteMesasEnGrupo.rowCount} filas de mesas_en_grupo`);
    
    // Limpiar grupos_mesas
    console.log('🧹 Limpiando tabla grupos_mesas...');
    const deleteGrupos = await client.query(`DELETE FROM grupos_mesas`);
    console.log(`  - Eliminadas ${deleteGrupos.rowCount} filas de grupos_mesas`);
    
    // Limpiar id_grupo_mesa de las mesas
    console.log('🧹 Limpiando id_grupo_mesa de las mesas...');
    const updateMesas = await client.query(`UPDATE mesas SET id_grupo_mesa = NULL`);
    console.log(`  - Actualizadas ${updateMesas.rowCount} mesas`);
    
    // Verificar que se limpió correctamente
    const gruposDespues = await client.query(`
      SELECT COUNT(*) as total
      FROM grupos_mesas 
    `);
    
    const mesasEnGruposDespues = await client.query(`
      SELECT COUNT(*) as total
      FROM mesas_en_grupo 
    `);
    
    const mesasConGrupo = await client.query(`
      SELECT COUNT(*) as total
      FROM mesas 
      WHERE id_grupo_mesa IS NOT NULL
    `);
    
    console.log('\n✅ Verificación después de limpiar:');
    console.log(`  - Grupos restantes: ${gruposDespues.rows[0].total}`);
    console.log(`  - Mesas en grupos: ${mesasEnGruposDespues.rows[0].total}`);
    console.log(`  - Mesas con id_grupo_mesa: ${mesasConGrupo.rows[0].total}`);
    
    console.log('\n✅ Limpieza completada exitosamente');
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    client.release();
  }
  await pool.end();
}

// Ejecutar si se llama directamente
if (require.main === module) {
  cleanGruposExistentes()
    .then(() => {
      console.log('\n✅ Proceso completado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error:', error);
      process.exit(1);
    });
}

module.exports = { cleanGruposExistentes }; 