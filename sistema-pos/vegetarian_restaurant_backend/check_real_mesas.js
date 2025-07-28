const { Pool } = require('pg');

// Configuración de la base de datos
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'sistempos',
  user: 'postgres',
  password: '69512310Anacleta'
});

async function checkRealMesas() {
  const client = await pool.connect();
  try {
    console.log('🔍 Verificando mesas reales en la base de datos...');
    
    // Verificar todas las mesas
    const allMesas = await client.query(`
      SELECT id_mesa, numero, estado, id_grupo_mesa, id_sucursal
      FROM mesas 
      ORDER BY id_mesa
    `);
    
    console.log('\n📋 Todas las mesas en la base de datos:');
    allMesas.rows.forEach(mesa => {
      console.log(`  - ID: ${mesa.id_mesa}, Número: ${mesa.numero}, Estado: ${mesa.estado}, Grupo: ${mesa.id_grupo_mesa || 'ninguno'}, Sucursal: ${mesa.id_sucursal}`);
    });
    
    // Verificar mesas de la sucursal 4 específicamente
    const mesasSucursal4 = await client.query(`
      SELECT id_mesa, numero, estado, id_grupo_mesa
      FROM mesas 
      WHERE id_sucursal = 4
      ORDER BY numero
    `);
    
    console.log('\n📋 Mesas de la sucursal 4:');
    if (mesasSucursal4.rows.length === 0) {
      console.log('  - No hay mesas en la sucursal 4');
    } else {
      mesasSucursal4.rows.forEach(mesa => {
        console.log(`  - ID: ${mesa.id_mesa}, Número: ${mesa.numero}, Estado: ${mesa.estado}, Grupo: ${mesa.id_grupo_mesa || 'ninguno'}`);
      });
    }
    
    // Verificar mesas libres en sucursal 4
    const mesasLibres = await client.query(`
      SELECT id_mesa, numero
      FROM mesas 
      WHERE id_sucursal = 4 AND estado = 'libre' AND id_grupo_mesa IS NULL
      ORDER BY numero
    `);
    
    console.log('\n📋 Mesas libres disponibles para agrupar (sucursal 4):');
    if (mesasLibres.rows.length === 0) {
      console.log('  - No hay mesas libres disponibles');
    } else {
      mesasLibres.rows.forEach(mesa => {
        console.log(`  - ID: ${mesa.id_mesa}, Número: ${mesa.numero}`);
      });
    }
    
    // Verificar qué mesas están en grupos
    const mesasEnGrupos = await client.query(`
      SELECT m.id_mesa, m.numero, m.id_sucursal, mg.id_grupo_mesa, g.estado as grupo_estado
      FROM mesas m
      JOIN mesas_en_grupo mg ON m.id_mesa = mg.id_mesa
      JOIN grupos_mesas g ON mg.id_grupo_mesa = g.id_grupo_mesa
      WHERE g.estado = 'ABIERTO'
      ORDER BY mg.id_grupo_mesa, m.numero
    `);
    
    console.log('\n📋 Mesas actualmente en grupos activos:');
    if (mesasEnGrupos.rows.length === 0) {
      console.log('  - No hay mesas en grupos activos');
    } else {
      mesasEnGrupos.rows.forEach(mesa => {
        console.log(`  - ID: ${mesa.id_mesa}, Número: ${mesa.numero}, Sucursal: ${mesa.id_sucursal}, Grupo: ${mesa.id_grupo_mesa} (${mesa.grupo_estado})`);
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
  checkRealMesas()
    .then(() => {
      console.log('\n✅ Verificación completada');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error:', error);
      process.exit(1);
    });
}

module.exports = { checkRealMesas }; 