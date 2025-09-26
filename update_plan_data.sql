-- =====================================================
-- ACTUALIZACIÓN DE DATOS DE PLANES SEGÚN ESPECIFICACIÓN
-- PLANES_FUNCIONALIDADES_COMPLETO.md
-- =====================================================

-- Actualizar Plan Básico ($19/mes)
UPDATE planes SET 
  nombre = 'basico',
  descripcion = 'Perfecto para restaurantes pequeños y medianos',
  precio_mensual = 19.00,
  precio_anual = 190.00,
  max_sucursales = 1,
  max_usuarios = 2,
  max_productos = 100,
  max_transacciones_mes = 500,
  almacenamiento_gb = 1,
  funcionalidades = '{
    "sales": ["basico"],
    "inventory": ["products"],
    "dashboard": ["resumen", "productos", "categorias", "usuarios"],
    "mesas": false,
    "lotes": false,
    "arqueo": false,
    "cocina": false,
    "egresos": false,
    "delivery": false,
    "reservas": false,
    "analytics": false,
    "promociones": false,
    "api": false,
    "white_label": false
  }'::jsonb
WHERE nombre = 'basico' OR id_plan = 1;

-- Actualizar Plan Profesional ($49/mes)
UPDATE planes SET 
  nombre = 'profesional',
  descripcion = 'Ideal para cadenas de restaurantes',
  precio_mensual = 49.00,
  precio_anual = 490.00,
  max_sucursales = 2,
  max_usuarios = 7,
  max_productos = 500,
  max_transacciones_mes = 2000,
  almacenamiento_gb = 5,
  funcionalidades = '{
    "sales": ["basico", "pedidos"],
    "inventory": ["products", "lots"],
    "dashboard": ["resumen", "productos", "categorias", "usuarios", "mesas"],
    "mesas": true,
    "lotes": true,
    "arqueo": true,
    "cocina": true,
    "egresos": ["basico"],
    "delivery": false,
    "reservas": false,
    "analytics": false,
    "promociones": false,
    "api": false,
    "white_label": false
  }'::jsonb
WHERE nombre = 'profesional' OR id_plan = 2;

-- Actualizar Plan Avanzado ($99/mes)
UPDATE planes SET 
  nombre = 'avanzado',
  descripcion = 'Para grandes cadenas y franquicias',
  precio_mensual = 99.00,
  precio_anual = 990.00,
  max_sucursales = 3,
  max_usuarios = 0,
  max_productos = 2000,
  max_transacciones_mes = 10000,
  almacenamiento_gb = 20,
  funcionalidades = '{
    "sales": ["basico", "pedidos", "avanzado"],
    "inventory": ["products", "lots", "complete"],
    "dashboard": ["resumen", "productos", "categorias", "usuarios", "mesas", "completo"],
    "mesas": true,
    "lotes": true,
    "arqueo": true,
    "cocina": true,
    "egresos": ["basico", "avanzado"],
    "delivery": true,
    "reservas": true,
    "analytics": true,
    "promociones": true,
    "api": false,
    "white_label": false
  }'::jsonb
WHERE nombre = 'avanzado' OR id_plan = 3;

-- Actualizar Plan Enterprise ($119/mes)
UPDATE planes SET 
  nombre = 'enterprise',
  descripcion = 'Para grandes cadenas y franquicias con necesidades empresariales',
  precio_mensual = 119.00,
  precio_anual = 1190.00,
  max_sucursales = 0,
  max_usuarios = 0,
  max_productos = 0,
  max_transacciones_mes = 0,
  almacenamiento_gb = 0,
  funcionalidades = '{
    "sales": ["basico", "pedidos", "avanzado"],
    "inventory": ["products", "lots", "complete"],
    "dashboard": ["resumen", "productos", "categorias", "usuarios", "mesas", "completo"],
    "mesas": true,
    "lotes": true,
    "arqueo": true,
    "cocina": true,
    "egresos": ["basico", "avanzado"],
    "delivery": true,
    "reservas": true,
    "analytics": true,
    "promociones": true,
    "api": true,
    "white_label": true
  }'::jsonb
WHERE nombre = 'enterprise' OR id_plan = 4;

-- Crear tabla de uso de recursos si no existe
CREATE TABLE IF NOT EXISTS uso_recursos (
  id SERIAL PRIMARY KEY,
  id_restaurante INTEGER NOT NULL REFERENCES restaurantes(id_restaurante) ON DELETE CASCADE,
  id_plan INTEGER NOT NULL REFERENCES planes(id_plan),
  mes_medicion INTEGER NOT NULL CHECK (mes_medicion >= 1 AND mes_medicion <= 12),
  año_medicion INTEGER NOT NULL CHECK (año_medicion >= 2020),
  productos_actuales INTEGER DEFAULT 0,
  usuarios_actuales INTEGER DEFAULT 0,
  sucursales_actuales INTEGER DEFAULT 0,
  transacciones_mes_actual INTEGER DEFAULT 0,
  almacenamiento_usado_mb INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(id_restaurante, mes_medicion, año_medicion)
);

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_uso_recursos_restaurante ON uso_recursos(id_restaurante);
CREATE INDEX IF NOT EXISTS idx_uso_recursos_plan ON uso_recursos(id_plan);
CREATE INDEX IF NOT EXISTS idx_uso_recursos_periodo ON uso_recursos(mes_medicion, año_medicion);

-- Insertar planes si no existen
INSERT INTO planes (nombre, descripcion, precio_mensual, precio_anual, max_sucursales, max_usuarios, max_productos, max_transacciones_mes, almacenamiento_gb, funcionalidades, activo)
VALUES 
  ('basico', 'Perfecto para restaurantes pequeños y medianos', 19.00, 190.00, 1, 2, 100, 500, 1, '{
    "sales": ["basico"],
    "inventory": ["products"],
    "dashboard": ["resumen", "productos", "categorias", "usuarios"],
    "mesas": false,
    "lotes": false,
    "arqueo": false,
    "cocina": false,
    "egresos": false,
    "delivery": false,
    "reservas": false,
    "analytics": false,
    "promociones": false,
    "api": false,
    "white_label": false
  }'::jsonb, true),
  ('profesional', 'Ideal para cadenas de restaurantes', 49.00, 490.00, 2, 7, 500, 2000, 5, '{
    "sales": ["basico", "pedidos"],
    "inventory": ["products", "lots"],
    "dashboard": ["resumen", "productos", "categorias", "usuarios", "mesas"],
    "mesas": true,
    "lotes": true,
    "arqueo": true,
    "cocina": true,
    "egresos": ["basico"],
    "delivery": false,
    "reservas": false,
    "analytics": false,
    "promociones": false,
    "api": false,
    "white_label": false
  }'::jsonb, true),
  ('avanzado', 'Para grandes cadenas y franquicias', 99.00, 990.00, 3, 0, 2000, 10000, 20, '{
    "sales": ["basico", "pedidos", "avanzado"],
    "inventory": ["products", "lots", "complete"],
    "dashboard": ["resumen", "productos", "categorias", "usuarios", "mesas", "completo"],
    "mesas": true,
    "lotes": true,
    "arqueo": true,
    "cocina": true,
    "egresos": ["basico", "avanzado"],
    "delivery": true,
    "reservas": true,
    "analytics": true,
    "promociones": true,
    "api": false,
    "white_label": false
  }'::jsonb, true),
  ('enterprise', 'Para grandes cadenas y franquicias con necesidades empresariales', 119.00, 1190.00, 0, 0, 0, 0, 0, '{
    "sales": ["basico", "pedidos", "avanzado"],
    "inventory": ["products", "lots", "complete"],
    "dashboard": ["resumen", "productos", "categorias", "usuarios", "mesas", "completo"],
    "mesas": true,
    "lotes": true,
    "arqueo": true,
    "cocina": true,
    "egresos": ["basico", "avanzado"],
    "delivery": true,
    "reservas": true,
    "analytics": true,
    "promociones": true,
    "api": true,
    "white_label": true
  }'::jsonb, true)
ON CONFLICT (nombre) DO NOTHING;

-- Crear tabla de suscripciones si no existe
CREATE TABLE IF NOT EXISTS suscripciones (
  id SERIAL PRIMARY KEY,
  id_restaurante INTEGER NOT NULL REFERENCES restaurantes(id_restaurante) ON DELETE CASCADE,
  id_plan INTEGER NOT NULL REFERENCES planes(id_plan),
  estado VARCHAR(50) NOT NULL DEFAULT 'activa' CHECK (estado IN ('activa', 'inactiva', 'suspendida', 'cancelada')),
  fecha_inicio TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fecha_fin TIMESTAMP WITH TIME ZONE,
  fecha_renovacion TIMESTAMP WITH TIME ZONE,
  auto_renovacion BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear índices para suscripciones
CREATE INDEX IF NOT EXISTS idx_suscripciones_restaurante ON suscripciones(id_restaurante);
CREATE INDEX IF NOT EXISTS idx_suscripciones_plan ON suscripciones(id_plan);
CREATE INDEX IF NOT EXISTS idx_suscripciones_estado ON suscripciones(estado);

-- Verificar que todos los restaurantes tengan una suscripción activa
INSERT INTO suscripciones (id_restaurante, id_plan, estado, fecha_inicio, auto_renovacion)
SELECT 
  r.id_restaurante,
  p.id_plan,
  'activa',
  NOW(),
  true
FROM restaurantes r
CROSS JOIN planes p
WHERE p.nombre = 'basico'
AND NOT EXISTS (
  SELECT 1 FROM suscripciones s 
  WHERE s.id_restaurante = r.id_restaurante 
  AND s.estado = 'activa'
);

-- Mostrar resumen de la actualización
SELECT 
  p.nombre,
  p.precio_mensual,
  p.max_sucursales,
  p.max_usuarios,
  p.max_productos,
  p.max_transacciones_mes,
  p.almacenamiento_gb,
  COUNT(s.id) as suscripciones_activas
FROM planes p
LEFT JOIN suscripciones s ON p.id_plan = s.id_plan AND s.estado = 'activa'
GROUP BY p.id_plan, p.nombre, p.precio_mensual, p.max_sucursales, p.max_usuarios, p.max_productos, p.max_transacciones_mes, p.almacenamiento_gb
ORDER BY p.precio_mensual;
