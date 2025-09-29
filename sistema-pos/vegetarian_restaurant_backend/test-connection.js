const { Pool } = require('pg');

// Configuración de la base de datos
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'vegetarian_restaurant',
  password: 'postgres', // Cambia por tu contraseña
  port: 5432,
});

async function testConnection() {
  console.log('🔍 Probando conexión y consultas...\n');
  
  try {
    // Verificar conexión
    const connectionTest = await pool.query('SELECT NOW()');
    console.log('✅ Conexión a la base de datos establecida');
    console.log('  Hora actual:', connectionTest.rows[0].now);
    
    // Verificar esquema actual
    const schemaTest = await pool.query('SELECT current_schema()');
    console.log('  Esquema actual:', schemaTest.rows[0].current_schema);
    
    // Probar consulta directa a alertas_limites
    console.log('\n📋 Probando consulta directa a alertas_limites...');
    try {
      const alertasTest = await pool.query(`
        SELECT 
          al.id_alerta,
          al.id_restaurante,
          al.id_plan,
          al.tipo_alerta,
          al.recurso,
          al.porcentaje_uso,
          al.estado,
          al.nivel_urgencia,
          al.fecha_alerta,
          al.fecha_resolucion,
          al.mensaje,
          al.datos_adicionales,
          al.created_at
        FROM alertas_limites al
        LIMIT 1
      `);
      console.log('  ✅ Consulta a alertas_limites exitosa');
      console.log('  Columnas encontradas:', Object.keys(alertasTest.rows[0] || {}));
    } catch (error) {
      console.log('  ❌ Error en consulta a alertas_limites:', error.message);
    }
    
    // Probar consulta directa a contadores_uso
    console.log('\n📋 Probando consulta directa a contadores_uso...');
    try {
      const contadoresTest = await pool.query(`
        SELECT 
          cu.id_contador,
          cu.id_restaurante,
          cu.id_plan,
          cu.recurso,
          cu.uso_actual,
          cu.limite_plan,
          cu.fecha_medicion,
          cu.created_at,
          cu.updated_at
        FROM contadores_uso cu
        LIMIT 1
      `);
      console.log('  ✅ Consulta a contadores_uso exitosa');
      console.log('  Columnas encontradas:', Object.keys(contadoresTest.rows[0] || {}));
    } catch (error) {
      console.log('  ❌ Error en consulta a contadores_uso:', error.message);
    }
    
    // Verificar si hay datos en las tablas
    console.log('\n📋 Verificando datos en las tablas...');
    const alertasCount = await pool.query('SELECT COUNT(*) FROM alertas_limites');
    const contadoresCount = await pool.query('SELECT COUNT(*) FROM contadores_uso');
    const planesCount = await pool.query('SELECT COUNT(*) FROM planes');
    const suscripcionesCount = await pool.query('SELECT COUNT(*) FROM suscripciones');
    
    console.log('  alertas_limites:', alertasCount.rows[0].count, 'registros');
    console.log('  contadores_uso:', contadoresCount.rows[0].count, 'registros');
    console.log('  planes:', planesCount.rows[0].count, 'registros');
    console.log('  suscripciones:', suscripcionesCount.rows[0].count, 'registros');
    
  } catch (error) {
    console.error('❌ Error durante la prueba:', error);
  } finally {
    await pool.end();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  testConnection();
}

module.exports = { testConnection };




