-- Script para crear la tabla de reservas
-- Ejecutar: psql -d sistempos -f create_reservas.sql

-- Crear tabla de clientes si no existe
CREATE TABLE IF NOT EXISTS clientes (
    id_cliente SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    telefono VARCHAR(20),
    email VARCHAR(100),
    direccion TEXT,
    tipo_cliente VARCHAR(20) DEFAULT 'regular' CHECK (tipo_cliente IN ('regular', 'vip', 'corporativo')),
    notas TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de reservas
CREATE TABLE IF NOT EXISTS reservas (
    id_reserva SERIAL PRIMARY KEY,
    id_mesa INTEGER NOT NULL,
    id_cliente INTEGER,
    id_restaurante INTEGER NOT NULL,
    id_sucursal INTEGER NOT NULL,
    id_vendedor INTEGER, -- Mesero que tomó la reserva
    fecha_hora_inicio TIMESTAMP NOT NULL,
    fecha_hora_fin TIMESTAMP NOT NULL,
    numero_personas INTEGER NOT NULL DEFAULT 1,
    estado VARCHAR(20) DEFAULT 'confirmada' CHECK (estado IN ('pendiente', 'confirmada', 'cancelada', 'completada', 'no_show')),
    observaciones TEXT,
    motivo_cancelacion TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT fk_reserva_mesa FOREIGN KEY (id_mesa) REFERENCES mesas(id_mesa) ON DELETE CASCADE,
    CONSTRAINT fk_reserva_cliente FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente) ON DELETE SET NULL,
    CONSTRAINT fk_reserva_vendedor FOREIGN KEY (id_vendedor) REFERENCES vendedores(id_vendedor) ON DELETE SET NULL,
    CONSTRAINT fk_reserva_restaurante FOREIGN KEY (id_restaurante) REFERENCES restaurantes(id_restaurante) ON DELETE CASCADE,
    CONSTRAINT fk_reserva_sucursal FOREIGN KEY (id_sucursal) REFERENCES sucursales(id_sucursal) ON DELETE CASCADE,
    
    -- Validaciones
    CONSTRAINT check_fecha_hora CHECK (fecha_hora_inicio < fecha_hora_fin),
    CONSTRAINT check_numero_personas CHECK (numero_personas > 0),
    CONSTRAINT check_fecha_futura CHECK (fecha_hora_inicio > CURRENT_TIMESTAMP)
);

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_reservas_fecha_inicio ON reservas(fecha_hora_inicio);
CREATE INDEX IF NOT EXISTS idx_reservas_fecha_fin ON reservas(fecha_hora_fin);
CREATE INDEX IF NOT EXISTS idx_reservas_mesa ON reservas(id_mesa);
CREATE INDEX IF NOT EXISTS idx_reservas_estado ON reservas(estado);
CREATE INDEX IF NOT EXISTS idx_reservas_restaurante_sucursal ON reservas(id_restaurante, id_sucursal);
CREATE INDEX IF NOT EXISTS idx_reservas_cliente ON reservas(id_cliente);

-- Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear triggers para actualizar updated_at
CREATE TRIGGER update_reservas_updated_at 
    BEFORE UPDATE ON reservas 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clientes_updated_at 
    BEFORE UPDATE ON clientes 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Crear función para verificar conflictos de reservas
CREATE OR REPLACE FUNCTION verificar_conflicto_reserva(
    p_id_mesa INTEGER,
    p_fecha_inicio TIMESTAMP,
    p_fecha_fin TIMESTAMP,
    p_id_reserva_excluir INTEGER DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    conflicto_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO conflicto_count
    FROM reservas
    WHERE id_mesa = p_id_mesa
      AND estado IN ('confirmada', 'pendiente')
      AND (
          (fecha_hora_inicio < p_fecha_fin AND fecha_hora_fin > p_fecha_inicio)
          OR (p_fecha_inicio < fecha_hora_fin AND p_fecha_fin > fecha_hora_inicio)
      )
      AND (p_id_reserva_excluir IS NULL OR id_reserva != p_id_reserva_excluir);
    
    RETURN conflicto_count > 0;
END;
$$ LANGUAGE plpgsql;

-- Insertar algunos clientes de ejemplo
INSERT INTO clientes (nombre, telefono, email, tipo_cliente) VALUES
('Juan Pérez', '+591 70012345', 'juan.perez@email.com', 'regular'),
('María González', '+591 70067890', 'maria.gonzalez@email.com', 'vip'),
('Empresa ABC', '+591 70011111', 'contacto@empresaabc.com', 'corporativo')
ON CONFLICT DO NOTHING;

-- Comentarios sobre la estructura
COMMENT ON TABLE reservas IS 'Tabla para gestionar reservas de mesas en el restaurante';
COMMENT ON COLUMN reservas.estado IS 'Estado de la reserva: pendiente, confirmada, cancelada, completada, no_show';
COMMENT ON COLUMN reservas.numero_personas IS 'Número de personas para la reserva';
COMMENT ON COLUMN reservas.observaciones IS 'Observaciones especiales de la reserva';
COMMENT ON COLUMN reservas.motivo_cancelacion IS 'Motivo de cancelación si aplica';

COMMENT ON TABLE clientes IS 'Tabla para gestionar información de clientes';
COMMENT ON COLUMN clientes.tipo_cliente IS 'Tipo de cliente: regular, vip, corporativo'; 