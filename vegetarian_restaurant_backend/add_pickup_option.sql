-- Script para agregar 'Para Llevar' como opción válida en tipo_servicio
-- Primero eliminar el constraint actual
ALTER TABLE ventas DROP CONSTRAINT IF EXISTS ventas_tipo_servicio_check;

-- Crear el nuevo constraint con las tres opciones
ALTER TABLE ventas ADD CONSTRAINT ventas_tipo_servicio_check 
CHECK (tipo_servicio IN ('Mesa', 'Delivery', 'Para Llevar'));

-- Verificar que se aplicó correctamente
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'ventas'::regclass 
  AND contype = 'c' 
  AND pg_get_constraintdef(oid) LIKE '%tipo_servicio%'; 