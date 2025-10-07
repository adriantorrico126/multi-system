const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuración de la base de datos de PRODUCCIÓN
require('dotenv').config();

if (!process.env.DB_PASSWORD_PROD) {
  console.error('Error: La variable de entorno DB_PASSWORD_PROD no está definida.');
  process.exit(1);
}

const pool = new Pool({
  user: process.env.DB_USER_PROD || 'doadmin',
  host: process.env.DB_HOST_PROD || 'db-postgresql-nyc3-64232-do-user-24932517-0.j.db.ondigitalocean.com',
  database: process.env.DB_DATABASE_PROD || 'defaultdb',
  password: process.env.DB_PASSWORD_PROD,
  port: process.env.DB_PORT_PROD || 25060,
  ssl: {
    rejectUnauthorized: false // Necesario para DigitalOcean
  }
});

async function migratePromocionesAvanzadasProduccion() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Iniciando migración de promociones avanzadas en PRODUCCIÓN...');
    console.log('📍 Conectando a:', 'db-postgresql-nyc3-64232-do-user-24932517-0.j.db.ondigitalocean.com');
    
    // Verificar conexión
    const connectionTest = await client.query('SELECT NOW() as current_time');
    console.log('✅ Conexión exitosa a la base de datos de producción');
    console.log('🕐 Hora del servidor:', connectionTest.rows[0].current_time);
    
    // Leer el archivo SQL
    const sqlPath = path.join(__dirname, 'upgrade_promociones_avanzadas_fixed.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Ejecutar el script SQL
    console.log('📝 Ejecutando script SQL en producción...');
    await client.query(sqlContent);
    
    // Verificar que las tablas se crearon correctamente
    console.log('🔍 Verificando estructura de tablas...');
    
    // Verificar tabla promociones
    const promocionesCheck = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'promociones' 
      AND column_name IN ('hora_inicio', 'hora_fin', 'aplicar_horarios', 'limite_usos', 'destacada', 'requiere_codigo', 'codigo_promocion', 'segmento_cliente')
      ORDER BY column_name
    `);
    
    console.log('📊 Columnas nuevas en tabla promociones:');
    promocionesCheck.rows.forEach(row => {
      console.log(`   - ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
    // Verificar tabla promociones_uso
    const usoCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'promociones_uso'
    `);
    
    if (usoCheck.rows.length > 0) {
      console.log('✅ Tabla promociones_uso creada exitosamente');
    } else {
      console.log('❌ Error: Tabla promociones_uso no encontrada');
    }
    
    // Verificar vista analytics
    const vistaCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.views 
      WHERE table_name = 'v_promociones_analytics'
    `);
    
    if (vistaCheck.rows.length > 0) {
      console.log('✅ Vista v_promociones_analytics creada exitosamente');
    } else {
      console.log('❌ Error: Vista v_promociones_analytics no encontrada');
    }
    
    // Verificar funciones
    const funcionesCheck = await client.query(`
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_name IN ('fn_promocion_valida', 'fn_get_promociones_activas_avanzadas', 'fn_registrar_uso_promocion')
      AND routine_type = 'FUNCTION'
    `);
    
    console.log('🔧 Funciones creadas:');
    funcionesCheck.rows.forEach(row => {
      console.log(`   - ${row.routine_name}`);
    });
    
    // Verificar datos de ejemplo
    const datosCheck = await client.query(`
      SELECT COUNT(*) as total_promociones 
      FROM promociones 
      WHERE nombre IN ('Descuento Happy Hour', 'Promoción VIP')
    `);
    
    console.log('📋 Datos de ejemplo insertados:', datosCheck.rows[0].total_promociones, 'promociones');
    
    console.log('✅ Migración de promociones avanzadas en PRODUCCIÓN completada exitosamente');
    console.log('');
    console.log('🎯 Nuevas funcionalidades disponibles en PRODUCCIÓN:');
    console.log('   - Promociones por horarios específicos');
    console.log('   - Límites de uso por promoción y por cliente');
    console.log('   - Códigos de promoción personalizados');
    console.log('   - Segmentación de clientes (nuevos, recurrentes, VIP)');
    console.log('   - Promociones destacadas');
    console.log('   - Analytics avanzados de uso');
    console.log('   - Tracking detallado de promociones');
    console.log('   - Montos mínimos y máximos de aplicación');
    console.log('');
    console.log('📊 Tablas actualizadas/creadas en PRODUCCIÓN:');
    console.log('   - promociones (15+ columnas nuevas)');
    console.log('   - promociones_uso (nueva tabla)');
    console.log('   - v_promociones_analytics (nueva vista)');
    console.log('');
    console.log('🔧 Funciones creadas en PRODUCCIÓN:');
    console.log('   - fn_promocion_valida()');
    console.log('   - fn_get_promociones_activas_avanzadas()');
    console.log('   - fn_registrar_uso_promocion()');
    console.log('');
    console.log('✨ El sistema de promociones avanzadas está listo en PRODUCCIÓN!');
    console.log('🚀 Puedes usar todas las funcionalidades avanzadas desde el frontend');
    
  } catch (error) {
    console.error('❌ Error durante la migración en PRODUCCIÓN:', error);
    console.error('🔍 Detalles del error:', error.message);
    if (error.code) {
      console.error('📋 Código de error:', error.code);
    }
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Ejecutar migración
console.log('⚠️  ADVERTENCIA: Estás a punto de migrar la base de datos de PRODUCCIÓN');
console.log('📍 Host:', 'db-postgresql-nyc3-64232-do-user-24932517-0.j.db.ondigitalocean.com');
console.log('🗄️  Base de datos:', 'defaultdb');
console.log('');

migratePromocionesAvanzadasProduccion()
  .then(() => {
    console.log('🎉 Migración en PRODUCCIÓN completada exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error en la migración de PRODUCCIÓN:', error);
    process.exit(1);
  });
