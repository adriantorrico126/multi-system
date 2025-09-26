-- =====================================================
-- TABLAS PARA SISTEMA DE PLANES Y SUSCRIPCIONES
-- =====================================================

-- Tabla de Planes
CREATE TABLE IF NOT EXISTS planes (
    id_plan SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    precio_mensual NUMERIC(10,2) NOT NULL,
    precio_anual NUMERIC(10,2),
    max_sucursales INTEGER DEFAULT 1,
    max_usuarios INTEGER DEFAULT 5,
    max_productos INTEGER DEFAULT 100,
    max_transacciones_mes INTEGER DEFAULT 500,
    funcionalidades JSONB NOT NULL DEFAULT '{}'::jsonb,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de Suscripciones
CREATE TABLE IF NOT EXISTS suscripciones (
    id_suscripcion SERIAL PRIMARY KEY,
    id_restaurante INTEGER NOT NULL REFERENCES restaurantes(id_restaurante) ON DELETE CASCADE,
    id_plan INTEGER NOT NULL REFERENCES planes(id_plan),
    fecha_inicio TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fecha_fin TIMESTAMP WITH TIME ZONE,
    estado VARCHAR(50) NOT NULL DEFAULT 'activa', -- activa, cancelada, suspendida, vencida
    motivo_cancelacion TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_suscripciones_restaurante ON suscripciones(id_restaurante);
CREATE INDEX IF NOT EXISTS idx_suscripciones_plan ON suscripciones(id_plan);
CREATE INDEX IF NOT EXISTS idx_suscripciones_estado ON suscripciones(estado);
CREATE INDEX IF NOT EXISTS idx_planes_activo ON planes(activo);

-- =====================================================
-- DATOS INICIALES DE PLANES
-- =====================================================

-- Insertar planes según tu estrategia de precios USD
INSERT INTO planes (nombre, descripcion, precio_mensual, precio_anual, max_sucursales, max_usuarios, max_productos, max_transacciones_mes, funcionalidades) VALUES
('Starter', 'Perfecto para micro-empresas y restaurantes familiares', 19.00, 190.00, 1, 3, 100, 500, '{
    "pos_basico": true,
    "inventario_simple": true,
    "reportes_basicos": true,
    "soporte_email": true,
    "backup_diario": true,
    "app_movil": false
}'),
('Professional', 'Ideal para restaurantes medianos y pequeñas cadenas', 49.00, 490.00, 3, 10, 500, 2000, '{
    "pos_avanzado": true,
    "inventario_completo": true,
    "analytics_avanzados": true,
    "sistema_reservas": true,
    "delivery_integrado": true,
    "soporte_telefonico": true,
    "app_movil": true
}'),
('Business', 'Para cadenas de restaurantes y franquicias', 99.00, 990.00, 999999, 999999, 2000, 10000, '{
    "multi_sucursal": true,
    "analytics_ia": true,
    "api_completa": true,
    "white_label": true,
    "soporte_prioritario": true,
    "capacitacion_incluida": true,
    "gerente_cuenta": true
}'),
('Enterprise', 'Para grandes corporaciones y grupos empresariales', 199.00, 1990.00, 999999, 999999, 999999, 999999, '{
    "transacciones_ilimitadas": true,
    "productos_ilimitados": true,
    "integraciones_ilimitadas": true,
    "soporte_24_7": true,
    "implementacion_personalizada": true,
    "sla_garantizado": true,
    "auditoria_completa": true,
    "multi_idioma": true,
    "consultoria_incluida": true
}')
ON CONFLICT DO NOTHING;

-- =====================================================
-- FUNCIONES AUXILIARES
-- =====================================================

-- Función para verificar límites de plan
CREATE OR REPLACE FUNCTION verificar_limites_plan(
    p_id_restaurante INTEGER,
    p_tipo_limite VARCHAR(50)
) RETURNS BOOLEAN AS $$
DECLARE
    v_plan RECORD;
    v_uso INTEGER;
BEGIN
    -- Obtener plan actual del restaurante
    SELECT p.* INTO v_plan
    FROM suscripciones s
    JOIN planes p ON s.id_plan = p.id_plan
    WHERE s.id_restaurante = p_id_restaurante 
    AND s.estado = 'activa'
    ORDER BY s.created_at DESC
    LIMIT 1;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Verificar límite según tipo
    CASE p_tipo_limite
        WHEN 'sucursales' THEN
            SELECT COUNT(*) INTO v_uso FROM sucursales WHERE id_restaurante = p_id_restaurante AND activo = true;
            RETURN v_plan.max_sucursales = 0 OR v_uso < v_plan.max_sucursales;
        WHEN 'usuarios' THEN
            SELECT COUNT(*) INTO v_uso FROM vendedores WHERE id_restaurante = p_id_restaurante AND activo = true;
            RETURN v_plan.max_usuarios = 0 OR v_uso < v_plan.max_usuarios;
        WHEN 'productos' THEN
            SELECT COUNT(*) INTO v_uso FROM productos WHERE id_restaurante = p_id_restaurante AND activo = true;
            RETURN v_plan.max_productos = 0 OR v_uso < v_plan.max_productos;
        WHEN 'transacciones' THEN
            SELECT COUNT(*) INTO v_uso FROM ventas WHERE id_restaurante = p_id_restaurante 
            AND created_at >= DATE_TRUNC('month', CURRENT_DATE);
            RETURN v_plan.max_transacciones_mes = 0 OR v_uso < v_plan.max_transacciones_mes;
        ELSE
            RETURN FALSE;
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VISTAS ÚTILES
-- =====================================================

-- Vista de restaurantes con sus planes y uso
CREATE OR REPLACE VIEW v_restaurantes_planes_uso AS
SELECT 
    r.id_restaurante,
    r.nombre,
    r.activo,
    p.nombre as plan_nombre,
    p.precio_mensual,
    s.estado as suscripcion_estado,
    s.fecha_inicio,
    s.fecha_fin,
    COUNT(DISTINCT suc.id_sucursal) as sucursales_actuales,
    COUNT(DISTINCT v.id_vendedor) as usuarios_actuales,
    COUNT(DISTINCT pr.id_producto) as productos_actuales,
    COUNT(DISTINCT ve.id_venta) as transacciones_mes_actual,
    CASE 
        WHEN p.max_sucursales = 0 THEN 'ilimitado'
        WHEN COUNT(DISTINCT suc.id_sucursal) >= p.max_sucursales THEN 'excedido'
        WHEN COUNT(DISTINCT suc.id_sucursal) >= p.max_sucursales * 0.8 THEN 'warning'
        ELSE 'ok'
    END as estado_sucursales,
    CASE 
        WHEN p.max_usuarios = 0 THEN 'ilimitado'
        WHEN COUNT(DISTINCT v.id_vendedor) >= p.max_usuarios THEN 'excedido'
        WHEN COUNT(DISTINCT v.id_vendedor) >= p.max_usuarios * 0.8 THEN 'warning'
        ELSE 'ok'
    END as estado_usuarios
FROM restaurantes r
LEFT JOIN suscripciones s ON r.id_restaurante = s.id_restaurante AND s.estado = 'activa'
LEFT JOIN planes p ON s.id_plan = p.id_plan
LEFT JOIN sucursales suc ON r.id_restaurante = suc.id_restaurante AND suc.activo = true
LEFT JOIN vendedores v ON r.id_restaurante = v.id_restaurante AND v.activo = true
LEFT JOIN productos pr ON r.id_restaurante = pr.id_restaurante AND pr.activo = true
LEFT JOIN ventas ve ON r.id_restaurante = ve.id_restaurante 
    AND ve.created_at >= DATE_TRUNC('month', CURRENT_DATE)
GROUP BY r.id_restaurante, r.nombre, r.activo, p.nombre, p.precio_mensual, s.estado, s.fecha_inicio, s.fecha_fin, p.max_sucursales, p.max_usuarios;
