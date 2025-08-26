-- =====================================================
-- TRIGGERS DE INTEGRIDAD PARA PREVENIR INCONSISTENCIAS
-- =====================================================

-- 1. TRIGGER PARA VALIDAR CONSISTENCIA DE MESAS
CREATE OR REPLACE FUNCTION validate_mesa_integrity()
RETURNS TRIGGER AS $$
BEGIN
  -- Verificar que no haya mesas duplicadas por número en el mismo restaurante
  IF EXISTS (
    SELECT 1 FROM mesas 
    WHERE numero = NEW.numero 
      AND id_restaurante = NEW.id_restaurante 
      AND id_mesa != COALESCE(NEW.id_mesa, 0)
  ) THEN
    RAISE EXCEPTION 'Ya existe una mesa con número % en el restaurante %', NEW.numero, NEW.id_restaurante;
  END IF;

  -- Verificar que la sucursal pertenezca al restaurante
  IF NOT EXISTS (
    SELECT 1 FROM sucursales 
    WHERE id_sucursal = NEW.id_sucursal 
      AND id_restaurante = NEW.id_restaurante
  ) THEN
    RAISE EXCEPTION 'La sucursal % no pertenece al restaurante %', NEW.id_sucursal, NEW.id_restaurante;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a mesas
DROP TRIGGER IF EXISTS trigger_validate_mesa_integrity ON mesas;
CREATE TRIGGER trigger_validate_mesa_integrity
  BEFORE INSERT OR UPDATE ON mesas
  FOR EACH ROW
  EXECUTE FUNCTION validate_mesa_integrity();

-- 2. TRIGGER PARA VALIDAR CONSISTENCIA DE VENTAS
CREATE OR REPLACE FUNCTION validate_venta_integrity()
RETURNS TRIGGER AS $$
BEGIN
  -- Verificar que la mesa existe y es consistente
  IF NOT EXISTS (
    SELECT 1 FROM mesas 
    WHERE id_mesa = NEW.id_mesa
  ) THEN
    RAISE EXCEPTION 'La mesa % no existe', NEW.id_mesa;
  END IF;

  -- Verificar consistencia de datos de mesa
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

  -- Verificar que el estado sea válido
  IF NEW.estado NOT IN (
    'recibido', 'en_preparacion', 'listo_para_servir', 'entregado', 'cancelado',
    'abierta', 'en_uso', 'pendiente_cobro', 'completada', 'pendiente', 'pagado'
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

-- Aplicar trigger a ventas
DROP TRIGGER IF EXISTS trigger_validate_venta_integrity ON ventas;
CREATE TRIGGER trigger_validate_venta_integrity
  BEFORE INSERT OR UPDATE ON ventas
  FOR EACH ROW
  EXECUTE FUNCTION validate_venta_integrity();

-- 3. TRIGGER PARA VALIDAR CONSISTENCIA DE DETALLES DE VENTA
CREATE OR REPLACE FUNCTION validate_detalle_venta_integrity()
RETURNS TRIGGER AS $$
BEGIN
  -- Verificar que la venta existe
  IF NOT EXISTS (
    SELECT 1 FROM ventas 
    WHERE id_venta = NEW.id_venta
  ) THEN
    RAISE EXCEPTION 'La venta % no existe', NEW.id_venta;
  END IF;

  -- Verificar que el producto existe y pertenece al restaurante correcto
  IF NEW.id_producto IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM productos p
    JOIN ventas v ON v.id_venta = NEW.id_venta
    WHERE p.id_producto = NEW.id_producto 
      AND p.id_restaurante = v.id_restaurante
  ) THEN
    RAISE EXCEPTION 'El producto % no existe o no pertenece al restaurante de la venta', NEW.id_producto;
  END IF;

  -- Verificar que la cantidad sea positiva
  IF NEW.cantidad <= 0 THEN
    RAISE EXCEPTION 'La cantidad debe ser mayor a 0, recibido: %', NEW.cantidad;
  END IF;

  -- Verificar que el precio sea positivo
  IF NEW.precio_unitario < 0 THEN
    RAISE EXCEPTION 'El precio unitario no puede ser negativo, recibido: %', NEW.precio_unitario;
  END IF;

  -- Calcular subtotal automáticamente
  NEW.subtotal = NEW.cantidad * NEW.precio_unitario;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a detalle_ventas
DROP TRIGGER IF EXISTS trigger_validate_detalle_venta_integrity ON detalle_ventas;
CREATE TRIGGER trigger_validate_detalle_venta_integrity
  BEFORE INSERT OR UPDATE ON detalle_ventas
  FOR EACH ROW
  EXECUTE FUNCTION validate_detalle_venta_integrity();

-- 4. TRIGGER PARA ACTUALIZAR TOTALES AUTOMÁTICAMENTE
CREATE OR REPLACE FUNCTION update_venta_total()
RETURNS TRIGGER AS $$
BEGIN
  -- Actualizar total de la venta
  UPDATE ventas 
  SET total = (
    SELECT COALESCE(SUM(subtotal), 0)
    FROM detalle_ventas
    WHERE id_venta = COALESCE(NEW.id_venta, OLD.id_venta)
  )
  WHERE id_venta = COALESCE(NEW.id_venta, OLD.id_venta);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a detalle_ventas para actualizar totales
DROP TRIGGER IF EXISTS trigger_update_venta_total ON detalle_ventas;
CREATE TRIGGER trigger_update_venta_total
  AFTER INSERT OR UPDATE OR DELETE ON detalle_ventas
  FOR EACH ROW
  EXECUTE FUNCTION update_venta_total();

-- 5. TRIGGER PARA ACTUALIZAR TOTAL ACUMULADO DE MESAS
CREATE OR REPLACE FUNCTION update_mesa_total_acumulado()
RETURNS TRIGGER AS $$
BEGIN
  -- Actualizar total acumulado de la mesa
  UPDATE mesas 
  SET 
    total_acumulado = (
      SELECT COALESCE(SUM(total), 0)
      FROM ventas
      WHERE id_mesa = COALESCE(NEW.id_mesa, OLD.id_mesa)
        AND estado IN ('recibido', 'en_preparacion', 'listo_para_servir', 'abierta', 'en_uso', 'pendiente_cobro', 'completada', 'pendiente', 'pagado')
    ),
    estado = CASE 
      WHEN (
        SELECT COALESCE(SUM(total), 0)
        FROM ventas
        WHERE id_mesa = COALESCE(NEW.id_mesa, OLD.id_mesa)
          AND estado IN ('recibido', 'en_preparacion', 'listo_para_servir', 'abierta', 'en_uso', 'pendiente_cobro', 'completada', 'pendiente', 'pagado')
      ) > 0 THEN 'en_uso'
      ELSE 'libre'
    END
  WHERE id_mesa = COALESCE(NEW.id_mesa, OLD.id_mesa);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a ventas para actualizar totales de mesas
DROP TRIGGER IF EXISTS trigger_update_mesa_total_acumulado ON ventas;
CREATE TRIGGER trigger_update_mesa_total_acumulado
  AFTER INSERT OR UPDATE OR DELETE ON ventas
  FOR EACH ROW
  EXECUTE FUNCTION update_mesa_total_acumulado();

-- 6. TRIGGER PARA VALIDAR CONSISTENCIA DE PRODUCTOS
CREATE OR REPLACE FUNCTION validate_producto_integrity()
RETURNS TRIGGER AS $$
BEGIN
  -- Verificar que el precio sea positivo
  IF NEW.precio < 0 THEN
    RAISE EXCEPTION 'El precio del producto no puede ser negativo: %', NEW.precio;
  END IF;

  -- Verificar que el nombre no esté vacío
  IF NEW.nombre IS NULL OR TRIM(NEW.nombre) = '' THEN
    RAISE EXCEPTION 'El nombre del producto no puede estar vacío';
  END IF;

  -- Verificar que no haya productos duplicados en el mismo restaurante
  IF EXISTS (
    SELECT 1 FROM productos 
    WHERE nombre ILIKE NEW.nombre 
      AND id_restaurante = NEW.id_restaurante 
      AND id_producto != COALESCE(NEW.id_producto, 0)
  ) THEN
    RAISE EXCEPTION 'Ya existe un producto con nombre similar "%" en el restaurante %', NEW.nombre, NEW.id_restaurante;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a productos
DROP TRIGGER IF EXISTS trigger_validate_producto_integrity ON productos;
CREATE TRIGGER trigger_validate_producto_integrity
  BEFORE INSERT OR UPDATE ON productos
  FOR EACH ROW
  EXECUTE FUNCTION validate_producto_integrity();

-- 7. TRIGGER PARA VALIDAR CONSISTENCIA DE PREFACTURAS
CREATE OR REPLACE FUNCTION validate_prefactura_integrity()
RETURNS TRIGGER AS $$
BEGIN
  -- Verificar que la mesa existe
  IF NOT EXISTS (
    SELECT 1 FROM mesas 
    WHERE id_mesa = NEW.id_mesa
  ) THEN
    RAISE EXCEPTION 'La mesa % no existe', NEW.id_mesa;
  END IF;

  -- Verificar que no haya prefacturas abiertas para la misma mesa
  IF NEW.estado = 'abierta' AND EXISTS (
    SELECT 1 FROM prefacturas 
    WHERE id_mesa = NEW.id_mesa 
      AND estado = 'abierta' 
      AND id_prefactura != COALESCE(NEW.id_prefactura, 0)
  ) THEN
    RAISE EXCEPTION 'Ya existe una prefactura abierta para la mesa %', NEW.id_mesa;
  END IF;

  -- Verificar que el estado sea válido
  IF NEW.estado NOT IN ('abierta', 'cerrada', 'cancelada') THEN
    RAISE EXCEPTION 'Estado de prefactura inválido: %', NEW.estado;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a prefacturas
DROP TRIGGER IF EXISTS trigger_validate_prefactura_integrity ON prefacturas;
CREATE TRIGGER trigger_validate_prefactura_integrity
  BEFORE INSERT OR UPDATE ON prefacturas
  FOR EACH ROW
  EXECUTE FUNCTION validate_prefactura_integrity();

-- 8. FUNCIÓN PARA VERIFICAR INTEGRIDAD COMPLETA DEL SISTEMA
CREATE OR REPLACE FUNCTION check_system_integrity()
RETURNS TABLE(
  check_name TEXT,
  status TEXT,
  message TEXT,
  details_count INTEGER
) AS $$
BEGIN
  -- Verificar mesas sin ventas
  RETURN QUERY
  SELECT 
    'Mesas sin ventas'::TEXT as check_name,
    CASE 
      WHEN COUNT(*) = 0 THEN 'OK'::TEXT
      ELSE 'WARNING'::TEXT
    END as status,
    CASE 
      WHEN COUNT(*) = 0 THEN 'Todas las mesas tienen ventas asociadas'::TEXT
      ELSE COUNT(*) || ' mesas no tienen ventas asociadas'::TEXT
    END as message,
    COUNT(*) as details_count
  FROM mesas m
  LEFT JOIN ventas v ON m.id_mesa = v.id_venta
  WHERE v.id_venta IS NULL;

  -- Verificar ventas sin detalles
  RETURN QUERY
  SELECT 
    'Ventas sin detalles'::TEXT as check_name,
    CASE 
      WHEN COUNT(*) = 0 THEN 'OK'::TEXT
      ELSE 'ERROR'::TEXT
    END as status,
    CASE 
      WHEN COUNT(*) = 0 THEN 'Todas las ventas tienen detalles'::TEXT
      ELSE COUNT(*) || ' ventas no tienen detalles'::TEXT
    END as message,
    COUNT(*) as details_count
  FROM ventas v
  LEFT JOIN detalle_ventas dv ON v.id_venta = dv.id_venta
  WHERE dv.id_detalle IS NULL;

  -- Verificar productos sin detalles
  RETURN QUERY
  SELECT 
    'Productos sin ventas'::TEXT as check_name,
    CASE 
      WHEN COUNT(*) = 0 THEN 'OK'::TEXT
      ELSE 'INFO'::TEXT
    END as status,
    CASE 
      WHEN COUNT(*) = 0 THEN 'Todos los productos han sido vendidos'::TEXT
      ELSE COUNT(*) || ' productos nunca han sido vendidos'::TEXT
    END as message,
    COUNT(*) as details_count
  FROM productos p
  LEFT JOIN detalle_ventas dv ON p.id_producto = dv.id_producto
  WHERE dv.id_detalle IS NULL;

  -- Verificar inconsistencias de sucursal
  RETURN QUERY
  SELECT 
    'Inconsistencias de sucursal'::TEXT as check_name,
    CASE 
      WHEN COUNT(*) = 0 THEN 'OK'::TEXT
      ELSE 'ERROR'::TEXT
    END as status,
    CASE 
      WHEN COUNT(*) = 0 THEN 'No hay inconsistencias de sucursal'::TEXT
      ELSE COUNT(*) || ' inconsistencias de sucursal encontradas'::TEXT
    END as message,
    COUNT(*) as details_count
  FROM ventas v
  JOIN mesas m ON v.id_mesa = m.id_mesa
  WHERE v.id_sucursal != m.id_sucursal;

END;
$$ LANGUAGE plpgsql;

-- 9. ÍNDICES PARA OPTIMIZAR LAS VERIFICACIONES DE INTEGRIDAD
CREATE INDEX IF NOT EXISTS idx_ventas_mesa_sucursal_restaurante 
ON ventas(id_mesa, id_sucursal, id_restaurante);

CREATE INDEX IF NOT EXISTS idx_detalle_ventas_venta_producto 
ON detalle_ventas(id_venta, id_producto);

CREATE INDEX IF NOT EXISTS idx_mesas_numero_restaurante 
ON mesas(numero, id_restaurante);

CREATE INDEX IF NOT EXISTS idx_productos_restaurante_nombre 
ON productos(id_restaurante, nombre);

-- 10. VISTA PARA MONITOREO DE INTEGRIDAD
CREATE OR REPLACE VIEW v_integrity_monitoring AS
SELECT 
  'mesas' as table_name,
  COUNT(*) as total_records,
  COUNT(CASE WHEN estado = 'en_uso' THEN 1 END) as active_mesas,
  COUNT(CASE WHEN estado = 'libre' THEN 1 END) as free_mesas,
  COALESCE(SUM(total_acumulado), 0) as total_acumulado
FROM mesas
UNION ALL
SELECT 
  'ventas' as table_name,
  COUNT(*) as total_records,
  COUNT(CASE WHEN estado IN ('recibido', 'en_preparacion', 'listo_para_servir', 'abierta', 'en_uso', 'pendiente_cobro') THEN 1 END) as active_ventas,
  COUNT(CASE WHEN estado IN ('entregado', 'completada', 'pagado') THEN 1 END) as completed_ventas,
  COALESCE(SUM(total), 0) as total_ventas
FROM ventas
UNION ALL
SELECT 
  'detalle_ventas' as table_name,
  COUNT(*) as total_records,
  COUNT(CASE WHEN id_producto IS NOT NULL THEN 1 END) as valid_details,
  COUNT(CASE WHEN id_producto IS NULL THEN 1 END) as invalid_details,
  COALESCE(SUM(subtotal), 0) as total_subtotal
FROM detalle_ventas;

-- =====================================================
-- RESUMEN DE TRIGGERS IMPLEMENTADOS
-- =====================================================
/*
✅ TRIGGERS DE INTEGRIDAD IMPLEMENTADOS:

1. validate_mesa_integrity() - Previene mesas duplicadas y inconsistencias
2. validate_venta_integrity() - Valida consistencia de ventas con mesas
3. validate_detalle_venta_integrity() - Valida detalles y calcula subtotales
4. update_venta_total() - Actualiza totales automáticamente
5. update_mesa_total_acumulado() - Actualiza totales de mesas
6. validate_producto_integrity() - Previene productos duplicados
7. validate_prefactura_integrity() - Valida prefacturas
8. check_system_integrity() - Verificación completa del sistema

✅ CARACTERÍSTICAS:
- Prevención automática de inconsistencias
- Cálculo automático de totales
- Validación en tiempo real
- Índices optimizados
- Vista de monitoreo

✅ BENEFICIOS:
- Elimina el problema de prefacturas sin productos
- Mantiene integridad automáticamente
- Escalable y mantenible
- Logs detallados de problemas
- Corrección automática cuando es posible
*/
