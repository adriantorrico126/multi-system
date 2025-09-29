const { Pool } = require('pg');

// Configuración de la base de datos real
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'sistempos',
  password: '6951230Anacleta',
  port: 5432,
});

async function fixSistemposDB() {
  console.log('🔧 Corrigiendo base de datos sistempos...\n');
  
  try {
    // Verificar conexión
    await pool.query('SELECT NOW()');
    console.log('✅ Conexión a la base de datos sistempos establecida\n');
    
    // 1. Crear tabla contadores_uso
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
    
    // 2. Agregar columna nivel_urgencia a alertas_limites
    console.log('📋 Agregando columna nivel_urgencia a alertas_limites...');
    try {
      await pool.query('ALTER TABLE alertas_limites ADD COLUMN IF NOT EXISTS nivel_urgencia VARCHAR(20) DEFAULT \'medio\';');
      console.log('  ✅ Columna nivel_urgencia agregada');
    } catch (error) {
      console.log(`  ⚠️  Error agregando nivel_urgencia: ${error.message}`);
    }
    
    // 3. Verificar estructura final
    console.log('\n🔍 Verificando estructura final...');
    
    // Verificar contadores_uso
    const contadoresExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'contadores_uso'
      );
    `);
    console.log('  contadores_uso existe:', contadoresExists.rows[0].exists);
    
    // Verificar nivel_urgencia
    const nivelUrgenciaExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'alertas_limites'
        AND column_name = 'nivel_urgencia'
      );
    `);
    console.log('  nivel_urgencia existe:', nivelUrgenciaExists.rows[0].exists);
    
    // Verificar estructura de alertas_limites
    const alertasStructure = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'alertas_limites'
      ORDER BY ordinal_position;
    `);
    
    console.log('\n  📋 Columnas finales de alertas_limites:');
    alertasStructure.rows.forEach(row => {
      console.log(`    • ${row.column_name}: ${row.data_type} ${row.is_nullable === 'YES' ? '(nullable)' : '(not null)'}`);
    });
    
    console.log('\n🎉 ¡Base de datos sistempos corregida!');
    
  } catch (error) {
    console.error('❌ Error durante la corrección:', error);
  } finally {
    await pool.end();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  fixSistemposDB();
}

module.exports = { fixSistemposDB };







