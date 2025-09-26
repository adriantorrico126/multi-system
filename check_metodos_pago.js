const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  password: '6951230Anacleta',
  host: 'localhost',
  port: 5432,
  database: 'sistempos'
});

async function checkMetodosPago() {
  try {
    console.log('🔍 Verificando métodos de pago válidos...\n');

    // Verificar métodos de pago únicos en la tabla suscripciones
    const metodosQuery = `
      SELECT DISTINCT metodo_pago, COUNT(*) as cantidad
      FROM suscripciones 
      WHERE metodo_pago IS NOT NULL
      GROUP BY metodo_pago
      ORDER BY metodo_pago
    `;
    const metodosResult = await pool.query(metodosQuery);
    
    console.log('📋 Métodos de pago encontrados:');
    metodosResult.rows.forEach(metodo => {
      console.log(`- ${metodo.metodo_pago}: ${metodo.cantidad} suscripciones`);
    });
    console.log('');

    // Verificar una suscripción existente para ver la estructura
    const ejemploQuery = `
      SELECT metodo_pago, auto_renovacion, notificaciones_email
      FROM suscripciones 
      WHERE id_restaurante = 7 AND estado = 'activa'
      LIMIT 1
    `;
    const ejemploResult = await pool.query(ejemploQuery);
    
    if (ejemploResult.rows.length > 0) {
      const ejemplo = ejemploResult.rows[0];
      console.log('📋 Ejemplo de suscripción activa:');
      console.log(`- Método de pago: ${ejemplo.metodo_pago}`);
      console.log(`- Auto renovación: ${ejemplo.auto_renovacion}`);
      console.log(`- Notificaciones email: ${ejemplo.notificaciones_email}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkMetodosPago();
