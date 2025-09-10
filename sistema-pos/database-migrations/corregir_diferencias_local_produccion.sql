-- Corrección de diferencias entre local y producción
-- Fecha: 2025-01-09
-- Autor: Sistema POS

-- =====================================================
-- 1. CORREGIR TABLA VENTAS
-- =====================================================

-- Agregar columna observaciones_pago si no existe
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS observaciones_pago TEXT;
COMMENT ON COLUMN ventas.observaciones_pago IS 'Observaciones adicionales sobre el pago (opcional)';

-- =====================================================
-- 2. CORREGIR TABLA HISTORIAL_PAGOS_DIFERIDOS
-- =====================================================

-- Agregar columnas faltantes
ALTER TABLE historial_pagos_diferidos ADD COLUMN IF NOT EXISTS id_pago_final INTEGER;
ALTER TABLE historial_pagos_diferidos ADD COLUMN IF NOT EXISTS id_vendedor INTEGER;
ALTER TABLE historial_pagos_diferidos ADD COLUMN IF NOT EXISTS id_mesa INTEGER;
ALTER TABLE historial_pagos_diferidos ADD COLUMN IF NOT EXISTS id_restaurante INTEGER;
ALTER TABLE historial_pagos_diferidos ADD COLUMN IF NOT EXISTS id_metodo_pago INTEGER;

-- Agregar comentarios
COMMENT ON COLUMN historial_pagos_diferidos.id_pago_final IS 'ID del método de pago usado para el pago final';
COMMENT ON COLUMN historial_pagos_diferidos.id_vendedor IS 'ID del vendedor que procesó el pago';
COMMENT ON COLUMN historial_pagos_diferidos.id_mesa IS 'ID de la mesa donde se realizó el pago';
COMMENT ON COLUMN historial_pagos_diferidos.id_restaurante IS 'ID del restaurante';
COMMENT ON COLUMN historial_pagos_diferidos.id_metodo_pago IS 'ID del método de pago utilizado';

-- =====================================================
-- 3. CORREGIR TABLA PAGOS_DIFERIDOS
-- =====================================================

-- Agregar columna id_restaurante si no existe
ALTER TABLE pagos_diferidos ADD COLUMN IF NOT EXISTS id_restaurante INTEGER;

-- =====================================================
-- 4. CREAR FUNCIONES FALTANTES
-- =====================================================

-- Función para validar integridad de lotes
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

-- Función para actualizar stock de productos automáticamente
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

-- Función para generar alertas automáticas
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

-- Función para marcar venta diferida como pagada
CREATE OR REPLACE FUNCTION marcar_venta_diferida_como_pagada(
    p_id_venta INTEGER,
    p_id_pago_final INTEGER,
    p_observaciones TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    v_id_pago_diferido INTEGER;
    v_id_mesa INTEGER;
    v_id_restaurante INTEGER;
    v_total NUMERIC;
BEGIN
    -- Obtener información de la venta
    SELECT id_mesa, id_restaurante, total 
    INTO v_id_mesa, v_id_restaurante, v_total
    FROM ventas 
    WHERE id_venta = p_id_venta;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Venta no encontrada: %', p_id_venta;
    END IF;
    
    -- Actualizar la venta
    UPDATE ventas 
    SET estado_pago = 'pagado',
        id_pago_final = p_id_pago_final,
        fecha_pago_final = CURRENT_TIMESTAMP
    WHERE id_venta = p_id_venta;
    
    -- Buscar el pago diferido asociado
    SELECT id_pago_diferido 
    INTO v_id_pago_diferido
    FROM pagos_diferidos 
    WHERE id_venta = p_id_venta AND estado = 'pendiente'
    LIMIT 1;
    
    -- Si existe el pago diferido, actualizarlo
    IF v_id_pago_diferido IS NOT NULL THEN
        UPDATE pagos_diferidos 
        SET estado = 'pagado',
            updated_at = CURRENT_TIMESTAMP
        WHERE id_pago_diferido = v_id_pago_diferido;
        
        -- Insertar en historial
        INSERT INTO historial_pagos_diferidos (
            id_pago_diferido,
            id_venta,
            id_mesa,
            id_restaurante,
            id_metodo_pago,
            id_pago_final,
            monto_pagado,
            fecha_pago,
            observaciones,
            procesado_por
        ) VALUES (
            v_id_pago_diferido,
            p_id_venta,
            v_id_mesa,
            v_id_restaurante,
            p_id_pago_final,
            p_id_pago_final,
            v_total,
            CURRENT_TIMESTAMP,
            p_observaciones,
            NULL -- Se puede pasar como parámetro si es necesario
        );
    END IF;
    
    RETURN TRUE;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error al marcar venta como pagada: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. CREAR TRIGGERS FALTANTES
-- =====================================================

-- Trigger para validar integridad de lotes
DROP TRIGGER IF EXISTS trigger_validar_integridad_lote ON inventario_lotes;
CREATE TRIGGER trigger_validar_integridad_lote
    BEFORE INSERT OR UPDATE ON inventario_lotes
    FOR EACH ROW
    EXECUTE FUNCTION validar_integridad_lote();

-- Trigger para actualizar stock de productos
DROP TRIGGER IF EXISTS trigger_actualizar_stock_producto ON inventario_lotes;
CREATE TRIGGER trigger_actualizar_stock_producto
    AFTER INSERT OR UPDATE OR DELETE ON inventario_lotes
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_stock_producto();

-- Trigger para generar alertas de inventario
DROP TRIGGER IF EXISTS trigger_generar_alertas_inventario ON inventario_lotes;
CREATE TRIGGER trigger_generar_alertas_inventario
    AFTER INSERT OR UPDATE ON inventario_lotes
    FOR EACH ROW
    EXECUTE FUNCTION generar_alertas_inventario();

-- =====================================================
-- 6. CREAR VISTAS FALTANTES
-- =====================================================

-- Vista para pagos diferidos pendientes
DROP VIEW IF EXISTS vista_pagos_diferidos_pendientes;
CREATE VIEW vista_pagos_diferidos_pendientes AS
SELECT 
    pd.id_pago_diferido,
    pd.id_venta,
    v.mesa_numero,
    v.total,
    v.tipo_servicio,
    pd.fecha_creacion,
    pd.fecha_vencimiento,
    pd.estado,
    pd.observaciones,
    pd.id_restaurante,
    CASE 
        WHEN pd.estado = 'pagado' THEN 'pagado'
        WHEN pd.fecha_vencimiento < CURRENT_TIMESTAMP THEN 'vencido'
        ELSE 'pendiente'
    END as estado_real,
    EXTRACT(DAY FROM (CURRENT_TIMESTAMP - pd.fecha_creacion)) as dias_pendiente
FROM pagos_diferidos pd
JOIN ventas v ON pd.id_venta = v.id_venta
WHERE pd.estado = 'pendiente'
ORDER BY pd.fecha_creacion DESC;

-- Vista para resumen de inventario
DROP VIEW IF EXISTS vista_resumen_inventario;
CREATE VIEW vista_resumen_inventario AS
SELECT 
    p.id_producto,
    p.nombre as producto_nombre,
    c.nombre as categoria_nombre,
    p.stock_actual,
    p.precio,
    COALESCE(SUM(il.cantidad_actual), 0) as stock_en_lotes,
    COUNT(il.id_lote) as total_lotes,
    COUNT(CASE WHEN il.fecha_caducidad < CURRENT_DATE THEN 1 END) as lotes_vencidos,
    COUNT(CASE WHEN il.fecha_caducidad BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days' THEN 1 END) as lotes_por_vencer,
    MIN(il.fecha_caducidad) as proxima_caducidad,
    CASE 
        WHEN p.stock_actual <= 0 THEN 'Sin stock'
        WHEN p.stock_actual <= 5 THEN 'Stock bajo'
        ELSE 'Stock normal'
    END as estado_stock
FROM productos p
LEFT JOIN categorias c ON p.id_categoria = c.id_categoria
LEFT JOIN inventario_lotes il ON p.id_producto = il.id_producto AND il.activo = true
WHERE p.activo = true
GROUP BY p.id_producto, p.nombre, c.nombre, p.stock_actual, p.precio
ORDER BY p.nombre;

-- =====================================================
-- 7. VERIFICACIONES FINALES
-- =====================================================

DO $$
BEGIN
    -- Verificar que todas las columnas se agregaron correctamente
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ventas' AND column_name = 'observaciones_pago'
    ) THEN
        RAISE EXCEPTION 'Error: No se pudo agregar observaciones_pago a ventas';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'historial_pagos_diferidos' AND column_name = 'id_pago_final'
    ) THEN
        RAISE EXCEPTION 'Error: No se pudo agregar id_pago_final a historial_pagos_diferidos';
    END IF;
    
    -- Verificar que las funciones se crearon
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_name = 'validar_integridad_lote'
    ) THEN
        RAISE EXCEPTION 'Error: No se pudo crear función validar_integridad_lote';
    END IF;
    
    -- Verificar que los triggers se crearon
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'trigger_validar_integridad_lote'
    ) THEN
        RAISE EXCEPTION 'Error: No se pudo crear trigger_validar_integridad_lote';
    END IF;
    
    -- Verificar que las vistas se crearon
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.views 
        WHERE table_name = 'vista_resumen_inventario'
    ) THEN
        RAISE EXCEPTION 'Error: No se pudo crear vista_resumen_inventario';
    END IF;
    
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'CORRECCIÓN COMPLETADA EXITOSAMENTE';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'Todas las diferencias entre local y producción han sido corregidas';
    RAISE NOTICE 'El sistema de inventario debería funcionar correctamente ahora';
    RAISE NOTICE '=====================================================';
END $$;
