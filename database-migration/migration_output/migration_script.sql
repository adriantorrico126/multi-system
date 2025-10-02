-- ========================================
-- SCRIPT DE MIGRACIÓN DE ESQUEMA
-- Generado automáticamente
-- ========================================

-- IMPORTANTE: Este script contiene solo cambios estructurales
-- No afecta los datos existentes en la base de datos

BEGIN;

-- Verificaciones de seguridad
DO $$
BEGIN
    -- Verificar que estamos en el entorno correcto
    IF current_database() = 'defaultdb' THEN
        RAISE NOTICE 'Aplicando migración en base de datos de producción: %', current_database();
    ELSE
        RAISE WARNING 'Base de datos actual: %. Verificar que es el entorno correcto.', current_database();
    END IF;
END $$;

-- TIPOS PERSONALIZADOS
-- Tipo: stock_sucursal
-- Definición: stock_sucursal
-- [REQUIERE DEFINICIÓN MANUAL]

-- SECUENCIAS
CREATE SEQUENCE IF NOT EXISTS public.stock_sucursal_id_stock_sucursal_seq;

-- TABLAS
CREATE TABLE IF NOT EXISTS public.stock_sucursal ();
COMMENT ON TABLE public.stock_sucursal IS 'Tabla creada por migración automática';

-- COLUMNAS
-- Columnas para public.inventario_lotes
ALTER TABLE public.inventario_lotes ADD COLUMN IF NOT EXISTS id_sucursal integer;

-- Columnas para public.movimientos_inventario
ALTER TABLE public.movimientos_inventario ADD COLUMN IF NOT EXISTS id_sucursal integer;
ALTER TABLE public.movimientos_inventario ADD COLUMN IF NOT EXISTS observaciones text;

-- Columnas para public.stock_sucursal
ALTER TABLE public.stock_sucursal ADD COLUMN IF NOT EXISTS id_stock_sucursal integer DEFAULT nextval('stock_sucursal_id_stock_sucursal_seq'::regclass) NOT NULL;
ALTER TABLE public.stock_sucursal ADD COLUMN IF NOT EXISTS id_producto integer NOT NULL;
ALTER TABLE public.stock_sucursal ADD COLUMN IF NOT EXISTS id_sucursal integer NOT NULL;
ALTER TABLE public.stock_sucursal ADD COLUMN IF NOT EXISTS stock_actual integer DEFAULT 0;
ALTER TABLE public.stock_sucursal ADD COLUMN IF NOT EXISTS stock_minimo integer DEFAULT 5;
ALTER TABLE public.stock_sucursal ADD COLUMN IF NOT EXISTS stock_maximo integer DEFAULT 100;
ALTER TABLE public.stock_sucursal ADD COLUMN IF NOT EXISTS activo boolean DEFAULT true;
ALTER TABLE public.stock_sucursal ADD COLUMN IF NOT EXISTS created_at timestamp without time zone DEFAULT now();
ALTER TABLE public.stock_sucursal ADD COLUMN IF NOT EXISTS updated_at timestamp without time zone DEFAULT now();
ALTER TABLE public.stock_sucursal ADD COLUMN IF NOT EXISTS fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE public.stock_sucursal ADD COLUMN IF NOT EXISTS fecha_actualizacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP;

-- RESTRICCIONES
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'stock_sucursal_pkey' AND table_name = 'stock_sucursal' AND table_schema = 'public') THEN
        ALTER TABLE public.stock_sucursal ADD CONSTRAINT stock_sucursal_pkey PRIMARY KEY (id_stock_sucursal);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_lotes_sucursal' AND table_name = 'inventario_lotes' AND table_schema = 'public') THEN
        ALTER TABLE public.inventario_lotes ADD CONSTRAINT fk_lotes_sucursal FOREIGN KEY (id_sucursal) REFERENCES public.sucursales(id_sucursal);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_movimientos_sucursal' AND table_name = 'movimientos_inventario' AND table_schema = 'public') THEN
        ALTER TABLE public.movimientos_inventario ADD CONSTRAINT fk_movimientos_sucursal FOREIGN KEY (id_sucursal) REFERENCES public.sucursales(id_sucursal);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_stock_producto' AND table_name = 'stock_sucursal' AND table_schema = 'public') THEN
        ALTER TABLE public.stock_sucursal ADD CONSTRAINT fk_stock_producto FOREIGN KEY (id_producto) REFERENCES public.productos(id_producto);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_stock_sucursal' AND table_name = 'stock_sucursal' AND table_schema = 'public') THEN
        ALTER TABLE public.stock_sucursal ADD CONSTRAINT fk_stock_sucursal FOREIGN KEY (id_sucursal) REFERENCES public.sucursales(id_sucursal);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'unique_stock_sucursal' AND table_name = 'stock_sucursal' AND table_schema = 'public') THEN
        ALTER TABLE public.stock_sucursal ADD CONSTRAINT unique_stock_sucursal UNIQUE (id_producto);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_143587_1_not_null' AND table_name = 'stock_sucursal' AND table_schema = 'public') THEN
        ALTER TABLE public.stock_sucursal ADD CONSTRAINT "2200_143587_1_not_null" CHECK (id_stock_sucursal IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_143587_2_not_null' AND table_name = 'stock_sucursal' AND table_schema = 'public') THEN
        ALTER TABLE public.stock_sucursal ADD CONSTRAINT "2200_143587_2_not_null" CHECK (id_producto IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_143587_3_not_null' AND table_name = 'stock_sucursal' AND table_schema = 'public') THEN
        ALTER TABLE public.stock_sucursal ADD CONSTRAINT "2200_143587_3_not_null" CHECK (id_sucursal IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'check_stock_min_max' AND table_name = 'stock_sucursal' AND table_schema = 'public') THEN
        ALTER TABLE public.stock_sucursal ADD CONSTRAINT check_stock_min_max CHECK ((stock_minimo <= stock_maximo));
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'stock_sucursal_stock_actual_check' AND table_name = 'stock_sucursal' AND table_schema = 'public') THEN
        ALTER TABLE public.stock_sucursal ADD CONSTRAINT stock_sucursal_stock_actual_check CHECK ((stock_actual >= 0));
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'stock_sucursal_stock_maximo_check' AND table_name = 'stock_sucursal' AND table_schema = 'public') THEN
        ALTER TABLE public.stock_sucursal ADD CONSTRAINT stock_sucursal_stock_maximo_check CHECK ((stock_maximo >= 0));
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'stock_sucursal_stock_minimo_check' AND table_name = 'stock_sucursal' AND table_schema = 'public') THEN
        ALTER TABLE public.stock_sucursal ADD CONSTRAINT stock_sucursal_stock_minimo_check CHECK ((stock_minimo >= 0));
    END IF;
END $$;

-- ÍNDICES
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_stock_sucursal_activo' AND schemaname = 'public') THEN
        CREATE INDEX idx_stock_sucursal_activo ON public.stock_sucursal USING btree (activo);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_stock_sucursal_composite' AND schemaname = 'public') THEN
        CREATE INDEX idx_stock_sucursal_composite ON public.stock_sucursal USING btree (id_sucursal, id_producto, activo);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_stock_sucursal_producto' AND schemaname = 'public') THEN
        CREATE INDEX idx_stock_sucursal_producto ON public.stock_sucursal USING btree (id_producto);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_stock_sucursal_sucursal' AND schemaname = 'public') THEN
        CREATE INDEX idx_stock_sucursal_sucursal ON public.stock_sucursal USING btree (id_sucursal);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'stock_sucursal_pkey' AND schemaname = 'public') THEN
        CREATE UNIQUE INDEX stock_sucursal_pkey ON public.stock_sucursal USING btree (id_stock_sucursal);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'unique_stock_sucursal' AND schemaname = 'public') THEN
        CREATE UNIQUE INDEX unique_stock_sucursal ON public.stock_sucursal USING btree (id_producto, id_sucursal);
    END IF;
END $$;

-- FUNCIONES
-- Función: actualizar_stock_sucursal
CREATE OR REPLACE FUNCTION public.actualizar_stock_sucursal(p_id_producto integer, p_id_sucursal integer, p_cantidad_cambio integer, p_tipo_movimiento character varying, p_id_vendedor integer DEFAULT NULL::integer, p_motivo text DEFAULT NULL::text)
 RETURNS json
 LANGUAGE plpgsql
AS $function$
      DECLARE
        stock_anterior INTEGER;
        stock_nuevo INTEGER;
        movimiento_id INTEGER;
        resultado JSON;
      BEGIN
        -- Obtener stock actual
        SELECT ss.stock_actual INTO stock_anterior
        FROM stock_sucursal ss
        WHERE ss.id_producto = p_id_producto 
          AND ss.id_sucursal = p_id_sucursal 
          AND ss.activo = true;
        
        -- Si no existe registro, crear uno
        IF stock_anterior IS NULL THEN
          INSERT INTO stock_sucursal (id_producto, id_sucursal, stock_actual, stock_minimo, stock_maximo)
          VALUES (p_id_producto, p_id_sucursal, 0, 5, 100)
          ON CONFLICT (id_producto, id_sucursal) DO NOTHING;
          
          stock_anterior := 0;
        END IF;
        
        -- Calcular nuevo stock
        stock_nuevo := GREATEST(0, stock_anterior + p_cantidad_cambio);
        
        -- Actualizar stock
        UPDATE stock_sucursal
        SET stock_actual = stock_nuevo,
            updated_at = NOW()
        WHERE id_producto = p_id_producto 
          AND id_sucursal = p_id_sucursal;
        
        -- Registrar movimiento
        INSERT INTO movimientos_inventario (
          id_producto, 
          id_sucursal,
          tipo_movimiento, 
          cantidad, 
          stock_anterior, 
          stock_actual, 
          id_vendedor, 
          id_restaurante,
          motivo
        )
        SELECT 
          p_id_producto,
          p_id_sucursal,
          p_tipo_movimiento,
          ABS(p_cantidad_cambio),
          stock_anterior,
          stock_nuevo,
          p_id_vendedor,
          s.id_restaurante,
          p_motivo
        FROM sucursales s
        WHERE s.id_sucursal = p_id_sucursal
        RETURNING id_movimiento INTO movimiento_id;
        
        -- Retornar resultado
        resultado := json_build_object(
          'success', true,
          'id_movimiento', movimiento_id,
          'stock_anterior', stock_anterior,
          'stock_nuevo', stock_nuevo,
          'cantidad_cambio', p_cantidad_cambio
        );
        
        RETURN resultado;
      END;
      $function$
;

-- Función: actualizar_stock_venta
CREATE OR REPLACE FUNCTION public.actualizar_stock_venta(p_id_producto integer, p_id_sucursal integer, p_cantidad integer, p_id_vendedor integer DEFAULT NULL::integer)
 RETURNS json
 LANGUAGE plpgsql
AS $function$
      DECLARE
        stock_actual_sucursal INTEGER;
        stock_nuevo INTEGER;
        resultado JSON;
        movimiento_id INTEGER;
      BEGIN
        -- Obtener stock actual en la sucursal
        SELECT ss.stock_actual INTO stock_actual_sucursal
        FROM stock_sucursal ss
        WHERE ss.id_producto = p_id_producto 
          AND ss.id_sucursal = p_id_sucursal 
          AND ss.activo = true;
        
        -- Verificar si hay stock suficiente
        IF stock_actual_sucursal IS NULL OR stock_actual_sucursal < p_cantidad THEN
          RETURN json_build_object(
            'success', false,
            'error', 'Stock insuficiente en la sucursal',
            'stock_disponible', COALESCE(stock_actual_sucursal, 0),
            'cantidad_solicitada', p_cantidad
          );
        END IF;
        
        -- Calcular nuevo stock
        stock_nuevo := stock_actual_sucursal - p_cantidad;
        
        -- Actualizar stock en la sucursal
        UPDATE stock_sucursal
        SET stock_actual = stock_nuevo,
            updated_at = NOW()
        WHERE id_producto = p_id_producto 
          AND id_sucursal = p_id_sucursal;
        
        -- Registrar movimiento
        INSERT INTO movimientos_inventario (
          id_producto,
          id_sucursal,
          tipo_movimiento,
          cantidad,
          stock_anterior,
          stock_actual,
          id_vendedor,
          id_restaurante,
          motivo
        )
        SELECT 
          p_id_producto,
          p_id_sucursal,
          'venta',
          p_cantidad,
          stock_actual_sucursal,
          stock_nuevo,
          p_id_vendedor,
          s.id_restaurante,
          'Venta realizada en sucursal'
        FROM sucursales s
        WHERE s.id_sucursal = p_id_sucursal
        RETURNING id_movimiento INTO movimiento_id;
        
        -- Actualizar stock global del producto
        UPDATE productos 
        SET stock_actual = (
          SELECT COALESCE(SUM(ss.stock_actual), 0)
          FROM stock_sucursal ss
          JOIN sucursales s ON ss.id_sucursal = s.id_sucursal
          WHERE ss.id_producto = p_id_producto
            AND s.id_restaurante = (SELECT id_restaurante FROM sucursales WHERE id_sucursal = p_id_sucursal)
            AND ss.activo = true
        )
        WHERE id_producto = p_id_producto;
        
        -- Retornar resultado
        resultado := json_build_object(
          'success', true,
          'id_movimiento', movimiento_id,
          'stock_anterior', stock_actual_sucursal,
          'stock_nuevo', stock_nuevo,
          'cantidad_vendida', p_cantidad
        );
        
        RETURN resultado;
      END;
      $function$
;

-- Función: obtener_stock_por_sucursal
CREATE OR REPLACE FUNCTION public.obtener_stock_por_sucursal(p_id_restaurante integer DEFAULT NULL::integer, p_id_sucursal integer DEFAULT NULL::integer)
 RETURNS TABLE(id_producto integer, nombre_producto character varying, id_sucursal integer, nombre_sucursal character varying, stock_actual integer, stock_minimo integer, stock_maximo integer, estado_stock character varying)
 LANGUAGE plpgsql
AS $function$
      BEGIN
        RETURN QUERY
        SELECT 
          p.id_producto,
          p.nombre::VARCHAR as nombre_producto,
          ss.id_sucursal,
          s.nombre::VARCHAR as nombre_sucursal,
          ss.stock_actual,
          ss.stock_minimo,
          ss.stock_maximo,
          CASE 
            WHEN ss.stock_actual = 0 THEN 'agotado'
            WHEN ss.stock_actual <= ss.stock_minimo THEN 'bajo'
            WHEN ss.stock_actual >= ss.stock_maximo THEN 'alto'
            ELSE 'normal'
          END::VARCHAR as estado_stock
        FROM stock_sucursal ss
        JOIN productos p ON ss.id_producto = p.id_producto
        JOIN sucursales s ON ss.id_sucursal = s.id_sucursal
        WHERE ss.activo = true
          AND p.activo = true
          AND s.activo = true
          AND (p_id_restaurante IS NULL OR s.id_restaurante = p_id_restaurante)
          AND (p_id_sucursal IS NULL OR ss.id_sucursal = p_id_sucursal)
        ORDER BY s.nombre, p.nombre;
      END;
      $function$
;

-- Función: obtener_stock_sucursal
CREATE OR REPLACE FUNCTION public.obtener_stock_sucursal(p_id_producto integer, p_id_sucursal integer)
 RETURNS integer
 LANGUAGE plpgsql
AS $function$
      DECLARE
        stock_actual INTEGER;
      BEGIN
        SELECT ss.stock_actual INTO stock_actual
        FROM stock_sucursal ss
        WHERE ss.id_producto = p_id_producto 
          AND ss.id_sucursal = p_id_sucursal 
          AND ss.activo = true;
        
        RETURN COALESCE(stock_actual, 0);
      END;
      $function$
;


-- ========================================
-- FIN DE LA MIGRACIÓN
-- ========================================

COMMIT;

-- Verificar que la migración fue exitosa
DO $$
BEGIN
    RAISE NOTICE 'Migración completada exitosamente en: %', now();
END $$;