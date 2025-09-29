const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'sistempos',
  user: 'postgres',
  password: '6951230Anacleta'
});

async function diagnosticarProblemasEspecificos() {
  try {
    console.log('🔍 [DIAGNÓSTICO PROBLEMAS ESPECÍFICOS] Iniciando...\n');

    // 1. Verificar Mesa 1 específicamente
    console.log('🎯 VERIFICANDO MESA 1:');
    const mesa1Query = `
      SELECT 
        m.id_mesa,
        m.numero,
        m.estado,
        m.total_acumulado,
        m.id_venta_actual,
        m.hora_apertura,
        m.hora_cierre
      FROM mesas m
      WHERE m.numero = 1 AND m.id_restaurante = 1
    `;
    const mesa1Result = await pool.query(mesa1Query);
    
    if (mesa1Result.rows.length > 0) {
      const mesa1 = mesa1Result.rows[0];
      console.log('✅ Mesa 1 encontrada:');
      console.log(`   - Estado: ${mesa1.estado}`);
      console.log(`   - Total Acumulado: ${mesa1.total_acumulado}`);
      console.log(`   - ID Venta Actual: ${mesa1.id_venta_actual}`);
      console.log(`   - Hora Apertura: ${mesa1.hora_apertura}`);
      
      // 2. Verificar ventas de Mesa 1
      console.log('\n📦 VENTAS DE MESA 1:');
      const ventasMesa1Query = `
        SELECT 
          id_venta,
          estado,
          total,
          fecha,
          tipo_servicio
        FROM ventas 
        WHERE mesa_numero = 1 AND id_restaurante = 1
        ORDER BY fecha DESC
      `;
      const ventasMesa1Result = await pool.query(ventasMesa1Query);
      
      if (ventasMesa1Result.rows.length > 0) {
        console.log('✅ Ventas encontradas:');
        ventasMesa1Result.rows.forEach(venta => {
          console.log(`   - Venta ${venta.id_venta}: estado=${venta.estado}, total=${venta.total}, fecha=${venta.fecha}`);
        });
        
        // 3. Verificar detalles de la venta más reciente
        const ventaReciente = ventasMesa1Result.rows[0];
        console.log(`\n🛒 DETALLES DE VENTA ${ventaReciente.id_venta}:`);
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
        const detallesResult = await pool.query(detallesQuery, [ventaReciente.id_venta]);
        
        if (detallesResult.rows.length > 0) {
          console.log('✅ Productos encontrados:');
          detallesResult.rows.forEach(detalle => {
            console.log(`   - ${detalle.producto_nombre}: ${detalle.cantidad} x $${detalle.precio_unitario} = $${detalle.subtotal}`);
          });
        } else {
          console.log('❌ NO HAY PRODUCTOS EN LOS DETALLES');
        }
        
        // 4. Verificar el endpoint específico
        console.log(`\n🔍 VERIFICANDO ENDPOINT PARA VENTA ${ventaReciente.id_venta}:`);
        const endpointVentaQuery = `
          SELECT v.*, u.nombre as vendedor_nombre, u.apellido as vendedor_apellido
          FROM ventas v
          LEFT JOIN usuarios u ON v.id_vendedor = u.id_usuario
          WHERE v.id_venta = $1 AND v.id_restaurante = $2
        `;
        const ventaEndpointResult = await pool.query(endpointVentaQuery, [ventaReciente.id_venta, 1]);
        
        if (ventaEndpointResult.rows.length > 0) {
          console.log('✅ Venta encontrada en endpoint');
          
          const endpointDetallesQuery = `
            SELECT dv.*, p.nombre as producto_nombre, p.precio as producto_precio
            FROM detalle_ventas dv
            LEFT JOIN productos p ON dv.id_producto = p.id_producto
            WHERE dv.id_venta = $1 AND dv.id_restaurante = $2
            ORDER BY dv.created_at ASC
          `;
          const detallesEndpointResult = await pool.query(endpointDetallesQuery, [ventaReciente.id_venta, 1]);
          console.log(`✅ Detalles en endpoint: ${detallesEndpointResult.rows.length} productos`);
          
          if (detallesEndpointResult.rows.length > 0) {
            detallesEndpointResult.rows.forEach(detalle => {
              console.log(`   - ${detalle.producto_nombre}: ${detalle.cantidad} x $${detalle.precio_unitario} = $${detalle.subtotal}`);
            });
          }
        } else {
          console.log('❌ Venta NO encontrada en endpoint');
        }
        
      } else {
        console.log('❌ NO HAY VENTAS PARA MESA 1');
      }
      
      // 5. Verificar la consulta optimizada del frontend
      console.log('\n🔧 CONSULTA OPTIMIZADA FRONTEND:');
      const consultaFrontendQuery = `
        SELECT 
          m.id_mesa,
          m.numero,
          m.estado,
          COALESCE(v_activa.total, 0) as total_acumulado_calculado,
          m.total_acumulado as total_acumulado_tabla,
          v_activa.id_venta as id_venta_actual,
          v_activa.estado as venta_estado,
          v_activa.total as venta_total
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
        WHERE m.numero = 1 AND m.id_restaurante = 1
      `;
      const consultaFrontendResult = await pool.query(consultaFrontendQuery);
      
      if (consultaFrontendResult.rows.length > 0) {
        const row = consultaFrontendResult.rows[0];
        console.log('✅ Resultado consulta frontend:');
        console.log(`   - Total Tabla: ${row.total_acumulado_tabla}`);
        console.log(`   - Total Calculado: ${row.total_acumulado_calculado}`);
        console.log(`   - ID Venta Actual: ${row.id_venta_actual}`);
        console.log(`   - Estado Venta: ${row.venta_estado}`);
        console.log(`   - Total Venta: ${row.venta_total}`);
        
        if (row.total_acumulado_tabla !== row.total_acumulado_calculado) {
          console.log('⚠️ DISCREPANCIA DETECTADA: Los totales no coinciden');
        }
      }
      
    } else {
      console.log('❌ MESA 1 NO ENCONTRADA');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

diagnosticarProblemasEspecificos();

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'sistempos',
  user: 'postgres',
  password: '6951230Anacleta'
});

async function diagnosticarProblemasEspecificos() {
  try {
    console.log('🔍 [DIAGNÓSTICO PROBLEMAS ESPECÍFICOS] Iniciando...\n');

    // 1. Verificar Mesa 1 específicamente
    console.log('🎯 VERIFICANDO MESA 1:');
    const mesa1Query = `
      SELECT 
        m.id_mesa,
        m.numero,
        m.estado,
        m.total_acumulado,
        m.id_venta_actual,
        m.hora_apertura,
        m.hora_cierre
      FROM mesas m
      WHERE m.numero = 1 AND m.id_restaurante = 1
    `;
    const mesa1Result = await pool.query(mesa1Query);
    
    if (mesa1Result.rows.length > 0) {
      const mesa1 = mesa1Result.rows[0];
      console.log('✅ Mesa 1 encontrada:');
      console.log(`   - Estado: ${mesa1.estado}`);
      console.log(`   - Total Acumulado: ${mesa1.total_acumulado}`);
      console.log(`   - ID Venta Actual: ${mesa1.id_venta_actual}`);
      console.log(`   - Hora Apertura: ${mesa1.hora_apertura}`);
      
      // 2. Verificar ventas de Mesa 1
      console.log('\n📦 VENTAS DE MESA 1:');
      const ventasMesa1Query = `
        SELECT 
          id_venta,
          estado,
          total,
          fecha,
          tipo_servicio
        FROM ventas 
        WHERE mesa_numero = 1 AND id_restaurante = 1
        ORDER BY fecha DESC
      `;
      const ventasMesa1Result = await pool.query(ventasMesa1Query);
      
      if (ventasMesa1Result.rows.length > 0) {
        console.log('✅ Ventas encontradas:');
        ventasMesa1Result.rows.forEach(venta => {
          console.log(`   - Venta ${venta.id_venta}: estado=${venta.estado}, total=${venta.total}, fecha=${venta.fecha}`);
        });
        
        // 3. Verificar detalles de la venta más reciente
        const ventaReciente = ventasMesa1Result.rows[0];
        console.log(`\n🛒 DETALLES DE VENTA ${ventaReciente.id_venta}:`);
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
        const detallesResult = await pool.query(detallesQuery, [ventaReciente.id_venta]);
        
        if (detallesResult.rows.length > 0) {
          console.log('✅ Productos encontrados:');
          detallesResult.rows.forEach(detalle => {
            console.log(`   - ${detalle.producto_nombre}: ${detalle.cantidad} x $${detalle.precio_unitario} = $${detalle.subtotal}`);
          });
        } else {
          console.log('❌ NO HAY PRODUCTOS EN LOS DETALLES');
        }
        
        // 4. Verificar el endpoint específico
        console.log(`\n🔍 VERIFICANDO ENDPOINT PARA VENTA ${ventaReciente.id_venta}:`);
        const endpointVentaQuery = `
          SELECT v.*, u.nombre as vendedor_nombre, u.apellido as vendedor_apellido
          FROM ventas v
          LEFT JOIN usuarios u ON v.id_vendedor = u.id_usuario
          WHERE v.id_venta = $1 AND v.id_restaurante = $2
        `;
        const ventaEndpointResult = await pool.query(endpointVentaQuery, [ventaReciente.id_venta, 1]);
        
        if (ventaEndpointResult.rows.length > 0) {
          console.log('✅ Venta encontrada en endpoint');
          
          const endpointDetallesQuery = `
            SELECT dv.*, p.nombre as producto_nombre, p.precio as producto_precio
            FROM detalle_ventas dv
            LEFT JOIN productos p ON dv.id_producto = p.id_producto
            WHERE dv.id_venta = $1 AND dv.id_restaurante = $2
            ORDER BY dv.created_at ASC
          `;
          const detallesEndpointResult = await pool.query(endpointDetallesQuery, [ventaReciente.id_venta, 1]);
          console.log(`✅ Detalles en endpoint: ${detallesEndpointResult.rows.length} productos`);
          
          if (detallesEndpointResult.rows.length > 0) {
            detallesEndpointResult.rows.forEach(detalle => {
              console.log(`   - ${detalle.producto_nombre}: ${detalle.cantidad} x $${detalle.precio_unitario} = $${detalle.subtotal}`);
            });
          }
        } else {
          console.log('❌ Venta NO encontrada en endpoint');
        }
        
      } else {
        console.log('❌ NO HAY VENTAS PARA MESA 1');
      }
      
      // 5. Verificar la consulta optimizada del frontend
      console.log('\n🔧 CONSULTA OPTIMIZADA FRONTEND:');
      const consultaFrontendQuery = `
        SELECT 
          m.id_mesa,
          m.numero,
          m.estado,
          COALESCE(v_activa.total, 0) as total_acumulado_calculado,
          m.total_acumulado as total_acumulado_tabla,
          v_activa.id_venta as id_venta_actual,
          v_activa.estado as venta_estado,
          v_activa.total as venta_total
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
        WHERE m.numero = 1 AND m.id_restaurante = 1
      `;
      const consultaFrontendResult = await pool.query(consultaFrontendQuery);
      
      if (consultaFrontendResult.rows.length > 0) {
        const row = consultaFrontendResult.rows[0];
        console.log('✅ Resultado consulta frontend:');
        console.log(`   - Total Tabla: ${row.total_acumulado_tabla}`);
        console.log(`   - Total Calculado: ${row.total_acumulado_calculado}`);
        console.log(`   - ID Venta Actual: ${row.id_venta_actual}`);
        console.log(`   - Estado Venta: ${row.venta_estado}`);
        console.log(`   - Total Venta: ${row.venta_total}`);
        
        if (row.total_acumulado_tabla !== row.total_acumulado_calculado) {
          console.log('⚠️ DISCREPANCIA DETECTADA: Los totales no coinciden');
        }
      }
      
    } else {
      console.log('❌ MESA 1 NO ENCONTRADA');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

diagnosticarProblemasEspecificos();


