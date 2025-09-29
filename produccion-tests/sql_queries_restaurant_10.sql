-- Consultas SQL para verificar configuración del restaurante ID 10
-- Ejecutar estas consultas en la base de datos de producción

-- ========================================
-- 1. VERIFICACIÓN BÁSICA DEL RESTAURANTE
-- ========================================
SELECT 
    id_restaurante,
    nombre,
    ciudad,
    direccion,
    telefono,
    email,
    activo,
    created_at,
    updated_at
FROM restaurantes 
WHERE id_restaurante = 10;

-- ========================================
-- 2. VERIFICACIÓN DE SUSCRIPCIONES ACTIVAS
-- ========================================
SELECT 
    s.id_suscripcion,
    s.id_restaurante,
    s.id_plan,
    s.estado,
    s.fecha_inicio,
    s.fecha_fin,
    s.precio_pagado,
    s.created_at,
    s.updated_at,
    p.nombre as plan_nombre,
    p.tipo as plan_tipo,
    p.precio as plan_precio,
    p.max_sucursales,
    p.max_usuarios,
    p.max_productos,
    p.max_transacciones_mes,
    p.almacenamiento_gb
FROM suscripciones s
JOIN planes p ON s.id_plan = p.id_plan
WHERE s.id_restaurante = 10
ORDER BY s.created_at DESC;

-- ========================================
-- 3. VERIFICACIÓN DE TODOS LOS PLANES DISPONIBLES
-- ========================================
SELECT 
    id_plan,
    nombre,
    descripcion,
    tipo,
    precio,
    max_sucursales,
    max_usuarios,
    max_productos,
    max_transacciones_mes,
    almacenamiento_gb,
    activo
FROM planes
ORDER BY precio ASC;

-- ========================================
-- 4. VERIFICACIÓN DE SUSCRIPCIONES DEL RESTAURANTE (TODAS)
-- ========================================
SELECT 
    s.*,
    p.nombre as plan_nombre,
    p.tipo as plan_tipo,
    CASE 
        WHEN s.fecha_fin < CURRENT_DATE THEN 'EXPIRO'
        WHEN s.estado = 'activa' THEN 'ACTIVA'
        ELSE 'INACTIVA'
    END as estado_real
FROM suscripciones s
LEFT JOIN planes p ON s.id_plan = p.id_plan
WHERE s.id_restaurante = 10
ORDER BY s.created_at DESC;

-- ========================================
-- 5. VERIFICACIÓN DE USUARIOS DEL RESTAURANTE
-- ========================================
SELECT 
    v.id_vendedor,
    v.nombre,
    v.username,
    v.email,
    v.rol,
    v.id_restaurante,
    v.id_sucursal,
    v.activo,
    v.created_at,
    r.nombre as restaurante_nombre,
    s.nombre as sucursal_nombre
FROM vendedores v
LEFT JOIN restaurantes r ON v.id_restaurante = r.id_restaurante
LEFT JOIN sucursales s ON v.id_sucursal = s.id_sucursal
WHERE v.id_restaurante = 10;

-- ========================================
-- 6. VERIFICACIÓN DE CONTADORES DE USO ACTUALES
-- ========================================
SELECT 
    cu.recurso,
    cu.uso_actual,
    cu.limite_plan,
    ROUND((cu.uso_actual::DECIMAL / NULLIF(cu.limite_plan, 0)) * 100, 2) as porcentaje_uso,
    cu.fecha_medicion,
    p.nombre as plan_nombre,
    p.tipo as plan_tipo
FROM contadores_uso cu
JOIN planes p ON cu.id_plan = p.id_plan
WHERE cu.id_restaurante = 10
ORDER BY cu.recurso;

-- ========================================
-- 7. VERIFICACIÓN DE ESTADO GENERAL DEL SISTEMA
-- ========================================
WITH restaurant_summary AS (
    SELECT 
        r.id_restaurante,
        r.nombre as restaurante_nombre,
        s.estado as suscripcion_estado,
        s.fecha_inicio,
        s.fecha_fin,
        p.nombre as plan_nombre,
        p.tipo as plan_tipo,
        p.precio as plan_precio,
        CASE 
            WHEN p.tipo = 'enterprise' THEN 'ENTERPRISE'
            WHEN p.tipo = 'professional' THEN 'PROFESIONAL'
            WHEN p.tipo = 'basic' THEN 'BÁSICO'
            ELSE 'DESCONOCIDO'
        END as nivel_plan,
        (SELECT COUNT(*) FROM vendedores WHERE id_restaurante = r.id_restaurante AND activo = true) as usuarios_activos,
        (SELECT COUNT(*) FROM sucursales WHERE id_restaurante = r.id_restaurante AND activo = true) as sucursales_activas,
        (SELECT COUNT(*) FROM productos WHERE id_restaurante = r.id_restaurante AND activo = true) as productos_activos
    FROM restaurantes r
    LEFT JOIN suscripciones s ON r.id_restaurante = s.id_restaurante AND s.estado = 'activa'
    LEFT JOIN planes p ON s.id_plan = p.id_plan
    WHERE r.id_restaurante = 10
)
SELECT 
    restaurante_nombre,
    nivel_plan,
    suscripcion_estado,
    fecha_inicio,
    fecha_fin,
    plan_precio,
    usuarios_activos,
    sucursales_activas,
    productos_activos,
    CASE 
        WHEN suscripcion_estado = 'activa' AND fecha_fin > CURRENT_DATE THEN '✅ ACTIVO'
        WHEN suscripcion_estado = 'activa' AND fecha_fin <= CURRENT_DATE THEN '⚠️ EXPIRÓ'
        WHEN suscripcion_estado IS NULL THEN '❌ SIN SUSCRIPCIÓN'
        ELSE '❌ INACTIVO'
    END as estado_sistema
FROM restaurant_summary;

-- ========================================
-- 8. VERIFICACIÓN DE PROBLEMAS ESPECÍFICOS DEL PLAN
-- ========================================

-- Verificar si hay múltiples suscripciones causando conflicto
SELECT 
    COUNT(*) as total_suscripciones,
    COUNT(CASE WHEN estado = 'activa' THEN 1 END) as suscripciones_activas,
    COUNT(CASE WHEN fecha_fin > CURRENT_DATE THEN 1 END) as suscripciones_vigentes
FROM suscripciones 
WHERE id_restaurante = 10;

-- Verificar si el plan cambió recientemente
SELECT 
    s.created_at as fecha_suscripcion,
    p.nombre as plan_actual,
    LAG(p.nombre) OVER (ORDER BY s.created_at) as plan_anterior,
    CASE 
        WHEN LAG(p.nombre) OVER (ORDER BY s.created_at) IS NOT NULL THEN 'CAMBIÓ DE PLAN'
        ELSE 'PRIMERA SUSCRIPCIÓN'
    END as cambio_plan
FROM suscripciones s
JOIN planes p ON s.id_plan = p.id_plan
WHERE s.id_restaurante = 10
ORDER BY s.created_at DESC;

-- Verificar límites vs uso actual
SELECT 
    cu.recurso,
    cu.uso_actual,
    cu.limite_plan,
    CASE 
        WHEN cu.uso_actual >= cu.limite_plan THEN '⚠️ LÍMITE ALCANZADO'
        WHEN (cu.uso_actual::DECIMAL / NULLIF(cu.limite_plan, 0)) > 0.8 THEN '🟡 CERCA DEL LÍMITE'
        ELSE '✅ DENTRO DEL LÍMITE'
    END as estado_limite,
    p.tipo as plan_tipo
FROM contadores_uso cu
JOIN planes p ON cu.id_plan = p.id_plan
WHERE cu.id_restaurante = 10;

-- ========================================
-- 9. CONSULTA DE DIAGNÓSTICO FINAL
-- ========================================
SELECT 
    'RESUMEN DE DIAGNÓSTICO' as titulo,
    
    CASE 
        WHEN s.estado = 'activa' AND p.tipo = 'enterprise' AND s.fecha_fin > CURRENT_DATE 
        THEN '✅ PLAN ENTERPRISE ACTIVO - SIN PROBLEMAS DE PLAN'
        
        WHEN s.estado = 'activa' AND p.tipo = 'basic' 
        THEN '⚠️ PLAN BÁSICO ACTIVO - RESTRICCIONES ESPERADAS'
        
        WHEN s.estado = 'activa' AND p.tipo = 'enterprise' AND s.fecha_fin <= CURRENT_DATE
        THEN '🚨 PLAN ENTERPRISE EXPIRADO - ACTUALIZAR SUSCRIPCIÓN'
        
        WHEN s.estado IS NULL 
        THEN '❌ SIN SUSCRIPCIÓN VÁLIDA - ASIGNAR PLAN'
        
        ELSE '⚠️ ESTADO CONFUSO - REVISAR MANUALMENTE'
    END as diagnostico,
    
    r.nombre as restaurante,
    p.nombre as plan,
    p.tipo as tipo_plan,
    s.estado as estado_suscripcion,
    s.fecha_fin,
    
    CASE 
        WHEN s.fecha_fin > CURRENT_DATE THEN 'VÁLIDA'
        ELSE 'EXPIRÓ'
    END as vigencia
    
FROM restaurantes r
LEFT JOIN suscripciones s ON r.id_restaurante = s.id_restaurante AND s.estado = 'activa'
LEFT JOIN planes p ON s.id_plan = p.id_plan
WHERE r.id_restaurante = 10;

-- ========================================
-- 10. VERIFICACIÓN ESPECÍFICA PARA FRONTEND
-- ========================================

-- Simular exactamente lo que debería devolver la API del plan
SELECT 
    json_build_object(
        'restaurante', json_build_object(
            'id', r.id_restaurante,
            'nombre', r.nombre,
            'ciudad', r.ciudad
        ),
        'plan', json_build_object(
            'id_plan', p.id_plan,
            'nombre', p.nombre,
            'tipo', p.tipo,
            'precio', p.precio
        ),
        'suscripcion', json_build_object(
            'estado', s.estado,
            'fecha_inicio', s.fecha_inicio,
            'fecha_fin', s.fecha_fin
        )
    ) as datos_frontend_api
FROM restaurantes r
LEFT JOIN suscripciones s ON r.id_restaurante = s.id_restaurante AND s.estado = 'activa'
LEFT JOIN planes p ON s.id_plan = p.id_plan
WHERE r.id_restaurante = 10;

-- ========================================
-- NOTAS PARA EL DESARROLLADOR:
-- ========================================
/*
ESTAS CONSULTAS DEBEN EJECUTARSE EN LA BASE DE DATOS DE PRODUCCIÓN
PARA VERIFICAR EL ESTADO REAL DEL RESTAURANTE ID 10.

RESULTADOS ESPERADOS:
- Si el plan es Enterprise pero hay restricciones básicas:
  → Problema en frontend/backend, no en la BD
  
- Si el plan es Básico pero el usuario espera Enterprise:
  → Proceder a actualizar la suscripción
  
- Si hay múltiples suscripciones:
  → Limpiar suscripciones duplicadas/inactivas
  
- Si la suscripción expiró:
  → Renovar o reactivar la suscripción

COMANDOS DE EJECUCIÓN:
1. Ejecutar todas las consultas secuencialmente
2. Analizar resultados especialmente la consulta #9 (Diagnóstico Final)
3. Comparar resultado con el comportamiento del frontend
4. Implementar correcciones según el diagnóstico encontrado
*/
