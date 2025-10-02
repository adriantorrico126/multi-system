const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  user: 'postgres', 
  password: '6951230Anacleta',
  database: 'sistempos',
  port: 5432
});

async function updateBackendForBranchStock() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 ACTUALIZANDO BACKEND PARA STOCK POR SUCURSAL...\n');
    
    await client.query('BEGIN');
    
    // 1. Actualizar función actualizar_stock_producto
    console.log('1️⃣ ACTUALIZANDO FUNCIÓN actualizar_stock_producto...');
    const updateStockFunction = `
      CREATE OR REPLACE FUNCTION actualizar_stock_producto()
      RETURNS TRIGGER AS $$
      DECLARE
        id_sucursal_lote INTEGER;
        id_restaurante_lote INTEGER;
      BEGIN
        -- Obtener información del lote
        IF TG_OP = 'DELETE' THEN
          id_sucursal_lote := OLD.id_sucursal;
          id_restaurante_lote := OLD.id_restaurante;
        ELSE
          id_sucursal_lote := NEW.id_sucursal;
          id_restaurante_lote := NEW.id_restaurante;
        END IF;
        
        -- Actualizar stock del producto en la sucursal específica
        IF id_sucursal_lote IS NOT NULL THEN
          UPDATE stock_sucursal 
          SET stock_actual = (
            SELECT COALESCE(SUM(cantidad_actual), 0)
            FROM inventario_lotes 
            WHERE id_producto = COALESCE(NEW.id_producto, OLD.id_producto) 
              AND id_sucursal = id_sucursal_lote 
              AND activo = true
          ),
          updated_at = NOW()
          WHERE id_producto = COALESCE(NEW.id_producto, OLD.id_producto)
            AND id_sucursal = id_sucursal_lote;
        END IF;
        
        -- También actualizar stock global del producto (para compatibilidad)
        UPDATE productos 
        SET stock_actual = (
          SELECT COALESCE(SUM(ss.stock_actual), 0)
          FROM stock_sucursal ss
          JOIN sucursales s ON ss.id_sucursal = s.id_sucursal
          WHERE ss.id_producto = COALESCE(NEW.id_producto, OLD.id_producto)
            AND s.id_restaurante = id_restaurante_lote
            AND ss.activo = true
        )
        WHERE id_producto = COALESCE(NEW.id_producto, OLD.id_producto);
        
        RETURN COALESCE(NEW, OLD);
      END;
      $$ LANGUAGE plpgsql;
    `;
    
    await client.query(updateStockFunction);
    console.log('   ✅ Función actualizar_stock_producto actualizada');
    
    // 2. Actualizar función registrar_movimiento_inventario
    console.log('\n2️⃣ ACTUALIZANDO FUNCIÓN registrar_movimiento_inventario...');
    const updateMovementFunction = `
      CREATE OR REPLACE FUNCTION registrar_movimiento_inventario()
      RETURNS TRIGGER AS $$
      DECLARE
        stock_anterior_lote INTEGER;
        stock_nuevo_lote INTEGER;
        cantidad_cambio INTEGER;
        tipo_movimiento_lote VARCHAR(50);
      BEGIN
        -- Determinar tipo de movimiento y cantidad
        IF TG_OP = 'INSERT' THEN
          stock_anterior_lote := 0;
          stock_nuevo_lote := NEW.cantidad_actual;
          cantidad_cambio := NEW.cantidad_actual;
          tipo_movimiento_lote := 'entrada_lote';
        ELSIF TG_OP = 'UPDATE' THEN
          stock_anterior_lote := OLD.cantidad_actual;
          stock_nuevo_lote := NEW.cantidad_actual;
          cantidad_cambio := NEW.cantidad_actual - OLD.cantidad_actual;
          IF cantidad_cambio > 0 THEN
            tipo_movimiento_lote := 'entrada_lote';
          ELSE
            tipo_movimiento_lote := 'salida_lote';
          END IF;
        ELSIF TG_OP = 'DELETE' THEN
          stock_anterior_lote := OLD.cantidad_actual;
          stock_nuevo_lote := 0;
          cantidad_cambio := -OLD.cantidad_actual;
          tipo_movimiento_lote := 'eliminacion_lote';
        END IF;
        
        -- Registrar movimiento si hay cambio
        IF cantidad_cambio != 0 THEN
          INSERT INTO movimientos_inventario (
            id_producto,
            id_sucursal,
            tipo_movimiento,
            cantidad,
            stock_anterior,
            stock_actual,
            id_restaurante,
            id_lote,
            motivo
          ) VALUES (
            COALESCE(NEW.id_producto, OLD.id_producto),
            COALESCE(NEW.id_sucursal, OLD.id_sucursal),
            tipo_movimiento_lote,
            ABS(cantidad_cambio),
            stock_anterior_lote,
            stock_nuevo_lote,
            COALESCE(NEW.id_restaurante, OLD.id_restaurante),
            COALESCE(NEW.id_lote, OLD.id_lote),
            'Movimiento automático por lote: ' || tipo_movimiento_lote
          );
        END IF;
        
        RETURN COALESCE(NEW, OLD);
      END;
      $$ LANGUAGE plpgsql;
    `;
    
    await client.query(updateMovementFunction);
    console.log('   ✅ Función registrar_movimiento_inventario actualizada');
    
    // 3. Actualizar función generar_alertas_inventario
    console.log('\n3️⃣ ACTUALIZANDO FUNCIÓN generar_alertas_inventario...');
    const updateAlertsFunction = `
      CREATE OR REPLACE FUNCTION generar_alertas_inventario()
      RETURNS TRIGGER AS $$
      DECLARE
        dias_restantes INTEGER;
        nivel_urgencia VARCHAR(20);
        mensaje TEXT;
        stock_sucursal_actual INTEGER;
      BEGIN
        -- Obtener stock actual en la sucursal
        SELECT stock_actual INTO stock_sucursal_actual
        FROM stock_sucursal
        WHERE id_producto = NEW.id_producto 
          AND id_sucursal = NEW.id_sucursal
          AND activo = true;
        
        -- Generar alerta por stock bajo en sucursal
        IF stock_sucursal_actual IS NOT NULL AND stock_sucursal_actual <= 5 AND stock_sucursal_actual > 0 THEN
          INSERT INTO alertas_inventario (
            id_producto, 
            id_sucursal,
            id_lote, 
            tipo_alerta, 
            mensaje, 
            nivel_urgencia, 
            id_restaurante
          ) VALUES (
            NEW.id_producto, 
            NEW.id_sucursal,
            NEW.id_lote, 
            'stock_bajo_sucursal', 
            'Stock bajo en sucursal - Lote ' || NEW.numero_lote, 
            'alta', 
            NEW.id_restaurante
          );
        END IF;
        
        -- Generar alerta por stock agotado
        IF stock_sucursal_actual IS NOT NULL AND stock_sucursal_actual = 0 THEN
          INSERT INTO alertas_inventario (
            id_producto, 
            id_sucursal,
            id_lote, 
            tipo_alerta, 
            mensaje, 
            nivel_urgencia, 
            id_restaurante
          ) VALUES (
            NEW.id_producto, 
            NEW.id_sucursal,
            NEW.id_lote, 
            'stock_agotado_sucursal', 
            'Stock agotado en sucursal - Lote ' || NEW.numero_lote, 
            'critica', 
            NEW.id_restaurante
          );
        END IF;
        
        -- Generar alerta por caducidad próxima
        IF NEW.fecha_caducidad IS NOT NULL THEN
          dias_restantes := NEW.fecha_caducidad - CURRENT_DATE;
          
          IF dias_restantes <= 7 AND dias_restantes > 0 THEN
            nivel_urgencia := 'alta';
            mensaje := 'Lote ' || NEW.numero_lote || ' caduca en ' || dias_restantes || ' días (Sucursal)';
          ELSIF dias_restantes <= 30 AND dias_restantes > 7 THEN
            nivel_urgencia := 'media';
            mensaje := 'Lote ' || NEW.numero_lote || ' caduca en ' || dias_restantes || ' días (Sucursal)';
          ELSIF dias_restantes < 0 THEN
            nivel_urgencia := 'critica';
            mensaje := 'Lote ' || NEW.numero_lote || ' está vencido (Sucursal)';
          END IF;
          
          IF nivel_urgencia IS NOT NULL THEN
            INSERT INTO alertas_inventario (
              id_producto, 
              id_sucursal,
              id_lote, 
              tipo_alerta, 
              mensaje, 
              nivel_urgencia, 
              id_restaurante
            ) VALUES (
              NEW.id_producto, 
              NEW.id_sucursal,
              NEW.id_lote, 
              'caducidad_sucursal', 
              mensaje, 
              nivel_urgencia, 
              NEW.id_restaurante
            );
          END IF;
        END IF;
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `;
    
    await client.query(updateAlertsFunction);
    console.log('   ✅ Función generar_alertas_inventario actualizada');
    
    // 4. Crear función para actualizar stock en ventas
    console.log('\n4️⃣ CREANDO FUNCIÓN PARA ACTUALIZAR STOCK EN VENTAS...');
    const createVentaStockFunction = `
      CREATE OR REPLACE FUNCTION actualizar_stock_venta(
        p_id_producto INTEGER,
        p_id_sucursal INTEGER,
        p_cantidad INTEGER,
        p_id_vendedor INTEGER DEFAULT NULL
      )
      RETURNS JSON AS $$
      DECLARE
        stock_actual_sucursal INTEGER;
        stock_nuevo INTEGER;
        resultado JSON;
        movimiento_id INTEGER;
      BEGIN
        -- Obtener stock actual en la sucursal
        SELECT stock_actual INTO stock_actual_sucursal
        FROM stock_sucursal
        WHERE id_producto = p_id_producto 
          AND id_sucursal = p_id_sucursal 
          AND activo = true;
        
        -- Verificar si hay stock suficiente
        IF stock_actual_sucursal IS NULL OR stock_actual_sucursal < p_cantidad THEN
          RETURN json_build_object(
            'success', false,
            'error', 'Stock insuficiente en la sucursal',
            'stock_disponible', COALESCE(stock_actual_sucursal, 0),
            'cantidad_solicitada', p_cantidad
          );
        END IF;
        
        -- Calcular nuevo stock
        stock_nuevo := stock_actual_sucursal - p_cantidad;
        
        -- Actualizar stock en la sucursal
        UPDATE stock_sucursal
        SET stock_actual = stock_nuevo,
            updated_at = NOW()
        WHERE id_producto = p_id_producto 
          AND id_sucursal = p_id_sucursal;
        
        -- Registrar movimiento
        INSERT INTO movimientos_inventario (
          id_producto,
          id_sucursal,
          tipo_movimiento,
          cantidad,
          stock_anterior,
          stock_actual,
          id_vendedor,
          id_restaurante,
          motivo
        )
        SELECT 
          p_id_producto,
          p_id_sucursal,
          'venta',
          p_cantidad,
          stock_actual_sucursal,
          stock_nuevo,
          p_id_vendedor,
          s.id_restaurante,
          'Venta realizada en sucursal'
        FROM sucursales s
        WHERE s.id_sucursal = p_id_sucursal
        RETURNING id_movimiento INTO movimiento_id;
        
        -- Actualizar stock global del producto
        UPDATE productos 
        SET stock_actual = (
          SELECT COALESCE(SUM(ss.stock_actual), 0)
          FROM stock_sucursal ss
          JOIN sucursales s ON ss.id_sucursal = s.id_sucursal
          WHERE ss.id_producto = p_id_producto
            AND s.id_restaurante = (SELECT id_restaurante FROM sucursales WHERE id_sucursal = p_id_sucursal)
            AND ss.activo = true
        )
        WHERE id_producto = p_id_producto;
        
        -- Retornar resultado
        resultado := json_build_object(
          'success', true,
          'id_movimiento', movimiento_id,
          'stock_anterior', stock_actual_sucursal,
          'stock_nuevo', stock_nuevo,
          'cantidad_vendida', p_cantidad
        );
        
        RETURN resultado;
      END;
      $$ LANGUAGE plpgsql;
    `;
    
    await client.query(createVentaStockFunction);
    console.log('   ✅ Función actualizar_stock_venta creada');
    
    // 5. Crear función para obtener stock por sucursal
    console.log('\n5️⃣ CREANDO FUNCIÓN PARA OBTENER STOCK POR SUCURSAL...');
    const createGetStockFunction = `
      CREATE OR REPLACE FUNCTION obtener_stock_por_sucursal(
        p_id_restaurante INTEGER DEFAULT NULL,
        p_id_sucursal INTEGER DEFAULT NULL
      )
      RETURNS TABLE (
        id_producto INTEGER,
        nombre_producto VARCHAR,
        id_sucursal INTEGER,
        nombre_sucursal VARCHAR,
        stock_actual INTEGER,
        stock_minimo INTEGER,
        stock_maximo INTEGER,
        estado_stock VARCHAR
      ) AS $$
      BEGIN
        RETURN QUERY
        SELECT 
          p.id_producto,
          p.nombre::VARCHAR as nombre_producto,
          ss.id_sucursal,
          s.nombre::VARCHAR as nombre_sucursal,
          ss.stock_actual,
          ss.stock_minimo,
          ss.stock_maximo,
          CASE 
            WHEN ss.stock_actual = 0 THEN 'agotado'
            WHEN ss.stock_actual <= ss.stock_minimo THEN 'bajo'
            WHEN ss.stock_actual >= ss.stock_maximo THEN 'alto'
            ELSE 'normal'
          END::VARCHAR as estado_stock
        FROM stock_sucursal ss
        JOIN productos p ON ss.id_producto = p.id_producto
        JOIN sucursales s ON ss.id_sucursal = s.id_sucursal
        WHERE ss.activo = true
          AND p.activo = true
          AND s.activo = true
          AND (p_id_restaurante IS NULL OR s.id_restaurante = p_id_restaurante)
          AND (p_id_sucursal IS NULL OR ss.id_sucursal = p_id_sucursal)
        ORDER BY s.nombre, p.nombre;
      END;
      $$ LANGUAGE plpgsql;
    `;
    
    await client.query(createGetStockFunction);
    console.log('   ✅ Función obtener_stock_por_sucursal creada');
    
    // 6. Commit de la transacción
    await client.query('COMMIT');
    console.log('\n✅ BACKEND ACTUALIZADO EXITOSAMENTE!');
    
    // 7. Verificar funciones creadas
    console.log('\n📋 FUNCIONES ACTUALIZADAS:');
    const functionsQuery = await client.query(`
      SELECT 
        routine_name,
        routine_type
      FROM information_schema.routines 
      WHERE routine_name IN (
        'actualizar_stock_producto',
        'registrar_movimiento_inventario', 
        'generar_alertas_inventario',
        'actualizar_stock_venta',
        'obtener_stock_por_sucursal'
      )
      ORDER BY routine_name
    `);
    
    functionsQuery.rows.forEach(row => {
      console.log(`  ✅ ${row.routine_name} (${row.routine_type})`);
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ ERROR ACTUALIZANDO BACKEND:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Ejecutar actualización
if (require.main === module) {
  updateBackendForBranchStock()
    .then(() => {
      console.log('\n🎉 Backend actualizado exitosamente!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Error actualizando backend:', error);
      process.exit(1);
    });
}

module.exports = { updateBackendForBranchStock };
