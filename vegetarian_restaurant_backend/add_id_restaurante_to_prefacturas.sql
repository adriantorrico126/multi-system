-- Agregar columna id_restaurante a la tabla prefacturas
ALTER TABLE prefacturas 
ADD COLUMN id_restaurante INTEGER DEFAULT 1;

-- Actualizar registros existentes con id_restaurante = 1
UPDATE prefacturas 
SET id_restaurante = 1 
WHERE id_restaurante IS NULL;

-- Agregar constraint para asegurar que id_restaurante no sea NULL
ALTER TABLE prefacturas 
ALTER COLUMN id_restaurante SET NOT NULL;

-- Agregar foreign key constraint si es necesario
-- ALTER TABLE prefacturas 
-- ADD CONSTRAINT fk_prefacturas_restaurante 
-- FOREIGN KEY (id_restaurante) REFERENCES restaurantes(id_restaurante);

-- Verificar que la columna se agregó correctamente
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'prefacturas' 
AND column_name = 'id_restaurante';

-- Mostrar algunos registros para verificar
SELECT id_prefactura, id_restaurante, created_at 
FROM prefacturas 
LIMIT 5; 