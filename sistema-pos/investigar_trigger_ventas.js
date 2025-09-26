const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'sistempos',
  user: 'postgres',
  password: '6951230Anacleta'
});

async function investigarTriggerVentas() {
  try {
    console.log('🔍 [INVESTIGACIÓN] Trigger de validación de ventas');
    console.log('================================================');

    // 1. Buscar la función validate_venta_integrity
    console.log('\n📋 FUNCIÓN DE VALIDACIÓN:');
    const funcionQuery = `
      SELECT 
          proname as function_name,
          prosrc as function_body
      FROM pg_proc 
      WHERE proname LIKE '%validate_venta%'
    `;
    const funcionResult = await pool.query(funcionQuery);
    console.table(funcionResult.rows);

    // 2. Buscar triggers relacionados con ventas
    console.log('\n🔗 TRIGGERS EN TABLA VENTAS:');
    const triggersQuery = `
      SELECT 
          tgname as trigger_name,
          tgrelid::regclass as table_name,
          proname as function_name
      FROM pg_trigger t
      JOIN pg_proc p ON t.tgfoid = p.oid
      WHERE tgrelid::regclass::text = 'ventas'
    `;
    const triggersResult = await pool.query(triggersQuery);
    console.table(triggersResult.rows);

    // 3. Verificar estados de ventas actuales
    console.log('\n📊 ESTADOS DE VENTAS ACTUALES:');
    const estadosQuery = `
      SELECT 
          estado,
          COUNT(*) as cantidad
      FROM ventas 
      GROUP BY estado
      ORDER BY cantidad DESC
    `;
    const estadosResult = await pool.query(estadosQuery);
    console.table(estadosResult.rows);

    // 4. Buscar ventas con estado problemático
    console.log('\n⚠️ VENTAS CON ESTADO PROBLEMÁTICO:');
    const problemQuery = `
      SELECT 
          id_venta,
          estado,
          fecha,
          total,
          id_restaurante
      FROM ventas 
      WHERE estado = 'pendiente_aprobacion'
      LIMIT 10
    `;
    const problemResult = await pool.query(problemQuery);
    console.table(problemResult.rows);

    // 5. Verificar si hay restricciones en la columna estado
    console.log('\n🔒 RESTRICCIONES EN COLUMNA ESTADO:');
    const restriccionesQuery = `
      SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default
      FROM information_schema.columns 
      WHERE table_name = 'ventas' 
      AND column_name = 'estado'
    `;
    const restriccionesResult = await pool.query(restriccionesQuery);
    console.table(restriccionesResult.rows);

    console.log('\n💡 RECOMENDACIÓN:');
    console.log('Si hay un trigger que valida estados, necesitamos:');
    console.log('1. Deshabilitar temporalmente el trigger');
    console.log('2. Ejecutar la actualización');
    console.log('3. Rehabilitar el trigger');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

investigarTriggerVentas();
