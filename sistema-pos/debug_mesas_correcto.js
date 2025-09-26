const { Pool } = require('pg');

// Configuración correcta de la base de datos
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'sistempos',
  user: 'postgres',
  password: '6951230Anacleta'
});

async function debugMesasCorrecto() {
  try {
    console.log('🔍 [DEBUG] Verificando estado de mesas y ventas...\n');
    console.log('📊 Conectando a base de datos: sistempos');

    // 1. Verificar estructura de la tabla mesas
    console.log('\n📋 ESTRUCTURA DE TABLA MESAS:');
    const estructuraQuery = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'mesas' 
      ORDER BY ordinal_position;
    `;
    const estructuraResult = await pool.query(estructuraQuery);
    console.table(estructuraResult.rows);

    // 2. Verificar mesas
    console.log('\n📋 MESAS:');
    const mesasQuery = `
      SELECT 
        m.id_mesa,
        m.numero,
        m.estado,
        m.total_acumulado,
        m.id_venta_actual,
        m.hora_apertura,
        m.id_restaurante,
        m.id_sucursal
      FROM mesas m
      WHERE m.id_restaurante = 1
      ORDER BY m.numero
    `;
    const mesasResult = await pool.query(mesasQuery);
    console.table(mesasResult.rows);

    // 3. Verificar ventas activas
    console.log('\n💰 VENTAS ACTIVAS:');
    const ventasQuery = `
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
      WHERE v.id_restaurante = 1 
        AND v.estado IN ('abierta', 'en_uso', 'pendiente_cobro')
      ORDER BY v.fecha DESC
    `;
    const ventasResult = await pool.query(ventasQuery);
    console.table(ventasResult.rows);

    // 4. Verificar detalles de ventas
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

    // 5. Verificar la consulta optimizada que implementamos
    console.log('\n🔧 CONSULTA OPTIMIZADA DE MESAS:');
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

    // 6. Verificar si hay ventas para mesa específica (ejemplo mesa 1)
    console.log('\n🎯 VENTAS PARA MESA 1:');
    const mesa1Query = `
      SELECT 
        v.id_venta,
        v.mesa_numero,
        v.estado,
        v.total,
        v.fecha,
        COUNT(dv.id_detalle) as total_detalles
      FROM ventas v
      LEFT JOIN detalle_ventas dv ON v.id_venta = dv.id_venta
      WHERE v.mesa_numero = 1 
        AND v.id_restaurante = 1
      GROUP BY v.id_venta, v.mesa_numero, v.estado, v.total, v.fecha
      ORDER BY v.fecha DESC
    `;
    const mesa1Result = await pool.query(mesa1Query);
    console.table(mesa1Result.rows);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
  }
}

debugMesasCorrecto();
