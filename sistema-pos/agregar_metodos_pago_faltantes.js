const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'sistempos',
  user: 'postgres',
  password: '6951230Anacleta'
});

async function agregarMetodosPagoFaltantes() {
  try {
    console.log('🔧 [AGREGAR] Métodos de pago faltantes');
    console.log('=====================================');

    // Métodos de pago estándar que deberían existir
    const metodosPago = [
      { descripcion: 'Efectivo', activo: true },
      { descripcion: 'Tarjeta de Crédito', activo: true },
      { descripcion: 'Tarjeta de Débito', activo: true },
      { descripcion: 'Transferencia', activo: true },
      { descripcion: 'Pago Móvil', activo: true },
      { descripcion: 'Pago Diferido', activo: true }
    ];

    console.log('\n📋 Métodos a agregar:');
    metodosPago.forEach((metodo, index) => {
      console.log(`${index + 1}. ${metodo.descripcion} (${metodo.activo ? 'Activo' : 'Inactivo'})`);
    });

    console.log('\n🔨 Agregando métodos de pago...');

    for (const metodo of metodosPago) {
      try {
        // Intentar insertar, si ya existe, actualizar el estado activo
        const result = await pool.query(`
          INSERT INTO metodos_pago (descripcion, activo) 
          VALUES ($1, $2) 
          ON CONFLICT (descripcion) 
          DO UPDATE SET activo = EXCLUDED.activo 
          RETURNING *
        `, [metodo.descripcion, metodo.activo]);

        console.log(`✅ ${metodo.descripcion}: ${result.rows.length > 0 ? 'Agregado/Actualizado' : 'Ya existía'}`);
        if (result.rows.length > 0) {
          console.log(`   ID: ${result.rows[0].id_pago}, Activo: ${result.rows[0].activo}`);
        }
      } catch (error) {
        console.log(`❌ ${metodo.descripcion}: Error - ${error.message}`);
      }
    }

    // Verificar resultado final
    console.log('\n📊 MÉTODOS DE PAGO FINALES:');
    const metodosFinales = await pool.query(`
      SELECT id_pago, descripcion, activo 
      FROM metodos_pago 
      ORDER BY id_pago
    `);
    console.table(metodosFinales.rows);

    // Probar búsquedas comunes
    console.log('\n🔍 PRUEBAS DE BÚSQUEDA:');
    const metodosPrueba = ['Efectivo', 'Tarjeta de Crédito', 'Pago Diferido'];
    
    for (const metodo of metodosPrueba) {
      try {
        const resultado = await pool.query(
          'SELECT * FROM metodos_pago WHERE LOWER(descripcion) = LOWER($1) LIMIT 1', 
          [metodo]
        );
        if (resultado.rows.length > 0) {
          console.log(`✅ "${metodo}": ENCONTRADO (ID: ${resultado.rows[0].id_pago})`);
        } else {
          console.log(`❌ "${metodo}": NO ENCONTRADO`);
        }
      } catch (error) {
        console.log(`❌ "${metodo}": ERROR - ${error.message}`);
      }
    }

    console.log('\n🎉 [COMPLETADO] Métodos de pago agregados exitosamente');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

agregarMetodosPagoFaltantes();
