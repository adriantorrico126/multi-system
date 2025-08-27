-- =====================================================
-- SOLUCIÓN: CORREGIR CONSTRAINT DE MESAS
-- Problema: Constraint UNIQUE solo considera (numero, id_sucursal)
-- Solución: Incluir id_restaurante para ser multi-tenant correcto
-- =====================================================

BEGIN;

-- 1. Eliminar constraint incorrecto
ALTER TABLE mesas DROP CONSTRAINT IF EXISTS mesas_numero_id_sucursal_key;

-- 2. Agregar constraint correcto que incluye id_restaurante
ALTER TABLE mesas ADD CONSTRAINT mesas_numero_sucursal_restaurante_key 
    UNIQUE (numero, id_sucursal, id_restaurante);

-- 3. Verificar que el constraint se creó correctamente
SELECT conname, pg_get_constraintdef(oid) as definition 
FROM pg_constraint 
WHERE conrelid = (SELECT oid FROM pg_class WHERE relname = 'mesas')
AND conname = 'mesas_numero_sucursal_restaurante_key';

COMMIT;

-- =====================================================
-- VERIFICACIÓN POST-IMPLEMENTACIÓN
-- =====================================================

-- Verificar mesas duplicadas que podrían existir
SELECT numero, id_sucursal, id_restaurante, COUNT(*) as duplicados
FROM mesas 
GROUP BY numero, id_sucursal, id_restaurante
HAVING COUNT(*) > 1;

-- Mostrar todas las mesas para verificar
SELECT id_mesa, numero, id_sucursal, id_restaurante, estado 
FROM mesas 
ORDER BY id_restaurante, id_sucursal, numero;
