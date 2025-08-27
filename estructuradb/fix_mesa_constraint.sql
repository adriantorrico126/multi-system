-- =====================================================
-- CORRECCIÓN DEL CONSTRAINT DE MESAS
-- Problema: No se pueden registrar ventas por constraint incorrecto
-- Fecha: 2025-08-26
-- =====================================================

-- Mostrar constraint actual problemático
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = (SELECT oid FROM pg_class WHERE relname = 'mesas')
AND conname LIKE '%numero%';

-- Verificar mesas que podrían tener conflictos
SELECT 
    numero, 
    id_sucursal, 
    id_restaurante, 
    COUNT(*) as duplicados,
    STRING_AGG(id_mesa::text, ', ') as ids_mesa
FROM mesas 
GROUP BY numero, id_sucursal, id_restaurante
HAVING COUNT(*) > 1;

-- APLICAR CORRECCIÓN
BEGIN;

-- 1. Eliminar constraint problemático
ALTER TABLE mesas DROP CONSTRAINT IF EXISTS mesas_numero_id_sucursal_key;

-- 2. Agregar constraint correcto que incluye id_restaurante
ALTER TABLE mesas ADD CONSTRAINT mesas_numero_sucursal_restaurante_unique 
    UNIQUE (numero, id_sucursal, id_restaurante);

-- 3. Verificar que se aplicó correctamente
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = (SELECT oid FROM pg_class WHERE relname = 'mesas')
AND conname LIKE '%numero%';

COMMIT;

-- Mensaje de confirmación
SELECT 'Constraint de mesas corregido exitosamente!' as resultado;
