-- =====================================================
-- MIGRACIÓN 002: MEJORAR PRODUCTOS_MODIFICADORES
-- Sistema: SITEMM POS - Toppings Profesional
-- Fecha: 2025-10-10
-- Descripción: Agrega campos adicionales a productos_modificadores
-- =====================================================

-- =====================================================
-- AGREGAR NUEVAS COLUMNAS (Solo si no existen)
-- =====================================================

DO $$
BEGIN
    -- id_grupo_modificador
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'productos_modificadores' 
        AND column_name = 'id_grupo_modificador'
    ) THEN
        ALTER TABLE productos_modificadores 
            ADD COLUMN id_grupo_modificador INTEGER;
        RAISE NOTICE '✓ Columna id_grupo_modificador agregada';
    ELSE
        RAISE NOTICE '- Columna id_grupo_modificador ya existe';
    END IF;

    -- stock_disponible
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'productos_modificadores' 
        AND column_name = 'stock_disponible'
    ) THEN
        ALTER TABLE productos_modificadores 
            ADD COLUMN stock_disponible INTEGER;
        RAISE NOTICE '✓ Columna stock_disponible agregada';
    ELSE
        RAISE NOTICE '- Columna stock_disponible ya existe';
    END IF;

    -- controlar_stock
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'productos_modificadores' 
        AND column_name = 'controlar_stock'
    ) THEN
        ALTER TABLE productos_modificadores 
            ADD COLUMN controlar_stock BOOLEAN DEFAULT false;
        RAISE NOTICE '✓ Columna controlar_stock agregada';
    ELSE
        RAISE NOTICE '- Columna controlar_stock ya existe';
    END IF;

    -- imagen_url
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'productos_modificadores' 
        AND column_name = 'imagen_url'
    ) THEN
        ALTER TABLE productos_modificadores 
            ADD COLUMN imagen_url TEXT;
        RAISE NOTICE '✓ Columna imagen_url agregada';
    ELSE
        RAISE NOTICE '- Columna imagen_url ya existe';
    END IF;

    -- descripcion
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'productos_modificadores' 
        AND column_name = 'descripcion'
    ) THEN
        ALTER TABLE productos_modificadores 
            ADD COLUMN descripcion TEXT;
        RAISE NOTICE '✓ Columna descripcion agregada';
    ELSE
        RAISE NOTICE '- Columna descripcion ya existe';
    END IF;

    -- calorias
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'productos_modificadores' 
        AND column_name = 'calorias'
    ) THEN
        ALTER TABLE productos_modificadores 
            ADD COLUMN calorias INTEGER;
        RAISE NOTICE '✓ Columna calorias agregada';
    ELSE
        RAISE NOTICE '- Columna calorias ya existe';
    END IF;

    -- es_vegetariano
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'productos_modificadores' 
        AND column_name = 'es_vegetariano'
    ) THEN
        ALTER TABLE productos_modificadores 
            ADD COLUMN es_vegetariano BOOLEAN DEFAULT false;
        RAISE NOTICE '✓ Columna es_vegetariano agregada';
    ELSE
        RAISE NOTICE '- Columna es_vegetariano ya existe';
    END IF;

    -- es_vegano
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'productos_modificadores' 
        AND column_name = 'es_vegano'
    ) THEN
        ALTER TABLE productos_modificadores 
            ADD COLUMN es_vegano BOOLEAN DEFAULT false;
        RAISE NOTICE '✓ Columna es_vegano agregada';
    ELSE
        RAISE NOTICE '- Columna es_vegano ya existe';
    END IF;

    -- contiene_gluten
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'productos_modificadores' 
        AND column_name = 'contiene_gluten'
    ) THEN
        ALTER TABLE productos_modificadores 
            ADD COLUMN contiene_gluten BOOLEAN DEFAULT false;
        RAISE NOTICE '✓ Columna contiene_gluten agregada';
    ELSE
        RAISE NOTICE '- Columna contiene_gluten ya existe';
    END IF;

    -- alergenos
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'productos_modificadores' 
        AND column_name = 'alergenos'
    ) THEN
        ALTER TABLE productos_modificadores 
            ADD COLUMN alergenos TEXT[];
        RAISE NOTICE '✓ Columna alergenos agregada';
    ELSE
        RAISE NOTICE '- Columna alergenos ya existe';
    END IF;

    -- precio_base
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'productos_modificadores' 
        AND column_name = 'precio_base'
    ) THEN
        ALTER TABLE productos_modificadores 
            ADD COLUMN precio_base NUMERIC(10,2);
        RAISE NOTICE '✓ Columna precio_base agregada';
    ELSE
        RAISE NOTICE '- Columna precio_base ya existe';
    END IF;

    -- descuento_porcentaje
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'productos_modificadores' 
        AND column_name = 'descuento_porcentaje'
    ) THEN
        ALTER TABLE productos_modificadores 
            ADD COLUMN descuento_porcentaje NUMERIC(5,2);
        RAISE NOTICE '✓ Columna descuento_porcentaje agregada';
    ELSE
        RAISE NOTICE '- Columna descuento_porcentaje ya existe';
    END IF;

    -- orden_display
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'productos_modificadores' 
        AND column_name = 'orden_display'
    ) THEN
        ALTER TABLE productos_modificadores 
            ADD COLUMN orden_display INTEGER DEFAULT 0;
        RAISE NOTICE '✓ Columna orden_display agregada';
    ELSE
        RAISE NOTICE '- Columna orden_display ya existe';
    END IF;

    -- id_restaurante
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'productos_modificadores' 
        AND column_name = 'id_restaurante'
    ) THEN
        -- Agregar columna temporalmente permitiendo NULL
        ALTER TABLE productos_modificadores 
            ADD COLUMN id_restaurante INTEGER;
        
        -- Actualizar con el id_restaurante del producto asociado
        UPDATE productos_modificadores pm
        SET id_restaurante = p.id_restaurante
        FROM productos p
        WHERE pm.id_producto = p.id_producto;
        
        -- Ahora hacerla NOT NULL
        ALTER TABLE productos_modificadores 
            ALTER COLUMN id_restaurante SET NOT NULL;
            
        RAISE NOTICE '✓ Columna id_restaurante agregada y populada';
    ELSE
        RAISE NOTICE '- Columna id_restaurante ya existe';
    END IF;

END $$;

-- =====================================================
-- AGREGAR FOREIGN KEYS (Solo si no existen)
-- =====================================================

DO $$
BEGIN
    -- Foreign key a grupos_modificadores
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_productos_modificadores_grupo'
    ) THEN
        ALTER TABLE productos_modificadores
            ADD CONSTRAINT fk_productos_modificadores_grupo 
            FOREIGN KEY (id_grupo_modificador) 
            REFERENCES grupos_modificadores(id_grupo_modificador) 
            ON DELETE SET NULL;
        RAISE NOTICE '✓ Foreign key a grupos_modificadores agregada';
    ELSE
        RAISE NOTICE '- Foreign key a grupos_modificadores ya existe';
    END IF;

    -- Foreign key a restaurantes
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_productos_modificadores_restaurante'
    ) THEN
        ALTER TABLE productos_modificadores
            ADD CONSTRAINT fk_productos_modificadores_restaurante 
            FOREIGN KEY (id_restaurante) 
            REFERENCES restaurantes(id_restaurante) 
            ON DELETE CASCADE;
        RAISE NOTICE '✓ Foreign key a restaurantes agregada';
    ELSE
        RAISE NOTICE '- Foreign key a restaurantes ya existe';
    END IF;
END $$;

-- =====================================================
-- CREAR ÍNDICES (Solo si no existen)
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_modificadores_grupo 
    ON productos_modificadores(id_grupo_modificador);
    
CREATE INDEX IF NOT EXISTS idx_modificadores_producto 
    ON productos_modificadores(id_producto);
    
CREATE INDEX IF NOT EXISTS idx_modificadores_restaurante 
    ON productos_modificadores(id_restaurante);
    
CREATE INDEX IF NOT EXISTS idx_modificadores_activo 
    ON productos_modificadores(activo);

-- =====================================================
-- COMENTARIOS
-- =====================================================

COMMENT ON COLUMN productos_modificadores.stock_disponible IS 
    'Stock actual si se controla inventario';
    
COMMENT ON COLUMN productos_modificadores.precio_base IS 
    'Precio original antes de descuentos';
    
COMMENT ON COLUMN productos_modificadores.alergenos IS 
    'Array de alérgenos: {nueces, lacteos, mariscos, etc}';
    
COMMENT ON COLUMN productos_modificadores.id_restaurante IS 
    'ID del restaurante al que pertenece (multitenancy)';

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

DO $$
DECLARE
    count_columnas INTEGER;
BEGIN
    SELECT COUNT(*) INTO count_columnas
    FROM information_schema.columns
    WHERE table_name = 'productos_modificadores';
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'MIGRACIÓN 002 COMPLETADA';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✓ Total de columnas en productos_modificadores: %', count_columnas;
    RAISE NOTICE '✓ Índices creados: 4';
    RAISE NOTICE '✓ Foreign keys configuradas: 2';
    RAISE NOTICE '========================================';
END $$;

-- =====================================================
-- FIN DE MIGRACIÓN 002
-- =====================================================

