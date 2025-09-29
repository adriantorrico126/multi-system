const { Pool } = require('pg');

// Configuración de la base de datos
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'vegetarian_restaurant',
  password: 'postgres', // Cambia por tu contraseña
  port: 5432,
});

async function checkTableStructure() {
  console.log('🔍 Verificando estructura de la tabla suscripciones...\n');
  
  try {
    // Verificar conexión
    await pool.query('SELECT NOW()');
    console.log('✅ Conexión a la base de datos establecida\n');
    
    // Verificar estructura de la tabla suscripciones
    console.log('📋 Estructura de la tabla suscripciones:');
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'suscripciones'
      ORDER BY ordinal_position;
    `);
    
    result.rows.forEach(row => {
      console.log(`  • ${row.column_name}: ${row.data_type} ${row.is_nullable === 'YES' ? '(nullable)' : '(not null)'}`);
    });
    
    // Verificar si existe la columna precio_pagado
    const precioPagadoExists = result.rows.some(row => row.column_name === 'precio_pagado');
    console.log(`\n🔍 Columna precio_pagado existe: ${precioPagadoExists}`);
    
    if (!precioPagadoExists) {
      console.log('⚠️  La columna precio_pagado no existe. Agregándola...');
      await pool.query('ALTER TABLE suscripciones ADD COLUMN IF NOT EXISTS precio_pagado DECIMAL(10,2);');
      console.log('✅ Columna precio_pagado agregada');
    }
    
    // Verificar datos existentes
    console.log('\n📊 Datos existentes en suscripciones:');
    const data = await pool.query('SELECT * FROM suscripciones LIMIT 5;');
    if (data.rows.length > 0) {
      console.log('📋 Registros encontrados:');
      data.rows.forEach((row, index) => {
        console.log(`  ${index + 1}. ID: ${row.id_suscripcion}, Restaurante: ${row.id_restaurante}, Plan: ${row.id_plan}, Estado: ${row.estado}`);
      });
    } else {
      console.log('⚠️  No hay registros en la tabla suscripciones');
    }
    
  } catch (error) {
    console.error('❌ Error durante la verificación:', error);
  } finally {
    await pool.end();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  checkTableStructure();
}

module.exports = { checkTableStructure };
