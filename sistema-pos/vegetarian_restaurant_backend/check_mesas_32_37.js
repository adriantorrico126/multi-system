const { Pool } = require('pg');

// Configuración de la base de datos
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'sistempos',
  user: 'postgres',
  password: '69512310Anacleta'
});

async function checkMesas32And37() {
  const client = await pool.connect();
  try {
    console.log('🔍 Verificando estado específico de las mesas 32 y 37...');
    
    // Verificar las mesas 32 y 37 específicamente
    const mesasEspecificas = await client.query(`
      SELECT id_mesa, numero, estado, id_grupo_mesa, id_sucursal
      FROM mesas 
      WHERE id_mesa IN (32, 37)
      ORDER BY id_mesa
    `);
    
    console.log('\n📋 Estado de las mesas 32 y 37:');
    mesasEspecificas.rows.forEach(mesa => {
      console.log(`  - ID: ${mesa.id_mesa}, Número: ${mesa.numero}, Estado: ${mesa.estado}, Grupo: ${mesa.id_grupo_mesa || 'ninguno'}, Sucursal: ${mesa.id_sucursal}`);
    });
    
    // Verificar si están en mesas_en_grupo
    const mesasEnGrupo = await client.query(`
      SELECT mg.id_mesa_en_grupo, mg.id_grupo_mesa, mg.id_mesa, g.estado as grupo_estado
      FROM mesas_en_grupo mg
      JOIN grupos_mesas g ON mg.id_grupo_mesa = g.id_grupo_mesa
      WHERE mg.id_mesa IN (32, 37)
      ORDER BY mg.id_mesa
    `);
    
    console.log('\n📋 Mesas 32 y 37 en grupos:');
    if (mesasEnGrupo.rows.length === 0) {
      console.log('  - No están en ningún grupo');
    } else {
      mesasEnGrupo.rows.forEach(mesa => {
        console.log(`  - Mesa ${mesa.id_mesa} en grupo ${mesa.id_grupo_mesa} (${mesa.grupo_estado})`);
      });
    }
    
    // Verificar grupos activos
    const gruposActivos = await client.query(`
      SELECT id_grupo_mesa, id_restaurante, id_sucursal, estado, created_at
      FROM grupos_mesas 
      WHERE estado = 'ABIERTO'
      ORDER BY id_grupo_mesa
    `);
    
    console.log('\n📋 Grupos activos:');
    if (gruposActivos.rows.length === 0) {
      console.log('  - No hay grupos activos');
    } else {
      gruposActivos.rows.forEach(grupo => {
        console.log(`  - Grupo ${grupo.id_grupo_mesa}: estado=${grupo.estado}, sucursal=${grupo.id_sucursal}, restaurante=${grupo.id_restaurante}`);
      });
    }
    
    // Verificar todas las mesas en grupos activos
    const todasMesasEnGrupos = await client.query(`
      SELECT mg.id_mesa, m.numero, mg.id_grupo_mesa, g.estado as grupo_estado
      FROM mesas_en_grupo mg
      JOIN mesas m ON mg.id_mesa = m.id_mesa
      JOIN grupos_mesas g ON mg.id_grupo_mesa = g.id_grupo_mesa
      WHERE g.estado = 'ABIERTO'
      ORDER BY mg.id_grupo_mesa, m.numero
    `);
    
    console.log('\n📋 Todas las mesas en grupos activos:');
    if (todasMesasEnGrupos.rows.length === 0) {
      console.log('  - No hay mesas en grupos activos');
    } else {
      todasMesasEnGrupos.rows.forEach(mesa => {
        console.log(`  - Mesa ${mesa.numero} (ID: ${mesa.id_mesa}) en grupo ${mesa.id_grupo_mesa} (${mesa.grupo_estado})`);
      });
    }
    
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
  checkMesas32And37()
    .then(() => {
      console.log('\n✅ Verificación completada');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error:', error);
      process.exit(1);
    });
}

module.exports = { checkMesas32And37 }; 