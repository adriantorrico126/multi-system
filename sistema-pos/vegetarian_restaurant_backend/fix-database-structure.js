const { Pool } = require('pg');

// Configuración de la base de datos
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'vegetarian_restaurant',
  password: 'postgres', // Cambia por tu contraseña
  port: 5432,
});

async function fixDatabaseStructure() {
  console.log('🔧 Corrigiendo estructura de la base de datos...\n');
  
  try {
    // Verificar conexión
    await pool.query('SELECT NOW()');
    console.log('✅ Conexión a la base de datos establecida\n');
    
    // 1. Agregar columna nivel_urgencia a alertas_limites
    console.log('📋 Agregando columna nivel_urgencia a alertas_limites...');
    try {
      await pool.query('ALTER TABLE alertas_limites ADD COLUMN IF NOT EXISTS nivel_urgencia VARCHAR(20) DEFAULT \'medio\';');
      console.log('  ✅ Columna nivel_urgencia agregada');
    } catch (error) {
      console.log(`  ⚠️  Error agregando nivel_urgencia: ${error.message}`);
    }
    
    // 2. Crear tabla contadores_uso si no existe
    console.log('📋 Creando tabla contadores_uso...');
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS contadores_uso (
          id_contador SERIAL PRIMARY KEY,
          id_restaurante INTEGER NOT NULL,
          id_plan INTEGER NOT NULL REFERENCES planes(id_plan),
          recurso VARCHAR(50) NOT NULL,
          uso_actual INTEGER DEFAULT 0,
          limite_plan INTEGER NOT NULL,
          fecha_medicion DATE DEFAULT CURRENT_DATE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(id_restaurante, recurso, fecha_medicion)
        );
      `);
      console.log('  ✅ Tabla contadores_uso creada');
    } catch (error) {
      console.log(`  ⚠️  Error creando contadores_uso: ${error.message}`);
    }
    
    // 3. Agregar columna precio_pagado a suscripciones
    console.log('📋 Agregando columna precio_pagado a suscripciones...');
    try {
      await pool.query('ALTER TABLE suscripciones ADD COLUMN IF NOT EXISTS precio_pagado DECIMAL(10,2);');
      console.log('  ✅ Columna precio_pagado agregada');
    } catch (error) {
      console.log(`  ⚠️  Error agregando precio_pagado: ${error.message}`);
    }
    
    // 4. Agregar columna notas a suscripciones
    console.log('📋 Agregando columna notas a suscripciones...');
    try {
      await pool.query('ALTER TABLE suscripciones ADD COLUMN IF NOT EXISTS notas TEXT;');
      console.log('  ✅ Columna notas agregada');
    } catch (error) {
      console.log(`  ⚠️  Error agregando notas: ${error.message}`);
    }
    
    // 5. Verificar estructura de alertas_limites
    console.log('\n🔍 Verificando estructura de alertas_limites...');
    const alertasStructure = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'alertas_limites'
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 Columnas de alertas_limites:');
    alertasStructure.rows.forEach(row => {
      console.log(`  • ${row.column_name}: ${row.data_type} ${row.is_nullable === 'YES' ? '(nullable)' : '(not null)'}`);
    });
    
    // 6. Verificar estructura de contadores_uso
    console.log('\n🔍 Verificando estructura de contadores_uso...');
    const contadoresStructure = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'contadores_uso'
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 Columnas de contadores_uso:');
    contadoresStructure.rows.forEach(row => {
      console.log(`  • ${row.column_name}: ${row.data_type} ${row.is_nullable === 'YES' ? '(nullable)' : '(not null)'}`);
    });
    
    // 7. Verificar estructura de suscripciones
    console.log('\n🔍 Verificando estructura de suscripciones...');
    const suscripcionesStructure = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'suscripciones'
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 Columnas de suscripciones:');
    suscripcionesStructure.rows.forEach(row => {
      console.log(`  • ${row.column_name}: ${row.data_type} ${row.is_nullable === 'YES' ? '(nullable)' : '(not null)'}`);
    });
    
    console.log('\n🎉 ¡Estructura de la base de datos corregida!');
    
  } catch (error) {
    console.error('❌ Error durante la corrección:', error);
  } finally {
    await pool.end();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  fixDatabaseStructure();
}

module.exports = { fixDatabaseStructure };
































































