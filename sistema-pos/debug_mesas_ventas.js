const { Pool } = require('pg');

// Configuración de la base de datos
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'sitemm_db',
  user: 'postgres',
  password: 'postgres'
});

async function debugMesasVentas() {
  try {
    console.log('🔍 [DEBUG] Verificando estado de mesas y ventas...\n');

    // 1. Verificar mesas
    console.log('📋 MESAS:');
    const mesasQuery = `
      SELECT 
        m.id_mesa,
        m.numero,
        m.estado,
        m.total_acumulado,
        m.id_venta_actual,
        m.hora_apertura
      FROM mesas m
      WHERE m.id_restaurante = 1
      ORDER BY m.numero
    `;
    const mesasResult = await pool.query(mesasQuery);
    console.table(mesasResult.rows);

    // 2. Verificar ventas activas
    console.log('\n💰 VENTAS ACTIVAS:');
    const ventasQuery = `
      SELECT 
        v.id_venta,
        v.mesa_numero,
        v.estado,
        v.total,
        v.fecha,
        v.tipo_servicio
      FROM ventas v
      WHERE v.id_restaurante = 1 
        AND v.estado IN ('abierta', 'en_uso', 'pendiente_cobro')
      ORDER BY v.fecha DESC
    `;
    const ventasResult = await pool.query(ventasQuery);
    console.table(ventasResult.rows);

    // 3. Verificar detalles de ventas
    console.log('\n📦 DETALLES DE VENTAS:');
    const detallesQuery = `
      SELECT 
        dv.id_detalle,
        dv.id_venta,
        dv.id_producto,
        dv.cantidad,
        dv.precio_unitario,
        dv.subtotal,
        p.nombre as producto_nombre
      FROM detalle_ventas dv
      LEFT JOIN productos p ON dv.id_producto = p.id_producto
      WHERE dv.id_restaurante = 1
        AND dv.id_venta IN (
          SELECT id_venta FROM ventas 
          WHERE id_restaurante = 1 
            AND estado IN ('abierta', 'en_uso', 'pendiente_cobro')
        )
      ORDER BY dv.id_venta, dv.created_at
    `;
    const detallesResult = await pool.query(detallesQuery);
    console.table(detallesResult.rows);

    // 4. Verificar la consulta optimizada
    console.log('\n🔧 CONSULTA OPTIMIZADA DE MESAS:');
    const optimizadaQuery = `
      SELECT 
        m.id_mesa,
        m.numero,
        m.estado,
        m.total_acumulado,
        COALESCE(m.id_venta_actual, v_activa.id_venta) as id_venta_actual,
        v_activa.id_venta as venta_activa_id,
        v_activa.estado as venta_estado
      FROM mesas m
      LEFT JOIN (
        SELECT DISTINCT ON (mesa_numero) 
          id_venta, mesa_numero, total, fecha, estado
        FROM ventas 
        WHERE id_sucursal = 7 
          AND id_restaurante = 1 
          AND estado IN ('abierta', 'en_uso', 'pendiente_cobro')
        ORDER BY mesa_numero, fecha DESC
      ) v_activa ON m.numero = v_activa.mesa_numero
      WHERE m.id_sucursal = 7 AND m.id_restaurante = 1
      ORDER BY m.numero
    `;
    const optimizadaResult = await pool.query(optimizadaQuery);
    console.table(optimizadaResult.rows);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

debugMesasVentas();
