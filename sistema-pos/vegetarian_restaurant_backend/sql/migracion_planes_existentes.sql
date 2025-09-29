-- =====================================================
-- MIGRACIÓN DE PLANES EXISTENTES
-- Migrar datos de tablas existentes a la nueva estructura unificada
-- =====================================================

-- 1. MIGRAR DATOS DE PLANES_EXISTENTES A PLANES_UNIFICADOS
-- =====================================================

-- Migrar desde planes_pos si existe
INSERT INTO planes_unificados (
    nombre, descripcion, precio_mensual, precio_anual,
    max_sucursales, max_usuarios, max_productos, max_transacciones_mes, almacenamiento_gb,
    incluye_pos, incluye_inventario_basico, incluye_inventario_avanzado,
    incluye_promociones, incluye_reservas, incluye_arqueo_caja,
    incluye_egresos, incluye_egresos_avanzados, incluye_reportes_avanzados,
    incluye_analytics, incluye_delivery, incluye_impresion, incluye_soporte_24h,
    incluye_api, incluye_white_label, orden_display, activo
)
SELECT 
    nombre,
    descripcion,
    precio_mensual,
    precio_anual,
    max_sucursales,
    max_usuarios,
    100, -- max_productos por defecto
    500, -- max_transacciones_mes por defecto
    1,   -- almacenamiento_gb por defecto
    true, -- incluye_pos
    true, -- incluye_inventario_basico
    false, -- incluye_inventario_avanzado
    false, -- incluye_promociones
    incluye_reservas,
    false, -- incluye_arqueo_caja
    false, -- incluye_egresos
    false, -- incluye_egresos_avanzados
    false, -- incluye_reportes_avanzados
    incluye_analytics,
    incluye_delivery,
    incluye_impresion,
    incluye_soporte_24h,
    false, -- incluye_api
    false, -- incluye_white_label
    orden_display,
    activo
FROM planes_pos
WHERE NOT EXISTS (
    SELECT 1 FROM planes_unificados WHERE planes_unificados.nombre = planes_pos.nombre
)
ON CONFLICT (nombre) DO NOTHING;

-- Migrar desde planes si existe y no está duplicado
INSERT INTO planes_unificados (
    nombre, descripcion, precio_mensual, precio_anual,
    max_sucursales, max_usuarios, max_productos, max_transacciones_mes, almacenamiento_gb,
    incluye_pos, incluye_inventario_basico, incluye_inventario_avanzado,
    incluye_promociones, incluye_reservas, incluye_arqueo_caja,
    incluye_egresos, incluye_egresos_avanzados, incluye_reportes_avanzados,
    incluye_analytics, incluye_delivery, incluye_impresion, incluye_soporte_24h,
    incluye_api, incluye_white_label, orden_display, activo
)
SELECT 
    nombre,
    descripcion,
    precio_mensual,
    precio_anual,
    max_sucursales,
    max_usuarios,
    COALESCE(max_productos, 100),
    COALESCE(max_transacciones_mes, 500),
    COALESCE(almacenamiento_gb, 1),
    true, -- incluye_pos
    true, -- incluye_inventario_basico
    false, -- incluye_inventario_avanzado
    false, -- incluye_promociones
    false, -- incluye_reservas
    false, -- incluye_arqueo_caja
    false, -- incluye_egresos
    false, -- incluye_egresos_avanzados
    false, -- incluye_reportes_avanzados
    false, -- incluye_analytics
    false, -- incluye_delivery
    true,  -- incluye_impresion
    false, -- incluye_soporte_24h
    false, -- incluye_api
    false, -- incluye_white_label
    COALESCE(orden_display, 0),
    activo
FROM planes
WHERE NOT EXISTS (
    SELECT 1 FROM planes_unificados WHERE planes_unificados.nombre = planes.nombre
)
ON CONFLICT (nombre) DO NOTHING;

-- 2. MIGRAR SUSCRIPCIONES EXISTENTES
-- =====================================================

-- Migrar desde suscripciones si existe
INSERT INTO suscripciones_activas (
    id_restaurante, id_plan, estado, fecha_inicio, fecha_fin,
    fecha_renovacion, metodo_pago, ultimo_pago, proximo_pago,
    auto_renovacion, notificaciones_email, created_at, updated_at
)
SELECT 
    s.id_restaurante,
    pu.id_plan,
    s.estado,
    s.fecha_inicio,
    s.fecha_fin,
    s.fecha_renovacion,
    s.metodo_pago,
    s.ultimo_pago,
    s.proximo_pago,
    s.auto_renovacion,
    s.notificaciones_email,
    s.created_at,
    s.updated_at
FROM suscripciones s
JOIN planes_unificados pu ON pu.nombre = (
    SELECT nombre FROM planes WHERE id_plan = s.id_plan
)
WHERE NOT EXISTS (
    SELECT 1 FROM suscripciones_activas sa 
    WHERE sa.id_restaurante = s.id_restaurante 
    AND sa.estado = 'activa'
)
ON CONFLICT (id_restaurante, estado) DO NOTHING;

-- 3. MIGRAR CONTADORES DE USO EXISTENTES
-- =====================================================

-- Migrar desde uso_recursos si existe
INSERT INTO contadores_uso (
    id_restaurante, id_plan, sucursales_actuales, usuarios_actuales,
    productos_actuales, transacciones_mes_actual, almacenamiento_usado_mb,
    mes_medicion, año_medicion, ultima_actualizacion, created_at, updated_at
)
SELECT 
    ur.id_restaurante,
    sa.id_plan,
    ur.sucursales_actuales,
    ur.usuarios_actuales,
    ur.productos_actuales,
    ur.transacciones_mes_actual,
    ur.almacenamiento_usado_mb,
    ur.mes_medicion,
    ur.año_medicion,
    ur.updated_at,
    ur.created_at,
    ur.updated_at
FROM uso_recursos ur
JOIN suscripciones_activas sa ON sa.id_restaurante = ur.id_restaurante
WHERE NOT EXISTS (
    SELECT 1 FROM contadores_uso cu 
    WHERE cu.id_restaurante = ur.id_restaurante 
    AND cu.mes_medicion = ur.mes_medicion 
    AND cu.año_medicion = ur.año_medicion
)
ON CONFLICT (id_restaurante, mes_medicion, año_medicion) DO NOTHING;

-- 4. MIGRAR ALERTAS EXISTENTES
-- =====================================================

-- Migrar desde alertas_limites si existe
INSERT INTO alertas_limites (
    id_restaurante, id_plan, tipo_alerta, recurso, valor_actual,
    valor_limite, porcentaje_uso, estado, nivel_urgencia,
    fecha_alerta, mensaje, created_at, updated_at
)
SELECT 
    al.id_restaurante,
    sa.id_plan,
    al.tipo_alerta,
    al.recurso,
    al.valor_actual,
    al.valor_limite,
    al.porcentaje_uso,
    al.estado,
    'medio', -- nivel_urgencia por defecto
    al.fecha_alerta,
    al.mensaje,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM alertas_limites al
JOIN suscripciones_activas sa ON sa.id_restaurante = al.id_restaurante
WHERE NOT EXISTS (
    SELECT 1 FROM alertas_limites new_al 
    WHERE new_al.id_restaurante = al.id_restaurante 
    AND new_al.tipo_alerta = al.tipo_alerta
    AND new_al.fecha_alerta = al.fecha_alerta
)
ON CONFLICT DO NOTHING;

-- 5. MIGRAR AUDITORÍA EXISTENTE
-- =====================================================

-- Migrar desde auditoria_planes si existe
INSERT INTO auditoria_planes (
    id_restaurante, tipo_cambio, id_plan_anterior, id_plan_nuevo,
    id_usuario_cambio, nombre_usuario, fecha_cambio, fecha_efectiva,
    motivo, observaciones, datos_anteriores, datos_nuevos
)
SELECT 
    ap.id_restaurante,
    ap.tipo_cambio,
    pu_anterior.id_plan,
    pu_nuevo.id_plan,
    ap.id_usuario_cambio,
    ap.nombre_usuario,
    ap.fecha_cambio,
    ap.fecha_efectiva,
    ap.motivo,
    ap.observaciones,
    ap.datos_adicionales,
    ap.datos_adicionales
FROM auditoria_planes ap
LEFT JOIN planes_unificados pu_anterior ON pu_anterior.nombre = (
    SELECT nombre FROM planes WHERE id_plan = ap.id_plan_anterior
)
LEFT JOIN planes_unificados pu_nuevo ON pu_nuevo.nombre = (
    SELECT nombre FROM planes WHERE id_plan = ap.id_plan_nuevo
)
WHERE NOT EXISTS (
    SELECT 1 FROM auditoria_planes new_ap 
    WHERE new_ap.id_restaurante = ap.id_restaurante 
    AND new_ap.fecha_cambio = ap.fecha_cambio
    AND new_ap.tipo_cambio = ap.tipo_cambio
)
ON CONFLICT DO NOTHING;

-- 6. ACTUALIZAR CONTADORES CON DATOS REALES
-- =====================================================

-- Actualizar contadores de sucursales
UPDATE contadores_uso 
SET sucursales_actuales = (
    SELECT COUNT(*) 
    FROM sucursales 
    WHERE sucursales.id_restaurante = contadores_uso.id_restaurante 
    AND sucursales.activo = true
),
ultima_actualizacion = CURRENT_TIMESTAMP
WHERE sucursales_actuales = 0;

-- Actualizar contadores de usuarios
UPDATE contadores_uso 
SET usuarios_actuales = (
    SELECT COUNT(*) 
    FROM vendedores 
    WHERE vendedores.id_restaurante = contadores_uso.id_restaurante 
    AND vendedores.activo = true
),
ultima_actualizacion = CURRENT_TIMESTAMP
WHERE usuarios_actuales = 0;

-- Actualizar contadores de productos
UPDATE contadores_uso 
SET productos_actuales = (
    SELECT COUNT(*) 
    FROM productos 
    WHERE productos.id_restaurante = contadores_uso.id_restaurante 
    AND productos.activo = true
),
ultima_actualizacion = CURRENT_TIMESTAMP
WHERE productos_actuales = 0;

-- Actualizar contadores de transacciones del mes actual
UPDATE contadores_uso 
SET transacciones_mes_actual = (
    SELECT COUNT(*) 
    FROM ventas 
    WHERE ventas.id_restaurante = contadores_uso.id_restaurante 
    AND EXTRACT(MONTH FROM ventas.fecha) = contadores_uso.mes_medicion
    AND EXTRACT(YEAR FROM ventas.fecha) = contadores_uso.año_medicion
    AND ventas.estado != 'cancelado'
),
ultima_actualizacion = CURRENT_TIMESTAMP
WHERE transacciones_mes_actual = 0;

-- 7. CREAR CONTADORES PARA RESTAURANTES SIN SUSCRIPCIÓN
-- =====================================================

-- Crear contadores para restaurantes que no tienen suscripción activa
INSERT INTO contadores_uso (
    id_restaurante, id_plan, sucursales_actuales, usuarios_actuales,
    productos_actuales, transacciones_mes_actual, almacenamiento_usado_mb,
    mes_medicion, año_medicion, ultima_actualizacion, created_at, updated_at
)
SELECT 
    r.id_restaurante,
    1, -- Plan Básico por defecto
    COALESCE((
        SELECT COUNT(*) 
        FROM sucursales 
        WHERE sucursales.id_restaurante = r.id_restaurante 
        AND sucursales.activo = true
    ), 0),
    COALESCE((
        SELECT COUNT(*) 
        FROM vendedores 
        WHERE vendedores.id_restaurante = r.id_restaurante 
        AND vendedores.activo = true
    ), 0),
    COALESCE((
        SELECT COUNT(*) 
        FROM productos 
        WHERE productos.id_restaurante = r.id_restaurante 
        AND productos.activo = true
    ), 0),
    COALESCE((
        SELECT COUNT(*) 
        FROM ventas 
        WHERE ventas.id_restaurante = r.id_restaurante 
        AND EXTRACT(MONTH FROM ventas.fecha) = EXTRACT(MONTH FROM CURRENT_DATE)
        AND EXTRACT(YEAR FROM ventas.fecha) = EXTRACT(YEAR FROM CURRENT_DATE)
        AND ventas.estado != 'cancelado'
    ), 0),
    0, -- almacenamiento_usado_mb
    EXTRACT(MONTH FROM CURRENT_DATE),
    EXTRACT(YEAR FROM CURRENT_DATE),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM restaurantes r
WHERE NOT EXISTS (
    SELECT 1 FROM contadores_uso cu 
    WHERE cu.id_restaurante = r.id_restaurante 
    AND cu.mes_medicion = EXTRACT(MONTH FROM CURRENT_DATE)
    AND cu.año_medicion = EXTRACT(YEAR FROM CURRENT_DATE)
)
ON CONFLICT (id_restaurante, mes_medicion, año_medicion) DO NOTHING;

-- 8. CREAR SUSCRIPCIONES POR DEFECTO PARA RESTAURANTES SIN SUSCRIPCIÓN
-- =====================================================

-- Crear suscripción básica para restaurantes sin suscripción
INSERT INTO suscripciones_activas (
    id_restaurante, id_plan, estado, fecha_inicio, fecha_fin,
    fecha_renovacion, auto_renovacion, notificaciones_email, created_at, updated_at
)
SELECT 
    r.id_restaurante,
    1, -- Plan Básico por defecto
    'activa',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '1 year',
    CURRENT_DATE + INTERVAL '1 year',
    true,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM restaurantes r
WHERE NOT EXISTS (
    SELECT 1 FROM suscripciones_activas sa 
    WHERE sa.id_restaurante = r.id_restaurante 
    AND sa.estado = 'activa'
)
ON CONFLICT (id_restaurante, estado) DO NOTHING;

-- =====================================================
-- VERIFICACIÓN POST-MIGRACIÓN
-- =====================================================

-- Verificar que todos los restaurantes tengan suscripción activa
DO $$
DECLARE
    v_restaurantes_sin_suscripcion INTEGER;
    v_total_restaurantes INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_total_restaurantes FROM restaurantes;
    SELECT COUNT(*) INTO v_restaurantes_sin_suscripcion
    FROM restaurantes r
    WHERE NOT EXISTS (
        SELECT 1 FROM suscripciones_activas sa 
        WHERE sa.id_restaurante = r.id_restaurante 
        AND sa.estado = 'activa'
    );
    
    RAISE NOTICE 'Migración completada:';
    RAISE NOTICE 'Total restaurantes: %', v_total_restaurantes;
    RAISE NOTICE 'Restaurantes con suscripción activa: %', (v_total_restaurantes - v_restaurantes_sin_suscripcion);
    RAISE NOTICE 'Restaurantes sin suscripción: %', v_restaurantes_sin_suscripcion;
END $$;

-- =====================================================
-- COMENTARIOS FINALES
-- =====================================================

COMMENT ON TABLE planes_unificados IS 'Tabla unificada de planes - Migrada desde planes_pos y planes';
COMMENT ON TABLE suscripciones_activas IS 'Suscripciones activas - Migrada desde suscripciones';
COMMENT ON TABLE contadores_uso IS 'Contadores de uso - Migrada desde uso_recursos';
COMMENT ON TABLE alertas_limites IS 'Alertas de límites - Migrada desde alertas_limites';
COMMENT ON TABLE auditoria_planes IS 'Auditoría de planes - Migrada desde auditoria_planes';
