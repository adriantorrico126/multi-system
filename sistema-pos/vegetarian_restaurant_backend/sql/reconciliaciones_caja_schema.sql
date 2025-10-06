-- =====================================================
-- SISTEMA DE RECONCILIACIONES DE CAJA
-- Multi-tenant por restaurante y sucursal
-- =====================================================

-- 1. TABLA PRINCIPAL DE RECONCILIACIONES
-- ======================================
CREATE TABLE IF NOT EXISTS reconciliaciones_caja (
    id_reconciliacion SERIAL PRIMARY KEY,
    
    -- Identificación multi-tenant
    id_restaurante INTEGER NOT NULL,
    id_sucursal INTEGER NOT NULL,
    id_vendedor INTEGER NOT NULL,
    
    -- Información básica
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    hora TIME NOT NULL DEFAULT CURRENT_TIME,
    tipo_reconciliacion VARCHAR(20) NOT NULL,
    -- 'efectivo' o 'completa'
    
    -- Datos de reconciliación de efectivo
    monto_inicial NUMERIC(12,2),
    efectivo_esperado NUMERIC(12,2),
    efectivo_fisico NUMERIC(12,2),
    diferencia_efectivo NUMERIC(12,2),
    
    -- Datos de reconciliación completa
    total_esperado NUMERIC(12,2),
    total_registrado NUMERIC(12,2),
    diferencia_total NUMERIC(12,2),
    
    -- Datos detallados por método de pago (JSON)
    datos_por_metodo JSONB DEFAULT '{}',
    -- Ejemplo: {"efectivo": 500.00, "tarjeta_debito": 300.00, "tarjeta_credito": 200.00}
    
    diferencias_por_metodo JSONB DEFAULT '{}',
    -- Ejemplo: {"efectivo": 0.00, "tarjeta_debito": -5.00, "tarjeta_credito": 0.00}
    
    -- Estado y observaciones
    estado VARCHAR(20) NOT NULL DEFAULT 'completada',
    -- 'cuadrada', 'sobrante', 'faltante'
    
    observaciones TEXT,
    
    -- Auditoría
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT fk_reconciliaciones_restaurante 
        FOREIGN KEY (id_restaurante) REFERENCES restaurantes(id_restaurante) ON DELETE CASCADE,
    CONSTRAINT fk_reconciliaciones_sucursal 
        FOREIGN KEY (id_sucursal) REFERENCES sucursales(id_sucursal),
    CONSTRAINT fk_reconciliaciones_vendedor 
        FOREIGN KEY (id_vendedor) REFERENCES vendedores(id_vendedor),
    CONSTRAINT ck_reconciliaciones_tipo 
        CHECK (tipo_reconciliacion IN ('efectivo', 'completa')),
    CONSTRAINT ck_reconciliaciones_estado 
        CHECK (estado IN ('cuadrada', 'sobrante', 'faltante')),
    CONSTRAINT ck_reconciliaciones_fecha 
        CHECK (fecha <= CURRENT_DATE)
);

-- 2. TABLA DE DETALLES POR MÉTODO DE PAGO
-- =======================================
CREATE TABLE IF NOT EXISTS reconciliaciones_metodos_pago (
    id_detalle SERIAL PRIMARY KEY,
    
    -- Relación con reconciliación principal
    id_reconciliacion INTEGER NOT NULL,
    
    -- Identificación multi-tenant (redundante para consultas rápidas)
    id_restaurante INTEGER NOT NULL,
    id_sucursal INTEGER NOT NULL,
    
    -- Método de pago
    metodo_pago VARCHAR(50) NOT NULL,
    -- 'efectivo', 'tarjeta_debito', 'tarjeta_credito', 'transferencia', 'cheque', 'otros'
    
    -- Montos
    monto_esperado NUMERIC(12,2) NOT NULL DEFAULT 0,
    monto_registrado NUMERIC(12,2) NOT NULL DEFAULT 0,
    diferencia NUMERIC(12,2) NOT NULL DEFAULT 0,
    
    -- Estado individual
    estado VARCHAR(20) NOT NULL DEFAULT 'cuadrado',
    -- 'cuadrado', 'sobrante', 'faltante'
    
    -- Auditoría
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT fk_reconciliaciones_metodos_reconciliacion 
        FOREIGN KEY (id_reconciliacion) REFERENCES reconciliaciones_caja(id_reconciliacion) ON DELETE CASCADE,
    CONSTRAINT fk_reconciliaciones_metodos_restaurante 
        FOREIGN KEY (id_restaurante) REFERENCES restaurantes(id_restaurante) ON DELETE CASCADE,
    CONSTRAINT fk_reconciliaciones_metodos_sucursal 
        FOREIGN KEY (id_sucursal) REFERENCES sucursales(id_sucursal),
    CONSTRAINT ck_reconciliaciones_metodos_metodo 
        CHECK (metodo_pago IN ('efectivo', 'tarjeta_debito', 'tarjeta_credito', 'transferencia', 'cheque', 'otros')),
    CONSTRAINT ck_reconciliaciones_metodos_estado 
        CHECK (estado IN ('cuadrado', 'sobrante', 'faltante')),
    CONSTRAINT uk_reconciliaciones_metodos 
        UNIQUE (id_reconciliacion, metodo_pago)
);

-- 3. TABLA DE HISTORIAL DE CAMBIOS
-- ================================
CREATE TABLE IF NOT EXISTS reconciliaciones_historial (
    id_historial SERIAL PRIMARY KEY,
    
    -- Relación con reconciliación
    id_reconciliacion INTEGER NOT NULL,
    
    -- Identificación multi-tenant
    id_restaurante INTEGER NOT NULL,
    id_sucursal INTEGER NOT NULL,
    
    -- Información del cambio
    accion VARCHAR(50) NOT NULL,
    -- 'creada', 'modificada', 'eliminada', 'revisada'
    
    datos_anteriores JSONB,
    datos_nuevos JSONB,
    
    -- Usuario que realizó el cambio
    id_usuario INTEGER NOT NULL,
    nombre_usuario VARCHAR(100),
    
    -- Auditoría
    fecha_cambio TIMESTAMP DEFAULT NOW(),
    ip_origen INET,
    user_agent TEXT,
    
    -- Constraints
    CONSTRAINT fk_reconciliaciones_historial_reconciliacion 
        FOREIGN KEY (id_reconciliacion) REFERENCES reconciliaciones_caja(id_reconciliacion) ON DELETE CASCADE,
    CONSTRAINT fk_reconciliaciones_historial_restaurante 
        FOREIGN KEY (id_restaurante) REFERENCES restaurantes(id_restaurante) ON DELETE CASCADE,
    CONSTRAINT fk_reconciliaciones_historial_sucursal 
        FOREIGN KEY (id_sucursal) REFERENCES sucursales(id_sucursal),
    CONSTRAINT fk_reconciliaciones_historial_usuario 
        FOREIGN KEY (id_usuario) REFERENCES vendedores(id_vendedor)
);

-- =====================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

-- Índices principales
CREATE INDEX IF NOT EXISTS idx_reconciliaciones_restaurante_sucursal 
    ON reconciliaciones_caja(id_restaurante, id_sucursal);

CREATE INDEX IF NOT EXISTS idx_reconciliaciones_fecha 
    ON reconciliaciones_caja(fecha DESC);

CREATE INDEX IF NOT EXISTS idx_reconciliaciones_vendedor 
    ON reconciliaciones_caja(id_vendedor);

CREATE INDEX IF NOT EXISTS idx_reconciliaciones_tipo_estado 
    ON reconciliaciones_caja(tipo_reconciliacion, estado);

-- Índices para consultas de reportes
CREATE INDEX IF NOT EXISTS idx_reconciliaciones_restaurante_fecha 
    ON reconciliaciones_caja(id_restaurante, fecha DESC);

CREATE INDEX IF NOT EXISTS idx_reconciliaciones_sucursal_fecha 
    ON reconciliaciones_caja(id_sucursal, fecha DESC);

-- Índices para detalles de métodos
CREATE INDEX IF NOT EXISTS idx_reconciliaciones_metodos_reconciliacion 
    ON reconciliaciones_metodos_pago(id_reconciliacion);

CREATE INDEX IF NOT EXISTS idx_reconciliaciones_metodos_restaurante 
    ON reconciliaciones_metodos_pago(id_restaurante, id_sucursal);

-- Índices para historial
CREATE INDEX IF NOT EXISTS idx_reconciliaciones_historial_reconciliacion 
    ON reconciliaciones_historial(id_reconciliacion);

CREATE INDEX IF NOT EXISTS idx_reconciliaciones_historial_fecha 
    ON reconciliaciones_historial(fecha_cambio DESC);

-- =====================================================
-- TRIGGERS PARA AUTOMATIZACIÓN
-- =====================================================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION actualizar_reconciliaciones_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
CREATE TRIGGER trigger_reconciliaciones_updated_at
    BEFORE UPDATE ON reconciliaciones_caja
    FOR EACH ROW EXECUTE FUNCTION actualizar_reconciliaciones_updated_at();

-- Función para calcular diferencias automáticamente
CREATE OR REPLACE FUNCTION calcular_diferencias_reconciliacion()
RETURNS TRIGGER AS $$
BEGIN
    -- Calcular diferencia de efectivo
    IF NEW.efectivo_fisico IS NOT NULL AND NEW.efectivo_esperado IS NOT NULL THEN
        NEW.diferencia_efectivo = NEW.efectivo_fisico - NEW.efectivo_esperado;
    END IF;
    
    -- Calcular diferencia total
    IF NEW.total_registrado IS NOT NULL AND NEW.total_esperado IS NOT NULL THEN
        NEW.diferencia_total = NEW.total_registrado - NEW.total_esperado;
    END IF;
    
    -- Determinar estado basado en diferencias
    IF NEW.tipo_reconciliacion = 'efectivo' THEN
        IF NEW.diferencia_efectivo = 0 THEN
            NEW.estado = 'cuadrada';
        ELSIF NEW.diferencia_efectivo > 0 THEN
            NEW.estado = 'sobrante';
        ELSE
            NEW.estado = 'faltante';
        END IF;
    ELSE
        IF NEW.diferencia_total = 0 THEN
            NEW.estado = 'cuadrada';
        ELSIF NEW.diferencia_total > 0 THEN
            NEW.estado = 'sobrante';
        ELSE
            NEW.estado = 'faltante';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para calcular diferencias
CREATE TRIGGER trigger_calcular_diferencias_reconciliacion
    BEFORE INSERT OR UPDATE ON reconciliaciones_caja
    FOR EACH ROW EXECUTE FUNCTION calcular_diferencias_reconciliacion();

-- Función para registrar cambios en historial
CREATE OR REPLACE FUNCTION registrar_historial_reconciliacion()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO reconciliaciones_historial (
            id_reconciliacion, id_restaurante, id_sucursal, accion,
            datos_nuevos, id_usuario, nombre_usuario
        ) VALUES (
            NEW.id_reconciliacion, NEW.id_restaurante, NEW.id_sucursal, 'creada',
            row_to_json(NEW), NEW.id_vendedor, 
            (SELECT nombre FROM vendedores WHERE id_vendedor = NEW.id_vendedor)
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO reconciliaciones_historial (
            id_reconciliacion, id_restaurante, id_sucursal, accion,
            datos_anteriores, datos_nuevos, id_usuario, nombre_usuario
        ) VALUES (
            NEW.id_reconciliacion, NEW.id_restaurante, NEW.id_sucursal, 'modificada',
            row_to_json(OLD), row_to_json(NEW), NEW.id_vendedor,
            (SELECT nombre FROM vendedores WHERE id_vendedor = NEW.id_vendedor)
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO reconciliaciones_historial (
            id_reconciliacion, id_restaurante, id_sucursal, accion,
            datos_anteriores, id_usuario, nombre_usuario
        ) VALUES (
            OLD.id_reconciliacion, OLD.id_restaurante, OLD.id_sucursal, 'eliminada',
            row_to_json(OLD), OLD.id_vendedor,
            (SELECT nombre FROM vendedores WHERE id_vendedor = OLD.id_vendedor)
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger para historial
CREATE TRIGGER trigger_historial_reconciliacion
    AFTER INSERT OR UPDATE OR DELETE ON reconciliaciones_caja
    FOR EACH ROW EXECUTE FUNCTION registrar_historial_reconciliacion();

-- =====================================================
-- VISTAS PARA CONSULTAS FRECUENTES
-- =====================================================

-- Vista de resumen de reconciliaciones por día
CREATE OR REPLACE VIEW vista_reconciliaciones_resumen AS
SELECT 
    r.id_restaurante,
    r.id_sucursal,
    r.fecha,
    COUNT(*) as total_reconciliaciones,
    COUNT(CASE WHEN r.estado = 'cuadrada' THEN 1 END) as reconciliaciones_cuadradas,
    COUNT(CASE WHEN r.estado = 'sobrante' THEN 1 END) as reconciliaciones_sobrantes,
    COUNT(CASE WHEN r.estado = 'faltante' THEN 1 END) as reconciliaciones_faltantes,
    SUM(CASE WHEN r.tipo_reconciliacion = 'efectivo' THEN r.diferencia_efectivo ELSE 0 END) as diferencia_efectivo_total,
    SUM(CASE WHEN r.tipo_reconciliacion = 'completa' THEN r.diferencia_total ELSE 0 END) as diferencia_total_general,
    AVG(CASE WHEN r.tipo_reconciliacion = 'efectivo' THEN r.diferencia_efectivo ELSE NULL END) as diferencia_efectivo_promedio,
    AVG(CASE WHEN r.tipo_reconciliacion = 'completa' THEN r.diferencia_total ELSE NULL END) as diferencia_total_promedio
FROM reconciliaciones_caja r
GROUP BY r.id_restaurante, r.id_sucursal, r.fecha
ORDER BY r.fecha DESC;

-- Vista de reconciliaciones con detalles de métodos
CREATE OR REPLACE VIEW vista_reconciliaciones_completas AS
SELECT 
    r.*,
    s.nombre as sucursal_nombre,
    v.nombre as vendedor_nombre,
    rest.nombre as restaurante_nombre,
    COALESCE(
        json_agg(
            json_build_object(
                'metodo_pago', rm.metodo_pago,
                'monto_esperado', rm.monto_esperado,
                'monto_registrado', rm.monto_registrado,
                'diferencia', rm.diferencia,
                'estado', rm.estado
            )
        ) FILTER (WHERE rm.id_detalle IS NOT NULL), 
        '[]'::json
    ) as metodos_detalle
FROM reconciliaciones_caja r
LEFT JOIN sucursales s ON r.id_sucursal = s.id_sucursal
LEFT JOIN vendedores v ON r.id_vendedor = v.id_vendedor
LEFT JOIN restaurantes rest ON r.id_restaurante = rest.id_restaurante
LEFT JOIN reconciliaciones_metodos_pago rm ON r.id_reconciliacion = rm.id_reconciliacion
GROUP BY r.id_reconciliacion, s.nombre, v.nombre, rest.nombre
ORDER BY r.fecha DESC, r.hora DESC;

-- =====================================================
-- COMENTARIOS PARA DOCUMENTACIÓN
-- =====================================================

COMMENT ON TABLE reconciliaciones_caja IS 'Tabla principal de reconciliaciones de caja por restaurante y sucursal';
COMMENT ON TABLE reconciliaciones_metodos_pago IS 'Detalles de reconciliación por método de pago individual';
COMMENT ON TABLE reconciliaciones_historial IS 'Historial de cambios en reconciliaciones para auditoría';

COMMENT ON COLUMN reconciliaciones_caja.tipo_reconciliacion IS 'Tipo: efectivo (solo efectivo físico) o completa (todos los métodos)';
COMMENT ON COLUMN reconciliaciones_caja.estado IS 'Estado: cuadrada (diferencia=0), sobrante (diferencia>0), faltante (diferencia<0)';
COMMENT ON COLUMN reconciliaciones_caja.datos_por_metodo IS 'JSON con montos registrados por método de pago';
COMMENT ON COLUMN reconciliaciones_caja.diferencias_por_metodo IS 'JSON con diferencias calculadas por método de pago';

-- =====================================================
-- DATOS DE EJEMPLO (OPCIONAL)
-- =====================================================

-- Insertar datos de ejemplo para testing
-- INSERT INTO reconciliaciones_caja (
--     id_restaurante, id_sucursal, id_vendedor, tipo_reconciliacion,
--     monto_inicial, efectivo_esperado, efectivo_fisico,
--     datos_por_metodo, observaciones
-- ) VALUES (
--     1, 1, 1, 'completa',
--     100.00, 550.00, 545.00,
--     '{"efectivo": 300.00, "tarjeta_debito": 200.00, "tarjeta_credito": 45.00}',
--     'Reconciliación de prueba - faltante por error en cambio'
-- );
