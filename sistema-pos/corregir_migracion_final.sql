-- ===============================================
-- CORREGIR MIGRACIÓN FINAL
-- ===============================================

BEGIN;

-- 1. Eliminar tabla metodos_pago vacía
DROP TABLE IF EXISTS metodos_pago;

-- 2. Crear nueva tabla metodos_pago sin id_restaurante
CREATE TABLE metodos_pago (
    id_pago SERIAL PRIMARY KEY,
    descripcion VARCHAR(100) NOT NULL UNIQUE,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. Insertar métodos desde backup, eliminando duplicados
INSERT INTO metodos_pago (descripcion, activo)
SELECT DISTINCT descripcion, activo
FROM metodos_pago_backup
WHERE descripcion NOT LIKE '%Diferido%'
ORDER BY descripcion;

-- 4. Agregar métodos que faltan
INSERT INTO metodos_pago (descripcion, activo)
SELECT 'Efectivo', true
WHERE NOT EXISTS (SELECT 1 FROM metodos_pago WHERE descripcion = 'Efectivo');

INSERT INTO metodos_pago (descripcion, activo)
SELECT 'Tarjeta de Crédito', true
WHERE NOT EXISTS (SELECT 1 FROM metodos_pago WHERE descripcion = 'Tarjeta de Crédito');

INSERT INTO metodos_pago (descripcion, activo)
SELECT 'Tarjeta de Débito', true
WHERE NOT EXISTS (SELECT 1 FROM metodos_pago WHERE descripcion = 'Tarjeta de Débito');

INSERT INTO metodos_pago (descripcion, activo)
SELECT 'Transferencia', true
WHERE NOT EXISTS (SELECT 1 FROM metodos_pago WHERE descripcion = 'Transferencia');

INSERT INTO metodos_pago (descripcion, activo)
SELECT 'Pago Móvil', true
WHERE NOT EXISTS (SELECT 1 FROM metodos_pago WHERE descripcion = 'Pago Móvil');

-- 5. Actualizar secuencia
SELECT setval('metodos_pago_id_pago_seq', (SELECT MAX(id_pago) FROM metodos_pago));

-- 6. Crear mapeo de IDs antiguos a nuevos
CREATE TEMP TABLE mapeo_final AS
SELECT 
    mpb.id_pago as id_antiguo,
    mp.id_pago as id_nuevo,
    mp.descripcion
FROM metodos_pago_backup mpb
JOIN metodos_pago mp ON mpb.descripcion = mp.descripcion;

-- 7. Mostrar mapeo
SELECT 'MAPEO FINAL:' as info;
SELECT id_antiguo, id_nuevo, descripcion FROM mapeo_final ORDER BY id_nuevo;

-- 8. Actualizar referencias en ventas
UPDATE ventas 
SET id_pago = m.id_nuevo
FROM mapeo_final m
WHERE ventas.id_pago = m.id_antiguo;

-- 9. Verificar resultado final
SELECT 'MÉTODOS DE PAGO FINALES:' as resultado;
SELECT id_pago, descripcion, activo FROM metodos_pago ORDER BY id_pago;

-- 10. Verificar ventas actualizadas
SELECT 'VENTAS ACTUALIZADAS:' as resultado;
SELECT 
    v.id_restaurante,
    mp.descripcion,
    COUNT(*) as total_ventas
FROM ventas v
JOIN metodos_pago mp ON v.id_pago = mp.id_pago
GROUP BY v.id_restaurante, mp.descripcion
ORDER BY v.id_restaurante, mp.descripcion;

-- 11. Resumen final
SELECT 'RESUMEN FINAL:' as resultado;
SELECT 
    'metodos_pago' as tabla,
    COUNT(*) as registros
FROM metodos_pago
UNION ALL
SELECT 
    'metodos_pago_backup' as tabla,
    COUNT(*) as registros
FROM metodos_pago_backup
UNION ALL
SELECT 
    'ventas_con_referencias' as tabla,
    COUNT(*) as registros
FROM ventas v
JOIN metodos_pago mp ON v.id_pago = mp.id_pago;

COMMIT;
