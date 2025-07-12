-- Verificar todas las tablas en la base de datos
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Verificar si existe la tabla prefacturas
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'prefacturas';

-- Si existe prefacturas, mostrar su estructura
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'prefacturas' 
ORDER BY ordinal_position;

-- Verificar si existe la tabla ventas
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'ventas';

-- Si existe ventas, mostrar su estructura
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'ventas' 
ORDER BY ordinal_position;

-- Verificar si existe la tabla detalles_venta
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'detalles_venta';

-- Si existe detalles_venta, mostrar su estructura
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'detalles_venta' 
ORDER BY ordinal_position; 