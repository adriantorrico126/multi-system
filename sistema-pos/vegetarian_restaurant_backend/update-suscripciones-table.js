const { Pool } = require('pg');

// Configuración de la base de datos
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'vegetarian_restaurant',
  password: 'postgres', // Cambia por tu contraseña
  port: 5432,
});

async function updateSuscripcionesTable() {
  console.log('🚀 Actualizando tabla de suscripciones...\n');
  
  try {
    // Verificar conexión
    await pool.query('SELECT NOW()');
    console.log('✅ Conexión a la base de datos establecida\n');
    
    // Agregar columnas faltantes
    const columnsToAdd = [
      'fecha_suspension TIMESTAMP',
      'fecha_cancelacion TIMESTAMP',
      'ultimo_pago DECIMAL(10,2)',
      'proximo_pago DECIMAL(10,2)',
      'auto_renovacion BOOLEAN DEFAULT true',
      'notificaciones_email BOOLEAN DEFAULT true',
      'notificaciones_sms BOOLEAN DEFAULT false',
      'motivo_suspension TEXT',
      'motivo_cancelacion TEXT',
      'datos_adicionales JSONB'
    ];
    
    console.log('📋 Agregando columnas faltantes...');
    for (const column of columnsToAdd) {
      try {
        const columnName = column.split(' ')[0];
        await pool.query(`ALTER TABLE suscripciones ADD COLUMN IF NOT EXISTS ${column};`);
        console.log(`  ✅ Columna ${columnName} agregada`);
      } catch (error) {
        console.log(`  ⚠️  Error agregando columna: ${error.message}`);
      }
    }
    
    // Verificar estructura de la tabla
    console.log('\n🔍 Verificando estructura de la tabla...');
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'suscripciones'
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 Columnas de la tabla suscripciones:');
    result.rows.forEach(row => {
      console.log(`  • ${row.column_name}: ${row.data_type} ${row.is_nullable === 'YES' ? '(nullable)' : '(not null)'}`);
    });
    
    console.log('\n🎉 ¡Tabla de suscripciones actualizada correctamente!');
    
  } catch (error) {
    console.error('❌ Error durante la actualización:', error);
  } finally {
    await pool.end();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  updateSuscripcionesTable();
}

module.exports = { updateSuscripcionesTable };




