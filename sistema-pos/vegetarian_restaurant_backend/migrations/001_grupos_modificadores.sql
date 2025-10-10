-- =====================================================
-- MIGRACIÓN 001: GRUPOS DE MODIFICADORES
-- Sistema: SITEMM POS - Toppings Profesional
-- Fecha: 2025-10-10
-- Descripción: Crea la tabla de grupos de modificadores
-- =====================================================

-- Verificar si ya existe la tabla
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                   WHERE table_name = 'grupos_modificadores') THEN
        RAISE NOTICE 'Creando tabla grupos_modificadores...';
    ELSE
        RAISE NOTICE 'La tabla grupos_modificadores ya existe, se omite creación';
        RETURN;
    END IF;
END $$;

-- =====================================================
-- CREAR TABLA: grupos_modificadores
-- =====================================================

CREATE TABLE IF NOT EXISTS grupos_modificadores (
    id_grupo_modificador SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    tipo VARCHAR(50) NOT NULL DEFAULT 'seleccion_multiple'
        CHECK (tipo IN ('seleccion_unica', 'seleccion_multiple', 'cantidad_variable')),
    min_selecciones INTEGER DEFAULT 0,
    max_selecciones INTEGER,
    es_obligatorio BOOLEAN DEFAULT false,
    orden_display INTEGER DEFAULT 0,
    activo BOOLEAN DEFAULT true,
    id_restaurante INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key
    CONSTRAINT fk_grupos_modificadores_restaurante 
        FOREIGN KEY (id_restaurante) 
        REFERENCES restaurantes(id_restaurante) 
        ON DELETE CASCADE,
    
    -- Constraint de validación
    CONSTRAINT check_min_max_selecciones 
        CHECK (max_selecciones IS NULL OR max_selecciones >= min_selecciones)
);

-- =====================================================
-- COMENTARIOS
-- =====================================================

COMMENT ON TABLE grupos_modificadores IS 
    'Grupos que organizan modificadores (ej: Salsas, Proteínas, Extras)';
    
COMMENT ON COLUMN grupos_modificadores.tipo IS 
    'seleccion_unica: radio buttons, seleccion_multiple: checkboxes, cantidad_variable: input numérico';
    
COMMENT ON COLUMN grupos_modificadores.min_selecciones IS 
    'Número mínimo de modificadores que deben seleccionarse (0 = opcional)';
    
COMMENT ON COLUMN grupos_modificadores.max_selecciones IS 
    'Número máximo de modificadores (NULL = sin límite)';

-- =====================================================
-- ÍNDICES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_grupos_modificadores_restaurante 
    ON grupos_modificadores(id_restaurante);
    
CREATE INDEX IF NOT EXISTS idx_grupos_modificadores_activo 
    ON grupos_modificadores(activo);
    
CREATE INDEX IF NOT EXISTS idx_grupos_modificadores_tipo 
    ON grupos_modificadores(tipo);

-- =====================================================
-- TRIGGER: Actualizar updated_at automáticamente
-- =====================================================

CREATE OR REPLACE FUNCTION update_grupos_modificadores_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_grupos_modificadores_timestamp 
    ON grupos_modificadores;
    
CREATE TRIGGER trigger_update_grupos_modificadores_timestamp
    BEFORE UPDATE ON grupos_modificadores
    FOR EACH ROW
    EXECUTE FUNCTION update_grupos_modificadores_timestamp();

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

DO $$
DECLARE
    tabla_existe BOOLEAN;
    count_columnas INTEGER;
BEGIN
    -- Verificar que la tabla existe
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'grupos_modificadores'
    ) INTO tabla_existe;
    
    IF tabla_existe THEN
        -- Contar columnas
        SELECT COUNT(*) INTO count_columnas
        FROM information_schema.columns
        WHERE table_name = 'grupos_modificadores';
        
        RAISE NOTICE '✓ Tabla grupos_modificadores creada exitosamente';
        RAISE NOTICE '✓ Columnas creadas: %', count_columnas;
        RAISE NOTICE '✓ Índices creados: 3';
        RAISE NOTICE '✓ Trigger created_at configurado';
    ELSE
        RAISE EXCEPTION '✗ Error: La tabla grupos_modificadores no fue creada';
    END IF;
END $$;

-- =====================================================
-- FIN DE MIGRACIÓN 001
-- =====================================================

