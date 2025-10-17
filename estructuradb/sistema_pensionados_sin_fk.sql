-- =====================================================
-- SISTEMA DE PENSIONADOS - SITEMM (SIN FOREIGN KEYS)
-- Estructura de base de datos para gestión de pensionados
-- =====================================================

-- Tabla principal de pensionados
CREATE TABLE IF NOT EXISTS pensionados (
    id_pensionado SERIAL PRIMARY KEY,
    id_restaurante INTEGER NOT NULL,
    id_sucursal INTEGER,
    
    -- Información del cliente
    nombre_cliente VARCHAR(100) NOT NULL,
    tipo_cliente VARCHAR(50) NOT NULL DEFAULT 'individual', -- 'individual', 'corporativo', 'evento'
    documento_identidad VARCHAR(20),
    telefono VARCHAR(20),
    email VARCHAR(100),
    direccion TEXT,
    
    -- Información del contrato
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    tipo_periodo VARCHAR(20) NOT NULL DEFAULT 'semanas', -- 'semanas', 'meses', 'años'
    cantidad_periodos INTEGER NOT NULL DEFAULT 1,
    
    -- Configuración del servicio
    incluye_almuerzo BOOLEAN DEFAULT true,
    incluye_cena BOOLEAN DEFAULT false,
    incluye_desayuno BOOLEAN DEFAULT false,
    max_platos_dia INTEGER DEFAULT 1,
    
    -- Información financiera
    monto_acumulado DECIMAL(12,2) DEFAULT 0.00,
    descuento_aplicado DECIMAL(5,2) DEFAULT 0.00, -- porcentaje
    total_consumido DECIMAL(12,2) DEFAULT 0.00,
    saldo_pendiente DECIMAL(12,2) DEFAULT 0.00,
    
    -- Estado y control
    estado VARCHAR(20) DEFAULT 'activo', -- 'activo', 'pausado', 'finalizado', 'cancelado'
    fecha_ultimo_consumo DATE,
    dias_consumo INTEGER DEFAULT 0,
    
    -- Auditoría
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by INTEGER,
    
    CONSTRAINT chk_tipo_cliente CHECK (tipo_cliente IN ('individual', 'corporativo', 'evento')),
    CONSTRAINT chk_estado_pensionado CHECK (estado IN ('activo', 'pausado', 'finalizado', 'cancelado')),
    CONSTRAINT chk_tipo_periodo CHECK (tipo_periodo IN ('semanas', 'meses', 'años')),
    CONSTRAINT chk_fechas_pensionado CHECK (fecha_fin > fecha_inicio),
    CONSTRAINT chk_cantidad_periodos CHECK (cantidad_periodos > 0)
);

-- Tabla de consumo diario
CREATE TABLE IF NOT EXISTS consumo_pensionados (
    id_consumo SERIAL PRIMARY KEY,
    id_pensionado INTEGER NOT NULL,
    id_restaurante INTEGER NOT NULL,
    fecha_consumo DATE NOT NULL,
    id_mesa INTEGER,
    id_venta INTEGER,
    
    -- Detalles del consumo
    tipo_comida VARCHAR(20) DEFAULT 'almuerzo', -- 'desayuno', 'almuerzo', 'cena'
    productos_consumidos JSONB NOT NULL DEFAULT '[]',
    total_consumido DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    
    -- Información adicional
    observaciones TEXT,
    mesero_asignado INTEGER,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT chk_tipo_comida CHECK (tipo_comida IN ('desayuno', 'almuerzo', 'cena')),
    CONSTRAINT chk_total_consumido CHECK (total_consumido >= 0)
);

-- Tabla de prefacturas consolidadas
CREATE TABLE IF NOT EXISTS prefacturas_pensionados (
    id_prefactura_pensionado SERIAL PRIMARY KEY,
    id_pensionado INTEGER NOT NULL,
    id_restaurante INTEGER NOT NULL,
    
    -- Período de facturación
    fecha_inicio_periodo DATE NOT NULL,
    fecha_fin_periodo DATE NOT NULL,
    
    -- Resumen del consumo
    total_dias INTEGER NOT NULL DEFAULT 0,
    total_consumo DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    descuentos_aplicados DECIMAL(12,2) DEFAULT 0.00,
    total_final DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    
    -- Estado de la prefactura
    estado VARCHAR(20) DEFAULT 'pendiente', -- 'pendiente', 'generada', 'enviada', 'pagada'
    fecha_generacion TIMESTAMP WITH TIME ZONE,
    fecha_envio TIMESTAMP WITH TIME ZONE,
    fecha_pago TIMESTAMP WITH TIME ZONE,
    
    -- Detalles de productos
    productos_detallados JSONB NOT NULL DEFAULT '[]',
    
    -- Información adicional
    observaciones TEXT,
    numero_factura VARCHAR(50),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT chk_estado_prefactura CHECK (estado IN ('pendiente', 'generada', 'enviada', 'pagada')),
    CONSTRAINT chk_fechas_prefactura CHECK (fecha_fin_periodo >= fecha_inicio_periodo),
    CONSTRAINT chk_total_dias CHECK (total_dias >= 0),
    CONSTRAINT chk_totales_prefactura CHECK (total_consumo >= 0 AND total_final >= 0)
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_pensionados_restaurante ON pensionados(id_restaurante);
CREATE INDEX IF NOT EXISTS idx_pensionados_estado ON pensionados(estado);
CREATE INDEX IF NOT EXISTS idx_pensionados_fecha_inicio ON pensionados(fecha_inicio);
CREATE INDEX IF NOT EXISTS idx_pensionados_fecha_fin ON pensionados(fecha_fin);
CREATE INDEX IF NOT EXISTS idx_pensionados_tipo_cliente ON pensionados(tipo_cliente);

CREATE INDEX IF NOT EXISTS idx_consumo_pensionado ON consumo_pensionados(id_pensionado);
CREATE INDEX IF NOT EXISTS idx_consumo_fecha ON consumo_pensionados(fecha_consumo);
CREATE INDEX IF NOT EXISTS idx_consumo_restaurante ON consumo_pensionados(id_restaurante);
CREATE INDEX IF NOT EXISTS idx_consumo_mesa ON consumo_pensionados(id_mesa);

CREATE INDEX IF NOT EXISTS idx_prefactura_pensionado ON prefacturas_pensionados(id_pensionado);
CREATE INDEX IF NOT EXISTS idx_prefactura_estado ON prefacturas_pensionados(estado);
CREATE INDEX IF NOT EXISTS idx_prefactura_fecha_inicio ON prefacturas_pensionados(fecha_inicio_periodo);
CREATE INDEX IF NOT EXISTS idx_prefactura_fecha_fin ON prefacturas_pensionados(fecha_fin_periodo);

-- Triggers para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_pensionados_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_pensionados_updated_at
    BEFORE UPDATE ON pensionados
    FOR EACH ROW
    EXECUTE FUNCTION update_pensionados_updated_at();

CREATE TRIGGER trigger_prefacturas_pensionados_updated_at
    BEFORE UPDATE ON prefacturas_pensionados
    FOR EACH ROW
    EXECUTE FUNCTION update_pensionados_updated_at();

-- Función para calcular días de consumo
CREATE OR REPLACE FUNCTION calcular_dias_consumo(id_pensionado_param INTEGER)
RETURNS INTEGER AS $$
DECLARE
    dias_count INTEGER;
BEGIN
    SELECT COUNT(DISTINCT fecha_consumo) INTO dias_count
    FROM consumo_pensionados
    WHERE id_pensionado = id_pensionado_param;
    
    RETURN dias_count;
END;
$$ LANGUAGE plpgsql;

-- Función para calcular total consumido
CREATE OR REPLACE FUNCTION calcular_total_consumido(id_pensionado_param INTEGER)
RETURNS DECIMAL(12,2) AS $$
DECLARE
    total DECIMAL(12,2);
BEGIN
    SELECT COALESCE(SUM(total_consumido), 0) INTO total
    FROM consumo_pensionados
    WHERE id_pensionado = id_pensionado_param;
    
    RETURN total;
END;
$$ LANGUAGE plpgsql;

-- Función para actualizar estadísticas del pensionado
CREATE OR REPLACE FUNCTION actualizar_estadisticas_pensionado(id_pensionado_param INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE pensionados
    SET 
        dias_consumo = calcular_dias_consumo(id_pensionado_param),
        total_consumido = calcular_total_consumido(id_pensionado_param),
        fecha_ultimo_consumo = (
            SELECT MAX(fecha_consumo)
            FROM consumo_pensionados
            WHERE id_pensionado = id_pensionado_param
        ),
        updated_at = NOW()
    WHERE id_pensionado = id_pensionado_param;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar estadísticas cuando se inserta consumo
CREATE OR REPLACE FUNCTION trigger_actualizar_estadisticas_consumo()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM actualizar_estadisticas_pensionado(NEW.id_pensionado);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_consumo_estadisticas
    AFTER INSERT OR UPDATE ON consumo_pensionados
    FOR EACH ROW
    EXECUTE FUNCTION trigger_actualizar_estadisticas_consumo();

-- Comentarios para documentación
COMMENT ON TABLE pensionados IS 'Tabla principal para gestión de pensionados del restaurante';
COMMENT ON TABLE consumo_pensionados IS 'Registro diario de consumo de pensionados';
COMMENT ON TABLE prefacturas_pensionados IS 'Prefacturas consolidadas por períodos de pensionados';

COMMENT ON COLUMN pensionados.tipo_cliente IS 'Tipo de cliente: individual, corporativo, evento';
COMMENT ON COLUMN pensionados.estado IS 'Estado del contrato: activo, pausado, finalizado, cancelado';
COMMENT ON COLUMN pensionados.descuento_aplicado IS 'Porcentaje de descuento aplicado (0-100)';
COMMENT ON COLUMN consumo_pensionados.productos_consumidos IS 'JSON con detalles de productos consumidos';
COMMENT ON COLUMN prefacturas_pensionados.productos_detallados IS 'JSON con resumen detallado de productos por período';
