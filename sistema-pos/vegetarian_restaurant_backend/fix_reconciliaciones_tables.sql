-- =====================================================
-- CREAR TABLAS DE RECONCILIACIONES DE CAJA
-- Multi-tenant por restaurante y sucursal
-- =====================================================

-- Tabla principal de reconciliaciones
CREATE TABLE IF NOT EXISTS reconciliaciones_caja (
  id_reconciliacion SERIAL PRIMARY KEY,
  id_restaurante INTEGER NOT NULL,
  id_sucursal INTEGER,
  id_vendedor INTEGER,
  tipo_reconciliacion VARCHAR(20) NOT NULL CHECK (tipo_reconciliacion IN ('efectivo', 'completa')),
  fecha TIMESTAMP NOT NULL DEFAULT NOW(),
  monto_inicial NUMERIC(12,2),
  efectivo_esperado NUMERIC(12,2),
  efectivo_fisico NUMERIC(12,2),
  diferencia_efectivo NUMERIC(12,2) GENERATED ALWAYS AS (efectivo_fisico - efectivo_esperado) STORED,
  total_esperado NUMERIC(12,2),
  total_registrado NUMERIC(12,2),
  diferencia_total NUMERIC(12,2) GENERATED ALWAYS AS (total_registrado - total_esperado) STORED,
  datos_por_metodo JSONB,
  observaciones TEXT,
  estado VARCHAR(20) DEFAULT 'completada' CHECK (estado IN ('completada', 'pendiente', 'cancelada')),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_reconciliaciones_restaurante ON reconciliaciones_caja(id_restaurante);
CREATE INDEX IF NOT EXISTS idx_reconciliaciones_sucursal ON reconciliaciones_caja(id_sucursal);
CREATE INDEX IF NOT EXISTS idx_reconciliaciones_vendedor ON reconciliaciones_caja(id_vendedor);
CREATE INDEX IF NOT EXISTS idx_reconciliaciones_fecha ON reconciliaciones_caja(fecha);
CREATE INDEX IF NOT EXISTS idx_reconciliaciones_estado ON reconciliaciones_caja(estado);
CREATE INDEX IF NOT EXISTS idx_reconciliaciones_tipo ON reconciliaciones_caja(tipo_reconciliacion);

-- Tabla de detalles por método de pago (para reconciliaciones completas)
CREATE TABLE IF NOT EXISTS reconciliaciones_metodos_pago (
  id_detalle SERIAL PRIMARY KEY,
  id_reconciliacion INTEGER NOT NULL REFERENCES reconciliaciones_caja(id_reconciliacion) ON DELETE CASCADE,
  id_restaurante INTEGER NOT NULL,
  id_sucursal INTEGER,
  metodo_pago VARCHAR(50) NOT NULL,
  monto_esperado NUMERIC(12,2) NOT NULL DEFAULT 0,
  monto_registrado NUMERIC(12,2) NOT NULL DEFAULT 0,
  diferencia NUMERIC(12,2) GENERATED ALWAYS AS (monto_registrado - monto_esperado) STORED,
  observaciones TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Índices para detalles de métodos
CREATE INDEX IF NOT EXISTS idx_reconciliaciones_metodos_reconciliacion ON reconciliaciones_metodos_pago(id_reconciliacion);
CREATE INDEX IF NOT EXISTS idx_reconciliaciones_metodos_restaurante ON reconciliaciones_metodos_pago(id_restaurante);
CREATE INDEX IF NOT EXISTS idx_reconciliaciones_metodos_metodo ON reconciliaciones_metodos_pago(metodo_pago);

-- Tabla de historial de cambios (para auditoría)
CREATE TABLE IF NOT EXISTS reconciliaciones_historial (
  id_historial SERIAL PRIMARY KEY,
  id_reconciliacion INTEGER NOT NULL REFERENCES reconciliaciones_caja(id_reconciliacion) ON DELETE CASCADE,
  id_usuario INTEGER,
  accion VARCHAR(50) NOT NULL,
  datos_anteriores JSONB,
  datos_nuevos JSONB,
  observaciones TEXT,
  fecha_cambio TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Índices para historial
CREATE INDEX IF NOT EXISTS idx_reconciliaciones_historial_reconciliacion ON reconciliaciones_historial(id_reconciliacion);
CREATE INDEX IF NOT EXISTS idx_reconciliaciones_historial_fecha ON reconciliaciones_historial(fecha_cambio);

-- Función para actualizar el campo updated_at automáticamente
CREATE OR REPLACE FUNCTION update_reconciliaciones_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at en reconciliaciones_caja
DROP TRIGGER IF EXISTS trigger_update_reconciliaciones_updated_at ON reconciliaciones_caja;
CREATE TRIGGER trigger_update_reconciliaciones_updated_at
  BEFORE UPDATE ON reconciliaciones_caja
  FOR EACH ROW
  EXECUTE FUNCTION update_reconciliaciones_updated_at();

-- Vista para facilitar consultas
CREATE OR REPLACE VIEW vista_reconciliaciones_completa AS
SELECT 
  r.id_reconciliacion,
  r.id_restaurante,
  r.id_sucursal,
  r.id_vendedor,
  r.tipo_reconciliacion,
  r.fecha,
  r.monto_inicial,
  r.efectivo_esperado,
  r.efectivo_fisico,
  r.diferencia_efectivo,
  r.total_esperado,
  r.total_registrado,
  r.diferencia_total,
  r.datos_por_metodo,
  r.observaciones,
  r.estado,
  r.created_at,
  r.updated_at,
  s.nombre as sucursal_nombre,
  v.nombre as vendedor_nombre,
  v.username as vendedor_username,
  v.rol as vendedor_rol,
  -- Calcular si está cuadrada
  CASE 
    WHEN r.tipo_reconciliacion = 'efectivo' AND r.diferencia_efectivo = 0 THEN true
    WHEN r.tipo_reconciliacion = 'completa' AND r.diferencia_total = 0 THEN true
    ELSE false
  END as cuadrada,
  -- Calcular estado de diferencia
  CASE 
    WHEN r.tipo_reconciliacion = 'efectivo' THEN
      CASE 
        WHEN r.diferencia_efectivo = 0 THEN 'cuadrada'
        WHEN r.diferencia_efectivo > 0 THEN 'sobrante'
        ELSE 'faltante'
      END
    WHEN r.tipo_reconciliacion = 'completa' THEN
      CASE 
        WHEN r.diferencia_total = 0 THEN 'cuadrada'
        WHEN r.diferencia_total > 0 THEN 'sobrante'
        ELSE 'faltante'
      END
    ELSE 'desconocido'
  END as estado_diferencia
FROM reconciliaciones_caja r
LEFT JOIN sucursales s ON r.id_sucursal = s.id_sucursal
LEFT JOIN vendedores v ON r.id_vendedor = v.id_vendedor;

-- Comentarios para documentación
COMMENT ON TABLE reconciliaciones_caja IS 'Tabla principal de reconciliaciones de caja - Multi-tenant por restaurante y sucursal';
COMMENT ON TABLE reconciliaciones_metodos_pago IS 'Detalles de reconciliaciones completas por método de pago';
COMMENT ON TABLE reconciliaciones_historial IS 'Historial de cambios en reconciliaciones para auditoría';
COMMENT ON VIEW vista_reconciliaciones_completa IS 'Vista completa de reconciliaciones con información relacionada';

-- Mensaje de confirmación
DO $$
BEGIN
  RAISE NOTICE '✅ Tablas de reconciliaciones creadas/verificadas exitosamente';
  RAISE NOTICE '📋 Tablas: reconciliaciones_caja, reconciliaciones_metodos_pago, reconciliaciones_historial';
  RAISE NOTICE '📊 Vista: vista_reconciliaciones_completa';
  RAISE NOTICE '🔧 Triggers y funciones configurados';
END $$;

