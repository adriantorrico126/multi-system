-- Script para corregir el problema de prefacturas con datos históricos en producción
-- CORREGIDO para la estructura real de la base de datos de producción

-- 1. Verificar el estado actual de las prefacturas
SELECT 
    p.id_prefactura,
    p.id_mesa,
    p.fecha_apertura,
    p.fecha_cierre,
    p.estado,
    p.total_acumulado,
    m.numero as mesa_numero,
    m.estado as estado_mesa
FROM prefacturas p
JOIN mesas m ON p.id_mesa = m.id_mesa
WHERE p.estado = 'abierta'
ORDER BY p.fecha_apertura DESC;

-- 2. Verificar si hay prefacturas con datos históricos (sin fecha_apertura)
SELECT 
    p.id_prefactura,
    p.id_mesa,
    p.fecha_apertura,
    p.estado,
    m.numero as mesa_numero
FROM prefacturas p
JOIN mesas m ON p.id_mesa = m.id_mesa
WHERE p.estado = 'abierta' 
  AND p.fecha_apertura IS NULL;

-- 3. Actualizar prefacturas abiertas que no tienen fecha_apertura
-- Esto asegura que todas las prefacturas tengan una fecha de apertura válida
UPDATE prefacturas 
SET fecha_apertura = COALESCE(
    fecha_apertura,
    (SELECT hora_apertura FROM mesas WHERE id_mesa = prefacturas.id_mesa),
    NOW()
)
WHERE estado = 'abierta' 
  AND fecha_apertura IS NULL;

-- 4. Verificar que todas las prefacturas abiertas ahora tienen fecha_apertura
SELECT 
    p.id_prefactura,
    p.id_mesa,
    p.fecha_apertura,
    p.estado,
    m.numero as mesa_numero,
    m.hora_apertura
FROM prefacturas p
JOIN mesas m ON p.id_mesa = m.id_mesa
WHERE p.estado = 'abierta'
ORDER BY p.fecha_apertura DESC;

-- 5. Crear función para obtener ventas de la sesión actual (si no existe)
CREATE OR REPLACE FUNCTION get_ventas_sesion_actual(
    p_id_mesa INTEGER,
    p_id_restaurante INTEGER
) RETURNS TABLE (
    id_venta INTEGER,
    fecha TIMESTAMP,
    total DECIMAL,
    estado VARCHAR,
    cantidad INTEGER,
    precio_unitario DECIMAL,
    subtotal DECIMAL,
    nombre_producto VARCHAR,
    nombre_vendedor VARCHAR
) AS $$
DECLARE
    fecha_apertura_sesion TIMESTAMP;
BEGIN
    -- Obtener la fecha de apertura de la sesión actual
    SELECT COALESCE(
        (SELECT fecha_apertura FROM prefacturas 
         WHERE id_mesa = p_id_mesa AND estado = 'abierta' 
         ORDER BY fecha_apertura DESC LIMIT 1),
        (SELECT hora_apertura FROM mesas WHERE id_mesa = p_id_mesa),
        NOW()
    ) INTO fecha_apertura_sesion;
    
    -- Retornar solo las ventas de la sesión actual
    RETURN QUERY
    SELECT 
        v.id_venta,
        v.fecha,
        v.total,
        v.estado,
        dv.cantidad,
        dv.precio_unitario,
        dv.subtotal,
        p.nombre as nombre_producto,
        vend.nombre as nombre_vendedor
    FROM ventas v
    JOIN detalle_ventas dv ON v.id_venta = dv.id_venta
    JOIN productos p ON dv.id_producto = p.id_producto
    JOIN vendedores vend ON v.id_vendedor = vend.id_vendedor
    WHERE v.id_mesa = p_id_mesa
      AND v.id_restaurante = p_id_restaurante
      AND v.fecha >= fecha_apertura_sesion
      AND v.estado IN ('abierta', 'en_uso', 'pendiente_cobro', 'entregado', 'pagado', 'completada', 'pendiente', 'recibido')
    ORDER BY v.fecha DESC;
END;
$$ LANGUAGE plpgsql;

-- 6. Crear función para calcular total de sesión actual (si no existe)
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

-- 7. Actualizar todas las prefacturas abiertas con el total correcto de la sesión actual
DO $$
DECLARE
    prefactura_record RECORD;
    nuevo_total DECIMAL;
BEGIN
    FOR prefactura_record IN 
        SELECT id_prefactura, id_mesa, id_restaurante 
        FROM prefacturas 
        WHERE estado = 'abierta'
    LOOP
        -- Calcular el total correcto para esta sesión
        SELECT get_total_sesion_actual(prefactura_record.id_mesa, prefactura_record.id_restaurante)
        INTO nuevo_total;
        
        -- Actualizar la prefactura con el total correcto
        UPDATE prefacturas 
        SET total_acumulado = nuevo_total
        WHERE id_prefactura = prefactura_record.id_prefactura;
        
        RAISE NOTICE 'Prefactura ID % actualizada con total: %', prefactura_record.id_prefactura, nuevo_total;
    END LOOP;
END $$;

-- 8. Verificar el resultado final
SELECT 
    p.id_prefactura,
    p.id_mesa,
    p.fecha_apertura,
    p.estado,
    p.total_acumulado,
    m.numero as mesa_numero,
    m.estado as estado_mesa,
    get_total_sesion_actual(p.id_mesa, p.id_restaurante) as total_verificado
FROM prefacturas p
JOIN mesas m ON p.id_mesa = m.id_mesa
WHERE p.estado = 'abierta'
ORDER BY p.fecha_apertura DESC;

-- 9. Crear índice para mejorar performance de consultas por fecha
CREATE INDEX IF NOT EXISTS idx_ventas_fecha_mesa_restaurante 
ON ventas (fecha, id_mesa, id_restaurante, estado);

CREATE INDEX IF NOT EXISTS idx_prefacturas_fecha_apertura 
ON prefacturas (fecha_apertura, id_mesa, estado);

-- 10. Crear vista para pagos diferidos pendientes (si no existe)
CREATE OR REPLACE VIEW vista_pagos_diferidos_pendientes AS
SELECT 
    pd.id_pago_diferido,
    pd.id_venta,
    v.mesa_numero,
    v.total,
    v.tipo_servicio,
    pd.fecha_creacion,
    pd.fecha_vencimiento,
    pd.estado,
    pd.observaciones,
    pd.id_restaurante,
    CASE 
        WHEN pd.estado = 'pendiente' THEN 'Pendiente'
        WHEN pd.estado = 'pagado' THEN 'Pagado'
        WHEN pd.estado = 'vencido' THEN 'Vencido'
        ELSE 'Desconocido'
    END as estado_real,
    CASE 
        WHEN pd.fecha_vencimiento < NOW() AND pd.estado = 'pendiente' 
        THEN EXTRACT(DAY FROM NOW() - pd.fecha_vencimiento)::INTEGER
        ELSE NULL
    END as dias_pendiente
FROM pagos_diferidos pd
JOIN ventas v ON pd.id_venta = v.id_venta
WHERE pd.estado = 'pendiente';

-- 11. Mensaje de confirmación
SELECT 'Script de corrección de prefacturas ejecutado exitosamente' as resultado;
