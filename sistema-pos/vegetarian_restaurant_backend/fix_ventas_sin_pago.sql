-- Script para asignar método de pago por defecto a ventas sin método
-- Ejecutar solo si hay ventas sin método de pago

-- 1. Verificar ventas sin método de pago
SELECT COUNT(*) as ventas_sin_pago 
FROM ventas 
WHERE id_pago IS NULL OR id_pago = 0;

-- 2. Obtener el primer método de pago disponible
DO $$
DECLARE
    primer_metodo_id INTEGER;
BEGIN
    -- Obtener el ID del primer método de pago disponible
    SELECT id_pago INTO primer_metodo_id 
    FROM metodos_pago 
    WHERE id_restaurante = 1 AND activo = true 
    ORDER BY id_pago 
    LIMIT 1;
    
    IF primer_metodo_id IS NOT NULL THEN
        -- Actualizar ventas sin método de pago
        UPDATE ventas 
        SET id_pago = primer_metodo_id 
        WHERE (id_pago IS NULL OR id_pago = 0) AND id_restaurante = 1;
        
        RAISE NOTICE 'Ventas actualizadas con método de pago ID: %', primer_metodo_id;
    ELSE
        RAISE NOTICE 'No hay métodos de pago disponibles';
    END IF;
END $$;

-- 3. Verificar el resultado
SELECT 
    v.id_venta,
    v.id_pago,
    mp.descripcion as metodo_pago,
    v.total,
    v.fecha
FROM ventas v
LEFT JOIN metodos_pago mp ON v.id_pago = mp.id_pago
WHERE v.id_restaurante = 1
ORDER BY v.fecha DESC
LIMIT 10; 