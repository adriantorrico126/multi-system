-- Script para corregir el orden de las ventas en PostgreSQL
-- Este script reordena las fechas de las ventas para que aparezcan en orden cronológico correcto

-- 1. Primero, verificar el estado actual de las ventas
SELECT 
    id_venta,
    fecha,
    created_at,
    total,
    estado,
    tipo_servicio,
    mesa_numero
FROM ventas 
ORDER BY id_venta ASC;

-- 2. Verificar si hay fechas duplicadas
SELECT 
    fecha,
    COUNT(*) as cantidad,
    array_agg(id_venta ORDER BY id_venta) as ids_ventas,
    array_agg(total ORDER BY id_venta) as totales
FROM ventas 
GROUP BY fecha
HAVING COUNT(*) > 1
ORDER BY fecha DESC;

-- 3. Corregir las fechas basándose en el ID para mantener orden cronológico
-- Esto asigna fechas secuenciales basándose en el orden del ID
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

-- 4. Verificar el resultado después de la corrección
SELECT 
    id_venta,
    fecha,
    created_at,
    total,
    estado,
    tipo_servicio,
    mesa_numero
FROM ventas 
ORDER BY fecha DESC, id_venta DESC
LIMIT 20;

-- 5. Verificar que no hay duplicados después de la corrección
SELECT 
    fecha,
    COUNT(*) as cantidad,
    array_agg(id_venta ORDER BY id_venta) as ids_ventas
FROM ventas 
GROUP BY fecha
HAVING COUNT(*) > 1
ORDER BY fecha DESC;

-- 6. Crear un índice para optimizar las consultas por fecha
CREATE INDEX IF NOT EXISTS idx_ventas_fecha_id ON ventas(fecha DESC, id_venta DESC);

-- 7. Estadísticas finales
SELECT 
    'Total de ventas' as metric,
    COUNT(*) as valor
FROM ventas
UNION ALL
SELECT 
    'Ventas por estado' as metric,
    COUNT(*) as valor
FROM ventas
GROUP BY estado
ORDER BY metric, valor DESC; 