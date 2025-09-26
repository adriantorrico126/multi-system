const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  password: '6951230Anacleta',
  host: 'localhost',
  port: 5432,
  database: 'sistempos'
});

async function analyzePlanFeatures() {
  try {
    console.log('🔍 Analizando configuración actual de funcionalidades de planes...\n');

    // Obtener todos los planes con sus funcionalidades
    const plansQuery = `
      SELECT id_plan, nombre, precio_mensual, funcionalidades
      FROM planes
      WHERE activo = true
      ORDER BY precio_mensual ASC
    `;
    const plansResult = await pool.query(plansQuery);
    
    console.log('📋 Configuración actual de planes:');
    plansResult.rows.forEach(plan => {
      console.log(`\n🏷️  Plan: ${plan.nombre} ($${plan.precio_mensual}/mes)`);
      console.log(`📊 Funcionalidades:`);
      
      try {
        const funcionalidades = typeof plan.funcionalidades === 'string' 
          ? JSON.parse(plan.funcionalidades) 
          : plan.funcionalidades;
        
        Object.entries(funcionalidades).forEach(([key, value]) => {
          if (typeof value === 'boolean') {
            console.log(`  - ${key}: ${value ? '✅ Permitido' : '❌ Restringido'}`);
          } else if (Array.isArray(value)) {
            console.log(`  - ${key}: [${value.join(', ')}]`);
          } else {
            console.log(`  - ${key}: ${value}`);
          }
        });
      } catch (error) {
        console.log(`  ❌ Error parseando funcionalidades: ${plan.funcionalidades}`);
      }
    });

    console.log('\n🔍 PROBLEMA IDENTIFICADO:');
    console.log('Todos los planes tienen acceso a casi todas las funcionalidades.');
    console.log('Necesitamos implementar restricciones según la documentación.');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

analyzePlanFeatures();