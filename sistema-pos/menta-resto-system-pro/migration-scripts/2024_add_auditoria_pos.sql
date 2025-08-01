CREATE TABLE IF NOT EXISTS auditoria_pos (
    id_auditoria         BIGSERIAL PRIMARY KEY,
    id_usuario           INTEGER REFERENCES usuarios(id_usuario),
    accion               VARCHAR(64) NOT NULL, -- Ej: transferencia_producto, division_cuenta
    tabla_afectada       VARCHAR(64) NOT NULL,
    id_registro          BIGINT, -- Puede ser venta, detalle, etc.
    datos_anteriores     JSONB,
    datos_nuevos         JSONB,
    fecha_accion         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    id_restaurante       INTEGER REFERENCES restaurantes(id_restaurante),
    ip_origen            INET, -- Para trazabilidad de terminales
    user_agent           VARCHAR(256), -- Info del dispositivo/terminal
    descripcion          TEXT, -- Descripción legible para auditoría rápida
    exito                BOOLEAN DEFAULT TRUE, -- Si la acción fue exitosa o fallida
    error_msg            TEXT, -- Mensaje de error si aplica
    CONSTRAINT idx_auditoria_pos_fecha_accion  -- Index para consultas por fecha
        CHECK (fecha_accion IS NOT NULL)
);

-- Índices recomendados para escalabilidad y consultas rápidas
CREATE INDEX IF NOT EXISTS idx_auditoria_pos_usuario_fecha
    ON auditoria_pos (id_usuario, fecha_accion DESC);

CREATE INDEX IF NOT EXISTS idx_auditoria_pos_restaurante_fecha
    ON auditoria_pos (id_restaurante, fecha_accion DESC);

CREATE INDEX IF NOT EXISTS idx_auditoria_pos_accion
    ON auditoria_pos (accion);

CREATE INDEX IF NOT EXISTS idx_auditoria_pos_tabla_registro
    ON auditoria_pos (tabla_afectada, id_registro);