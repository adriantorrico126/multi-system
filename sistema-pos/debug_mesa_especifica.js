const { Pool } = require('pg');

// Configuración correcta de la base de datos
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'sistempos',
  user: 'postgres',
  password: '6951230Anacleta'
});

async function debugMesaEspecifica() {
  try {
    console.log('🔍 [DEBUG] Verificando mesa específica y sus ventas...\n');

    // 1. Verificar todas las mesas
    console.log('📋 TODAS LAS MESAS:');
    const todasMesasQuery = `
      SELECT 
        m.id_mesa,
        m.numero,
        m.estado,
        m.total_acumulado,
        m.id_venta_actual,
        m.id_restaurante,
        m.id_sucursal
      FROM mesas m
      ORDER BY m.numero
    `;
    const todasMesasResult = await pool.query(todasMesasQuery);
    console.table(todasMesasResult.rows);

    // 2. Verificar ventas para mesa 1 específicamente
    console.log('\n🎯 VENTAS PARA MESA 1:');
    const mesa1VentasQuery = `
      SELECT 
        v.id_venta,
        v.mesa_numero,
        v.estado,
        v.total,
        v.fecha,
        v.tipo_servicio,
        v.id_restaurante,
        v.id_sucursal
      FROM ventas v
      WHERE v.mesa_numero = 1
      ORDER BY v.fecha DESC
      LIMIT 10
    `;
    const mesa1VentasResult = await pool.query(mesa1VentasQuery);
    console.table(mesa1VentasResult.rows);

    // 3. Verificar detalles para la venta más reciente de mesa 1
    if (mesa1VentasResult.rows.length > 0) {
      const ventaMasReciente = mesa1VentasResult.rows[0];
      console.log(`\n📦 DETALLES PARA VENTA ${ventaMasReciente.id_venta} (Mesa 1):`);
      
      const detallesQuery = `
        SELECT 
          dv.id_detalle,
          dv.id_venta,
          dv.id_producto,
          dv.cantidad,
          dv.precio_unitario,
          dv.subtotal,
          dv.observaciones,
          p.nombre as producto_nombre
        FROM detalle_ventas dv
        LEFT JOIN productos p ON dv.id_producto = p.id_producto
        WHERE dv.id_venta = $1
        ORDER BY dv.created_at
      `;
      const detallesResult = await pool.query(detallesQuery, [ventaMasReciente.id_venta]);
      console.table(detallesResult.rows);
    }

    // 4. Verificar la consulta optimizada para mesa 1
    console.log('\n🔧 CONSULTA OPTIMIZADA PARA MESA 1:');
    const optimizadaQuery = `
      SELECT 
        m.id_mesa,
        m.numero,
        m.estado,
        m.total_acumulado,
        COALESCE(m.id_venta_actual, v_activa.id_venta) as id_venta_actual,
        v_activa.id_venta as venta_activa_id,
        v_activa.estado as venta_estado,
        v_activa.total as venta_total
      FROM mesas m
      LEFT JOIN (
        SELECT DISTINCT ON (mesa_numero) 
          id_venta, mesa_numero, total, fecha, estado
        FROM ventas 
        WHERE mesa_numero = 1
          AND estado IN ('abierta', 'en_uso', 'pendiente_cobro', 'entregado')
        ORDER BY mesa_numero, fecha DESC
      ) v_activa ON m.numero = v_activa.mesa_numero
      WHERE m.numero = 1
    `;
    const optimizadaResult = await pool.query(optimizadaQuery);
    console.table(optimizadaResult.rows);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
  }
}

debugMesaEspecifica();
