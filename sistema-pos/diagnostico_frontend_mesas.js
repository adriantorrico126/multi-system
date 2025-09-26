const { Pool } = require('pg');

// Configuración correcta de la base de datos
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'sistempos',
  user: 'postgres',
  password: '6951230Anacleta'
});

async function diagnosticoFrontendMesas() {
  try {
    console.log('🔍 [DIAGNÓSTICO FRONTEND MESAS] Iniciando análisis completo...\n');

    // 1. Verificar la consulta exacta que usa el frontend
    console.log('📋 CONSULTA FRONTEND (getMesas):');
    const frontendQuery = `
      SELECT 
        m.id_mesa,
        m.numero,
        m.capacidad,
        m.estado,
        COALESCE(v_activa.total, 0) as total_acumulado,
        m.hora_apertura,
        m.hora_cierre,
        m.id_restaurante,
        m.id_grupo_mesa,
        v_activa.id_venta as id_venta_actual,
        v_activa.total as total_venta_actual,
        v_activa.fecha as fecha_venta_actual,
        g.estado as estado_grupo,
        vd.nombre as nombre_mesero_grupo
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
      LEFT JOIN grupos_mesas g ON m.id_grupo_mesa = g.id_grupo_mesa
      LEFT JOIN vendedores vd ON g.id_mesero = vd.id_vendedor
      WHERE m.id_sucursal = 7 AND m.id_restaurante = 1
      ORDER BY m.numero
    `;
    const frontendResult = await pool.query(frontendQuery);
    console.table(frontendResult.rows);

    // 2. Verificar ventas activas por mesa
    console.log('\n📦 VENTAS ACTIVAS POR MESA:');
    const ventasActivasQuery = `
      SELECT 
        mesa_numero,
        id_venta,
        estado,
        total,
        fecha,
        tipo_servicio
      FROM ventas 
      WHERE id_sucursal = 7 
        AND id_restaurante = 1 
        AND estado IN ('abierta', 'en_uso', 'pendiente_cobro', 'entregado', 'recibido')
      ORDER BY mesa_numero, fecha DESC
    `;
    const ventasActivasResult = await pool.query(ventasActivasQuery);
    console.table(ventasActivasResult.rows);

    // 3. Verificar detalles de ventas para prefactura
    console.log('\n🛒 DETALLES DE VENTAS (para prefactura):');
    for (const venta of ventasActivasResult.rows) {
      const detallesQuery = `
        SELECT 
          dv.id_detalle,
          dv.cantidad,
          dv.precio_unitario,
          dv.subtotal,
          dv.observaciones,
          p.nombre as producto_nombre
        FROM detalle_ventas dv
        LEFT JOIN productos p ON dv.id_producto = p.id_producto
        WHERE dv.id_venta = $1
        ORDER BY dv.created_at ASC
      `;
      const detallesResult = await pool.query(detallesQuery, [venta.id_venta]);
      
      if (detallesResult.rows.length > 0) {
        console.log(`\n📋 Venta ${venta.id_venta} (Mesa ${venta.mesa_numero}):`);
        console.table(detallesResult.rows);
      }
    }

    // 4. Verificar estados de mesas en la tabla
    console.log('\n🏠 ESTADOS DE MESAS EN TABLA:');
    const estadosMesasQuery = `
      SELECT 
        numero,
        estado,
        total_acumulado,
        id_venta_actual,
        hora_apertura
      FROM mesas 
      WHERE id_sucursal = 7 AND id_restaurante = 1
      ORDER BY numero
    `;
    const estadosMesasResult = await pool.query(estadosMesasQuery);
    console.table(estadosMesasResult.rows);

    // 5. Verificar discrepancias entre tabla y ventas
    console.log('\n⚠️ DISCREPANCIAS DETECTADAS:');
    for (const mesa of frontendResult.rows) {
      const mesaTabla = estadosMesasResult.rows.find(m => m.numero === mesa.numero);
      if (mesaTabla) {
        if (mesaTabla.total_acumulado !== mesa.total_acumulado) {
          console.log(`❌ Mesa ${mesa.numero}: Tabla=${mesaTabla.total_acumulado}, Frontend=${mesa.total_acumulado}`);
        }
        if (mesaTabla.id_venta_actual !== mesa.id_venta_actual) {
          console.log(`❌ Mesa ${mesa.numero}: Tabla venta=${mesaTabla.id_venta_actual}, Frontend venta=${mesa.id_venta_actual}`);
        }
      }
    }

    // 6. Verificar endpoint de getVentaConDetalles
    console.log('\n🔍 VERIFICANDO ENDPOINT getVentaConDetalles:');
    const ventasConDetalles = ventasActivasResult.rows.slice(0, 2); // Solo las primeras 2
    for (const venta of ventasConDetalles) {
      console.log(`\n📋 Verificando venta ${venta.id_venta}:`);
      
      // Simular la consulta del endpoint
      const endpointQuery = `
        SELECT v.*, u.nombre as vendedor_nombre, u.apellido as vendedor_apellido
        FROM ventas v
        LEFT JOIN usuarios u ON v.id_vendedor = u.id_usuario
        WHERE v.id_venta = $1 AND v.id_restaurante = $2
      `;
      const ventaResult = await pool.query(endpointQuery, [venta.id_venta, 1]);
      
      if (ventaResult.rows.length > 0) {
        console.log('✅ Venta encontrada:', ventaResult.rows[0]);
        
        const detallesEndpointQuery = `
          SELECT dv.*, p.nombre as producto_nombre, p.precio as producto_precio
          FROM detalle_ventas dv
          LEFT JOIN productos p ON dv.id_producto = p.id_producto
          WHERE dv.id_venta = $1 AND dv.id_restaurante = $2
          ORDER BY dv.created_at ASC
        `;
        const detallesEndpointResult = await pool.query(detallesEndpointQuery, [venta.id_venta, 1]);
        console.log('✅ Detalles encontrados:', detallesEndpointResult.rows.length, 'productos');
        if (detallesEndpointResult.rows.length > 0) {
          console.table(detallesEndpointResult.rows);
        }
      } else {
        console.log('❌ Venta no encontrada en endpoint');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
  }
}

diagnosticoFrontendMesas();
