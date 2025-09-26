-- =====================================================
-- SCRIPT PARA CREAR SUSCRIPCIONES PARA RESTAURANTES EXISTENTES
-- =====================================================

-- Verificar restaurantes sin suscripción activa
SELECT 
    r.id_restaurante,
    r.nombre,
    s.estado as suscripcion_estado
FROM restaurantes r
LEFT JOIN suscripciones s ON r.id_restaurante = s.id_restaurante AND s.estado = 'activa'
WHERE s.id_suscripcion IS NULL;

-- Crear suscripciones para restaurantes sin suscripción activa
INSERT INTO suscripciones (
    id_restaurante, 
    id_plan, 
    fecha_inicio, 
    fecha_fin, 
    estado,
    metodo_pago,
    auto_renovacion,
    notificaciones_email,
    created_at,
    updated_at
)
SELECT 
    r.id_restaurante,
    1 as id_plan, -- Plan básico por defecto
    NOW() as fecha_inicio,
    NOW() + INTERVAL '1 month' as fecha_fin,
    'activa' as estado,
    'mensual' as metodo_pago,
    true as auto_renovacion,
    true as notificaciones_email,
    NOW() as created_at,
    NOW() as updated_at
FROM restaurantes r
LEFT JOIN suscripciones s ON r.id_restaurante = s.id_restaurante AND s.estado = 'activa'
WHERE s.id_suscripcion IS NULL;

-- Verificar que se crearon las suscripciones
SELECT 
    r.id_restaurante,
    r.nombre,
    s.estado as suscripcion_estado,
    p.nombre as plan_nombre,
    p.precio_mensual
FROM restaurantes r
LEFT JOIN suscripciones s ON r.id_restaurante = s.id_restaurante AND s.estado = 'activa'
LEFT JOIN planes p ON s.id_plan = p.id_plan
ORDER BY r.id_restaurante;
