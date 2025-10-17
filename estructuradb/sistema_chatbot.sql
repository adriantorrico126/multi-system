-- ============================================
-- SISTEMA DE CHATBOT IA - SITEMM
-- Versión: 1.0
-- Fecha: 2025
-- ============================================

-- Tabla de conversaciones del chatbot
CREATE TABLE IF NOT EXISTS chat_conversaciones (
  id_conversacion SERIAL PRIMARY KEY,
  id_vendedor INTEGER NOT NULL,
  id_restaurante INTEGER NOT NULL,
  tipo VARCHAR(50) DEFAULT 'general' CHECK (tipo IN ('general', 'ventas', 'soporte', 'inventario', 'analytics')),
  estado VARCHAR(20) DEFAULT 'activo' CHECK (estado IN ('activo', 'cerrado', 'archivado')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de mensajes del chat
CREATE TABLE IF NOT EXISTS chat_mensajes (
  id_mensaje SERIAL PRIMARY KEY,
  id_conversacion INTEGER NOT NULL REFERENCES chat_conversaciones(id_conversacion) ON DELETE CASCADE,
  autor VARCHAR(20) NOT NULL CHECK (autor IN ('usuario', 'bot')),
  mensaje TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  tipo VARCHAR(50) DEFAULT 'texto',
  tiempo_respuesta_ms INTEGER,
  valoracion INTEGER CHECK (valoracion IS NULL OR (valoracion >= 1 AND valoracion <= 5)),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de comandos rápidos
CREATE TABLE IF NOT EXISTS chat_comandos (
  id_comando SERIAL PRIMARY KEY,
  comando VARCHAR(100) UNIQUE NOT NULL,
  descripcion TEXT,
  categoria VARCHAR(50),
  ejemplo TEXT,
  requiere_parametros BOOLEAN DEFAULT false,
  activo BOOLEAN DEFAULT true,
  veces_usado INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de contexto del chat (memoria corta)
CREATE TABLE IF NOT EXISTS chat_contexto (
  id_contexto SERIAL PRIMARY KEY,
  id_conversacion INTEGER NOT NULL REFERENCES chat_conversaciones(id_conversacion) ON DELETE CASCADE,
  clave VARCHAR(100) NOT NULL,
  valor JSONB,
  expira_en TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de feedback y entrenamiento
CREATE TABLE IF NOT EXISTS chat_entrenamiento (
  id_entrenamiento SERIAL PRIMARY KEY,
  id_mensaje INTEGER REFERENCES chat_mensajes(id_mensaje) ON DELETE CASCADE,
  pregunta TEXT,
  respuesta_bot TEXT,
  respuesta_correcta TEXT,
  fue_util BOOLEAN,
  comentario_usuario TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de analíticas del chatbot
CREATE TABLE IF NOT EXISTS chat_analytics (
  id_analytic SERIAL PRIMARY KEY,
  id_restaurante INTEGER NOT NULL,
  fecha DATE DEFAULT CURRENT_DATE,
  total_conversaciones INTEGER DEFAULT 0,
  total_mensajes INTEGER DEFAULT 0,
  tiempo_promedio_respuesta_ms INTEGER,
  satisfaccion_promedio DECIMAL(3,2),
  comandos_mas_usados JSONB,
  problemas_detectados JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(id_restaurante, fecha)
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_chat_conversaciones_vendedor ON chat_conversaciones(id_vendedor);
CREATE INDEX IF NOT EXISTS idx_chat_conversaciones_restaurante ON chat_conversaciones(id_restaurante);
CREATE INDEX IF NOT EXISTS idx_chat_conversaciones_estado ON chat_conversaciones(estado);
CREATE INDEX IF NOT EXISTS idx_chat_mensajes_conversacion ON chat_mensajes(id_conversacion);
CREATE INDEX IF NOT EXISTS idx_chat_mensajes_created ON chat_mensajes(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_mensajes_autor ON chat_mensajes(autor);
CREATE INDEX IF NOT EXISTS idx_chat_comandos_categoria ON chat_comandos(categoria);
CREATE INDEX IF NOT EXISTS idx_chat_comandos_activo ON chat_comandos(activo);
CREATE INDEX IF NOT EXISTS idx_chat_contexto_conversacion ON chat_contexto(id_conversacion);
CREATE INDEX IF NOT EXISTS idx_chat_analytics_restaurante_fecha ON chat_analytics(id_restaurante, fecha);

-- Trigger para actualizar updated_at en conversaciones
CREATE OR REPLACE FUNCTION actualizar_chat_conversacion_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_chat_conversacion_timestamp
  BEFORE UPDATE ON chat_conversaciones
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_chat_conversacion_timestamp();

-- Insertar comandos iniciales
INSERT INTO chat_comandos (comando, descripcion, categoria, ejemplo, requiere_parametros) VALUES
  ('inventario', 'Ver productos con stock bajo', 'inventario', 'inventario', false),
  ('inventario [producto]', 'Ver stock de un producto específico', 'inventario', 'inventario tomate', true),
  ('ventas hoy', 'Ver resumen de ventas del día', 'ventas', 'ventas hoy', false),
  ('ventas mes', 'Ver resumen de ventas del mes', 'ventas', 'ventas mes', false),
  ('producto mas vendido', 'Ver el producto más vendido', 'analytics', 'producto mas vendido', false),
  ('buscar [producto]', 'Buscar un producto por nombre', 'productos', 'buscar hamburguesa', true),
  ('precio [producto]', 'Ver precio de un producto', 'productos', 'precio ensalada', true),
  ('mesa [numero]', 'Ver información de una mesa', 'mesas', 'mesa 5', true),
  ('pedidos pendientes', 'Ver pedidos en preparación', 'cocina', 'pedidos pendientes', false),
  ('ayuda', 'Ver lista de comandos disponibles', 'general', 'ayuda', false),
  ('soporte', 'Contactar soporte técnico', 'general', 'soporte', false),
  ('limpiar', 'Limpiar historial de conversación', 'general', 'limpiar', false)
ON CONFLICT (comando) DO NOTHING;

-- Comentarios en las tablas
COMMENT ON TABLE chat_conversaciones IS 'Almacena las conversaciones del chatbot por usuario';
COMMENT ON TABLE chat_mensajes IS 'Almacena todos los mensajes del chat (usuario y bot)';
COMMENT ON TABLE chat_comandos IS 'Comandos rápidos predefinidos del chatbot';
COMMENT ON TABLE chat_contexto IS 'Contexto temporal de las conversaciones para mantener coherencia';
COMMENT ON TABLE chat_entrenamiento IS 'Feedback y datos para mejorar el chatbot';
COMMENT ON TABLE chat_analytics IS 'Métricas y analíticas del uso del chatbot';

-- Vista para estadísticas rápidas
CREATE OR REPLACE VIEW vista_chat_estadisticas AS
SELECT 
  c.id_restaurante,
  COUNT(DISTINCT c.id_conversacion) as total_conversaciones,
  COUNT(m.id_mensaje) as total_mensajes,
  COUNT(m.id_mensaje) FILTER (WHERE m.autor = 'usuario') as mensajes_usuario,
  COUNT(m.id_mensaje) FILTER (WHERE m.autor = 'bot') as mensajes_bot,
  AVG(m.tiempo_respuesta_ms) FILTER (WHERE m.autor = 'bot') as tiempo_promedio_respuesta_ms,
  DATE(c.created_at) as fecha
FROM chat_conversaciones c
LEFT JOIN chat_mensajes m ON c.id_conversacion = m.id_conversacion
GROUP BY c.id_restaurante, DATE(c.created_at);

COMMENT ON VIEW vista_chat_estadisticas IS 'Vista con estadísticas agregadas del chatbot por restaurante y fecha';

-- Función para limpiar conversaciones antiguas (más de 30 días)
CREATE OR REPLACE FUNCTION limpiar_conversaciones_antiguas()
RETURNS INTEGER AS $$
DECLARE
  registros_eliminados INTEGER;
BEGIN
  DELETE FROM chat_conversaciones
  WHERE estado = 'cerrado'
    AND updated_at < CURRENT_TIMESTAMP - INTERVAL '30 days';
  
  GET DIAGNOSTICS registros_eliminados = ROW_COUNT;
  RETURN registros_eliminados;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION limpiar_conversaciones_antiguas() IS 'Elimina conversaciones cerradas con más de 30 días de antigüedad';

-- Función para obtener comandos sugeridos basados en contexto
CREATE OR REPLACE FUNCTION sugerir_comandos(p_categoria VARCHAR DEFAULT NULL)
RETURNS TABLE (
  comando VARCHAR,
  descripcion TEXT,
  ejemplo TEXT,
  popularidad INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.comando,
    c.descripcion,
    c.ejemplo,
    c.veces_usado as popularidad
  FROM chat_comandos c
  WHERE c.activo = true
    AND (p_categoria IS NULL OR c.categoria = p_categoria)
  ORDER BY c.veces_usado DESC, c.comando
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION sugerir_comandos(VARCHAR) IS 'Sugiere comandos populares opcionalmente filtrados por categoría';

-- Grants de permisos (ajustar según necesidad)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO pos_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO pos_user;

COMMIT;

-- Mensaje de confirmación
DO $$
BEGIN
  RAISE NOTICE '✅ Sistema de Chatbot IA creado exitosamente';
  RAISE NOTICE '📊 Tablas creadas: 6';
  RAISE NOTICE '📋 Comandos iniciales: 12';
  RAISE NOTICE '🔍 Índices creados: 10';
  RAISE NOTICE '⚡ Funciones auxiliares: 3';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 El chatbot está listo para usarse!';
END $$;

