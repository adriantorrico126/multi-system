const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'sistempos',
  user: 'postgres',
  password: '6951230Anacleta'
});

async function activarPagoDiferido() {
  try {
    console.log('🔧 [ACTIVACIÓN] Activando método de pago diferido');
    console.log('================================================');

    // Activar método de pago diferido
    const activarQuery = `
      UPDATE metodos_pago 
      SET activo = true 
      WHERE descripcion = 'Pago Diferido' AND id_restaurante = 1
      RETURNING *
    `;
    const activarResult = await pool.query(activarQuery);
    
    if (activarResult.rows.length > 0) {
      console.log('✅ Método de pago "Pago Diferido" activado exitosamente');
      console.log('📋 Método activado:', activarResult.rows[0]);
    } else {
      console.log('⚠️ No se encontró el método "Pago Diferido"');
      
      // Crear el método si no existe
      const crearQuery = `
        INSERT INTO metodos_pago (descripcion, activo, id_restaurante)
        VALUES ('Pago Diferido', true, 1)
        RETURNING *
      `;
      const crearResult = await pool.query(crearQuery);
      console.log('✅ Método de pago "Pago Diferido" creado y activado');
      console.log('📋 Método creado:', crearResult.rows[0]);
    }

    // Verificar métodos activos
    console.log('\n💳 MÉTODOS DE PAGO ACTIVOS:');
    const metodosActivosQuery = `
      SELECT id_pago, descripcion, activo
      FROM metodos_pago 
      WHERE id_restaurante = 1 AND activo = true
      ORDER BY id_pago
    `;
    const metodosActivosResult = await pool.query(metodosActivosQuery);
    console.table(metodosActivosResult.rows);

    console.log('\n✅ ACTIVACIÓN COMPLETADA');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

activarPagoDiferido();
