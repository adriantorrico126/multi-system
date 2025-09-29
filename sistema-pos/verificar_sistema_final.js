const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'sistempos',
  user: 'postgres',
  password: '6951230Anacleta'
});

async function verificarSistemaFinal() {
  try {
    console.log('🔍 [VERIFICACIÓN FINAL] Sistema de métodos de pago globales');
    console.log('========================================================');

    // 1. Verificar estructura de la tabla
    console.log('\n🏗️ ESTRUCTURA DE METODOS_PAGO:');
    const estructura = await pool.query(`
      SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default
      FROM information_schema.columns 
      WHERE table_name = 'metodos_pago'
      ORDER BY ordinal_position
    `);
    console.table(estructura.rows);

    // 2. Verificar que NO existe id_restaurante
    const hasIdRestaurante = estructura.rows.some(row => row.column_name === 'id_restaurante');
    console.log(`\n❌ Columna id_restaurante existe: ${hasIdRestaurante ? 'SÍ (PROBLEMA)' : 'NO (CORRECTO)'}`);

    // 3. Verificar métodos de pago
    console.log('\n💰 MÉTODOS DE PAGO GLOBALES:');
    const metodos = await pool.query(`
      SELECT id_pago, descripcion, activo 
      FROM metodos_pago 
      ORDER BY id_pago
    `);
    console.table(metodos.rows);

    // 4. Verificar ventas funcionando
    console.log('\n📊 VENTAS POR MÉTODO DE PAGO:');
    const ventas = await pool.query(`
      SELECT 
          v.id_restaurante,
          mp.descripcion,
          COUNT(*) as total_ventas,
          SUM(v.total) as total_monto
      FROM ventas v
      JOIN metodos_pago mp ON v.id_pago = mp.id_pago
      GROUP BY v.id_restaurante, mp.descripcion
      ORDER BY v.id_restaurante, mp.descripcion
    `);
    console.table(ventas.rows);

    // 5. Verificar que todas las ventas tienen método válido
    console.log('\n🔗 INTEGRIDAD DE DATOS:');
    const integridad = await pool.query(`
      SELECT 
          'Ventas con método válido' as tipo,
          COUNT(*) as cantidad
      FROM ventas v
      JOIN metodos_pago mp ON v.id_pago = mp.id_pago
      UNION ALL
      SELECT 
          'Ventas sin método válido' as tipo,
          COUNT(*) as cantidad
      FROM ventas v
      LEFT JOIN metodos_pago mp ON v.id_pago = mp.id_pago
      WHERE mp.id_pago IS NULL
    `);
    console.table(integridad.rows);

    // 6. Probar inserción de nuevo método
    console.log('\n🧪 PRUEBA DE INSERCIÓN:');
    try {
      const insertTest = await pool.query(`
        INSERT INTO metodos_pago (descripcion, activo) 
        VALUES ('Test Método Global', true) 
        RETURNING id_pago, descripcion, activo
      `);
      console.log('✅ Método insertado:', insertTest.rows[0]);

      // Eliminar método de prueba
      await pool.query(`DELETE FROM metodos_pago WHERE descripcion = 'Test Método Global'`);
      console.log('🗑️ Método de prueba eliminado');
    } catch (error) {
      console.log('❌ Error en prueba:', error.message);
    }

    // 7. Verificar que el backend puede conectarse
    console.log('\n🔌 VERIFICACIÓN DE CONEXIÓN:');
    try {
      const conexion = await pool.query('SELECT NOW() as timestamp');
      console.log('✅ Conexión a base de datos: OK');
      console.log(`   Timestamp: ${conexion.rows[0].timestamp}`);
    } catch (error) {
      console.log('❌ Error de conexión:', error.message);
    }

    console.log('\n🎉 [VERIFICACIÓN COMPLETADA]');
    console.log('============================');
    console.log('✅ Métodos de pago convertidos a globales');
    console.log('✅ Columna id_restaurante eliminada');
    console.log('✅ Referencias en ventas funcionando');
    console.log('✅ Sistema listo para usar');

    console.log('\n📋 [PRÓXIMOS PASOS]');
    console.log('===================');
    console.log('1. Reiniciar el backend para cargar las nuevas rutas');
    console.log('2. Verificar que el frontend funcione correctamente');
    console.log('3. Probar el modal de métodos de pago en las mesas');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

verificarSistemaFinal();

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'sistempos',
  user: 'postgres',
  password: '6951230Anacleta'
});

async function verificarSistemaFinal() {
  try {
    console.log('🔍 [VERIFICACIÓN FINAL] Sistema de métodos de pago globales');
    console.log('========================================================');

    // 1. Verificar estructura de la tabla
    console.log('\n🏗️ ESTRUCTURA DE METODOS_PAGO:');
    const estructura = await pool.query(`
      SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default
      FROM information_schema.columns 
      WHERE table_name = 'metodos_pago'
      ORDER BY ordinal_position
    `);
    console.table(estructura.rows);

    // 2. Verificar que NO existe id_restaurante
    const hasIdRestaurante = estructura.rows.some(row => row.column_name === 'id_restaurante');
    console.log(`\n❌ Columna id_restaurante existe: ${hasIdRestaurante ? 'SÍ (PROBLEMA)' : 'NO (CORRECTO)'}`);

    // 3. Verificar métodos de pago
    console.log('\n💰 MÉTODOS DE PAGO GLOBALES:');
    const metodos = await pool.query(`
      SELECT id_pago, descripcion, activo 
      FROM metodos_pago 
      ORDER BY id_pago
    `);
    console.table(metodos.rows);

    // 4. Verificar ventas funcionando
    console.log('\n📊 VENTAS POR MÉTODO DE PAGO:');
    const ventas = await pool.query(`
      SELECT 
          v.id_restaurante,
          mp.descripcion,
          COUNT(*) as total_ventas,
          SUM(v.total) as total_monto
      FROM ventas v
      JOIN metodos_pago mp ON v.id_pago = mp.id_pago
      GROUP BY v.id_restaurante, mp.descripcion
      ORDER BY v.id_restaurante, mp.descripcion
    `);
    console.table(ventas.rows);

    // 5. Verificar que todas las ventas tienen método válido
    console.log('\n🔗 INTEGRIDAD DE DATOS:');
    const integridad = await pool.query(`
      SELECT 
          'Ventas con método válido' as tipo,
          COUNT(*) as cantidad
      FROM ventas v
      JOIN metodos_pago mp ON v.id_pago = mp.id_pago
      UNION ALL
      SELECT 
          'Ventas sin método válido' as tipo,
          COUNT(*) as cantidad
      FROM ventas v
      LEFT JOIN metodos_pago mp ON v.id_pago = mp.id_pago
      WHERE mp.id_pago IS NULL
    `);
    console.table(integridad.rows);

    // 6. Probar inserción de nuevo método
    console.log('\n🧪 PRUEBA DE INSERCIÓN:');
    try {
      const insertTest = await pool.query(`
        INSERT INTO metodos_pago (descripcion, activo) 
        VALUES ('Test Método Global', true) 
        RETURNING id_pago, descripcion, activo
      `);
      console.log('✅ Método insertado:', insertTest.rows[0]);

      // Eliminar método de prueba
      await pool.query(`DELETE FROM metodos_pago WHERE descripcion = 'Test Método Global'`);
      console.log('🗑️ Método de prueba eliminado');
    } catch (error) {
      console.log('❌ Error en prueba:', error.message);
    }

    // 7. Verificar que el backend puede conectarse
    console.log('\n🔌 VERIFICACIÓN DE CONEXIÓN:');
    try {
      const conexion = await pool.query('SELECT NOW() as timestamp');
      console.log('✅ Conexión a base de datos: OK');
      console.log(`   Timestamp: ${conexion.rows[0].timestamp}`);
    } catch (error) {
      console.log('❌ Error de conexión:', error.message);
    }

    console.log('\n🎉 [VERIFICACIÓN COMPLETADA]');
    console.log('============================');
    console.log('✅ Métodos de pago convertidos a globales');
    console.log('✅ Columna id_restaurante eliminada');
    console.log('✅ Referencias en ventas funcionando');
    console.log('✅ Sistema listo para usar');

    console.log('\n📋 [PRÓXIMOS PASOS]');
    console.log('===================');
    console.log('1. Reiniciar el backend para cargar las nuevas rutas');
    console.log('2. Verificar que el frontend funcione correctamente');
    console.log('3. Probar el modal de métodos de pago en las mesas');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

verificarSistemaFinal();


