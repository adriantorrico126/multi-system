-- Script para crear las tablas de modificadores
-- Ejecutar en PostgreSQL

-- Crear tabla de modificadores de productos
CREATE TABLE IF NOT EXISTS productos_modificadores (
    id_modificador SERIAL PRIMARY KEY,
    id_producto INTEGER NOT NULL REFERENCES productos(id_producto) ON DELETE CASCADE,
    nombre_modificador VARCHAR(100) NOT NULL,
    precio_extra DECIMAL(10,2) DEFAULT 0.00,
    tipo_modificador VARCHAR(50) DEFAULT 'opcional', -- opcional, obligatorio, etc.
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de relación entre detalles de venta y modificadores
CREATE TABLE IF NOT EXISTS detalle_ventas_modificadores (
    id_detalle_venta INTEGER NOT NULL REFERENCES detalle_ventas(id_detalle) ON DELETE CASCADE,
    id_modificador INTEGER NOT NULL REFERENCES productos_modificadores(id_modificador) ON DELETE CASCADE,
    precio_aplicado DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_detalle_venta, id_modificador)
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_productos_modificadores_producto ON productos_modificadores(id_producto);
CREATE INDEX IF NOT EXISTS idx_productos_modificadores_activo ON productos_modificadores(activo);
CREATE INDEX IF NOT EXISTS idx_detalle_ventas_modificadores_detalle ON detalle_ventas_modificadores(id_detalle_venta);
CREATE INDEX IF NOT EXISTS idx_detalle_ventas_modificadores_modificador ON detalle_ventas_modificadores(id_modificador);

-- Insertar algunos modificadores de ejemplo para productos existentes (usando IDs reales)
INSERT INTO productos_modificadores (id_producto, nombre_modificador, precio_extra, tipo_modificador) VALUES
(60, 'Sin cebolla', 0.00, 'opcional'),
(60, 'Extra queso', 2.00, 'opcional'),
(60, 'Sin tomate', 0.00, 'opcional'),
(61, 'Sin hielo', 0.00, 'opcional'),
(61, 'Extra limón', 0.50, 'opcional'),
(62, 'Sin azúcar', 0.00, 'opcional'),
(62, 'Extra dulce', 0.00, 'opcional'),
(63, 'Sin salsa', 0.00, 'opcional'),
(63, 'Extra salsa', 1.00, 'opcional'),
(64, 'Sin papas', 0.00, 'opcional'),
(64, 'Extra papas', 3.00, 'opcional');

-- Crear trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_modificadores_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_productos_modificadores_updated_at 
    BEFORE UPDATE ON productos_modificadores 
    FOR EACH ROW 
    EXECUTE FUNCTION update_modificadores_updated_at();

-- Comentarios sobre las tablas
COMMENT ON TABLE productos_modificadores IS 'Tabla para almacenar modificadores disponibles para cada producto';
COMMENT ON TABLE detalle_ventas_modificadores IS 'Tabla de relación entre detalles de venta y modificadores aplicados'; 