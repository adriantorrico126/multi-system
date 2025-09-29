-- =====================================================
-- SCRIPT DE EJECUCIÓN COMPLETA DEL SISTEMA DE PLANES
-- Ejecutar en orden para implementar el sistema completo
-- =====================================================

-- Verificar que estamos en la base de datos correcta
DO $$
BEGIN
    IF current_database() != 'sistempos' THEN
        RAISE EXCEPTION 'Este script debe ejecutarse en la base de datos "sistempos"';
    END IF;
END $$;

-- =====================================================
-- PASO 1: CREAR ESTRUCTURA UNIFICADA
-- =====================================================

\echo 'PASO 1: Creando estructura unificada de planes...'

-- Ejecutar script de estructura unificada
\i sistema_planes_unificado.sql

\echo '✅ Estructura unificada creada exitosamente'

-- =====================================================
-- PASO 2: MIGRAR DATOS EXISTENTES
-- =====================================================

\echo 'PASO 2: Migrando datos existentes...'

-- Ejecutar script de migración
\i migracion_planes_existentes.sql

\echo '✅ Datos existentes migrados exitosamente'

-- =====================================================
-- PASO 3: INSTALAR TRIGGERS AUTOMÁTICOS
-- =====================================================

\echo 'PASO 3: Instalando triggers automáticos...'

-- Ejecutar script de triggers
\i triggers_automaticos_planes.sql

\echo '✅ Triggers automáticos instalados exitosamente'

-- =====================================================
-- PASO 4: VERIFICACIÓN Y VALIDACIÓN
-- =====================================================

\echo 'PASO 4: Verificando instalación...'

-- Verificar que todas las tablas existen
DO $$
DECLARE
    v_tablas_faltantes TEXT[] := ARRAY[]::TEXT[];
    v_tabla TEXT;
    v_tablas_requeridas TEXT[] := ARRAY[
        'planes_unificados',
        'suscripciones_activas', 
        'contadores_uso',
        'alertas_limites',
        'auditoria_planes',
        'historial_uso'
    ];
BEGIN
    FOREACH v_tabla IN ARRAY v_tablas_requeridas
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = v_tabla 
            AND table_schema = 'public'
        ) THEN
            v_tablas_faltantes := array_append(v_tablas_faltantes, v_tabla);
        END IF;
    END LOOP;
    
    IF array_length(v_tablas_faltantes, 1) > 0 THEN
        RAISE EXCEPTION 'Tablas faltantes: %', array_to_string(v_tablas_faltantes, ', ');
    END IF;
    
    RAISE NOTICE '✅ Todas las tablas requeridas existen';
END $$;

-- Verificar que todas las funciones existen
DO $$
DECLARE
    v_funciones_faltantes TEXT[] := ARRAY[]::TEXT[];
    v_funcion TEXT;
    v_funciones_requeridas TEXT[] := ARRAY[
        'validar_limite_plan',
        'verificar_funcionalidad_plan',
        'actualizar_contador_sucursales',
        'actualizar_contador_usuarios',
        'actualizar_contador_productos',
        'actualizar_contador_transacciones',
        'validar_limites_sucursales',
        'validar_limites_usuarios',
        'validar_limites_productos',
        'validar_limites_transacciones',
        'generar_alertas_limites',
        'auditar_cambio_plan'
    ];
BEGIN
    FOREACH v_funcion IN ARRAY v_funciones_requeridas
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.routines 
            WHERE routine_name = v_funcion 
            AND routine_schema = 'public'
        ) THEN
            v_funciones_faltantes := array_append(v_funciones_faltantes, v_funcion);
        END IF;
    END LOOP;
    
    IF array_length(v_funciones_faltantes, 1) > 0 THEN
        RAISE EXCEPTION 'Funciones faltantes: %', array_to_string(v_funciones_faltantes, ', ');
    END IF;
    
    RAISE NOTICE '✅ Todas las funciones requeridas existen';
END $$;

-- Verificar que todos los triggers existen
DO $$
DECLARE
    v_triggers_faltantes TEXT[] := ARRAY[]::TEXT[];
    v_trigger TEXT;
    v_triggers_requeridos TEXT[] := ARRAY[
        'trigger_actualizar_contador_sucursales',
        'trigger_actualizar_contador_usuarios',
        'trigger_actualizar_contador_productos',
        'trigger_actualizar_contador_transacciones',
        'trigger_validar_limites_sucursales',
        'trigger_validar_limites_usuarios',
        'trigger_validar_limites_productos',
        'trigger_validar_limites_transacciones',
        'trigger_generar_alertas_limites',
        'trigger_auditar_cambio_plan'
    ];
BEGIN
    FOREACH v_trigger IN ARRAY v_triggers_requeridos
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.triggers 
            WHERE trigger_name = v_trigger 
            AND event_object_schema = 'public'
        ) THEN
            v_triggers_faltantes := array_append(v_triggers_faltantes, v_trigger);
        END IF;
    END LOOP;
    
    IF array_length(v_triggers_faltantes, 1) > 0 THEN
        RAISE EXCEPTION 'Triggers faltantes: %', array_to_string(v_triggers_faltantes, ', ');
    END IF;
    
    RAISE NOTICE '✅ Todos los triggers requeridos existen';
END $$;

-- =====================================================
-- PASO 5: PRUEBAS DE FUNCIONAMIENTO
-- =====================================================

\echo 'PASO 5: Ejecutando pruebas de funcionamiento...'

-- Prueba 1: Verificar que los planes se crearon correctamente
DO $$
DECLARE
    v_count_planes INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count_planes FROM planes_unificados WHERE activo = true;
    
    IF v_count_planes < 4 THEN
        RAISE EXCEPTION 'Se esperaban al menos 4 planes activos, se encontraron %', v_count_planes;
    END IF;
    
    RAISE NOTICE '✅ Planes creados correctamente: % planes activos', v_count_planes;
END $$;

-- Prueba 2: Verificar que las suscripciones se crearon
DO $$
DECLARE
    v_count_suscripciones INTEGER;
    v_count_restaurantes INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count_suscripciones FROM suscripciones_activas WHERE estado = 'activa';
    SELECT COUNT(*) INTO v_count_restaurantes FROM restaurantes;
    
    IF v_count_suscripciones = 0 THEN
        RAISE EXCEPTION 'No se encontraron suscripciones activas';
    END IF;
    
    RAISE NOTICE '✅ Suscripciones creadas: % suscripciones activas de % restaurantes', 
        v_count_suscripciones, v_count_restaurantes;
END $$;

-- Prueba 3: Verificar que los contadores se crearon
DO $$
DECLARE
    v_count_contadores INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count_contadores FROM contadores_uso;
    
    IF v_count_contadores = 0 THEN
        RAISE EXCEPTION 'No se encontraron contadores de uso';
    END IF;
    
    RAISE NOTICE '✅ Contadores creados: % contadores de uso', v_count_contadores;
END $$;

-- Prueba 4: Probar función de validación de límites
DO $$
DECLARE
    v_resultado BOOLEAN;
    v_id_restaurante INTEGER;
BEGIN
    -- Obtener un restaurante con suscripción activa
    SELECT sa.id_restaurante INTO v_id_restaurante
    FROM suscripciones_activas sa
    WHERE sa.estado = 'activa'
    LIMIT 1;
    
    IF v_id_restaurante IS NULL THEN
        RAISE EXCEPTION 'No se encontró un restaurante con suscripción activa para probar';
    END IF;
    
    -- Probar validación de límites
    SELECT validar_limite_plan(v_id_restaurante, 'sucursales', 1) INTO v_resultado;
    
    IF v_resultado IS NULL THEN
        RAISE EXCEPTION 'La función validar_limite_plan no retornó un resultado válido';
    END IF;
    
    RAISE NOTICE '✅ Función de validación de límites funciona correctamente';
END $$;

-- Prueba 5: Probar función de verificación de funcionalidades
DO $$
DECLARE
    v_resultado BOOLEAN;
    v_id_restaurante INTEGER;
BEGIN
    -- Obtener un restaurante con suscripción activa
    SELECT sa.id_restaurante INTO v_id_restaurante
    FROM suscripciones_activas sa
    WHERE sa.estado = 'activa'
    LIMIT 1;
    
    IF v_id_restaurante IS NULL THEN
        RAISE EXCEPTION 'No se encontró un restaurante con suscripción activa para probar';
    END IF;
    
    -- Probar verificación de funcionalidades
    SELECT verificar_funcionalidad_plan(v_id_restaurante, 'pos') INTO v_resultado;
    
    IF v_resultado IS NULL THEN
        RAISE EXCEPTION 'La función verificar_funcionalidad_plan no retornó un resultado válido';
    END IF;
    
    RAISE NOTICE '✅ Función de verificación de funcionalidades funciona correctamente';
END $$;

-- =====================================================
-- PASO 6: REPORTE FINAL
-- =====================================================

\echo 'PASO 6: Generando reporte final...'

DO $$
DECLARE
    v_total_planes INTEGER;
    v_total_suscripciones INTEGER;
    v_total_contadores INTEGER;
    v_total_alertas INTEGER;
    v_total_auditoria INTEGER;
    v_restaurantes_sin_suscripcion INTEGER;
BEGIN
    -- Contar registros en cada tabla
    SELECT COUNT(*) INTO v_total_planes FROM planes_unificados WHERE activo = true;
    SELECT COUNT(*) INTO v_total_suscripciones FROM suscripciones_activas WHERE estado = 'activa';
    SELECT COUNT(*) INTO v_total_contadores FROM contadores_uso;
    SELECT COUNT(*) INTO v_total_alertas FROM alertas_limites;
    SELECT COUNT(*) INTO v_total_auditoria FROM auditoria_planes;
    
    -- Contar restaurantes sin suscripción
    SELECT COUNT(*) INTO v_restaurantes_sin_suscripcion
    FROM restaurantes r
    WHERE NOT EXISTS (
        SELECT 1 FROM suscripciones_activas sa 
        WHERE sa.id_restaurante = r.id_restaurante 
        AND sa.estado = 'activa'
    );
    
    -- Mostrar reporte
    RAISE NOTICE '';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'REPORTE DE INSTALACIÓN DEL SISTEMA DE PLANES';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'Planes activos: %', v_total_planes;
    RAISE NOTICE 'Suscripciones activas: %', v_total_suscripciones;
    RAISE NOTICE 'Contadores de uso: %', v_total_contadores;
    RAISE NOTICE 'Alertas de límites: %', v_total_alertas;
    RAISE NOTICE 'Registros de auditoría: %', v_total_auditoria;
    RAISE NOTICE 'Restaurantes sin suscripción: %', v_restaurantes_sin_suscripcion;
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'INSTALACIÓN COMPLETADA EXITOSAMENTE';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE '';
END $$;

-- =====================================================
-- INSTRUCCIONES POST-INSTALACIÓN
-- =====================================================

\echo 'INSTRUCCIONES POST-INSTALACIÓN:'
\echo '1. Verificar que todos los restaurantes tengan suscripción activa'
\echo '2. Configurar notificaciones de alertas (email/SMS)'
\echo '3. Probar el sistema con operaciones reales'
\echo '4. Monitorear los logs de alertas'
\echo '5. Configurar backups automáticos de las nuevas tablas'
\echo ''
\echo 'El sistema de planes está listo para usar.'

