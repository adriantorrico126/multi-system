const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'sistempos',
  user: 'postgres',
  password: '6951230Anacleta'
});

async function verificarYLimpiarMesas() {
  try {
    console.log('🔍 [VERIFICACIÓN Y LIMPIEZA] Iniciando...\n');

    // 1. Verificar estado actual de todas las mesas
    console.log('📋 ESTADO ACTUAL DE TODAS LAS MESAS:');
    const todasLasMesasQuery = `
      SELECT 
        numero,
        estado,
        total_acumulado,
        id_venta_actual,
        hora_apertura
      FROM mesas 
      WHERE id_restaurante = 1
      ORDER BY numero
    `;
    const todasLasMesasResult = await pool.query(todasLasMesasQuery);
    console.table(todasLasMesasResult.rows);

    // 2. Verificar mesas libres con totales
    console.log('\n🔍 MESAS LIBRES CON TOTALES:');
    const mesasLibresConTotalesQuery = `
      SELECT numero, estado, total_acumulado, id_venta_actual
      FROM mesas 
      WHERE id_restaurante = 1 
        AND estado = 'libre' 
        AND total_acumulado > 0
      ORDER BY numero
    `;
    const mesasLibresConTotalesResult = await pool.query(mesasLibresConTotalesQuery);
    
    if (mesasLibresConTotalesResult.rows.length > 0) {
      console.table(mesasLibresConTotalesResult.rows);
      
      // 3. Limpiar totales de mesas libres
      console.log('\n🧹 LIMPIANDO TOTALES DE MESAS LIBRES...');
      const limpiarQuery = `
        UPDATE mesas 
        SET 
          total_acumulado = 0,
          id_venta_actual = NULL,
          hora_apertura = NULL
        WHERE id_restaurante = 1 
          AND estado = 'libre'
          AND total_acumulado > 0
      `;
      const limpiarResult = await pool.query(limpiarQuery);
      console.log(`✅ Total de mesas libres limpiadas: ${limpiarResult.rowCount}`);
      
    } else {
      console.log('✅ No hay mesas libres con totales acumulados');
    }

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

    // 5. Verificar estado final
    console.log('\n📋 ESTADO FINAL DE MESAS:');
    const estadoFinalQuery = `
      SELECT 
        numero,
        estado,
        total_acumulado,
        id_venta_actual
      FROM mesas 
      WHERE id_restaurante = 1
      ORDER BY numero
    `;
    const estadoFinalResult = await pool.query(estadoFinalQuery);
    console.table(estadoFinalResult.rows);

    console.log('\n✅ Verificación y limpieza completada');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

verificarYLimpiarMesas();

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'sistempos',
  user: 'postgres',
  password: '6951230Anacleta'
});

async function verificarYLimpiarMesas() {
  try {
    console.log('🔍 [VERIFICACIÓN Y LIMPIEZA] Iniciando...\n');

    // 1. Verificar estado actual de todas las mesas
    console.log('📋 ESTADO ACTUAL DE TODAS LAS MESAS:');
    const todasLasMesasQuery = `
      SELECT 
        numero,
        estado,
        total_acumulado,
        id_venta_actual,
        hora_apertura
      FROM mesas 
      WHERE id_restaurante = 1
      ORDER BY numero
    `;
    const todasLasMesasResult = await pool.query(todasLasMesasQuery);
    console.table(todasLasMesasResult.rows);

    // 2. Verificar mesas libres con totales
    console.log('\n🔍 MESAS LIBRES CON TOTALES:');
    const mesasLibresConTotalesQuery = `
      SELECT numero, estado, total_acumulado, id_venta_actual
      FROM mesas 
      WHERE id_restaurante = 1 
        AND estado = 'libre' 
        AND total_acumulado > 0
      ORDER BY numero
    `;
    const mesasLibresConTotalesResult = await pool.query(mesasLibresConTotalesQuery);
    
    if (mesasLibresConTotalesResult.rows.length > 0) {
      console.table(mesasLibresConTotalesResult.rows);
      
      // 3. Limpiar totales de mesas libres
      console.log('\n🧹 LIMPIANDO TOTALES DE MESAS LIBRES...');
      const limpiarQuery = `
        UPDATE mesas 
        SET 
          total_acumulado = 0,
          id_venta_actual = NULL,
          hora_apertura = NULL
        WHERE id_restaurante = 1 
          AND estado = 'libre'
          AND total_acumulado > 0
      `;
      const limpiarResult = await pool.query(limpiarQuery);
      console.log(`✅ Total de mesas libres limpiadas: ${limpiarResult.rowCount}`);
      
    } else {
      console.log('✅ No hay mesas libres con totales acumulados');
    }

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

    // 5. Verificar estado final
    console.log('\n📋 ESTADO FINAL DE MESAS:');
    const estadoFinalQuery = `
      SELECT 
        numero,
        estado,
        total_acumulado,
        id_venta_actual
      FROM mesas 
      WHERE id_restaurante = 1
      ORDER BY numero
    `;
    const estadoFinalResult = await pool.query(estadoFinalQuery);
    console.table(estadoFinalResult.rows);

    console.log('\n✅ Verificación y limpieza completada');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

verificarYLimpiarMesas();
