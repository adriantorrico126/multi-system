-- =====================================================
-- SISTEMA PROFESIONAL DE EGRESOS
-- Diseño completo para gestión de gastos operativos
-- =====================================================

-- 1. TABLA DE CATEGORÍAS DE EGRESOS
-- ====================================
CREATE TABLE IF NOT EXISTS categorias_egresos (
    id_categoria_egreso SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    color VARCHAR(7) DEFAULT '#6B7280', -- Color hexadecimal para UI
    icono VARCHAR(50) DEFAULT 'DollarSign', -- Icono de Lucide React
    activo BOOLEAN DEFAULT TRUE,
    id_restaurante INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Constraints
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
    -- efectivo, tarjeta_debito, tarjeta_credito, transferencia, cheque, otros
    
    -- Información del proveedor/destinatario
    proveedor_nombre VARCHAR(150),
    proveedor_documento VARCHAR(50),
    proveedor_telefono VARCHAR(20),
    proveedor_email VARCHAR(100),
    
    -- Documentos de respaldo
    numero_factura VARCHAR(50),
    numero_recibo VARCHAR(50),
    numero_comprobante VARCHAR(50),
    
    -- Estados y aprobaciones
    estado VARCHAR(30) DEFAULT 'pendiente',
    -- pendiente, aprobado, pagado, cancelado, rechazado
    
    requiere_aprobacion BOOLEAN DEFAULT FALSE,
    aprobado_por INTEGER, -- ID del usuario que aprobó
    fecha_aprobacion TIMESTAMP,
    comentario_aprobacion TEXT,
    
    -- Información fiscal/contable
    es_deducible BOOLEAN DEFAULT TRUE,
    numero_autorizacion_fiscal VARCHAR(50),
    codigo_control VARCHAR(50),
    
    -- Recurrencia (para gastos fijos)
    es_recurrente BOOLEAN DEFAULT FALSE,
    frecuencia_recurrencia VARCHAR(20), -- mensual, semanal, anual
    proxima_fecha_recurrencia DATE,
    
    -- Archivos adjuntos
    archivos_adjuntos JSONB DEFAULT '[]', -- URLs de archivos
    
    -- Auditoría
    registrado_por INTEGER NOT NULL,
    id_sucursal INTEGER NOT NULL,
    id_restaurante INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT fk_egresos_categoria 
        FOREIGN KEY (id_categoria_egreso) REFERENCES categorias_egresos(id_categoria_egreso),
    CONSTRAINT fk_egresos_aprobado_por 
        FOREIGN KEY (aprobado_por) REFERENCES users(id),
    CONSTRAINT fk_egresos_registrado_por 
        FOREIGN KEY (registrado_por) REFERENCES users(id),
    CONSTRAINT fk_egresos_sucursal 
        FOREIGN KEY (id_sucursal) REFERENCES sucursales(id_sucursal),
    CONSTRAINT fk_egresos_restaurante 
        FOREIGN KEY (id_restaurante) REFERENCES restaurantes(id_restaurante) ON DELETE CASCADE,
    CONSTRAINT ck_egresos_estado 
        CHECK (estado IN ('pendiente', 'aprobado', 'pagado', 'cancelado', 'rechazado')),
    CONSTRAINT ck_egresos_metodo_pago 
        CHECK (metodo_pago IN ('efectivo', 'tarjeta_debito', 'tarjeta_credito', 'transferencia', 'cheque', 'otros')),
    CONSTRAINT ck_egresos_frecuencia 
        CHECK (frecuencia_recurrencia IS NULL OR frecuencia_recurrencia IN ('diario', 'semanal', 'mensual', 'anual'))
);

-- 3. TABLA DE PRESUPUESTOS POR CATEGORÍA
-- ======================================
CREATE TABLE IF NOT EXISTS presupuestos_egresos (
    id_presupuesto SERIAL PRIMARY KEY,
    
    -- Período del presupuesto
    anio INTEGER NOT NULL,
    mes INTEGER CHECK (mes BETWEEN 1 AND 12),
    
    -- Categoría y monto
    id_categoria_egreso INTEGER NOT NULL,
    monto_presupuestado DECIMAL(12,2) NOT NULL CHECK (monto_presupuestado >= 0),
    monto_gastado DECIMAL(12,2) DEFAULT 0 CHECK (monto_gastado >= 0),
    
    -- Estado
    activo BOOLEAN DEFAULT TRUE,
    
    -- Auditoría
    id_restaurante INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT fk_presupuestos_categoria 
        FOREIGN KEY (id_categoria_egreso) REFERENCES categorias_egresos(id_categoria_egreso),
    CONSTRAINT fk_presupuestos_restaurante 
        FOREIGN KEY (id_restaurante) REFERENCES restaurantes(id_restaurante) ON DELETE CASCADE,
    CONSTRAINT uk_presupuestos_categoria_periodo 
        UNIQUE (id_categoria_egreso, anio, mes, id_restaurante)
);

-- 4. TABLA DE FLUJO DE APROBACIONES
-- =================================
CREATE TABLE IF NOT EXISTS flujo_aprobaciones_egresos (
    id_flujo SERIAL PRIMARY KEY,
    
    -- Egreso relacionado
    id_egreso INTEGER NOT NULL,
    
    -- Usuario y acción
    id_usuario INTEGER NOT NULL,
    accion VARCHAR(20) NOT NULL, -- solicitado, aprobado, rechazado, pagado
    comentario TEXT,
    
    -- Auditoría
    fecha_accion TIMESTAMP DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT fk_flujo_egreso 
        FOREIGN KEY (id_egreso) REFERENCES egresos(id_egreso) ON DELETE CASCADE,
    CONSTRAINT fk_flujo_usuario 
        FOREIGN KEY (id_usuario) REFERENCES users(id),
    CONSTRAINT ck_flujo_accion 
        CHECK (accion IN ('solicitado', 'aprobado', 'rechazado', 'pagado', 'cancelado'))
);

-- 5. TABLA DE ARCHIVOS ADJUNTOS
-- =============================
CREATE TABLE IF NOT EXISTS archivos_egresos (
    id_archivo SERIAL PRIMARY KEY,
    
    -- Egreso relacionado
    id_egreso INTEGER NOT NULL,
    
    -- Información del archivo
    nombre_archivo VARCHAR(255) NOT NULL,
    ruta_archivo VARCHAR(500) NOT NULL,
    tipo_archivo VARCHAR(50), -- factura, recibo, comprobante, imagen, pdf
    tamaño_archivo INTEGER, -- en bytes
    
    -- Auditoría
    subido_por INTEGER NOT NULL,
    fecha_subida TIMESTAMP DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT fk_archivos_egreso 
        FOREIGN KEY (id_egreso) REFERENCES egresos(id_egreso) ON DELETE CASCADE,
    CONSTRAINT fk_archivos_usuario 
        FOREIGN KEY (subido_por) REFERENCES users(id)
);

-- =====================================================
-- TRIGGERS PARA AUTOMATIZACIÓN
-- =====================================================

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION actualizar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a todas las tablas relevantes
CREATE TRIGGER trigger_categorias_egresos_updated_at
    BEFORE UPDATE ON categorias_egresos
    FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();

CREATE TRIGGER trigger_egresos_updated_at
    BEFORE UPDATE ON egresos
    FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();

CREATE TRIGGER trigger_presupuestos_egresos_updated_at
    BEFORE UPDATE ON presupuestos_egresos
    FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();

-- Trigger para actualizar monto gastado en presupuestos
CREATE OR REPLACE FUNCTION actualizar_presupuesto_gastado()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo actualizar si el egreso está pagado o aprobado
    IF NEW.estado IN ('pagado', 'aprobado') THEN
        -- Actualizar el monto gastado en el presupuesto correspondiente
        UPDATE presupuestos_egresos 
        SET monto_gastado = (
            SELECT COALESCE(SUM(monto), 0)
            FROM egresos 
            WHERE id_categoria_egreso = NEW.id_categoria_egreso
              AND id_restaurante = NEW.id_restaurante
              AND estado IN ('pagado', 'aprobado')
              AND EXTRACT(YEAR FROM fecha_egreso) = presupuestos_egresos.anio
              AND EXTRACT(MONTH FROM fecha_egreso) = presupuestos_egresos.mes
        )
        WHERE id_categoria_egreso = NEW.id_categoria_egreso
          AND id_restaurante = NEW.id_restaurante
          AND anio = EXTRACT(YEAR FROM NEW.fecha_egreso)
          AND mes = EXTRACT(MONTH FROM NEW.fecha_egreso);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_presupuesto
    AFTER INSERT OR UPDATE ON egresos
    FOR EACH ROW EXECUTE FUNCTION actualizar_presupuesto_gastado();

-- Trigger para registrar flujo de aprobaciones automáticamente
CREATE OR REPLACE FUNCTION registrar_flujo_aprobacion()
RETURNS TRIGGER AS $$
BEGIN
    -- Registrar cambios de estado
    IF TG_OP = 'INSERT' THEN
        INSERT INTO flujo_aprobaciones_egresos (id_egreso, id_usuario, accion, comentario)
        VALUES (NEW.id_egreso, NEW.registrado_por, 'solicitado', 'Egreso registrado');
    ELSIF TG_OP = 'UPDATE' AND OLD.estado != NEW.estado THEN
        INSERT INTO flujo_aprobaciones_egresos (id_egreso, id_usuario, accion, comentario)
        VALUES (NEW.id_egreso, COALESCE(NEW.aprobado_por, NEW.registrado_por), NEW.estado, NEW.comentario_aprobacion);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_flujo_aprobacion
    AFTER INSERT OR UPDATE ON egresos
    FOR EACH ROW EXECUTE FUNCTION registrar_flujo_aprobacion();

-- =====================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

-- Índices para consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_egresos_fecha_restaurante ON egresos(fecha_egreso, id_restaurante);
CREATE INDEX IF NOT EXISTS idx_egresos_categoria_fecha ON egresos(id_categoria_egreso, fecha_egreso);
CREATE INDEX IF NOT EXISTS idx_egresos_estado_restaurante ON egresos(estado, id_restaurante);
CREATE INDEX IF NOT EXISTS idx_egresos_sucursal_fecha ON egresos(id_sucursal, fecha_egreso);
CREATE INDEX IF NOT EXISTS idx_egresos_proveedor ON egresos(proveedor_nombre);
CREATE INDEX IF NOT EXISTS idx_egresos_metodo_pago ON egresos(metodo_pago);
CREATE INDEX IF NOT EXISTS idx_egresos_recurrente ON egresos(es_recurrente, proxima_fecha_recurrencia) WHERE es_recurrente = TRUE;

CREATE INDEX IF NOT EXISTS idx_presupuestos_categoria_periodo ON presupuestos_egresos(id_categoria_egreso, anio, mes);
CREATE INDEX IF NOT EXISTS idx_flujo_egreso_fecha ON flujo_aprobaciones_egresos(id_egreso, fecha_accion);

-- =====================================================
-- VISTAS PARA REPORTES Y CONSULTAS COMUNES
-- =====================================================

-- Vista resumen de egresos por categoría
CREATE OR REPLACE VIEW v_resumen_egresos_categoria AS
SELECT 
    ce.id_categoria_egreso,
    ce.nombre as categoria_nombre,
    ce.color as categoria_color,
    ce.icono as categoria_icono,
    e.id_restaurante,
    COUNT(e.id_egreso) as total_egresos,
    COALESCE(SUM(CASE WHEN e.estado IN ('pagado', 'aprobado') THEN e.monto ELSE 0 END), 0) as total_gastado,
    COALESCE(SUM(CASE WHEN e.estado = 'pendiente' THEN e.monto ELSE 0 END), 0) as total_pendiente,
    COALESCE(AVG(CASE WHEN e.estado IN ('pagado', 'aprobado') THEN e.monto ELSE NULL END), 0) as promedio_gasto
FROM categorias_egresos ce
LEFT JOIN egresos e ON ce.id_categoria_egreso = e.id_categoria_egreso
WHERE ce.activo = TRUE
GROUP BY ce.id_categoria_egreso, ce.nombre, ce.color, ce.icono, e.id_restaurante;

-- Vista de egresos con detalles completos
CREATE OR REPLACE VIEW v_egresos_detallados AS
SELECT 
    e.id_egreso,
    e.concepto,
    e.descripcion,
    e.monto,
    e.fecha_egreso,
    e.estado,
    e.metodo_pago,
    e.proveedor_nombre,
    e.numero_factura,
    e.es_recurrente,
    ce.nombre as categoria_nombre,
    ce.color as categoria_color,
    ce.icono as categoria_icono,
    u_reg.username as registrado_por_username,
    u_apr.username as aprobado_por_username,
    s.nombre as sucursal_nombre,
    r.nombre as restaurante_nombre,
    e.created_at,
    e.updated_at
FROM egresos e
LEFT JOIN categorias_egresos ce ON e.id_categoria_egreso = ce.id_categoria_egreso
LEFT JOIN users u_reg ON e.registrado_por = u_reg.id
LEFT JOIN users u_apr ON e.aprobado_por = u_apr.id
LEFT JOIN sucursales s ON e.id_sucursal = s.id_sucursal
LEFT JOIN restaurantes r ON e.id_restaurante = r.id_restaurante;

-- Vista de presupuestos vs gastos reales
CREATE OR REPLACE VIEW v_presupuestos_vs_real AS
SELECT 
    p.id_presupuesto,
    p.anio,
    p.mes,
    p.monto_presupuestado,
    p.monto_gastado,
    (p.monto_presupuestado - p.monto_gastado) as diferencia,
    CASE 
        WHEN p.monto_presupuestado > 0 THEN 
            ROUND((p.monto_gastado * 100.0 / p.monto_presupuestado), 2)
        ELSE 0 
    END as porcentaje_ejecutado,
    ce.nombre as categoria_nombre,
    ce.color as categoria_color,
    p.id_restaurante
FROM presupuestos_egresos p
JOIN categorias_egresos ce ON p.id_categoria_egreso = ce.id_categoria_egreso
WHERE p.activo = TRUE;

-- =====================================================
-- FUNCIONES ÚTILES
-- =====================================================

-- Función para obtener el total de egresos por período
CREATE OR REPLACE FUNCTION obtener_total_egresos(
    p_id_restaurante INTEGER,
    p_fecha_inicio DATE,
    p_fecha_fin DATE,
    p_estado VARCHAR DEFAULT NULL
)
RETURNS DECIMAL(12,2) AS $$
BEGIN
    RETURN (
        SELECT COALESCE(SUM(monto), 0)
        FROM egresos
        WHERE id_restaurante = p_id_restaurante
          AND fecha_egreso BETWEEN p_fecha_inicio AND p_fecha_fin
          AND (p_estado IS NULL OR estado = p_estado)
    );
END;
$$ LANGUAGE plpgsql;

-- Función para generar egresos recurrentes
CREATE OR REPLACE FUNCTION generar_egresos_recurrentes()
RETURNS INTEGER AS $$
DECLARE
    egreso_rec RECORD;
    nueva_fecha DATE;
    egresos_generados INTEGER := 0;
BEGIN
    -- Buscar egresos recurrentes que necesitan nueva generación
    FOR egreso_rec IN 
        SELECT * FROM egresos 
        WHERE es_recurrente = TRUE 
          AND proxima_fecha_recurrencia <= CURRENT_DATE
          AND estado = 'pagado' -- Solo generar desde egresos ya pagados
    LOOP
        -- Calcular próxima fecha según frecuencia
        CASE egreso_rec.frecuencia_recurrencia
            WHEN 'diario' THEN nueva_fecha := egreso_rec.proxima_fecha_recurrencia + INTERVAL '1 day';
            WHEN 'semanal' THEN nueva_fecha := egreso_rec.proxima_fecha_recurrencia + INTERVAL '1 week';
            WHEN 'mensual' THEN nueva_fecha := egreso_rec.proxima_fecha_recurrencia + INTERVAL '1 month';
            WHEN 'anual' THEN nueva_fecha := egreso_rec.proxima_fecha_recurrencia + INTERVAL '1 year';
            ELSE nueva_fecha := egreso_rec.proxima_fecha_recurrencia + INTERVAL '1 month';
        END CASE;
        
        -- Crear nuevo egreso
        INSERT INTO egresos (
            concepto, descripcion, monto, fecha_egreso,
            id_categoria_egreso, metodo_pago, proveedor_nombre,
            proveedor_documento, estado, es_recurrente,
            frecuencia_recurrencia, proxima_fecha_recurrencia,
            registrado_por, id_sucursal, id_restaurante
        ) VALUES (
            egreso_rec.concepto, egreso_rec.descripcion, egreso_rec.monto, nueva_fecha,
            egreso_rec.id_categoria_egreso, egreso_rec.metodo_pago, egreso_rec.proveedor_nombre,
            egreso_rec.proveedor_documento, 'pendiente', TRUE,
            egreso_rec.frecuencia_recurrencia, nueva_fecha,
            egreso_rec.registrado_por, egreso_rec.id_sucursal, egreso_rec.id_restaurante
        );
        
        -- Actualizar próxima fecha en el egreso original
        UPDATE egresos 
        SET proxima_fecha_recurrencia = nueva_fecha
        WHERE id_egreso = egreso_rec.id_egreso;
        
        egresos_generados := egresos_generados + 1;
    END LOOP;
    
    RETURN egresos_generados;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMENTARIOS FINALES
-- =====================================================

-- Este esquema proporciona:
-- 1. Gestión completa de categorías de egresos
-- 2. Registro detallado de gastos con aprobaciones
-- 3. Sistema de presupuestos y control
-- 4. Flujo de aprobaciones auditable
-- 5. Gestión de archivos adjuntos
-- 6. Egresos recurrentes automatizados
-- 7. Vistas optimizadas para reportes
-- 8. Funciones utilitarias
-- 9. Triggers para automatización
-- 10. Índices para rendimiento óptimo
