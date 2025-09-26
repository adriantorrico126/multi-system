const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'sistempos',
  user: 'postgres',
  password: '6951230Anacleta'
});

async function analisisPrefacturasCompleto() {
  try {
    console.log('🔍 [ANÁLISIS COMPLETO PREFACTURAS Y TOTALES] Iniciando...\n');

    // 1. Verificar estado actual de todas las mesas
    console.log('📋 ESTADO ACTUAL DE MESAS:');
    const mesasQuery = `
      SELECT 
        m.id_mesa,
        m.numero,
        m.estado,
        m.total_acumulado,
        m.id_venta_actual,
        m.hora_apertura,
        m.hora_cierre
      FROM mesas m
      WHERE m.id_sucursal = 7 AND m.id_restaurante = 1
      ORDER BY m.numero
    `;
    const mesasResult = await pool.query(mesasQuery);
    console.table(mesasResult.rows);

    // 2. Verificar todas las ventas relacionadas con mesas
    console.log('\n📦 TODAS LAS VENTAS DE MESAS:');
    const ventasQuery = `
      SELECT 
        id_venta,
        mesa_numero,
        estado,
        total,
        fecha,
        tipo_servicio,
        id_vendedor
      FROM ventas 
      WHERE id_sucursal = 7 
        AND id_restaurante = 1 
        AND mesa_numero IS NOT NULL
      ORDER BY mesa_numero, fecha DESC
    `;
    const ventasResult = await pool.query(ventasQuery);
    console.table(ventasResult.rows);

    // 3. Verificar detalles de productos para cada venta
    console.log('\n🛒 DETALLES DE PRODUCTOS POR VENTA:');
    for (const venta of ventasResult.rows) {
      const detallesQuery = `
        SELECT 
          dv.id_detalle,
          dv.id_venta,
          dv.cantidad,
          dv.precio_unitario,
          dv.subtotal,
          dv.observaciones,
          p.nombre as producto_nombre,
          p.id_producto
        FROM detalle_ventas dv
        LEFT JOIN productos p ON dv.id_producto = p.id_producto
        WHERE dv.id_venta = $1
        ORDER BY dv.created_at ASC
      `;
      const detallesResult = await pool.query(detallesQuery, [venta.id_venta]);
      
      if (detallesResult.rows.length > 0) {
        console.log(`\n📋 Venta ${venta.id_venta} (Mesa ${venta.mesa_numero}) - ${detallesResult.rows.length} productos:`);
        console.table(detallesResult.rows);
      } else {
        console.log(`❌ Venta ${venta.id_venta} (Mesa ${venta.mesa_numero}) - SIN PRODUCTOS`);
      }
    }

    // 4. Verificar la consulta optimizada del backend
    console.log('\n🔧 CONSULTA OPTIMIZADA DEL BACKEND:');
    const consultaOptimizadaQuery = `
      SELECT 
        m.id_mesa,
        m.numero,
        m.estado,
        COALESCE(v_activa.total, 0) as total_acumulado_calculado,
        m.total_acumulado as total_acumulado_tabla,
        v_activa.id_venta as id_venta_actual,
        v_activa.estado as venta_estado,
        v_activa.total as venta_total,
        v_activa.fecha as venta_fecha
      FROM mesas m
      LEFT JOIN (
        SELECT DISTINCT ON (mesa_numero) 
          id_venta, mesa_numero, total, fecha, estado
        FROM ventas 
        WHERE id_sucursal = 7 
          AND id_restaurante = 1 
          AND estado IN ('abierta', 'en_uso', 'pendiente_cobro', 'entregado', 'recibido')
        ORDER BY mesa_numero, fecha DESC
      ) v_activa ON m.numero = v_activa.mesa_numero
      WHERE m.id_sucursal = 7 AND m.id_restaurante = 1
      ORDER BY m.numero
    `;
    const consultaOptimizadaResult = await pool.query(consultaOptimizadaQuery);
    console.table(consultaOptimizadaResult.rows);

    // 5. Verificar discrepancias entre tabla y cálculo
    console.log('\n⚠️ DISCREPANCIAS DETECTADAS:');
    for (const row of consultaOptimizadaResult.rows) {
      if (row.total_acumulado_tabla !== row.total_acumulado_calculado) {
        console.log(`❌ Mesa ${row.numero}: Tabla=${row.total_acumulado_tabla}, Calculado=${row.total_acumulado_calculado}`);
      }
      if (!row.id_venta_actual && row.total_acumulado_tabla > 0) {
        console.log(`⚠️ Mesa ${row.numero}: Tiene total en tabla pero no venta actual`);
      }
    }

    // 6. Verificar prefacturas abiertas
    console.log('\n📄 PREFACTURAS ABIERTAS:');
    const prefacturasQuery = `
      SELECT 
        p.id_prefactura,
        p.id_mesa,
        p.estado,
        p.total,
        p.fecha_apertura,
        p.fecha_cierre,
        m.numero as mesa_numero
      FROM prefacturas p
      LEFT JOIN mesas m ON p.id_mesa = m.id_mesa
      WHERE p.estado = 'abierta'
      ORDER BY p.fecha_apertura DESC
    `;
    const prefacturasResult = await pool.query(prefacturasQuery);
    console.table(prefacturasResult.rows);

    // 7. Verificar el endpoint específico para getVentaConDetalles
    console.log('\n🔍 VERIFICANDO ENDPOINT getVentaConDetalles:');
    const ventasConDetalles = ventasResult.rows.slice(0, 3); // Solo las primeras 3
    for (const venta of ventasConDetalles) {
      console.log(`\n📋 Verificando venta ${venta.id_venta} (Mesa ${venta.mesa_numero}):`);
      
      // Simular la consulta exacta del endpoint
      const endpointVentaQuery = `
        SELECT v.*, u.nombre as vendedor_nombre, u.apellido as vendedor_apellido
        FROM ventas v
        LEFT JOIN usuarios u ON v.id_vendedor = u.id_usuario
        WHERE v.id_venta = $1 AND v.id_restaurante = $2
      `;
      const ventaEndpointResult = await pool.query(endpointVentaQuery, [venta.id_venta, 1]);
      
      if (ventaEndpointResult.rows.length > 0) {
        console.log('✅ Venta encontrada en endpoint');
        
        const endpointDetallesQuery = `
          SELECT dv.*, p.nombre as producto_nombre, p.precio as producto_precio
          FROM detalle_ventas dv
          LEFT JOIN productos p ON dv.id_producto = p.id_producto
          WHERE dv.id_venta = $1 AND dv.id_restaurante = $2
          ORDER BY dv.created_at ASC
        `;
        const detallesEndpointResult = await pool.query(endpointDetallesQuery, [venta.id_venta, 1]);
        console.log(`✅ Detalles encontrados: ${detallesEndpointResult.rows.length} productos`);
        
        if (detallesEndpointResult.rows.length > 0) {
          console.table(detallesEndpointResult.rows);
        }
      } else {
        console.log('❌ Venta NO encontrada en endpoint');
      }
    }

    // 8. Verificar historial de liberaciones de mesas
    console.log('\n🔄 HISTORIAL DE LIBERACIONES:');
    const liberacionesQuery = `
      SELECT 
        mesa_numero,
        COUNT(*) as veces_liberada,
        MAX(fecha) as ultima_liberacion,
        SUM(total) as total_historial
      FROM ventas 
      WHERE id_sucursal = 7 
        AND id_restaurante = 1 
        AND mesa_numero IS NOT NULL
        AND estado IN ('cerrada', 'pagada')
      GROUP BY mesa_numero
      ORDER BY mesa_numero
    `;
    const liberacionesResult = await pool.query(liberacionesQuery);
    console.table(liberacionesResult.rows);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
  }
}

analisisPrefacturasCompleto();
