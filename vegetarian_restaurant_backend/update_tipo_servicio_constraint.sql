-- Script para actualizar el constraint de tipo_servicio con las tres opciones
-- Primero verificar si existe el constraint actual
DO $$
BEGIN
    -- Eliminar el constraint si existe
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'ventas_tipo_servicio_check' 
        AND conrelid = 'ventas'::regclass
    ) THEN
        ALTER TABLE ventas DROP CONSTRAINT ventas_tipo_servicio_check;
        RAISE NOTICE 'Constraint ventas_tipo_servicio_check eliminado';
    ELSE
        RAISE NOTICE 'Constraint ventas_tipo_servicio_check no existe';
    END IF;
END $$;

-- Crear el nuevo constraint con las tres opciones
ALTER TABLE ventas ADD CONSTRAINT ventas_tipo_servicio_check 
CHECK (tipo_servicio IN ('Mesa', 'Delivery', 'Para Llevar'));

-- Verificar que se aplicó correctamente
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'ventas'::regclass 
  AND contype = 'c' 
  AND pg_get_constraintdef(oid) LIKE '%tipo_servicio%';

-- Mostrar los valores únicos actuales en tipo_servicio
SELECT DISTINCT tipo_servicio, COUNT(*) as cantidad
FROM ventas 
GROUP BY tipo_servicio
ORDER BY tipo_servicio; 