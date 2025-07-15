require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function testVentaEstado() {
  const client = await pool.connect();
  try {
    console.log('🧪 Probando creación de venta y verificación de estado...');
    
    // Verificar estado antes de crear la venta
    console.log('📋 Estado de ventas antes de crear nueva venta:');
    const ventasAntes = await client.query(`
      SELECT id_venta, estado, fecha, created_at 
      FROM ventas 
      ORDER BY id_venta DESC 
      LIMIT 3
    `);
    ventasAntes.rows.forEach(venta => {
      console.log(`ID: ${venta.id_venta}, Estado: ${venta.estado}`);
    });
    
    // Crear una venta de prueba directamente
    console.log('\n🔧 Creando venta de prueba...');
    const ventaQuery = `
      INSERT INTO ventas (fecha, id_vendedor, id_pago, id_sucursal, tipo_servicio, total, mesa_numero, estado, id_restaurante)
      VALUES (NOW(), 19, 1, 4, 'Mesa', 25.00, 1, 'recibido', 1)
      RETURNING id_venta, fecha, estado, created_at;
    `;
    
    const ventaResult = await client.query(ventaQuery);
    const nuevaVenta = ventaResult.rows[0];
    console.log('✅ Venta creada:', nuevaVenta);
    
    // Verificar estado inmediatamente después de crear
    console.log('\n🔍 Verificando estado inmediatamente después de crear...');
    const ventaInmediata = await client.query(`
      SELECT id_venta, estado, fecha, created_at 
      FROM ventas 
      WHERE id_venta = $1
    `, [nuevaVenta.id_venta]);
    
    console.log('Estado inmediato:', ventaInmediata.rows[0]);
    
    // Esperar un momento y verificar de nuevo
    console.log('\n⏳ Esperando 2 segundos...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const ventaDespues = await client.query(`
      SELECT id_venta, estado, fecha, created_at 
      FROM ventas 
      WHERE id_venta = $1
    `, [nuevaVenta.id_venta]);
    
    console.log('Estado después de 2 segundos:', ventaDespues.rows[0]);
    
    // Verificar si hay algún proceso que cambie el estado
    console.log('\n🔍 Verificando si hay algún proceso automático...');
    const procesosActivos = await client.query(`
      SELECT 
        pid,
        usename,
        application_name,
        state,
        query_start,
        query
      FROM pg_stat_activity 
      WHERE state = 'active' 
      AND query NOT LIKE '%pg_stat_activity%'
    `);
    
    console.log('📋 Procesos activos:');
    if (procesosActivos.rows.length === 0) {
      console.log('No hay procesos activos');
    } else {
      procesosActivos.rows.forEach(proceso => {
        console.log(`- PID: ${proceso.pid}, Usuario: ${proceso.usename}, Estado: ${proceso.state}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  } finally {
    client.release();
  }
  await pool.end();
}

testVentaEstado(); 