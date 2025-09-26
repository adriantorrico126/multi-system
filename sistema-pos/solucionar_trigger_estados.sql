-- ===============================================
-- SOLUCIÓN: Actualizar trigger para incluir pendiente_aprobacion
-- ===============================================

BEGIN;

-- 1. Actualizar la función validate_venta_integrity para incluir pendiente_aprobacion
CREATE OR REPLACE FUNCTION validate_venta_integrity()
RETURNS TRIGGER AS $$
BEGIN
  -- Validar mesa SOLO para ventas de tipo 'Mesa'
  IF NEW.tipo_servicio = 'Mesa' THEN
    -- Mesa obligatoria cuando es servicio de Mesa
    IF NEW.id_mesa IS NULL OR NEW.mesa_numero IS NULL THEN
      RAISE EXCEPTION 'La mesa es obligatoria para ventas de Mesa' USING ERRCODE = 'P0001';
    END IF;

    -- La mesa debe existir
    IF NOT EXISTS (
      SELECT 1 FROM mesas 
      WHERE id_mesa = NEW.id_mesa
    ) THEN
      RAISE EXCEPTION 'La mesa % no existe', NEW.id_mesa;
    END IF;

    -- Consistencia de datos de mesa
    IF EXISTS (
      SELECT 1 FROM mesas m
      WHERE m.id_mesa = NEW.id_mesa
        AND (m.numero != NEW.mesa_numero 
             OR m.id_sucursal != NEW.id_sucursal 
             OR m.id_restaurante != NEW.id_restaurante)
    ) THEN
      RAISE EXCEPTION 'Inconsistencia en datos de mesa: número=%, sucursal=%, restaurante=%', 
        NEW.mesa_numero, NEW.id_sucursal, NEW.id_restaurante;
    END IF;
  END IF;

  -- Verificar que el estado sea válido (INCLUYENDO pendiente_aprobacion)
  IF NEW.estado NOT IN (
    'recibido', 'en_preparacion', 'entregado', 'cancelado',
    'abierta', 'en_uso', 'pendiente_cobro', 'completada', 'pendiente', 'pagado',
    'pendiente_aprobacion', 'aceptado'  -- AGREGADOS ESTOS ESTADOS
  ) THEN
    RAISE EXCEPTION 'Estado de venta inválido: %', NEW.estado;
  END IF;

  -- Verificar que el vendedor pertenezca al restaurante
  IF NEW.id_vendedor IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM vendedores 
    WHERE id_vendedor = NEW.id_vendedor 
      AND id_restaurante = NEW.id_restaurante
  ) THEN
    RAISE EXCEPTION 'El vendedor % no pertenece al restaurante %', NEW.id_vendedor, NEW.id_restaurante;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Verificar que el trigger existe
SELECT 'TRIGGER ACTUALIZADO:' as info;
SELECT 
    tgname as trigger_name,
    tgrelid::regclass as table_name,
    proname as function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgrelid::regclass::text = 'ventas'
AND proname = 'validate_venta_integrity';

-- 3. Verificar estados problemáticos antes de la actualización
SELECT 'ESTADOS PROBLEMÁTICOS ANTES:' as info;
SELECT 
    id_venta,
    estado,
    fecha,
    total
FROM ventas 
WHERE estado = 'pendiente_aprobacion'
ORDER BY fecha DESC;

COMMIT;

-- ===============================================
-- AHORA EJECUTAR EL SCRIPT DE ELIMINACIÓN
-- ===============================================
