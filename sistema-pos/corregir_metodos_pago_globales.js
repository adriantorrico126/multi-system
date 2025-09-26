const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'sistempos',
  user: 'postgres',
  password: '6951230Anacleta'
});

async function corregirMetodosPago() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 [CORRECCIÓN] Convirtiendo métodos de pago a globales');
    console.log('======================================================');

    await client.query('BEGIN');

    // 1. Crear tabla temporal con métodos únicos globales
    console.log('📋 Creando métodos de pago globales...');
    await client.query(`
      CREATE TEMP TABLE metodos_pago_globales AS
      SELECT DISTINCT ON (descripcion)
          descripcion,
          CASE 
              WHEN descripcion IN ('Efectivo', 'Tarjeta de Crédito', 'Tarjeta de Débito', 'Transferencia', 'Pago Móvil') 
              THEN true 
              ELSE false 
          END as activo
      FROM metodos_pago
      WHERE descripcion NOT LIKE '%Diferido%'
      ORDER BY descripcion, activo DESC
    `);

    // 2. Agregar métodos que faltan
    const metodosBase = ['Efectivo', 'Tarjeta de Crédito', 'Tarjeta de Débito', 'Transferencia', 'Pago Móvil'];
    
    for (const metodo of metodosBase) {
      await client.query(`
        INSERT INTO metodos_pago_globales (descripcion, activo)
        SELECT $1, true
        WHERE NOT EXISTS (SELECT 1 FROM metodos_pago_globales WHERE descripcion = $1)
      `, [metodo]);
    }

    // 3. Crear tabla de mapeo
    console.log('🗺️ Creando mapeo de IDs...');
    await client.query(`
      CREATE TEMP TABLE mapeo_ids AS
      WITH nuevos_ids AS (
          SELECT 
              ROW_NUMBER() OVER (ORDER BY descripcion) as nuevo_id,
              descripcion
          FROM metodos_pago_globales
      )
      SELECT 
          mp.id_pago as id_antiguo,
          ni.nuevo_id as id_nuevo,
          mp.descripcion
      FROM metodos_pago mp
      JOIN nuevos_ids ni ON mp.descripcion = ni.descripcion
    `);

    // 4. Actualizar referencias en ventas
    console.log('💰 Actualizando referencias en ventas...');
    const updateResult = await client.query(`
      UPDATE ventas 
      SET id_pago = m.id_nuevo
      FROM mapeo_ids m
      WHERE ventas.id_pago = m.id_antiguo
    `);
    console.log(`✅ Actualizadas ${updateResult.rowCount} ventas`);

    // 5. Backup y recrear tabla
    console.log('💾 Creando backup y recreando tabla...');
    await client.query('DROP TABLE IF EXISTS metodos_pago_backup');
    await client.query('ALTER TABLE metodos_pago RENAME TO metodos_pago_backup');

    // 6. Crear nueva tabla sin id_restaurante
    await client.query(`
      CREATE TABLE metodos_pago (
          id_pago SERIAL PRIMARY KEY,
          descripcion VARCHAR(100) NOT NULL UNIQUE,
          activo BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // 7. Insertar métodos globales
    await client.query(`
      INSERT INTO metodos_pago (id_pago, descripcion, activo)
      SELECT 
          ROW_NUMBER() OVER (ORDER BY descripcion) as id_pago,
          descripcion,
          activo
      FROM metodos_pago_globales
    `);

    // 8. Actualizar secuencia
    await client.query(`SELECT setval('metodos_pago_id_pago_seq', (SELECT MAX(id_pago) FROM metodos_pago))`);

    await client.query('COMMIT');

    // 9. Verificar resultado
    console.log('\n✅ CORRECCIÓN COMPLETADA');
    console.log('\n📋 MÉTODOS DE PAGO FINALES:');
    const metodosResult = await client.query('SELECT id_pago, descripcion, activo FROM metodos_pago ORDER BY id_pago');
    console.table(metodosResult.rows);

    console.log('\n💰 VENTAS POR MÉTODO DE PAGO:');
    const ventasResult = await client.query(`
      SELECT 
          v.id_restaurante,
          mp.descripcion,
          COUNT(*) as total_ventas
      FROM ventas v
      JOIN metodos_pago mp ON v.id_pago = mp.id_pago
      GROUP BY v.id_restaurante, mp.descripcion
      ORDER BY v.id_restaurante, mp.descripcion
    `);
    console.table(ventasResult.rows);

    console.log('\n🎉 MÉTODOS DE PAGO AHORA SON GLOBALES');
    console.log('• Todos los restaurantes pueden usar los mismos métodos');
    console.log('• No más duplicación de métodos por restaurante');
    console.log('• Tabla backup creada como metodos_pago_backup');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error durante la corrección:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

corregirMetodosPago().catch(console.error);
