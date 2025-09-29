-- Script para crear la tabla alertas_limite en producción
-- Esta tabla es necesaria para el sistema de planes y suscripciones

CREATE TABLE IF NOT EXISTS alertas_limite (
    id_alerta SERIAL PRIMARY KEY,
    id_restaurante INTEGER NOT NULL,
    id_plan INTEGER NOT NULL,
    tipo_alerta VARCHAR(50) NOT NULL,
    recurso VARCHAR(50) NOT NULL,
    valor_actual INTEGER DEFAULT 0,
    valor_limite INTEGER NOT NULL,
    porcentaje_uso NUMERIC(5,2) DEFAULT 0.00,
    estado VARCHAR(30) DEFAULT 'pendiente',
    fecha_alerta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_resolucion TIMESTAMP NULL,
    mensaje TEXT,
    datos_adicionales JSONB DEFAULT '{}',
    nivel_urgencia VARCHAR(20) DEFAULT 'medio',
    
    -- Índices para optimizar consultas
    CONSTRAINT fk_alertas_plan FOREIGN KEY (id_plan) REFERENCES planes(id_plan),
    CONSTRAINT fk_alertas_restaurante FOREIGN KEY (id_restaurante) REFERENCES restaurantes(id_restaurante)
);

-- Crear índices para optimizar consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_alertas_restaurante ON alertas_limite(id_restaurante);
CREATE INDEX IF NOT EXISTS idx_alertas_estado ON alertas_limite(estado);
CREATE INDEX IF NOT EXISTS idx_alertas_fecha ON alertas_limite(fecha_alerta);
CREATE INDEX IF NOT EXISTS idx_alertas_tipo ON alertas_limite(tipo_alerta);

-- Comentarios para documentar la tabla
COMMENT ON TABLE alertas_limite IS 'Tabla para gestionar alertas de límites de plan';
COMMENT ON COLUMN alertas_limite.tipo_alerta IS 'Tipo de alerta: limite_usado, limite_excedido, proximo_vencimiento';
COMMENT ON COLUMN alertas_limite.recurso IS 'Recurso monitoreado: usuarios, productos, sucursales, transacciones';
COMMENT ON COLUMN alertas_limite.porcentaje_uso IS 'Porcentaje de uso del límite (0-100)';
COMMENT ON COLUMN alertas_limite.estado IS 'Estado de la alerta: pendiente, vista, resuelta, archivada';
COMMENT ON COLUMN alertas_limite.nivel_urgencia IS 'Nivel de urgencia: bajo, medio, alto, critico';
