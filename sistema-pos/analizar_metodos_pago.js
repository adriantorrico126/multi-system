const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'sistempos',
  user: 'postgres',
  password: '6951230Anacleta'
});

async function analizarMetodosPago() {
  try {
    console.log('🔍 [ANÁLISIS] Métodos de Pago por Restaurante');
    console.log('=============================================');

    // 1. Ver todos los métodos de pago actuales
    console.log('\n📋 TODOS LOS MÉTODOS DE PAGO:');
    const todosQuery = `
      SELECT 
        id_pago,
        descripcion,
        activo,
        id_restaurante,
        COUNT(*) OVER (PARTITION BY descripcion) as total_por_descripcion
      FROM metodos_pago 
      ORDER BY descripcion, id_restaurante
    `;
    const todosResult = await pool.query(todosQuery);
    console.table(todosResult.rows);

    // 2. Identificar métodos duplicados por descripción
    console.log('\n🔄 MÉTODOS DUPLICADOS:');
    const duplicadosQuery = `
      SELECT 
        descripcion,
        COUNT(*) as cantidad,
        STRING_AGG(id_restaurante::text, ', ') as restaurantes,
        STRING_AGG(CASE WHEN activo THEN 'SÍ' ELSE 'NO' END, ', ') as activos
      FROM metodos_pago 
      GROUP BY descripcion
      HAVING COUNT(*) > 1
      ORDER BY descripcion
    `;
    const duplicadosResult = await pool.query(duplicadosQuery);
    console.table(duplicadosResult.rows);

    // 3. Métodos por restaurante
    console.log('\n🏪 MÉTODOS POR RESTAURANTE:');
    const porRestauranteQuery = `
      SELECT 
        id_restaurante,
        COUNT(*) as total_metodos,
        COUNT(CASE WHEN activo THEN 1 END) as metodos_activos,
        STRING_AGG(descripcion, ', ') as descripciones
      FROM metodos_pago 
      GROUP BY id_restaurante
      ORDER BY id_restaurante
    `;
    const porRestauranteResult = await pool.query(porRestauranteQuery);
    console.table(porRestauranteResult.rows);

    // 4. Verificar uso en ventas
    console.log('\n💰 USO EN VENTAS:');
    const usoQuery = `
      SELECT 
        v.id_restaurante,
        mp.id_pago,
        mp.descripcion,
        COUNT(*) as uso_en_ventas
      FROM ventas v
      JOIN metodos_pago mp ON v.id_pago = mp.id_pago
      GROUP BY v.id_restaurante, mp.id_pago, mp.descripcion
      ORDER BY v.id_restaurante, COUNT(*) DESC
      LIMIT 20
    `;
    const usoResult = await pool.query(usoQuery);
    console.table(usoResult.rows);

    console.log('\n💡 RECOMENDACIÓN:');
    console.log('Los métodos de pago deberían ser globales, no por restaurante.');
    console.log('Se recomienda:');
    console.log('1. Eliminar la columna id_restaurante de metodos_pago');
    console.log('2. Crear métodos de pago universales');
    console.log('3. Actualizar las referencias en ventas');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

analizarMetodosPago();

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'sistempos',
  user: 'postgres',
  password: '6951230Anacleta'
});

async function analizarMetodosPago() {
  try {
    console.log('🔍 [ANÁLISIS] Métodos de Pago por Restaurante');
    console.log('=============================================');

    // 1. Ver todos los métodos de pago actuales
    console.log('\n📋 TODOS LOS MÉTODOS DE PAGO:');
    const todosQuery = `
      SELECT 
        id_pago,
        descripcion,
        activo,
        id_restaurante,
        COUNT(*) OVER (PARTITION BY descripcion) as total_por_descripcion
      FROM metodos_pago 
      ORDER BY descripcion, id_restaurante
    `;
    const todosResult = await pool.query(todosQuery);
    console.table(todosResult.rows);

    // 2. Identificar métodos duplicados por descripción
    console.log('\n🔄 MÉTODOS DUPLICADOS:');
    const duplicadosQuery = `
      SELECT 
        descripcion,
        COUNT(*) as cantidad,
        STRING_AGG(id_restaurante::text, ', ') as restaurantes,
        STRING_AGG(CASE WHEN activo THEN 'SÍ' ELSE 'NO' END, ', ') as activos
      FROM metodos_pago 
      GROUP BY descripcion
      HAVING COUNT(*) > 1
      ORDER BY descripcion
    `;
    const duplicadosResult = await pool.query(duplicadosQuery);
    console.table(duplicadosResult.rows);

    // 3. Métodos por restaurante
    console.log('\n🏪 MÉTODOS POR RESTAURANTE:');
    const porRestauranteQuery = `
      SELECT 
        id_restaurante,
        COUNT(*) as total_metodos,
        COUNT(CASE WHEN activo THEN 1 END) as metodos_activos,
        STRING_AGG(descripcion, ', ') as descripciones
      FROM metodos_pago 
      GROUP BY id_restaurante
      ORDER BY id_restaurante
    `;
    const porRestauranteResult = await pool.query(porRestauranteQuery);
    console.table(porRestauranteResult.rows);

    // 4. Verificar uso en ventas
    console.log('\n💰 USO EN VENTAS:');
    const usoQuery = `
      SELECT 
        v.id_restaurante,
        mp.id_pago,
        mp.descripcion,
        COUNT(*) as uso_en_ventas
      FROM ventas v
      JOIN metodos_pago mp ON v.id_pago = mp.id_pago
      GROUP BY v.id_restaurante, mp.id_pago, mp.descripcion
      ORDER BY v.id_restaurante, COUNT(*) DESC
      LIMIT 20
    `;
    const usoResult = await pool.query(usoQuery);
    console.table(usoResult.rows);

    console.log('\n💡 RECOMENDACIÓN:');
    console.log('Los métodos de pago deberían ser globales, no por restaurante.');
    console.log('Se recomienda:');
    console.log('1. Eliminar la columna id_restaurante de metodos_pago');
    console.log('2. Crear métodos de pago universales');
    console.log('3. Actualizar las referencias en ventas');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

analizarMetodosPago();
