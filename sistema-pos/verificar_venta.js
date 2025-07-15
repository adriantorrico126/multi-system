require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});

async function verificarVenta() {
  try {
    console.log('🔍 Verificando ventas recientes...\n');
    
    // Conectar a la base de datos
    const client = await pool.connect();
    console.log('✅ Conectado a la base de datos PostgreSQL exitosamente.\n');

    // Verificar las últimas 10 ventas
    const ultimasQuery = `
      SELECT 
        id_venta,
        fecha,
        estado,
        mesa_numero,
        total,
        tipo_servicio,
        created_at
      FROM ventas 
      ORDER BY id_venta DESC 
      LIMIT 10;
    `;
    
    const ultimasResult = await client.query(ultimasQuery);
    console.log('📊 Últimas 10 ventas:');
    ultimasResult.rows.forEach(venta => {
      console.log(`- Venta ${venta.id_venta}: ${venta.estado} (mesa: ${venta.mesa_numero}, total: ${venta.total}, fecha: ${venta.fecha})`);
    });
    console.log('');

    // Verificar ventas con estado 'recibido'
    const recibidoQuery = `
      SELECT 
        id_venta,
        fecha,
        mesa_numero,
        total
      FROM ventas 
      WHERE estado = 'recibido'
      ORDER BY fecha DESC 
      LIMIT 10;
    `;
    
    const recibidoResult = await client.query(recibidoQuery);
    console.log('📋 Ventas con estado "recibido":');
    if (recibidoResult.rows.length > 0) {
      recibidoResult.rows.forEach(venta => {
        console.log(`- Venta ${venta.id_venta}: mesa ${venta.mesa_numero}, total ${venta.total} (${venta.fecha})`);
      });
    } else {
      console.log('❌ No hay ventas con estado "recibido"');
    }
    console.log('');

    // Verificar detalles de la venta más reciente
    if (ultimasResult.rows.length > 0) {
      const ultimaVenta = ultimasResult.rows[0];
      console.log(`🔍 Verificando detalles de la venta ${ultimaVenta.id_venta}:`);
      
      const detallesQuery = `
        SELECT 
          dv.id_detalle,
          dv.id_venta,
          dv.id_producto,
          dv.cantidad,
          dv.precio_unitario,
          dv.subtotal,
          dv.observaciones,
          p.nombre as nombre_producto
        FROM detalle_ventas dv
        JOIN productos p ON dv.id_producto = p.id_producto
        WHERE dv.id_venta = $1;
      `;
      
      const detallesResult = await client.query(detallesQuery, [ultimaVenta.id_venta]);
      console.log('📋 Detalles de la venta:');
      if (detallesResult.rows.length > 0) {
        detallesResult.rows.forEach((detalle, index) => {
          console.log(`- Detalle ${index + 1}:`);
          console.log(`  Producto: ${detalle.nombre_producto} (ID: ${detalle.id_producto})`);
          console.log(`  Cantidad: ${detalle.cantidad}`);
          console.log(`  Precio: ${detalle.precio_unitario}`);
          console.log(`  Subtotal: ${detalle.subtotal}`);
          console.log(`  Observaciones: ${detalle.observaciones || 'Ninguna'}`);
        });
      } else {
        console.log('❌ No hay detalles para esta venta');
      }
    }

    client.release();
    console.log('\n🏁 Verificación completada');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

verificarVenta(); 