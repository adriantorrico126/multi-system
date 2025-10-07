-- Script corregido para actualizar el sistema de promociones con funcionalidades avanzadas
-- Incluye soporte para horarios, límites, códigos y analytics

-- 1. Agregar nuevas columnas a la tabla promociones
ALTER TABLE promociones 
ADD COLUMN IF NOT EXISTS descripcion TEXT,
ADD COLUMN IF NOT EXISTS hora_inicio TIME DEFAULT '00:00:00',
ADD COLUMN IF NOT EXISTS hora_fin TIME DEFAULT '23:59:59',
ADD COLUMN IF NOT EXISTS aplicar_horarios BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS limite_usos INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS limite_usos_por_cliente INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS monto_minimo NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS monto_maximo NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS productos_minimos INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS productos_maximos INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS destacada BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS requiere_codigo BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS codigo_promocion VARCHAR(50),
ADD COLUMN IF NOT EXISTS objetivo_ventas INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS objetivo_ingresos NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS categoria_objetivo VARCHAR(100),
ADD COLUMN IF NOT EXISTS segmento_cliente VARCHAR(50) DEFAULT 'todos',
ADD COLUMN IF NOT EXISTS actualizada_en TIMESTAMP DEFAULT now();

-- 2. Actualizar constraint de tipos para incluir nuevos tipos
ALTER TABLE promociones
DROP CONSTRAINT IF EXISTS chk_tipo_promocion;
ALTER TABLE promociones
ADD CONSTRAINT chk_tipo_promocion
  CHECK (tipo IN ('porcentaje', 'monto_fijo', 'precio_fijo', 'x_uno_gratis', 'combo', 'fijo'));

-- 3. Agregar constraint para segmento de cliente
ALTER TABLE promociones
DROP CONSTRAINT IF EXISTS chk_segmento_cliente;
ALTER TABLE promociones
ADD CONSTRAINT chk_segmento_cliente
  CHECK (segmento_cliente IN ('todos', 'nuevos', 'recurrentes', 'vip'));

-- 4. Agregar constraint para horarios
ALTER TABLE promociones
DROP CONSTRAINT IF EXISTS chk_horarios_promocion;
ALTER TABLE promociones
ADD CONSTRAINT chk_horarios_promocion
  CHECK (hora_fin >= hora_inicio);

-- 5. Crear índices para optimización
CREATE INDEX IF NOT EXISTS idx_promociones_codigo ON promociones(codigo_promocion);
CREATE INDEX IF NOT EXISTS idx_promociones_horarios ON promociones(aplicar_horarios, hora_inicio, hora_fin);
CREATE INDEX IF NOT EXISTS idx_promociones_destacada ON promociones(destacada);
CREATE INDEX IF NOT EXISTS idx_promociones_segmento ON promociones(segmento_cliente);
CREATE INDEX IF NOT EXISTS idx_promociones_actualizada ON promociones(actualizada_en);

-- 6. Crear tabla para tracking de uso de promociones
CREATE TABLE IF NOT EXISTS promociones_uso (
  id_uso SERIAL PRIMARY KEY,
  id_promocion INTEGER NOT NULL,
  id_venta INTEGER,
  id_cliente INTEGER,
  id_sucursal INTEGER NOT NULL,
  id_restaurante INTEGER NOT NULL,
  usado_en TIMESTAMP DEFAULT now(),
  monto_descuento NUMERIC(10,2) DEFAULT 0,
  monto_venta NUMERIC(10,2) DEFAULT 0,
  FOREIGN KEY (id_promocion) REFERENCES promociones(id_promocion) ON DELETE CASCADE,
  FOREIGN KEY (id_venta) REFERENCES ventas(id_venta) ON DELETE SET NULL,
  FOREIGN KEY (id_sucursal) REFERENCES sucursales(id_sucursal) ON DELETE CASCADE,
  FOREIGN KEY (id_restaurante) REFERENCES restaurantes(id_restaurante) ON DELETE CASCADE
);

-- 7. Crear índices para la tabla de uso
CREATE INDEX IF NOT EXISTS idx_promociones_uso_promocion ON promociones_uso(id_promocion);
CREATE INDEX IF NOT EXISTS idx_promociones_uso_venta ON promociones_uso(id_venta);
CREATE INDEX IF NOT EXISTS idx_promociones_uso_cliente ON promociones_uso(id_cliente);
CREATE INDEX IF NOT EXISTS idx_promociones_uso_fecha ON promociones_uso(usado_en);
CREATE INDEX IF NOT EXISTS idx_promociones_uso_sucursal ON promociones_uso(id_sucursal, id_restaurante);

-- 8. Función simplificada para verificar si una promoción es válida
CREATE OR REPLACE FUNCTION fn_promocion_valida(
  p_id_promocion INTEGER,
  p_id_sucursal INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  promocion_record RECORD;
  hora_actual TIME;
  fecha_actual DATE;
BEGIN
  -- Obtener datos de la promoción
  SELECT * INTO promocion_record
  FROM promociones
  WHERE id_promocion = p_id_promocion
    AND activa = true;
  
  -- Si no existe la promoción, retornar false
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Obtener fecha y hora actual
  fecha_actual := CURRENT_DATE;
  hora_actual := CURRENT_TIME;
  
  -- Verificar fechas
  IF fecha_actual < promocion_record.fecha_inicio OR fecha_actual > promocion_record.fecha_fin THEN
    RETURN false;
  END IF;
  
  -- Verificar horarios si están habilitados
  IF promocion_record.aplicar_horarios THEN
    IF hora_actual < promocion_record.hora_inicio OR hora_actual > promocion_record.hora_fin THEN
      RETURN false;
    END IF;
  END IF;
  
  -- Verificar límite de usos si está establecido
  IF promocion_record.limite_usos > 0 THEN
    IF (SELECT COUNT(*) FROM promociones_uso WHERE id_promocion = p_id_promocion) >= promocion_record.limite_usos THEN
      RETURN false;
    END IF;
  END IF;
  
  -- Verificar asignación a sucursal si se especifica
  IF p_id_sucursal IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM promociones_sucursales 
      WHERE id_promocion = p_id_promocion 
        AND id_sucursal = p_id_sucursal
    ) THEN
      RETURN false;
    END IF;
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- 9. Función simplificada para obtener promociones activas
CREATE OR REPLACE FUNCTION fn_get_promociones_activas_avanzadas(
  p_id_restaurante INTEGER,
  p_id_sucursal INTEGER
)
RETURNS TABLE (
  id_promocion INTEGER,
  nombre VARCHAR,
  descripcion TEXT,
  tipo VARCHAR,
  valor NUMERIC,
  fecha_inicio DATE,
  fecha_fin DATE,
  hora_inicio TIME,
  hora_fin TIME,
  aplicar_horarios BOOLEAN,
  id_producto INTEGER,
  nombre_producto VARCHAR,
  precio_original NUMERIC,
  estado_promocion VARCHAR,
  limite_usos INTEGER,
  limite_usos_por_cliente INTEGER,
  monto_minimo NUMERIC,
  monto_maximo NUMERIC,
  destacada BOOLEAN,
  requiere_codigo BOOLEAN,
  codigo_promocion VARCHAR,
  segmento_cliente VARCHAR,
  usos_actuales INTEGER,
  usos_disponibles INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id_promocion,
    p.nombre,
    p.descripcion,
    p.tipo,
    p.valor,
    p.fecha_inicio,
    p.fecha_fin,
    p.hora_inicio,
    p.hora_fin,
    p.aplicar_horarios,
    p.id_producto,
    pr.nombre AS nombre_producto,
    pr.precio AS precio_original,
    CASE
      WHEN p.fecha_inicio <= CURRENT_DATE AND p.fecha_fin >= CURRENT_DATE THEN
        CASE
          WHEN p.aplicar_horarios THEN
            CASE
              WHEN CURRENT_TIME >= p.hora_inicio AND CURRENT_TIME <= p.hora_fin THEN 'activa'
              ELSE 'fuera_horario'
            END
          ELSE 'activa'
        END
      WHEN p.fecha_inicio > CURRENT_DATE THEN 'pendiente'
      ELSE 'expirada'
    END AS estado_promocion,
    p.limite_usos,
    p.limite_usos_por_cliente,
    p.monto_minimo,
    p.monto_maximo,
    p.destacada,
    p.requiere_codigo,
    p.codigo_promocion,
    p.segmento_cliente,
    COALESCE(u.usos_actuales, 0) AS usos_actuales,
    CASE
      WHEN p.limite_usos = 0 THEN 999999
      ELSE p.limite_usos - COALESCE(u.usos_actuales, 0)
    END AS usos_disponibles
  FROM promociones p
  LEFT JOIN productos pr ON p.id_producto = pr.id_producto
  LEFT JOIN (
    SELECT 
      id_promocion,
      COUNT(*) as usos_actuales
    FROM promociones_uso
    GROUP BY id_promocion
  ) u ON p.id_promocion = u.id_promocion
  WHERE p.id_restaurante = p_id_restaurante
    AND p.activa = true
    AND (
      p_id_sucursal IS NULL OR
      EXISTS (
        SELECT 1 FROM promociones_sucursales ps
        WHERE ps.id_promocion = p.id_promocion
          AND ps.id_sucursal = p_id_sucursal
      )
    )
  ORDER BY p.destacada DESC, p.valor DESC;
END;
$$ LANGUAGE plpgsql;

-- 10. Función para registrar uso de promoción
CREATE OR REPLACE FUNCTION fn_registrar_uso_promocion(
  p_id_promocion INTEGER,
  p_id_venta INTEGER,
  p_id_cliente INTEGER,
  p_id_sucursal INTEGER,
  p_id_restaurante INTEGER,
  p_monto_descuento NUMERIC,
  p_monto_venta NUMERIC
)
RETURNS INTEGER AS $$
DECLARE
  id_uso_generado INTEGER;
BEGIN
  INSERT INTO promociones_uso (
    id_promocion,
    id_venta,
    id_cliente,
    id_sucursal,
    id_restaurante,
    monto_descuento,
    monto_venta
  ) VALUES (
    p_id_promocion,
    p_id_venta,
    p_id_cliente,
    p_id_sucursal,
    p_id_restaurante,
    p_monto_descuento,
    p_monto_venta
  ) RETURNING id_uso INTO id_uso_generado;
  
  RETURN id_uso_generado;
END;
$$ LANGUAGE plpgsql;

-- 11. Vista para analytics de promociones
CREATE OR REPLACE VIEW v_promociones_analytics AS
SELECT
  p.id_promocion,
  p.nombre,
  p.tipo,
  p.valor,
  p.fecha_inicio,
  p.fecha_fin,
  CASE
    WHEN p.fecha_inicio <= CURRENT_DATE AND p.fecha_fin >= CURRENT_DATE THEN 'activa'
    WHEN p.fecha_inicio > CURRENT_DATE THEN 'pendiente'
    ELSE 'expirada'
  END as estado_promocion,
  p.destacada,
  p.segmento_cliente,
  COUNT(u.id_uso) as total_usos,
  SUM(u.monto_venta) as total_ingresos,
  SUM(u.monto_descuento) as total_descuentos,
  AVG(u.monto_venta) as promedio_venta,
  COUNT(DISTINCT u.id_cliente) as clientes_unicos,
  COUNT(DISTINCT u.id_sucursal) as sucursales_activas
FROM promociones p
LEFT JOIN promociones_uso u ON p.id_promocion = u.id_promocion
GROUP BY p.id_promocion, p.nombre, p.tipo, p.valor, p.fecha_inicio, p.fecha_fin, p.destacada, p.segmento_cliente;

-- 12. Trigger para actualizar timestamp de modificación
CREATE OR REPLACE FUNCTION fn_update_promocion_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.actualizada_en = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_promociones_update_timestamp ON promociones;
CREATE TRIGGER trg_promociones_update_timestamp
  BEFORE UPDATE ON promociones
  FOR EACH ROW
  EXECUTE FUNCTION fn_update_promocion_timestamp();

-- 13. Comentarios para documentación
COMMENT ON TABLE promociones IS 'Tabla principal de promociones con funcionalidades avanzadas';
COMMENT ON COLUMN promociones.hora_inicio IS 'Hora de inicio para promociones por horarios';
COMMENT ON COLUMN promociones.hora_fin IS 'Hora de fin para promociones por horarios';
COMMENT ON COLUMN promociones.aplicar_horarios IS 'Indica si la promoción tiene horarios específicos';
COMMENT ON COLUMN promociones.limite_usos IS 'Límite total de usos (0 = sin límite)';
COMMENT ON COLUMN promociones.limite_usos_por_cliente IS 'Límite de usos por cliente (0 = sin límite)';
COMMENT ON COLUMN promociones.monto_minimo IS 'Monto mínimo de compra para aplicar la promoción';
COMMENT ON COLUMN promociones.monto_maximo IS 'Monto máximo de descuento';
COMMENT ON COLUMN promociones.destacada IS 'Indica si la promoción es destacada';
COMMENT ON COLUMN promociones.requiere_codigo IS 'Indica si la promoción requiere código';
COMMENT ON COLUMN promociones.codigo_promocion IS 'Código de la promoción';
COMMENT ON COLUMN promociones.segmento_cliente IS 'Segmento de cliente objetivo';
COMMENT ON TABLE promociones_uso IS 'Registro de uso de promociones para analytics';

-- 14. Datos de ejemplo para testing
INSERT INTO promociones (
  nombre, descripcion, tipo, valor, fecha_inicio, fecha_fin, 
  hora_inicio, hora_fin, aplicar_horarios, id_producto, id_restaurante,
  limite_usos, destacada, requiere_codigo, codigo_promocion, segmento_cliente
) VALUES
(
  'Descuento Happy Hour', 
  'Descuento especial en horario de happy hour', 
  'porcentaje', 
  15.00, 
  CURRENT_DATE, 
  CURRENT_DATE + INTERVAL '30 days',
  '17:00:00',
  '19:00:00',
  true,
  (SELECT id_producto FROM productos LIMIT 1),
  1,
  100,
  true,
  false,
  NULL,
  'todos'
),
(
  'Promoción VIP', 
  'Exclusiva para clientes VIP', 
  'monto_fijo', 
  10.00, 
  CURRENT_DATE, 
  CURRENT_DATE + INTERVAL '15 days',
  '00:00:00',
  '23:59:59',
  false,
  (SELECT id_producto FROM productos LIMIT 1),
  1,
  50,
  true,
  true,
  'VIP2024',
  'vip'
)
ON CONFLICT DO NOTHING;

-- 15. Mensaje de confirmación
DO $$
BEGIN
  RAISE NOTICE 'Sistema de promociones avanzadas actualizado exitosamente';
  RAISE NOTICE 'Nuevas funcionalidades disponibles:';
  RAISE NOTICE '- Promociones por horarios';
  RAISE NOTICE '- Límites de uso';
  RAISE NOTICE '- Códigos de promoción';
  RAISE NOTICE '- Segmentación de clientes';
  RAISE NOTICE '- Analytics avanzados';
  RAISE NOTICE '- Tracking de uso';
END $$;
