-- Migración: 002_cleanup_metodos_pago.sql
-- Descripción: Limpiar métodos de pago duplicados e incorrectos
-- Fecha: 2025-01-09
-- Autor: Sistema POS

-- =====================================================
-- 1. DESACTIVAR MÉTODOS DE PAGO INCORRECTOS
-- =====================================================

-- Desactivar métodos de pago que no deberían estar activos
UPDATE metodos_pago 
SET activo = false
WHERE id_restaurante = 1 
  AND id_pago IN (
    -- IDs de métodos incorrectos basados en la lista proporcionada
    6,  -- pendiente_caja
    19, -- Efectivo duplicado
    20, -- Pago Diferido
    21, -- Pago Diferido
    22, -- Pago Diferido
    23, -- Pago Diferido
    24, -- Pago Diferido
    25  -- Pago Diferido
  );

-- =====================================================
-- 2. ASEGURAR QUE LOS MÉTODOS CORRECTOS ESTÉN ACTIVOS
-- =====================================================

-- Activar solo los métodos de pago correctos
UPDATE metodos_pago 
SET activo = true,
    descripcion = CASE 
        WHEN id_pago = 1 THEN 'Efectivo'
        WHEN id_pago = 2 THEN 'Tarjeta de Crédito'
        WHEN id_pago = 3 THEN 'Tarjeta de Débito'
        WHEN id_pago = 4 THEN 'Transferencia'
        WHEN id_pago = 5 THEN 'Pago Móvil'
        ELSE descripcion
    END
WHERE id_restaurante = 1 
  AND id_pago IN (1, 2, 3, 4, 5);

-- =====================================================
-- 3. CREAR MÉTODOS DE PAGO FALTANTES SI NO EXISTEN
-- =====================================================

-- Insertar métodos de pago correctos si no existen
INSERT INTO metodos_pago (id_pago, descripcion, activo, id_restaurante)
SELECT 1, 'Efectivo', true, 1
WHERE NOT EXISTS (SELECT 1 FROM metodos_pago WHERE id_pago = 1 AND id_restaurante = 1);

INSERT INTO metodos_pago (id_pago, descripcion, activo, id_restaurante)
SELECT 2, 'Tarjeta de Crédito', true, 1
WHERE NOT EXISTS (SELECT 1 FROM metodos_pago WHERE id_pago = 2 AND id_restaurante = 1);

INSERT INTO metodos_pago (id_pago, descripcion, activo, id_restaurante)
SELECT 3, 'Tarjeta de Débito', true, 1
WHERE NOT EXISTS (SELECT 1 FROM metodos_pago WHERE id_pago = 3 AND id_restaurante = 1);

INSERT INTO metodos_pago (id_pago, descripcion, activo, id_restaurante)
SELECT 4, 'Transferencia', true, 1
WHERE NOT EXISTS (SELECT 1 FROM metodos_pago WHERE id_pago = 4 AND id_restaurante = 1);

INSERT INTO metodos_pago (id_pago, descripcion, activo, id_restaurante)
SELECT 5, 'Pago Móvil', true, 1
WHERE NOT EXISTS (SELECT 1 FROM metodos_pago WHERE id_pago = 5 AND id_restaurante = 1);

-- =====================================================
-- 4. ACTUALIZAR VENTAS QUE USAN MÉTODOS INCORRECTOS
-- =====================================================

-- Actualizar ventas que usan métodos de pago incorrectos
UPDATE ventas 
SET id_pago = CASE 
    WHEN id_pago = 6 THEN 1  -- pendiente_caja -> Efectivo
    WHEN id_pago = 23 THEN 1 -- Pago Diferido -> Efectivo
    WHEN id_pago IN (19, 20, 21, 22, 24, 25) THEN 1 -- Otros duplicados -> Efectivo
    ELSE id_pago
END
WHERE id_pago IN (6, 19, 20, 21, 22, 23, 24, 25)
  AND id_restaurante = 1;

-- =====================================================
-- 5. CREAR ÍNDICE PARA OPTIMIZAR CONSULTAS
-- =====================================================

-- Crear índice para consultas por método de pago activo
CREATE INDEX IF NOT EXISTS idx_metodos_pago_activos 
ON metodos_pago(id_restaurante, activo) 
WHERE activo = true;

-- =====================================================
-- 6. CREAR VISTA PARA MÉTODOS DE PAGO ACTIVOS
-- =====================================================

CREATE OR REPLACE VIEW vista_metodos_pago_activos AS
SELECT 
    id_pago,
    descripcion,
    activo,
    id_restaurante,
    CASE 
        WHEN descripcion ILIKE '%efectivo%' THEN 'Efectivo'
        WHEN descripcion ILIKE '%tarjeta%' AND descripcion ILIKE '%crédito%' THEN 'Tarjeta de Crédito'
        WHEN descripcion ILIKE '%tarjeta%' AND descripcion ILIKE '%débito%' THEN 'Tarjeta de Débito'
        WHEN descripcion ILIKE '%transferencia%' THEN 'Transferencia'
        WHEN descripcion ILIKE '%móvil%' OR descripcion ILIKE '%movil%' THEN 'Pago Móvil'
        ELSE descripcion
    END as categoria_pago
FROM metodos_pago
WHERE activo = true
ORDER BY id_pago;

-- Agregar comentario a la vista
COMMENT ON VIEW vista_metodos_pago_activos IS 'Vista de métodos de pago activos con categorización';

-- =====================================================
-- 7. VERIFICACIONES FINALES
-- =====================================================

-- Verificar que solo hay 5 métodos de pago activos
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM metodos_pago
    WHERE id_restaurante = 1 AND activo = true;
    
    IF v_count != 5 THEN
        RAISE EXCEPTION 'Se esperaban 5 métodos de pago activos, pero se encontraron %', v_count;
    END IF;
    
    -- Verificar que los métodos correctos están activos
    IF NOT EXISTS (
        SELECT 1 FROM metodos_pago 
        WHERE id_restaurante = 1 AND activo = true AND descripcion = 'Efectivo'
    ) THEN
        RAISE EXCEPTION 'El método Efectivo no está activo';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM metodos_pago 
        WHERE id_restaurante = 1 AND activo = true AND descripcion = 'Tarjeta de Crédito'
    ) THEN
        RAISE EXCEPTION 'El método Tarjeta de Crédito no está activo';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM metodos_pago 
        WHERE id_restaurante = 1 AND activo = true AND descripcion = 'Tarjeta de Débito'
    ) THEN
        RAISE EXCEPTION 'El método Tarjeta de Débito no está activo';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM metodos_pago 
        WHERE id_restaurante = 1 AND activo = true AND descripcion = 'Transferencia'
    ) THEN
        RAISE EXCEPTION 'El método Transferencia no está activo';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM metodos_pago 
        WHERE id_restaurante = 1 AND activo = true AND descripcion = 'Pago Móvil'
    ) THEN
        RAISE EXCEPTION 'El método Pago Móvil no está activo';
    END IF;
    
    RAISE NOTICE '✅ Limpieza de métodos de pago completada exitosamente';
    RAISE NOTICE '📋 Métodos de pago activos: Efectivo, Tarjeta de Crédito, Tarjeta de Débito, Transferencia, Pago Móvil';
END $$;
