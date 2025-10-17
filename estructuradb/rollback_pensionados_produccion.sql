-- =====================================================
-- ROLLBACK SISTEMA DE PENSIONADOS
-- =====================================================
-- Sistema: SITEMM POS
-- Fecha: 2025-10-17
-- Descripción: Script para revertir el deploy del sistema de pensionados
-- =====================================================

-- ⚠️ ADVERTENCIA: Este script ELIMINARÁ todas las tablas del sistema de pensionados
-- ⚠️ Asegúrate de tener un backup antes de ejecutar este script

\echo '================================================='
\echo 'INICIANDO ROLLBACK DEL SISTEMA DE PENSIONADOS'
\echo '================================================='
\echo ''
\echo '⚠️  ADVERTENCIA: Este proceso eliminará las tablas del sistema'
\echo '⚠️  Presiona Ctrl+C ahora si NO deseas continuar'
\echo ''

-- Esperar 5 segundos
SELECT pg_sleep(5);

\echo 'Continuando con el rollback...'
\echo ''

-- =====================================================
-- PASO 1: ELIMINAR TRIGGERS
-- =====================================================

\echo 'Paso 1: Eliminando triggers...'

DROP TRIGGER IF EXISTS trigger_pensionados_updated_at ON pensionados;
DROP TRIGGER IF EXISTS trigger_prefacturas_pensionados_updated_at ON prefacturas_pensionados;
DROP TRIGGER IF EXISTS trigger_consumo_estadisticas ON consumo_pensionados;

\echo '  ✓ Triggers eliminados'
\echo ''

-- =====================================================
-- PASO 2: ELIMINAR FUNCIONES
-- =====================================================

\echo 'Paso 2: Eliminando funciones...'

DROP FUNCTION IF EXISTS update_pensionados_updated_at() CASCADE;
DROP FUNCTION IF EXISTS calcular_dias_consumo(INTEGER) CASCADE;
DROP FUNCTION IF EXISTS calcular_total_consumido(INTEGER) CASCADE;
DROP FUNCTION IF EXISTS actualizar_estadisticas_pensionado(INTEGER) CASCADE;
DROP FUNCTION IF EXISTS trigger_actualizar_estadisticas_consumo() CASCADE;

\echo '  ✓ Funciones eliminadas'
\echo ''

-- =====================================================
-- PASO 3: RESTAURAR DATOS DESDE BACKUP (SI EXISTE)
-- =====================================================

\echo 'Paso 3: Restaurando datos desde backup (si existe)...'

DO $$
BEGIN
    -- Restaurar pensionados
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pensionados_backup_pre_deploy') THEN
        DROP TABLE IF EXISTS pensionados CASCADE;
        ALTER TABLE pensionados_backup_pre_deploy RENAME TO pensionados;
        RAISE NOTICE '  ✓ Tabla pensionados restaurada desde backup';
    ELSE
        RAISE NOTICE '  ℹ No existe backup de pensionados';
    END IF;
    
    -- Restaurar consumo_pensionados
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'consumo_pensionados_backup_pre_deploy') THEN
        DROP TABLE IF EXISTS consumo_pensionados CASCADE;
        ALTER TABLE consumo_pensionados_backup_pre_deploy RENAME TO consumo_pensionados;
        RAISE NOTICE '  ✓ Tabla consumo_pensionados restaurada desde backup';
    ELSE
        RAISE NOTICE '  ℹ No existe backup de consumo_pensionados';
    END IF;
    
    -- Restaurar prefacturas_pensionados
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'prefacturas_pensionados_backup_pre_deploy') THEN
        DROP TABLE IF EXISTS prefacturas_pensionados CASCADE;
        ALTER TABLE prefacturas_pensionados_backup_pre_deploy RENAME TO prefacturas_pensionados;
        RAISE NOTICE '  ✓ Tabla prefacturas_pensionados restaurada desde backup';
    ELSE
        RAISE NOTICE '  ℹ No existe backup de prefacturas_pensionados';
    END IF;
END $$;

\echo ''

-- =====================================================
-- PASO 4: ELIMINAR TABLAS (SI NO SE RESTAURÓ DESDE BACKUP)
-- =====================================================

\echo 'Paso 4: Eliminando tablas (si no se restauraron desde backup)...'

DROP TABLE IF EXISTS prefacturas_pensionados CASCADE;
DROP TABLE IF EXISTS consumo_pensionados CASCADE;
DROP TABLE IF EXISTS pensionados CASCADE;

\echo '  ✓ Tablas eliminadas'
\echo ''

-- =====================================================
-- PASO 5: LIMPIAR TABLAS DE BACKUP
-- =====================================================

\echo 'Paso 5: Limpiando tablas de backup...'

DROP TABLE IF EXISTS pensionados_backup_pre_deploy CASCADE;
DROP TABLE IF EXISTS consumo_pensionados_backup_pre_deploy CASCADE;
DROP TABLE IF EXISTS prefacturas_pensionados_backup_pre_deploy CASCADE;

\echo '  ✓ Tablas de backup eliminadas'
\echo ''

-- =====================================================
-- PASO 6: VALIDACIÓN
-- =====================================================

\echo 'Paso 6: Validando rollback...'

DO $$
DECLARE
    tabla_count INTEGER;
BEGIN
    -- Verificar que las tablas fueron eliminadas
    SELECT COUNT(*) INTO tabla_count
    FROM information_schema.tables
    WHERE table_name IN ('pensionados', 'consumo_pensionados', 'prefacturas_pensionados');
    
    IF tabla_count = 0 THEN
        RAISE NOTICE '  ✓ Rollback completado: Todas las tablas eliminadas';
    ELSE
        RAISE NOTICE '  ⚠ Algunas tablas aún existen (posiblemente restauradas desde backup)';
    END IF;
END $$;

\echo ''
\echo '================================================='
\echo 'ROLLBACK COMPLETADO'
\echo '================================================='
\echo ''
\echo 'El sistema de pensionados ha sido revertido.'
\echo ''

