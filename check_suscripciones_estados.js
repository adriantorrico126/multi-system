const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  password: '6951230Anacleta',
  host: 'localhost',
  port: 5432,
  database: 'sistempos'
});

async function checkSuscripcionesEstados() {
  try {
    console.log('🔍 Verificando estados de suscripciones...\n');

    // Verificar estados únicos en la tabla suscripciones
    const estadosQuery = `
      SELECT DISTINCT estado, COUNT(*) as cantidad
      FROM suscripciones 
      GROUP BY estado
      ORDER BY estado
    `;
    const estadosResult = await pool.query(estadosQuery);
    
    console.log('📋 Estados de suscripciones encontrados:');
    estadosResult.rows.forEach(estado => {
      console.log(`- ${estado.estado}: ${estado.cantidad} suscripciones`);
    });
    console.log('');

    // Verificar suscripciones del restaurante 7
    const suscripcionesQuery = `
      SELECT s.*, p.nombre as plan_nombre
      FROM suscripciones s
      JOIN planes p ON s.id_plan = p.id_plan
      WHERE s.id_restaurante = 7
      ORDER BY s.created_at DESC
    `;
    const suscripcionesResult = await pool.query(suscripcionesQuery);
    
    console.log('📋 Suscripciones del restaurante 7:');
    suscripcionesResult.rows.forEach(sub => {
      console.log(`- Plan: ${sub.plan_nombre}`);
      console.log(`  Estado: ${sub.estado}`);
      console.log(`  Fecha inicio: ${sub.fecha_inicio}`);
      console.log(`  Fecha fin: ${sub.fecha_fin}`);
      console.log(`  Creada: ${sub.created_at}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkSuscripcionesEstados();
