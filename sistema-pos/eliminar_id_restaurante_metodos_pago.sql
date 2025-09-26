-- ===============================================
-- SCRIPT: Eliminar id_restaurante de metodos_pago
-- ===============================================
-- Este script convierte los métodos de pago de específicos por restaurante
-- a métodos globales que pueden ser usados por todos los restaurantes

BEGIN;

-- 1. Crear tabla temporal con métodos únicos globales
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

-- 2. Agregar métodos que faltan
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

-- 3. Crear tabla de mapeo de IDs antiguos a nuevos
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

-- 4. Mostrar el mapeo antes de aplicar cambios
SELECT 'Mapeo de IDs:' as info;
SELECT id_antiguo, id_nuevo, descripcion FROM mapeo_ids ORDER BY id_nuevo;

-- 5. Actualizar referencias en ventas
UPDATE ventas 
SET id_pago = m.id_nuevo
FROM mapeo_ids m
WHERE ventas.id_pago = m.id_antiguo;

-- 6. Mostrar cuántas ventas se actualizaron
SELECT 'Ventas actualizadas:' as info, COUNT(*) as total FROM ventas;

-- 7. Crear backup de la tabla original
DROP TABLE IF EXISTS metodos_pago_backup;
ALTER TABLE metodos_pago RENAME TO metodos_pago_backup;

-- 8. Crear nueva tabla sin id_restaurante
CREATE TABLE metodos_pago (
    id_pago SERIAL PRIMARY KEY,
    descripcion VARCHAR(100) NOT NULL UNIQUE,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 9. Insertar métodos globales
INSERT INTO metodos_pago (id_pago, descripcion, activo)
SELECT 
    ROW_NUMBER() OVER (ORDER BY descripcion) as id_pago,
    descripcion,
    activo
FROM metodos_pago_globales;

-- 10. Actualizar secuencia
SELECT setval('metodos_pago_id_pago_seq', (SELECT MAX(id_pago) FROM metodos_pago));

-- 11. Verificar resultado final
SELECT 'MÉTODOS DE PAGO FINALES:' as resultado;
SELECT id_pago, descripcion, activo FROM metodos_pago ORDER BY id_pago;

-- 12. Verificar que las ventas siguen funcionando
SELECT 'VENTAS POR MÉTODO DE PAGO:' as resultado;
SELECT 
    v.id_restaurante,
    mp.descripcion,
    COUNT(*) as total_ventas
FROM ventas v
JOIN metodos_pago mp ON v.id_pago = mp.id_pago
GROUP BY v.id_restaurante, mp.descripcion
ORDER BY v.id_restaurante, mp.descripcion;

-- 13. Mostrar resumen de cambios
SELECT 'RESUMEN DE CAMBIOS:' as resultado;
SELECT 
    'Tabla original' as tabla,
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
-- INSTRUCCIONES POST-EJECUCIÓN
-- ===============================================
-- 1. Reiniciar el backend para cargar las nuevas rutas
-- 2. Verificar que el frontend funcione correctamente
-- 3. La tabla backup está disponible como metodos_pago_backup
-- 4. Los métodos de pago ahora son globales para todos los restaurantes
