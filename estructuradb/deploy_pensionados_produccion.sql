-- =====================================================
-- DEPLOY SISTEMA DE PENSIONADOS A PRODUCCIÓN
-- =====================================================
-- Sistema: SITEMM POS
-- Fecha: 2025-10-17
-- Versión: 1.0
-- Descripción: Script completo y seguro para crear el sistema de pensionados en producción
-- =====================================================

-- NOTA IMPORTANTE: Este script es IDEMPOTENTE y puede ejecutarse múltiples veces
-- sin causar errores. Verifica la existencia de objetos antes de crearlos.

\echo '================================================='
\echo 'INICIANDO DEPLOY DEL SISTEMA DE PENSIONADOS'
\echo '================================================='
\echo ''

-- =====================================================
-- PASO 1: VERIFICACIONES PREVIAS
-- =====================================================

\echo 'Paso 1: Verificando conexión a la base de datos...'

DO $$
BEGIN
    RAISE NOTICE 'Base de datos: %', current_database();
    RAISE NOTICE 'Usuario: %', current_user;
    RAISE NOTICE 'Fecha/Hora: %', NOW();
END $$;

\echo 'Paso 1: ✓ Completado'
\echo ''

-- =====================================================
-- PASO 2: BACKUP DE DATOS EXISTENTES (SI EXISTEN)
-- =====================================================

\echo 'Paso 2: Creando backup de datos existentes (si existen)...'

-- Crear tablas de backup solo si las tablas originales existen
DO $$
BEGIN
    -- Backup de pensionados
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pensionados') THEN
        DROP TABLE IF EXISTS pensionados_backup_pre_deploy;
        CREATE TABLE pensionados_backup_pre_deploy AS SELECT * FROM pensionados;
        RAISE NOTICE 'Backup creado: pensionados_backup_pre_deploy (% registros)', (SELECT COUNT(*) FROM pensionados_backup_pre_deploy);
    ELSE
        RAISE NOTICE 'Tabla pensionados no existe, no se requiere backup';
    END IF;
    
    -- Backup de consumo_pensionados
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'consumo_pensionados') THEN
        DROP TABLE IF EXISTS consumo_pensionados_backup_pre_deploy;
        CREATE TABLE consumo_pensionados_backup_pre_deploy AS SELECT * FROM consumo_pensionados;
        RAISE NOTICE 'Backup creado: consumo_pensionados_backup_pre_deploy (% registros)', (SELECT COUNT(*) FROM consumo_pensionados_backup_pre_deploy);
    ELSE
        RAISE NOTICE 'Tabla consumo_pensionados no existe, no se requiere backup';
    END IF;
    
    -- Backup de prefacturas_pensionados
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'prefacturas_pensionados') THEN
        DROP TABLE IF EXISTS prefacturas_pensionados_backup_pre_deploy;
        CREATE TABLE prefacturas_pensionados_backup_pre_deploy AS SELECT * FROM prefacturas_pensionados;
        RAISE NOTICE 'Backup creado: prefacturas_pensionados_backup_pre_deploy (% registros)', (SELECT COUNT(*) FROM prefacturas_pensionados_backup_pre_deploy);
    ELSE
        RAISE NOTICE 'Tabla prefacturas_pensionados no existe, no se requiere backup';
    END IF;
END $$;

\echo 'Paso 2: ✓ Completado'
\echo ''

-- =====================================================
-- PASO 3: CREACIÓN DE TABLAS
-- =====================================================

\echo 'Paso 3: Creando tablas del sistema de pensionados...'

-- =====================================================
-- TABLA: pensionados
-- =====================================================
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
    created_by INTEGER
);

\echo '  ✓ Tabla pensionados creada/verificada'

-- =====================================================
-- TABLA: consumo_pensionados
-- =====================================================
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
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

\echo '  ✓ Tabla consumo_pensionados creada/verificada'

-- =====================================================
-- TABLA: prefacturas_pensionados
-- =====================================================
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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

\echo '  ✓ Tabla prefacturas_pensionados creada/verificada'

\echo 'Paso 3: ✓ Completado'
\echo ''

-- =====================================================
-- PASO 4: AGREGAR CONSTRAINTS (SI NO EXISTEN)
-- =====================================================

\echo 'Paso 4: Agregando constraints...'

-- Constraints para pensionados
DO $$
BEGIN
    -- Constraint tipo_cliente
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_tipo_cliente') THEN
        ALTER TABLE pensionados ADD CONSTRAINT chk_tipo_cliente 
            CHECK (tipo_cliente IN ('individual', 'corporativo', 'evento'));
        RAISE NOTICE '  ✓ Constraint chk_tipo_cliente agregado';
    ELSE
        RAISE NOTICE '  ✓ Constraint chk_tipo_cliente ya existe';
    END IF;
    
    -- Constraint estado_pensionado
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_estado_pensionado') THEN
        ALTER TABLE pensionados ADD CONSTRAINT chk_estado_pensionado 
            CHECK (estado IN ('activo', 'pausado', 'finalizado', 'cancelado'));
        RAISE NOTICE '  ✓ Constraint chk_estado_pensionado agregado';
    ELSE
        RAISE NOTICE '  ✓ Constraint chk_estado_pensionado ya existe';
    END IF;
    
    -- Constraint tipo_periodo
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_tipo_periodo') THEN
        ALTER TABLE pensionados ADD CONSTRAINT chk_tipo_periodo 
            CHECK (tipo_periodo IN ('semanas', 'meses', 'años'));
        RAISE NOTICE '  ✓ Constraint chk_tipo_periodo agregado';
    ELSE
        RAISE NOTICE '  ✓ Constraint chk_tipo_periodo ya existe';
    END IF;
    
    -- Constraint fechas_pensionado
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_fechas_pensionado') THEN
        ALTER TABLE pensionados ADD CONSTRAINT chk_fechas_pensionado 
            CHECK (fecha_fin > fecha_inicio);
        RAISE NOTICE '  ✓ Constraint chk_fechas_pensionado agregado';
    ELSE
        RAISE NOTICE '  ✓ Constraint chk_fechas_pensionado ya existe';
    END IF;
    
    -- Constraint cantidad_periodos
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_cantidad_periodos') THEN
        ALTER TABLE pensionados ADD CONSTRAINT chk_cantidad_periodos 
            CHECK (cantidad_periodos > 0);
        RAISE NOTICE '  ✓ Constraint chk_cantidad_periodos agregado';
    ELSE
        RAISE NOTICE '  ✓ Constraint chk_cantidad_periodos ya existe';
    END IF;
END $$;

-- Constraints para consumo_pensionados
DO $$
BEGIN
    -- Constraint tipo_comida
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_tipo_comida') THEN
        ALTER TABLE consumo_pensionados ADD CONSTRAINT chk_tipo_comida 
            CHECK (tipo_comida IN ('desayuno', 'almuerzo', 'cena'));
        RAISE NOTICE '  ✓ Constraint chk_tipo_comida agregado';
    ELSE
        RAISE NOTICE '  ✓ Constraint chk_tipo_comida ya existe';
    END IF;
    
    -- Constraint total_consumido
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_total_consumido') THEN
        ALTER TABLE consumo_pensionados ADD CONSTRAINT chk_total_consumido 
            CHECK (total_consumido >= 0);
        RAISE NOTICE '  ✓ Constraint chk_total_consumido agregado';
    ELSE
        RAISE NOTICE '  ✓ Constraint chk_total_consumido ya existe';
    END IF;
END $$;

-- Constraints para prefacturas_pensionados
DO $$
BEGIN
    -- Constraint estado_prefactura
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_estado_prefactura') THEN
        ALTER TABLE prefacturas_pensionados ADD CONSTRAINT chk_estado_prefactura 
            CHECK (estado IN ('pendiente', 'generada', 'enviada', 'pagada'));
        RAISE NOTICE '  ✓ Constraint chk_estado_prefactura agregado';
    ELSE
        RAISE NOTICE '  ✓ Constraint chk_estado_prefactura ya existe';
    END IF;
    
    -- Constraint fechas_prefactura
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_fechas_prefactura') THEN
        ALTER TABLE prefacturas_pensionados ADD CONSTRAINT chk_fechas_prefactura 
            CHECK (fecha_fin_periodo >= fecha_inicio_periodo);
        RAISE NOTICE '  ✓ Constraint chk_fechas_prefactura agregado';
    ELSE
        RAISE NOTICE '  ✓ Constraint chk_fechas_prefactura ya existe';
    END IF;
    
    -- Constraint total_dias
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_total_dias') THEN
        ALTER TABLE prefacturas_pensionados ADD CONSTRAINT chk_total_dias 
            CHECK (total_dias >= 0);
        RAISE NOTICE '  ✓ Constraint chk_total_dias agregado';
    ELSE
        RAISE NOTICE '  ✓ Constraint chk_total_dias ya existe';
    END IF;
    
    -- Constraint totales_prefactura
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_totales_prefactura') THEN
        ALTER TABLE prefacturas_pensionados ADD CONSTRAINT chk_totales_prefactura 
            CHECK (total_consumo >= 0 AND total_final >= 0);
        RAISE NOTICE '  ✓ Constraint chk_totales_prefactura agregado';
    ELSE
        RAISE NOTICE '  ✓ Constraint chk_totales_prefactura ya existe';
    END IF;
END $$;

\echo 'Paso 4: ✓ Completado'
\echo ''

-- =====================================================
-- PASO 5: CREACIÓN DE ÍNDICES
-- =====================================================

\echo 'Paso 5: Creando índices para optimización...'

-- Índices para pensionados
CREATE INDEX IF NOT EXISTS idx_pensionados_restaurante ON pensionados(id_restaurante);
CREATE INDEX IF NOT EXISTS idx_pensionados_estado ON pensionados(estado);
CREATE INDEX IF NOT EXISTS idx_pensionados_fecha_inicio ON pensionados(fecha_inicio);
CREATE INDEX IF NOT EXISTS idx_pensionados_fecha_fin ON pensionados(fecha_fin);
CREATE INDEX IF NOT EXISTS idx_pensionados_tipo_cliente ON pensionados(tipo_cliente);
CREATE INDEX IF NOT EXISTS idx_pensionados_sucursal ON pensionados(id_sucursal);
CREATE INDEX IF NOT EXISTS idx_pensionados_documento ON pensionados(documento_identidad);

\echo '  ✓ Índices de pensionados creados/verificados'

-- Índices para consumo_pensionados
CREATE INDEX IF NOT EXISTS idx_consumo_pensionado ON consumo_pensionados(id_pensionado);
CREATE INDEX IF NOT EXISTS idx_consumo_fecha ON consumo_pensionados(fecha_consumo);
CREATE INDEX IF NOT EXISTS idx_consumo_restaurante ON consumo_pensionados(id_restaurante);
CREATE INDEX IF NOT EXISTS idx_consumo_mesa ON consumo_pensionados(id_mesa);
CREATE INDEX IF NOT EXISTS idx_consumo_venta ON consumo_pensionados(id_venta);
CREATE INDEX IF NOT EXISTS idx_consumo_tipo_comida ON consumo_pensionados(tipo_comida);

\echo '  ✓ Índices de consumo_pensionados creados/verificados'

-- Índices para prefacturas_pensionados
CREATE INDEX IF NOT EXISTS idx_prefactura_pensionado ON prefacturas_pensionados(id_pensionado);
CREATE INDEX IF NOT EXISTS idx_prefactura_estado ON prefacturas_pensionados(estado);
CREATE INDEX IF NOT EXISTS idx_prefactura_fecha_inicio ON prefacturas_pensionados(fecha_inicio_periodo);
CREATE INDEX IF NOT EXISTS idx_prefactura_fecha_fin ON prefacturas_pensionados(fecha_fin_periodo);
CREATE INDEX IF NOT EXISTS idx_prefactura_restaurante ON prefacturas_pensionados(id_restaurante);

\echo '  ✓ Índices de prefacturas_pensionados creados/verificados'

\echo 'Paso 5: ✓ Completado'
\echo ''

-- =====================================================
-- PASO 6: CREACIÓN DE FUNCIONES
-- =====================================================

\echo 'Paso 6: Creando funciones del sistema...'

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_pensionados_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

\echo '  ✓ Función update_pensionados_updated_at creada/actualizada'

-- Función para calcular días de consumo
CREATE OR REPLACE FUNCTION calcular_dias_consumo(id_pensionado_param INTEGER)
RETURNS INTEGER AS $$
DECLARE
    dias_count INTEGER;
BEGIN
    SELECT COUNT(DISTINCT fecha_consumo) INTO dias_count
    FROM consumo_pensionados
    WHERE id_pensionado = id_pensionado_param;
    
    RETURN COALESCE(dias_count, 0);
END;
$$ LANGUAGE plpgsql;

\echo '  ✓ Función calcular_dias_consumo creada/actualizada'

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

\echo '  ✓ Función calcular_total_consumido creada/actualizada'

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

\echo '  ✓ Función actualizar_estadisticas_pensionado creada/actualizada'

-- Función para trigger de estadísticas
CREATE OR REPLACE FUNCTION trigger_actualizar_estadisticas_consumo()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM actualizar_estadisticas_pensionado(NEW.id_pensionado);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

\echo '  ✓ Función trigger_actualizar_estadisticas_consumo creada/actualizada'

\echo 'Paso 6: ✓ Completado'
\echo ''

-- =====================================================
-- PASO 7: CREACIÓN DE TRIGGERS
-- =====================================================

\echo 'Paso 7: Creando triggers...'

-- Eliminar triggers existentes si existen
DROP TRIGGER IF EXISTS trigger_pensionados_updated_at ON pensionados;
DROP TRIGGER IF EXISTS trigger_prefacturas_pensionados_updated_at ON prefacturas_pensionados;
DROP TRIGGER IF EXISTS trigger_consumo_estadisticas ON consumo_pensionados;

-- Trigger para updated_at en pensionados
CREATE TRIGGER trigger_pensionados_updated_at
    BEFORE UPDATE ON pensionados
    FOR EACH ROW
    EXECUTE FUNCTION update_pensionados_updated_at();

\echo '  ✓ Trigger trigger_pensionados_updated_at creado'

-- Trigger para updated_at en prefacturas_pensionados
CREATE TRIGGER trigger_prefacturas_pensionados_updated_at
    BEFORE UPDATE ON prefacturas_pensionados
    FOR EACH ROW
    EXECUTE FUNCTION update_pensionados_updated_at();

\echo '  ✓ Trigger trigger_prefacturas_pensionados_updated_at creado'

-- Trigger para actualizar estadísticas cuando se inserta consumo
CREATE TRIGGER trigger_consumo_estadisticas
    AFTER INSERT OR UPDATE ON consumo_pensionados
    FOR EACH ROW
    EXECUTE FUNCTION trigger_actualizar_estadisticas_consumo();

\echo '  ✓ Trigger trigger_consumo_estadisticas creado'

\echo 'Paso 7: ✓ Completado'
\echo ''

-- =====================================================
-- PASO 8: AGREGAR COMENTARIOS DE DOCUMENTACIÓN
-- =====================================================

\echo 'Paso 8: Agregando comentarios de documentación...'

COMMENT ON TABLE pensionados IS 'Tabla principal para gestión de pensionados del restaurante';
COMMENT ON TABLE consumo_pensionados IS 'Registro diario de consumo de pensionados';
COMMENT ON TABLE prefacturas_pensionados IS 'Prefacturas consolidadas por períodos de pensionados';

COMMENT ON COLUMN pensionados.tipo_cliente IS 'Tipo de cliente: individual, corporativo, evento';
COMMENT ON COLUMN pensionados.estado IS 'Estado del contrato: activo, pausado, finalizado, cancelado';
COMMENT ON COLUMN pensionados.descuento_aplicado IS 'Porcentaje de descuento aplicado (0-100)';
COMMENT ON COLUMN consumo_pensionados.productos_consumidos IS 'JSON con detalles de productos consumidos';
COMMENT ON COLUMN prefacturas_pensionados.productos_detallados IS 'JSON con resumen detallado de productos por período';

\echo '  ✓ Comentarios agregados'

\echo 'Paso 8: ✓ Completado'
\echo ''

-- =====================================================
-- PASO 9: VALIDACIÓN POST-DEPLOY
-- =====================================================

\echo 'Paso 9: Validando instalación...'

DO $$
DECLARE
    tabla_count INTEGER;
    indice_count INTEGER;
    funcion_count INTEGER;
    trigger_count INTEGER;
BEGIN
    -- Verificar tablas
    SELECT COUNT(*) INTO tabla_count
    FROM information_schema.tables
    WHERE table_name IN ('pensionados', 'consumo_pensionados', 'prefacturas_pensionados');
    
    IF tabla_count = 3 THEN
        RAISE NOTICE '  ✓ Todas las tablas creadas correctamente (3/3)';
    ELSE
        RAISE EXCEPTION '  ✗ ERROR: Faltan tablas. Esperado: 3, Encontrado: %', tabla_count;
    END IF;
    
    -- Verificar índices
    SELECT COUNT(*) INTO indice_count
    FROM pg_indexes
    WHERE tablename IN ('pensionados', 'consumo_pensionados', 'prefacturas_pensionados');
    
    RAISE NOTICE '  ✓ Índices creados: %', indice_count;
    
    -- Verificar funciones
    SELECT COUNT(*) INTO funcion_count
    FROM pg_proc
    WHERE proname IN (
        'update_pensionados_updated_at',
        'calcular_dias_consumo',
        'calcular_total_consumido',
        'actualizar_estadisticas_pensionado',
        'trigger_actualizar_estadisticas_consumo'
    );
    
    IF funcion_count = 5 THEN
        RAISE NOTICE '  ✓ Todas las funciones creadas correctamente (5/5)';
    ELSE
        RAISE EXCEPTION '  ✗ ERROR: Faltan funciones. Esperado: 5, Encontrado: %', funcion_count;
    END IF;
    
    -- Verificar triggers
    SELECT COUNT(*) INTO trigger_count
    FROM pg_trigger
    WHERE tgname IN (
        'trigger_pensionados_updated_at',
        'trigger_prefacturas_pensionados_updated_at',
        'trigger_consumo_estadisticas'
    );
    
    IF trigger_count = 3 THEN
        RAISE NOTICE '  ✓ Todos los triggers creados correctamente (3/3)';
    ELSE
        RAISE EXCEPTION '  ✗ ERROR: Faltan triggers. Esperado: 3, Encontrado: %', trigger_count;
    END IF;
END $$;

\echo 'Paso 9: ✓ Completado'
\echo ''

-- =====================================================
-- PASO 10: RESUMEN FINAL
-- =====================================================

\echo '================================================='
\echo 'DEPLOY COMPLETADO EXITOSAMENTE'
\echo '================================================='
\echo ''
\echo 'Resumen del deploy:'
\echo '  ✓ 3 Tablas creadas/verificadas'
\echo '  ✓ Constraints agregados'
\echo '  ✓ Índices creados para optimización'
\echo '  ✓ 5 Funciones creadas/actualizadas'
\echo '  ✓ 3 Triggers creados'
\echo '  ✓ Comentarios de documentación agregados'
\echo '  ✓ Validación completada'
\echo ''
\echo 'Sistema de pensionados listo para usar en producción.'
\echo ''
\echo 'Tablas creadas:'
\echo '  - pensionados'
\echo '  - consumo_pensionados'
\echo '  - prefacturas_pensionados'
\echo ''
\echo 'Tablas de backup (si existían datos previos):'
\echo '  - pensionados_backup_pre_deploy'
\echo '  - consumo_pensionados_backup_pre_deploy'
\echo '  - prefacturas_pensionados_backup_pre_deploy'
\echo ''
\echo 'Funciones disponibles:'
\echo '  - calcular_dias_consumo(id_pensionado)'
\echo '  - calcular_total_consumido(id_pensionado)'
\echo '  - actualizar_estadisticas_pensionado(id_pensionado)'
\echo ''
\echo '================================================='
\echo 'Para rollback en caso de problemas:'
\echo '  Ver archivo: rollback_pensionados_produccion.sql'
\echo '================================================='

