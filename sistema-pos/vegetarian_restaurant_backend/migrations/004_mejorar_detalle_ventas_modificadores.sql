-- =====================================================
-- MIGRACIÓN 004: MEJORAR DETALLE_VENTAS_MODIFICADORES
-- Sistema: SITEMM POS - Toppings Profesional
-- Fecha: 2025-10-10
-- Descripción: Agrega campos para cantidades y precios
-- =====================================================

-- =====================================================
-- AGREGAR NUEVAS COLUMNAS
-- =====================================================

DO $$
BEGIN
    -- cantidad
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'detalle_ventas_modificadores' 
        AND column_name = 'cantidad'
    ) THEN
        ALTER TABLE detalle_ventas_modificadores 
            ADD COLUMN cantidad INTEGER DEFAULT 1;
        RAISE NOTICE '✓ Columna cantidad agregada';
    ELSE
        RAISE NOTICE '- Columna cantidad ya existe';
    END IF;

    -- precio_unitario
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'detalle_ventas_modificadores' 
        AND column_name = 'precio_unitario'
    ) THEN
        ALTER TABLE detalle_ventas_modificadores 
            ADD COLUMN precio_unitario NUMERIC(10,2);
        RAISE NOTICE '✓ Columna precio_unitario agregada';
    ELSE
        RAISE NOTICE '- Columna precio_unitario ya existe';
    END IF;

    -- subtotal
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'detalle_ventas_modificadores' 
        AND column_name = 'subtotal'
    ) THEN
        ALTER TABLE detalle_ventas_modificadores 
            ADD COLUMN subtotal NUMERIC(10,2);
        RAISE NOTICE '✓ Columna subtotal agregada';
    ELSE
        RAISE NOTICE '- Columna subtotal ya existe';
    END IF;

    -- observaciones
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'detalle_ventas_modificadores' 
        AND column_name = 'observaciones'
    ) THEN
        ALTER TABLE detalle_ventas_modificadores 
            ADD COLUMN observaciones TEXT;
        RAISE NOTICE '✓ Columna observaciones agregada';
    ELSE
        RAISE NOTICE '- Columna observaciones ya existe';
    END IF;
END $$;

-- =====================================================
-- ACTUALIZAR DATOS EXISTENTES
-- =====================================================

-- Si ya hay registros, actualizar precio_aplicado a precio_unitario
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'detalle_ventas_modificadores' 
        AND column_name = 'precio_aplicado'
    ) THEN
        UPDATE detalle_ventas_modificadores
        SET precio_unitario = precio_aplicado
        WHERE precio_unitario IS NULL AND precio_aplicado IS NOT NULL;
        
        RAISE NOTICE '✓ Datos migrados de precio_aplicado a precio_unitario';
    END IF;
END $$;

-- =====================================================
-- COMENTARIOS
-- =====================================================

COMMENT ON COLUMN detalle_ventas_modificadores.cantidad IS 
    'Cantidad del modificador (ej: 2x queso extra)';
    
COMMENT ON COLUMN detalle_ventas_modificadores.precio_unitario IS 
    'Precio unitario al momento de la venta (histórico)';
    
COMMENT ON COLUMN detalle_ventas_modificadores.subtotal IS 
    'Subtotal = cantidad * precio_unitario';

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

DO $$
DECLARE
    count_columnas INTEGER;
BEGIN
    SELECT COUNT(*) INTO count_columnas
    FROM information_schema.columns
    WHERE table_name = 'detalle_ventas_modificadores';
    
    RAISE NOTICE '✓ Total de columnas en detalle_ventas_modificadores: %', count_columnas;
END $$;

-- =====================================================
-- FIN DE MIGRACIÓN 004
-- =====================================================

