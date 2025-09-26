-- =====================================================
-- SCRIPT DE POBLACIÓN DE DATOS INICIALES PARA PLANES
-- =====================================================

-- Insertar planes según la estrategia de precios USD
INSERT INTO planes (nombre, descripcion, precio_mensual, precio_anual, max_sucursales, max_usuarios, max_productos, max_transacciones_mes, funcionalidades) VALUES
('Starter', 'Perfecto para micro-empresas y restaurantes familiares', 19.00, 190.00, 1, 3, 100, 500, '{
    "pos_basico": true,
    "inventario_simple": true,
    "reportes_basicos": true,
    "soporte_email": true,
    "backup_diario": true,
    "app_movil": false,
    "modificadores": false,
    "combos": false,
    "promociones": false,
    "lotes": false,
    "caducidad": false,
    "alertas": false,
    "analytics_avanzados": false,
    "sistema_reservas": false,
    "delivery_integrado": false,
    "multi_sucursal": false,
    "analytics_ia": false,
    "api_completa": false,
    "white_label": false,
    "soporte_prioritario": false,
    "capacitacion_incluida": false,
    "gerente_cuenta": false,
    "transacciones_ilimitadas": false,
    "productos_ilimitados": false,
    "integraciones_ilimitadas": false,
    "soporte_24_7": false,
    "implementacion_personalizada": false,
    "sla_garantizado": false,
    "auditoria_completa": false,
    "multi_idioma": false,
    "consultoria_incluida": false
}'),
('Professional', 'Ideal para restaurantes medianos y pequeñas cadenas', 49.00, 490.00, 3, 10, 500, 2000, '{
    "pos_basico": true,
    "inventario_simple": true,
    "reportes_basicos": true,
    "soporte_email": true,
    "backup_diario": true,
    "app_movil": true,
    "modificadores": true,
    "combos": true,
    "promociones": true,
    "lotes": true,
    "caducidad": true,
    "alertas": true,
    "analytics_avanzados": true,
    "sistema_reservas": true,
    "delivery_integrado": true,
    "soporte_telefonico": true,
    "multi_sucursal": false,
    "analytics_ia": false,
    "api_completa": false,
    "white_label": false,
    "soporte_prioritario": false,
    "capacitacion_incluida": false,
    "gerente_cuenta": false,
    "transacciones_ilimitadas": false,
    "productos_ilimitados": false,
    "integraciones_ilimitadas": false,
    "soporte_24_7": false,
    "implementacion_personalizada": false,
    "sla_garantizado": false,
    "auditoria_completa": false,
    "multi_idioma": false,
    "consultoria_incluida": false
}'),
('Business', 'Para cadenas de restaurantes y franquicias', 99.00, 990.00, 999999, 999999, 2000, 10000, '{
    "pos_basico": true,
    "inventario_simple": true,
    "reportes_basicos": true,
    "soporte_email": true,
    "backup_diario": true,
    "app_movil": true,
    "modificadores": true,
    "combos": true,
    "promociones": true,
    "lotes": true,
    "caducidad": true,
    "alertas": true,
    "analytics_avanzados": true,
    "sistema_reservas": true,
    "delivery_integrado": true,
    "soporte_telefonico": true,
    "multi_sucursal": true,
    "analytics_ia": true,
    "api_completa": true,
    "white_label": true,
    "soporte_prioritario": true,
    "capacitacion_incluida": true,
    "gerente_cuenta": true,
    "transacciones_ilimitadas": false,
    "productos_ilimitados": false,
    "integraciones_ilimitadas": false,
    "soporte_24_7": false,
    "implementacion_personalizada": false,
    "sla_garantizado": false,
    "auditoria_completa": false,
    "multi_idioma": false,
    "consultoria_incluida": false
}'),
('Enterprise', 'Para grandes corporaciones y grupos empresariales', 199.00, 1990.00, 999999, 999999, 999999, 999999, '{
    "pos_basico": true,
    "inventario_simple": true,
    "reportes_basicos": true,
    "soporte_email": true,
    "backup_diario": true,
    "app_movil": true,
    "modificadores": true,
    "combos": true,
    "promociones": true,
    "lotes": true,
    "caducidad": true,
    "alertas": true,
    "analytics_avanzados": true,
    "sistema_reservas": true,
    "delivery_integrado": true,
    "soporte_telefonico": true,
    "multi_sucursal": true,
    "analytics_ia": true,
    "api_completa": true,
    "white_label": true,
    "soporte_prioritario": true,
    "capacitacion_incluida": true,
    "gerente_cuenta": true,
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
ON CONFLICT (nombre) DO NOTHING;

-- =====================================================
-- FUNCIÓN PARA MIGRAR DATOS EXISTENTES
-- =====================================================

-- Función para migrar restaurantes existentes al plan Starter por defecto
CREATE OR REPLACE FUNCTION migrar_restaurantes_a_planes() RETURNS INTEGER AS $$
DECLARE
    v_restaurante RECORD;
    v_plan_starter_id INTEGER;
    v_count INTEGER := 0;
BEGIN
    -- Obtener ID del plan Starter
    SELECT id_plan INTO v_plan_starter_id FROM planes WHERE nombre = 'Starter' LIMIT 1;
    
    IF v_plan_starter_id IS NULL THEN
        RAISE EXCEPTION 'Plan Starter no encontrado';
    END IF;
    
    -- Migrar restaurantes que no tienen suscripción activa
    FOR v_restaurante IN 
        SELECT r.id_restaurante 
        FROM restaurantes r
        LEFT JOIN suscripciones s ON r.id_restaurante = s.id_restaurante AND s.estado = 'activa'
        WHERE s.id_suscripcion IS NULL
    LOOP
        -- Crear suscripción para el restaurante
        INSERT INTO suscripciones (id_restaurante, id_plan, fecha_inicio, fecha_fin, estado)
        VALUES (
            v_restaurante.id_restaurante, 
            v_plan_starter_id, 
            NOW(), 
            NOW() + INTERVAL '1 month', 
            'activa'
        );
        
        v_count := v_count + 1;
    END LOOP;
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Ejecutar migración
SELECT migrar_restaurantes_a_planes() as restaurantes_migrados;

-- =====================================================
-- VISTA PARA MONITOREO DE PLANES
-- =====================================================

CREATE OR REPLACE VIEW v_planes_resumen AS
SELECT 
    p.nombre as plan_nombre,
    p.precio_mensual,
    COUNT(s.id_suscripcion) as total_suscripciones,
    COUNT(CASE WHEN s.estado = 'activa' THEN 1 END) as suscripciones_activas,
    COUNT(CASE WHEN s.estado = 'cancelada' THEN 1 END) as suscripciones_canceladas,
    COUNT(CASE WHEN s.estado = 'suspendida' THEN 1 END) as suscripciones_suspendidas,
    SUM(CASE WHEN s.estado = 'activa' THEN p.precio_mensual ELSE 0 END) as ingresos_mensuales_proyectados
FROM planes p
LEFT JOIN suscripciones s ON p.id_plan = s.id_plan
GROUP BY p.id_plan, p.nombre, p.precio_mensual
ORDER BY p.precio_mensual;

-- =====================================================
-- TRIGGER PARA ACTUALIZAR TIMESTAMPS
-- =====================================================

-- Trigger para actualizar updated_at en planes
CREATE OR REPLACE FUNCTION update_planes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_planes_updated_at
    BEFORE UPDATE ON planes
    FOR EACH ROW
    EXECUTE FUNCTION update_planes_updated_at();

-- Trigger para actualizar updated_at en suscripciones
CREATE OR REPLACE FUNCTION update_suscripciones_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_suscripciones_updated_at
    BEFORE UPDATE ON suscripciones
    FOR EACH ROW
    EXECUTE FUNCTION update_suscripciones_updated_at();
