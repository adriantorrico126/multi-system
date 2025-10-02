-- ========================================
-- SCRIPT DE ROLLBACK
-- Generado automáticamente
-- ========================================

BEGIN;

-- ELIMINAR FUNCIONES
DROP FUNCTION IF EXISTS public.actualizar_stock_sucursal;
DROP FUNCTION IF EXISTS public.actualizar_stock_venta;
DROP FUNCTION IF EXISTS public.obtener_stock_por_sucursal;
DROP FUNCTION IF EXISTS public.obtener_stock_sucursal;

-- ELIMINAR ÍNDICES
DROP INDEX IF EXISTS public.idx_stock_sucursal_activo;
DROP INDEX IF EXISTS public.idx_stock_sucursal_composite;
DROP INDEX IF EXISTS public.idx_stock_sucursal_producto;
DROP INDEX IF EXISTS public.idx_stock_sucursal_sucursal;
DROP INDEX IF EXISTS public.stock_sucursal_pkey;
DROP INDEX IF EXISTS public.unique_stock_sucursal;

-- ELIMINAR RESTRICCIONES
ALTER TABLE public.inventario_lotes DROP CONSTRAINT IF EXISTS fk_lotes_sucursal;
ALTER TABLE public.movimientos_inventario DROP CONSTRAINT IF EXISTS fk_movimientos_sucursal;
ALTER TABLE public.stock_sucursal DROP CONSTRAINT IF EXISTS 2200_143587_1_not_null;
ALTER TABLE public.stock_sucursal DROP CONSTRAINT IF EXISTS 2200_143587_2_not_null;
ALTER TABLE public.stock_sucursal DROP CONSTRAINT IF EXISTS 2200_143587_3_not_null;
ALTER TABLE public.stock_sucursal DROP CONSTRAINT IF EXISTS check_stock_min_max;
ALTER TABLE public.stock_sucursal DROP CONSTRAINT IF EXISTS fk_stock_producto;
ALTER TABLE public.stock_sucursal DROP CONSTRAINT IF EXISTS fk_stock_sucursal;
ALTER TABLE public.stock_sucursal DROP CONSTRAINT IF EXISTS stock_sucursal_pkey;
ALTER TABLE public.stock_sucursal DROP CONSTRAINT IF EXISTS stock_sucursal_stock_actual_check;
ALTER TABLE public.stock_sucursal DROP CONSTRAINT IF EXISTS stock_sucursal_stock_maximo_check;
ALTER TABLE public.stock_sucursal DROP CONSTRAINT IF EXISTS stock_sucursal_stock_minimo_check;
ALTER TABLE public.stock_sucursal DROP CONSTRAINT IF EXISTS unique_stock_sucursal;

-- ELIMINAR COLUMNAS
ALTER TABLE public.inventario_lotes DROP COLUMN IF EXISTS id_sucursal;
ALTER TABLE public.movimientos_inventario DROP COLUMN IF EXISTS id_sucursal;
ALTER TABLE public.movimientos_inventario DROP COLUMN IF EXISTS observaciones;
ALTER TABLE public.stock_sucursal DROP COLUMN IF EXISTS id_stock_sucursal;
ALTER TABLE public.stock_sucursal DROP COLUMN IF EXISTS id_producto;
ALTER TABLE public.stock_sucursal DROP COLUMN IF EXISTS id_sucursal;
ALTER TABLE public.stock_sucursal DROP COLUMN IF EXISTS stock_actual;
ALTER TABLE public.stock_sucursal DROP COLUMN IF EXISTS stock_minimo;
ALTER TABLE public.stock_sucursal DROP COLUMN IF EXISTS stock_maximo;
ALTER TABLE public.stock_sucursal DROP COLUMN IF EXISTS activo;
ALTER TABLE public.stock_sucursal DROP COLUMN IF EXISTS created_at;
ALTER TABLE public.stock_sucursal DROP COLUMN IF EXISTS updated_at;
ALTER TABLE public.stock_sucursal DROP COLUMN IF EXISTS fecha_creacion;
ALTER TABLE public.stock_sucursal DROP COLUMN IF EXISTS fecha_actualizacion;

-- ELIMINAR TABLAS
DROP TABLE IF EXISTS public.stock_sucursal;

-- ELIMINAR SECUENCIAS
DROP SEQUENCE IF EXISTS public.stock_sucursal_id_stock_sucursal_seq;

COMMIT;

DO $$
BEGIN
    RAISE NOTICE 'Rollback completado exitosamente en: %', now();
END $$;