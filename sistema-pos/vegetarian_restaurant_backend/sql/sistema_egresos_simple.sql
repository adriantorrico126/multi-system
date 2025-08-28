-- =====================================================
-- SISTEMA SIMPLIFICADO DE EGRESOS
-- Diseño básico para gestión de gastos operativos
-- =====================================================

-- 1. TABLA DE CATEGORÍAS DE EGRESOS
-- ====================================
CREATE TABLE IF NOT EXISTS categorias_egresos (
    id_categoria_egreso SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    color VARCHAR(7) DEFAULT '#6B7280',
    icono VARCHAR(50) DEFAULT 'DollarSign',
    activo BOOLEAN DEFAULT TRUE,
    id_restaurante INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT fk_categorias_egresos_restaurante 
        FOREIGN KEY (id_restaurante) REFERENCES restaurantes(id_restaurante) ON DELETE CASCADE,
    CONSTRAINT uk_categorias_egresos_nombre_restaurante 
        UNIQUE (nombre, id_restaurante)
);

-- 2. TABLA PRINCIPAL DE EGRESOS
-- =============================
CREATE TABLE IF NOT EXISTS egresos (
    id_egreso SERIAL PRIMARY KEY,
    
    -- Información básica
    concepto VARCHAR(200) NOT NULL,
    descripcion TEXT,
    monto DECIMAL(12,2) NOT NULL CHECK (monto > 0),
    fecha_egreso DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Categorización
    id_categoria_egreso INTEGER NOT NULL,
    
    -- Método de pago
    metodo_pago VARCHAR(50) NOT NULL DEFAULT 'efectivo',
    
    -- Información del proveedor
    proveedor_nombre VARCHAR(150),
    proveedor_documento VARCHAR(50),
    proveedor_telefono VARCHAR(20),
    proveedor_email VARCHAR(100),
    
    -- Documentos de respaldo
    numero_factura VARCHAR(50),
    numero_recibo VARCHAR(50),
    numero_comprobante VARCHAR(50),
    
    -- Estados
    estado VARCHAR(30) DEFAULT 'pendiente',
    
    -- Auditoría
    registrado_por INTEGER NOT NULL, -- ID del vendedor que registró
    id_sucursal INTEGER NOT NULL,
    id_restaurante INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT fk_egresos_categoria 
        FOREIGN KEY (id_categoria_egreso) REFERENCES categorias_egresos(id_categoria_egreso),
    CONSTRAINT fk_egresos_registrado_por 
        FOREIGN KEY (registrado_por) REFERENCES vendedores(id_vendedor),
    CONSTRAINT fk_egresos_sucursal 
        FOREIGN KEY (id_sucursal) REFERENCES sucursales(id_sucursal),
    CONSTRAINT fk_egresos_restaurante 
        FOREIGN KEY (id_restaurante) REFERENCES restaurantes(id_restaurante) ON DELETE CASCADE,
    CONSTRAINT ck_egresos_estado 
        CHECK (estado IN ('pendiente', 'aprobado', 'pagado', 'cancelado', 'rechazado')),
    CONSTRAINT ck_egresos_metodo_pago 
        CHECK (metodo_pago IN ('efectivo', 'tarjeta_debito', 'tarjeta_credito', 'transferencia', 'cheque', 'otros'))
);

-- 3. TABLA DE PRESUPUESTOS DE EGRESOS
-- ====================================
CREATE TABLE IF NOT EXISTS presupuestos_egresos (
    id_presupuesto SERIAL PRIMARY KEY,
    
    -- Información básica
    anio INTEGER NOT NULL,
    mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
    id_categoria_egreso INTEGER NOT NULL,
    monto_presupuestado DECIMAL(12,2) NOT NULL CHECK (monto_presupuestado >= 0),
    monto_ejecutado DECIMAL(12,2) DEFAULT 0,
    
    -- Auditoría
    id_restaurante INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT fk_presupuestos_categoria 
        FOREIGN KEY (id_categoria_egreso) REFERENCES categorias_egresos(id_categoria_egreso),
    CONSTRAINT fk_presupuestos_restaurante 
        FOREIGN KEY (id_restaurante) REFERENCES restaurantes(id_restaurante) ON DELETE CASCADE,
    CONSTRAINT uk_presupuestos_anio_mes_categoria_restaurante 
        UNIQUE (anio, mes, id_categoria_egreso, id_restaurante)
);

-- 4. TRIGGERS PARA ACTUALIZAR TIMESTAMPS
-- ======================================

-- Trigger para categorias_egresos
CREATE OR REPLACE FUNCTION update_categorias_egresos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_categorias_egresos_updated_at
    BEFORE UPDATE ON categorias_egresos
    FOR EACH ROW
    EXECUTE FUNCTION update_categorias_egresos_updated_at();

-- Trigger para egresos
CREATE OR REPLACE FUNCTION update_egresos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_egresos_updated_at
    BEFORE UPDATE ON egresos
    FOR EACH ROW
    EXECUTE FUNCTION update_egresos_updated_at();

-- Trigger para presupuestos_egresos
CREATE OR REPLACE FUNCTION update_presupuestos_egresos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_presupuestos_egresos_updated_at
    BEFORE UPDATE ON presupuestos_egresos
    FOR EACH ROW
    EXECUTE FUNCTION update_presupuestos_egresos_updated_at();

-- 5. ÍNDICES PARA OPTIMIZAR CONSULTAS
-- ====================================

-- Índices para categorias_egresos
CREATE INDEX IF NOT EXISTS idx_categorias_egresos_restaurante ON categorias_egresos(id_restaurante);
CREATE INDEX IF NOT EXISTS idx_categorias_egresos_activo ON categorias_egresos(activo);

-- Índices para egresos
CREATE INDEX IF NOT EXISTS idx_egresos_restaurante ON egresos(id_restaurante);
CREATE INDEX IF NOT EXISTS idx_egresos_sucursal ON egresos(id_sucursal);
CREATE INDEX IF NOT EXISTS idx_egresos_categoria ON egresos(id_categoria_egreso);
CREATE INDEX IF NOT EXISTS idx_egresos_fecha ON egresos(fecha_egreso);
CREATE INDEX IF NOT EXISTS idx_egresos_estado ON egresos(estado);

-- Índices para presupuestos_egresos
CREATE INDEX IF NOT EXISTS idx_presupuestos_egresos_restaurante ON presupuestos_egresos(id_restaurante);
CREATE INDEX IF NOT EXISTS idx_presupuestos_egresos_anio_mes ON presupuestos_egresos(anio, mes);
CREATE INDEX IF NOT EXISTS idx_presupuestos_egresos_categoria ON presupuestos_egresos(id_categoria_egreso);
