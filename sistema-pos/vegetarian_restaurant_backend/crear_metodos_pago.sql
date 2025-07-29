-- Script para crear métodos de pago básicos
-- Ejecutar solo si no existen métodos de pago

-- Verificar si ya existen métodos de pago
DO $$
BEGIN
    -- Insertar métodos de pago básicos si no existen
    IF NOT EXISTS (SELECT 1 FROM metodos_pago WHERE id_restaurante = 1) THEN
        INSERT INTO metodos_pago (descripcion, activo, id_restaurante) VALUES
        ('Efectivo', true, 1),
        ('Tarjeta de Débito', true, 1),
        ('Tarjeta de Crédito', true, 1),
        ('Transferencia Bancaria', true, 1),
        ('Pago Móvil', true, 1),
        ('Cheque', true, 1);
        
        RAISE NOTICE 'Métodos de pago creados exitosamente';
    ELSE
        RAISE NOTICE 'Los métodos de pago ya existen';
    END IF;
END $$;

-- Mostrar métodos de pago existentes
SELECT id_pago, descripcion, activo, id_restaurante 
FROM metodos_pago 
WHERE id_restaurante = 1 
ORDER BY id_pago; 