-- Migración: 003_sync_pago_diferido_production.sql
-- Descripción: Sincronizar estructura de pagos diferidos entre local y producción
-- Fecha: 2025-01-09
-- Autor: Sistema POS

-- =====================================================
-- 1. CORREGIR TABLA HISTORIAL_PAGOS_DIFERIDOS
-- =====================================================

-- Agregar columnas faltantes en historial_pagos_diferidos
ALTER TABLE historial_pagos_diferidos ADD COLUMN IF NOT EXISTS id_pago_final INTEGER;
ALTER TABLE historial_pagos_diferidos ADD COLUMN IF NOT EXISTS id_vendedor INTEGER;

-- Agregar comentarios
COMMENT ON COLUMN historial_pagos_diferidos.id_pago_final IS 'ID del método de pago usado para el pago final';
COMMENT ON COLUMN historial_pagos_diferidos.id_vendedor IS 'ID del vendedor que procesó el pago';

-- =====================================================
-- 2. VERIFICAR Y CORREGIR TABLA PAGOS_DIFERIDOS
-- =====================================================

-- Verificar que la tabla pagos_diferidos tenga la estructura correcta
DO $$
BEGIN
    -- Verificar si existe la columna id_restaurante
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pagos_diferidos' AND column_name = 'id_restaurante'
    ) THEN
        ALTER TABLE pagos_diferidos ADD COLUMN id_restaurante INTEGER;
        RAISE NOTICE 'Columna id_restaurante agregada a pagos_diferidos';
    END IF;
END $$;

-- =====================================================
-- 3. ACTUALIZAR FUNCIÓN marcar_venta_diferida_como_pagada
-- =====================================================

-- Recrear la función con la estructura correcta
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
-- 4. CREAR VISTA PARA PAGOS DIFERIDOS PENDIENTES
-- =====================================================

-- Recrear la vista con la estructura correcta
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

-- =====================================================
-- 5. VERIFICACIONES FINALES
-- =====================================================

DO $$
BEGIN
    -- Verificar estructura de historial_pagos_diferidos
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'historial_pagos_diferidos' AND column_name = 'id_pago_final'
    ) THEN
        RAISE EXCEPTION 'La columna id_pago_final no se agregó a historial_pagos_diferidos';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'historial_pagos_diferidos' AND column_name = 'id_vendedor'
    ) THEN
        RAISE EXCEPTION 'La columna id_vendedor no se agregó a historial_pagos_diferidos';
    END IF;
    
    -- Verificar que la función existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_name = 'marcar_venta_diferida_como_pagada'
    ) THEN
        RAISE EXCEPTION 'La función marcar_venta_diferida_como_pagada no se creó';
    END IF;
    
    -- Verificar que la vista existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.views 
        WHERE table_name = 'vista_pagos_diferidos_pendientes'
    ) THEN
        RAISE EXCEPTION 'La vista vista_pagos_diferidos_pendientes no se creó';
    END IF;
    
    RAISE NOTICE 'Migración de sincronización completada exitosamente';
END $$;
