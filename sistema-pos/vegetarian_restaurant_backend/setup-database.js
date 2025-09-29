const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuración de la base de datos
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'vegetarian_restaurant',
  password: 'postgres', // Cambia por tu contraseña
  port: 5432,
});

async function executeSQLFile(filePath) {
  try {
    console.log(`📄 Ejecutando: ${filePath}`);
    const sql = fs.readFileSync(filePath, 'utf8');
    
    // Dividir el archivo en statements individuales
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await pool.query(statement);
          console.log(`✅ Ejecutado: ${statement.substring(0, 50)}...`);
        } catch (error) {
          console.log(`⚠️  Error en statement: ${error.message}`);
          // Continuar con el siguiente statement
        }
      }
    }
    
    console.log(`✅ Completado: ${filePath}\n`);
  } catch (error) {
    console.error(`❌ Error ejecutando ${filePath}:`, error.message);
  }
}

async function setupDatabase() {
  console.log('🚀 Iniciando configuración de la base de datos...\n');
  
  try {
    // Verificar conexión
    await pool.query('SELECT NOW()');
    console.log('✅ Conexión a la base de datos establecida\n');
    
    // Ejecutar scripts en orden
    const scripts = [
      'sql/sistema_planes_unificado.sql',
      'sql/migracion_planes_existentes.sql',
      'sql/triggers_automaticos_planes.sql'
    ];
    
    for (const script of scripts) {
      const fullPath = path.join(__dirname, script);
      if (fs.existsSync(fullPath)) {
        await executeSQLFile(fullPath);
      } else {
        console.log(`⚠️  Archivo no encontrado: ${script}`);
      }
    }
    
    // Verificar que las tablas se crearon
    console.log('🔍 Verificando tablas creadas...');
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('planes', 'suscripciones', 'contadores_uso', 'alertas_limites', 'auditoria_planes', 'historial_uso_mensual')
      ORDER BY table_name;
    `);
    
    console.log('📋 Tablas del sistema de planes:');
    result.rows.forEach(row => {
      console.log(`  ✅ ${row.table_name}`);
    });
    
    // Verificar datos iniciales
    console.log('\n🔍 Verificando datos iniciales...');
    const planesCount = await pool.query('SELECT COUNT(*) FROM planes');
    console.log(`📊 Planes creados: ${planesCount.rows[0].count}`);
    
    const planes = await pool.query('SELECT nombre, precio_mensual FROM planes ORDER BY precio_mensual');
    console.log('📋 Planes disponibles:');
    planes.rows.forEach(plan => {
      console.log(`  • ${plan.nombre}: $${plan.precio_mensual}/mes`);
    });
    
    console.log('\n🎉 ¡Configuración de la base de datos completada!');
    
  } catch (error) {
    console.error('❌ Error durante la configuración:', error);
  } finally {
    await pool.end();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  setupDatabase();
}

module.exports = { setupDatabase };
