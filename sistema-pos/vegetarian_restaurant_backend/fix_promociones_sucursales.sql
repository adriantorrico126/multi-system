-- Script para corregir la tabla promociones_sucursales
-- Eliminar la columna id_restaurante que no es necesaria en la tabla relacional

-- 1. Eliminar la tabla promociones_sucursales si existe
DROP TABLE IF EXISTS promociones_sucursales CASCADE;

-- 2. Crear la tabla promociones_sucursales correcta
CREATE TABLE promociones_sucursales (
  id_relacion      SERIAL PRIMARY KEY,
  id_promocion     INTEGER NOT NULL,
  id_sucursal      INTEGER NOT NULL,
  aplicada_en      TIMESTAMP DEFAULT now(),
  
  -- Foreign keys
  CONSTRAINT fk_promociones_sucursales_promocion
    FOREIGN KEY (id_promocion) REFERENCES promociones(id_promocion) ON DELETE CASCADE,
  CONSTRAINT fk_promociones_sucursales_sucursal
    FOREIGN KEY (id_sucursal) REFERENCES sucursales(id_sucursal) ON DELETE CASCADE,
  
  -- Evitar duplicados
  CONSTRAINT unique_promocion_sucursal
    UNIQUE (id_promocion, id_sucursal)
);

-- 3. Crear índices para rendimiento
CREATE INDEX IF NOT EXISTS idx_ps_promocion
  ON promociones_sucursales(id_promocion);

CREATE INDEX IF NOT EXISTS idx_ps_sucursal
  ON promociones_sucursales(id_sucursal);

-- 4. Verificar la estructura
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'promociones_sucursales'
ORDER BY ordinal_position;

-- 5. Mensaje de confirmación
DO $$
BEGIN
  RAISE NOTICE 'Tabla promociones_sucursales corregida exitosamente.';
  RAISE NOTICE 'Estructura: id_relacion, id_promocion, id_sucursal, aplicada_en';
END $$; 