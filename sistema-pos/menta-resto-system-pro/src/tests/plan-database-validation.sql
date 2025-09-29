-- =====================================================
-- SCRIPT DE VALIDACIÓN DE BASE DE DATOS - SISTEMA DE PLANES
-- =====================================================
-- Este script valida que todas las tablas, funciones y triggers
-- del sistema de planes estén implementados correctamente

-- =====================================================
-- 1. VERIFICAR ESTRUCTURA DE TABLAS
-- =====================================================

-- Verificar tabla de planes
SELECT 
    'planes' as tabla,
    COUNT(*) as registros,
    CASE 
        WHEN COUNT(*) >= 4 THEN '✅ OK'
        ELSE '❌ FALTA'
    END as estado
FROM planes;

-- Verificar tabla de suscripciones
SELECT 
    'suscripciones' as tabla,
    COUNT(*) as registros,
    CASE 
        WHEN COUNT(*) >= 0 THEN '✅ OK'
        ELSE '❌ FALTA'
    END as estado
FROM suscripciones;

-- Verificar tabla de uso de recursos
SELECT 
    'uso_recursos' as tabla,
    COUNT(*) as registros,
    CASE 
        WHEN COUNT(*) >= 0 THEN '✅ OK'
        ELSE '❌ FALTA'
    END as estado
FROM uso_recursos;

-- Verificar tabla de alertas de límite
SELECT 
    'alertas_limite' as tabla,
    COUNT(*) as registros,
    CASE 
        WHEN COUNT(*) >= 0 THEN '✅ OK'
        ELSE '❌ FALTA'
    END as estado
FROM alertas_limite;

-- Verificar tabla de auditoría de cambios
SELECT 
    'auditoria_cambios_plan' as tabla,
    COUNT(*) as registros,
    CASE 
        WHEN COUNT(*) >= 0 THEN '✅ OK'
        ELSE '❌ FALTA'
    END as estado
FROM auditoria_cambios_plan;

-- Verificar tabla de historial de uso
SELECT 
    'historial_uso_mensual' as tabla,
    COUNT(*) as registros,
    CASE 
        WHEN COUNT(*) >= 0 THEN '✅ OK'
        ELSE '❌ FALTA'
    END as estado
FROM historial_uso_mensual;

-- =====================================================
-- 2. VERIFICAR DATOS DE PLANES
-- =====================================================

-- Verificar que existen los 4 planes básicos
SELECT 
    id,
    nombre,
    precio_mensual,
    CASE 
        WHEN nombre IN ('Básico', 'Profesional', 'Avanzado', 'Enterprise') THEN '✅ OK'
        ELSE '❌ NOMBRE INCORRECTO'
    END as estado
FROM planes
ORDER BY id;

-- Verificar funcionalidades de cada plan
SELECT 
    p.nombre as plan,
    p.funcionalidades->>'incluye_pos' as incluye_pos,
    p.funcionalidades->>'incluye_inventario_basico' as incluye_inventario_basico,
    p.funcionalidades->>'incluye_inventario_avanzado' as incluye_inventario_avanzado,
    p.funcionalidades->>'incluye_egresos' as incluye_egresos,
    p.funcionalidades->>'incluye_egresos_avanzados' as incluye_egresos_avanzados,
    p.funcionalidades->>'incluye_reportes_avanzados' as incluye_reportes_avanzados
FROM planes p
ORDER BY p.id;

-- Verificar límites de cada plan
SELECT 
    p.nombre as plan,
    p.limites->>'max_sucursales' as max_sucursales,
    p.limites->>'max_usuarios' as max_usuarios,
    p.limites->>'max_productos' as max_productos,
    p.limites->>'max_transacciones_mes' as max_transacciones_mes,
    p.limites->>'almacenamiento_gb' as almacenamiento_gb
FROM planes p
ORDER BY p.id;

-- =====================================================
-- 3. VERIFICAR FUNCIONES DE BASE DE DATOS
-- =====================================================

-- Verificar función de validación de límites
SELECT 
    routine_name,
    routine_type,
    CASE 
        WHEN routine_name = 'validar_limite_plan' THEN '✅ OK'
        ELSE '❌ FALTA'
    END as estado
FROM information_schema.routines 
WHERE routine_name = 'validar_limite_plan';

-- Verificar función de validación de funcionalidades
SELECT 
    routine_name,
    routine_type,
    CASE 
        WHEN routine_name = 'validar_funcionalidad_plan' THEN '✅ OK'
        ELSE '❌ FALTA'
    END as estado
FROM information_schema.routines 
WHERE routine_name = 'validar_funcionalidad_plan';

-- Verificar función de actualización de contadores
SELECT 
    routine_name,
    routine_type,
    CASE 
        WHEN routine_name = 'actualizar_contador_uso' THEN '✅ OK'
        ELSE '❌ FALTA'
    END as estado
FROM information_schema.routines 
WHERE routine_name = 'actualizar_contador_uso';

-- Verificar función de generación de alertas
SELECT 
    routine_name,
    routine_type,
    CASE 
        WHEN routine_name = 'generar_alerta_limite' THEN '✅ OK'
        ELSE '❌ FALTA'
    END as estado
FROM information_schema.routines 
WHERE routine_name = 'generar_alerta_limite';

-- =====================================================
-- 4. VERIFICAR TRIGGERS
-- =====================================================

-- Verificar trigger de actualización de contadores
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    CASE 
        WHEN trigger_name = 'trigger_actualizar_contador_uso' THEN '✅ OK'
        ELSE '❌ FALTA'
    END as estado
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_actualizar_contador_uso';

-- Verificar trigger de validación de límites
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    CASE 
        WHEN trigger_name = 'trigger_validar_limite_plan' THEN '✅ OK'
        ELSE '❌ FALTA'
    END as estado
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_validar_limite_plan';

-- Verificar trigger de generación de alertas
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    CASE 
        WHEN trigger_name = 'trigger_generar_alerta_limite' THEN '✅ OK'
        ELSE '❌ FALTA'
    END as estado
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_generar_alerta_limite';

-- Verificar trigger de auditoría
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    CASE 
        WHEN trigger_name = 'trigger_auditoria_cambios_plan' THEN '✅ OK'
        ELSE '❌ FALTA'
    END as estado
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_auditoria_cambios_plan';

-- =====================================================
-- 5. VERIFICAR ÍNDICES
-- =====================================================

-- Verificar índices de la tabla planes
SELECT 
    indexname,
    tablename,
    CASE 
        WHEN indexname LIKE '%planes%' THEN '✅ OK'
        ELSE '❌ FALTA'
    END as estado
FROM pg_indexes 
WHERE tablename = 'planes';

-- Verificar índices de la tabla suscripciones
SELECT 
    indexname,
    tablename,
    CASE 
        WHEN indexname LIKE '%suscripciones%' THEN '✅ OK'
        ELSE '❌ FALTA'
    END as estado
FROM pg_indexes 
WHERE tablename = 'suscripciones';

-- Verificar índices de la tabla uso_recursos
SELECT 
    indexname,
    tablename,
    CASE 
        WHEN indexname LIKE '%uso_recursos%' THEN '✅ OK'
        ELSE '❌ FALTA'
    END as estado
FROM pg_indexes 
WHERE tablename = 'uso_recursos';

-- Verificar índices de la tabla alertas_limite
SELECT 
    indexname,
    tablename,
    CASE 
        WHEN indexname LIKE '%alertas_limite%' THEN '✅ OK'
        ELSE '❌ FALTA'
    END as estado
FROM pg_indexes 
WHERE tablename = 'alertas_limite';

-- =====================================================
-- 6. PRUEBAS DE FUNCIONALIDAD
-- =====================================================

-- Probar función de validación de límites
SELECT 
    'Prueba validación límites' as prueba,
    validar_limite_plan(1, 'max_productos', 10) as resultado,
    CASE 
        WHEN validar_limite_plan(1, 'max_productos', 10) IS NOT NULL THEN '✅ OK'
        ELSE '❌ FALLA'
    END as estado;

-- Probar función de validación de funcionalidades
SELECT 
    'Prueba validación funcionalidades' as prueba,
    validar_funcionalidad_plan(1, 'incluye_inventario_basico') as resultado,
    CASE 
        WHEN validar_funcionalidad_plan(1, 'incluye_inventario_basico') IS NOT NULL THEN '✅ OK'
        ELSE '❌ FALLA'
    END as estado;

-- =====================================================
-- 7. VERIFICAR RESTRICCIONES DE INTEGRIDAD
-- =====================================================

-- Verificar restricciones de la tabla planes
SELECT 
    constraint_name,
    constraint_type,
    CASE 
        WHEN constraint_name IS NOT NULL THEN '✅ OK'
        ELSE '❌ FALTA'
    END as estado
FROM information_schema.table_constraints 
WHERE table_name = 'planes';

-- Verificar restricciones de la tabla suscripciones
SELECT 
    constraint_name,
    constraint_type,
    CASE 
        WHEN constraint_name IS NOT NULL THEN '✅ OK'
        ELSE '❌ FALTA'
    END as estado
FROM information_schema.table_constraints 
WHERE table_name = 'suscripciones';

-- Verificar restricciones de la tabla uso_recursos
SELECT 
    constraint_name,
    constraint_type,
    CASE 
        WHEN constraint_name IS NOT NULL THEN '✅ OK'
        ELSE '❌ FALTA'
    END as estado
FROM information_schema.table_constraints 
WHERE table_name = 'uso_recursos';

-- Verificar restricciones de la tabla alertas_limite
SELECT 
    constraint_name,
    constraint_type,
    CASE 
        WHEN constraint_name IS NOT NULL THEN '✅ OK'
        ELSE '❌ FALTA'
    END as estado
FROM information_schema.table_constraints 
WHERE table_name = 'alertas_limite';

-- =====================================================
-- 8. RESUMEN DE VALIDACIÓN
-- =====================================================

-- Contar total de elementos verificados
SELECT 
    'TABLAS' as tipo,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE table_name IN ('planes', 'suscripciones', 'uso_recursos', 'alertas_limite', 'auditoria_cambios_plan', 'historial_uso_mensual')) as encontradas
FROM information_schema.tables 
WHERE table_schema = 'public'
UNION ALL
SELECT 
    'FUNCIONES' as tipo,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE routine_name IN ('validar_limite_plan', 'validar_funcionalidad_plan', 'actualizar_contador_uso', 'generar_alerta_limite')) as encontradas
FROM information_schema.routines 
WHERE routine_schema = 'public'
UNION ALL
SELECT 
    'TRIGGERS' as tipo,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE trigger_name IN ('trigger_actualizar_contador_uso', 'trigger_validar_limite_plan', 'trigger_generar_alerta_limite', 'trigger_auditoria_cambios_plan')) as encontradas
FROM information_schema.triggers 
WHERE trigger_schema = 'public';

-- =====================================================
-- 9. INSTRUCCIONES DE USO
-- =====================================================

/*
INSTRUCCIONES PARA EJECUTAR ESTE SCRIPT:

1. Conectar a la base de datos PostgreSQL:
   psql -h localhost -U usuario -d nombre_base_datos

2. Ejecutar el script:
   \i plan-database-validation.sql

3. Revisar los resultados:
   - ✅ OK = Elemento implementado correctamente
   - ❌ FALTA = Elemento no implementado o con problemas

4. Si hay elementos faltantes, ejecutar:
   \i sistema_planes_unificado.sql
   \i migracion_planes_existentes.sql
   \i triggers_automaticos_planes.sql

5. Verificar que todas las pruebas pasen antes de continuar

NOTAS:
- Este script es de solo lectura, no modifica datos
- Ejecutar en un entorno de pruebas primero
- Verificar permisos de base de datos
- Revisar logs de PostgreSQL para errores
*/
