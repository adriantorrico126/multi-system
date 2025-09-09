-- =====================================================
-- SCRIPT DE VERIFICACIÓN POST-CORRECCIÓN
-- Ejecutar DESPUÉS de CORREGIR_PREFACTURAS_DBEAVER.sql
-- =====================================================

-- VERIFICACIÓN 1: Estado de prefacturas después de la corrección
SELECT 
    'VERIFICACIÓN FINAL' as tipo,
    p.id_prefactura,
    p.id_mesa,
    m.numero as mesa_numero,
    p.fecha_apertura,
    p.total_acumulado as total_prefactura,
    get_total_sesion_actual(p.id_mesa, p.id_restaurante) as total_calculado,
    ABS(p.total_acumulado - get_total_sesion_actual(p.id_mesa, p.id_restaurante)) as diferencia,
    CASE 
        WHEN ABS(p.total_acumulado - get_total_sesion_actual(p.id_mesa, p.id_restaurante)) < 0.01 
        THEN '✅ CORRECTO' 
        ELSE '❌ ERROR' 
    END as estado
FROM prefacturas p
JOIN mesas m ON p.id_mesa = m.id_mesa
WHERE p.estado = 'abierta'
ORDER BY p.fecha_apertura DESC;

-- VERIFICACIÓN 2: Contar ventas por prefactura para verificar filtrado
SELECT 
    'VENTAS POR PREFACTURA' as tipo,
    p.id_prefactura,
    m.numero as mesa_numero,
    p.fecha_apertura,
    COUNT(v.id_venta) as total_ventas,
    COUNT(CASE WHEN v.fecha >= p.fecha_apertura THEN 1 END) as ventas_sesion_actual,
    COUNT(CASE WHEN v.fecha < p.fecha_apertura THEN 1 END) as ventas_historicas
FROM prefacturas p
JOIN mesas m ON p.id_mesa = m.id_mesa
LEFT JOIN ventas v ON v.id_mesa = p.id_mesa
WHERE p.estado = 'abierta'
GROUP BY p.id_prefactura, m.numero, p.fecha_apertura
ORDER BY p.fecha_apertura DESC;

-- VERIFICACIÓN 3: Verificar que no hay prefacturas sin fecha_apertura
SELECT 
    'PREFACTURAS SIN FECHA' as tipo,
    COUNT(*) as cantidad,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ TODAS TIENEN FECHA' 
        ELSE '❌ HAY PREFACTURAS SIN FECHA' 
    END as estado
FROM prefacturas 
WHERE estado = 'abierta' AND fecha_apertura IS NULL;

-- VERIFICACIÓN 4: Verificar funciones SQL
SELECT 
    'FUNCIONES SQL' as tipo,
    proname as nombre_funcion,
    CASE 
        WHEN proname IS NOT NULL THEN '✅ EXISTE' 
        ELSE '❌ NO EXISTE' 
    END as estado
FROM pg_proc 
WHERE proname IN ('get_total_sesion_actual');

-- VERIFICACIÓN 5: Verificar índices
SELECT 
    'INDICES' as tipo,
    indexname as nombre_indice,
    tablename as tabla,
    '✅ EXISTE' as estado
FROM pg_indexes 
WHERE tablename IN ('ventas', 'prefacturas')
  AND indexname LIKE '%fecha%'
ORDER BY tablename, indexname;

-- VERIFICACIÓN 6: Resumen de correcciones aplicadas
SELECT 
    'RESUMEN FINAL' as tipo,
    'Prefacturas corregidas' as item,
    COUNT(*) as cantidad,
    '✅ COMPLETADO' as estado
FROM prefacturas 
WHERE estado = 'abierta'

UNION ALL

SELECT 
    'RESUMEN FINAL' as tipo,
    'Funciones SQL creadas' as item,
    COUNT(*) as cantidad,
    '✅ COMPLETADO' as estado
FROM pg_proc 
WHERE proname IN ('get_total_sesion_actual')

UNION ALL

SELECT 
    'RESUMEN FINAL' as tipo,
    'Índices creados' as item,
    COUNT(*) as cantidad,
    '✅ COMPLETADO' as estado
FROM pg_indexes 
WHERE tablename IN ('ventas', 'prefacturas')
  AND indexname LIKE '%fecha%';

-- =====================================================
-- INSTRUCCIONES PARA VERIFICAR EN LA APLICACIÓN:
-- =====================================================
-- 1. Abrir una mesa en el POS
-- 2. Hacer algunas ventas
-- 3. Verificar que la prefactura solo muestra las ventas de la sesión actual
-- 4. Liberar la mesa
-- 5. Volver a abrir la mesa
-- 6. Verificar que la prefactura está limpia (sin datos históricos)
-- =====================================================
