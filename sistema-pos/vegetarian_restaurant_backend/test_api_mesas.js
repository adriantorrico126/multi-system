const { pool } = require('./src/config/database');

async function testApiMesas() {
  try {
    console.log('🔍 Simulando consulta de la API para mesas...');
    
    // Simular exactamente la misma consulta que hace getMesasBySucursal
    const query = `
      SELECT 
        m.id_mesa,
        m.numero,
        m.capacidad,
        m.estado,
        m.total_acumulado,
        m.hora_apertura,
        m.hora_cierre,
        m.id_restaurante,
        m.id_grupo_mesa,
        v.id_venta as id_venta_actual,
        v.total as total_venta_actual,
        v.fecha as fecha_venta_actual,
        g.estado as estado_grupo,
        vd.nombre as nombre_mesero_grupo
      FROM mesas m
      LEFT JOIN ventas v ON m.id_venta_actual = v.id_venta
      LEFT JOIN grupos_mesas g ON m.id_grupo_mesa = g.id_grupo_mesa
      LEFT JOIN vendedores vd ON g.id_mesero = vd.id_vendedor
      WHERE m.id_sucursal = $1 AND m.id_restaurante = $2
      ORDER BY m.numero
    `;
    
    const { rows } = await pool.query(query, [1, 1]); // Sucursal 1, Restaurante 1
    
    console.log('📊 Datos devueltos por la API:');
    rows.forEach(mesa => {
      console.log(`  Mesa ${mesa.numero}:`);
      console.log(`    - id_mesa: ${mesa.id_mesa}`);
      console.log(`    - estado: ${mesa.estado}`);
      console.log(`    - id_grupo_mesa: ${mesa.id_grupo_mesa}`);
      console.log(`    - estado_grupo: ${mesa.estado_grupo}`);
      console.log(`    - nombre_mesero_grupo: ${mesa.nombre_mesero_grupo}`);
      console.log(`    - total_acumulado: ${mesa.total_acumulado}`);
      console.log('');
    });
    
    // Verificar específicamente las mesas que deberían estar en grupo
    console.log('🔍 Verificando mesas que deberían estar en grupo:');
    const mesasEnGrupo = rows.filter(m => m.id_grupo_mesa);
    mesasEnGrupo.forEach(mesa => {
      console.log(`  Mesa ${mesa.numero}: estado=${mesa.estado}, grupo=${mesa.id_grupo_mesa}, mesero=${mesa.nombre_mesero_grupo}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

testApiMesas(); 