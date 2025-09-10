-- Diagnóstico de diferencias entre local y producción
-- Fecha: 2025-01-09
-- Autor: Sistema POS

-- =====================================================
-- 1. VERIFICAR DIFERENCIAS EN TABLA VENTAS
-- =====================================================

-- Verificar si existe la columna observaciones_pago en ventas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ventas' AND column_name = 'observaciones_pago'
    ) THEN
        RAISE NOTICE '❌ FALTA: Columna observaciones_pago en tabla ventas';
        RAISE NOTICE 'SOLUCIÓN: Ejecutar: ALTER TABLE ventas ADD COLUMN observaciones_pago TEXT;';
    ELSE
        RAISE NOTICE '✅ OK: Columna observaciones_pago existe en tabla ventas';
    END IF;
END $$;

-- =====================================================
-- 2. VERIFICAR DIFERENCIAS EN TABLA HISTORIAL_PAGOS_DIFERIDOS
-- =====================================================

-- Verificar estructura de historial_pagos_diferidos
DO $$
DECLARE
    col_count INTEGER;
    col_names TEXT[];
BEGIN
    -- Contar columnas
    SELECT COUNT(*), ARRAY_AGG(column_name ORDER BY ordinal_position)
    INTO col_count, col_names
    FROM information_schema.columns 
    WHERE table_name = 'historial_pagos_diferidos';
    
    RAISE NOTICE 'Columnas en historial_pagos_diferidos: %', col_count;
    RAISE NOTICE 'Nombres: %', array_to_string(col_names, ', ');
    
    -- Verificar columnas específicas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'historial_pagos_diferidos' AND column_name = 'id_pago_final'
    ) THEN
        RAISE NOTICE '❌ FALTA: Columna id_pago_final en historial_pagos_diferidos';
    ELSE
        RAISE NOTICE '✅ OK: Columna id_pago_final existe';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'historial_pagos_diferidos' AND column_name = 'id_vendedor'
    ) THEN
        RAISE NOTICE '❌ FALTA: Columna id_vendedor en historial_pagos_diferidos';
    ELSE
        RAISE NOTICE '✅ OK: Columna id_vendedor existe';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'historial_pagos_diferidos' AND column_name = 'id_mesa'
    ) THEN
        RAISE NOTICE '❌ FALTA: Columna id_mesa en historial_pagos_diferidos';
    ELSE
        RAISE NOTICE '✅ OK: Columna id_mesa existe';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'historial_pagos_diferidos' AND column_name = 'id_restaurante'
    ) THEN
        RAISE NOTICE '❌ FALTA: Columna id_restaurante en historial_pagos_diferidos';
    ELSE
        RAISE NOTICE '✅ OK: Columna id_restaurante existe';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'historial_pagos_diferidos' AND column_name = 'id_metodo_pago'
    ) THEN
        RAISE NOTICE '❌ FALTA: Columna id_metodo_pago en historial_pagos_diferidos';
    ELSE
        RAISE NOTICE '✅ OK: Columna id_metodo_pago existe';
    END IF;
END $$;

-- =====================================================
-- 3. VERIFICAR DIFERENCIAS EN TABLA PAGOS_DIFERIDOS
-- =====================================================

-- Verificar estructura de pagos_diferidos
DO $$
DECLARE
    col_count INTEGER;
    col_names TEXT[];
BEGIN
    -- Contar columnas
    SELECT COUNT(*), ARRAY_AGG(column_name ORDER BY ordinal_position)
    INTO col_count, col_names
    FROM information_schema.columns 
    WHERE table_name = 'pagos_diferidos';
    
    RAISE NOTICE 'Columnas en pagos_diferidos: %', col_count;
    RAISE NOTICE 'Nombres: %', array_to_string(col_names, ', ');
    
    -- Verificar columnas específicas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pagos_diferidos' AND column_name = 'id_restaurante'
    ) THEN
        RAISE NOTICE '❌ FALTA: Columna id_restaurante en pagos_diferidos';
    ELSE
        RAISE NOTICE '✅ OK: Columna id_restaurante existe';
    END IF;
END $$;

-- =====================================================
-- 4. VERIFICAR FUNCIONES SQL
-- =====================================================

-- Verificar funciones críticas
DO $$
BEGIN
    -- Verificar función marcar_venta_diferida_como_pagada
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_name = 'marcar_venta_diferida_como_pagada'
    ) THEN
        RAISE NOTICE '❌ FALTA: Función marcar_venta_diferida_como_pagada';
    ELSE
        RAISE NOTICE '✅ OK: Función marcar_venta_diferida_como_pagada existe';
    END IF;
    
    -- Verificar función validar_integridad_lote
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_name = 'validar_integridad_lote'
    ) THEN
        RAISE NOTICE '❌ FALTA: Función validar_integridad_lote';
    ELSE
        RAISE NOTICE '✅ OK: Función validar_integridad_lote existe';
    END IF;
    
    -- Verificar función actualizar_stock_producto
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_name = 'actualizar_stock_producto'
    ) THEN
        RAISE NOTICE '❌ FALTA: Función actualizar_stock_producto';
    ELSE
        RAISE NOTICE '✅ OK: Función actualizar_stock_producto existe';
    END IF;
END $$;

-- =====================================================
-- 5. VERIFICAR VISTAS
-- =====================================================

-- Verificar vistas críticas
DO $$
BEGIN
    -- Verificar vista_pagos_diferidos_pendientes
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.views 
        WHERE table_name = 'vista_pagos_diferidos_pendientes'
    ) THEN
        RAISE NOTICE '❌ FALTA: Vista vista_pagos_diferidos_pendientes';
    ELSE
        RAISE NOTICE '✅ OK: Vista vista_pagos_diferidos_pendientes existe';
    END IF;
    
    -- Verificar vista_resumen_inventario
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.views 
        WHERE table_name = 'vista_resumen_inventario'
    ) THEN
        RAISE NOTICE '❌ FALTA: Vista vista_resumen_inventario';
    ELSE
        RAISE NOTICE '✅ OK: Vista vista_resumen_inventario existe';
    END IF;
END $$;

-- =====================================================
-- 6. VERIFICAR TRIGGERS
-- =====================================================

-- Verificar triggers críticos
DO $$
BEGIN
    -- Verificar trigger para actualizar stock
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'trigger_actualizar_stock_producto'
    ) THEN
        RAISE NOTICE '❌ FALTA: Trigger trigger_actualizar_stock_producto';
    ELSE
        RAISE NOTICE '✅ OK: Trigger trigger_actualizar_stock_producto existe';
    END IF;
    
    -- Verificar trigger para validar lotes
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'trigger_validar_integridad_lote'
    ) THEN
        RAISE NOTICE '❌ FALTA: Trigger trigger_validar_integridad_lote';
    ELSE
        RAISE NOTICE '✅ OK: Trigger trigger_validar_integridad_lote existe';
    END IF;
END $$;

-- =====================================================
-- 7. RESUMEN FINAL
-- =====================================================

RAISE NOTICE '=====================================================';
RAISE NOTICE 'DIAGNÓSTICO COMPLETADO';
RAISE NOTICE '=====================================================';
RAISE NOTICE 'Si hay elementos marcados con ❌, ejecutar el script de corrección';
RAISE NOTICE 'Si todo está ✅, el problema puede estar en el código backend';
RAISE NOTICE '=====================================================';
