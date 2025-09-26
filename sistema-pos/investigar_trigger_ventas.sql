-- ===============================================
-- INVESTIGACIÓN: Trigger de validación de ventas
-- ===============================================

-- 1. Buscar la función validate_venta_integrity
SELECT 
    proname as function_name,
    prosrc as function_body
FROM pg_proc 
WHERE proname LIKE '%validate_venta%';

-- 2. Buscar triggers relacionados con ventas
SELECT 
    tgname as trigger_name,
    tgrelid::regclass as table_name,
    proname as function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgrelid::regclass::text = 'ventas';

-- 3. Verificar estados de ventas actuales
SELECT 
    estado,
    COUNT(*) as cantidad
FROM ventas 
GROUP BY estado
ORDER BY cantidad DESC;

-- 4. Buscar ventas con estado problemático
SELECT 
    id_venta,
    estado,
    fecha,
    total,
    id_restaurante
FROM ventas 
WHERE estado = 'pendiente_aprobacion'
LIMIT 10;

-- 5. Verificar si hay restricciones en la columna estado
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'ventas' 
AND column_name = 'estado';
