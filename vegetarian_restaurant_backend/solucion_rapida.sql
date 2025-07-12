-- SOLUCIÓN RÁPIDA: Corregir orden de ventas
-- Ejecuta este script en PostgreSQL para corregir el problema

-- PASO 1: Ver el estado actual
SELECT 'ESTADO ACTUAL - Últimas 10 ventas:' as info;
SELECT 
    id_venta,
    fecha,
    total,
    estado
FROM ventas 
ORDER BY fecha DESC, id_venta DESC
LIMIT 10;

-- PASO 2: Corregir todas las fechas basándose en el ID
-- Esto asegura que las ventas aparezcan en orden cronológico correcto
UPDATE ventas 
SET fecha = created_at + (INTERVAL '1 second' * (id_venta - 1));

-- PASO 3: Verificar el resultado
SELECT 'DESPUÉS DE LA CORRECCIÓN - Últimas 10 ventas:' as info;
SELECT 
    id_venta,
    fecha,
    total,
    estado
FROM ventas 
ORDER BY fecha DESC, id_venta DESC
LIMIT 10;

-- PASO 4: Crear índice optimizado
CREATE INDEX IF NOT EXISTS idx_ventas_orden ON ventas(fecha DESC, id_venta DESC);

-- PASO 5: Verificar que no hay duplicados
SELECT 'VERIFICACIÓN - Fechas duplicadas:' as info;
SELECT 
    fecha,
    COUNT(*) as cantidad,
    array_agg(id_venta ORDER BY id_venta) as ids_ventas
FROM ventas 
GROUP BY fecha
HAVING COUNT(*) > 1
ORDER BY fecha DESC;

-- Si no hay resultados en el paso 5, significa que la corrección fue exitosa 