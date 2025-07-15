-- Script para crear las tablas de gestión de mesas
-- Ejecutar en PostgreSQL

-- Crear tabla de mesas
CREATE TABLE IF NOT EXISTS mesas (
    id SERIAL PRIMARY KEY,
    numero INTEGER NOT NULL UNIQUE,
    estado VARCHAR(20) NOT NULL DEFAULT 'libre' CHECK (estado IN ('libre', 'ocupada', 'pendiente_pago')),
    sucursal_id INTEGER NOT NULL,
    total_acumulado DECIMAL(10,2) DEFAULT 0.00,
    fecha_apertura TIMESTAMP,
    fecha_cierre TIMESTAMP,
    vendedor_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de prefacturas
CREATE TABLE IF NOT EXISTS prefacturas (
    id SERIAL PRIMARY KEY,
    mesa_id INTEGER NOT NULL REFERENCES mesas(id),
    venta_id INTEGER REFERENCES ventas(id),
    productos JSONB NOT NULL DEFAULT '[]',
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    impuestos DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    estado VARCHAR(20) NOT NULL DEFAULT 'activa' CHECK (estado IN ('activa', 'facturada', 'cancelada')),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_facturacion TIMESTAMP,
    vendedor_id INTEGER,
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_mesas_estado ON mesas(estado);
CREATE INDEX IF NOT EXISTS idx_mesas_sucursal ON mesas(sucursal_id);
CREATE INDEX IF NOT EXISTS idx_prefacturas_mesa ON prefacturas(mesa_id);
CREATE INDEX IF NOT EXISTS idx_prefacturas_estado ON prefacturas(estado);

-- Insertar mesas de ejemplo (1-20)
INSERT INTO mesas (numero, estado, sucursal_id) 
SELECT 
    generate_series(1, 20) as numero,
    'libre' as estado,
    1 as sucursal_id
ON CONFLICT (numero) DO NOTHING;

-- Crear trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger a mesas
DROP TRIGGER IF EXISTS update_mesas_updated_at ON mesas;
CREATE TRIGGER update_mesas_updated_at 
    BEFORE UPDATE ON mesas 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Aplicar trigger a prefacturas
DROP TRIGGER IF EXISTS update_prefacturas_updated_at ON prefacturas;
CREATE TRIGGER update_prefacturas_updated_at 
    BEFORE UPDATE ON prefacturas 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Verificar que las tablas se crearon correctamente
SELECT 'Mesas creadas correctamente' as status;
SELECT COUNT(*) as total_mesas FROM mesas; 