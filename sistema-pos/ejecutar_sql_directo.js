const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'sistempos',
  user: 'postgres',
  password: '6951230Anacleta'
});

async function ejecutarSQLDirecto() {
  try {
    console.log('🔧 [EJECUTAR] SQL directo para corregir métodos de pago');
    console.log('====================================================');

    // 1. Verificar métodos actuales
    console.log('\n📊 MÉTODOS ACTUALES:');
    const metodosActuales = await pool.query('SELECT id_pago, descripcion, activo FROM metodos_pago ORDER BY id_pago');
    console.table(metodosActuales.rows);

    // 2. Eliminar constraint antigua si existe
    console.log('\n🗑️ ELIMINANDO CONSTRAINT ANTIGUA...');
    try {
      await pool.query('ALTER TABLE metodos_pago DROP CONSTRAINT IF EXISTS metodos_pago_descripcion_key');
      console.log('✅ Constraint antigua eliminada');
    } catch (error) {
      console.log('⚠️ Error eliminando constraint antigua:', error.message);
    }

    // 3. Agregar constraint única
    console.log('\n➕ AGREGANDO CONSTRAINT ÚNICA...');
    try {
      await pool.query('ALTER TABLE metodos_pago ADD CONSTRAINT IF NOT EXISTS metodos_pago_descripcion_unique UNIQUE(descripcion)');
      console.log('✅ Constraint única agregada');
    } catch (error) {
      console.log('❌ Error agregando constraint:', error.message);
    }

    // 4. Agregar método Efectivo
    console.log('\n💰 AGREGANDO MÉTODO EFECTIVO...');
    try {
      const efectivoResult = await pool.query(`
        INSERT INTO metodos_pago (descripcion, activo) 
        VALUES ('Efectivo', true) 
        ON CONFLICT (descripcion) 
        DO UPDATE SET activo = EXCLUDED.activo 
        RETURNING *
      `);
      console.log('✅ Efectivo agregado:', efectivoResult.rows[0]);
    } catch (error) {
      console.log('❌ Error agregando Efectivo:', error.message);
    }

    // 5. Agregar método Pago Diferido
    console.log('\n💳 AGREGANDO MÉTODO PAGO DIFERIDO...');
    try {
      const diferidoResult = await pool.query(`
        INSERT INTO metodos_pago (descripcion, activo) 
        VALUES ('Pago Diferido', true) 
        ON CONFLICT (descripcion) 
        DO UPDATE SET activo = EXCLUDED.activo 
        RETURNING *
      `);
      console.log('✅ Pago Diferido agregado:', diferidoResult.rows[0]);
    } catch (error) {
      console.log('❌ Error agregando Pago Diferido:', error.message);
    }

    // 6. Verificar resultado final
    console.log('\n📊 MÉTODOS FINALES:');
    const metodosFinales = await pool.query('SELECT id_pago, descripcion, activo FROM metodos_pago ORDER BY id_pago');
    console.table(metodosFinales.rows);

    // 7. Probar búsquedas
    console.log('\n🔍 PRUEBAS DE BÚSQUEDA:');
    const metodosPrueba = ['Efectivo', 'Tarjeta de Crédito', 'Pago Diferido'];
    
    for (const metodo of metodosPrueba) {
      try {
        const resultado = await pool.query('SELECT * FROM metodos_pago WHERE LOWER(descripcion) = LOWER($1) LIMIT 1', [metodo]);
        if (resultado.rows.length > 0) {
          console.log(`✅ "${metodo}": ENCONTRADO (ID: ${resultado.rows[0].id_pago})`);
        } else {
          console.log(`❌ "${metodo}": NO ENCONTRADO`);
        }
      } catch (error) {
        console.log(`❌ "${metodo}": ERROR - ${error.message}`);
      }
    }

    console.log('\n🎉 [COMPLETADO] Métodos de pago corregidos exitosamente');

  } catch (error) {
    console.error('❌ Error general:', error.message);
  } finally {
    await pool.end();
  }
}

ejecutarSQLDirecto();
