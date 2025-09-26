-- ===============================================
-- COMPLETAR MIGRACIÓN: metodos_pago globales
-- ===============================================

BEGIN;

-- 1. Verificar estado actual
SELECT 'ESTADO ACTUAL:' as info;
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name LIKE '%metodos_pago%'
ORDER BY table_name;

-- 2. Si existe metodos_pago_backup, usar esos datos
-- Si existe metodos_pago, renombrar a backup
DO $$
BEGIN
    -- Si existe metodos_pago y no existe backup, crear backup
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'metodos_pago') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'metodos_pago_backup') THEN
        ALTER TABLE metodos_pago RENAME TO metodos_pago_backup;
        RAISE NOTICE 'Tabla metodos_pago renombrada a metodos_pago_backup';
    END IF;
    
    -- Si no existe ninguna tabla, crear desde cero
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'metodos_pago') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'metodos_pago_backup') THEN
        CREATE TABLE metodos_pago_backup (
            id_pago SERIAL PRIMARY KEY,
            descripcion VARCHAR(100) NOT NULL,
            activo BOOLEAN DEFAULT true,
            id_restaurante INTEGER,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );
        
        -- Insertar métodos básicos
        INSERT INTO metodos_pago_backup (descripcion, activo, id_restaurante) VALUES
        ('Efectivo', true, 1),
        ('Tarjeta de Crédito', true, 1),
        ('Tarjeta de Débito', true, 1),
        ('Transferencia', true, 1),
        ('Pago Móvil', true, 1),
        ('Pago Diferido', true, 1);
        
        RAISE NOTICE 'Tabla backup creada con métodos básicos';
    END IF;
END $$;

-- 3. Crear tabla temporal con métodos únicos globales desde backup
DROP TABLE IF EXISTS metodos_pago_globales;
CREATE TEMP TABLE metodos_pago_globales AS
SELECT DISTINCT ON (descripcion)
    descripcion,
    CASE 
        WHEN descripcion IN ('Efectivo', 'Tarjeta de Crédito', 'Tarjeta de Débito', 'Transferencia', 'Pago Móvil') 
        THEN true 
        ELSE false 
    END as activo
FROM metodos_pago_backup
WHERE descripcion NOT LIKE '%Diferido%'
ORDER BY descripcion, activo DESC;

-- 4. Agregar métodos que faltan
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

-- 5. Mostrar métodos globales creados
SELECT 'MÉTODOS GLOBALES CREADOS:' as info;
SELECT ROW_NUMBER() OVER (ORDER BY descripcion) as id_pago, descripcion, activo 
FROM metodos_pago_globales 
ORDER BY descripcion;

-- 6. Crear tabla de mapeo de IDs antiguos a nuevos
DROP TABLE IF EXISTS mapeo_ids;
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
FROM metodos_pago_backup mp
JOIN nuevos_ids ni ON mp.descripcion = ni.descripcion;

-- 7. Mostrar el mapeo
SELECT 'MAPEO DE IDs:' as info;
SELECT id_antiguo, id_nuevo, descripcion FROM mapeo_ids ORDER BY id_nuevo;

-- 8. Actualizar referencias en ventas
UPDATE ventas 
SET id_pago = m.id_nuevo
FROM mapeo_ids m
WHERE ventas.id_pago = m.id_antiguo;

-- 9. Mostrar cuántas ventas se actualizaron
SELECT 'VENTAS ACTUALIZADAS:' as info, COUNT(*) as total FROM ventas;

-- 10. Crear nueva tabla sin id_restaurante
DROP TABLE IF EXISTS metodos_pago;
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

COMMIT;

-- ===============================================
-- MIGRACIÓN COMPLETADA
-- ===============================================
