const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'sistempos',
  user: 'postgres',
  password: '6951230Anacleta'
});

async function verificarDBMesas() {
  try {
    console.log('🔍 Verificando configuración de base de datos...\n');

    // 1. Verificar conexión
    console.log('✅ Conexión a base de datos exitosa');

    // 2. Verificar si existen mesas
    const mesasCountQuery = 'SELECT COUNT(*) as total FROM mesas';
    const mesasCountResult = await pool.query(mesasCountQuery);
    console.log(`📋 Total de mesas en BD: ${mesasCountResult.rows[0].total}`);

    // 3. Verificar mesas específicas
    const mesasQuery = 'SELECT * FROM mesas LIMIT 5';
    const mesasResult = await pool.query(mesasQuery);
    console.log('\n📋 Primeras 5 mesas:');
    mesasResult.rows.forEach(mesa => {
      console.log(`- Mesa ${mesa.numero}: estado=${mesa.estado}, total=${mesa.total_acumulado}, sucursal=${mesa.id_sucursal}, restaurante=${mesa.id_restaurante}`);
    });

    // 4. Verificar ventas
    const ventasCountQuery = 'SELECT COUNT(*) as total FROM ventas';
    const ventasCountResult = await pool.query(ventasCountQuery);
    console.log(`\n📦 Total de ventas en BD: ${ventasCountResult.rows[0].total}`);

    // 5. Verificar ventas recientes
    const ventasQuery = 'SELECT * FROM ventas ORDER BY fecha DESC LIMIT 5';
    const ventasResult = await pool.query(ventasQuery);
    console.log('\n📦 Últimas 5 ventas:');
    ventasResult.rows.forEach(venta => {
      console.log(`- Venta ${venta.id_venta}: Mesa ${venta.mesa_numero}, estado=${venta.estado}, total=${venta.total}, fecha=${venta.fecha}`);
    });

    // 6. Verificar detalles de ventas
    const detallesCountQuery = 'SELECT COUNT(*) as total FROM detalle_ventas';
    const detallesCountResult = await pool.query(detallesCountQuery);
    console.log(`\n🛒 Total de detalles de ventas: ${detallesCountResult.rows[0].total}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

verificarDBMesas();

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'sistempos',
  user: 'postgres',
  password: '6951230Anacleta'
});

async function verificarDBMesas() {
  try {
    console.log('🔍 Verificando configuración de base de datos...\n');

    // 1. Verificar conexión
    console.log('✅ Conexión a base de datos exitosa');

    // 2. Verificar si existen mesas
    const mesasCountQuery = 'SELECT COUNT(*) as total FROM mesas';
    const mesasCountResult = await pool.query(mesasCountQuery);
    console.log(`📋 Total de mesas en BD: ${mesasCountResult.rows[0].total}`);

    // 3. Verificar mesas específicas
    const mesasQuery = 'SELECT * FROM mesas LIMIT 5';
    const mesasResult = await pool.query(mesasQuery);
    console.log('\n📋 Primeras 5 mesas:');
    mesasResult.rows.forEach(mesa => {
      console.log(`- Mesa ${mesa.numero}: estado=${mesa.estado}, total=${mesa.total_acumulado}, sucursal=${mesa.id_sucursal}, restaurante=${mesa.id_restaurante}`);
    });

    // 4. Verificar ventas
    const ventasCountQuery = 'SELECT COUNT(*) as total FROM ventas';
    const ventasCountResult = await pool.query(ventasCountQuery);
    console.log(`\n📦 Total de ventas en BD: ${ventasCountResult.rows[0].total}`);

    // 5. Verificar ventas recientes
    const ventasQuery = 'SELECT * FROM ventas ORDER BY fecha DESC LIMIT 5';
    const ventasResult = await pool.query(ventasQuery);
    console.log('\n📦 Últimas 5 ventas:');
    ventasResult.rows.forEach(venta => {
      console.log(`- Venta ${venta.id_venta}: Mesa ${venta.mesa_numero}, estado=${venta.estado}, total=${venta.total}, fecha=${venta.fecha}`);
    });

    // 6. Verificar detalles de ventas
    const detallesCountQuery = 'SELECT COUNT(*) as total FROM detalle_ventas';
    const detallesCountResult = await pool.query(detallesCountQuery);
    console.log(`\n🛒 Total de detalles de ventas: ${detallesCountResult.rows[0].total}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

verificarDBMesas();
