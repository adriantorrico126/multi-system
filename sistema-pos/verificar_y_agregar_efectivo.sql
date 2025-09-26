-- ===============================================
-- VERIFICAR Y AGREGAR MÉTODO EFECTIVO
-- ===============================================

-- 1. Verificar métodos actuales
SELECT 'MÉTODOS ACTUALES:' as info;
SELECT id_pago, descripcion, activo FROM metodos_pago ORDER BY id_pago;

-- 2. Verificar constraints
SELECT 'CONSTRAINTS ACTUALES:' as info;
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'metodos_pago'
ORDER BY tc.constraint_name;

-- 3. Agregar constraint única si no existe
ALTER TABLE metodos_pago DROP CONSTRAINT IF EXISTS metodos_pago_descripcion_key;
ALTER TABLE metodos_pago ADD CONSTRAINT IF NOT EXISTS metodos_pago_descripcion_unique UNIQUE(descripcion);

-- 4. Agregar método Efectivo
INSERT INTO metodos_pago (descripcion, activo) 
VALUES ('Efectivo', true) 
ON CONFLICT (descripcion) 
DO UPDATE SET activo = EXCLUDED.activo;

-- 5. Agregar método Pago Diferido
INSERT INTO metodos_pago (descripcion, activo) 
VALUES ('Pago Diferido', true) 
ON CONFLICT (descripcion) 
DO UPDATE SET activo = EXCLUDED.activo;

-- 6. Verificar resultado final
SELECT 'MÉTODOS FINALES:' as info;
SELECT id_pago, descripcion, activo FROM metodos_pago ORDER BY id_pago;

-- 7. Probar búsquedas
SELECT 'PRUEBA BÚSQUEDA EFECTIVO:' as info;
SELECT * FROM metodos_pago WHERE LOWER(descripcion) = LOWER('Efectivo') LIMIT 1;
