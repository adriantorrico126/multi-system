const { pool } = require('./src/config/database');

async function cleanOldReservas() {
  try {
    console.log('🔍 Limpiando reservas antiguas...');
    
    // Obtener todas las reservas
    const allReservas = await pool.query(`
      SELECT * FROM reservas ORDER BY fecha_hora_inicio
    `);
    
    console.log(`📊 Total de reservas encontradas: ${allReservas.rows.length}`);
    
    // Mostrar las reservas existentes
    allReservas.rows.forEach((reserva, index) => {
      console.log(`${index + 1}. Mesa ${reserva.id_mesa} - ${reserva.fecha_hora_inicio} a ${reserva.fecha_hora_fin} - Estado: ${reserva.estado}`);
    });
    
    // Eliminar reservas que ya han pasado
    const deleteResult = await pool.query(`
      DELETE FROM reservas 
      WHERE fecha_hora_fin < NOW() 
      AND estado IN ('CONFIRMADA', 'PENDIENTE')
    `);
    
    console.log(`🗑️ Reservas antiguas eliminadas: ${deleteResult.rowCount}`);
    
    // Mostrar reservas restantes
    const remainingReservas = await pool.query(`
      SELECT * FROM reservas ORDER BY fecha_hora_inicio
    `);
    
    console.log(`📊 Reservas restantes: ${remainingReservas.rows.length}`);
    remainingReservas.rows.forEach((reserva, index) => {
      console.log(`${index + 1}. Mesa ${reserva.id_mesa} - ${reserva.fecha_hora_inicio} a ${reserva.fecha_hora_fin} - Estado: ${reserva.estado}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

cleanOldReservas(); 