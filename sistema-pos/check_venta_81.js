require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});

async function checkVenta81() {
  try {
    console.log('🔍 Verificando venta 81...\n');
    
    // Conectar a la base de datos
    const client = await pool.connect();
    console.log('✅ Conectado a la base de datos PostgreSQL exitosamente.\n');

    // Verificar si existe la venta 81
    const ventaQuery = `
      SELECT 
        id_venta,
        fecha,
        estado,
        mesa_numero,
        total,
        tipo_servicio,
        created_at
      FROM ventas 
      WHERE id_venta = 81;
    `;
    
    const ventaResult = await client.query(ventaQuery);
    console.log('📊 Venta 81:');
    if (ventaResult.rows.length > 0) {
      const venta = ventaResult.rows[0];
      console.log(`- ID: ${venta.id_venta}`);
      console.log(`- Fecha: ${venta.fecha}`);
      console.log(`- Estado: ${venta.estado}`);
      console.log(`- Mesa: ${venta.mesa_numero}`);
      console.log(`- Total: ${venta.total}`);
      console.log(`- Tipo servicio: ${venta.tipo_servicio}`);
      console.log(`- Created at: ${venta.created_at}`);
    } else {
      console.log('❌ La venta 81 no existe');
    }
    console.log('');

    // Verificar detalles de la venta 81
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
      WHERE dv.id_venta = 81;
    `;
    
    const detallesResult = await client.query(detallesQuery);
    console.log('📋 Detalles de venta 81:');
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
      console.log('❌ No hay detalles para la venta 81');
    }
    console.log('');

    // Verificar las últimas 5 ventas
    const ultimasQuery = `
      SELECT 
        id_venta,
        fecha,
        estado,
        mesa_numero,
        total
      FROM ventas 
      ORDER BY id_venta DESC 
      LIMIT 5;
    `;
    
    const ultimasResult = await client.query(ultimasQuery);
    console.log('📊 Últimas 5 ventas:');
    ultimasResult.rows.forEach(venta => {
      console.log(`- Venta ${venta.id_venta}: ${venta.estado} (mesa: ${venta.mesa_numero}, total: ${venta.total})`);
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

    client.release();
    console.log('\n🏁 Verificación completada');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkVenta81(); 