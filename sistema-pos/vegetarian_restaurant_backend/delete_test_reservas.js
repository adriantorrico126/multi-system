const { pool } = require('./src/config/database');

async function deleteTestReservas() {
  try {
    console.log('🔍 Eliminando reservas de prueba...');
    
    // Eliminar todas las reservas existentes
    const deleteResult = await pool.query(`
      DELETE FROM reservas 
      WHERE id_reserva IN (6, 7)
    `);
    
    console.log(`🗑️ Reservas eliminadas: ${deleteResult.rowCount}`);
    
    // Verificar que se eliminaron
    const remainingReservas = await pool.query(`
      SELECT * FROM reservas ORDER BY fecha_hora_inicio
    `);
    
    console.log(`📊 Reservas restantes: ${remainingReservas.rows.length}`);
    
    if (remainingReservas.rows.length === 0) {
      console.log('✅ Todas las reservas de prueba han sido eliminadas');
    } else {
      console.log('⚠️ Aún quedan reservas:');
      remainingReservas.rows.forEach((reserva, index) => {
        console.log(`${index + 1}. Mesa ${reserva.id_mesa} - ${reserva.fecha_hora_inicio} a ${reserva.fecha_hora_fin} - Estado: ${reserva.estado}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

deleteTestReservas(); 