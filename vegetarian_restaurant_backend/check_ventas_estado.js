require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function checkVentasEstado() {
  const client = await pool.connect();
  try {
    console.log('🔍 Verificando estado de ventas recientes...');
    
    // Verificar las últimas 10 ventas
    const ventasResult = await client.query(`
      SELECT 
        id_venta,
        fecha,
        estado,
        tipo_servicio,
        mesa_numero,
        total,
        id_restaurante
      FROM ventas 
      ORDER BY id_venta DESC 
      LIMIT 10
    `);
    
    console.log('📋 Últimas 10 ventas:');
    ventasResult.rows.forEach(venta => {
      console.log(`ID: ${venta.id_venta}, Estado: ${venta.estado}, Tipo: ${venta.tipo_servicio}, Mesa: ${venta.mesa_numero}, Total: ${venta.total}, Restaurante: ${venta.id_restaurante}`);
    });
    
    // Verificar cuántas ventas tienen estado para aparecer en cocina
    const pedidosCocinaResult = await client.query(`
      SELECT COUNT(*) as total_pedidos
      FROM ventas 
      WHERE estado IN ('recibido', 'en_preparacion', 'listo_para_servir')
    `);
    
    console.log(`\n🍳 Pedidos para cocina: ${pedidosCocinaResult.rows[0].total_pedidos}`);
    
    // Verificar distribución de estados
    const estadosResult = await client.query(`
      SELECT 
        estado,
        COUNT(*) as cantidad
      FROM ventas 
      GROUP BY estado
      ORDER BY cantidad DESC
    `);
    
    console.log('\n📊 Distribución de estados:');
    estadosResult.rows.forEach(estado => {
      console.log(`- ${estado.estado}: ${estado.cantidad} ventas`);
    });
    
  } catch (error) {
    console.error('❌ Error al verificar ventas:', error);
  } finally {
    client.release();
  }
  await pool.end();
}

checkVentasEstado(); 