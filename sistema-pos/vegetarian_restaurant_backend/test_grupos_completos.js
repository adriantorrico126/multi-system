const { pool } = require('./src/config/database');

async function testGruposActivosCompletos() {
  try {
    console.log('=== TESTING GRUPOS ACTIVOS COMPLETOS ===');
    
    const id_restaurante = 1;
    
    // Verificar si existen grupos activos
    const gruposRes = await pool.query(
      `SELECT g.*, v.nombre as nombre_mesero, v.username as username_mesero
       FROM grupos_mesas g
       LEFT JOIN vendedores v ON g.id_mesero = v.id_vendedor
       WHERE g.estado = 'ABIERTO' AND g.id_restaurante = $1
       ORDER BY g.created_at DESC`,
      [id_restaurante]
    );
    
    console.log('Grupos encontrados:', gruposRes.rows.length);
    console.log('Grupos:', gruposRes.rows);
    
    if (gruposRes.rows.length > 0) {
      // Probar con el primer grupo
      const grupo = gruposRes.rows[0];
      console.log('Probando con grupo:', grupo.id_grupo_mesa);
      
      // Obtener mesas del grupo
      const mesasRes = await pool.query(
        `SELECT m.id_mesa, m.numero, m.capacidad, m.estado, m.total_acumulado, m.hora_apertura
         FROM mesas m
         JOIN mesas_en_grupo mg ON m.id_mesa = mg.id_mesa
         WHERE mg.id_grupo_mesa = $1`,
        [grupo.id_grupo_mesa]
      );
      
      console.log('Mesas del grupo:', mesasRes.rows);
    }
    
    console.log('=== TEST COMPLETED ===');
  } catch (error) {
    console.error('Error en test:', error);
    console.error('Error stack:', error.stack);
  } finally {
    await pool.end();
  }
}

testGruposActivosCompletos(); 