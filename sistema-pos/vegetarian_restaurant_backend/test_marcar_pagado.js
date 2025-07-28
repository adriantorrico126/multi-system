const { Pool } = require('pg');

// Usar las credenciales correctas
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'sistempos',
  user: 'postgres',
  password: '69512310Anacleta'
});

async function testMarcarPagado() {
  try {
    console.log('🔍 Testing marcar como pagado...');
    
    // Primero, vamos a ver qué mesas existen
    console.log('\n📋 Checking mesas:');
    const mesasQuery = `
      SELECT id_mesa, numero, estado, total_acumulado, id_sucursal
      FROM mesas 
      WHERE id_restaurante = 1
      ORDER BY numero;
    `;
    const mesasResult = await pool.query(mesasQuery);
    console.log('Mesas disponibles:');
    mesasResult.rows.forEach(mesa => {
      console.log(`  Mesa ${mesa.numero}: Estado=${mesa.estado}, Total=${mesa.total_acumulado}, Sucursal=${mesa.id_sucursal}`);
    });

    // Buscar una mesa que esté en uso
    const mesaEnUso = mesasResult.rows.find(m => m.estado !== 'libre');
    if (!mesaEnUso) {
      console.log('\n❌ No hay mesas en uso para probar');
      return;
    }

    console.log(`\n🧪 Testing marcar como pagado para mesa ${mesaEnUso.numero}:`);
    
    // Simular la función del modelo
    const marcarMesaComoPagada = async (id_mesa, id_restaurante, client = pool) => {
      // Primero obtener el total acumulado actual
      const mesaQuery = `
        SELECT total_acumulado, numero
        FROM mesas 
        WHERE id_mesa = $1 AND id_restaurante = $2
      `;
      const mesaResult = await client.query(mesaQuery, [id_mesa, id_restaurante]);
      
      if (mesaResult.rows.length === 0) {
        throw new Error('Mesa no encontrada');
      }
      
      const totalAcumulado = mesaResult.rows[0].total_acumulado || 0;
      
      // Marcar mesa como pagada (mantener total acumulado para referencia)
      const query = `
        UPDATE mesas 
        SET estado = 'pagado', 
            hora_cierre = NOW(),
            id_venta_actual = NULL
        WHERE id_mesa = $1 AND id_restaurante = $2
        RETURNING *
      `;
      const { rows } = await client.query(query, [id_mesa, id_restaurante]);
      
      // Retornar la mesa con el total acumulado
      return {
        ...rows[0],
        total_acumulado: totalAcumulado
      };
    };

    // Probar la función
    const resultado = await marcarMesaComoPagada(mesaEnUso.id_mesa, 1);
    console.log('✅ Mesa marcada como pagada exitosamente:');
    console.log('  Mesa:', resultado.numero);
    console.log('  Estado:', resultado.estado);
    console.log('  Total acumulado:', resultado.total_acumulado);
    console.log('  Hora cierre:', resultado.hora_cierre);

    // Verificar que la mesa se actualizó correctamente
    const mesaActualizada = await pool.query('SELECT * FROM mesas WHERE id_mesa = $1', [mesaEnUso.id_mesa]);
    console.log('\n📋 Mesa actualizada en BD:');
    console.log('  Estado:', mesaActualizada.rows[0].estado);
    console.log('  Hora cierre:', mesaActualizada.rows[0].hora_cierre);

  } catch (error) {
    console.error('❌ Error testing marcar como pagado:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
  } finally {
    await pool.end();
  }
}

testMarcarPagado(); 