-- Script para corregir el problema de prefacturas con datos históricos en producción
-- SIMPLIFICADO para evitar errores de sintaxis

-- 1. Actualizar prefacturas abiertas que no tienen fecha_apertura
UPDATE prefacturas 
SET fecha_apertura = COALESCE(
    fecha_apertura,
    (SELECT hora_apertura FROM mesas WHERE id_mesa = prefacturas.id_mesa),
    NOW()
)
WHERE estado = 'abierta' 
  AND fecha_apertura IS NULL;

-- 2. Crear función para obtener ventas de la sesión actual
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

-- 3. Crear función para calcular total de sesión actual
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

-- 4. Actualizar prefactura 142 (Mesa 1) con total correcto
UPDATE prefacturas 
SET total_acumulado = get_total_sesion_actual(id_mesa, id_restaurante)
WHERE id_prefactura = 142;

-- 5. Actualizar prefactura 141 (Mesa 1) con total correcto
UPDATE prefacturas 
SET total_acumulado = get_total_sesion_actual(id_mesa, id_restaurante)
WHERE id_prefactura = 141;

-- 6. Actualizar prefactura 137 (Mesa 3) con total correcto
UPDATE prefacturas 
SET total_acumulado = get_total_sesion_actual(id_mesa, id_restaurante)
WHERE id_prefactura = 137;

-- 7. Actualizar prefactura 134 (Mesa 3) con total correcto
UPDATE prefacturas 
SET total_acumulado = get_total_sesion_actual(id_mesa, id_restaurante)
WHERE id_prefactura = 134;

-- 8. Actualizar prefactura 131 (Mesa 1) con total correcto
UPDATE prefacturas 
SET total_acumulado = get_total_sesion_actual(id_mesa, id_restaurante)
WHERE id_prefactura = 131;

-- 9. Actualizar prefactura 70 (Mesa 1) con total correcto
UPDATE prefacturas 
SET total_acumulado = get_total_sesion_actual(id_mesa, id_restaurante)
WHERE id_prefactura = 70;

-- 10. Crear índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_ventas_fecha_mesa_restaurante 
ON ventas (fecha, id_mesa, id_restaurante, estado);

CREATE INDEX IF NOT EXISTS idx_prefacturas_fecha_apertura 
ON prefacturas (fecha_apertura, id_mesa, estado);

-- 11. Crear vista para pagos diferidos pendientes
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

-- 12. Verificar el resultado final
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
