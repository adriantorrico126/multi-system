const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  password: '6951230Anacleta',
  host: 'localhost',
  port: 5432,
  database: 'sistempos'
});

async function checkTablesStructure() {
  try {
    console.log('🔍 Verificando estructura de tablas...\n');

    // Verificar estructura de la tabla suscripciones
    const suscripcionesStructure = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'suscripciones'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Estructura de la tabla suscripciones:');
    suscripcionesStructure.rows.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    console.log('');

    // Verificar estructura de la tabla planes
    const planesStructure = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'planes'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Estructura de la tabla planes:');
    planesStructure.rows.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    console.log('');

    // Verificar suscripciones del restaurante 7
    const suscripcionesQuery = `
      SELECT s.*, p.nombre as plan_nombre, p.funcionalidades
      FROM suscripciones s
      JOIN planes p ON s.id_plan = p.id_plan
      WHERE s.id_restaurante = 7
      ORDER BY s.fecha_inicio DESC
    `;
    const suscripcionesResult = await pool.query(suscripcionesQuery);
    
    console.log('📋 Suscripciones del restaurante 7:');
    suscripcionesResult.rows.forEach(sub => {
      console.log(`- Plan: ${sub.plan_nombre}`);
      console.log(`  Fecha inicio: ${sub.fecha_inicio}`);
      console.log(`  Fecha fin: ${sub.fecha_fin}`);
      console.log(`  Funcionalidades: ${sub.funcionalidades}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkTablesStructure();
