-- Análisis de métodos de pago por restaurante
-- ==========================================

-- 1. Ver todos los métodos de pago actuales
SELECT 
    id_pago,
    descripcion,
    activo,
    id_restaurante,
    COUNT(*) OVER (PARTITION BY descripcion) as total_por_descripcion
FROM metodos_pago 
ORDER BY descripcion, id_restaurante;

-- 2. Identificar métodos duplicados por descripción
SELECT 
    descripcion,
    COUNT(*) as cantidad,
    STRING_AGG(id_restaurante::text, ', ') as restaurantes,
    STRING_AGG(CASE WHEN activo THEN 'SÍ' ELSE 'NO' END, ', ') as activos
FROM metodos_pago 
GROUP BY descripcion
HAVING COUNT(*) > 1
ORDER BY descripcion;

-- 3. Métodos por restaurante
SELECT 
    id_restaurante,
    COUNT(*) as total_metodos,
    COUNT(CASE WHEN activo THEN 1 END) as metodos_activos,
    STRING_AGG(descripcion, ', ') as descripciones
FROM metodos_pago 
GROUP BY id_restaurante
ORDER BY id_restaurante;

-- 4. Verificar si hay referencias a métodos de pago en ventas
SELECT 
    v.id_restaurante,
    mp.id_pago,
    mp.descripcion,
    COUNT(*) as uso_en_ventas
FROM ventas v
JOIN metodos_pago mp ON v.id_pago = mp.id_pago
GROUP BY v.id_restaurante, mp.id_pago, mp.descripcion
ORDER BY v.id_restaurante, COUNT(*) DESC;