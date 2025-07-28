const { Pool } = require('pg');

// Configuración de la base de datos
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'sistempos',
  user: 'postgres',
  password: '69512310Anacleta'
});

async function checkMesasGrupos() {
  const client = await pool.connect();
  try {
    console.log('🔍 Verificando estado de mesas y grupos...');
    
    // Verificar todas las mesas
    const mesas = await client.query(`
      SELECT id_mesa, numero, estado, id_grupo_mesa, id_sucursal
      FROM mesas 
      WHERE id_sucursal = 4
      ORDER BY numero
    `);
    
    console.log('\n📋 Mesas disponibles:');
    mesas.rows.forEach(mesa => {
      console.log(`  - Mesa ${mesa.numero}: estado=${mesa.estado}, grupo=${mesa.id_grupo_mesa || 'ninguno'}`);
    });
    
    // Verificar grupos existentes
    const grupos = await client.query(`
      SELECT id_grupo_mesa, id_restaurante, id_sucursal, estado, created_at
      FROM grupos_mesas 
      WHERE estado = 'ABIERTO'
    `);
    
    console.log('\n📋 Grupos activos:');
    if (grupos.rows.length === 0) {
      console.log('  - No hay grupos activos');
    } else {
      grupos.rows.forEach(grupo => {
        console.log(`  - Grupo ${grupo.id_grupo_mesa}: estado=${grupo.estado}, sucursal=${grupo.id_sucursal}`);
      });
    }
    
    // Verificar mesas en grupos
    const mesasEnGrupos = await client.query(`
      SELECT mg.id_grupo_mesa, mg.id_mesa, m.numero, g.estado as grupo_estado
      FROM mesas_en_grupo mg
      JOIN mesas m ON mg.id_mesa = m.id_mesa
      JOIN grupos_mesas g ON mg.id_grupo_mesa = g.id_grupo_mesa
      WHERE g.estado = 'ABIERTO'
      ORDER BY mg.id_grupo_mesa, m.numero
    `);
    
    console.log('\n📋 Mesas en grupos activos:');
    if (mesasEnGrupos.rows.length === 0) {
      console.log('  - No hay mesas en grupos activos');
    } else {
      mesasEnGrupos.rows.forEach(mesa => {
        console.log(`  - Mesa ${mesa.numero} en grupo ${mesa.id_grupo_mesa} (${mesa.grupo_estado})`);
      });
    }
    
    // Verificar si hay mesas con id_grupo_mesa pero no en mesas_en_grupo
    const mesasInconsistentes = await client.query(`
      SELECT m.id_mesa, m.numero, m.id_grupo_mesa
      FROM mesas m
      LEFT JOIN mesas_en_grupo mg ON m.id_mesa = mg.id_mesa
      WHERE m.id_grupo_mesa IS NOT NULL AND mg.id_mesa IS NULL
    `);
    
    if (mesasInconsistentes.rows.length > 0) {
      console.log('\n⚠️  Mesas con inconsistencia (tienen id_grupo_mesa pero no están en mesas_en_grupo):');
      mesasInconsistentes.rows.forEach(mesa => {
        console.log(`  - Mesa ${mesa.numero}: grupo=${mesa.id_grupo_mesa}`);
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
  checkMesasGrupos()
    .then(() => {
      console.log('\n✅ Verificación completada');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error:', error);
      process.exit(1);
    });
}

module.exports = { checkMesasGrupos }; 