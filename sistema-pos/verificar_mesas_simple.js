const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'sistempos',
  user: 'postgres',
  password: '6951230Anacleta'
});

async function verificarMesasSimple() {
  try {
    console.log('🔍 Verificando estado de mesas...\n');

    // 1. Verificar mesas básicas
    const mesasQuery = 'SELECT * FROM mesas WHERE id_sucursal = 7 AND id_restaurante = 1 ORDER BY numero';
    const mesasResult = await pool.query(mesasQuery);
    console.log('📋 MESAS EN BD:');
    mesasResult.rows.forEach(mesa => {
      console.log(`Mesa ${mesa.numero}: estado=${mesa.estado}, total=${mesa.total_acumulado}, venta_actual=${mesa.id_venta_actual}`);
    });

    // 2. Verificar ventas recientes
    const ventasQuery = `
      SELECT mesa_numero, id_venta, estado, total, fecha 
      FROM ventas 
      WHERE id_sucursal = 7 AND id_restaurante = 1 
      ORDER BY fecha DESC 
      LIMIT 10
    `;
    const ventasResult = await pool.query(ventasQuery);
    console.log('\n📦 VENTAS RECIENTES:');
    ventasResult.rows.forEach(venta => {
      console.log(`Venta ${venta.id_venta}: Mesa ${venta.mesa_numero}, estado=${venta.estado}, total=${venta.total}`);
    });

    // 3. Verificar detalles de una venta específica
    if (ventasResult.rows.length > 0) {
      const primeraVenta = ventasResult.rows[0];
      const detallesQuery = `
        SELECT dv.*, p.nombre as producto_nombre 
        FROM detalle_ventas dv 
        LEFT JOIN productos p ON dv.id_producto = p.id_producto 
        WHERE dv.id_venta = $1
      `;
      const detallesResult = await pool.query(detallesQuery, [primeraVenta.id_venta]);
      console.log(`\n🛒 DETALLES Venta ${primeraVenta.id_venta}:`);
      detallesResult.rows.forEach(detalle => {
        console.log(`- ${detalle.producto_nombre}: ${detalle.cantidad} x $${detalle.precio_unitario} = $${detalle.subtotal}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

verificarMesasSimple();
