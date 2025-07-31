-- Script para actualizar las restricciones de la tabla promociones
-- Este script corrige las restricciones para permitir todos los tipos de promoción

-- 1. Eliminar la restricción actual de tipo
ALTER TABLE promociones
  DROP CONSTRAINT IF EXISTS promociones_tipo_check;

-- 2. Crear nueva restricción con todos los tipos permitidos
ALTER TABLE promociones
  ADD CONSTRAINT promociones_tipo_check
    CHECK (tipo IN ('porcentaje', 'monto_fijo', 'precio_fijo', 'x_uno_gratis', 'fijo'));

-- 3. Verificar que la restricción se aplicó correctamente
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'promociones'::regclass 
  AND conname = 'promociones_tipo_check';

-- 4. Mensaje de confirmación
DO $$
BEGIN
  RAISE NOTICE 'Restricciones de tipo actualizadas correctamente.';
  RAISE NOTICE 'Tipos permitidos: porcentaje, monto_fijo, precio_fijo, x_uno_gratis, fijo';
END $$; 