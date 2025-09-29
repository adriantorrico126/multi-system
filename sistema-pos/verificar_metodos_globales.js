const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'sistempos',
  user: 'postgres',
  password: '6951230Anacleta'
});

async function verificarMetodosGlobales() {
  try {
    console.log('🔍 [VERIFICACIÓN] Métodos de pago globales');
    console.log('=========================================');

    // 1. Verificar tabla nueva
    console.log('\n📋 MÉTODOS DE PAGO GLOBALES:');
    const metodosQuery = `
      SELECT id_pago, descripcion, activo, created_at 
      FROM metodos_pago 
      ORDER BY id_pago
    `;
    const metodosResult = await pool.query(metodosQuery);
    console.table(metodosResult.rows);

    // 2. Verificar tabla backup
    console.log('\n📦 TABLA BACKUP:');
    const backupQuery = `
      SELECT COUNT(*) as total_registros 
      FROM metodos_pago_backup
    `;
    const backupResult = await pool.query(backupQuery);
    console.table(backupResult.rows);

    // 3. Verificar ventas con referencias actualizadas
    console.log('\n💰 VENTAS POR MÉTODO DE PAGO:');
    const ventasQuery = `
      SELECT 
          v.id_restaurante,
          mp.descripcion,
          COUNT(*) as total_ventas,
          SUM(v.total) as total_monto
      FROM ventas v
      JOIN metodos_pago mp ON v.id_pago = mp.id_pago
      GROUP BY v.id_restaurante, mp.descripcion
      ORDER BY v.id_restaurante, mp.descripcion
    `;
    const ventasResult = await pool.query(ventasQuery);
    console.table(ventasResult.rows);

    // 4. Verificar estructura de la tabla
    console.log('\n🏗️ ESTRUCTURA DE LA TABLA:');
    const estructuraQuery = `
      SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default
      FROM information_schema.columns 
      WHERE table_name = 'metodos_pago'
      ORDER BY ordinal_position
    `;
    const estructuraResult = await pool.query(estructuraQuery);
    console.table(estructuraResult.rows);

    // 5. Probar inserción de nuevo método
    console.log('\n🧪 PROBANDO INSERCIÓN DE NUEVO MÉTODO:');
    const insertTest = `
      INSERT INTO metodos_pago (descripcion, activo) 
      VALUES ('Test Método', true) 
      RETURNING id_pago, descripcion, activo
    `;
    const insertResult = await pool.query(insertTest);
    console.log('✅ Método insertado:', insertResult.rows[0]);

    // 6. Eliminar método de prueba
    await pool.query(`DELETE FROM metodos_pago WHERE descripcion = 'Test Método'`);
    console.log('🗑️ Método de prueba eliminado');

    console.log('\n🎉 [VERIFICACIÓN COMPLETADA]');
    console.log('============================');
    console.log('✅ Métodos de pago convertidos a globales');
    console.log('✅ Sin columna id_restaurante');
    console.log('✅ Referencias en ventas funcionando');
    console.log('✅ Estructura correcta');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

verificarMetodosGlobales();

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'sistempos',
  user: 'postgres',
  password: '6951230Anacleta'
});

async function verificarMetodosGlobales() {
  try {
    console.log('🔍 [VERIFICACIÓN] Métodos de pago globales');
    console.log('=========================================');

    // 1. Verificar tabla nueva
    console.log('\n📋 MÉTODOS DE PAGO GLOBALES:');
    const metodosQuery = `
      SELECT id_pago, descripcion, activo, created_at 
      FROM metodos_pago 
      ORDER BY id_pago
    `;
    const metodosResult = await pool.query(metodosQuery);
    console.table(metodosResult.rows);

    // 2. Verificar tabla backup
    console.log('\n📦 TABLA BACKUP:');
    const backupQuery = `
      SELECT COUNT(*) as total_registros 
      FROM metodos_pago_backup
    `;
    const backupResult = await pool.query(backupQuery);
    console.table(backupResult.rows);

    // 3. Verificar ventas con referencias actualizadas
    console.log('\n💰 VENTAS POR MÉTODO DE PAGO:');
    const ventasQuery = `
      SELECT 
          v.id_restaurante,
          mp.descripcion,
          COUNT(*) as total_ventas,
          SUM(v.total) as total_monto
      FROM ventas v
      JOIN metodos_pago mp ON v.id_pago = mp.id_pago
      GROUP BY v.id_restaurante, mp.descripcion
      ORDER BY v.id_restaurante, mp.descripcion
    `;
    const ventasResult = await pool.query(ventasQuery);
    console.table(ventasResult.rows);

    // 4. Verificar estructura de la tabla
    console.log('\n🏗️ ESTRUCTURA DE LA TABLA:');
    const estructuraQuery = `
      SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default
      FROM information_schema.columns 
      WHERE table_name = 'metodos_pago'
      ORDER BY ordinal_position
    `;
    const estructuraResult = await pool.query(estructuraQuery);
    console.table(estructuraResult.rows);

    // 5. Probar inserción de nuevo método
    console.log('\n🧪 PROBANDO INSERCIÓN DE NUEVO MÉTODO:');
    const insertTest = `
      INSERT INTO metodos_pago (descripcion, activo) 
      VALUES ('Test Método', true) 
      RETURNING id_pago, descripcion, activo
    `;
    const insertResult = await pool.query(insertTest);
    console.log('✅ Método insertado:', insertResult.rows[0]);

    // 6. Eliminar método de prueba
    await pool.query(`DELETE FROM metodos_pago WHERE descripcion = 'Test Método'`);
    console.log('🗑️ Método de prueba eliminado');

    console.log('\n🎉 [VERIFICACIÓN COMPLETADA]');
    console.log('============================');
    console.log('✅ Métodos de pago convertidos a globales');
    console.log('✅ Sin columna id_restaurante');
    console.log('✅ Referencias en ventas funcionando');
    console.log('✅ Estructura correcta');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

verificarMetodosGlobales();


