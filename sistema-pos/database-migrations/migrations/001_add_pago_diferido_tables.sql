-- Migración: 001_add_pago_diferido_tables_minimal.sql
-- Descripción: Agregar tablas y columnas para el sistema de pago diferido (versión mínima)
-- Fecha: 2025-01-09
-- Autor: Sistema POS

-- =====================================================
-- 1. AGREGAR COLUMNAS A LA TABLA VENTAS
-- =====================================================

-- Agregar columnas para pago diferido en la tabla ventas
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS tipo_pago VARCHAR(50) DEFAULT 'anticipado';
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS estado_pago VARCHAR(50) DEFAULT 'pagado';
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS id_pago_final INTEGER;
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS fecha_pago_final TIMESTAMP;

-- Agregar comentarios para documentar las nuevas columnas
COMMENT ON COLUMN ventas.tipo_pago IS 'Tipo de pago: anticipado o diferido';
COMMENT ON COLUMN ventas.estado_pago IS 'Estado del pago: pagado, pendiente';
COMMENT ON COLUMN ventas.id_pago_final IS 'ID del método de pago usado al final (para pagos diferidos)';
COMMENT ON COLUMN ventas.fecha_pago_final IS 'Fecha y hora cuando se completó el pago diferido';

-- =====================================================
-- 2. CREAR TABLA PAGOS_DIFERIDOS
-- =====================================================

CREATE TABLE IF NOT EXISTS pagos_diferidos (
    id_pago_diferido SERIAL PRIMARY KEY,
    id_venta INTEGER NOT NULL,
    id_mesa INTEGER NOT NULL,
    id_restaurante INTEGER NOT NULL,
    total_pendiente NUMERIC(10,2) NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_vencimiento TIMESTAMP,
    estado VARCHAR(50) DEFAULT 'pendiente',
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Agregar comentarios
COMMENT ON TABLE pagos_diferidos IS 'Registro de pagos diferidos pendientes';
COMMENT ON COLUMN pagos_diferidos.id_pago_diferido IS 'ID único del pago diferido';
COMMENT ON COLUMN pagos_diferidos.id_venta IS 'ID de la venta asociada';
COMMENT ON COLUMN pagos_diferidos.id_mesa IS 'ID de la mesa';
COMMENT ON COLUMN pagos_diferidos.total_pendiente IS 'Monto total pendiente de pago';
COMMENT ON COLUMN pagos_diferidos.fecha_vencimiento IS 'Fecha límite para el pago';
COMMENT ON COLUMN pagos_diferidos.estado IS 'Estado: pendiente, pagado, vencido';

-- =====================================================
-- 3. CREAR TABLA HISTORIAL_PAGOS_DIFERIDOS
-- =====================================================

CREATE TABLE IF NOT EXISTS historial_pagos_diferidos (
    id_historial SERIAL PRIMARY KEY,
    id_pago_diferido INTEGER NOT NULL,
    id_venta INTEGER NOT NULL,
    id_mesa INTEGER NOT NULL,
    id_restaurante INTEGER NOT NULL,
    id_metodo_pago INTEGER NOT NULL,
    monto_pagado NUMERIC(10,2) NOT NULL,
    fecha_pago TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    observaciones TEXT,
    procesado_por INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Agregar comentarios
COMMENT ON TABLE historial_pagos_diferidos IS 'Historial de pagos diferidos procesados';
COMMENT ON COLUMN historial_pagos_diferidos.id_historial IS 'ID único del registro histórico';
COMMENT ON COLUMN historial_pagos_diferidos.monto_pagado IS 'Monto pagado en esta transacción';
COMMENT ON COLUMN historial_pagos_diferidos.fecha_pago IS 'Fecha y hora del pago';
COMMENT ON COLUMN historial_pagos_diferidos.procesado_por IS 'ID del vendedor que procesó el pago';

-- =====================================================
-- 4. CREAR ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

-- Índices para la tabla ventas
CREATE INDEX IF NOT EXISTS idx_ventas_tipo_pago ON ventas(tipo_pago);
CREATE INDEX IF NOT EXISTS idx_ventas_estado_pago ON ventas(estado_pago);
CREATE INDEX IF NOT EXISTS idx_ventas_fecha_pago_final ON ventas(fecha_pago_final);

-- Índices para la tabla pagos_diferidos
CREATE INDEX IF NOT EXISTS idx_pagos_diferidos_venta ON pagos_diferidos(id_venta);
CREATE INDEX IF NOT EXISTS idx_pagos_diferidos_mesa ON pagos_diferidos(id_mesa);
CREATE INDEX IF NOT EXISTS idx_pagos_diferidos_restaurante ON pagos_diferidos(id_restaurante);
CREATE INDEX IF NOT EXISTS idx_pagos_diferidos_estado ON pagos_diferidos(estado);
CREATE INDEX IF NOT EXISTS idx_pagos_diferidos_fecha_creacion ON pagos_diferidos(fecha_creacion);

-- Índices para la tabla historial_pagos_diferidos
CREATE INDEX IF NOT EXISTS idx_historial_pagos_diferidos_pago ON historial_pagos_diferidos(id_pago_diferido);
CREATE INDEX IF NOT EXISTS idx_historial_pagos_diferidos_venta ON historial_pagos_diferidos(id_venta);
CREATE INDEX IF NOT EXISTS idx_historial_pagos_diferidos_mesa ON historial_pagos_diferidos(id_mesa);
CREATE INDEX IF NOT EXISTS idx_historial_pagos_diferidos_fecha_pago ON historial_pagos_diferidos(fecha_pago);

-- =====================================================
-- 5. CREAR FUNCIÓN SIMPLE PARA MARCAR VENTA DIFERIDA COMO PAGADA
-- =====================================================

CREATE OR REPLACE FUNCTION marcar_venta_diferida_como_pagada(
    p_id_venta INTEGER,
    p_id_pago_final INTEGER,
    p_observaciones TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
    -- Actualizar la venta
    UPDATE ventas 
    SET estado_pago = 'pagado',
        id_pago_final = p_id_pago_final,
        fecha_pago_final = CURRENT_TIMESTAMP
    WHERE id_venta = p_id_venta;
    
    -- Actualizar estado del pago diferido si existe
    UPDATE pagos_diferidos 
    SET estado = 'pagado',
        updated_at = CURRENT_TIMESTAMP
    WHERE id_venta = p_id_venta;
    
    RETURN TRUE;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error al marcar venta como pagada: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Agregar comentario a la función
COMMENT ON FUNCTION marcar_venta_diferida_como_pagada IS 'Marca una venta de pago diferido como pagada';

-- =====================================================
-- 6. CREAR TRIGGER PARA ACTUALIZAR TIMESTAMPS
-- =====================================================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para pagos_diferidos
DROP TRIGGER IF EXISTS trigger_update_pagos_diferidos_updated_at ON pagos_diferidos;
CREATE TRIGGER trigger_update_pagos_diferidos_updated_at
    BEFORE UPDATE ON pagos_diferidos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 7. VERIFICACIONES FINALES
-- =====================================================

-- Verificar que las columnas se crearon correctamente
DO $$
BEGIN
    -- Verificar columnas en ventas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ventas' AND column_name = 'tipo_pago'
    ) THEN
        RAISE EXCEPTION 'La columna tipo_pago no se creó en la tabla ventas';
    END IF;
    
    -- Verificar que las tablas se crearon
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'pagos_diferidos'
    ) THEN
        RAISE EXCEPTION 'La tabla pagos_diferidos no se creó';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'historial_pagos_diferidos'
    ) THEN
        RAISE EXCEPTION 'La tabla historial_pagos_diferidos no se creó';
    END IF;
    
    RAISE NOTICE 'Migración completada exitosamente';
END $$;
