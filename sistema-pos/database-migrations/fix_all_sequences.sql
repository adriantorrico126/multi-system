-- Script para corregir todas las secuencias desincronizadas
-- Ejecutar este script directamente en la consola de PostgreSQL de DigitalOcean

-- =====================================================
-- CORREGIR TODAS LAS SECUENCIAS DESINCRONIZADAS
-- =====================================================

-- 1. Corregir secuencia de ventas
SELECT setval('ventas_id_venta_seq', COALESCE((SELECT MAX(id_venta) FROM ventas), 0) + 1, false);

-- 2. Corregir secuencia de detalle_ventas
SELECT setval('detalle_ventas_id_detalle_seq', COALESCE((SELECT MAX(id_detalle) FROM detalle_ventas), 0) + 1, false);

-- 3. Corregir secuencia de mesas
SELECT setval('mesas_id_mesa_seq', COALESCE((SELECT MAX(id_mesa) FROM mesas), 0) + 1, false);

-- 4. Corregir secuencia de productos
SELECT setval('productos_id_producto_seq', COALESCE((SELECT MAX(id_producto) FROM productos), 0) + 1, false);

-- 5. Corregir secuencia de vendedores
SELECT setval('vendedores_id_vendedor_seq', COALESCE((SELECT MAX(id_vendedor) FROM vendedores), 0) + 1, false);

-- 6. Corregir secuencia de sucursales
SELECT setval('sucursales_id_sucursal_seq', COALESCE((SELECT MAX(id_sucursal) FROM sucursales), 0) + 1, false);

-- 7. Corregir secuencia de restaurantes
SELECT setval('restaurantes_id_restaurante_seq', COALESCE((SELECT MAX(id_restaurante) FROM restaurantes), 0) + 1, false);

-- 8. Corregir secuencia de metodos_pago
SELECT setval('metodos_pago_id_pago_seq', COALESCE((SELECT MAX(id_pago) FROM metodos_pago), 0) + 1, false);

-- 9. Corregir secuencia de pagos_diferidos
SELECT setval('pagos_diferidos_id_pago_diferido_seq', COALESCE((SELECT MAX(id_pago_diferido) FROM pagos_diferidos), 0) + 1, false);

-- 10. Corregir secuencia de historial_pagos_diferidos
SELECT setval('historial_pagos_diferidos_id_historial_seq', COALESCE((SELECT MAX(id_historial) FROM historial_pagos_diferidos), 0) + 1, false);

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Mostrar estado de las secuencias principales
SELECT 
    'ventas' as tabla,
    last_value as secuencia,
    (SELECT MAX(id_venta) FROM ventas) as maximo_real
FROM ventas_id_venta_seq
UNION ALL
SELECT 
    'detalle_ventas' as tabla,
    last_value as secuencia,
    (SELECT MAX(id_detalle) FROM detalle_ventas) as maximo_real
FROM detalle_ventas_id_detalle_seq
UNION ALL
SELECT 
    'mesas' as tabla,
    last_value as secuencia,
    (SELECT MAX(id_mesa) FROM mesas) as maximo_real
FROM mesas_id_mesa_seq;
