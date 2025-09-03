-- =====================================================
-- ESTRUCTURA DE BASE DE DATOS PARA PLATAFORMA WEB
-- SISTEMA POS - MARKETING Y VENTAS
-- =====================================================

-- Tabla de Planes y Suscripciones
CREATE TABLE planes_pos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    precio_mensual DECIMAL(10,2),
    precio_anual DECIMAL(10,2),
    caracteristicas JSONB, -- Array de características del plan
    max_sucursales INTEGER DEFAULT 1,
    max_usuarios INTEGER DEFAULT 5,
    incluye_impresion BOOLEAN DEFAULT false,
    incluye_delivery BOOLEAN DEFAULT false,
    incluye_reservas BOOLEAN DEFAULT false,
    incluye_analytics BOOLEAN DEFAULT false,
    incluye_soporte_24h BOOLEAN DEFAULT false,
    activo BOOLEAN DEFAULT true,
    orden_display INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Leads y Prospectos
CREATE TABLE leads_prospectos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    telefono VARCHAR(20),
    nombre_restaurante VARCHAR(100),
    tipo_restaurante VARCHAR(50), -- comida rápida, restaurante, bar, etc.
    num_sucursales INTEGER DEFAULT 1,
    num_empleados INTEGER,
    ciudad VARCHAR(50),
    pais VARCHAR(50) DEFAULT 'Bolivia',
    fuente_lead VARCHAR(50), -- web, redes sociales, recomendación, etc.
    estado VARCHAR(30) DEFAULT 'nuevo', -- nuevo, contactado, calificado, demo_agendada, vendido, perdido
    interes_plan_id INTEGER REFERENCES planes_pos(id),
    notas TEXT,
    fecha_contacto TIMESTAMP,
    fecha_demo TIMESTAMP,
    vendedor_asignado VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Demos y Reuniones
CREATE TABLE demos_reuniones (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER REFERENCES leads_prospectos(id),
    tipo_reunion VARCHAR(30), -- demo_online, demo_presencial, consulta, seguimiento
    fecha_programada TIMESTAMP NOT NULL,
    duracion_minutos INTEGER DEFAULT 60,
    plataforma VARCHAR(50), -- zoom, teams, presencial, etc.
    link_reunion VARCHAR(255),
    estado VARCHAR(30) DEFAULT 'programada', -- programada, confirmada, completada, cancelada
    notas_pre_reunion TEXT,
    notas_post_reunion TEXT,
    resultado VARCHAR(30), -- interesado, no_interesado, reprogramar, vendido
    proximo_seguimiento TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Casos de Éxito (Restaurantes Usando el Sistema)
CREATE TABLE casos_exito (
    id SERIAL PRIMARY KEY,
    nombre_restaurante VARCHAR(100) NOT NULL,
    logo_url VARCHAR(255),
    tipo_restaurante VARCHAR(50),
    ciudad VARCHAR(50),
    sucursales INTEGER DEFAULT 1,
    tiempo_uso_meses INTEGER,
    testimonio TEXT,
    nombre_contacto VARCHAR(100),
    cargo_contacto VARCHAR(50),
    foto_contacto VARCHAR(255),
    video_testimonio VARCHAR(255),
    metricas_antes JSONB, -- Ventas antes del sistema
    metricas_despues JSONB, -- Ventas después del sistema
    mejoras_especificas TEXT[], -- Array de mejoras específicas
    plan_contratado VARCHAR(50),
    fecha_implementacion DATE,
    activo BOOLEAN DEFAULT true,
    destacado BOOLEAN DEFAULT false,
    orden_display INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Testimonios Web
CREATE TABLE testimonios_web (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    cargo VARCHAR(50),
    empresa VARCHAR(100),
    foto_url VARCHAR(255),
    testimonio TEXT NOT NULL,
    calificacion INTEGER CHECK (calificacion >= 1 AND calificacion <= 5),
    ciudad VARCHAR(50),
    fecha_experiencia DATE,
    plan_contratado VARCHAR(50),
    tiempo_uso_meses INTEGER,
    activo BOOLEAN DEFAULT true,
    destacado BOOLEAN DEFAULT false,
    orden_display INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Newsletter y Marketing
CREATE TABLE newsletter_suscriptores (
    id SERIAL PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    nombre VARCHAR(100),
    tipo_suscripcion VARCHAR(30) DEFAULT 'general', -- general, restaurantes, actualizaciones
    origen VARCHAR(50), -- web, landing, demo, etc.
    activo BOOLEAN DEFAULT true,
    fecha_suscripcion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_ultimo_email TIMESTAMP,
    tags TEXT[] -- Array de tags para segmentación
);

-- Tabla de Contenido Web (Blog, Recursos)
CREATE TABLE contenido_web (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    slug VARCHAR(200) UNIQUE NOT NULL,
    contenido TEXT,
    resumen TEXT,
    imagen_portada VARCHAR(255),
    tipo_contenido VARCHAR(30), -- blog, caso_exito, tutorial, noticia
    autor VARCHAR(100),
    tags TEXT[],
    estado VARCHAR(20) DEFAULT 'borrador', -- borrador, publicado, archivado
    fecha_publicacion TIMESTAMP,
    fecha_modificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    meta_title VARCHAR(200),
    meta_description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Métricas y Analytics Web
CREATE TABLE metricas_web (
    id SERIAL PRIMARY KEY,
    fecha DATE NOT NULL,
    tipo_metrica VARCHAR(50), -- visitas, leads, demos, conversiones
    valor INTEGER DEFAULT 0,
    fuente VARCHAR(50), -- google, facebook, directo, etc.
    pagina VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Configuración Web
CREATE TABLE configuracion_web (
    id SERIAL PRIMARY KEY,
    clave VARCHAR(100) UNIQUE NOT NULL,
    valor TEXT,
    descripcion TEXT,
    tipo VARCHAR(30), -- texto, numero, booleano, json
    seccion VARCHAR(50), -- general, contacto, redes_sociales, etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- DATOS INICIALES
-- =====================================================

-- Insertar planes básicos
INSERT INTO planes_pos (nombre, descripcion, precio_mensual, precio_anual, caracteristicas, max_sucursales, max_usuarios, incluye_impresion, incluye_delivery, incluye_reservas, incluye_analytics, incluye_soporte_24h, orden_display) VALUES
('Básico', 'Perfecto para restaurantes pequeños y medianos', 99.00, 990.00, '["Gestión de pedidos", "Inventario básico", "Reportes simples", "Soporte por email"]', 1, 5, true, false, false, false, false, 1),
('Profesional', 'Ideal para cadenas de restaurantes', 199.00, 1990.00, '["Todo del plan Básico", "Múltiples sucursales", "Analytics avanzados", "Sistema de reservas", "Delivery integrado", "Soporte telefónico"]', 5, 20, true, true, true, true, false, 2),
('Enterprise', 'Para grandes cadenas y franquicias', 399.00, 3990.00, '["Todo del plan Profesional", "Sucursales ilimitadas", "API personalizada", "Soporte 24/7", "Implementación personalizada", "Capacitación incluida"]', 999999, 999999, true, true, true, true, true, 3);

-- Insertar configuración inicial
INSERT INTO configuracion_web (clave, valor, descripcion, tipo, seccion) VALUES
('telefono_contacto', '+591 800-RESTAU (737-828)', 'Teléfono principal de contacto', 'texto', 'contacto'),
('email_contacto', 'ventas@restaurantpos.bo', 'Email principal de contacto', 'texto', 'contacto'),
('direccion_empresa', 'Av. 16 de Julio #1234, La Paz, Bolivia', 'Dirección de la empresa', 'texto', 'contacto'),
('horario_atencion', 'Lun - Vie: 9:00 - 18:00', 'Horario de atención', 'texto', 'contacto'),
('facebook_url', 'https://facebook.com/restaurantpos', 'URL de Facebook', 'texto', 'redes_sociales'),
('instagram_url', 'https://instagram.com/restaurantpos', 'URL de Instagram', 'texto', 'redes_sociales'),
('linkedin_url', 'https://linkedin.com/company/restaurantpos', 'URL de LinkedIn', 'texto', 'redes_sociales'),
('youtube_url', 'https://youtube.com/restaurantpos', 'URL de YouTube', 'texto', 'redes_sociales'),
('meta_title_default', 'RestaurantPOS - Sistema POS para Restaurantes en Bolivia', 'Título por defecto para SEO', 'texto', 'seo'),
('meta_description_default', 'Sistema POS avanzado para restaurantes. Gestión de pedidos, inventario, múltiples sucursales y más. ¡Optimiza tu negocio hoy!', 'Descripción por defecto para SEO', 'texto', 'seo');

-- =====================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

CREATE INDEX idx_leads_prospectos_email ON leads_prospectos(email);
CREATE INDEX idx_leads_prospectos_estado ON leads_prospectos(estado);
CREATE INDEX idx_leads_prospectos_fecha_contacto ON leads_prospectos(fecha_contacto);
CREATE INDEX idx_demos_reuniones_fecha ON demos_reuniones(fecha_programada);
CREATE INDEX idx_demos_reuniones_estado ON demos_reuniones(estado);
CREATE INDEX idx_casos_exito_activo ON casos_exito(activo);
CREATE INDEX idx_casos_exito_destacado ON casos_exito(destacado);
CREATE INDEX idx_testimonios_web_activo ON testimonios_web(activo);
CREATE INDEX idx_testimonios_web_destacado ON testimonios_web(destacado);
CREATE INDEX idx_contenido_web_slug ON contenido_web(slug);
CREATE INDEX idx_contenido_web_estado ON contenido_web(estado);
CREATE INDEX idx_contenido_web_fecha_publicacion ON contenido_web(fecha_publicacion);
CREATE INDEX idx_newsletter_suscriptores_email ON newsletter_suscriptores(email);
CREATE INDEX idx_newsletter_suscriptores_activo ON newsletter_suscriptores(activo);

-- =====================================================
-- TRIGGERS PARA ACTUALIZACIÓN AUTOMÁTICA
-- =====================================================

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_planes_pos_updated_at BEFORE UPDATE ON planes_pos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_leads_prospectos_updated_at BEFORE UPDATE ON leads_prospectos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_demos_reuniones_updated_at BEFORE UPDATE ON demos_reuniones FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_casos_exito_updated_at BEFORE UPDATE ON casos_exito FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_testimonios_web_updated_at BEFORE UPDATE ON testimonios_web FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contenido_web_updated_at BEFORE UPDATE ON contenido_web FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_configuracion_web_updated_at BEFORE UPDATE ON configuracion_web FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
