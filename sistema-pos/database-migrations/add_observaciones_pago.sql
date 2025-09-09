-- Script adicional para agregar la columna observaciones_pago faltante
-- Ejecutar este script directamente en la consola de PostgreSQL de DigitalOcean

-- =====================================================
-- AGREGAR COLUMNA OBSERVACIONES_PAGO A LA TABLA VENTAS
-- =====================================================

-- Agregar la columna observaciones_pago que falta
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS observaciones_pago TEXT;

-- Agregar comentario para documentar la columna
COMMENT ON COLUMN ventas.observaciones_pago IS 'Observaciones adicionales sobre el pago (opcional)';

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

DO $$
BEGIN
    -- Verificar que la columna se creó correctamente
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ventas' AND column_name = 'observaciones_pago'
    ) THEN
        RAISE EXCEPTION 'La columna observaciones_pago no se agregó a la tabla ventas';
    END IF;
    
    RAISE NOTICE 'Columna observaciones_pago agregada exitosamente a la tabla ventas';
END $$;
