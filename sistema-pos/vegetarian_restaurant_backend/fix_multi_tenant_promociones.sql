-- Script para corregir la estructura multi-tenant de promociones
-- Agregar id_restaurante a la tabla promociones para soporte multi-tenant

-- 1. Agregar columna id_restaurante a la tabla promociones
ALTER TABLE promociones
  ADD COLUMN IF NOT EXISTS id_restaurante INTEGER;

-- 2. Crear foreign key para id_restaurante
ALTER TABLE promociones
  DROP CONSTRAINT IF EXISTS promociones_id_restaurante_fkey;
ALTER TABLE promociones
  ADD CONSTRAINT promociones_id_restaurante_fkey
    FOREIGN KEY (id_restaurante) REFERENCES restaurantes(id_restaurante) ON DELETE CASCADE;

-- 3. Actualizar los registros existentes con id_restaurante = 1
UPDATE promociones 
SET id_restaurante = 1 
WHERE id_restaurante IS NULL;

-- 4. Hacer id_restaurante NOT NULL
ALTER TABLE promociones
  ALTER COLUMN id_restaurante SET NOT NULL;

-- 5. Crear índice para id_restaurante
CREATE INDEX IF NOT EXISTS idx_promociones_restaurante
  ON promociones(id_restaurante);

-- 6. Corregir la función para usar la nueva estructura
DROP FUNCTION IF EXISTS get_promociones_activas(INTEGER, INTEGER);
DROP FUNCTION IF EXISTS fn_get_promociones_activas(INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION get_promociones_activas(
  p_id_restaurante INTEGER,
  p_id_sucursal INTEGER DEFAULT NULL
)
RETURNS TABLE (
  id_promocion INTEGER,
  nombre VARCHAR,
  tipo VARCHAR,
  valor NUMERIC,
  fecha_inicio DATE,
  fecha_fin DATE,
  id_producto INTEGER,
  nombre_producto VARCHAR,
  estado_promocion VARCHAR
) AS $$
BEGIN
  RETURN QUERY
    SELECT
      p.id_promocion, p.nombre, p.tipo, p.valor,
      p.fecha_inicio, p.fecha_fin, p.id_producto,
      pr.nombre AS nombre_producto,
      CASE
        WHEN p.fecha_inicio <= CURRENT_DATE AND p.fecha_fin >= CURRENT_DATE THEN 'activa'
        WHEN p.fecha_inicio > CURRENT_DATE THEN 'pendiente'
        ELSE 'expirada'
      END AS estado_promocion
    FROM promociones p
    LEFT JOIN productos pr ON p.id_producto = pr.id_producto
    WHERE p.id_restaurante = p_id_restaurante
      AND p.activa = true
      AND p.fecha_inicio <= CURRENT_DATE
      AND p.fecha_fin >= CURRENT_DATE
    ORDER BY p.valor DESC;
END;
$$ LANGUAGE plpgsql;

-- 7. Verificar la estructura actualizada
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'promociones'
ORDER BY ordinal_position;

-- 8. Mostrar estadísticas por restaurante
SELECT 
  p.id_restaurante,
  r.nombre as restaurante_nombre,
  COUNT(*) as total_promociones,
  COUNT(CASE WHEN p.activa = true AND p.fecha_inicio <= CURRENT_DATE AND p.fecha_fin >= CURRENT_DATE THEN 1 END) as activas
FROM promociones p
JOIN restaurantes r ON p.id_restaurante = r.id_restaurante
GROUP BY p.id_restaurante, r.nombre
ORDER BY p.id_restaurante;

-- 9. Mensaje de confirmación
DO $$
BEGIN
  RAISE NOTICE 'Estructura multi-tenant corregida exitosamente.';
  RAISE NOTICE 'Tabla promociones ahora incluye id_restaurante para soporte multi-tenant.';
END $$; 