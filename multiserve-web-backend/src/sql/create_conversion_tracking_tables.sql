-- Tablas SQL para el sistema de tracking de conversiones y solicitudes de demo
-- Este archivo se puede ejecutar en la base de datos PostgreSQL

-- Tabla para solicitudes de demo
CREATE TABLE IF NOT EXISTS solicitudes_demo (
    id_solicitud SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    telefono VARCHAR(50) NOT NULL,
    restaurante VARCHAR(255) NOT NULL,
    plan_interes VARCHAR(50),
    tipo_negocio VARCHAR(100),
    mensaje TEXT,
    horario_preferido VARCHAR(50),
    estado VARCHAR(50) DEFAULT 'pendiente',
    fecha_solicitud TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_contacto TIMESTAMP,
    fecha_demo TIMESTAMP,
    fecha_conversion TIMESTAMP,
    notas TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla para eventos de conversión
CREATE TABLE IF NOT EXISTS conversion_events (
    id_evento SERIAL PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    plan_name VARCHAR(50),
    user_agent TEXT,
    referrer TEXT,
    session_id VARCHAR(100),
    ip_address INET,
    additional_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla para sesiones de usuarios
CREATE TABLE IF NOT EXISTS user_sessions (
    id_sesion SERIAL PRIMARY KEY,
    session_id VARCHAR(100) UNIQUE NOT NULL,
    first_visit TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_visit TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    page_views INTEGER DEFAULT 1,
    conversion_events INTEGER DEFAULT 0,
    ip_address INET,
    user_agent TEXT,
    referrer TEXT,
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),
    utm_term VARCHAR(100),
    utm_content VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_solicitudes_demo_email ON solicitudes_demo(email);
CREATE INDEX IF NOT EXISTS idx_solicitudes_demo_fecha ON solicitudes_demo(fecha_solicitud);
CREATE INDEX IF NOT EXISTS idx_solicitudes_demo_estado ON solicitudes_demo(estado);
CREATE INDEX IF NOT EXISTS idx_solicitudes_demo_plan ON solicitudes_demo(plan_interes);

CREATE INDEX IF NOT EXISTS idx_conversion_events_type ON conversion_events(event_type);
CREATE INDEX IF NOT EXISTS idx_conversion_events_timestamp ON conversion_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_conversion_events_session ON conversion_events(session_id);
CREATE INDEX IF NOT EXISTS idx_conversion_events_plan ON conversion_events(plan_name);

CREATE INDEX IF NOT EXISTS idx_user_sessions_session ON user_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_first_visit ON user_sessions(first_visit);

-- Triggers para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_solicitudes_demo_updated_at 
    BEFORE UPDATE ON solicitudes_demo 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_sessions_updated_at 
    BEFORE UPDATE ON user_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Vista para estadísticas de conversión
CREATE OR REPLACE VIEW conversion_stats AS
SELECT 
    DATE(fecha_solicitud) as fecha,
    COUNT(*) as total_solicitudes,
    COUNT(CASE WHEN estado = 'contactado' THEN 1 END) as contactados,
    COUNT(CASE WHEN estado = 'demo_realizada' THEN 1 END) as demos_realizadas,
    COUNT(CASE WHEN estado = 'convertido' THEN 1 END) as convertidos,
    ROUND(
        COUNT(CASE WHEN estado = 'convertido' THEN 1 END)::numeric / 
        NULLIF(COUNT(*), 0) * 100, 2
    ) as tasa_conversion
FROM solicitudes_demo
GROUP BY DATE(fecha_solicitud)
ORDER BY fecha DESC;

-- Vista para estadísticas por plan
CREATE OR REPLACE VIEW plan_conversion_stats AS
SELECT 
    plan_interes,
    COUNT(*) as total_solicitudes,
    COUNT(CASE WHEN estado = 'contactado' THEN 1 END) as contactados,
    COUNT(CASE WHEN estado = 'demo_realizada' THEN 1 END) as demos_realizadas,
    COUNT(CASE WHEN estado = 'convertido' THEN 1 END) as convertidos,
    ROUND(
        COUNT(CASE WHEN estado = 'convertido' THEN 1 END)::numeric / 
        NULLIF(COUNT(*), 0) * 100, 2
    ) as tasa_conversion
FROM solicitudes_demo
WHERE plan_interes IS NOT NULL
GROUP BY plan_interes
ORDER BY total_solicitudes DESC;

-- Vista para eventos de conversión por día
CREATE OR REPLACE VIEW daily_conversion_events AS
SELECT 
    DATE(timestamp) as fecha,
    event_type,
    COUNT(*) as count,
    COUNT(DISTINCT session_id) as unique_sessions
FROM conversion_events
GROUP BY DATE(timestamp), event_type
ORDER BY fecha DESC, count DESC;

COMMENT ON TABLE solicitudes_demo IS 'Tabla para almacenar solicitudes de demo desde la landing page';
COMMENT ON TABLE conversion_events IS 'Tabla para almacenar eventos de conversión y tracking';
COMMENT ON TABLE user_sessions IS 'Tabla para almacenar información de sesiones de usuarios';
COMMENT ON VIEW conversion_stats IS 'Vista con estadísticas de conversión por día';
COMMENT ON VIEW plan_conversion_stats IS 'Vista con estadísticas de conversión por plan';
COMMENT ON VIEW daily_conversion_events IS 'Vista con eventos de conversión por día';
