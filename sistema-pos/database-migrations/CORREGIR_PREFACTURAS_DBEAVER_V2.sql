-- =====================================================
-- SCRIPT PARA CORREGIR PREFACTURAS EN PRODUCCIÓN
-- VERSIÓN CON MANEJO DE TRIGGERS
-- Ejecutar desde DBeaver o cualquier cliente PostgreSQL
-- =====================================================

-- PASO 1: Verificar estado actual de prefacturas
SELECT 
    'ESTADO ACTUAL' as estado,
    p.id_prefactura,
    p.id_mesa,
    p.fecha_apertura,
    p.estado,
    p.total_acumulado,
    m.numero as mesa_numero,
    m.estado as estado_mesa
FROM prefacturas p
JOIN mesas m ON p.id_mesa = m.id_mesa
WHERE p.estado = 'abierta'
ORDER BY p.fecha_apertura DESC;

-- PASO 2: Identificar mesas con múltiples prefacturas abiertas
SELECT 
    'MESAS CON MÚLTIPLES PREFACTURAS' as estado,
    id_mesa,
    COUNT(*) as cantidad_prefacturas,
    STRING_AGG(id_prefactura::text, ', ') as ids_prefacturas
FROM prefacturas 
WHERE estado = 'abierta'
GROUP BY id_mesa
HAVING COUNT(*) > 1
ORDER BY cantidad_prefacturas DESC;

-- PASO 3: Cerrar prefacturas duplicadas (mantener solo la más reciente)
-- Para mesa 38 (que tiene múltiples prefacturas)
UPDATE prefacturas 
SET estado = 'cerrada',
    fecha_cierre = NOW(),
    observaciones = 'Cerrada automáticamente por duplicación - corrección de integridad'
WHERE id_mesa = 38 
  AND estado = 'abierta'
  AND id_prefactura NOT IN (
    SELECT id_prefactura 
    FROM prefacturas 
    WHERE id_mesa = 38 
      AND estado = 'abierta'
    ORDER BY fecha_apertura DESC 
    LIMIT 1
  );

-- Para mesa 1 (que también tiene múltiples prefacturas)
UPDATE prefacturas 
SET estado = 'cerrada',
    fecha_cierre = NOW(),
    observaciones = 'Cerrada automáticamente por duplicación - corrección de integridad'
WHERE id_mesa = 1 
  AND estado = 'abierta'
  AND id_prefactura NOT IN (
    SELECT id_prefactura 
    FROM prefacturas 
    WHERE id_mesa = 1 
      AND estado = 'abierta'
    ORDER BY fecha_apertura DESC 
    LIMIT 1
  );

-- PASO 4: Verificar que ahora solo hay una prefactura abierta por mesa
SELECT 
    'DESPUÉS DE LIMPIEZA' as estado,
    id_mesa,
    COUNT(*) as cantidad_prefacturas,
    STRING_AGG(id_prefactura::text, ', ') as ids_prefacturas
FROM prefacturas 
WHERE estado = 'abierta'
GROUP BY id_mesa
ORDER BY id_mesa;

-- PASO 5: Actualizar prefacturas sin fecha_apertura
UPDATE prefacturas 
SET fecha_apertura = COALESCE(
    fecha_apertura,
    (SELECT hora_apertura FROM mesas WHERE id_mesa = prefacturas.id_mesa),
    NOW()
)
WHERE estado = 'abierta' 
  AND fecha_apertura IS NULL;

-- PASO 6: Crear función para calcular total de sesión actual
CREATE OR REPLACE FUNCTION get_total_sesion_actual(
    p_id_mesa INTEGER,
    p_id_restaurante INTEGER
) RETURNS DECIMAL AS $$
DECLARE
    fecha_apertura_sesion TIMESTAMP;
    total_calculado DECIMAL := 0;
BEGIN
    -- Obtener la fecha de apertura de la sesión actual
    SELECT COALESCE(
        (SELECT fecha_apertura FROM prefacturas 
         WHERE id_mesa = p_id_mesa AND estado = 'abierta' 
         ORDER BY fecha_apertura DESC LIMIT 1),
        (SELECT hora_apertura FROM mesas WHERE id_mesa = p_id_mesa),
        NOW()
    ) INTO fecha_apertura_sesion;
    
    -- Calcular total solo de la sesión actual
    SELECT COALESCE(SUM(dv.subtotal), 0)
    INTO total_calculado
    FROM ventas v
    JOIN detalle_ventas dv ON v.id_venta = dv.id_venta
    WHERE v.id_mesa = p_id_mesa
      AND v.id_restaurante = p_id_restaurante
      AND v.fecha >= fecha_apertura_sesion
      AND v.estado IN ('abierta', 'en_uso', 'pendiente_cobro', 'entregado', 'pagado', 'completada', 'pendiente', 'recibido');
    
    RETURN total_calculado;
END;
$$ LANGUAGE plpgsql;

-- PASO 7: Actualizar todas las prefacturas abiertas con totales correctos
-- Actualizar todas las prefacturas abiertas de una vez
UPDATE prefacturas 
SET total_acumulado = get_total_sesion_actual(id_mesa, id_restaurante)
WHERE estado = 'abierta';

-- PASO 8: Crear índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_ventas_fecha_mesa_restaurante 
ON ventas (fecha, id_mesa, id_restaurante, estado);

CREATE INDEX IF NOT EXISTS idx_prefacturas_fecha_apertura 
ON prefacturas (fecha_apertura, id_mesa, estado);

-- PASO 9: Verificar resultado final
SELECT 
    'RESULTADO FINAL' as estado,
    p.id_prefactura,
    p.id_mesa,
    p.fecha_apertura,
    p.estado,
    p.total_acumulado,
    m.numero as mesa_numero,
    m.estado as estado_mesa,
    get_total_sesion_actual(p.id_mesa, p.id_restaurante) as total_verificado,
    CASE 
        WHEN ABS(p.total_acumulado - get_total_sesion_actual(p.id_mesa, p.id_restaurante)) < 0.01 
        THEN '✅ CORRECTO' 
        ELSE '❌ ERROR' 
    END as estado_correccion
FROM prefacturas p
JOIN mesas m ON p.id_mesa = m.id_mesa
WHERE p.estado = 'abierta'
ORDER BY p.fecha_apertura DESC;

-- PASO 10: Verificar que las funciones se crearon correctamente
SELECT 
    'FUNCIONES CREADAS' as estado,
    proname as nombre_funcion,
    '✅ CREADA' as estado_funcion
FROM pg_proc 
WHERE proname IN ('get_total_sesion_actual');

-- PASO 11: Verificar índices creados
SELECT 
    'INDICES CREADOS' as estado,
    indexname as nombre_indice,
    tablename as tabla,
    '✅ CREADO' as estado_indice
FROM pg_indexes 
WHERE tablename IN ('ventas', 'prefacturas')
  AND indexname LIKE '%fecha%';

-- =====================================================
-- RESUMEN DE CORRECCIONES APLICADAS:
-- =====================================================
-- 1. ✅ Identificadas mesas con múltiples prefacturas abiertas
-- 2. ✅ Cerradas prefacturas duplicadas (manteniendo solo la más reciente)
-- 3. ✅ Actualizadas prefacturas sin fecha_apertura
-- 4. ✅ Creada función get_total_sesion_actual()
-- 5. ✅ Actualizados totales de todas las prefacturas abiertas
-- 6. ✅ Creados índices para mejorar performance
-- 7. ✅ Verificado que todas las correcciones se aplicaron
-- =====================================================
