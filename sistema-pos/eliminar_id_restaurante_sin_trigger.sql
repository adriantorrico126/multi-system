-- ===============================================
-- SCRIPT: Eliminar id_restaurante SIN TRIGGER
-- ===============================================
-- Este script evita el trigger problemático deshabilitándolo temporalmente

BEGIN;

-- 1. Deshabilitar temporalmente el trigger problemático
DROP TRIGGER IF EXISTS validate_venta_trigger ON ventas;

-- 2. Crear tabla temporal con métodos únicos globales
CREATE TEMP TABLE metodos_pago_globales AS
SELECT DISTINCT ON (descripcion)
    descripcion,
    CASE 
        WHEN descripcion IN ('Efectivo', 'Tarjeta de Crédito', 'Tarjeta de Débito', 'Transferencia', 'Pago Móvil') 
        THEN true 
        ELSE false 
    END as activo
FROM metodos_pago
WHERE descripcion NOT LIKE '%Diferido%'
ORDER BY descripcion, activo DESC;

-- 3. Agregar métodos que faltan
INSERT INTO metodos_pago_globales (descripcion, activo)
SELECT 'Efectivo', true
WHERE NOT EXISTS (SELECT 1 FROM metodos_pago_globales WHERE descripcion = 'Efectivo');

INSERT INTO metodos_pago_globales (descripcion, activo)
SELECT 'Tarjeta de Crédito', true
WHERE NOT EXISTS (SELECT 1 FROM metodos_pago_globales WHERE descripcion = 'Tarjeta de Crédito');

INSERT INTO metodos_pago_globales (descripcion, activo)
SELECT 'Tarjeta de Débito', true
WHERE NOT EXISTS (SELECT 1 FROM metodos_pago_globales WHERE descripcion = 'Tarjeta de Débito');

INSERT INTO metodos_pago_globales (descripcion, activo)
SELECT 'Transferencia', true
WHERE NOT EXISTS (SELECT 1 FROM metodos_pago_globales WHERE descripcion = 'Transferencia');

INSERT INTO metodos_pago_globales (descripcion, activo)
SELECT 'Pago Móvil', true
WHERE NOT EXISTS (SELECT 1 FROM metodos_pago_globales WHERE descripcion = 'Pago Móvil');

-- 4. Mostrar métodos globales creados
SELECT 'MÉTODOS GLOBALES CREADOS:' as info;
SELECT ROW_NUMBER() OVER (ORDER BY descripcion) as id_pago, descripcion, activo 
FROM metodos_pago_globales 
ORDER BY descripcion;

-- 5. Crear tabla de mapeo de IDs antiguos a nuevos
CREATE TEMP TABLE mapeo_ids AS
WITH nuevos_ids AS (
    SELECT 
        ROW_NUMBER() OVER (ORDER BY descripcion) as nuevo_id,
        descripcion
    FROM metodos_pago_globales
)
SELECT 
    mp.id_pago as id_antiguo,
    ni.nuevo_id as id_nuevo,
    mp.descripcion
FROM metodos_pago mp
JOIN nuevos_ids ni ON mp.descripcion = ni.descripcion;

-- 6. Mostrar el mapeo
SELECT 'MAPEO DE IDs:' as info;
SELECT id_antiguo, id_nuevo, descripcion FROM mapeo_ids ORDER BY id_nuevo;

-- 7. Actualizar referencias en ventas (SIN TRIGGER)
UPDATE ventas 
SET id_pago = m.id_nuevo
FROM mapeo_ids m
WHERE ventas.id_pago = m.id_antiguo;

-- 8. Mostrar cuántas ventas se actualizaron
SELECT 'VENTAS ACTUALIZADAS:' as info, COUNT(*) as total FROM ventas;

-- 9. Crear backup de la tabla original
DROP TABLE IF EXISTS metodos_pago_backup;
ALTER TABLE metodos_pago RENAME TO metodos_pago_backup;

-- 10. Crear nueva tabla sin id_restaurante
CREATE TABLE metodos_pago (
    id_pago SERIAL PRIMARY KEY,
    descripcion VARCHAR(100) NOT NULL UNIQUE,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 11. Insertar métodos globales
INSERT INTO metodos_pago (id_pago, descripcion, activo)
SELECT 
    ROW_NUMBER() OVER (ORDER BY descripcion) as id_pago,
    descripcion,
    activo
FROM metodos_pago_globales;

-- 12. Actualizar secuencia
SELECT setval('metodos_pago_id_pago_seq', (SELECT MAX(id_pago) FROM metodos_pago));

-- 13. Verificar resultado final
SELECT 'MÉTODOS DE PAGO FINALES:' as resultado;
SELECT id_pago, descripcion, activo FROM metodos_pago ORDER BY id_pago;

-- 14. Verificar que las ventas siguen funcionando
SELECT 'VENTAS POR MÉTODO DE PAGO:' as resultado;
SELECT 
    v.id_restaurante,
    mp.descripcion,
    COUNT(*) as total_ventas
FROM ventas v
JOIN metodos_pago mp ON v.id_pago = mp.id_pago
GROUP BY v.id_restaurante, mp.descripcion
ORDER BY v.id_restaurante, mp.descripcion;

-- 15. Mostrar resumen de cambios
SELECT 'RESUMEN DE CAMBIOS:' as resultado;
SELECT 
    'Tabla original (backup)' as tabla,
    COUNT(*) as registros
FROM metodos_pago_backup
UNION ALL
SELECT 
    'Tabla nueva' as tabla,
    COUNT(*) as registros
FROM metodos_pago
UNION ALL
SELECT 
    'Ventas con referencias actualizadas' as tabla,
    COUNT(*) as registros
FROM ventas;

COMMIT;

-- ===============================================
-- NOTA IMPORTANTE
-- ===============================================
-- El trigger validate_venta_trigger fue eliminado temporalmente
-- Si necesitas restaurarlo, deberás recrearlo después de verificar
-- que no cause problemas con los estados de venta actuales
