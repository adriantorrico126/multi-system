-- =====================================================
-- VERIFICAR Y LIMPIAR MESAS DUPLICADAS
-- =====================================================

-- 1. BUSCAR MESAS DUPLICADAS
SELECT 
    numero, 
    id_sucursal, 
    id_restaurante, 
    COUNT(*) as total_duplicados,
    STRING_AGG(id_mesa::text, ', ') as ids_mesa
FROM mesas 
GROUP BY numero, id_sucursal, id_restaurante
HAVING COUNT(*) > 1
ORDER BY id_restaurante, id_sucursal, numero;

-- 2. MOSTRAR DETALLES DE MESAS PROBLEMÁTICAS
WITH mesas_duplicadas AS (
    SELECT numero, id_sucursal, id_restaurante
    FROM mesas 
    GROUP BY numero, id_sucursal, id_restaurante
    HAVING COUNT(*) > 1
)
SELECT 
    m.id_mesa,
    m.numero,
    m.id_sucursal,
    m.id_restaurante,
    m.estado,
    m.id_venta_actual,
    m.created_at,
    s.nombre as sucursal_nombre
FROM mesas m
JOIN mesas_duplicadas md ON (
    m.numero = md.numero 
    AND m.id_sucursal = md.id_sucursal 
    AND m.id_restaurante = md.id_restaurante
)
LEFT JOIN sucursales s ON m.id_sucursal = s.id_sucursal
ORDER BY m.id_restaurante, m.id_sucursal, m.numero, m.created_at;

-- 3. LIMPIAR DUPLICADOS (MANTENER LA MÁS RECIENTE)
-- ⚠️ EJECUTAR SOLO DESPUÉS DE VERIFICAR LOS DATOS ⚠️
/*
WITH mesas_a_eliminar AS (
    SELECT 
        id_mesa,
        ROW_NUMBER() OVER (
            PARTITION BY numero, id_sucursal, id_restaurante 
            ORDER BY created_at DESC
        ) as rn
    FROM mesas
)
DELETE FROM mesas 
WHERE id_mesa IN (
    SELECT id_mesa 
    FROM mesas_a_eliminar 
    WHERE rn > 1
);
*/
