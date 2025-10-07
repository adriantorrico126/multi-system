const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuración de la base de datos
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'sistempos',
  password: process.env.DB_PASSWORD || '69512310Anacleta',
  port: process.env.DB_PORT || 5432,
});

async function migratePromocionesAvanzadas() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Iniciando migración de promociones avanzadas...');
    
    // Leer el archivo SQL
    const sqlPath = path.join(__dirname, 'upgrade_promociones_avanzadas_fixed.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Ejecutar el script SQL
    console.log('📝 Ejecutando script SQL...');
    await client.query(sqlContent);
    
    console.log('✅ Migración de promociones avanzadas completada exitosamente');
    console.log('');
    console.log('🎯 Nuevas funcionalidades disponibles:');
    console.log('   - Promociones por horarios específicos');
    console.log('   - Límites de uso por promoción y por cliente');
    console.log('   - Códigos de promoción personalizados');
    console.log('   - Segmentación de clientes (nuevos, recurrentes, VIP)');
    console.log('   - Promociones destacadas');
    console.log('   - Analytics avanzados de uso');
    console.log('   - Tracking detallado de promociones');
    console.log('   - Montos mínimos y máximos de aplicación');
    console.log('');
    console.log('📊 Tablas creadas/actualizadas:');
    console.log('   - promociones (columnas adicionales)');
    console.log('   - promociones_uso (nueva tabla)');
    console.log('   - v_promociones_analytics (nueva vista)');
    console.log('');
    console.log('🔧 Funciones creadas:');
    console.log('   - fn_promocion_valida()');
    console.log('   - fn_get_promociones_activas_avanzadas()');
    console.log('   - fn_registrar_uso_promocion()');
    console.log('');
    console.log('✨ El sistema de promociones está listo para uso avanzado!');
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Ejecutar migración
migratePromocionesAvanzadas()
  .then(() => {
    console.log('🎉 Migración completada exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error en la migración:', error);
    process.exit(1);
  });
