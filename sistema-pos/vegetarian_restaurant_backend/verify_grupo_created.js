const { Pool } = require('pg');

// Configuración de la base de datos
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'sistempos',
  user: 'postgres',
  password: '69512310Anacleta'
});

async function verifyGrupoCreated() {
  const client = await pool.connect();
  try {
    console.log('🔍 Verificando que el grupo se creó correctamente...');
    
    // Verificar grupos creados
    const grupos = await client.query(`
      SELECT id_grupo_mesa, id_restaurante, id_sucursal, id_mesero, estado, created_at
      FROM grupos_mesas 
      ORDER BY id_grupo_mesa DESC
      LIMIT 5
    `);
    
    console.log('\n📋 Grupos creados:');
    if (grupos.rows.length === 0) {
      console.log('  - No hay grupos');
    } else {
      grupos.rows.forEach(grupo => {
        console.log(`  - Grupo ${grupo.id_grupo_mesa}: restaurante=${grupo.id_restaurante}, sucursal=${grupo.id_sucursal}, mesero=${grupo.id_mesero}, estado=${grupo.estado}, creado=${grupo.created_at}`);
      });
    }
    
    // Verificar mesas en grupos
    const mesasEnGrupos = await client.query(`
      SELECT mg.id_mesa_en_grupo, mg.id_grupo_mesa, mg.id_mesa, m.numero, g.estado as grupo_estado
      FROM mesas_en_grupo mg
      JOIN mesas m ON mg.id_mesa = m.id_mesa
      JOIN grupos_mesas g ON mg.id_grupo_mesa = g.id_grupo_mesa
      ORDER BY mg.id_grupo_mesa, m.numero
    `);
    
    console.log('\n📋 Mesas en grupos:');
    if (mesasEnGrupos.rows.length === 0) {
      console.log('  - No hay mesas en grupos');
    } else {
      mesasEnGrupos.rows.forEach(mesa => {
        console.log(`  - Mesa ${mesa.numero} (ID: ${mesa.id_mesa}) en grupo ${mesa.id_grupo_mesa} (${mesa.grupo_estado})`);
      });
    }
    
    // Verificar estado de las mesas 32 y 37
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
    
    console.log('\n✅ Verificación completada');
    
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
  verifyGrupoCreated()
    .then(() => {
      console.log('\n✅ Proceso completado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error:', error);
      process.exit(1);
    });
}

module.exports = { verifyGrupoCreated }; 