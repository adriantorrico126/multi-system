-- Script para corregir la secuencia de id_venta en la tabla ventas
-- Ejecutar este script directamente en la consola de PostgreSQL de DigitalOcean

-- =====================================================
-- CORREGIR SECUENCIA DE ID_VENTA
-- =====================================================

-- Verificar el estado actual de la secuencia
SELECT 
    last_value as ultimo_valor_secuencia,
    (SELECT MAX(id_venta) FROM ventas) as maximo_id_venta_real
FROM ventas_id_venta_seq;

-- Corregir la secuencia para que apunte al siguiente valor disponible
SELECT setval('ventas_id_venta_seq', COALESCE((SELECT MAX(id_venta) FROM ventas), 0) + 1, false);

-- Verificar que se corrigió correctamente
SELECT 
    last_value as nuevo_ultimo_valor_secuencia,
    (SELECT MAX(id_venta) FROM ventas) as maximo_id_venta_real
FROM ventas_id_venta_seq;

-- =====================================================
-- VERIFICACIÓN ADICIONAL
-- =====================================================

-- Mostrar información de la tabla ventas
SELECT 
    COUNT(*) as total_ventas,
    MIN(id_venta) as min_id_venta,
    MAX(id_venta) as max_id_venta
FROM ventas;

-- Mostrar información de la secuencia
SELECT 
    'ventas_id_venta_seq' as sequence_name,
    last_value,
    start_value,
    increment_by
FROM ventas_id_venta_seq;

RAISE NOTICE 'Secuencia de id_venta corregida exitosamente';
