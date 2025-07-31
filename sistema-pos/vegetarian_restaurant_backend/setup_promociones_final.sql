-- Script final para crear el sistema de promociones escalable
-- Estructura: promociones (principal) + promociones_sucursales (relacional)

-- 1. Tabla principal de promociones (sin asignar sucursal)
CREATE TABLE IF NOT EXISTS promociones (
  id_promocion      SERIAL PRIMARY KEY,
  nombre            VARCHAR(255) NOT NULL,
  tipo              VARCHAR(50) NOT NULL,
  valor             NUMERIC(10,2) NOT NULL,
  fecha_inicio      DATE NOT NULL,
  fecha_fin         DATE NOT NULL,
  id_producto       INTEGER,
  id_restaurante    INTEGER NOT NULL,
  creada_en         TIMESTAMP DEFAULT now(),
  activa            BOOLEAN DEFAULT true
);

-- 2. Constraints para promociones
ALTER TABLE promociones
  DROP CONSTRAINT IF EXISTS chk_tipo_promocion;
ALTER TABLE promociones
  ADD CONSTRAINT chk_tipo_promocion
    CHECK (tipo IN ('porcentaje', 'monto_fijo', 'precio_fijo', 'x_uno_gratis', 'fijo'));

ALTER TABLE promociones
  DROP CONSTRAINT IF EXISTS chk_fechas_promocion;
ALTER TABLE promociones
  ADD CONSTRAINT chk_fechas_promocion
    CHECK (fecha_fin >= fecha_inicio);

-- 3. Foreign keys para promociones
ALTER TABLE promociones
  DROP CONSTRAINT IF EXISTS promociones_id_producto_fkey;
ALTER TABLE promociones
  ADD CONSTRAINT promociones_id_producto_fkey
    FOREIGN KEY (id_producto) REFERENCES productos(id_producto) ON DELETE SET NULL;

ALTER TABLE promociones
  DROP CONSTRAINT IF EXISTS promociones_id_restaurante_fkey;
ALTER TABLE promociones
  ADD CONSTRAINT promociones_id_restaurante_fkey
    FOREIGN KEY (id_restaurante) REFERENCES restaurantes(id_restaurante) ON DELETE CASCADE;

-- 4. Tabla relacional promociones_sucursales
CREATE TABLE IF NOT EXISTS promociones_sucursales (
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

-- 5. Índices para rendimiento
CREATE INDEX IF NOT EXISTS idx_promociones_restaurante
  ON promociones(id_restaurante);

CREATE INDEX IF NOT EXISTS idx_promociones_producto
  ON promociones(id_producto);

CREATE INDEX IF NOT EXISTS idx_promociones_fechas
  ON promociones(fecha_inicio, fecha_fin);

CREATE INDEX IF NOT EXISTS idx_promociones_activas
  ON promociones(fecha_inicio, fecha_fin)
  WHERE activa = true;

CREATE INDEX IF NOT EXISTS idx_ps_promocion
  ON promociones_sucursales(id_promocion);

CREATE INDEX IF NOT EXISTS idx_ps_sucursal
  ON promociones_sucursales(id_sucursal);

-- 6. Trigger para timestamp
CREATE OR REPLACE FUNCTION fn_promociones_set_created()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.creada_en := COALESCE(NEW.creada_en, CURRENT_TIMESTAMP);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_promociones_timestamp ON promociones;
CREATE TRIGGER trg_promociones_timestamp
  BEFORE INSERT ON promociones
  FOR EACH ROW
  EXECUTE FUNCTION fn_promociones_set_created();

-- 7. Función para obtener promociones activas por restaurante y sucursal
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

-- 8. Datos de ejemplo (sin ON CONFLICT para evitar problemas)
INSERT INTO promociones (nombre, tipo, valor, fecha_inicio, fecha_fin, id_producto, id_restaurante)
SELECT 'Descuento 20% PIQUE MACHO', 'porcentaje', 20.00, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', 60, 1
WHERE NOT EXISTS (SELECT 1 FROM promociones WHERE nombre = 'Descuento 20% PIQUE MACHO');

INSERT INTO promociones (nombre, tipo, valor, fecha_inicio, fecha_fin, id_producto, id_restaurante)
SELECT 'Descuento $5 VEGANCUCHO', 'monto_fijo', 5.00, CURRENT_DATE, CURRENT_DATE + INTERVAL '15 days', 61, 1
WHERE NOT EXISTS (SELECT 1 FROM promociones WHERE nombre = 'Descuento $5 VEGANCUCHO');

INSERT INTO promociones (nombre, tipo, valor, fecha_inicio, fecha_fin, id_producto, id_restaurante)
SELECT 'Precio especial FRIED GREEN CHICKEN', 'precio_fijo', 20.00, CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days', 62, 1
WHERE NOT EXISTS (SELECT 1 FROM promociones WHERE nombre = 'Precio especial FRIED GREEN CHICKEN');

-- Asignar promociones a sucursales (sin ON CONFLICT)
INSERT INTO promociones_sucursales (id_promocion, id_sucursal)
SELECT p.id_promocion, 1
FROM promociones p
WHERE p.nombre = 'Descuento 20% PIQUE MACHO'
AND NOT EXISTS (
  SELECT 1 FROM promociones_sucursales ps 
  WHERE ps.id_promocion = p.id_promocion AND ps.id_sucursal = 1
);

INSERT INTO promociones_sucursales (id_promocion, id_sucursal)
SELECT p.id_promocion, 3
FROM promociones p
WHERE p.nombre = 'Descuento 20% PIQUE MACHO'
AND NOT EXISTS (
  SELECT 1 FROM promociones_sucursales ps 
  WHERE ps.id_promocion = p.id_promocion AND ps.id_sucursal = 3
);

INSERT INTO promociones_sucursales (id_promocion, id_sucursal)
SELECT p.id_promocion, 1
FROM promociones p
WHERE p.nombre = 'Descuento $5 VEGANCUCHO'
AND NOT EXISTS (
  SELECT 1 FROM promociones_sucursales ps 
  WHERE ps.id_promocion = p.id_promocion AND ps.id_sucursal = 1
);

INSERT INTO promociones_sucursales (id_promocion, id_sucursal)
SELECT p.id_promocion, 4
FROM promociones p
WHERE p.nombre = 'Precio especial FRIED GREEN CHICKEN'
AND NOT EXISTS (
  SELECT 1 FROM promociones_sucursales ps 
  WHERE ps.id_promocion = p.id_promocion AND ps.id_sucursal = 4
);

-- 9. Verificación final
SELECT 'promociones' AS tabla, COUNT(*) AS total FROM promociones
UNION ALL
SELECT 'promociones_sucursales', COUNT(*) FROM promociones_sucursales;

SELECT 'Total promociones', COUNT(*) FROM promociones
UNION ALL
SELECT 'Promociones activas hoy', COUNT(*) FROM promociones
WHERE activa = true AND fecha_inicio <= CURRENT_DATE AND fecha_fin >= CURRENT_DATE
UNION ALL
SELECT 'Asignaciones a sucursales', COUNT(*) FROM promociones_sucursales;

-- 10. Mostrar estructura final
SELECT 
  'promociones' as tabla,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'promociones'
ORDER BY ordinal_position;

-- 11. Mensaje de éxito
DO $$
BEGIN
  RAISE NOTICE 'Sistema de promociones escalable implementado exitosamente.';
  RAISE NOTICE 'Estructura: promociones (principal) + promociones_sucursales (relacional)';
END $$; 