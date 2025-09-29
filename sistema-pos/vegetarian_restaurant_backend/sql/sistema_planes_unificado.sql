-- =====================================================
-- SISTEMA DE PLANES UNIFICADO Y COMPLETO
-- Fase 1: Estructura de Base de Datos
-- =====================================================

-- 1. TABLA UNIFICADA DE PLANES
-- =====================================================
CREATE TABLE IF NOT EXISTS planes_unificados (
    id_plan SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    precio_mensual DECIMAL(10,2) NOT NULL,
    precio_anual DECIMAL(10,2),
    
    -- LÍMITES CUANTITATIVOS
    max_sucursales INTEGER DEFAULT 1,
    max_usuarios INTEGER DEFAULT 5,
    max_productos INTEGER DEFAULT 100,
    max_transacciones_mes INTEGER DEFAULT 500,
    almacenamiento_gb INTEGER DEFAULT 1,
    
    -- FUNCIONALIDADES BOOLEANAS
    incluye_pos BOOLEAN DEFAULT true,
    incluye_inventario_basico BOOLEAN DEFAULT true,
    incluye_inventario_avanzado BOOLEAN DEFAULT false,
    incluye_promociones BOOLEAN DEFAULT false,
    incluye_reservas BOOLEAN DEFAULT false,
    incluye_arqueo_caja BOOLEAN DEFAULT false,
    incluye_egresos BOOLEAN DEFAULT false,
    incluye_egresos_avanzados BOOLEAN DEFAULT false,
    incluye_reportes_avanzados BOOLEAN DEFAULT false,
    incluye_analytics BOOLEAN DEFAULT false,
    incluye_delivery BOOLEAN DEFAULT false,
    incluye_impresion BOOLEAN DEFAULT true,
    incluye_soporte_24h BOOLEAN DEFAULT false,
    incluye_api BOOLEAN DEFAULT false,
    incluye_white_label BOOLEAN DEFAULT false,
    
    -- CONFIGURACIÓN
    activo BOOLEAN DEFAULT true,
    orden_display INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. TABLA DE SUSCRIPCIONES ACTIVAS
-- =====================================================
CREATE TABLE IF NOT EXISTS suscripciones_activas (
    id_suscripcion SERIAL PRIMARY KEY,
    id_restaurante INTEGER NOT NULL REFERENCES restaurantes(id_restaurante) ON DELETE CASCADE,
    id_plan INTEGER NOT NULL REFERENCES planes_unificados(id_plan),
    
    -- ESTADO DE SUSCRIPCIÓN
    estado VARCHAR(20) DEFAULT 'activa' CHECK (estado IN ('activa', 'suspendida', 'cancelada', 'expirada')),
    
    -- FECHAS
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    fecha_renovacion DATE,
    fecha_suspension TIMESTAMP,
    fecha_cancelacion TIMESTAMP,
    
    -- PAGOS
    metodo_pago VARCHAR(50),
    ultimo_pago TIMESTAMP,
    proximo_pago TIMESTAMP,
    auto_renovacion BOOLEAN DEFAULT true,
    
    -- NOTIFICACIONES
    notificaciones_email BOOLEAN DEFAULT true,
    notificaciones_sms BOOLEAN DEFAULT false,
    
    -- METADATOS
    motivo_suspension TEXT,
    motivo_cancelacion TEXT,
    datos_adicionales JSONB,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- CONSTRAINTS
    CONSTRAINT chk_fechas_suscripcion CHECK (fecha_fin >= fecha_inicio),
    CONSTRAINT chk_una_suscripcion_activa UNIQUE (id_restaurante, estado) DEFERRABLE INITIALLY DEFERRED
);

-- 3. TABLA DE CONTADORES DE USO
-- =====================================================
CREATE TABLE IF NOT EXISTS contadores_uso (
    id_contador SERIAL PRIMARY KEY,
    id_restaurante INTEGER NOT NULL REFERENCES restaurantes(id_restaurante) ON DELETE CASCADE,
    id_plan INTEGER NOT NULL REFERENCES planes_unificados(id_plan),
    
    -- CONTADORES ACTUALES
    sucursales_actuales INTEGER DEFAULT 0,
    usuarios_actuales INTEGER DEFAULT 0,
    productos_actuales INTEGER DEFAULT 0,
    transacciones_mes_actual INTEGER DEFAULT 0,
    almacenamiento_usado_mb INTEGER DEFAULT 0,
    
    -- PERÍODO DE MEDICIÓN
    mes_medicion INTEGER NOT NULL,
    año_medicion INTEGER NOT NULL,
    
    -- FECHAS DE ACTUALIZACIÓN
    ultima_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- CONSTRAINTS
    CONSTRAINT chk_mes_valido CHECK (mes_medicion >= 1 AND mes_medicion <= 12),
    CONSTRAINT chk_año_valido CHECK (año_medicion >= 2020),
    CONSTRAINT chk_contadores_no_negativos CHECK (
        sucursales_actuales >= 0 AND
        usuarios_actuales >= 0 AND
        productos_actuales >= 0 AND
        transacciones_mes_actual >= 0 AND
        almacenamiento_usado_mb >= 0
    ),
    CONSTRAINT unico_contador_restaurante_mes UNIQUE (id_restaurante, mes_medicion, año_medicion)
);

-- 4. TABLA DE ALERTAS DE LÍMITES
-- =====================================================
CREATE TABLE IF NOT EXISTS alertas_limites (
    id_alerta SERIAL PRIMARY KEY,
    id_restaurante INTEGER NOT NULL REFERENCES restaurantes(id_restaurante) ON DELETE CASCADE,
    id_plan INTEGER NOT NULL REFERENCES planes_unificados(id_plan),
    
    -- TIPO DE ALERTA
    tipo_alerta VARCHAR(50) NOT NULL CHECK (tipo_alerta IN (
        'limite_sucursales', 'limite_usuarios', 'limite_productos', 
        'limite_transacciones', 'limite_almacenamiento', 'limite_funcionalidad'
    )),
    
    -- RECURSO AFECTADO
    recurso VARCHAR(50) NOT NULL,
    valor_actual INTEGER NOT NULL,
    valor_limite INTEGER NOT NULL,
    porcentaje_uso DECIMAL(5,2) NOT NULL,
    
    -- ESTADO DE ALERTA
    estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'enviada', 'resuelta', 'ignorada')),
    nivel_urgencia VARCHAR(20) DEFAULT 'medio' CHECK (nivel_urgencia IN ('bajo', 'medio', 'alto', 'critico')),
    
    -- FECHAS
    fecha_alerta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_resolucion TIMESTAMP,
    
    -- MENSAJES
    mensaje TEXT NOT NULL,
    mensaje_resolucion TEXT,
    
    -- METADATOS
    datos_adicionales JSONB,
    notificaciones_enviadas INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. TABLA DE AUDITORÍA DE PLANES
-- =====================================================
CREATE TABLE IF NOT EXISTS auditoria_planes (
    id_auditoria SERIAL PRIMARY KEY,
    id_restaurante INTEGER NOT NULL REFERENCES restaurantes(id_restaurante) ON DELETE CASCADE,
    
    -- CAMBIO REALIZADO
    tipo_cambio VARCHAR(50) NOT NULL CHECK (tipo_cambio IN (
        'cambio_plan', 'suspension', 'reactivacion', 'cancelacion', 
        'renovacion', 'upgrade', 'downgrade'
    )),
    
    -- PLANES
    id_plan_anterior INTEGER REFERENCES planes_unificados(id_plan),
    id_plan_nuevo INTEGER REFERENCES planes_unificados(id_plan),
    
    -- USUARIO QUE REALIZÓ EL CAMBIO
    id_usuario_cambio INTEGER,
    nombre_usuario VARCHAR(100),
    rol_usuario VARCHAR(50),
    
    -- FECHAS
    fecha_cambio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_efectiva DATE,
    
    -- DETALLES
    motivo TEXT,
    observaciones TEXT,
    datos_anteriores JSONB,
    datos_nuevos JSONB,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. TABLA DE HISTORIAL DE USO
-- =====================================================
CREATE TABLE IF NOT EXISTS historial_uso (
    id_historial SERIAL PRIMARY KEY,
    id_restaurante INTEGER NOT NULL REFERENCES restaurantes(id_restaurante) ON DELETE CASCADE,
    id_plan INTEGER NOT NULL REFERENCES planes_unificados(id_plan),
    
    -- PERÍODO
    mes INTEGER NOT NULL,
    año INTEGER NOT NULL,
    
    -- MÉTRICAS DE USO
    sucursales_utilizadas INTEGER DEFAULT 0,
    usuarios_activos INTEGER DEFAULT 0,
    productos_activos INTEGER DEFAULT 0,
    transacciones_realizadas INTEGER DEFAULT 0,
    almacenamiento_utilizado_mb INTEGER DEFAULT 0,
    
    -- MÉTRICAS DE RENDIMIENTO
    tiempo_respuesta_promedio_ms INTEGER,
    uptime_porcentaje DECIMAL(5,2),
    errores_count INTEGER DEFAULT 0,
    
    -- FECHAS
    fecha_generacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- CONSTRAINTS
    CONSTRAINT chk_historial_mes_valido CHECK (mes >= 1 AND mes <= 12),
    CONSTRAINT chk_historial_año_valido CHECK (año >= 2020),
    CONSTRAINT unico_historial_restaurante_mes UNIQUE (id_restaurante, mes, año)
);

-- =====================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

-- Índices para planes_unificados
CREATE INDEX IF NOT EXISTS idx_planes_unificados_activo ON planes_unificados(activo);
CREATE INDEX IF NOT EXISTS idx_planes_unificados_orden ON planes_unificados(orden_display);

-- Índices para suscripciones_activas
CREATE INDEX IF NOT EXISTS idx_suscripciones_restaurante ON suscripciones_activas(id_restaurante);
CREATE INDEX IF NOT EXISTS idx_suscripciones_plan ON suscripciones_activas(id_plan);
CREATE INDEX IF NOT EXISTS idx_suscripciones_estado ON suscripciones_activas(estado);
CREATE INDEX IF NOT EXISTS idx_suscripciones_fecha_fin ON suscripciones_activas(fecha_fin);
CREATE INDEX IF NOT EXISTS idx_suscripciones_proximo_pago ON suscripciones_activas(proximo_pago);

-- Índices para contadores_uso
CREATE INDEX IF NOT EXISTS idx_contadores_restaurante ON contadores_uso(id_restaurante);
CREATE INDEX IF NOT EXISTS idx_contadores_plan ON contadores_uso(id_plan);
CREATE INDEX IF NOT EXISTS idx_contadores_periodo ON contadores_uso(mes_medicion, año_medicion);

-- Índices para alertas_limites
CREATE INDEX IF NOT EXISTS idx_alertas_restaurante ON alertas_limites(id_restaurante);
CREATE INDEX IF NOT EXISTS idx_alertas_plan ON alertas_limites(id_plan);
CREATE INDEX IF NOT EXISTS idx_alertas_estado ON alertas_limites(estado);
CREATE INDEX IF NOT EXISTS idx_alertas_tipo ON alertas_limites(tipo_alerta);
CREATE INDEX IF NOT EXISTS idx_alertas_fecha ON alertas_limites(fecha_alerta);

-- Índices para auditoria_planes
CREATE INDEX IF NOT EXISTS idx_auditoria_restaurante ON auditoria_planes(id_restaurante);
CREATE INDEX IF NOT EXISTS idx_auditoria_fecha ON auditoria_planes(fecha_cambio);
CREATE INDEX IF NOT EXISTS idx_auditoria_tipo ON auditoria_planes(tipo_cambio);

-- Índices para historial_uso
CREATE INDEX IF NOT EXISTS idx_historial_restaurante ON historial_uso(id_restaurante);
CREATE INDEX IF NOT EXISTS idx_historial_plan ON historial_uso(id_plan);
CREATE INDEX IF NOT EXISTS idx_historial_periodo ON historial_uso(mes, año);

-- =====================================================
-- TRIGGERS PARA ACTUALIZACIÓN AUTOMÁTICA
-- =====================================================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_planes_unificados_updated_at 
    BEFORE UPDATE ON planes_unificados 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_suscripciones_activas_updated_at 
    BEFORE UPDATE ON suscripciones_activas 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contadores_uso_updated_at 
    BEFORE UPDATE ON contadores_uso 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alertas_limites_updated_at 
    BEFORE UPDATE ON alertas_limites 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCIONES DE VALIDACIÓN
-- =====================================================

-- Función para validar límites de plan
CREATE OR REPLACE FUNCTION validar_limite_plan(
    p_id_restaurante INTEGER,
    p_tipo_recurso VARCHAR(50),
    p_valor_solicitado INTEGER DEFAULT 1
) RETURNS BOOLEAN AS $$
DECLARE
    v_plan_actual RECORD;
    v_contador_actual RECORD;
    v_limite_actual INTEGER;
    v_uso_actual INTEGER;
BEGIN
    -- Obtener plan actual del restaurante
    SELECT p.*, s.estado
    INTO v_plan_actual
    FROM planes_unificados p
    JOIN suscripciones_activas s ON p.id_plan = s.id_plan
    WHERE s.id_restaurante = p_id_restaurante 
    AND s.estado = 'activa'
    AND s.fecha_fin >= CURRENT_DATE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'No se encontró una suscripción activa para el restaurante %', p_id_restaurante;
    END IF;
    
    -- Obtener contador actual
    SELECT *
    INTO v_contador_actual
    FROM contadores_uso
    WHERE id_restaurante = p_id_restaurante
    AND mes_medicion = EXTRACT(MONTH FROM CURRENT_DATE)
    AND año_medicion = EXTRACT(YEAR FROM CURRENT_DATE);
    
    -- Determinar límite y uso actual según el tipo de recurso
    CASE p_tipo_recurso
        WHEN 'sucursales' THEN
            v_limite_actual := v_plan_actual.max_sucursales;
            v_uso_actual := COALESCE(v_contador_actual.sucursales_actuales, 0);
        WHEN 'usuarios' THEN
            v_limite_actual := v_plan_actual.max_usuarios;
            v_uso_actual := COALESCE(v_contador_actual.usuarios_actuales, 0);
        WHEN 'productos' THEN
            v_limite_actual := v_plan_actual.max_productos;
            v_uso_actual := COALESCE(v_contador_actual.productos_actuales, 0);
        WHEN 'transacciones' THEN
            v_limite_actual := v_plan_actual.max_transacciones_mes;
            v_uso_actual := COALESCE(v_contador_actual.transacciones_mes_actual, 0);
        WHEN 'almacenamiento' THEN
            v_limite_actual := v_plan_actual.almacenamiento_gb * 1024; -- Convertir GB a MB
            v_uso_actual := COALESCE(v_contador_actual.almacenamiento_usado_mb, 0);
        ELSE
            RAISE EXCEPTION 'Tipo de recurso no válido: %', p_tipo_recurso;
    END CASE;
    
    -- Verificar si el límite permite la operación
    RETURN (v_uso_actual + p_valor_solicitado) <= v_limite_actual;
END;
$$ LANGUAGE plpgsql;

-- Función para verificar funcionalidad disponible
CREATE OR REPLACE FUNCTION verificar_funcionalidad_plan(
    p_id_restaurante INTEGER,
    p_funcionalidad VARCHAR(50)
) RETURNS BOOLEAN AS $$
DECLARE
    v_plan_actual RECORD;
BEGIN
    -- Obtener plan actual del restaurante
    SELECT p.*, s.estado
    INTO v_plan_actual
    FROM planes_unificados p
    JOIN suscripciones_activas s ON p.id_plan = s.id_plan
    WHERE s.id_restaurante = p_id_restaurante 
    AND s.estado = 'activa'
    AND s.fecha_fin >= CURRENT_DATE;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Verificar funcionalidad específica
    CASE p_funcionalidad
        WHEN 'pos' THEN RETURN v_plan_actual.incluye_pos;
        WHEN 'inventario_basico' THEN RETURN v_plan_actual.incluye_inventario_basico;
        WHEN 'inventario_avanzado' THEN RETURN v_plan_actual.incluye_inventario_avanzado;
        WHEN 'promociones' THEN RETURN v_plan_actual.incluye_promociones;
        WHEN 'reservas' THEN RETURN v_plan_actual.incluye_reservas;
        WHEN 'arqueo_caja' THEN RETURN v_plan_actual.incluye_arqueo_caja;
        WHEN 'egresos' THEN RETURN v_plan_actual.incluye_egresos;
        WHEN 'egresos_avanzados' THEN RETURN v_plan_actual.incluye_egresos_avanzados;
        WHEN 'reportes_avanzados' THEN RETURN v_plan_actual.incluye_reportes_avanzados;
        WHEN 'analytics' THEN RETURN v_plan_actual.incluye_analytics;
        WHEN 'delivery' THEN RETURN v_plan_actual.incluye_delivery;
        WHEN 'impresion' THEN RETURN v_plan_actual.incluye_impresion;
        WHEN 'soporte_24h' THEN RETURN v_plan_actual.incluye_soporte_24h;
        WHEN 'api' THEN RETURN v_plan_actual.incluye_api;
        WHEN 'white_label' THEN RETURN v_plan_actual.incluye_white_label;
        ELSE RETURN FALSE;
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- DATOS INICIALES DE PLANES
-- =====================================================

-- Insertar planes según especificación
INSERT INTO planes_unificados (
    nombre, descripcion, precio_mensual, precio_anual,
    max_sucursales, max_usuarios, max_productos, max_transacciones_mes, almacenamiento_gb,
    incluye_pos, incluye_inventario_basico, incluye_inventario_avanzado, 
    incluye_promociones, incluye_reservas, incluye_arqueo_caja, 
    incluye_egresos, incluye_egresos_avanzados, incluye_reportes_avanzados,
    incluye_analytics, incluye_delivery, incluye_impresion, incluye_soporte_24h,
    incluye_api, incluye_white_label, orden_display
) VALUES 
-- PLAN BÁSICO - $19 USD/mes
(
    'Básico', 
    'Perfecto para restaurantes pequeños y medianos',
    19.00, 190.00,
    1, 2, 100, 500, 1,
    true, true, false, false, false, false, false, false, false, false, false, true, false, false, false, 1
),
-- PLAN PROFESIONAL - $49 USD/mes  
(
    'Profesional',
    'Ideal para cadenas de restaurantes',
    49.00, 490.00,
    2, 7, 500, 2000, 5,
    true, true, true, false, true, true, true, false, false, false, false, true, false, false, false, 2
),
-- PLAN AVANZADO - $99 USD/mes
(
    'Avanzado',
    'Para restaurantes con necesidades avanzadas',
    99.00, 990.00,
    3, 999999, 2000, 10000, 20,
    true, true, true, true, true, true, true, true, true, true, false, true, false, false, false, 3
),
-- PLAN ENTERPRISE - $119 USD/mes
(
    'Enterprise',
    'Para grandes cadenas y franquicias',
    119.00, 1190.00,
    999999, 999999, 999999, 999999, 999999,
    true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, 4
);

-- =====================================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- =====================================================

COMMENT ON TABLE planes_unificados IS 'Tabla unificada de planes con todos los límites y funcionalidades';
COMMENT ON TABLE suscripciones_activas IS 'Suscripciones activas de restaurantes a planes';
COMMENT ON TABLE contadores_uso IS 'Contadores de uso actual por restaurante y período';
COMMENT ON TABLE alertas_limites IS 'Alertas cuando se exceden los límites del plan';
COMMENT ON TABLE auditoria_planes IS 'Auditoría de cambios en planes y suscripciones';
COMMENT ON TABLE historial_uso IS 'Historial mensual de uso de recursos';

COMMENT ON FUNCTION validar_limite_plan IS 'Valida si una operación respeta los límites del plan';
COMMENT ON FUNCTION verificar_funcionalidad_plan IS 'Verifica si una funcionalidad está disponible en el plan actual';
