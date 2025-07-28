-- Script para agregar el estado 'pagado' a la restricción de la tabla mesas

-- Primero, eliminar la restricción actual
ALTER TABLE mesas DROP CONSTRAINT IF EXISTS mesas_estado_check;

-- Crear la nueva restricción que incluye 'pagado'
ALTER TABLE mesas ADD CONSTRAINT mesas_estado_check 
CHECK (estado IN ('libre', 'en_uso', 'pendiente_cobro', 'reservada', 'mantenimiento', 'ocupada_por_grupo', 'pagado'));

-- Verificar que la restricción se creó correctamente
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'mesas'::regclass 
  AND contype = 'c'
  AND conname = 'mesas_estado_check'; 