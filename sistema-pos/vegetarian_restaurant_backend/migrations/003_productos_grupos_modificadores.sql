-- =====================================================
-- MIGRACIÓN 003: RELACIÓN PRODUCTOS-GRUPOS
-- Sistema: SITEMM POS - Toppings Profesional
-- Fecha: 2025-10-10
-- Descripción: Tabla de relación N:M entre productos y grupos
-- =====================================================

-- Verificar si ya existe la tabla
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                   WHERE table_name = 'productos_grupos_modificadores') THEN
        RAISE NOTICE 'Creando tabla productos_grupos_modificadores...';
    ELSE
        RAISE NOTICE 'La tabla productos_grupos_modificadores ya existe';
        RETURN;
    END IF;
END $$;

-- =====================================================
-- CREAR TABLA
-- =====================================================

CREATE TABLE IF NOT EXISTS productos_grupos_modificadores (
    id SERIAL PRIMARY KEY,
    id_producto INTEGER NOT NULL,
    id_grupo_modificador INTEGER NOT NULL,
    orden_display INTEGER DEFAULT 0,
    es_obligatorio BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(id_producto, id_grupo_modificador),
    
    -- Foreign keys
    CONSTRAINT fk_pgm_producto 
        FOREIGN KEY (id_producto) 
        REFERENCES productos(id_producto) 
        ON DELETE CASCADE,
        
    CONSTRAINT fk_pgm_grupo 
        FOREIGN KEY (id_grupo_modificador) 
        REFERENCES grupos_modificadores(id_grupo_modificador) 
        ON DELETE CASCADE
);

-- =====================================================
-- COMENTARIOS
-- =====================================================

COMMENT ON TABLE productos_grupos_modificadores IS 
    'Define qué grupos de modificadores aplican a cada producto';

-- =====================================================
-- ÍNDICES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_pgm_producto 
    ON productos_grupos_modificadores(id_producto);
    
CREATE INDEX IF NOT EXISTS idx_pgm_grupo 
    ON productos_grupos_modificadores(id_grupo_modificador);

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✓ Tabla productos_grupos_modificadores creada';
    RAISE NOTICE '✓ Constraint UNIQUE (producto, grupo) creada';
    RAISE NOTICE '✓ Foreign keys configuradas: 2';
    RAISE NOTICE '✓ Índices creados: 2';
END $$;

-- =====================================================
-- FIN DE MIGRACIÓN 003
-- =====================================================

