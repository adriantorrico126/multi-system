-- Script para crear el sistema de promociones con estructura mejorada
-- Ejecutar este script en la base de datos para habilitar el sistema de promociones

-- 0. Verificar si la tabla promociones existe, si no, crearla
CREATE TABLE IF NOT EXISTS promociones (
  id_promocion      SERIAL PRIMARY KEY,
  nombre            VARCHAR(255) NOT NULL,
  tipo              VARCHAR(50) NOT NULL,
  valor             NUMERIC(10,2) NOT NULL,
  fecha_inicio      DATE NOT NULL,
  fecha_fin         DATE NOT NULL,
  id_producto       INTEGER,
  creada_en         TIMESTAMP DEFAULT now(),
  activa            BOOLEAN DEFAULT true
);

-- 1. Convertir id_producto a INTEGER si no lo es
ALTER TABLE promociones
  ALTER COLUMN id_producto TYPE INTEGER USING id_producto::INTEGER;

-- 2. Agregar columna para fecha de creación y estado activo si no existen
ALTER TABLE promociones
  ADD COLUMN IF NOT EXISTS creada_en TIMESTAMP DEFAULT now(),
  ADD COLUMN IF NOT EXISTS activa BOOLEAN DEFAULT true;

-- 3. Constraints actualizados en promociones
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

-- 4. Crear FK corregida hacia productos
ALTER TABLE promociones
  DROP CONSTRAINT IF EXISTS promociones_id_producto_fkey;
ALTER TABLE promociones
  ADD CONSTRAINT promociones_id_producto_fkey
    FOREIGN KEY (id_producto) REFERENCES productos(id_producto) ON DELETE SET NULL;

-- 5. Crear tabla promociones_sucursales
CREATE TABLE IF NOT EXISTS promociones_sucursales (
  id_relacion      SERIAL PRIMARY KEY,
  id_promocion     INTEGER NOT NULL,
  id_restaurante   INTEGER NOT NULL,
  id_sucursal      INTEGER,
  aplicada_en      TIMESTAMP DEFAULT now()
);

-- 6. Agregar foreign keys a promociones_sucursales
ALTER TABLE promociones_sucursales
  ADD CONSTRAINT fk_promociones_sucursales_promocion
    FOREIGN KEY (id_promocion) REFERENCES promociones(id_promocion) ON DELETE CASCADE;

ALTER TABLE promociones_sucursales
  ADD CONSTRAINT fk_promociones_sucursales_restaurante
    FOREIGN KEY (id_restaurante) REFERENCES restaurantes(id_restaurante) ON DELETE CASCADE;

ALTER TABLE promociones_sucursales
  ADD CONSTRAINT fk_promociones_sucursales_sucursal
    FOREIGN KEY (id_sucursal) REFERENCES sucursales(id_sucursal) ON DELETE CASCADE;

-- 7. Agregar constraints únicos
ALTER TABLE promociones_sucursales
  DROP CONSTRAINT IF EXISTS unique_promocion_restaurante_sucursal;
ALTER TABLE promociones_sucursales
  ADD CONSTRAINT unique_promocion_restaurante_sucursal
    UNIQUE (id_promocion, id_restaurante, id_sucursal);

-- 8. Índices adicionales para rendimiento
CREATE INDEX IF NOT EXISTS idx_ps_promocion_sucursal
  ON promociones_sucursales(id_promocion, id_sucursal);

CREATE INDEX IF NOT EXISTS idx_ps_restaurante
  ON promociones_sucursales(id_restaurante);

CREATE INDEX IF NOT EXISTS idx_promociones_fechas
  ON promociones(fecha_inicio, fecha_fin);

CREATE INDEX IF NOT EXISTS idx_promociones_producto
  ON promociones(id_producto);

CREATE INDEX IF NOT EXISTS idx_promociones_activas
  ON promociones(fecha_inicio, fecha_fin)
  WHERE activa = true;

-- 9. Trigger para asignar timestamp en inserciones
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

-- 10. Función para obtener promociones activas por restaurante y sucursal
CREATE OR REPLACE FUNCTION fn_get_promociones_activas(
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

-- 11. Ejemplos de inserción protegidos contra duplicados (usando IDs válidos)
INSERT INTO promociones (id_promocion, nombre, tipo, valor, fecha_inicio, fecha_fin, id_producto)
VALUES
  (1, 'Descuento 20% PIQUE MACHO', 'porcentaje', 20.00, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', 60),
  (2, 'Descuento $5 VEGANCUCHO', 'monto_fijo', 5.00, CURRENT_DATE, CURRENT_DATE + INTERVAL '15 days', 61)
ON CONFLICT (id_promocion) DO NOTHING;

INSERT INTO promociones_sucursales (id_promocion, id_restaurante, id_sucursal)
VALUES
  (1, 1, NULL),  -- Promoción global para todo el restaurante
  (2, 1, 1)      -- Promoción específica para sucursal 1
ON CONFLICT (id_promocion, id_restaurante, id_sucursal) DO NOTHING;

-- 12. Verificación de estructura de datos
SELECT 'promociones' AS tabla, COUNT(*) AS total FROM promociones
UNION ALL
SELECT 'promociones_sucursales', COUNT(*) FROM promociones_sucursales;

SELECT 'Total promociones', COUNT(*) FROM promociones
UNION ALL
SELECT 'Promociones activas hoy', COUNT(*) FROM promociones
WHERE activa = true AND fecha_inicio <= CURRENT_DATE AND fecha_fin >= CURRENT_DATE
UNION ALL
SELECT 'Asignadas a sucursales', COUNT(*) FROM promociones_sucursales;

-- 13. Mensaje de éxito
DO $$
BEGIN
  RAISE NOTICE 'Sistema de promociones desplegado correctamente y sin errores de tipo.';
END $$;
