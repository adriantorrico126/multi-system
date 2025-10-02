-- =====================================================
-- DISEÑO PROFESIONAL: SISTEMA DE STOCK POR SUCURSAL
-- =====================================================
-- Autor: Sistema POS - Inventario por Sucursal
-- Fecha: $(date)
-- Objetivo: Implementar stock independiente por sucursal
-- =====================================================

-- 1. CREAR TABLA STOCK_SUCURSAL
-- =====================================================
CREATE TABLE IF NOT EXISTS stock_sucursal (
    id_stock_sucursal SERIAL PRIMARY KEY,
    id_producto INTEGER NOT NULL,
    id_sucursal INTEGER NOT NULL,
    stock_actual INTEGER DEFAULT 0 CHECK (stock_actual >= 0),
    stock_minimo INTEGER DEFAULT 0 CHECK (stock_minimo >= 0),
    stock_maximo INTEGER DEFAULT 1000 CHECK (stock_maximo >= 0),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Constraints de integridad
    CONSTRAINT fk_stock_producto FOREIGN KEY (id_producto) REFERENCES productos(id_producto) ON DELETE CASCADE,
    CONSTRAINT fk_stock_sucursal FOREIGN KEY (id_sucursal) REFERENCES sucursales(id_sucursal) ON DELETE CASCADE,
    CONSTRAINT unique_stock_sucursal UNIQUE (id_producto, id_sucursal),
    CONSTRAINT check_stock_min_max CHECK (stock_minimo <= stock_maximo)
);

-- 2. ÍNDICES PARA RENDIMIENTO
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_stock_sucursal_producto ON stock_sucursal(id_producto);
CREATE INDEX IF NOT EXISTS idx_stock_sucursal_sucursal ON stock_sucursal(id_sucursal);
CREATE INDEX IF NOT EXISTS idx_stock_sucursal_activo ON stock_sucursal(activo);
CREATE INDEX IF NOT EXISTS idx_stock_sucursal_stock_bajo ON stock_sucursal(stock_actual) WHERE stock_actual <= stock_minimo;
CREATE INDEX IF NOT EXISTS idx_stock_sucursal_composite ON stock_sucursal(id_sucursal, id_producto, activo);

-- 3. ACTUALIZAR TABLA INVENTARIO_LOTES
-- =====================================================
-- Agregar columna id_sucursal si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'inventario_lotes' 
        AND column_name = 'id_sucursal'
    ) THEN
        ALTER TABLE inventario_lotes ADD COLUMN id_sucursal INTEGER;
        ALTER TABLE inventario_lotes ADD CONSTRAINT fk_lotes_sucursal FOREIGN KEY (id_sucursal) REFERENCES sucursales(id_sucursal) ON DELETE SET NULL;
    END IF;
END $$;

-- 4. ACTUALIZAR TABLA MOVIMIENTOS_INVENTARIO
-- =====================================================
-- Agregar columna id_sucursal si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'movimientos_inventario' 
        AND column_name = 'id_sucursal'
    ) THEN
        ALTER TABLE movimientos_inventario ADD COLUMN id_sucursal INTEGER;
        ALTER TABLE movimientos_inventario ADD CONSTRAINT fk_movimientos_sucursal FOREIGN KEY (id_sucursal) REFERENCES sucursales(id_sucursal) ON DELETE SET NULL;
    END IF;
END $$;

-- 5. ACTUALIZAR TABLA ALERTAS_INVENTARIO
-- =====================================================
-- Agregar columna id_sucursal si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'alertas_inventario' 
        AND column_name = 'id_sucursal'
    ) THEN
        ALTER TABLE alertas_inventario ADD COLUMN id_sucursal INTEGER;
        ALTER TABLE alertas_inventario ADD CONSTRAINT fk_alertas_sucursal FOREIGN KEY (id_sucursal) REFERENCES sucursales(id_sucursal) ON DELETE SET NULL;
    END IF;
END $$;

-- 6. TRIGGER PARA ACTUALIZAR updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_stock_sucursal_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_stock_sucursal_timestamp
    BEFORE UPDATE ON stock_sucursal
    FOR EACH ROW
    EXECUTE FUNCTION update_stock_sucursal_timestamp();

-- 7. FUNCIÓN PARA CREAR STOCK INICIAL POR SUCURSAL
-- =====================================================
CREATE OR REPLACE FUNCTION crear_stock_por_sucursal()
RETURNS TABLE (
    productos_creados INTEGER,
    sucursales_procesadas INTEGER,
    mensaje TEXT
) AS $$
DECLARE
    total_productos INTEGER;
    total_sucursales INTEGER;
    productos_creados_count INTEGER := 0;
    sucursales_procesadas_count INTEGER := 0;
BEGIN
    -- Contar productos activos por restaurante
    SELECT COUNT(*) INTO total_productos FROM productos WHERE activo = true;
    
    -- Contar sucursales activas
    SELECT COUNT(*) INTO total_sucursales FROM sucursales WHERE activo = true;
    
    -- Crear registros de stock para cada producto en cada sucursal
    INSERT INTO stock_sucursal (id_producto, id_sucursal, stock_actual, stock_minimo, stock_maximo)
    SELECT 
        p.id_producto,
        s.id_sucursal,
        CASE 
            WHEN p.stock_actual > 0 THEN GREATEST(1, FLOOR(p.stock_actual / (
                SELECT COUNT(*) FROM sucursales s2 
                WHERE s2.id_restaurante = p.id_restaurante AND s2.activo = true
            )))
            ELSE 0 
        END,
        5, -- Stock mínimo por defecto
        100 -- Stock máximo por defecto
    FROM productos p
    JOIN sucursales s ON s.id_restaurante = p.id_restaurante
    WHERE p.activo = true 
      AND s.activo = true
    ON CONFLICT (id_producto, id_sucursal) DO NOTHING;
    
    GET DIAGNOSTICS productos_creados_count = ROW_COUNT;
    sucursales_procesadas_count := total_sucursales;
    
    RETURN QUERY SELECT 
        productos_creados_count,
        sucursales_procesadas_count,
        'Stock por sucursal creado exitosamente'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- 8. FUNCIÓN PARA OBTENER STOCK POR SUCURSAL
-- =====================================================
CREATE OR REPLACE FUNCTION obtener_stock_sucursal(
    p_id_producto INTEGER,
    p_id_sucursal INTEGER
)
RETURNS INTEGER AS $$
DECLARE
    stock_actual INTEGER;
BEGIN
    SELECT stock_actual INTO stock_actual
    FROM stock_sucursal
    WHERE id_producto = p_id_producto 
      AND id_sucursal = p_id_sucursal 
      AND activo = true;
    
    RETURN COALESCE(stock_actual, 0);
END;
$$ LANGUAGE plpgsql;

-- 9. FUNCIÓN PARA ACTUALIZAR STOCK POR SUCURSAL
-- =====================================================
CREATE OR REPLACE FUNCTION actualizar_stock_sucursal(
    p_id_producto INTEGER,
    p_id_sucursal INTEGER,
    p_cantidad_cambio INTEGER,
    p_tipo_movimiento VARCHAR(50),
    p_id_vendedor INTEGER DEFAULT NULL,
    p_motivo TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    stock_anterior INTEGER;
    stock_nuevo INTEGER;
    movimiento_id INTEGER;
    resultado JSON;
BEGIN
    -- Obtener stock actual
    SELECT stock_actual INTO stock_anterior
    FROM stock_sucursal
    WHERE id_producto = p_id_producto 
      AND id_sucursal = p_id_sucursal 
      AND activo = true;
    
    -- Si no existe registro, crear uno
    IF stock_anterior IS NULL THEN
        INSERT INTO stock_sucursal (id_producto, id_sucursal, stock_actual, stock_minimo, stock_maximo)
        VALUES (p_id_producto, p_id_sucursal, 0, 5, 100)
        ON CONFLICT (id_producto, id_sucursal) DO NOTHING;
        
        stock_anterior := 0;
    END IF;
    
    -- Calcular nuevo stock
    stock_nuevo := GREATEST(0, stock_anterior + p_cantidad_cambio);
    
    -- Actualizar stock
    UPDATE stock_sucursal
    SET stock_actual = stock_nuevo,
        updated_at = NOW()
    WHERE id_producto = p_id_producto 
      AND id_sucursal = p_id_sucursal;
    
    -- Registrar movimiento
    INSERT INTO movimientos_inventario (
        id_producto, 
        id_sucursal,
        tipo_movimiento, 
        cantidad, 
        stock_anterior, 
        stock_actual, 
        id_vendedor, 
        id_restaurante,
        motivo
    )
    SELECT 
        p_id_producto,
        p_id_sucursal,
        p_tipo_movimiento,
        ABS(p_cantidad_cambio),
        stock_anterior,
        stock_nuevo,
        p_id_vendedor,
        s.id_restaurante,
        p_motivo
    FROM sucursales s
    WHERE s.id_sucursal = p_id_sucursal
    RETURNING id_movimiento INTO movimiento_id;
    
    -- Retornar resultado
    resultado := json_build_object(
        'success', true,
        'id_movimiento', movimiento_id,
        'stock_anterior', stock_anterior,
        'stock_nuevo', stock_nuevo,
        'cantidad_cambio', p_cantidad_cambio
    );
    
    RETURN resultado;
END;
$$ LANGUAGE plpgsql;

-- 10. COMENTARIOS Y DOCUMENTACIÓN
-- =====================================================
COMMENT ON TABLE stock_sucursal IS 'Control de stock por sucursal - Reemplaza stock global por restaurante';
COMMENT ON COLUMN stock_sucursal.stock_actual IS 'Stock actual disponible en la sucursal específica';
COMMENT ON COLUMN stock_sucursal.stock_minimo IS 'Nivel mínimo de stock para alertas';
COMMENT ON COLUMN stock_sucursal.stock_maximo IS 'Nivel máximo de stock recomendado';

COMMENT ON FUNCTION crear_stock_por_sucursal() IS 'Inicializa stock por sucursal basado en stock actual por restaurante';
COMMENT ON FUNCTION obtener_stock_sucursal(INTEGER, INTEGER) IS 'Obtiene el stock actual de un producto en una sucursal específica';
COMMENT ON FUNCTION actualizar_stock_sucursal(INTEGER, INTEGER, INTEGER, VARCHAR, INTEGER, TEXT) IS 'Actualiza stock de producto en sucursal específica y registra movimiento';
