const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'sistempos',
  user: 'postgres',
  password: '6951230Anacleta'
});

async function verificarMetodosPagoDB() {
  try {
    console.log('🔍 [VERIFICACIÓN] Métodos de pago en base de datos');
    console.log('================================================');

    // 1. Verificar estructura de la tabla
    console.log('\n🏗️ ESTRUCTURA DE LA TABLA:');
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

    // 2. Verificar métodos de pago disponibles
    console.log('\n💰 MÉTODOS DE PAGO DISPONIBLES:');
    const metodos = await pool.query(`
      SELECT id_pago, descripcion, activo, created_at 
      FROM metodos_pago 
      ORDER BY id_pago
    `);
    console.table(metodos.rows);

    // 3. Probar búsqueda por descripción (como lo hace el backend)
    console.log('\n🔍 PRUEBAS DE BÚSQUEDA:');
    
    const metodosPrueba = ['Efectivo', 'efectivo', 'Tarjeta', 'Transferencia', 'Pago Diferido'];
    
    for (const metodo of metodosPrueba) {
      try {
        const resultado = await pool.query(
          'SELECT * FROM metodos_pago WHERE LOWER(descripcion) = LOWER($1) LIMIT 1', 
          [metodo]
        );
        console.log(`✅ "${metodo}": ${resultado.rows.length > 0 ? 'ENCONTRADO' : 'NO ENCONTRADO'}`);
        if (resultado.rows.length > 0) {
          console.log(`   ID: ${resultado.rows[0].id_pago}, Activo: ${resultado.rows[0].activo}`);
        }
      } catch (error) {
        console.log(`❌ "${metodo}": ERROR - ${error.message}`);
      }
    }

    // 4. Intentar insertar un método de prueba
    console.log('\n🧪 PRUEBA DE INSERCIÓN:');
    try {
      const insertResult = await pool.query(`
        INSERT INTO metodos_pago (descripcion, activo) 
        VALUES ('Test Método', true) 
        ON CONFLICT (descripcion) DO UPDATE SET activo = EXCLUDED.activo 
        RETURNING *
      `);
      console.log('✅ Inserción exitosa:', insertResult.rows[0]);
      
      // Eliminar método de prueba
      await pool.query(`DELETE FROM metodos_pago WHERE descripcion = 'Test Método'`);
      console.log('🗑️ Método de prueba eliminado');
    } catch (error) {
      console.log('❌ Error en inserción:', error.message);
    }

    // 5. Verificar constraints
    console.log('\n🔒 CONSTRAINTS DE LA TABLA:');
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

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

verificarMetodosPagoDB();
