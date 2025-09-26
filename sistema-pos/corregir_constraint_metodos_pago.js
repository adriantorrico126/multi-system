const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'sistempos',
  user: 'postgres',
  password: '6951230Anacleta'
});

async function corregirConstraintMetodosPago() {
  try {
    console.log('🔧 [CORREGIR] Constraint de métodos de pago');
    console.log('=========================================');

    // 1. Verificar constraints actuales
    console.log('\n🔍 CONSTRAINTS ACTUALES:');
    const constraints = await pool.query(`
      SELECT 
          tc.constraint_name,
          tc.constraint_type,
          kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_name = 'metodos_pago'
      ORDER BY tc.constraint_name
    `);
    console.table(constraints.rows);

    // 2. Eliminar constraint antigua si existe
    console.log('\n🗑️ ELIMINANDO CONSTRAINTS ANTIGUAS...');
    try {
      await pool.query(`ALTER TABLE metodos_pago DROP CONSTRAINT IF EXISTS metodos_pago_descripcion_key;`);
      console.log('✅ Constraint antigua eliminada');
    } catch (error) {
      console.log('⚠️ No había constraint antigua:', error.message);
    }

    // 3. Agregar constraint única en descripcion
    console.log('\n➕ AGREGANDO CONSTRAINT ÚNICA...');
    try {
      await pool.query(`ALTER TABLE metodos_pago ADD CONSTRAINT metodos_pago_descripcion_unique UNIQUE(descripcion);`);
      console.log('✅ Constraint única agregada en descripcion');
    } catch (error) {
      console.log('❌ Error agregando constraint:', error.message);
    }

    // 4. Verificar constraints después del cambio
    console.log('\n🔍 CONSTRAINTS DESPUÉS DEL CAMBIO:');
    const constraintsAfter = await pool.query(`
      SELECT 
          tc.constraint_name,
          tc.constraint_type,
          kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_name = 'metodos_pago'
      ORDER BY tc.constraint_name
    `);
    console.table(constraintsAfter.rows);

    // 5. Agregar métodos de pago faltantes
    console.log('\n💰 AGREGANDO MÉTODOS FALTANTES...');
    const metodosFaltantes = [
      { descripcion: 'Efectivo', activo: true },
      { descripcion: 'Pago Diferido', activo: true }
    ];

    for (const metodo of metodosFaltantes) {
      try {
        const result = await pool.query(`
          INSERT INTO metodos_pago (descripcion, activo) 
          VALUES ($1, $2) 
          ON CONFLICT (descripcion) 
          DO UPDATE SET activo = EXCLUDED.activo 
          RETURNING *
        `, [metodo.descripcion, metodo.activo]);

        console.log(`✅ ${metodo.descripcion}: Agregado/Actualizado`);
        if (result.rows.length > 0) {
          console.log(`   ID: ${result.rows[0].id_pago}`);
        }
      } catch (error) {
        console.log(`❌ ${metodo.descripcion}: Error - ${error.message}`);
      }
    }

    // 6. Verificar resultado final
    console.log('\n📊 MÉTODOS DE PAGO FINALES:');
    const metodosFinales = await pool.query(`
      SELECT id_pago, descripcion, activo 
      FROM metodos_pago 
      ORDER BY id_pago
    `);
    console.table(metodosFinales.rows);

    // 7. Probar búsquedas
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

    console.log('\n🎉 [COMPLETADO] Constraint corregida y métodos agregados');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

corregirConstraintMetodosPago();
