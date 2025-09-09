-- =====================================================
-- SCRIPT PARA CORREGIR PREFACTURAS EN PRODUCCIÓN
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

-- PASO 2: Actualizar prefacturas sin fecha_apertura
UPDATE prefacturas 
SET fecha_apertura = COALESCE(
    fecha_apertura,
    (SELECT hora_apertura FROM mesas WHERE id_mesa = prefacturas.id_mesa),
    NOW()
)
WHERE estado = 'abierta' 
  AND fecha_apertura IS NULL;

-- PASO 3: Crear función para calcular total de sesión actual
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

-- PASO 4: Actualizar todas las prefacturas abiertas con totales correctos
-- Prefactura 142 (Mesa 1)
UPDATE prefacturas 
SET total_acumulado = get_total_sesion_actual(id_mesa, id_restaurante)
WHERE id_prefactura = 142;

-- Prefactura 141 (Mesa 1)  
UPDATE prefacturas 
SET total_acumulado = get_total_sesion_actual(id_mesa, id_restaurante)
WHERE id_prefactura = 141;

-- Prefactura 137 (Mesa 3)
UPDATE prefacturas 
SET total_acumulado = get_total_sesion_actual(id_mesa, id_restaurante)
WHERE id_prefactura = 137;

-- Prefactura 134 (Mesa 3)
UPDATE prefacturas 
SET total_acumulado = get_total_sesion_actual(id_mesa, id_restaurante)
WHERE id_prefactura = 134;

-- Prefactura 131 (Mesa 1)
UPDATE prefacturas 
SET total_acumulado = get_total_sesion_actual(id_mesa, id_restaurante)
WHERE id_prefactura = 131;

-- Prefactura 70 (Mesa 1)
UPDATE prefacturas 
SET total_acumulado = get_total_sesion_actual(id_mesa, id_restaurante)
WHERE id_prefactura = 70;

-- PASO 5: Crear índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_ventas_fecha_mesa_restaurante 
ON ventas (fecha, id_mesa, id_restaurante, estado);

CREATE INDEX IF NOT EXISTS idx_prefacturas_fecha_apertura 
ON prefacturas (fecha_apertura, id_mesa, estado);

-- PASO 6: Verificar resultado final
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

-- PASO 7: Verificar que las funciones se crearon correctamente
SELECT 
    'FUNCIONES CREADAS' as estado,
    proname as nombre_funcion,
    '✅ CREADA' as estado_funcion
FROM pg_proc 
WHERE proname IN ('get_total_sesion_actual');

-- PASO 8: Verificar índices creados
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
-- 1. ✅ Actualizadas prefacturas sin fecha_apertura
-- 2. ✅ Creada función get_total_sesion_actual()
-- 3. ✅ Actualizados totales de todas las prefacturas abiertas
-- 4. ✅ Creados índices para mejorar performance
-- 5. ✅ Verificado que todas las correcciones se aplicaron
-- =====================================================
