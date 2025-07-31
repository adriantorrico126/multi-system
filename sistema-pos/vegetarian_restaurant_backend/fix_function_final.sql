-- Script para corregir la función get_promociones_activas
-- Versión corregida para la estructura escalable

-- Eliminar la función si existe
DROP FUNCTION IF EXISTS get_promociones_activas(INTEGER, INTEGER);
DROP FUNCTION IF EXISTS fn_get_promociones_activas(INTEGER, INTEGER);

-- Crear la función corregida para la estructura escalable
CREATE OR REPLACE FUNCTION get_promociones_activas(
  p_id_restaurante INTEGER,
  p_id_sucursal INTEGER DEFAULT NULL
)
RETURNS TABLE (
  id_promocion INTEGER,
  nombre TEXT,
  tipo TEXT,
  valor NUMERIC,
  fecha_inicio DATE,
  fecha_fin DATE,
  id_producto INTEGER,
  nombre_producto TEXT,
  estado_promocion TEXT
) AS $$
BEGIN
  RETURN QUERY
    SELECT
      p.id_promocion, 
      p.nombre::TEXT, 
      p.tipo::TEXT, 
      p.valor,
      p.fecha_inicio, 
      p.fecha_fin, 
      p.id_producto,
      COALESCE(pr.nombre, '')::TEXT AS nombre_producto,
      CASE
        WHEN p.fecha_inicio <= CURRENT_DATE AND p.fecha_fin >= CURRENT_DATE THEN 'activa'
        WHEN p.fecha_inicio > CURRENT_DATE THEN 'pendiente'
        ELSE 'expirada'
      END::TEXT AS estado_promocion
    FROM promociones p
    LEFT JOIN productos pr ON p.id_producto = pr.id_producto
    WHERE p.id_restaurante = p_id_restaurante
      AND p.activa = true
      AND p.fecha_inicio <= CURRENT_DATE
      AND p.fecha_fin >= CURRENT_DATE
      AND (
        p_id_sucursal IS NULL 
        OR EXISTS (
          SELECT 1 FROM promociones_sucursales ps 
          WHERE ps.id_promocion = p.id_promocion 
          AND ps.id_sucursal = p_id_sucursal
        )
      )
    ORDER BY p.valor DESC;
END;
$$ LANGUAGE plpgsql;

-- Probar la función
SELECT * FROM get_promociones_activas(1, NULL) LIMIT 1;

-- Mensaje de confirmación
DO $$
BEGIN
  RAISE NOTICE 'Función get_promociones_activas corregida exitosamente.';
  RAISE NOTICE 'Estructura escalable: promociones + promociones_sucursales';
END $$; 