-- =====================================================
-- MIGRACIÓN 005: VISTAS Y FUNCIONES
-- Sistema: SITEMM POS - Toppings Profesional
-- Fecha: 2025-10-10
-- Descripción: Crea vistas optimizadas y funciones de validación
-- =====================================================

-- =====================================================
-- VISTA: Modificadores Completos
-- =====================================================

CREATE OR REPLACE VIEW vista_modificadores_completa AS
SELECT 
    pm.id_modificador,
    pm.nombre_modificador,
    pm.descripcion,
    pm.precio_extra,
    pm.tipo_modificador,
    pm.stock_disponible,
    pm.controlar_stock,
    pm.imagen_url,
    pm.calorias,
    pm.es_vegetariano,
    pm.es_vegano,
    pm.contiene_gluten,
    pm.alergenos,
    pm.activo,
    pm.orden_display,
    gm.id_grupo_modificador,
    gm.nombre AS grupo_nombre,
    gm.tipo AS grupo_tipo,
    gm.es_obligatorio AS grupo_obligatorio,
    p.id_producto,
    p.nombre AS producto_nombre,
    pm.id_restaurante,
    
    -- Estado de stock
    CASE 
        WHEN pm.controlar_stock AND pm.stock_disponible <= 0 THEN 'sin_stock'
        WHEN pm.controlar_stock AND pm.stock_disponible <= 5 THEN 'stock_bajo'
        ELSE 'disponible'
    END AS estado_stock,
    
    -- Precio final con descuento
    CASE
        WHEN pm.descuento_porcentaje IS NOT NULL AND pm.descuento_porcentaje > 0 
        THEN ROUND(pm.precio_extra * (1 - pm.descuento_porcentaje / 100), 2)
        ELSE pm.precio_extra
    END AS precio_final
    
FROM productos_modificadores pm
LEFT JOIN grupos_modificadores gm ON pm.id_grupo_modificador = gm.id_grupo_modificador
LEFT JOIN productos p ON pm.id_producto = p.id_producto
WHERE pm.activo = true;

COMMENT ON VIEW vista_modificadores_completa IS 
    'Vista completa de modificadores con información de grupo y estado';

-- =====================================================
-- VISTA: Grupos por Producto
-- =====================================================

CREATE OR REPLACE VIEW vista_grupos_por_producto AS
SELECT 
    p.id_producto,
    p.nombre AS producto_nombre,
    gm.id_grupo_modificador,
    gm.nombre AS grupo_nombre,
    gm.descripcion AS grupo_descripcion,
    gm.tipo AS grupo_tipo,
    gm.min_selecciones,
    gm.max_selecciones,
    gm.es_obligatorio,
    gm.orden_display,
    gm.id_restaurante,
    
    -- Contar modificadores en este grupo
    COUNT(pm.id_modificador) FILTER (WHERE pm.activo = true) AS total_modificadores,
    
    -- JSON array de modificadores
    COALESCE(
        json_agg(
            json_build_object(
                'id_modificador', pm.id_modificador,
                'nombre_modificador', pm.nombre_modificador,
                'descripcion', pm.descripcion,
                'precio_extra', pm.precio_extra,
                'precio_final', CASE
                    WHEN pm.descuento_porcentaje IS NOT NULL AND pm.descuento_porcentaje > 0 
                    THEN ROUND(pm.precio_extra * (1 - pm.descuento_porcentaje / 100), 2)
                    ELSE pm.precio_extra
                END,
                'imagen_url', pm.imagen_url,
                'calorias', pm.calorias,
                'es_vegetariano', pm.es_vegetariano,
                'es_vegano', pm.es_vegano,
                'contiene_gluten', pm.contiene_gluten,
                'alergenos', pm.alergenos,
                'stock_disponible', pm.stock_disponible,
                'estado_stock', CASE 
                    WHEN pm.controlar_stock AND pm.stock_disponible <= 0 THEN 'sin_stock'
                    WHEN pm.controlar_stock AND pm.stock_disponible <= 5 THEN 'stock_bajo'
                    ELSE 'disponible'
                END,
                'orden_display', pm.orden_display
            ) ORDER BY pm.orden_display
        ) FILTER (WHERE pm.id_modificador IS NOT NULL),
        '[]'::json
    ) AS modificadores
    
FROM productos p
JOIN productos_grupos_modificadores pgm ON p.id_producto = pgm.id_producto
JOIN grupos_modificadores gm ON pgm.id_grupo_modificador = gm.id_grupo_modificador
LEFT JOIN productos_modificadores pm 
    ON gm.id_grupo_modificador = pm.id_grupo_modificador 
    AND pm.activo = true

WHERE p.activo = true AND gm.activo = true

GROUP BY 
    p.id_producto, p.nombre, 
    gm.id_grupo_modificador, gm.nombre, gm.descripcion,
    gm.tipo, gm.min_selecciones, gm.max_selecciones, 
    gm.es_obligatorio, gm.orden_display, gm.id_restaurante

ORDER BY p.id_producto, gm.orden_display;

COMMENT ON VIEW vista_grupos_por_producto IS 
    'Vista de grupos de modificadores por producto con modificadores en JSON';

-- =====================================================
-- FUNCIÓN: Validar Selección de Modificadores
-- =====================================================

CREATE OR REPLACE FUNCTION validar_modificadores_producto(
    p_id_producto INTEGER,
    p_modificadores_seleccionados INTEGER[]
) RETURNS TABLE (
    es_valido BOOLEAN,
    mensaje_error TEXT,
    grupo_invalido VARCHAR(100)
) AS $$
DECLARE
    v_grupo RECORD;
    v_count INTEGER;
BEGIN
    -- Validar cada grupo de modificadores obligatorio
    FOR v_grupo IN 
        SELECT 
            gm.id_grupo_modificador,
            gm.nombre,
            gm.min_selecciones,
            gm.max_selecciones,
            gm.es_obligatorio
        FROM grupos_modificadores gm
        JOIN productos_grupos_modificadores pgm 
            ON gm.id_grupo_modificador = pgm.id_grupo_modificador
        WHERE pgm.id_producto = p_id_producto
        AND gm.activo = true
        ORDER BY gm.orden_display
    LOOP
        -- Contar modificadores seleccionados de este grupo
        SELECT COUNT(*) INTO v_count
        FROM productos_modificadores pm
        WHERE pm.id_grupo_modificador = v_grupo.id_grupo_modificador
        AND pm.id_modificador = ANY(p_modificadores_seleccionados)
        AND pm.activo = true;
        
        -- Validar mínimo (solo si es obligatorio o ya seleccionó algo)
        IF v_count < v_grupo.min_selecciones AND (v_grupo.es_obligatorio OR v_count > 0) THEN
            RETURN QUERY SELECT 
                false, 
                format('Debe seleccionar al menos %s opción(es) en "%s"', 
                    v_grupo.min_selecciones, v_grupo.nombre)::TEXT,
                v_grupo.nombre;
            RETURN;
        END IF;
        
        -- Validar máximo
        IF v_grupo.max_selecciones IS NOT NULL AND v_count > v_grupo.max_selecciones THEN
            RETURN QUERY SELECT 
                false,
                format('No puede seleccionar más de %s opción(es) en "%s"', 
                    v_grupo.max_selecciones, v_grupo.nombre)::TEXT,
                v_grupo.nombre;
            RETURN;
        END IF;
    END LOOP;
    
    -- Todo válido
    RETURN QUERY SELECT true, 'OK'::TEXT, NULL::VARCHAR(100);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION validar_modificadores_producto IS 
    'Valida que la selección de modificadores cumpla con las reglas del producto';

-- =====================================================
-- TRIGGER: Actualizar Stock de Modificadores
-- =====================================================

CREATE OR REPLACE FUNCTION actualizar_stock_modificadores_trigger()
RETURNS TRIGGER AS $$
BEGIN
    -- Reducir stock si el modificador controla inventario
    UPDATE productos_modificadores pm
    SET 
        stock_disponible = stock_disponible - NEW.cantidad,
        updated_at = NOW()
    WHERE pm.id_modificador = NEW.id_modificador
    AND pm.controlar_stock = true
    AND pm.stock_disponible >= NEW.cantidad;
    
    -- Verificar si se actualizó (si no, lanzar error de stock insuficiente)
    IF NOT FOUND AND EXISTS (
        SELECT 1 FROM productos_modificadores 
        WHERE id_modificador = NEW.id_modificador 
        AND controlar_stock = true
    ) THEN
        RAISE EXCEPTION 'Stock insuficiente para el modificador ID %', NEW.id_modificador;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger (eliminar si existe)
DROP TRIGGER IF EXISTS trigger_stock_modificadores 
    ON detalle_ventas_modificadores;
    
CREATE TRIGGER trigger_stock_modificadores
    AFTER INSERT ON detalle_ventas_modificadores
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_stock_modificadores_trigger();

COMMENT ON FUNCTION actualizar_stock_modificadores_trigger IS 
    'Actualiza automáticamente el stock de modificadores cuando se venden';

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

DO $$
DECLARE
    count_vistas INTEGER;
    count_funciones INTEGER;
BEGIN
    -- Contar vistas creadas
    SELECT COUNT(*) INTO count_vistas
    FROM information_schema.views
    WHERE table_name LIKE 'vista_%modificadores%';
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'MIGRACIÓN 005 COMPLETADA';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✓ Vistas creadas: %', count_vistas;
    RAISE NOTICE '✓ Función de validación creada';
    RAISE NOTICE '✓ Trigger de stock configurado';
    RAISE NOTICE '========================================';
END $$;

-- =====================================================
-- FIN DE MIGRACIÓN 005
-- =====================================================

