-- =====================================================
-- MIGRACIÓN: SISTEMA DE PLANES COMERCIALES FORKAST
-- =====================================================
-- Descripción: Implementa el sistema completo de planes comerciales
-- Fecha: 2024-01-XX
-- Versión: 1.0
-- 
-- IMPORTANTE: Este script debe ejecutarse en producción con cuidado
-- =====================================================

-- 1. CREAR TABLA DE PLANES
-- =====================================================
CREATE TABLE IF NOT EXISTS planes (
    id_plan SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT,
    precio_mensual DECIMAL(10,2) NOT NULL,
    precio_anual DECIMAL(10,2), -- Descuento por pago anual
    
    -- Límites del plan
    max_sucursales INTEGER NOT NULL DEFAULT 1,
    max_usuarios INTEGER NOT NULL DEFAULT 2,
    max_productos INTEGER NOT NULL DEFAULT 100,
    max_transacciones_mes INTEGER NOT NULL DEFAULT 500,
    almacenamiento_gb INTEGER NOT NULL DEFAULT 1,
    
    -- Funcionalidades habilitadas (JSON)
    funcionalidades JSONB NOT NULL DEFAULT '{}',
    
    -- Configuración del plan
    activo BOOLEAN DEFAULT true,
    orden_display INTEGER DEFAULT 0,
    
    -- Metadatos
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT check_precio_positivo CHECK (precio_mensual > 0),
    CONSTRAINT check_limites_positivos CHECK (
        max_sucursales >= 0 AND 
        max_usuarios >= 0 AND 
        max_productos >= 0 AND 
        max_transacciones_mes >= 0 AND 
        almacenamiento_gb >= 0
    )
);

-- 2. CREAR TABLA DE SUSCRIPCIONES DE USUARIOS
-- =====================================================
CREATE TABLE IF NOT EXISTS suscripciones (
    id_suscripcion SERIAL PRIMARY KEY,
    id_restaurante INTEGER NOT NULL,
    id_plan INTEGER NOT NULL,
    
    -- Estado de la suscripción
    estado VARCHAR(20) DEFAULT 'activa' CHECK (estado IN ('activa', 'suspendida', 'cancelada', 'expirada')),
    
    -- Fechas importantes
    fecha_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_fin DATE,
    fecha_renovacion DATE,
    
    -- Información de pago
    metodo_pago VARCHAR(20) DEFAULT 'mensual' CHECK (metodo_pago IN ('mensual', 'anual')),
    ultimo_pago TIMESTAMP,
    proximo_pago TIMESTAMP,
    
    -- Configuración
    auto_renovacion BOOLEAN DEFAULT true,
    notificaciones_email BOOLEAN DEFAULT true,
    
    -- Metadatos
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT fk_suscripcion_restaurante FOREIGN KEY (id_restaurante) REFERENCES restaurantes(id_restaurante) ON DELETE CASCADE,
    CONSTRAINT fk_suscripcion_plan FOREIGN KEY (id_plan) REFERENCES planes(id_plan) ON DELETE RESTRICT,
    CONSTRAINT check_fecha_fin CHECK (fecha_fin IS NULL OR fecha_fin > fecha_inicio),
    CONSTRAINT check_fecha_renovacion CHECK (fecha_renovacion IS NULL OR fecha_renovacion >= fecha_inicio)
);

-- 3. CREAR TABLA DE USO Y LÍMITES
-- =====================================================
CREATE TABLE IF NOT EXISTS uso_recursos (
    id_uso SERIAL PRIMARY KEY,
    id_restaurante INTEGER NOT NULL,
    id_plan INTEGER NOT NULL,
    
    -- Contadores de uso actual
    productos_actuales INTEGER DEFAULT 0,
    usuarios_actuales INTEGER DEFAULT 0,
    sucursales_actuales INTEGER DEFAULT 0,
    transacciones_mes_actual INTEGER DEFAULT 0,
    almacenamiento_usado_mb INTEGER DEFAULT 0,
    
    -- Período de medición
    mes_medicion INTEGER NOT NULL, -- 1-12
    año_medicion INTEGER NOT NULL,
    
    -- Metadatos
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT fk_uso_restaurante FOREIGN KEY (id_restaurante) REFERENCES restaurantes(id_restaurante) ON DELETE CASCADE,
    CONSTRAINT fk_uso_plan FOREIGN KEY (id_plan) REFERENCES planes(id_plan) ON DELETE RESTRICT,
    CONSTRAINT check_mes_valido CHECK (mes_medicion >= 1 AND mes_medicion <= 12),
    CONSTRAINT check_año_valido CHECK (año_medicion >= 2024),
    CONSTRAINT check_uso_positivo CHECK (
        productos_actuales >= 0 AND 
        usuarios_actuales >= 0 AND 
        sucursales_actuales >= 0 AND 
        transacciones_mes_actual >= 0 AND 
        almacenamiento_usado_mb >= 0
    ),
    
    -- Índice único por restaurante y período
    UNIQUE(id_restaurante, mes_medicion, año_medicion)
);

-- 4. CREAR TABLA DE AUDITORÍA DE PLANES
-- =====================================================
CREATE TABLE IF NOT EXISTS auditoria_planes (
    id_auditoria SERIAL PRIMARY KEY,
    id_restaurante INTEGER NOT NULL,
    id_plan_anterior INTEGER,
    id_plan_nuevo INTEGER NOT NULL,
    
    -- Información del cambio
    tipo_cambio VARCHAR(20) NOT NULL CHECK (tipo_cambio IN ('upgrade', 'downgrade', 'renovacion', 'cancelacion', 'suspension')),
    motivo TEXT,
    
    -- Usuario que realizó el cambio
    id_usuario_cambio INTEGER,
    nombre_usuario VARCHAR(100),
    
    -- Fechas
    fecha_cambio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_efectiva DATE DEFAULT CURRENT_DATE,
    
    -- Metadatos adicionales
    datos_adicionales JSONB DEFAULT '{}',
    
    -- Constraints
    CONSTRAINT fk_auditoria_restaurante FOREIGN KEY (id_restaurante) REFERENCES restaurantes(id_restaurante) ON DELETE CASCADE,
    CONSTRAINT fk_auditoria_plan_anterior FOREIGN KEY (id_plan_anterior) REFERENCES planes(id_plan) ON DELETE SET NULL,
    CONSTRAINT fk_auditoria_plan_nuevo FOREIGN KEY (id_plan_nuevo) REFERENCES planes(id_plan) ON DELETE RESTRICT,
    CONSTRAINT fk_auditoria_usuario FOREIGN KEY (id_usuario_cambio) REFERENCES vendedores(id_vendedor) ON DELETE SET NULL
);

-- 5. CREAR TABLA DE ALERTAS DE LÍMITES
-- =====================================================
CREATE TABLE IF NOT EXISTS alertas_limites (
    id_alerta SERIAL PRIMARY KEY,
    id_restaurante INTEGER NOT NULL,
    id_plan INTEGER NOT NULL,
    
    -- Tipo de alerta
    tipo_alerta VARCHAR(20) NOT NULL CHECK (tipo_alerta IN ('warning', 'critical', 'limit_exceeded')),
    recurso VARCHAR(30) NOT NULL CHECK (recurso IN ('productos', 'usuarios', 'sucursales', 'transacciones', 'almacenamiento')),
    
    -- Valores de la alerta
    valor_actual INTEGER NOT NULL,
    valor_limite INTEGER NOT NULL,
    porcentaje_uso DECIMAL(5,2) NOT NULL,
    
    -- Estado de la alerta
    estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'enviada', 'resuelta', 'ignorada')),
    
    -- Fechas
    fecha_alerta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_resolucion TIMESTAMP,
    
    -- Metadatos
    mensaje TEXT,
    datos_adicionales JSONB DEFAULT '{}',
    
    -- Constraints
    CONSTRAINT fk_alerta_restaurante FOREIGN KEY (id_restaurante) REFERENCES restaurantes(id_restaurante) ON DELETE CASCADE,
    CONSTRAINT fk_alerta_plan FOREIGN KEY (id_plan) REFERENCES planes(id_plan) ON DELETE RESTRICT,
    CONSTRAINT check_porcentaje_valido CHECK (porcentaje_uso >= 0 AND porcentaje_uso <= 100),
    CONSTRAINT check_valores_positivos CHECK (valor_actual >= 0 AND valor_limite > 0)
);

-- 6. INSERTAR PLANES PREDEFINIDOS
-- =====================================================

-- Plan Básico - $19 USD/mes
INSERT INTO planes (nombre, descripcion, precio_mensual, precio_anual, max_sucursales, max_usuarios, max_productos, max_transacciones_mes, almacenamiento_gb, funcionalidades, orden_display) VALUES (
    'basico',
    'Plan ideal para pequeños restaurantes y food trucks',
    19.00,
    190.00, -- Descuento del 17% por pago anual
    1,
    2,
    100,
    500,
    1,
    '{
        "inventory": ["productos"],
        "dashboard": ["resumen", "productos", "categorias", "usuarios"],
        "sales": ["basico"],
        "mesas": false,
        "reservas": false,
        "delivery": false,
        "promociones": false,
        "egresos": false,
        "cocina": false,
        "arqueo": false,
        "lotes": false,
        "analytics": false,
        "api": false,
        "white_label": false
    }'::jsonb,
    1
) ON CONFLICT (nombre) DO NOTHING;

-- Plan Profesional - $49 USD/mes
INSERT INTO planes (nombre, descripcion, precio_mensual, precio_anual, max_sucursales, max_usuarios, max_productos, max_transacciones_mes, almacenamiento_gb, funcionalidades, orden_display) VALUES (
    'profesional',
    'Perfecto para restaurantes medianos y cadenas pequeñas',
    49.00,
    490.00, -- Descuento del 17% por pago anual
    2,
    7,
    500,
    2000,
    5,
    '{
        "inventory": ["productos", "lotes"],
        "dashboard": ["resumen", "productos", "categorias", "usuarios", "mesas"],
        "sales": ["basico", "pedidos"],
        "mesas": true,
        "reservas": false,
        "delivery": false,
        "promociones": false,
        "egresos": ["basico"],
        "cocina": true,
        "arqueo": true,
        "lotes": true,
        "analytics": false,
        "api": false,
        "white_label": false
    }'::jsonb,
    2
) ON CONFLICT (nombre) DO NOTHING;

-- Plan Avanzado - $99 USD/mes
INSERT INTO planes (nombre, descripcion, precio_mensual, precio_anual, max_sucursales, max_usuarios, max_productos, max_transacciones_mes, almacenamiento_gb, funcionalidades, orden_display) VALUES (
    'avanzado',
    'Ideal para restaurantes grandes y cadenas medianas',
    99.00,
    990.00, -- Descuento del 17% por pago anual
    3,
    0, -- Ilimitados
    2000,
    10000,
    20,
    '{
        "inventory": ["productos", "lotes", "completo"],
        "dashboard": ["resumen", "productos", "categorias", "usuarios", "mesas", "completo"],
        "sales": ["basico", "pedidos", "avanzado"],
        "mesas": true,
        "reservas": true,
        "delivery": true,
        "promociones": true,
        "egresos": ["basico", "avanzado"],
        "cocina": true,
        "arqueo": true,
        "lotes": true,
        "analytics": true,
        "api": false,
        "white_label": false
    }'::jsonb,
    3
) ON CONFLICT (nombre) DO NOTHING;

-- Plan Enterprise - $119 USD/mes
INSERT INTO planes (nombre, descripcion, precio_mensual, precio_anual, max_sucursales, max_usuarios, max_productos, max_transacciones_mes, almacenamiento_gb, funcionalidades, orden_display) VALUES (
    'enterprise',
    'Solución completa para grandes cadenas y franquicias',
    119.00,
    1190.00, -- Descuento del 17% por pago anual
    0, -- Ilimitadas
    0, -- Ilimitados
    0, -- Ilimitados
    0, -- Ilimitadas
    0, -- Ilimitado
    '{
        "inventory": ["productos", "lotes", "completo"],
        "dashboard": ["resumen", "productos", "categorias", "usuarios", "mesas", "completo"],
        "sales": ["basico", "pedidos", "avanzado"],
        "mesas": true,
        "reservas": true,
        "delivery": true,
        "promociones": true,
        "egresos": ["basico", "avanzado"],
        "cocina": true,
        "arqueo": true,
        "lotes": true,
        "analytics": true,
        "api": true,
        "white_label": true
    }'::jsonb,
    4
) ON CONFLICT (nombre) DO NOTHING;

-- 7. CREAR ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

-- Índices para planes
CREATE INDEX IF NOT EXISTS idx_planes_activo ON planes(activo);
CREATE INDEX IF NOT EXISTS idx_planes_orden ON planes(orden_display);

-- Índices para suscripciones
CREATE INDEX IF NOT EXISTS idx_suscripciones_restaurante ON suscripciones(id_restaurante);
CREATE INDEX IF NOT EXISTS idx_suscripciones_plan ON suscripciones(id_plan);
CREATE INDEX IF NOT EXISTS idx_suscripciones_estado ON suscripciones(estado);
CREATE INDEX IF NOT EXISTS idx_suscripciones_fecha_fin ON suscripciones(fecha_fin);

-- Índices para uso de recursos
CREATE INDEX IF NOT EXISTS idx_uso_recursos_restaurante ON uso_recursos(id_restaurante);
CREATE INDEX IF NOT EXISTS idx_uso_recursos_periodo ON uso_recursos(año_medicion, mes_medicion);

-- Índices para auditoría
CREATE INDEX IF NOT EXISTS idx_auditoria_restaurante ON auditoria_planes(id_restaurante);
CREATE INDEX IF NOT EXISTS idx_auditoria_fecha ON auditoria_planes(fecha_cambio);

-- Índices para alertas
CREATE INDEX IF NOT EXISTS idx_alertas_restaurante ON alertas_limites(id_restaurante);
CREATE INDEX IF NOT EXISTS idx_alertas_estado ON alertas_limites(estado);
CREATE INDEX IF NOT EXISTS idx_alertas_fecha ON alertas_limites(fecha_alerta);

-- 8. CREAR FUNCIONES AUXILIARES
-- =====================================================

-- Función para obtener el plan actual de un restaurante
DROP FUNCTION IF EXISTS obtener_plan_actual(INTEGER);
CREATE OR REPLACE FUNCTION obtener_plan_actual(p_id_restaurante INTEGER)
RETURNS TABLE (
    id_plan INTEGER,
    nombre VARCHAR(50),
    precio_mensual DECIMAL(10,2),
    max_sucursales INTEGER,
    max_usuarios INTEGER,
    max_productos INTEGER,
    max_transacciones_mes INTEGER,
    almacenamiento_gb INTEGER,
    funcionalidades JSONB,
    estado VARCHAR(20),
    fecha_fin DATE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id_plan,
        p.nombre,
        p.precio_mensual,
        p.max_sucursales,
        p.max_usuarios,
        p.max_productos,
        p.max_transacciones_mes,
        p.almacenamiento_gb,
        p.funcionalidades,
        s.estado,
        s.fecha_fin
    FROM planes p
    JOIN suscripciones s ON p.id_plan = s.id_plan
    WHERE s.id_restaurante = p_id_restaurante
    AND s.estado = 'activa'
    AND (s.fecha_fin IS NULL OR s.fecha_fin >= CURRENT_DATE)
    ORDER BY s.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Función para verificar límites de un restaurante
DROP FUNCTION IF EXISTS verificar_limites_plan(INTEGER);
CREATE OR REPLACE FUNCTION verificar_limites_plan(p_id_restaurante INTEGER)
RETURNS TABLE (
    recurso VARCHAR(30),
    valor_actual INTEGER,
    valor_limite INTEGER,
    porcentaje_uso DECIMAL(5,2),
    estado VARCHAR(20)
) AS $$
DECLARE
    plan_actual RECORD;
    uso_actual RECORD;
BEGIN
    -- Obtener plan actual
    SELECT * INTO plan_actual FROM obtener_plan_actual(p_id_restaurante);
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'No se encontró plan activo para el restaurante %', p_id_restaurante;
    END IF;
    
    -- Obtener uso actual
    SELECT 
        productos_actuales,
        usuarios_actuales,
        sucursales_actuales,
        transacciones_mes_actual,
        almacenamiento_usado_mb
    INTO uso_actual
    FROM uso_recursos
    WHERE id_restaurante = p_id_restaurante
    AND mes_medicion = EXTRACT(MONTH FROM CURRENT_DATE)
    AND año_medicion = EXTRACT(YEAR FROM CURRENT_DATE);
    
    -- Si no hay registro de uso, crear uno con valores 0
    IF NOT FOUND THEN
        INSERT INTO uso_recursos (id_restaurante, id_plan, mes_medicion, año_medicion)
        VALUES (p_id_restaurante, plan_actual.id_plan, EXTRACT(MONTH FROM CURRENT_DATE), EXTRACT(YEAR FROM CURRENT_DATE));
        
        SELECT 
            productos_actuales,
            usuarios_actuales,
            sucursales_actuales,
            transacciones_mes_actual,
            almacenamiento_usado_mb
        INTO uso_actual
        FROM uso_recursos
        WHERE id_restaurante = p_id_restaurante
        AND mes_medicion = EXTRACT(MONTH FROM CURRENT_DATE)
        AND año_medicion = EXTRACT(YEAR FROM CURRENT_DATE);
    END IF;
    
    -- Retornar verificación de límites
    RETURN QUERY
    SELECT 
        'productos'::VARCHAR(30),
        uso_actual.productos_actuales,
        CASE WHEN plan_actual.max_productos = 0 THEN 999999 ELSE plan_actual.max_productos END,
        CASE 
            WHEN plan_actual.max_productos = 0 THEN 0.0
            ELSE ROUND((uso_actual.productos_actuales::DECIMAL / plan_actual.max_productos) * 100, 2)
        END,
        CASE 
            WHEN plan_actual.max_productos = 0 THEN 'ilimitado'::VARCHAR(20)
            WHEN uso_actual.productos_actuales >= plan_actual.max_productos THEN 'excedido'::VARCHAR(20)
            WHEN uso_actual.productos_actuales >= (plan_actual.max_productos * 0.9) THEN 'critico'::VARCHAR(20)
            WHEN uso_actual.productos_actuales >= (plan_actual.max_productos * 0.8) THEN 'warning'::VARCHAR(20)
            ELSE 'ok'::VARCHAR(20)
        END
    
    UNION ALL
    
    SELECT 
        'usuarios'::VARCHAR(30),
        uso_actual.usuarios_actuales,
        CASE WHEN plan_actual.max_usuarios = 0 THEN 999999 ELSE plan_actual.max_usuarios END,
        CASE 
            WHEN plan_actual.max_usuarios = 0 THEN 0.0
            ELSE ROUND((uso_actual.usuarios_actuales::DECIMAL / plan_actual.max_usuarios) * 100, 2)
        END,
        CASE 
            WHEN plan_actual.max_usuarios = 0 THEN 'ilimitado'::VARCHAR(20)
            WHEN uso_actual.usuarios_actuales >= plan_actual.max_usuarios THEN 'excedido'::VARCHAR(20)
            WHEN uso_actual.usuarios_actuales >= (plan_actual.max_usuarios * 0.9) THEN 'critico'::VARCHAR(20)
            WHEN uso_actual.usuarios_actuales >= (plan_actual.max_usuarios * 0.8) THEN 'warning'::VARCHAR(20)
            ELSE 'ok'::VARCHAR(20)
        END
    
    UNION ALL
    
    SELECT 
        'sucursales'::VARCHAR(30),
        uso_actual.sucursales_actuales,
        CASE WHEN plan_actual.max_sucursales = 0 THEN 999999 ELSE plan_actual.max_sucursales END,
        CASE 
            WHEN plan_actual.max_sucursales = 0 THEN 0.0
            ELSE ROUND((uso_actual.sucursales_actuales::DECIMAL / plan_actual.max_sucursales) * 100, 2)
        END,
        CASE 
            WHEN plan_actual.max_sucursales = 0 THEN 'ilimitado'::VARCHAR(20)
            WHEN uso_actual.sucursales_actuales >= plan_actual.max_sucursales THEN 'excedido'::VARCHAR(20)
            WHEN uso_actual.sucursales_actuales >= (plan_actual.max_sucursales * 0.9) THEN 'critico'::VARCHAR(20)
            WHEN uso_actual.sucursales_actuales >= (plan_actual.max_sucursales * 0.8) THEN 'warning'::VARCHAR(20)
            ELSE 'ok'::VARCHAR(20)
        END
    
    UNION ALL
    
    SELECT 
        'transacciones'::VARCHAR(30),
        uso_actual.transacciones_mes_actual,
        CASE WHEN plan_actual.max_transacciones_mes = 0 THEN 999999 ELSE plan_actual.max_transacciones_mes END,
        CASE 
            WHEN plan_actual.max_transacciones_mes = 0 THEN 0.0
            ELSE ROUND((uso_actual.transacciones_mes_actual::DECIMAL / plan_actual.max_transacciones_mes) * 100, 2)
        END,
        CASE 
            WHEN plan_actual.max_transacciones_mes = 0 THEN 'ilimitado'::VARCHAR(20)
            WHEN uso_actual.transacciones_mes_actual >= plan_actual.max_transacciones_mes THEN 'excedido'::VARCHAR(20)
            WHEN uso_actual.transacciones_mes_actual >= (plan_actual.max_transacciones_mes * 0.9) THEN 'critico'::VARCHAR(20)
            WHEN uso_actual.transacciones_mes_actual >= (plan_actual.max_transacciones_mes * 0.8) THEN 'warning'::VARCHAR(20)
            ELSE 'ok'::VARCHAR(20)
        END;
END;
$$ LANGUAGE plpgsql;

-- 9. CREAR TRIGGERS PARA AUDITORÍA
-- =====================================================

-- Trigger para actualizar updated_at en planes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_planes_updated_at ON planes;
CREATE TRIGGER update_planes_updated_at 
    BEFORE UPDATE ON planes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_suscripciones_updated_at ON suscripciones;
CREATE TRIGGER update_suscripciones_updated_at 
    BEFORE UPDATE ON suscripciones 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_uso_recursos_updated_at ON uso_recursos;
CREATE TRIGGER update_uso_recursos_updated_at 
    BEFORE UPDATE ON uso_recursos 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 10. CREAR SUSCRIPCIÓN POR DEFECTO PARA RESTAURANTES EXISTENTES
-- =====================================================

-- Asignar plan básico a todos los restaurantes existentes que no tengan suscripción
INSERT INTO suscripciones (id_restaurante, id_plan, estado, fecha_inicio, fecha_fin, auto_renovacion)
SELECT 
    r.id_restaurante,
    p.id_plan,
    'activa',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '1 month',
    true
FROM restaurantes r
CROSS JOIN planes p
WHERE p.nombre = 'basico'
AND NOT EXISTS (
    SELECT 1 FROM suscripciones s 
    WHERE s.id_restaurante = r.id_restaurante 
    AND s.estado = 'activa'
);

-- 11. INICIALIZAR USO DE RECURSOS PARA RESTAURANTES EXISTENTES
-- =====================================================

-- Crear registros de uso inicial para todos los restaurantes
INSERT INTO uso_recursos (id_restaurante, id_plan, mes_medicion, año_medicion, productos_actuales, usuarios_actuales, sucursales_actuales)
SELECT 
    r.id_restaurante,
    s.id_plan,
    EXTRACT(MONTH FROM CURRENT_DATE),
    EXTRACT(YEAR FROM CURRENT_DATE),
    COALESCE(COUNT(DISTINCT pr.id_producto), 0),
    COALESCE(COUNT(DISTINCT v.id_vendedor), 0),
    COALESCE(COUNT(DISTINCT su.id_sucursal), 0)
FROM restaurantes r
JOIN suscripciones s ON r.id_restaurante = s.id_restaurante AND s.estado = 'activa'
LEFT JOIN productos pr ON r.id_restaurante = pr.id_restaurante
LEFT JOIN vendedores v ON r.id_restaurante = v.id_restaurante AND v.activo = true
LEFT JOIN sucursales su ON r.id_restaurante = su.id_restaurante AND su.activo = true
GROUP BY r.id_restaurante, s.id_plan
ON CONFLICT (id_restaurante, mes_medicion, año_medicion) DO NOTHING;

-- 12. COMENTARIOS FINALES
-- =====================================================

COMMENT ON TABLE planes IS 'Tabla maestra de planes comerciales disponibles';
COMMENT ON TABLE suscripciones IS 'Suscripciones activas de restaurantes a planes';
COMMENT ON TABLE uso_recursos IS 'Registro de uso de recursos por restaurante y período';
COMMENT ON TABLE auditoria_planes IS 'Auditoría de cambios de planes y suscripciones';
COMMENT ON TABLE alertas_limites IS 'Alertas generadas por límites de uso';

COMMENT ON FUNCTION obtener_plan_actual(INTEGER) IS 'Obtiene el plan activo actual de un restaurante';
COMMENT ON FUNCTION verificar_limites_plan(INTEGER) IS 'Verifica el estado de límites de uso de un restaurante';

-- =====================================================
-- FIN DE LA MIGRACIÓN
-- =====================================================
-- 
-- Para aplicar esta migración en producción:
-- 1. Hacer backup completo de la base de datos
-- 2. Ejecutar este script en un entorno de pruebas primero
-- 3. Verificar que todas las tablas se crearon correctamente
-- 4. Ejecutar en producción durante ventana de mantenimiento
-- 5. Verificar que los restaurantes existentes tienen suscripciones activas
-- 
-- =====================================================
