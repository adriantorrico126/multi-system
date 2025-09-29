const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'sistempos',
  user: 'postgres',
  password: '6951230Anacleta'
});

async function corregirMesasLibres() {
  try {
    console.log('🔧 [CORRECCIÓN MESAS LIBRES] Iniciando...\n');

    // 1. Verificar mesas libres con totales
    console.log('📋 MESAS LIBRES CON TOTALES:');
    const mesasConTotalesQuery = `
      SELECT numero, estado, total_acumulado, id_venta_actual
      FROM mesas 
      WHERE id_restaurante = 1 
        AND estado = 'libre' 
        AND total_acumulado > 0
      ORDER BY numero
    `;
    const mesasConTotalesResult = await pool.query(mesasConTotalesQuery);
    
    if (mesasConTotalesResult.rows.length > 0) {
      console.table(mesasConTotalesResult.rows);
      
      // 2. Limpiar totales de mesas libres
      console.log('\n🧹 LIMPIANDO TOTALES...');
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
      console.log(`✅ Total de mesas corregidas: ${limpiarResult.rowCount}`);
      
      // 3. Verificar resultado
      console.log('\n📋 ESTADO DESPUÉS DE CORRECCIÓN:');
      const mesasDespuesQuery = `
        SELECT numero, estado, total_acumulado, id_venta_actual
        FROM mesas 
        WHERE id_restaurante = 1
        ORDER BY numero
      `;
      const mesasDespuesResult = await pool.query(mesasDespuesQuery);
      console.table(mesasDespuesResult.rows);
      
    } else {
      console.log('✅ No hay mesas libres con totales acumulados');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

corregirMesasLibres();

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'sistempos',
  user: 'postgres',
  password: '6951230Anacleta'
});

async function corregirMesasLibres() {
  try {
    console.log('🔧 [CORRECCIÓN MESAS LIBRES] Iniciando...\n');

    // 1. Verificar mesas libres con totales
    console.log('📋 MESAS LIBRES CON TOTALES:');
    const mesasConTotalesQuery = `
      SELECT numero, estado, total_acumulado, id_venta_actual
      FROM mesas 
      WHERE id_restaurante = 1 
        AND estado = 'libre' 
        AND total_acumulado > 0
      ORDER BY numero
    `;
    const mesasConTotalesResult = await pool.query(mesasConTotalesQuery);
    
    if (mesasConTotalesResult.rows.length > 0) {
      console.table(mesasConTotalesResult.rows);
      
      // 2. Limpiar totales de mesas libres
      console.log('\n🧹 LIMPIANDO TOTALES...');
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
      console.log(`✅ Total de mesas corregidas: ${limpiarResult.rowCount}`);
      
      // 3. Verificar resultado
      console.log('\n📋 ESTADO DESPUÉS DE CORRECCIÓN:');
      const mesasDespuesQuery = `
        SELECT numero, estado, total_acumulado, id_venta_actual
        FROM mesas 
        WHERE id_restaurante = 1
        ORDER BY numero
      `;
      const mesasDespuesResult = await pool.query(mesasDespuesQuery);
      console.table(mesasDespuesResult.rows);
      
    } else {
      console.log('✅ No hay mesas libres con totales acumulados');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

corregirMesasLibres();


