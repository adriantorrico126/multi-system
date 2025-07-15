-- Script para inicializar las mesas en la base de datos
-- Ejecutar en PostgreSQL después de crear las tablas

-- Asegurar que existe la columna updated_at
ALTER TABLE mesas ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Crear función para actualizar updated_at si no existe
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear trigger para actualizar updated_at si no existe
DROP TRIGGER IF EXISTS update_mesas_updated_at ON mesas;
CREATE TRIGGER update_mesas_updated_at 
    BEFORE UPDATE ON mesas 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Obtener la primera sucursal para asignar las mesas
DO $$
DECLARE
    sucursal_id INTEGER;
BEGIN
    -- Obtener el ID de la primera sucursal
    SELECT id_sucursal INTO sucursal_id FROM sucursales LIMIT 1;
    
    -- Si no hay sucursales, crear una por defecto
    IF sucursal_id IS NULL THEN
        INSERT INTO sucursales (nombre, ciudad, direccion) 
        VALUES ('Sucursal Principal', 'Caracas', 'Dirección Principal')
        RETURNING id_sucursal INTO sucursal_id;
    END IF;
    
    -- Insertar mesas de ejemplo si no existen
    INSERT INTO mesas (numero, id_sucursal, capacidad, estado, created_at, updated_at) 
    VALUES 
        (1, sucursal_id, 4, 'libre', NOW(), NOW()),
        (2, sucursal_id, 4, 'libre', NOW(), NOW()),
        (3, sucursal_id, 6, 'libre', NOW(), NOW()),
        (4, sucursal_id, 4, 'libre', NOW(), NOW()),
        (5, sucursal_id, 6, 'libre', NOW(), NOW()),
        (6, sucursal_id, 4, 'libre', NOW(), NOW()),
        (7, sucursal_id, 8, 'libre', NOW(), NOW()),
        (8, sucursal_id, 4, 'libre', NOW(), NOW()),
        (9, sucursal_id, 6, 'libre', NOW(), NOW()),
        (10, sucursal_id, 4, 'libre', NOW(), NOW())
    ON CONFLICT (numero, id_sucursal) DO NOTHING;
    
    RAISE NOTICE 'Mesas inicializadas para la sucursal ID: %', sucursal_id;
END $$;

-- Verificar que las mesas se crearon correctamente
SELECT 
    m.numero,
    m.capacidad,
    m.estado,
    s.nombre as sucursal,
    m.created_at,
    m.updated_at
FROM mesas m
JOIN sucursales s ON m.id_sucursal = s.id_sucursal
ORDER BY m.numero; 