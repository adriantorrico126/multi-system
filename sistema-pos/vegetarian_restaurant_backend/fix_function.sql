-- Script para corregir la función get_promociones_activas

-- Eliminar la función si existe
DROP FUNCTION IF EXISTS get_promociones_activas(INTEGER, INTEGER);
DROP FUNCTION IF EXISTS fn_get_promociones_activas(INTEGER, INTEGER);

-- Crear la función corregida
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
    JOIN promociones_sucursales ps ON p.id_promocion = ps.id_promocion
    LEFT JOIN productos pr ON p.id_producto = pr.id_producto
    WHERE ps.id_restaurante = p_id_restaurante
      AND (ps.id_sucursal IS NULL OR ps.id_sucursal = p_id_sucursal)
      AND p.activa = true
      AND p.fecha_inicio <= CURRENT_DATE
      AND p.fecha_fin >= CURRENT_DATE
    ORDER BY p.valor DESC;
END;
$$ LANGUAGE plpgsql;

-- Probar la función
SELECT * FROM get_promociones_activas(1, NULL) LIMIT 1;

-- Mensaje de confirmación
DO $$
BEGIN
  RAISE NOTICE 'Función get_promociones_activas corregida exitosamente.';
END $$; 