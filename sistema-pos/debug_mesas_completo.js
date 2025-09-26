const { Pool } = require('pg');

// Configuración correcta de la base de datos
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'sistempos',
  user: 'postgres',
  password: '6951230Anacleta'
});

async function debugMesasCompleto() {
  try {
    console.log('🔍 [DEBUG] Verificando estado completo de mesas...\n');

    // 1. Verificar todas las mesas con sus datos actuales
    console.log('📋 TODAS LAS MESAS:');
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
      ORDER BY m.numero
    `;
    const mesasResult = await pool.query(mesasQuery);
    console.table(mesasResult.rows);

    // 2. Para cada mesa, verificar sus ventas
    for (const mesa of mesasResult.rows) {
      console.log(`\n🎯 MESA ${mesa.numero} (ID: ${mesa.id_mesa}):`);
      console.log(`   Estado: ${mesa.estado}`);
      console.log(`   Total Acumulado: ${mesa.total_acumulado}`);
      console.log(`   ID Venta Actual: ${mesa.id_venta_actual}`);
      
      // Verificar ventas para esta mesa
      const ventasMesaQuery = `
        SELECT 
          v.id_venta,
          v.estado,
          v.total,
          v.fecha,
          v.tipo_servicio
        FROM ventas v
        WHERE v.mesa_numero = $1
        ORDER BY v.fecha DESC
        LIMIT 3
      `;
      const ventasMesaResult = await pool.query(ventasMesaQuery, [mesa.numero]);
      
      if (ventasMesaResult.rows.length > 0) {
        console.log('   📦 Ventas recientes:');
        console.table(ventasMesaResult.rows);
        
        // Verificar detalles de la venta más reciente
        const ventaReciente = ventasMesaResult.rows[0];
        const detallesQuery = `
          SELECT 
            dv.id_detalle,
            dv.cantidad,
            dv.precio_unitario,
            dv.subtotal,
            p.nombre as producto_nombre
          FROM detalle_ventas dv
          LEFT JOIN productos p ON dv.id_producto = p.id_producto
          WHERE dv.id_venta = $1
        `;
        const detallesResult = await pool.query(detallesQuery, [ventaReciente.id_venta]);
        
        if (detallesResult.rows.length > 0) {
          console.log(`   🛒 Detalles de venta ${ventaReciente.id_venta}:`);
          console.table(detallesResult.rows);
        } else {
          console.log(`   ❌ No hay detalles para venta ${ventaReciente.id_venta}`);
        }
      } else {
        console.log('   ❌ No hay ventas para esta mesa');
      }
    }

    // 3. Verificar la consulta optimizada que usa el frontend
    console.log('\n🔧 CONSULTA OPTIMIZADA (como la usa el frontend):');
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
          AND estado IN ('abierta', 'en_uso', 'pendiente_cobro', 'entregado')
        ORDER BY mesa_numero, fecha DESC
      ) v_activa ON m.numero = v_activa.mesa_numero
      WHERE m.id_sucursal = 7 AND m.id_restaurante = 1
      ORDER BY m.numero
    `;
    const optimizadaResult = await pool.query(optimizadaQuery);
    console.table(optimizadaResult.rows);

    // 4. Verificar si hay problemas con totales acumulados
    console.log('\n💰 ANÁLISIS DE TOTALES ACUMULADOS:');
    const totalesQuery = `
      SELECT 
        m.numero,
        m.total_acumulado as total_mesa,
        COALESCE(SUM(v.total), 0) as suma_ventas_activas,
        COUNT(v.id_venta) as cantidad_ventas_activas
      FROM mesas m
      LEFT JOIN ventas v ON m.numero = v.mesa_numero 
        AND v.estado IN ('abierta', 'en_uso', 'pendiente_cobro', 'entregado')
      WHERE m.id_restaurante = 1
      GROUP BY m.numero, m.total_acumulado
      HAVING m.total_acumulado > 0 OR COUNT(v.id_venta) > 0
      ORDER BY m.numero
    `;
    const totalesResult = await pool.query(totalesQuery);
    console.table(totalesResult.rows);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
  }
}

debugMesasCompleto();
