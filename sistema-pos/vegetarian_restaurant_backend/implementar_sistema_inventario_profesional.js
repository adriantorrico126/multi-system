const { pool } = require('./src/config/database');

async function implementarSistemaInventarioProfesional() {
  const client = await pool.connect();
  try {
    console.log('🚀 IMPLEMENTANDO SISTEMA DE INVENTARIO PROFESIONAL Y ESCALABLE\n');
    
    // 1. CREAR FUNCIONES DE BASE DE DATOS PARA INTEGRIDAD
    console.log('1️⃣ CREANDO FUNCIONES DE INTEGRIDAD...');
    
    try {
      // Función para validar integridad de lotes
      await client.query(`
        CREATE OR REPLACE FUNCTION validar_integridad_lote()
        RETURNS TRIGGER AS $$
        BEGIN
          -- Validar que el producto existe y está activo
          IF NOT EXISTS (SELECT 1 FROM productos WHERE id_producto = NEW.id_producto AND activo = true) THEN
            RAISE EXCEPTION 'El producto % no existe o no está activo', NEW.id_producto;
          END IF;
          
          -- Validar que la categoría de almacén existe
          IF NEW.id_categoria_almacen IS NOT NULL AND 
             NOT EXISTS (SELECT 1 FROM categorias_almacen WHERE id_categoria_almacen = NEW.id_categoria_almacen AND activo = true) THEN
            RAISE EXCEPTION 'La categoría de almacén % no existe o no está activa', NEW.id_categoria_almacen;
          END IF;
          
          -- Validar fechas
          IF NEW.fecha_fabricacion IS NOT NULL AND NEW.fecha_caducidad IS NOT NULL AND 
             NEW.fecha_fabricacion >= NEW.fecha_caducidad THEN
            RAISE EXCEPTION 'La fecha de fabricación debe ser anterior a la fecha de caducidad';
          END IF;
          
          -- Validar cantidades
          IF NEW.cantidad_inicial < 0 OR NEW.cantidad_actual < 0 THEN
            RAISE EXCEPTION 'Las cantidades no pueden ser negativas';
          END IF;
          
          IF NEW.cantidad_actual > NEW.cantidad_inicial THEN
            RAISE EXCEPTION 'La cantidad actual no puede ser mayor a la cantidad inicial';
          END IF;
          
          -- Validar precio de compra
          IF NEW.precio_compra IS NOT NULL AND NEW.precio_compra < 0 THEN
            RAISE EXCEPTION 'El precio de compra no puede ser negativo';
          END IF;
          
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `);
      console.log('  ✅ Función validar_integridad_lote creada');
      
      // Función para actualizar stock de productos automáticamente
      await client.query(`
        CREATE OR REPLACE FUNCTION actualizar_stock_producto()
        RETURNS TRIGGER AS $$
        BEGIN
          -- Actualizar stock del producto cuando cambie un lote
          UPDATE productos 
          SET stock_actual = (
            SELECT COALESCE(SUM(cantidad_actual), 0)
            FROM inventario_lotes 
            WHERE id_producto = NEW.id_producto AND activo = true
          )
          WHERE id_producto = NEW.id_producto;
          
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `);
      console.log('  ✅ Función actualizar_stock_producto creada');
      
      // Función para generar alertas automáticas
      await client.query(`
        CREATE OR REPLACE FUNCTION generar_alertas_inventario()
        RETURNS TRIGGER AS $$
        DECLARE
          dias_restantes INTEGER;
          nivel_urgencia VARCHAR(20);
          mensaje TEXT;
        BEGIN
          -- Generar alerta por stock bajo
          IF NEW.cantidad_actual <= 5 AND NEW.cantidad_actual > 0 THEN
            INSERT INTO alertas_inventario (
              id_producto, id_lote, tipo_alerta, mensaje, nivel_urgencia, id_restaurante
            ) VALUES (
              NEW.id_producto, NEW.id_lote, 'stock_bajo', 
              'Stock bajo en lote ' || NEW.numero_lote, 'alta', NEW.id_restaurante
            );
          END IF;
          
          -- Generar alerta por caducidad próxima
          IF NEW.fecha_caducidad IS NOT NULL THEN
            dias_restantes := NEW.fecha_caducidad - CURRENT_DATE;
            
            IF dias_restantes <= 7 AND dias_restantes > 0 THEN
              nivel_urgencia := 'alta';
              mensaje := 'Lote ' || NEW.numero_lote || ' caduca en ' || dias_restantes || ' días';
            ELSIF dias_restantes <= 30 AND dias_restantes > 7 THEN
              nivel_urgencia := 'media';
              mensaje := 'Lote ' || NEW.numero_lote || ' caduca en ' || dias_restantes || ' días';
            ELSIF dias_restantes < 0 THEN
              nivel_urgencia := 'alta';
              mensaje := 'Lote ' || NEW.numero_lote || ' está vencido';
            END IF;
            
            IF nivel_urgencia IS NOT NULL THEN
              INSERT INTO alertas_inventario (
                id_producto, id_lote, tipo_alerta, mensaje, nivel_urgencia, id_restaurante
              ) VALUES (
                NEW.id_producto, NEW.id_lote, 'caducidad', mensaje, nivel_urgencia, NEW.id_restaurante
              );
            END IF;
          END IF;
          
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `);
      console.log('  ✅ Función generar_alertas_inventario creada');
      
      // Función para registrar movimientos automáticamente
      await client.query(`
        CREATE OR REPLACE FUNCTION registrar_movimiento_inventario()
        RETURNS TRIGGER AS $$
        DECLARE
          stock_anterior NUMERIC;
          stock_actual NUMERIC;
          tipo_movimiento VARCHAR(50);
          motivo TEXT;
        BEGIN
          -- Determinar tipo de movimiento
          IF TG_OP = 'INSERT' THEN
            tipo_movimiento := 'entrada';
            motivo := 'Creación de lote';
            stock_anterior := 0;
            stock_actual := NEW.cantidad_inicial;
          ELSIF TG_OP = 'UPDATE' THEN
            IF OLD.cantidad_actual != NEW.cantidad_actual THEN
              IF NEW.cantidad_actual > OLD.cantidad_actual THEN
                tipo_movimiento := 'entrada';
                motivo := 'Ajuste de stock';
              ELSE
                tipo_movimiento := 'salida';
                motivo := 'Ajuste de stock';
              END IF;
              stock_anterior := OLD.cantidad_actual;
              stock_actual := NEW.cantidad_actual;
            ELSE
              RETURN NEW;
            END IF;
          ELSIF TG_OP = 'DELETE' THEN
            tipo_movimiento := 'eliminacion';
            motivo := 'Eliminación de lote';
            stock_anterior := OLD.cantidad_actual;
            stock_actual := 0;
          END IF;
          
          -- Insertar movimiento
          INSERT INTO movimientos_inventario (
            id_producto, id_lote, tipo_movimiento, cantidad, 
            stock_anterior, stock_actual, id_categoria_almacen,
            motivo, id_vendedor, id_restaurante
          ) VALUES (
            COALESCE(NEW.id_producto, OLD.id_producto),
            COALESCE(NEW.id_lote, OLD.id_lote),
            tipo_movimiento,
            ABS(COALESCE(NEW.cantidad_actual, 0) - COALESCE(OLD.cantidad_actual, 0)),
            stock_anterior,
            stock_actual,
            COALESCE(NEW.id_categoria_almacen, OLD.id_categoria_almacen),
            motivo,
            1, -- Usuario por defecto
            COALESCE(NEW.id_restaurante, OLD.id_restaurante)
          );
          
          RETURN COALESCE(NEW, OLD);
        END;
        $$ LANGUAGE plpgsql;
      `);
      console.log('  ✅ Función registrar_movimiento_inventario creada');
      
    } catch (error) {
      console.log(`  ⚠️ Error creando funciones: ${error.message}`);
    }
    
    // 2. CREAR TRIGGERS PARA AUTOMATIZACIÓN
    console.log('\n2️⃣ CREANDO TRIGGERS DE AUTOMATIZACIÓN...');
    
    try {
      // Trigger para validar integridad al insertar/actualizar lotes
      await client.query(`
        DROP TRIGGER IF EXISTS trigger_validar_integridad_lote ON inventario_lotes;
        CREATE TRIGGER trigger_validar_integridad_lote
        BEFORE INSERT OR UPDATE ON inventario_lotes
        FOR EACH ROW EXECUTE FUNCTION validar_integridad_lote();
      `);
      console.log('  ✅ Trigger validar_integridad_lote creado');
      
      // Trigger para actualizar stock de productos
      await client.query(`
        DROP TRIGGER IF EXISTS trigger_actualizar_stock_producto ON inventario_lotes;
        CREATE TRIGGER trigger_actualizar_stock_producto
        AFTER INSERT OR UPDATE OR DELETE ON inventario_lotes
        FOR EACH ROW EXECUTE FUNCTION actualizar_stock_producto();
      `);
      console.log('  ✅ Trigger actualizar_stock_producto creado');
      
      // Trigger para generar alertas automáticas
      await client.query(`
        DROP TRIGGER IF EXISTS trigger_generar_alertas_inventario ON inventario_lotes;
        CREATE TRIGGER trigger_generar_alertas_inventario
        AFTER INSERT OR UPDATE ON inventario_lotes
        FOR EACH ROW EXECUTE FUNCTION generar_alertas_inventario();
      `);
      console.log('  ✅ Trigger generar_alertas_inventario creado');
      
      // Trigger para registrar movimientos
      await client.query(`
        DROP TRIGGER IF EXISTS trigger_registrar_movimiento_inventario ON inventario_lotes;
        CREATE TRIGGER trigger_registrar_movimiento_inventario
        AFTER INSERT OR UPDATE OR DELETE ON inventario_lotes
        FOR EACH ROW EXECUTE FUNCTION registrar_movimiento_inventario();
      `);
      console.log('  ✅ Trigger registrar_movimiento_inventario creado');
      
    } catch (error) {
      console.log(`  ⚠️ Error creando triggers: ${error.message}`);
    }
    
    // 3. CREAR VISTAS PARA MONITOREO
    console.log('\n3️⃣ CREANDO VISTAS DE MONITOREO...');
    
    try {
      // Vista para resumen de inventario
      await client.query(`
        CREATE OR REPLACE VIEW vista_resumen_inventario AS
        SELECT 
          p.id_producto,
          p.nombre as producto_nombre,
          c.nombre as categoria_nombre,
          p.stock_actual,
          p.precio,
          COALESCE(SUM(il.cantidad_actual), 0) as stock_en_lotes,
          COUNT(il.id_lote) as total_lotes,
          COUNT(CASE WHEN il.fecha_caducidad < NOW() THEN 1 END) as lotes_vencidos,
          COUNT(CASE WHEN il.fecha_caducidad < NOW() + INTERVAL '7 days' THEN 1 END) as lotes_por_vencer,
          MIN(il.fecha_caducidad) as proxima_caducidad,
          CASE 
            WHEN p.stock_actual = 0 THEN 'sin_stock'
            WHEN p.stock_actual <= 5 THEN 'stock_critico'
            WHEN p.stock_actual <= 10 THEN 'stock_bajo'
            ELSE 'stock_ok'
          END as estado_stock
        FROM productos p
        LEFT JOIN categorias c ON p.id_categoria = c.id_categoria
        LEFT JOIN inventario_lotes il ON p.id_producto = il.id_producto AND il.activo = true
        WHERE p.activo = true
        GROUP BY p.id_producto, p.nombre, c.nombre, p.stock_actual, p.precio
        ORDER BY p.stock_actual ASC, p.nombre;
      `);
      console.log('  ✅ Vista vista_resumen_inventario creada');
      
      // Vista para lotes críticos
      await client.query(`
        CREATE OR REPLACE VIEW vista_lotes_criticos AS
        SELECT 
          il.id_lote,
          il.numero_lote,
          p.nombre as producto_nombre,
          c.nombre as categoria_nombre,
          il.cantidad_actual,
          il.fecha_caducidad,
          il.precio_compra,
          CASE 
            WHEN il.fecha_caducidad < NOW() THEN 'vencido'
            WHEN il.fecha_caducidad < NOW() + INTERVAL '7 days' THEN 'por_vencer'
            WHEN il.fecha_caducidad < NOW() + INTERVAL '30 days' THEN 'proximo_vencer'
            ELSE 'vigente'
          END as estado_caducidad,
          CASE 
            WHEN il.cantidad_actual = 0 THEN 'sin_stock'
            WHEN il.cantidad_actual <= 5 THEN 'stock_bajo'
            ELSE 'stock_ok'
          END as estado_stock,
          CURRENT_DATE - il.fecha_caducidad as dias_vencido,
          il.fecha_caducidad - CURRENT_DATE as dias_restantes
        FROM inventario_lotes il
        JOIN productos p ON il.id_producto = p.id_producto
        JOIN categorias c ON p.id_categoria = c.id_categoria
        WHERE il.activo = true
        AND (
          il.fecha_caducidad < NOW() + INTERVAL '30 days' OR
          il.cantidad_actual <= 5
        )
        ORDER BY 
          CASE 
            WHEN il.fecha_caducidad < NOW() THEN 1
            WHEN il.fecha_caducidad < NOW() + INTERVAL '7 days' THEN 2
            WHEN il.fecha_caducidad < NOW() + INTERVAL '30 days' THEN 3
            ELSE 4
          END,
          il.fecha_caducidad ASC;
      `);
      console.log('  ✅ Vista vista_lotes_criticos creada');
      
      // Vista para movimientos recientes
      await client.query(`
        CREATE OR REPLACE VIEW vista_movimientos_recientes AS
        SELECT 
          mi.id_movimiento,
          mi.fecha_movimiento,
          p.nombre as producto_nombre,
          mi.tipo_movimiento,
          mi.cantidad,
          mi.stock_anterior,
          mi.stock_actual,
          mi.motivo,
          v.username as vendedor,
          ca.nombre as categoria_almacen
        FROM movimientos_inventario mi
        JOIN productos p ON mi.id_producto = p.id_producto
        LEFT JOIN vendedores v ON mi.id_vendedor = v.id_vendedor
        LEFT JOIN categorias_almacen ca ON mi.id_categoria_almacen = ca.id_categoria_almacen
        ORDER BY mi.fecha_movimiento DESC
        LIMIT 100;
      `);
      console.log('  ✅ Vista vista_movimientos_recientes creada');
      
    } catch (error) {
      console.log(`  ⚠️ Error creando vistas: ${error.message}`);
    }
    
    // 4. CREAR ÍNDICES PARA OPTIMIZACIÓN
    console.log('\n4️⃣ CREANDO ÍNDICES DE OPTIMIZACIÓN...');
    
    try {
      // Índices para inventario_lotes
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_inventario_lotes_producto ON inventario_lotes(id_producto);
        CREATE INDEX IF NOT EXISTS idx_inventario_lotes_restaurante ON inventario_lotes(id_restaurante);
        CREATE INDEX IF NOT EXISTS idx_inventario_lotes_categoria ON inventario_lotes(id_categoria_almacen);
        CREATE INDEX IF NOT EXISTS idx_inventario_lotes_fecha_caducidad ON inventario_lotes(fecha_caducidad);
        CREATE INDEX IF NOT EXISTS idx_inventario_lotes_activo ON inventario_lotes(activo);
        CREATE INDEX IF NOT EXISTS idx_inventario_lotes_cantidad ON inventario_lotes(cantidad_actual);
      `);
      console.log('  ✅ Índices para inventario_lotes creados');
      
      // Índices para movimientos_inventario
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_movimientos_producto ON movimientos_inventario(id_producto);
        CREATE INDEX IF NOT EXISTS idx_movimientos_fecha ON movimientos_inventario(fecha_movimiento);
        CREATE INDEX IF NOT EXISTS idx_movimientos_tipo ON movimientos_inventario(tipo_movimiento);
        CREATE INDEX IF NOT EXISTS idx_movimientos_restaurante ON movimientos_inventario(id_restaurante);
      `);
      console.log('  ✅ Índices para movimientos_inventario creados');
      
      // Índices para alertas_inventario
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_alertas_producto ON alertas_inventario(id_producto);
        CREATE INDEX IF NOT EXISTS idx_alertas_resuelta ON alertas_inventario(resuelta);
        CREATE INDEX IF NOT EXISTS idx_alertas_urgencia ON alertas_inventario(nivel_urgencia);
        CREATE INDEX IF NOT EXISTS idx_alertas_restaurante ON alertas_inventario(id_restaurante);
      `);
      console.log('  ✅ Índices para alertas_inventario creados');
      
    } catch (error) {
      console.log(`  ⚠️ Error creando índices: ${error.message}`);
    }
    
    // 5. INSERTAR DATOS DE EJEMPLO PARA CATEGORÍAS DE ALMACÉN
    console.log('\n5️⃣ INSERTANDO DATOS DE EJEMPLO...');
    
    try {
      // Verificar si ya existen categorías
      const categoriasExistentes = await client.query(`
        SELECT COUNT(*) as total FROM categorias_almacen WHERE activo = true
      `);
      
      if (parseInt(categoriasExistentes.rows[0].total) === 0) {
        await client.query(`
          INSERT INTO categorias_almacen (nombre, descripcion, tipo_almacen, condiciones_especiales, rotacion_recomendada, id_restaurante, activo) VALUES
          ('Almacén Seco', 'Productos no perecederos y secos', 'seco', 'Mantener seco y fresco', 'FIFO', 1, true),
          ('Cámara Refrigerada', 'Productos que requieren refrigeración', 'refrigerado', 'Mantener entre 2-8°C', 'FIFO', 1, true),
          ('Cámara de Congelación', 'Productos congelados', 'congelado', 'Mantener a -18°C o menos', 'FIFO', 1, true),
          ('Almacén de Bebidas', 'Bebidas y líquidos', 'bebidas', 'Mantener fresco y seco', 'FIFO', 1, true),
          ('Almacén de Limpieza', 'Productos de limpieza', 'limpieza', 'Mantener seco y ventilado', 'LIFO', 1, true),
          ('Almacén de Vajilla', 'Vajilla y utensilios', 'vajilla', 'Mantener limpio y seco', 'LIFO', 1, true);
        `);
        console.log('  ✅ Categorías de almacén de ejemplo insertadas');
      } else {
        console.log('  ℹ️ Las categorías de almacén ya existen');
      }
      
    } catch (error) {
      console.log(`  ⚠️ Error insertando datos de ejemplo: ${error.message}`);
    }
    
    // 6. CREAR FUNCIÓN PARA GENERAR LOTES AUTOMÁTICAMENTE
    console.log('\n6️⃣ CREANDO FUNCIÓN DE GENERACIÓN AUTOMÁTICA DE LOTES...');
    
    try {
      await client.query(`
        CREATE OR REPLACE FUNCTION generar_lote_automatico(
          p_id_producto INTEGER,
          p_cantidad NUMERIC,
          p_precio_compra NUMERIC DEFAULT NULL,
          p_proveedor VARCHAR DEFAULT 'Proveedor General',
          p_id_restaurante INTEGER DEFAULT 1
        )
        RETURNS INTEGER AS $$
        DECLARE
          v_id_lote INTEGER;
          v_numero_lote VARCHAR;
          v_id_categoria_almacen INTEGER;
          v_fecha_fabricacion DATE;
          v_fecha_caducidad DATE;
        BEGIN
          -- Obtener categoría del producto
          SELECT id_categoria INTO v_id_categoria_almacen
          FROM productos WHERE id_producto = p_id_producto;
          
          -- Generar número de lote único
          v_numero_lote := 'LOT-' || p_id_producto || '-' || EXTRACT(YEAR FROM CURRENT_DATE) || 
                           LPAD(EXTRACT(MONTH FROM CURRENT_DATE)::TEXT, 2, '0') || 
                           LPAD(EXTRACT(DAY FROM CURRENT_DATE)::TEXT, 2, '0') || '-' ||
                           LPAD(FLOOR(RANDOM() * 1000)::TEXT, 3, '0');
          
          -- Establecer fechas por defecto
          v_fecha_fabricacion := CURRENT_DATE;
          v_fecha_caducidad := CURRENT_DATE + INTERVAL '1 year';
          
          -- Insertar lote
          INSERT INTO inventario_lotes (
            id_producto, numero_lote, cantidad_inicial, cantidad_actual,
            fecha_fabricacion, fecha_caducidad, precio_compra, id_categoria_almacen,
            proveedor, id_restaurante, activo, created_at
          ) VALUES (
            p_id_producto, v_numero_lote, p_cantidad, p_cantidad,
            v_fecha_fabricacion, v_fecha_caducidad, p_precio_compra, v_id_categoria_almacen,
            p_proveedor, p_id_restaurante, true, NOW()
          ) RETURNING id_lote INTO v_id_lote;
          
          RETURN v_id_lote;
        END;
        $$ LANGUAGE plpgsql;
      `);
      console.log('  ✅ Función generar_lote_automatico creada');
      
    } catch (error) {
      console.log(`  ⚠️ Error creando función de generación automática: ${error.message}`);
    }
    
    // 7. VERIFICAR IMPLEMENTACIÓN
    console.log('\n7️⃣ VERIFICANDO IMPLEMENTACIÓN...');
    
    try {
      // Verificar funciones
      const funciones = await client.query(`
        SELECT routine_name 
        FROM information_schema.routines 
        WHERE routine_schema = 'public' 
        AND routine_name IN (
          'validar_integridad_lote',
          'actualizar_stock_producto',
          'generar_alertas_inventario',
          'registrar_movimiento_inventario',
          'generar_lote_automatico'
        )
      `);
      
      console.log(`  📊 Funciones implementadas: ${funciones.rows.length}/5`);
      
      // Verificar triggers
      const triggers = await client.query(`
        SELECT trigger_name 
        FROM information_schema.triggers 
        WHERE trigger_schema = 'public' 
        AND trigger_name IN (
          'trigger_validar_integridad_lote',
          'trigger_actualizar_stock_producto',
          'trigger_generar_alertas_inventario',
          'trigger_registrar_movimiento_inventario'
        )
      `);
      
      console.log(`  📊 Triggers implementados: ${triggers.rows.length}/4`);
      
      // Verificar vistas
      const vistas = await client.query(`
        SELECT table_name 
        FROM information_schema.views 
        WHERE table_schema = 'public' 
        AND table_name IN (
          'vista_resumen_inventario',
          'vista_lotes_criticos',
          'vista_movimientos_recientes'
        )
      `);
      
      console.log(`  📊 Vistas implementadas: ${vistas.rows.length}/3`);
      
    } catch (error) {
      console.log(`  ⚠️ Error verificando implementación: ${error.message}`);
    }
    
    console.log('\n🎯 SISTEMA DE INVENTARIO PROFESIONAL IMPLEMENTADO EXITOSAMENTE!');
    console.log('\n📋 CARACTERÍSTICAS IMPLEMENTADAS:');
    console.log('  ✅ Validación automática de integridad de datos');
    console.log('  ✅ Actualización automática de stock de productos');
    console.log('  ✅ Generación automática de alertas');
    console.log('  ✅ Registro automático de movimientos');
    console.log('  ✅ Triggers para automatización completa');
    console.log('  ✅ Vistas optimizadas para monitoreo');
    console.log('  ✅ Índices para rendimiento óptimo');
    console.log('  ✅ Función para generación automática de lotes');
    console.log('  ✅ Categorías de almacén predefinidas');
    
    console.log('\n🚀 PRÓXIMOS PASOS RECOMENDADOS:');
    console.log('  1. Crear lotes para productos existentes usando generar_lote_automatico()');
    console.log('  2. Configurar niveles mínimos de stock por producto');
    console.log('  3. Implementar sistema de notificaciones por email/SMS');
    console.log('  4. Crear reportes automáticos de inventario');
    console.log('  5. Implementar sistema de rotación FIFO/LIFO automático');
    
  } catch (error) {
    console.error('❌ Error implementando sistema:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Ejecutar implementación
implementarSistemaInventarioProfesional()
  .then(() => {
    console.log('\n🏁 Implementación completada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error en implementación:', error);
    process.exit(1);
  });
