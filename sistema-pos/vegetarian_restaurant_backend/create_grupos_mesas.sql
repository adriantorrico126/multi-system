-- Script para actualizar la tabla grupos_mesas existente
-- Ejecutar en PostgreSQL para agregar soporte para meseros

-- Agregar columna id_mesero a la tabla grupos_mesas si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'grupos_mesas' 
        AND column_name = 'id_mesero'
    ) THEN
        ALTER TABLE grupos_mesas ADD COLUMN id_mesero INTEGER;
        RAISE NOTICE 'Columna id_mesero agregada a grupos_mesas';
    ELSE
        RAISE NOTICE 'La columna id_mesero ya existe en grupos_mesas';
    END IF;
END $$;

-- Agregar la restricción de clave foránea para id_mesero si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_grupos_mesas_mesero' 
        AND table_name = 'grupos_mesas'
    ) THEN
        ALTER TABLE grupos_mesas ADD CONSTRAINT fk_grupos_mesas_mesero 
            FOREIGN KEY (id_mesero) REFERENCES vendedores(id_vendedor) ON DELETE CASCADE;
        RAISE NOTICE 'Restricción de clave foránea agregada para id_mesero';
    ELSE
        RAISE NOTICE 'La restricción de clave foránea para id_mesero ya existe';
    END IF;
END $$;

-- Agregar columna id_grupo_mesa a la tabla mesas si no existe
ALTER TABLE mesas ADD COLUMN IF NOT EXISTS id_grupo_mesa INTEGER;

-- Agregar la restricción de clave foránea para id_grupo_mesa si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_mesas_grupo_mesa' 
        AND table_name = 'mesas'
    ) THEN
        ALTER TABLE mesas ADD CONSTRAINT fk_mesas_grupo_mesa 
            FOREIGN KEY (id_grupo_mesa) REFERENCES grupos_mesas(id_grupo_mesa) ON DELETE SET NULL;
        RAISE NOTICE 'Restricción de clave foránea agregada para id_grupo_mesa';
    ELSE
        RAISE NOTICE 'La restricción de clave foránea para id_grupo_mesa ya existe';
    END IF;
END $$;

-- Crear índices para mejorar performance si no existen
CREATE INDEX IF NOT EXISTS idx_grupos_mesas_restaurante ON grupos_mesas(id_restaurante);
CREATE INDEX IF NOT EXISTS idx_grupos_mesas_sucursal ON grupos_mesas(id_sucursal);
CREATE INDEX IF NOT EXISTS idx_grupos_mesas_mesero ON grupos_mesas(id_mesero);
CREATE INDEX IF NOT EXISTS idx_grupos_mesas_estado ON grupos_mesas(estado);
CREATE INDEX IF NOT EXISTS idx_mesas_en_grupo_grupo ON mesas_en_grupo(id_grupo_mesa);
CREATE INDEX IF NOT EXISTS idx_mesas_en_grupo_mesa ON mesas_en_grupo(id_mesa);
CREATE INDEX IF NOT EXISTS idx_mesas_grupo_mesa ON mesas(id_grupo_mesa);

-- Crear función para actualizar updated_at si no existe
CREATE OR REPLACE FUNCTION update_grupos_mesas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear trigger para actualizar updated_at si no existe
DROP TRIGGER IF EXISTS update_grupos_mesas_updated_at ON grupos_mesas;
CREATE TRIGGER update_grupos_mesas_updated_at 
    BEFORE UPDATE ON grupos_mesas 
    FOR EACH ROW 
    EXECUTE FUNCTION update_grupos_mesas_updated_at();

-- Verificar que las modificaciones se aplicaron correctamente
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('grupos_mesas', 'mesas_en_grupo', 'mesas')
AND column_name IN ('id_mesero', 'id_grupo_mesa')
ORDER BY table_name, column_name; 