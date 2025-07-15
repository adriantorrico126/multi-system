-- Script de migración para agregar soporte multi-tenancy
-- Ejecutar este script para migrar la base de datos existente

-- 1. Crear tabla de restaurantes
CREATE TABLE IF NOT EXISTS restaurantes (
    id_restaurante SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL UNIQUE,
    direccion TEXT,
    ciudad VARCHAR(100),
    telefono VARCHAR(20),
    email VARCHAR(255),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Insertar restaurante por defecto
INSERT INTO restaurantes (nombre, direccion, ciudad, telefono, email) 
VALUES ('Restaurante Principal', 'Dirección Principal', 'Ciudad Principal', '123456789', 'info@restaurante.com')
ON CONFLICT (nombre) DO NOTHING;

-- 3. Agregar columna id_restaurante a todas las tablas existentes
ALTER TABLE categorias ADD COLUMN IF NOT EXISTS id_restaurante INTEGER DEFAULT 1;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS id_restaurante INTEGER DEFAULT 1;
ALTER TABLE vendedores ADD COLUMN IF NOT EXISTS id_restaurante INTEGER DEFAULT 1;
ALTER TABLE metodos_pago ADD COLUMN IF NOT EXISTS id_restaurante INTEGER DEFAULT 1;
ALTER TABLE sucursales ADD COLUMN IF NOT EXISTS id_restaurante INTEGER DEFAULT 1;
ALTER TABLE mesas ADD COLUMN IF NOT EXISTS id_restaurante INTEGER DEFAULT 1;
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS id_restaurante INTEGER DEFAULT 1;
ALTER TABLE detalle_ventas ADD COLUMN IF NOT EXISTS id_restaurante INTEGER DEFAULT 1;

-- 4. Agregar restricciones de clave foránea
ALTER TABLE categorias ADD CONSTRAINT fk_categorias_restaurante 
    FOREIGN KEY (id_restaurante) REFERENCES restaurantes(id_restaurante) ON DELETE CASCADE;

ALTER TABLE productos ADD CONSTRAINT fk_productos_restaurante 
    FOREIGN KEY (id_restaurante) REFERENCES restaurantes(id_restaurante) ON DELETE CASCADE;

ALTER TABLE vendedores ADD CONSTRAINT fk_vendedores_restaurante 
    FOREIGN KEY (id_restaurante) REFERENCES restaurantes(id_restaurante) ON DELETE CASCADE;

ALTER TABLE metodos_pago ADD CONSTRAINT fk_metodos_pago_restaurante 
    FOREIGN KEY (id_restaurante) REFERENCES restaurantes(id_restaurante) ON DELETE CASCADE;

ALTER TABLE sucursales ADD CONSTRAINT fk_sucursales_restaurante 
    FOREIGN KEY (id_restaurante) REFERENCES restaurantes(id_restaurante) ON DELETE CASCADE;

ALTER TABLE mesas ADD CONSTRAINT fk_mesas_restaurante 
    FOREIGN KEY (id_restaurante) REFERENCES restaurantes(id_restaurante) ON DELETE CASCADE;

ALTER TABLE ventas ADD CONSTRAINT fk_ventas_restaurante 
    FOREIGN KEY (id_restaurante) REFERENCES restaurantes(id_restaurante) ON DELETE CASCADE;

ALTER TABLE detalle_ventas ADD CONSTRAINT fk_detalle_ventas_restaurante 
    FOREIGN KEY (id_restaurante) REFERENCES restaurantes(id_restaurante) ON DELETE CASCADE;

-- 5. Crear índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_categorias_restaurante ON categorias(id_restaurante);
CREATE INDEX IF NOT EXISTS idx_productos_restaurante ON productos(id_restaurante);
CREATE INDEX IF NOT EXISTS idx_vendedores_restaurante ON vendedores(id_restaurante);
CREATE INDEX IF NOT EXISTS idx_ventas_restaurante ON ventas(id_restaurante);

-- 6. Actualizar datos existentes para asignar al restaurante por defecto
UPDATE categorias SET id_restaurante = 1 WHERE id_restaurante IS NULL;
UPDATE productos SET id_restaurante = 1 WHERE id_restaurante IS NULL;
UPDATE vendedores SET id_restaurante = 1 WHERE id_restaurante IS NULL;
UPDATE metodos_pago SET id_restaurante = 1 WHERE id_restaurante IS NULL;
UPDATE sucursales SET id_restaurante = 1 WHERE id_restaurante IS NULL;
UPDATE mesas SET id_restaurante = 1 WHERE id_restaurante IS NULL;
UPDATE ventas SET id_restaurante = 1 WHERE id_restaurante IS NULL;
UPDATE detalle_ventas SET id_restaurante = 1 WHERE id_restaurante IS NULL;

-- 7. Hacer las columnas NOT NULL después de asignar valores
ALTER TABLE categorias ALTER COLUMN id_restaurante SET NOT NULL;
ALTER TABLE productos ALTER COLUMN id_restaurante SET NOT NULL;
ALTER TABLE vendedores ALTER COLUMN id_restaurante SET NOT NULL;
ALTER TABLE metodos_pago ALTER COLUMN id_restaurante SET NOT NULL;
ALTER TABLE sucursales ALTER COLUMN id_restaurante SET NOT NULL;
ALTER TABLE mesas ALTER COLUMN id_restaurante SET NOT NULL;
ALTER TABLE ventas ALTER COLUMN id_restaurante SET NOT NULL;
ALTER TABLE detalle_ventas ALTER COLUMN id_restaurante SET NOT NULL;

-- 8. Agregar restricciones UNIQUE para evitar duplicados por restaurante
ALTER TABLE categorias ADD CONSTRAINT unique_categoria_restaurante UNIQUE(id_restaurante, nombre);
ALTER TABLE productos ADD CONSTRAINT unique_producto_restaurante UNIQUE(id_restaurante, nombre);
ALTER TABLE vendedores ADD CONSTRAINT unique_vendedor_restaurante UNIQUE(id_restaurante, username);
ALTER TABLE metodos_pago ADD CONSTRAINT unique_metodo_pago_restaurante UNIQUE(id_restaurante, descripcion);
ALTER TABLE sucursales ADD CONSTRAINT unique_sucursal_restaurante UNIQUE(id_restaurante, nombre);

COMMIT; 