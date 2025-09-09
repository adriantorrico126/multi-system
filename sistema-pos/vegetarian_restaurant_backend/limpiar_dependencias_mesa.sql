-- Script para limpiar dependencias de una mesa antes de eliminarla
-- Uso: SELECT limpiar_dependencias_mesa(id_mesa_a_eliminar);

CREATE OR REPLACE FUNCTION limpiar_dependencias_mesa(id_mesa_param INTEGER)
RETURNS TABLE(
  tabla_afectada TEXT,
  registros_eliminados INTEGER,
  mensaje TEXT
) AS $$
DECLARE
  contador INTEGER;
BEGIN
  -- Limpiar prefacturas relacionadas
  DELETE FROM prefacturas WHERE id_mesa = id_mesa_param;
  GET DIAGNOSTICS contador = ROW_COUNT;
  RETURN QUERY SELECT 'prefacturas'::TEXT, contador, 
    CASE WHEN contador > 0 THEN 'Prefacturas eliminadas' ELSE 'No había prefacturas' END;
  
  -- Limpiar reservas relacionadas
  DELETE FROM reservas WHERE id_mesa = id_mesa_param;
  GET DIAGNOSTICS contador = ROW_COUNT;
  RETURN QUERY SELECT 'reservas'::TEXT, contador,
    CASE WHEN contador > 0 THEN 'Reservas eliminadas' ELSE 'No había reservas' END;
  
  -- Remover mesa de grupos
  DELETE FROM mesas_en_grupo WHERE id_mesa = id_mesa_param;
  GET DIAGNOSTICS contador = ROW_COUNT;
  RETURN QUERY SELECT 'mesas_en_grupo'::TEXT, contador,
    CASE WHEN contador > 0 THEN 'Mesa removida de grupos' ELSE 'No estaba en grupos' END;
  
  -- Actualizar ventas para remover referencia a mesa (no eliminar ventas)
  UPDATE ventas SET id_mesa = NULL, mesa_numero = NULL WHERE id_mesa = id_mesa_param;
  GET DIAGNOSTICS contador = ROW_COUNT;
  RETURN QUERY SELECT 'ventas'::TEXT, contador,
    CASE WHEN contador > 0 THEN 'Referencias de mesa removidas de ventas' ELSE 'No había ventas asociadas' END;
  
  -- Actualizar grupos_mesas para remover referencia a mesa
  UPDATE grupos_mesas SET id_venta_principal = NULL WHERE id_venta_principal IN (
    SELECT id_venta FROM ventas WHERE id_mesa = id_mesa_param
  );
  GET DIAGNOSTICS contador = ROW_COUNT;
  RETURN QUERY SELECT 'grupos_mesas'::TEXT, contador,
    CASE WHEN contador > 0 THEN 'Referencias actualizadas en grupos' ELSE 'No había grupos afectados' END;
    
END;
$$ LANGUAGE plpgsql;

-- Función para eliminar mesa con limpieza automática
CREATE OR REPLACE FUNCTION eliminar_mesa_con_limpieza(
  id_mesa_param INTEGER,
  id_restaurante_param INTEGER,
  forzar_eliminacion BOOLEAN DEFAULT FALSE
)
RETURNS TABLE(
  exito BOOLEAN,
  mensaje TEXT,
  detalles TEXT
) AS $$
DECLARE
  mesa_existe BOOLEAN;
  mesa_estado TEXT;
  resultado TEXT := '';
  detalle TEXT := '';
BEGIN
  -- Verificar que la mesa existe
  SELECT EXISTS(SELECT 1 FROM mesas WHERE id_mesa = id_mesa_param AND id_restaurante = id_restaurante_param) INTO mesa_existe;
  
  IF NOT mesa_existe THEN
    RETURN QUERY SELECT FALSE, 'Mesa no encontrada', 'La mesa especificada no existe o no pertenece al restaurante';
  END IF;
  
  -- Obtener estado de la mesa
  SELECT estado INTO mesa_estado FROM mesas WHERE id_mesa = id_mesa_param AND id_restaurante = id_restaurante_param;
  
  -- Si no se fuerza la eliminación, verificar estado
  IF NOT forzar_eliminacion AND mesa_estado != 'libre' THEN
    RETURN QUERY SELECT FALSE, 'Mesa en uso', 'La mesa está en uso. Use forzar_eliminacion = TRUE para eliminar de todos modos';
  END IF;
  
  -- Limpiar dependencias
  SELECT string_agg(tabla_afectada || ': ' || registros_eliminados || ' registros', ', ')
  INTO detalle
  FROM limpiar_dependencias_mesa(id_mesa_param);
  
  -- Eliminar la mesa
  DELETE FROM mesas WHERE id_mesa = id_mesa_param AND id_restaurante = id_restaurante_param;
  
  IF FOUND THEN
    resultado := 'Mesa eliminada exitosamente';
    RETURN QUERY SELECT TRUE, resultado, detalle;
  ELSE
    RETURN QUERY SELECT FALSE, 'Error al eliminar mesa', 'No se pudo eliminar la mesa después de limpiar dependencias';
  END IF;
  
END;
$$ LANGUAGE plpgsql;

-- Ejemplo de uso:
-- SELECT * FROM eliminar_mesa_con_limpieza(38, 1, TRUE);
-- SELECT * FROM limpiar_dependencias_mesa(38);
