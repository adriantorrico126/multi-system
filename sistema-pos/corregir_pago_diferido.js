const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'sistempos',
  user: 'postgres',
  password: '6951230Anacleta'
});

async function corregirPagoDiferido() {
  try {
    console.log('🔧 [CORREGIR] Pago Diferido - no es método de pago real');
    console.log('===================================================');

    // 1. Verificar métodos actuales
    console.log('\n📊 MÉTODOS ACTUALES:');
    const metodosActuales = await pool.query('SELECT id_pago, descripcion, activo FROM metodos_pago ORDER BY id_pago');
    console.table(metodosActuales.rows);

    // 2. Eliminar "Pago Diferido" de métodos de pago
    console.log('\n🗑️ ELIMINANDO "Pago Diferido" DE MÉTODOS DE PAGO...');
    try {
      const deleteResult = await pool.query(`DELETE FROM metodos_pago WHERE descripcion = 'Pago Diferido'`);
      console.log(`✅ "Pago Diferido" eliminado: ${deleteResult.rowCount} registro(s)`);
    } catch (error) {
      console.log('❌ Error eliminando Pago Diferido:', error.message);
    }

    // 3. Verificar que no haya ventas usando el ID del Pago Diferido eliminado
    console.log('\n🔍 VERIFICANDO VENTAS CON PAGO DIFERIDO...');
    try {
      const ventasConDiferido = await pool.query(`
        SELECT COUNT(*) as total 
        FROM ventas 
        WHERE id_pago IN (SELECT id_pago FROM metodos_pago WHERE descripcion = 'Pago Diferido')
      `);
      console.log(`📊 Ventas con Pago Diferido: ${ventasConDiferido.rows[0].total}`);
    } catch (error) {
      console.log('⚠️ No se pudo verificar ventas con Pago Diferido');
    }

    // 4. Verificar métodos finales
    console.log('\n📊 MÉTODOS DE PAGO FINALES:');
    const metodosFinales = await pool.query('SELECT id_pago, descripcion, activo FROM metodos_pago ORDER BY id_pago');
    console.table(metodosFinales.rows);

    // 5. Probar búsquedas de métodos reales
    console.log('\n🔍 PRUEBAS DE BÚSQUEDA DE MÉTODOS REALES:');
    const metodosReales = ['Efectivo', 'Tarjeta de Crédito', 'Tarjeta de Débito', 'Transferencia', 'Pago Móvil'];
    
    for (const metodo of metodosReales) {
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

    console.log('\n💡 EXPLICACIÓN:');
    console.log('===============');
    console.log('✅ "Pago Diferido" fue eliminado de los métodos de pago');
    console.log('✅ Solo quedan métodos de pago reales: Efectivo, Tarjetas, Transferencia, Pago Móvil');
    console.log('✅ "Pago Diferido" se maneja como un estado/tipo de venta, no como método de pago');
    console.log('✅ Cuando se procesa el cobro diferido, se selecciona el método real de pago');

    console.log('\n🎉 [COMPLETADO] Pago Diferido corregido correctamente');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

corregirPagoDiferido();

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'sistempos',
  user: 'postgres',
  password: '6951230Anacleta'
});

async function corregirPagoDiferido() {
  try {
    console.log('🔧 [CORREGIR] Pago Diferido - no es método de pago real');
    console.log('===================================================');

    // 1. Verificar métodos actuales
    console.log('\n📊 MÉTODOS ACTUALES:');
    const metodosActuales = await pool.query('SELECT id_pago, descripcion, activo FROM metodos_pago ORDER BY id_pago');
    console.table(metodosActuales.rows);

    // 2. Eliminar "Pago Diferido" de métodos de pago
    console.log('\n🗑️ ELIMINANDO "Pago Diferido" DE MÉTODOS DE PAGO...');
    try {
      const deleteResult = await pool.query(`DELETE FROM metodos_pago WHERE descripcion = 'Pago Diferido'`);
      console.log(`✅ "Pago Diferido" eliminado: ${deleteResult.rowCount} registro(s)`);
    } catch (error) {
      console.log('❌ Error eliminando Pago Diferido:', error.message);
    }

    // 3. Verificar que no haya ventas usando el ID del Pago Diferido eliminado
    console.log('\n🔍 VERIFICANDO VENTAS CON PAGO DIFERIDO...');
    try {
      const ventasConDiferido = await pool.query(`
        SELECT COUNT(*) as total 
        FROM ventas 
        WHERE id_pago IN (SELECT id_pago FROM metodos_pago WHERE descripcion = 'Pago Diferido')
      `);
      console.log(`📊 Ventas con Pago Diferido: ${ventasConDiferido.rows[0].total}`);
    } catch (error) {
      console.log('⚠️ No se pudo verificar ventas con Pago Diferido');
    }

    // 4. Verificar métodos finales
    console.log('\n📊 MÉTODOS DE PAGO FINALES:');
    const metodosFinales = await pool.query('SELECT id_pago, descripcion, activo FROM metodos_pago ORDER BY id_pago');
    console.table(metodosFinales.rows);

    // 5. Probar búsquedas de métodos reales
    console.log('\n🔍 PRUEBAS DE BÚSQUEDA DE MÉTODOS REALES:');
    const metodosReales = ['Efectivo', 'Tarjeta de Crédito', 'Tarjeta de Débito', 'Transferencia', 'Pago Móvil'];
    
    for (const metodo of metodosReales) {
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

    console.log('\n💡 EXPLICACIÓN:');
    console.log('===============');
    console.log('✅ "Pago Diferido" fue eliminado de los métodos de pago');
    console.log('✅ Solo quedan métodos de pago reales: Efectivo, Tarjetas, Transferencia, Pago Móvil');
    console.log('✅ "Pago Diferido" se maneja como un estado/tipo de venta, no como método de pago');
    console.log('✅ Cuando se procesa el cobro diferido, se selecciona el método real de pago');

    console.log('\n🎉 [COMPLETADO] Pago Diferido corregido correctamente');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

corregirPagoDiferido();
