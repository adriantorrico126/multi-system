-- Script específico para corregir la venta de 15bs (ID 35) que aparece en el medio
-- Este script asegura que las ventas aparezcan en orden cronológico correcto

-- 1. Verificar la venta problemática
SELECT 
    id_venta,
    fecha,
    created_at,
    total,
    estado,
    tipo_servicio,
    mesa_numero
FROM ventas 
WHERE id_venta = 35;

-- 2. Verificar el orden actual (las últimas 10 ventas)
SELECT 
    id_venta,
    fecha,
    total,
    estado
FROM ventas 
ORDER BY fecha DESC, id_venta DESC
LIMIT 10;

-- 3. Corregir la fecha de la venta específica (ID 35)
-- Asignarle una fecha posterior a la última venta
UPDATE ventas 
SET fecha = (
    SELECT MAX(fecha) + INTERVAL '1 minute'
    FROM ventas 
    WHERE id_venta != 35
)
WHERE id_venta = 35;

-- 4. Verificar que la corrección funcionó
SELECT 
    id_venta,
    fecha,
    total,
    estado
FROM ventas 
ORDER BY fecha DESC, id_venta DESC
LIMIT 10;

-- 5. Si hay más ventas con problemas similares, corregir todas las fechas
-- Este script reordena todas las ventas basándose en su ID
WITH ventas_ordenadas AS (
    SELECT 
        id_venta,
        created_at,
        ROW_NUMBER() OVER (ORDER BY id_venta ASC) as rn
    FROM ventas
)
UPDATE ventas 
SET fecha = (
    SELECT created_at + (INTERVAL '1 second' * (rn - 1))
    FROM ventas_ordenadas vo 
    WHERE vo.id_venta = ventas.id_venta
)
WHERE id_venta IN (SELECT id_venta FROM ventas_ordenadas);

-- 6. Verificar el resultado final
SELECT 
    id_venta,
    fecha,
    total,
    estado,
    tipo_servicio,
    mesa_numero
FROM ventas 
ORDER BY fecha DESC, id_venta DESC
LIMIT 15;

-- 7. Crear índice optimizado para consultas por fecha
DROP INDEX IF EXISTS idx_ventas_fecha_id;
CREATE INDEX idx_ventas_fecha_id ON ventas(fecha DESC, id_venta DESC);

-- 8. Verificar que no hay fechas duplicadas
SELECT 
    fecha,
    COUNT(*) as cantidad,
    array_agg(id_venta ORDER BY id_venta) as ids_ventas
FROM ventas 
GROUP BY fecha
HAVING COUNT(*) > 1
ORDER BY fecha DESC; 