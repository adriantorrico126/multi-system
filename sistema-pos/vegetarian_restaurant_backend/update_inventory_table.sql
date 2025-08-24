-- Script para actualizar la tabla inventario_lotes con el nuevo sistema profesional
-- Ejecutar este script en la base de datos para agregar las columnas faltantes

-- 1. Agregar columna id_categoria_almacen
ALTER TABLE inventario_lotes 
ADD COLUMN IF NOT EXISTS id_categoria_almacen INTEGER DEFAULT 1;

-- 2. Agregar columna ubicacion_especifica
ALTER TABLE inventario_lotes 
ADD COLUMN IF NOT EXISTS ubicacion_especifica VARCHAR(100);

-- 3. Agregar columna proveedor
ALTER TABLE inventario_lotes 
ADD COLUMN IF NOT EXISTS proveedor VARCHAR(100);

-- 4. Agregar columna certificacion_organica
ALTER TABLE inventario_lotes 
ADD COLUMN IF NOT EXISTS certificacion_organica BOOLEAN DEFAULT false;

-- 5. Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_inventario_lotes_categoria 
ON inventario_lotes(id_categoria_almacen);

CREATE INDEX IF NOT EXISTS idx_inventario_lotes_proveedor 
ON inventario_lotes(proveedor);

-- 6. Actualizar los lotes existentes para asignarles una categoría por defecto
UPDATE inventario_lotes 
SET id_categoria_almacen = 1 
WHERE id_categoria_almacen IS NULL;

-- 7. Verificar que las columnas se agregaron correctamente
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'inventario_lotes' 
AND table_schema = 'public'
ORDER BY ordinal_position;
