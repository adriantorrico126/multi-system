-- Script para actualizar el total acumulado de todas las mesas
-- Incluye ventas con estado 'abierta', 'en_uso', 'pendiente_cobro' y 'entregado'

UPDATE mesas m
SET total_acumulado = COALESCE((
    SELECT SUM(dv.subtotal)
    FROM ventas v
    JOIN detalle_ventas dv ON dv.id_venta = v.id_venta
    WHERE v.id_sucursal = m.id_sucursal
      AND v.mesa_numero = m.numero
      AND v.estado IN ('abierta', 'en_uso', 'pendiente_cobro', 'entregado')
), 0);

-- Verificar el resultado
SELECT 
    m.id_mesa,
    m.numero,
    m.id_sucursal,
    m.estado,
    m.total_acumulado,
    COUNT(v.id_venta) as ventas_activas,
    SUM(v.total) as total_ventas
FROM mesas m
LEFT JOIN ventas v ON v.mesa_numero = m.numero 
    AND v.id_sucursal = m.id_sucursal 
    AND v.estado IN ('abierta', 'en_uso', 'pendiente_cobro', 'entregado')
GROUP BY m.id_mesa, m.numero, m.id_sucursal, m.estado, m.total_acumulado
ORDER BY m.id_sucursal, m.numero; 