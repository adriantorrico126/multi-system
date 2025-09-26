-- ===============================================
-- VERIFICACIÓN: Estado actual de metodos_pago
-- ===============================================

-- 1. Verificar qué tablas existen relacionadas con metodos_pago
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name LIKE '%metodos_pago%'
ORDER BY table_name;

-- 2. Si existe metodos_pago_backup, verificar su estructura
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'metodos_pago_backup'
ORDER BY ordinal_position;

-- 3. Si existe metodos_pago, verificar su estructura
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'metodos_pago'
ORDER BY ordinal_position;

-- 4. Verificar datos en las tablas existentes
SELECT 'DATOS EN METODOS_PAGO:' as info;
SELECT * FROM metodos_pago ORDER BY id_pago;

SELECT 'DATOS EN METODOS_PAGO_BACKUP:' as info;
SELECT * FROM metodos_pago_backup ORDER BY id_pago;
