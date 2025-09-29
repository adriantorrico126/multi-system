const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'sistempos',
  user: 'postgres',
  password: '6951230Anacleta'
});

async function limpiarTotalesForzado() {
  try {
    console.log('🧹 [LIMPIEZA FORZADA] Iniciando limpieza de totales acumulados...\n');

    // 1. Verificar estado actual
    console.log('📋 ESTADO ANTES DE LIMPIAR:');
    const mesasAntesQuery = `
      SELECT numero, estado, total_acumulado, id_venta_actual, hora_apertura
      FROM mesas 
      WHERE id_restaurante = 1
      ORDER BY numero
    `;
    const mesasAntesResult = await pool.query(mesasAntesQuery);
    console.table(mesasAntesResult.rows);

    // 2. Limpiar TODOS los totales acumulados de mesas libres
    console.log('\n🧹 LIMPIANDO TOTALES DE MESAS LIBRES...');
    const limpiarQuery = `
      UPDATE mesas 
      SET 
        total_acumulado = 0,
        id_venta_actual = NULL,
        hora_apertura = NULL,
        hora_cierre = NULL
      WHERE id_restaurante = 1 
        AND estado = 'libre'
    `;
    const limpiarResult = await pool.query(limpiarQuery);
    console.log(`✅ Mesas libres limpiadas: ${limpiarResult.rowCount}`);

    // 3. Verificar estado después
    console.log('\n📋 ESTADO DESPUÉS DE LIMPIAR:');
    const mesasDespuesQuery = `
      SELECT numero, estado, total_acumulado, id_venta_actual, hora_apertura
      FROM mesas 
      WHERE id_restaurante = 1
      ORDER BY numero
    `;
    const mesasDespuesResult = await pool.query(mesasDespuesQuery);
    console.table(mesasDespuesResult.rows);

    // 4. Verificar ventas activas
    console.log('\n📦 VENTAS ACTIVAS:');
    const ventasActivasQuery = `
      SELECT 
        id_venta,
        mesa_numero,
        estado,
        total,
        fecha
      FROM ventas 
      WHERE id_restaurante = 1 
        AND estado IN ('abierta', 'en_uso', 'pendiente_cobro', 'entregado', 'recibido')
        AND mesa_numero IS NOT NULL
      ORDER BY mesa_numero, fecha DESC
    `;
    const ventasActivasResult = await pool.query(ventasActivasQuery);
    console.table(ventasActivasResult.rows);

    console.log('\n✅ Limpieza forzada completada');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

limpiarTotalesForzado();

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'sistempos',
  user: 'postgres',
  password: '6951230Anacleta'
});

async function limpiarTotalesForzado() {
  try {
    console.log('🧹 [LIMPIEZA FORZADA] Iniciando limpieza de totales acumulados...\n');

    // 1. Verificar estado actual
    console.log('📋 ESTADO ANTES DE LIMPIAR:');
    const mesasAntesQuery = `
      SELECT numero, estado, total_acumulado, id_venta_actual, hora_apertura
      FROM mesas 
      WHERE id_restaurante = 1
      ORDER BY numero
    `;
    const mesasAntesResult = await pool.query(mesasAntesQuery);
    console.table(mesasAntesResult.rows);

    // 2. Limpiar TODOS los totales acumulados de mesas libres
    console.log('\n🧹 LIMPIANDO TOTALES DE MESAS LIBRES...');
    const limpiarQuery = `
      UPDATE mesas 
      SET 
        total_acumulado = 0,
        id_venta_actual = NULL,
        hora_apertura = NULL,
        hora_cierre = NULL
      WHERE id_restaurante = 1 
        AND estado = 'libre'
    `;
    const limpiarResult = await pool.query(limpiarQuery);
    console.log(`✅ Mesas libres limpiadas: ${limpiarResult.rowCount}`);

    // 3. Verificar estado después
    console.log('\n📋 ESTADO DESPUÉS DE LIMPIAR:');
    const mesasDespuesQuery = `
      SELECT numero, estado, total_acumulado, id_venta_actual, hora_apertura
      FROM mesas 
      WHERE id_restaurante = 1
      ORDER BY numero
    `;
    const mesasDespuesResult = await pool.query(mesasDespuesQuery);
    console.table(mesasDespuesResult.rows);

    // 4. Verificar ventas activas
    console.log('\n📦 VENTAS ACTIVAS:');
    const ventasActivasQuery = `
      SELECT 
        id_venta,
        mesa_numero,
        estado,
        total,
        fecha
      FROM ventas 
      WHERE id_restaurante = 1 
        AND estado IN ('abierta', 'en_uso', 'pendiente_cobro', 'entregado', 'recibido')
        AND mesa_numero IS NOT NULL
      ORDER BY mesa_numero, fecha DESC
    `;
    const ventasActivasResult = await pool.query(ventasActivasQuery);
    console.table(ventasActivasResult.rows);

    console.log('\n✅ Limpieza forzada completada');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

limpiarTotalesForzado();


