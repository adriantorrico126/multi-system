require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function checkTriggers() {
  const client = await pool.connect();
  try {
    console.log('🔍 Verificando triggers en la base de datos...');
    
    // Verificar triggers en la tabla ventas
    const triggersResult = await client.query(`
      SELECT 
        trigger_name,
        event_manipulation,
        action_timing,
        action_statement
      FROM information_schema.triggers 
      WHERE event_object_table = 'ventas'
      ORDER BY trigger_name
    `);
    
    console.log('📋 Triggers en tabla ventas:');
    if (triggersResult.rows.length === 0) {
      console.log('No hay triggers en la tabla ventas');
    } else {
      triggersResult.rows.forEach(trigger => {
        console.log(`- ${trigger.trigger_name}: ${trigger.action_timing} ${trigger.event_manipulation}`);
        console.log(`  Statement: ${trigger.action_statement}`);
      });
    }
    
    // Verificar si hay algún proceso que actualice el estado automáticamente
    console.log('\n🔍 Verificando si hay algún proceso que cambie el estado...');
    
    // Verificar las últimas ventas y sus timestamps
    const ventasTimestamps = await client.query(`
      SELECT 
        id_venta,
        fecha,
        created_at,
        estado,
        EXTRACT(EPOCH FROM (fecha - created_at)) as diferencia_segundos
      FROM ventas 
      ORDER BY id_venta DESC 
      LIMIT 5
    `);
    
    console.log('📋 Últimas ventas con timestamps:');
    ventasTimestamps.rows.forEach(venta => {
      console.log(`ID: ${venta.id_venta}, Estado: ${venta.estado}, Diferencia: ${venta.diferencia_segundos} segundos`);
    });
    
    // Verificar si hay algún script o proceso que actualice el estado
    console.log('\n🔍 Verificando si hay algún proceso automático...');
    
    // Buscar en la tabla ventas si hay algún patrón
    const estadoPattern = await client.query(`
      SELECT 
        estado,
        COUNT(*) as cantidad,
        MIN(fecha) as fecha_min,
        MAX(fecha) as fecha_max
      FROM ventas 
      GROUP BY estado
      ORDER BY cantidad DESC
    `);
    
    console.log('📊 Patrón de estados:');
    estadoPattern.rows.forEach(pattern => {
      console.log(`- ${pattern.estado}: ${pattern.cantidad} ventas (${pattern.fecha_min} a ${pattern.fecha_max})`);
    });
    
  } catch (error) {
    console.error('❌ Error al verificar triggers:', error);
  } finally {
    client.release();
  }
  await pool.end();
}

checkTriggers(); 