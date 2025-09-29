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
-- Tipo: contadores_uso
-- Definición: contadores_uso
-- [REQUIERE DEFINICIÓN MANUAL]

-- SECUENCIAS
CREATE SEQUENCE IF NOT EXISTS public.contadores_uso_id_contador_seq;

-- TABLAS
CREATE TABLE IF NOT EXISTS public.contadores_uso ();
COMMENT ON TABLE public.contadores_uso IS 'Tabla creada por migración automática';

-- COLUMNAS
-- Columnas para public.alertas_limites
ALTER TABLE public.alertas_limites ADD COLUMN IF NOT EXISTS nivel_urgencia character varying(20) DEFAULT 'medio'::character varying;

-- Columnas para public.contadores_uso
ALTER TABLE public.contadores_uso ADD COLUMN IF NOT EXISTS id_contador integer DEFAULT nextval('contadores_uso_id_contador_seq'::regclass) NOT NULL;
ALTER TABLE public.contadores_uso ADD COLUMN IF NOT EXISTS id_restaurante integer NOT NULL;
ALTER TABLE public.contadores_uso ADD COLUMN IF NOT EXISTS id_plan integer NOT NULL;
ALTER TABLE public.contadores_uso ADD COLUMN IF NOT EXISTS recurso character varying(50) NOT NULL;
ALTER TABLE public.contadores_uso ADD COLUMN IF NOT EXISTS uso_actual integer DEFAULT 0;
ALTER TABLE public.contadores_uso ADD COLUMN IF NOT EXISTS limite_plan integer NOT NULL;
ALTER TABLE public.contadores_uso ADD COLUMN IF NOT EXISTS fecha_medicion date DEFAULT CURRENT_DATE;
ALTER TABLE public.contadores_uso ADD COLUMN IF NOT EXISTS created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE public.contadores_uso ADD COLUMN IF NOT EXISTS updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP;

-- Columnas para public.planes
ALTER TABLE public.planes ADD COLUMN IF NOT EXISTS incluye_pos boolean DEFAULT false;
ALTER TABLE public.planes ADD COLUMN IF NOT EXISTS incluye_inventario_basico boolean DEFAULT false;
ALTER TABLE public.planes ADD COLUMN IF NOT EXISTS incluye_inventario_avanzado boolean DEFAULT false;
ALTER TABLE public.planes ADD COLUMN IF NOT EXISTS incluye_promociones boolean DEFAULT false;
ALTER TABLE public.planes ADD COLUMN IF NOT EXISTS incluye_reservas boolean DEFAULT false;
ALTER TABLE public.planes ADD COLUMN IF NOT EXISTS incluye_arqueo_caja boolean DEFAULT false;
ALTER TABLE public.planes ADD COLUMN IF NOT EXISTS incluye_egresos boolean DEFAULT false;
ALTER TABLE public.planes ADD COLUMN IF NOT EXISTS incluye_egresos_avanzados boolean DEFAULT false;
ALTER TABLE public.planes ADD COLUMN IF NOT EXISTS incluye_reportes_avanzados boolean DEFAULT false;
ALTER TABLE public.planes ADD COLUMN IF NOT EXISTS incluye_analytics boolean DEFAULT false;
ALTER TABLE public.planes ADD COLUMN IF NOT EXISTS incluye_delivery boolean DEFAULT false;
ALTER TABLE public.planes ADD COLUMN IF NOT EXISTS incluye_impresion boolean DEFAULT false;
ALTER TABLE public.planes ADD COLUMN IF NOT EXISTS incluye_soporte_24h boolean DEFAULT false;
ALTER TABLE public.planes ADD COLUMN IF NOT EXISTS incluye_api boolean DEFAULT false;
ALTER TABLE public.planes ADD COLUMN IF NOT EXISTS incluye_white_label boolean DEFAULT false;

-- RESTRICCIONES
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'contadores_uso_pkey' AND table_name = 'contadores_uso' AND table_schema = 'public') THEN
        ALTER TABLE public.contadores_uso ADD CONSTRAINT contadores_uso_pkey PRIMARY KEY (id_contador);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'contadores_uso_id_plan_fkey' AND table_name = 'contadores_uso' AND table_schema = 'public') THEN
        ALTER TABLE public.contadores_uso ADD CONSTRAINT contadores_uso_id_plan_fkey FOREIGN KEY (id_plan) REFERENCES public.planes(id_plan);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'contadores_uso_id_restaurante_recurso_fecha_medicion_key' AND table_name = 'contadores_uso' AND table_schema = 'public') THEN
        ALTER TABLE public.contadores_uso ADD CONSTRAINT contadores_uso_id_restaurante_recurso_fecha_medicion_key UNIQUE (recurso);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_90989_1_not_null' AND table_name = 'admin_users' AND table_schema = 'public') THEN
        ALTER TABLE public.admin_users ADD CONSTRAINT "2200_90989_1_not_null" CHECK (id IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_90989_2_not_null' AND table_name = 'admin_users' AND table_schema = 'public') THEN
        ALTER TABLE public.admin_users ADD CONSTRAINT "2200_90989_2_not_null" CHECK (username IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_90989_3_not_null' AND table_name = 'admin_users' AND table_schema = 'public') THEN
        ALTER TABLE public.admin_users ADD CONSTRAINT "2200_90989_3_not_null" CHECK (password_hash IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_90989_4_not_null' AND table_name = 'admin_users' AND table_schema = 'public') THEN
        ALTER TABLE public.admin_users ADD CONSTRAINT "2200_90989_4_not_null" CHECK (nombre IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_99682_10_not_null' AND table_name = 'alertas_inventario' AND table_schema = 'public') THEN
        ALTER TABLE public.alertas_inventario ADD CONSTRAINT "2200_99682_10_not_null" CHECK (id_restaurante IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_99682_1_not_null' AND table_name = 'alertas_inventario' AND table_schema = 'public') THEN
        ALTER TABLE public.alertas_inventario ADD CONSTRAINT "2200_99682_1_not_null" CHECK (id_alerta IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_99682_2_not_null' AND table_name = 'alertas_inventario' AND table_schema = 'public') THEN
        ALTER TABLE public.alertas_inventario ADD CONSTRAINT "2200_99682_2_not_null" CHECK (id_producto IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_99682_4_not_null' AND table_name = 'alertas_inventario' AND table_schema = 'public') THEN
        ALTER TABLE public.alertas_inventario ADD CONSTRAINT "2200_99682_4_not_null" CHECK (tipo_alerta IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_99682_5_not_null' AND table_name = 'alertas_inventario' AND table_schema = 'public') THEN
        ALTER TABLE public.alertas_inventario ADD CONSTRAINT "2200_99682_5_not_null" CHECK (mensaje IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_99682_6_not_null' AND table_name = 'alertas_inventario' AND table_schema = 'public') THEN
        ALTER TABLE public.alertas_inventario ADD CONSTRAINT "2200_99682_6_not_null" CHECK (nivel_urgencia IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_119180_1_not_null' AND table_name = 'alertas_limites' AND table_schema = 'public') THEN
        ALTER TABLE public.alertas_limites ADD CONSTRAINT "2200_119180_1_not_null" CHECK (id_alerta IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_119180_2_not_null' AND table_name = 'alertas_limites' AND table_schema = 'public') THEN
        ALTER TABLE public.alertas_limites ADD CONSTRAINT "2200_119180_2_not_null" CHECK (id_restaurante IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_119180_3_not_null' AND table_name = 'alertas_limites' AND table_schema = 'public') THEN
        ALTER TABLE public.alertas_limites ADD CONSTRAINT "2200_119180_3_not_null" CHECK (id_plan IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_119180_4_not_null' AND table_name = 'alertas_limites' AND table_schema = 'public') THEN
        ALTER TABLE public.alertas_limites ADD CONSTRAINT "2200_119180_4_not_null" CHECK (tipo_alerta IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_119180_5_not_null' AND table_name = 'alertas_limites' AND table_schema = 'public') THEN
        ALTER TABLE public.alertas_limites ADD CONSTRAINT "2200_119180_5_not_null" CHECK (recurso IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_119180_6_not_null' AND table_name = 'alertas_limites' AND table_schema = 'public') THEN
        ALTER TABLE public.alertas_limites ADD CONSTRAINT "2200_119180_6_not_null" CHECK (valor_actual IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_119180_7_not_null' AND table_name = 'alertas_limites' AND table_schema = 'public') THEN
        ALTER TABLE public.alertas_limites ADD CONSTRAINT "2200_119180_7_not_null" CHECK (valor_limite IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_119180_8_not_null' AND table_name = 'alertas_limites' AND table_schema = 'public') THEN
        ALTER TABLE public.alertas_limites ADD CONSTRAINT "2200_119180_8_not_null" CHECK (porcentaje_uso IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_100181_1_not_null' AND table_name = 'archivos_egresos' AND table_schema = 'public') THEN
        ALTER TABLE public.archivos_egresos ADD CONSTRAINT "2200_100181_1_not_null" CHECK (id_archivo IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_100181_2_not_null' AND table_name = 'archivos_egresos' AND table_schema = 'public') THEN
        ALTER TABLE public.archivos_egresos ADD CONSTRAINT "2200_100181_2_not_null" CHECK (id_egreso IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_100181_3_not_null' AND table_name = 'archivos_egresos' AND table_schema = 'public') THEN
        ALTER TABLE public.archivos_egresos ADD CONSTRAINT "2200_100181_3_not_null" CHECK (nombre_archivo IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_100181_4_not_null' AND table_name = 'archivos_egresos' AND table_schema = 'public') THEN
        ALTER TABLE public.archivos_egresos ADD CONSTRAINT "2200_100181_4_not_null" CHECK (ruta_archivo IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_100181_7_not_null' AND table_name = 'archivos_egresos' AND table_schema = 'public') THEN
        ALTER TABLE public.archivos_egresos ADD CONSTRAINT "2200_100181_7_not_null" CHECK (subido_por IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_99638_10_not_null' AND table_name = 'arqueos_caja' AND table_schema = 'public') THEN
        ALTER TABLE public.arqueos_caja ADD CONSTRAINT "2200_99638_10_not_null" CHECK (estado IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_99638_1_not_null' AND table_name = 'arqueos_caja' AND table_schema = 'public') THEN
        ALTER TABLE public.arqueos_caja ADD CONSTRAINT "2200_99638_1_not_null" CHECK (id_arqueo IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_99638_2_not_null' AND table_name = 'arqueos_caja' AND table_schema = 'public') THEN
        ALTER TABLE public.arqueos_caja ADD CONSTRAINT "2200_99638_2_not_null" CHECK (id_restaurante IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_99638_5_not_null' AND table_name = 'arqueos_caja' AND table_schema = 'public') THEN
        ALTER TABLE public.arqueos_caja ADD CONSTRAINT "2200_99638_5_not_null" CHECK (monto_inicial IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_99638_6_not_null' AND table_name = 'arqueos_caja' AND table_schema = 'public') THEN
        ALTER TABLE public.arqueos_caja ADD CONSTRAINT "2200_99638_6_not_null" CHECK (fecha_apertura IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_90947_1_not_null' AND table_name = 'auditoria_admin' AND table_schema = 'public') THEN
        ALTER TABLE public.auditoria_admin ADD CONSTRAINT "2200_90947_1_not_null" CHECK (id_auditoria IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_119147_1_not_null' AND table_name = 'auditoria_planes' AND table_schema = 'public') THEN
        ALTER TABLE public.auditoria_planes ADD CONSTRAINT "2200_119147_1_not_null" CHECK (id_auditoria IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_119147_2_not_null' AND table_name = 'auditoria_planes' AND table_schema = 'public') THEN
        ALTER TABLE public.auditoria_planes ADD CONSTRAINT "2200_119147_2_not_null" CHECK (id_restaurante IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_119147_4_not_null' AND table_name = 'auditoria_planes' AND table_schema = 'public') THEN
        ALTER TABLE public.auditoria_planes ADD CONSTRAINT "2200_119147_4_not_null" CHECK (id_plan_nuevo IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_119147_5_not_null' AND table_name = 'auditoria_planes' AND table_schema = 'public') THEN
        ALTER TABLE public.auditoria_planes ADD CONSTRAINT "2200_119147_5_not_null" CHECK (tipo_cambio IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_99591_1_not_null' AND table_name = 'auditoria_pos' AND table_schema = 'public') THEN
        ALTER TABLE public.auditoria_pos ADD CONSTRAINT "2200_99591_1_not_null" CHECK (id_auditoria IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_99591_3_not_null' AND table_name = 'auditoria_pos' AND table_schema = 'public') THEN
        ALTER TABLE public.auditoria_pos ADD CONSTRAINT "2200_99591_3_not_null" CHECK (accion IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_99591_4_not_null' AND table_name = 'auditoria_pos' AND table_schema = 'public') THEN
        ALTER TABLE public.auditoria_pos ADD CONSTRAINT "2200_99591_4_not_null" CHECK (tabla_afectada IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_99591_8_not_null' AND table_name = 'auditoria_pos' AND table_schema = 'public') THEN
        ALTER TABLE public.auditoria_pos ADD CONSTRAINT "2200_99591_8_not_null" CHECK (fecha_accion IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_102600_1_not_null' AND table_name = 'casos_exito' AND table_schema = 'public') THEN
        ALTER TABLE public.casos_exito ADD CONSTRAINT "2200_102600_1_not_null" CHECK (id IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_102600_2_not_null' AND table_name = 'casos_exito' AND table_schema = 'public') THEN
        ALTER TABLE public.casos_exito ADD CONSTRAINT "2200_102600_2_not_null" CHECK (nombre_restaurante IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_90502_1_not_null' AND table_name = 'categorias' AND table_schema = 'public') THEN
        ALTER TABLE public.categorias ADD CONSTRAINT "2200_90502_1_not_null" CHECK (id_categoria IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_90502_2_not_null' AND table_name = 'categorias' AND table_schema = 'public') THEN
        ALTER TABLE public.categorias ADD CONSTRAINT "2200_90502_2_not_null" CHECK (nombre IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_90502_5_not_null' AND table_name = 'categorias' AND table_schema = 'public') THEN
        ALTER TABLE public.categorias ADD CONSTRAINT "2200_90502_5_not_null" CHECK (id_restaurante IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_99668_1_not_null' AND table_name = 'categorias_almacen' AND table_schema = 'public') THEN
        ALTER TABLE public.categorias_almacen ADD CONSTRAINT "2200_99668_1_not_null" CHECK (id_categoria_almacen IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_99668_2_not_null' AND table_name = 'categorias_almacen' AND table_schema = 'public') THEN
        ALTER TABLE public.categorias_almacen ADD CONSTRAINT "2200_99668_2_not_null" CHECK (nombre IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_99668_4_not_null' AND table_name = 'categorias_almacen' AND table_schema = 'public') THEN
        ALTER TABLE public.categorias_almacen ADD CONSTRAINT "2200_99668_4_not_null" CHECK (tipo_almacen IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_99668_7_not_null' AND table_name = 'categorias_almacen' AND table_schema = 'public') THEN
        ALTER TABLE public.categorias_almacen ADD CONSTRAINT "2200_99668_7_not_null" CHECK (id_restaurante IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_100066_1_not_null' AND table_name = 'categorias_egresos' AND table_schema = 'public') THEN
        ALTER TABLE public.categorias_egresos ADD CONSTRAINT "2200_100066_1_not_null" CHECK (id_categoria_egreso IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_100066_2_not_null' AND table_name = 'categorias_egresos' AND table_schema = 'public') THEN
        ALTER TABLE public.categorias_egresos ADD CONSTRAINT "2200_100066_2_not_null" CHECK (nombre IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_100066_7_not_null' AND table_name = 'categorias_egresos' AND table_schema = 'public') THEN
        ALTER TABLE public.categorias_egresos ADD CONSTRAINT "2200_100066_7_not_null" CHECK (id_restaurante IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_90508_1_not_null' AND table_name = 'clientes' AND table_schema = 'public') THEN
        ALTER TABLE public.clientes ADD CONSTRAINT "2200_90508_1_not_null" CHECK (id_cliente IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_102668_1_not_null' AND table_name = 'configuracion_web' AND table_schema = 'public') THEN
        ALTER TABLE public.configuracion_web ADD CONSTRAINT "2200_102668_1_not_null" CHECK (id IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_102668_2_not_null' AND table_name = 'configuracion_web' AND table_schema = 'public') THEN
        ALTER TABLE public.configuracion_web ADD CONSTRAINT "2200_102668_2_not_null" CHECK (clave IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_99616_1_not_null' AND table_name = 'configuraciones_restaurante' AND table_schema = 'public') THEN
        ALTER TABLE public.configuraciones_restaurante ADD CONSTRAINT "2200_99616_1_not_null" CHECK (id_config IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_99616_2_not_null' AND table_name = 'configuraciones_restaurante' AND table_schema = 'public') THEN
        ALTER TABLE public.configuraciones_restaurante ADD CONSTRAINT "2200_99616_2_not_null" CHECK (id_restaurante IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_99616_3_not_null' AND table_name = 'configuraciones_restaurante' AND table_schema = 'public') THEN
        ALTER TABLE public.configuraciones_restaurante ADD CONSTRAINT "2200_99616_3_not_null" CHECK (clave_config IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_99616_4_not_null' AND table_name = 'configuraciones_restaurante' AND table_schema = 'public') THEN
        ALTER TABLE public.configuraciones_restaurante ADD CONSTRAINT "2200_99616_4_not_null" CHECK (valor_config IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_99626_1_not_null' AND table_name = 'configuraciones_sistema' AND table_schema = 'public') THEN
        ALTER TABLE public.configuraciones_sistema ADD CONSTRAINT "2200_99626_1_not_null" CHECK (clave_config IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_99626_2_not_null' AND table_name = 'configuraciones_sistema' AND table_schema = 'public') THEN
        ALTER TABLE public.configuraciones_sistema ADD CONSTRAINT "2200_99626_2_not_null" CHECK (valor_config IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_143516_1_not_null' AND table_name = 'contadores_uso' AND table_schema = 'public') THEN
        ALTER TABLE public.contadores_uso ADD CONSTRAINT "2200_143516_1_not_null" CHECK (id_contador IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_143516_2_not_null' AND table_name = 'contadores_uso' AND table_schema = 'public') THEN
        ALTER TABLE public.contadores_uso ADD CONSTRAINT "2200_143516_2_not_null" CHECK (id_restaurante IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_143516_3_not_null' AND table_name = 'contadores_uso' AND table_schema = 'public') THEN
        ALTER TABLE public.contadores_uso ADD CONSTRAINT "2200_143516_3_not_null" CHECK (id_plan IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_143516_4_not_null' AND table_name = 'contadores_uso' AND table_schema = 'public') THEN
        ALTER TABLE public.contadores_uso ADD CONSTRAINT "2200_143516_4_not_null" CHECK (recurso IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_143516_6_not_null' AND table_name = 'contadores_uso' AND table_schema = 'public') THEN
        ALTER TABLE public.contadores_uso ADD CONSTRAINT "2200_143516_6_not_null" CHECK (limite_plan IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_102644_1_not_null' AND table_name = 'contenido_web' AND table_schema = 'public') THEN
        ALTER TABLE public.contenido_web ADD CONSTRAINT "2200_102644_1_not_null" CHECK (id IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_102644_2_not_null' AND table_name = 'contenido_web' AND table_schema = 'public') THEN
        ALTER TABLE public.contenido_web ADD CONSTRAINT "2200_102644_2_not_null" CHECK (titulo IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_102644_3_not_null' AND table_name = 'contenido_web' AND table_schema = 'public') THEN
        ALTER TABLE public.contenido_web ADD CONSTRAINT "2200_102644_3_not_null" CHECK (slug IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_138759_1_not_null' AND table_name = 'conversion_events' AND table_schema = 'public') THEN
        ALTER TABLE public.conversion_events ADD CONSTRAINT "2200_138759_1_not_null" CHECK (id IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_138759_2_not_null' AND table_name = 'conversion_events' AND table_schema = 'public') THEN
        ALTER TABLE public.conversion_events ADD CONSTRAINT "2200_138759_2_not_null" CHECK (event_type IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_138759_3_not_null' AND table_name = 'conversion_events' AND table_schema = 'public') THEN
        ALTER TABLE public.conversion_events ADD CONSTRAINT "2200_138759_3_not_null" CHECK (timestamp IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_102582_1_not_null' AND table_name = 'demos_reuniones' AND table_schema = 'public') THEN
        ALTER TABLE public.demos_reuniones ADD CONSTRAINT "2200_102582_1_not_null" CHECK (id IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_102582_4_not_null' AND table_name = 'demos_reuniones' AND table_schema = 'public') THEN
        ALTER TABLE public.demos_reuniones ADD CONSTRAINT "2200_102582_4_not_null" CHECK (fecha_programada IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_90513_1_not_null' AND table_name = 'detalle_ventas' AND table_schema = 'public') THEN
        ALTER TABLE public.detalle_ventas ADD CONSTRAINT "2200_90513_1_not_null" CHECK (id_detalle IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_90513_4_not_null' AND table_name = 'detalle_ventas' AND table_schema = 'public') THEN
        ALTER TABLE public.detalle_ventas ADD CONSTRAINT "2200_90513_4_not_null" CHECK (cantidad IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_90513_5_not_null' AND table_name = 'detalle_ventas' AND table_schema = 'public') THEN
        ALTER TABLE public.detalle_ventas ADD CONSTRAINT "2200_90513_5_not_null" CHECK (precio_unitario IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_90513_9_not_null' AND table_name = 'detalle_ventas' AND table_schema = 'public') THEN
        ALTER TABLE public.detalle_ventas ADD CONSTRAINT "2200_90513_9_not_null" CHECK (id_restaurante IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_99302_1_not_null' AND table_name = 'detalle_ventas_modificadores' AND table_schema = 'public') THEN
        ALTER TABLE public.detalle_ventas_modificadores ADD CONSTRAINT "2200_99302_1_not_null" CHECK (id_detalle_venta IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_99302_2_not_null' AND table_name = 'detalle_ventas_modificadores' AND table_schema = 'public') THEN
        ALTER TABLE public.detalle_ventas_modificadores ADD CONSTRAINT "2200_99302_2_not_null" CHECK (id_modificador IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_90523_1_not_null' AND table_name = 'dim_tiempo' AND table_schema = 'public') THEN
        ALTER TABLE public.dim_tiempo ADD CONSTRAINT "2200_90523_1_not_null" CHECK (id_tiempo IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_90523_2_not_null' AND table_name = 'dim_tiempo' AND table_schema = 'public') THEN
        ALTER TABLE public.dim_tiempo ADD CONSTRAINT "2200_90523_2_not_null" CHECK (fecha IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_90523_3_not_null' AND table_name = 'dim_tiempo' AND table_schema = 'public') THEN
        ALTER TABLE public.dim_tiempo ADD CONSTRAINT "2200_90523_3_not_null" CHECK (dia IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_90523_4_not_null' AND table_name = 'dim_tiempo' AND table_schema = 'public') THEN
        ALTER TABLE public.dim_tiempo ADD CONSTRAINT "2200_90523_4_not_null" CHECK (mes IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_90523_5_not_null' AND table_name = 'dim_tiempo' AND table_schema = 'public') THEN
        ALTER TABLE public.dim_tiempo ADD CONSTRAINT "2200_90523_5_not_null" CHECK (anio IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_90523_6_not_null' AND table_name = 'dim_tiempo' AND table_schema = 'public') THEN
        ALTER TABLE public.dim_tiempo ADD CONSTRAINT "2200_90523_6_not_null" CHECK (nombre_mes IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_90523_7_not_null' AND table_name = 'dim_tiempo' AND table_schema = 'public') THEN
        ALTER TABLE public.dim_tiempo ADD CONSTRAINT "2200_90523_7_not_null" CHECK (nombre_dia IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_90523_8_not_null' AND table_name = 'dim_tiempo' AND table_schema = 'public') THEN
        ALTER TABLE public.dim_tiempo ADD CONSTRAINT "2200_90523_8_not_null" CHECK (es_fin_de_semana IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_90523_9_not_null' AND table_name = 'dim_tiempo' AND table_schema = 'public') THEN
        ALTER TABLE public.dim_tiempo ADD CONSTRAINT "2200_90523_9_not_null" CHECK (turno IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_100087_1_not_null' AND table_name = 'egresos' AND table_schema = 'public') THEN
        ALTER TABLE public.egresos ADD CONSTRAINT "2200_100087_1_not_null" CHECK (id_egreso IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_100087_27_not_null' AND table_name = 'egresos' AND table_schema = 'public') THEN
        ALTER TABLE public.egresos ADD CONSTRAINT "2200_100087_27_not_null" CHECK (registrado_por IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_100087_28_not_null' AND table_name = 'egresos' AND table_schema = 'public') THEN
        ALTER TABLE public.egresos ADD CONSTRAINT "2200_100087_28_not_null" CHECK (id_sucursal IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_100087_29_not_null' AND table_name = 'egresos' AND table_schema = 'public') THEN
        ALTER TABLE public.egresos ADD CONSTRAINT "2200_100087_29_not_null" CHECK (id_restaurante IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_100087_2_not_null' AND table_name = 'egresos' AND table_schema = 'public') THEN
        ALTER TABLE public.egresos ADD CONSTRAINT "2200_100087_2_not_null" CHECK (concepto IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_100087_4_not_null' AND table_name = 'egresos' AND table_schema = 'public') THEN
        ALTER TABLE public.egresos ADD CONSTRAINT "2200_100087_4_not_null" CHECK (monto IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_100087_5_not_null' AND table_name = 'egresos' AND table_schema = 'public') THEN
        ALTER TABLE public.egresos ADD CONSTRAINT "2200_100087_5_not_null" CHECK (fecha_egreso IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_100087_6_not_null' AND table_name = 'egresos' AND table_schema = 'public') THEN
        ALTER TABLE public.egresos ADD CONSTRAINT "2200_100087_6_not_null" CHECK (id_categoria_egreso IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_100087_7_not_null' AND table_name = 'egresos' AND table_schema = 'public') THEN
        ALTER TABLE public.egresos ADD CONSTRAINT "2200_100087_7_not_null" CHECK (metodo_pago IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_90528_1_not_null' AND table_name = 'facturas' AND table_schema = 'public') THEN
        ALTER TABLE public.facturas ADD CONSTRAINT "2200_90528_1_not_null" CHECK (id_factura IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_90528_2_not_null' AND table_name = 'facturas' AND table_schema = 'public') THEN
        ALTER TABLE public.facturas ADD CONSTRAINT "2200_90528_2_not_null" CHECK (numero IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_100160_1_not_null' AND table_name = 'flujo_aprobaciones_egresos' AND table_schema = 'public') THEN
        ALTER TABLE public.flujo_aprobaciones_egresos ADD CONSTRAINT "2200_100160_1_not_null" CHECK (id_flujo IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_100160_2_not_null' AND table_name = 'flujo_aprobaciones_egresos' AND table_schema = 'public') THEN
        ALTER TABLE public.flujo_aprobaciones_egresos ADD CONSTRAINT "2200_100160_2_not_null" CHECK (id_egreso IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_100160_3_not_null' AND table_name = 'flujo_aprobaciones_egresos' AND table_schema = 'public') THEN
        ALTER TABLE public.flujo_aprobaciones_egresos ADD CONSTRAINT "2200_100160_3_not_null" CHECK (id_vendedor IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_100160_4_not_null' AND table_name = 'flujo_aprobaciones_egresos' AND table_schema = 'public') THEN
        ALTER TABLE public.flujo_aprobaciones_egresos ADD CONSTRAINT "2200_100160_4_not_null" CHECK (accion IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_91049_1_not_null' AND table_name = 'grupos_mesas' AND table_schema = 'public') THEN
        ALTER TABLE public.grupos_mesas ADD CONSTRAINT "2200_91049_1_not_null" CHECK (id_grupo_mesa IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_91049_2_not_null' AND table_name = 'grupos_mesas' AND table_schema = 'public') THEN
        ALTER TABLE public.grupos_mesas ADD CONSTRAINT "2200_91049_2_not_null" CHECK (id_restaurante IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_91049_3_not_null' AND table_name = 'grupos_mesas' AND table_schema = 'public') THEN
        ALTER TABLE public.grupos_mesas ADD CONSTRAINT "2200_91049_3_not_null" CHECK (id_sucursal IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_91049_5_not_null' AND table_name = 'grupos_mesas' AND table_schema = 'public') THEN
        ALTER TABLE public.grupos_mesas ADD CONSTRAINT "2200_91049_5_not_null" CHECK (estado IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_111605_1_not_null' AND table_name = 'historial_pagos_diferidos' AND table_schema = 'public') THEN
        ALTER TABLE public.historial_pagos_diferidos ADD CONSTRAINT "2200_111605_1_not_null" CHECK (id_historial IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_111605_2_not_null' AND table_name = 'historial_pagos_diferidos' AND table_schema = 'public') THEN
        ALTER TABLE public.historial_pagos_diferidos ADD CONSTRAINT "2200_111605_2_not_null" CHECK (id_pago_diferido IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_111605_3_not_null' AND table_name = 'historial_pagos_diferidos' AND table_schema = 'public') THEN
        ALTER TABLE public.historial_pagos_diferidos ADD CONSTRAINT "2200_111605_3_not_null" CHECK (id_venta IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_111605_4_not_null' AND table_name = 'historial_pagos_diferidos' AND table_schema = 'public') THEN
        ALTER TABLE public.historial_pagos_diferidos ADD CONSTRAINT "2200_111605_4_not_null" CHECK (id_pago_final IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_111605_5_not_null' AND table_name = 'historial_pagos_diferidos' AND table_schema = 'public') THEN
        ALTER TABLE public.historial_pagos_diferidos ADD CONSTRAINT "2200_111605_5_not_null" CHECK (monto_pagado IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_111605_7_not_null' AND table_name = 'historial_pagos_diferidos' AND table_schema = 'public') THEN
        ALTER TABLE public.historial_pagos_diferidos ADD CONSTRAINT "2200_111605_7_not_null" CHECK (id_vendedor IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_111605_9_not_null' AND table_name = 'historial_pagos_diferidos' AND table_schema = 'public') THEN
        ALTER TABLE public.historial_pagos_diferidos ADD CONSTRAINT "2200_111605_9_not_null" CHECK (id_restaurante IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_99723_1_not_null' AND table_name = 'integrity_logs' AND table_schema = 'public') THEN
        ALTER TABLE public.integrity_logs ADD CONSTRAINT "2200_99723_1_not_null" CHECK (id IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_99723_2_not_null' AND table_name = 'integrity_logs' AND table_schema = 'public') THEN
        ALTER TABLE public.integrity_logs ADD CONSTRAINT "2200_99723_2_not_null" CHECK (check_name IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_99723_3_not_null' AND table_name = 'integrity_logs' AND table_schema = 'public') THEN
        ALTER TABLE public.integrity_logs ADD CONSTRAINT "2200_99723_3_not_null" CHECK (status IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_99652_10_not_null' AND table_name = 'inventario_lotes' AND table_schema = 'public') THEN
        ALTER TABLE public.inventario_lotes ADD CONSTRAINT "2200_99652_10_not_null" CHECK (id_restaurante IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_99652_1_not_null' AND table_name = 'inventario_lotes' AND table_schema = 'public') THEN
        ALTER TABLE public.inventario_lotes ADD CONSTRAINT "2200_99652_1_not_null" CHECK (id_lote IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_99652_2_not_null' AND table_name = 'inventario_lotes' AND table_schema = 'public') THEN
        ALTER TABLE public.inventario_lotes ADD CONSTRAINT "2200_99652_2_not_null" CHECK (id_producto IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_99652_3_not_null' AND table_name = 'inventario_lotes' AND table_schema = 'public') THEN
        ALTER TABLE public.inventario_lotes ADD CONSTRAINT "2200_99652_3_not_null" CHECK (numero_lote IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_99652_4_not_null' AND table_name = 'inventario_lotes' AND table_schema = 'public') THEN
        ALTER TABLE public.inventario_lotes ADD CONSTRAINT "2200_99652_4_not_null" CHECK (cantidad_inicial IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_99652_5_not_null' AND table_name = 'inventario_lotes' AND table_schema = 'public') THEN
        ALTER TABLE public.inventario_lotes ADD CONSTRAINT "2200_99652_5_not_null" CHECK (cantidad_actual IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_102563_1_not_null' AND table_name = 'leads_prospectos' AND table_schema = 'public') THEN
        ALTER TABLE public.leads_prospectos ADD CONSTRAINT "2200_102563_1_not_null" CHECK (id IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_102563_2_not_null' AND table_name = 'leads_prospectos' AND table_schema = 'public') THEN
        ALTER TABLE public.leads_prospectos ADD CONSTRAINT "2200_102563_2_not_null" CHECK (nombre IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_102563_3_not_null' AND table_name = 'leads_prospectos' AND table_schema = 'public') THEN
        ALTER TABLE public.leads_prospectos ADD CONSTRAINT "2200_102563_3_not_null" CHECK (email IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_90533_12_not_null' AND table_name = 'mesas' AND table_schema = 'public') THEN
        ALTER TABLE public.mesas ADD CONSTRAINT "2200_90533_12_not_null" CHECK (id_restaurante IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_90533_1_not_null' AND table_name = 'mesas' AND table_schema = 'public') THEN
        ALTER TABLE public.mesas ADD CONSTRAINT "2200_90533_1_not_null" CHECK (id_mesa IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_90533_2_not_null' AND table_name = 'mesas' AND table_schema = 'public') THEN
        ALTER TABLE public.mesas ADD CONSTRAINT "2200_90533_2_not_null" CHECK (numero IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_91071_1_not_null' AND table_name = 'mesas_en_grupo' AND table_schema = 'public') THEN
        ALTER TABLE public.mesas_en_grupo ADD CONSTRAINT "2200_91071_1_not_null" CHECK (id_mesa_en_grupo IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_91071_2_not_null' AND table_name = 'mesas_en_grupo' AND table_schema = 'public') THEN
        ALTER TABLE public.mesas_en_grupo ADD CONSTRAINT "2200_91071_2_not_null" CHECK (id_grupo_mesa IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_91071_3_not_null' AND table_name = 'mesas_en_grupo' AND table_schema = 'public') THEN
        ALTER TABLE public.mesas_en_grupo ADD CONSTRAINT "2200_91071_3_not_null" CHECK (id_mesa IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_138462_1_not_null' AND table_name = 'metodos_pago' AND table_schema = 'public') THEN
        ALTER TABLE public.metodos_pago ADD CONSTRAINT "2200_138462_1_not_null" CHECK (id_pago IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_138462_2_not_null' AND table_name = 'metodos_pago' AND table_schema = 'public') THEN
        ALTER TABLE public.metodos_pago ADD CONSTRAINT "2200_138462_2_not_null" CHECK (descripcion IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_90543_1_not_null' AND table_name = 'metodos_pago_backup' AND table_schema = 'public') THEN
        ALTER TABLE public.metodos_pago_backup ADD CONSTRAINT "2200_90543_1_not_null" CHECK (id_pago IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_90543_2_not_null' AND table_name = 'metodos_pago_backup' AND table_schema = 'public') THEN
        ALTER TABLE public.metodos_pago_backup ADD CONSTRAINT "2200_90543_2_not_null" CHECK (descripcion IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_90543_4_not_null' AND table_name = 'metodos_pago_backup' AND table_schema = 'public') THEN
        ALTER TABLE public.metodos_pago_backup ADD CONSTRAINT "2200_90543_4_not_null" CHECK (id_restaurante IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_102659_1_not_null' AND table_name = 'metricas_web' AND table_schema = 'public') THEN
        ALTER TABLE public.metricas_web ADD CONSTRAINT "2200_102659_1_not_null" CHECK (id IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_102659_2_not_null' AND table_name = 'metricas_web' AND table_schema = 'public') THEN
        ALTER TABLE public.metricas_web ADD CONSTRAINT "2200_102659_2_not_null" CHECK (fecha IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_111651_1_not_null' AND table_name = 'migrations' AND table_schema = 'public') THEN
        ALTER TABLE public.migrations ADD CONSTRAINT "2200_111651_1_not_null" CHECK (id IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_111651_2_not_null' AND table_name = 'migrations' AND table_schema = 'public') THEN
        ALTER TABLE public.migrations ADD CONSTRAINT "2200_111651_2_not_null" CHECK (migration_name IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_90548_1_not_null' AND table_name = 'movimientos_inventario' AND table_schema = 'public') THEN
        ALTER TABLE public.movimientos_inventario ADD CONSTRAINT "2200_90548_1_not_null" CHECK (id_movimiento IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_90548_2_not_null' AND table_name = 'movimientos_inventario' AND table_schema = 'public') THEN
        ALTER TABLE public.movimientos_inventario ADD CONSTRAINT "2200_90548_2_not_null" CHECK (id_producto IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_90548_3_not_null' AND table_name = 'movimientos_inventario' AND table_schema = 'public') THEN
        ALTER TABLE public.movimientos_inventario ADD CONSTRAINT "2200_90548_3_not_null" CHECK (tipo_movimiento IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_90548_4_not_null' AND table_name = 'movimientos_inventario' AND table_schema = 'public') THEN
        ALTER TABLE public.movimientos_inventario ADD CONSTRAINT "2200_90548_4_not_null" CHECK (cantidad IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_90548_5_not_null' AND table_name = 'movimientos_inventario' AND table_schema = 'public') THEN
        ALTER TABLE public.movimientos_inventario ADD CONSTRAINT "2200_90548_5_not_null" CHECK (stock_anterior IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_90548_6_not_null' AND table_name = 'movimientos_inventario' AND table_schema = 'public') THEN
        ALTER TABLE public.movimientos_inventario ADD CONSTRAINT "2200_90548_6_not_null" CHECK (stock_actual IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_90548_9_not_null' AND table_name = 'movimientos_inventario' AND table_schema = 'public') THEN
        ALTER TABLE public.movimientos_inventario ADD CONSTRAINT "2200_90548_9_not_null" CHECK (id_restaurante IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_138787_1_not_null' AND table_name = 'newsletter_suscriptores' AND table_schema = 'public') THEN
        ALTER TABLE public.newsletter_suscriptores ADD CONSTRAINT "2200_138787_1_not_null" CHECK (id IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_138787_2_not_null' AND table_name = 'newsletter_suscriptores' AND table_schema = 'public') THEN
        ALTER TABLE public.newsletter_suscriptores ADD CONSTRAINT "2200_138787_2_not_null" CHECK (email IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_111581_1_not_null' AND table_name = 'pagos_diferidos' AND table_schema = 'public') THEN
        ALTER TABLE public.pagos_diferidos ADD CONSTRAINT "2200_111581_1_not_null" CHECK (id_pago_diferido IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_111581_2_not_null' AND table_name = 'pagos_diferidos' AND table_schema = 'public') THEN
        ALTER TABLE public.pagos_diferidos ADD CONSTRAINT "2200_111581_2_not_null" CHECK (id_venta IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_111581_4_not_null' AND table_name = 'pagos_diferidos' AND table_schema = 'public') THEN
        ALTER TABLE public.pagos_diferidos ADD CONSTRAINT "2200_111581_4_not_null" CHECK (total_pendiente IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_111581_9_not_null' AND table_name = 'pagos_diferidos' AND table_schema = 'public') THEN
        ALTER TABLE public.pagos_diferidos ADD CONSTRAINT "2200_111581_9_not_null" CHECK (id_restaurante IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_91001_1_not_null' AND table_name = 'pagos_restaurantes' AND table_schema = 'public') THEN
        ALTER TABLE public.pagos_restaurantes ADD CONSTRAINT "2200_91001_1_not_null" CHECK (id IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_91001_2_not_null' AND table_name = 'pagos_restaurantes' AND table_schema = 'public') THEN
        ALTER TABLE public.pagos_restaurantes ADD CONSTRAINT "2200_91001_2_not_null" CHECK (id_restaurante IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_91001_3_not_null' AND table_name = 'pagos_restaurantes' AND table_schema = 'public') THEN
        ALTER TABLE public.pagos_restaurantes ADD CONSTRAINT "2200_91001_3_not_null" CHECK (monto IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_91001_4_not_null' AND table_name = 'pagos_restaurantes' AND table_schema = 'public') THEN
        ALTER TABLE public.pagos_restaurantes ADD CONSTRAINT "2200_91001_4_not_null" CHECK (fecha_pago IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_119067_10_not_null' AND table_name = 'planes' AND table_schema = 'public') THEN
        ALTER TABLE public.planes ADD CONSTRAINT "2200_119067_10_not_null" CHECK (almacenamiento_gb IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_119067_11_not_null' AND table_name = 'planes' AND table_schema = 'public') THEN
        ALTER TABLE public.planes ADD CONSTRAINT "2200_119067_11_not_null" CHECK (funcionalidades IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_119067_1_not_null' AND table_name = 'planes' AND table_schema = 'public') THEN
        ALTER TABLE public.planes ADD CONSTRAINT "2200_119067_1_not_null" CHECK (id_plan IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_119067_2_not_null' AND table_name = 'planes' AND table_schema = 'public') THEN
        ALTER TABLE public.planes ADD CONSTRAINT "2200_119067_2_not_null" CHECK (nombre IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_119067_4_not_null' AND table_name = 'planes' AND table_schema = 'public') THEN
        ALTER TABLE public.planes ADD CONSTRAINT "2200_119067_4_not_null" CHECK (precio_mensual IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_119067_6_not_null' AND table_name = 'planes' AND table_schema = 'public') THEN
        ALTER TABLE public.planes ADD CONSTRAINT "2200_119067_6_not_null" CHECK (max_sucursales IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_119067_7_not_null' AND table_name = 'planes' AND table_schema = 'public') THEN
        ALTER TABLE public.planes ADD CONSTRAINT "2200_119067_7_not_null" CHECK (max_usuarios IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_119067_8_not_null' AND table_name = 'planes' AND table_schema = 'public') THEN
        ALTER TABLE public.planes ADD CONSTRAINT "2200_119067_8_not_null" CHECK (max_productos IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_119067_9_not_null' AND table_name = 'planes' AND table_schema = 'public') THEN
        ALTER TABLE public.planes ADD CONSTRAINT "2200_119067_9_not_null" CHECK (max_transacciones_mes IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_102543_1_not_null' AND table_name = 'planes_pos' AND table_schema = 'public') THEN
        ALTER TABLE public.planes_pos ADD CONSTRAINT "2200_102543_1_not_null" CHECK (id IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_102543_2_not_null' AND table_name = 'planes_pos' AND table_schema = 'public') THEN
        ALTER TABLE public.planes_pos ADD CONSTRAINT "2200_102543_2_not_null" CHECK (nombre IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_90553_10_not_null' AND table_name = 'prefacturas' AND table_schema = 'public') THEN
        ALTER TABLE public.prefacturas ADD CONSTRAINT "2200_90553_10_not_null" CHECK (id_restaurante IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_90553_1_not_null' AND table_name = 'prefacturas' AND table_schema = 'public') THEN
        ALTER TABLE public.prefacturas ADD CONSTRAINT "2200_90553_1_not_null" CHECK (id_prefactura IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_100134_1_not_null' AND table_name = 'presupuestos_egresos' AND table_schema = 'public') THEN
        ALTER TABLE public.presupuestos_egresos ADD CONSTRAINT "2200_100134_1_not_null" CHECK (id_presupuesto IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_100134_2_not_null' AND table_name = 'presupuestos_egresos' AND table_schema = 'public') THEN
        ALTER TABLE public.presupuestos_egresos ADD CONSTRAINT "2200_100134_2_not_null" CHECK (anio IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_100134_4_not_null' AND table_name = 'presupuestos_egresos' AND table_schema = 'public') THEN
        ALTER TABLE public.presupuestos_egresos ADD CONSTRAINT "2200_100134_4_not_null" CHECK (id_categoria_egreso IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_100134_5_not_null' AND table_name = 'presupuestos_egresos' AND table_schema = 'public') THEN
        ALTER TABLE public.presupuestos_egresos ADD CONSTRAINT "2200_100134_5_not_null" CHECK (monto_presupuestado IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_100134_8_not_null' AND table_name = 'presupuestos_egresos' AND table_schema = 'public') THEN
        ALTER TABLE public.presupuestos_egresos ADD CONSTRAINT "2200_100134_8_not_null" CHECK (id_restaurante IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_90564_1_not_null' AND table_name = 'productos' AND table_schema = 'public') THEN
        ALTER TABLE public.productos ADD CONSTRAINT "2200_90564_1_not_null" CHECK (id_producto IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_90564_2_not_null' AND table_name = 'productos' AND table_schema = 'public') THEN
        ALTER TABLE public.productos ADD CONSTRAINT "2200_90564_2_not_null" CHECK (nombre IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_90564_3_not_null' AND table_name = 'productos' AND table_schema = 'public') THEN
        ALTER TABLE public.productos ADD CONSTRAINT "2200_90564_3_not_null" CHECK (precio IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_90564_9_not_null' AND table_name = 'productos' AND table_schema = 'public') THEN
        ALTER TABLE public.productos ADD CONSTRAINT "2200_90564_9_not_null" CHECK (id_restaurante IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_99286_1_not_null' AND table_name = 'productos_modificadores' AND table_schema = 'public') THEN
        ALTER TABLE public.productos_modificadores ADD CONSTRAINT "2200_99286_1_not_null" CHECK (id_modificador IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_99286_2_not_null' AND table_name = 'productos_modificadores' AND table_schema = 'public') THEN
        ALTER TABLE public.productos_modificadores ADD CONSTRAINT "2200_99286_2_not_null" CHECK (id_producto IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_99286_3_not_null' AND table_name = 'productos_modificadores' AND table_schema = 'public') THEN
        ALTER TABLE public.productos_modificadores ADD CONSTRAINT "2200_99286_3_not_null" CHECK (nombre_modificador IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_90575_10_not_null' AND table_name = 'promociones' AND table_schema = 'public') THEN
        ALTER TABLE public.promociones ADD CONSTRAINT "2200_90575_10_not_null" CHECK (id_restaurante IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_90575_1_not_null' AND table_name = 'promociones' AND table_schema = 'public') THEN
        ALTER TABLE public.promociones ADD CONSTRAINT "2200_90575_1_not_null" CHECK (id_promocion IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_99530_1_not_null' AND table_name = 'promociones_sucursales' AND table_schema = 'public') THEN
        ALTER TABLE public.promociones_sucursales ADD CONSTRAINT "2200_99530_1_not_null" CHECK (id_relacion IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_99530_2_not_null' AND table_name = 'promociones_sucursales' AND table_schema = 'public') THEN
        ALTER TABLE public.promociones_sucursales ADD CONSTRAINT "2200_99530_2_not_null" CHECK (id_promocion IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_99530_3_not_null' AND table_name = 'promociones_sucursales' AND table_schema = 'public') THEN
        ALTER TABLE public.promociones_sucursales ADD CONSTRAINT "2200_99530_3_not_null" CHECK (id_sucursal IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_91079_10_not_null' AND table_name = 'reservas' AND table_schema = 'public') THEN
        ALTER TABLE public.reservas ADD CONSTRAINT "2200_91079_10_not_null" CHECK (fecha_hora_fin IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_91079_11_not_null' AND table_name = 'reservas' AND table_schema = 'public') THEN
        ALTER TABLE public.reservas ADD CONSTRAINT "2200_91079_11_not_null" CHECK (numero_personas IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_91079_12_not_null' AND table_name = 'reservas' AND table_schema = 'public') THEN
        ALTER TABLE public.reservas ADD CONSTRAINT "2200_91079_12_not_null" CHECK (estado IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_91079_1_not_null' AND table_name = 'reservas' AND table_schema = 'public') THEN
        ALTER TABLE public.reservas ADD CONSTRAINT "2200_91079_1_not_null" CHECK (id_reserva IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_91079_2_not_null' AND table_name = 'reservas' AND table_schema = 'public') THEN
        ALTER TABLE public.reservas ADD CONSTRAINT "2200_91079_2_not_null" CHECK (id_restaurante IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_91079_3_not_null' AND table_name = 'reservas' AND table_schema = 'public') THEN
        ALTER TABLE public.reservas ADD CONSTRAINT "2200_91079_3_not_null" CHECK (id_sucursal IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_91079_6_not_null' AND table_name = 'reservas' AND table_schema = 'public') THEN
        ALTER TABLE public.reservas ADD CONSTRAINT "2200_91079_6_not_null" CHECK (nombre_cliente IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_91079_9_not_null' AND table_name = 'reservas' AND table_schema = 'public') THEN
        ALTER TABLE public.reservas ADD CONSTRAINT "2200_91079_9_not_null" CHECK (fecha_hora_inicio IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_90751_1_not_null' AND table_name = 'restaurantes' AND table_schema = 'public') THEN
        ALTER TABLE public.restaurantes ADD CONSTRAINT "2200_90751_1_not_null" CHECK (id_restaurante IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_90751_2_not_null' AND table_name = 'restaurantes' AND table_schema = 'public') THEN
        ALTER TABLE public.restaurantes ADD CONSTRAINT "2200_90751_2_not_null" CHECK (nombre IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_90930_1_not_null' AND table_name = 'roles_admin' AND table_schema = 'public') THEN
        ALTER TABLE public.roles_admin ADD CONSTRAINT "2200_90930_1_not_null" CHECK (id_rol IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_90930_2_not_null' AND table_name = 'roles_admin' AND table_schema = 'public') THEN
        ALTER TABLE public.roles_admin ADD CONSTRAINT "2200_90930_2_not_null" CHECK (nombre IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_90966_1_not_null' AND table_name = 'servicios_restaurante' AND table_schema = 'public') THEN
        ALTER TABLE public.servicios_restaurante ADD CONSTRAINT "2200_90966_1_not_null" CHECK (id IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_90966_2_not_null' AND table_name = 'servicios_restaurante' AND table_schema = 'public') THEN
        ALTER TABLE public.servicios_restaurante ADD CONSTRAINT "2200_90966_2_not_null" CHECK (id_restaurante IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_90966_3_not_null' AND table_name = 'servicios_restaurante' AND table_schema = 'public') THEN
        ALTER TABLE public.servicios_restaurante ADD CONSTRAINT "2200_90966_3_not_null" CHECK (nombre_plan IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_90966_5_not_null' AND table_name = 'servicios_restaurante' AND table_schema = 'public') THEN
        ALTER TABLE public.servicios_restaurante ADD CONSTRAINT "2200_90966_5_not_null" CHECK (fecha_inicio IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_90966_7_not_null' AND table_name = 'servicios_restaurante' AND table_schema = 'public') THEN
        ALTER TABLE public.servicios_restaurante ADD CONSTRAINT "2200_90966_7_not_null" CHECK (estado_suscripcion IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_138746_1_not_null' AND table_name = 'solicitudes_demo' AND table_schema = 'public') THEN
        ALTER TABLE public.solicitudes_demo ADD CONSTRAINT "2200_138746_1_not_null" CHECK (id_solicitud IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_138746_2_not_null' AND table_name = 'solicitudes_demo' AND table_schema = 'public') THEN
        ALTER TABLE public.solicitudes_demo ADD CONSTRAINT "2200_138746_2_not_null" CHECK (nombre IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_138746_3_not_null' AND table_name = 'solicitudes_demo' AND table_schema = 'public') THEN
        ALTER TABLE public.solicitudes_demo ADD CONSTRAINT "2200_138746_3_not_null" CHECK (email IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_138746_4_not_null' AND table_name = 'solicitudes_demo' AND table_schema = 'public') THEN
        ALTER TABLE public.solicitudes_demo ADD CONSTRAINT "2200_138746_4_not_null" CHECK (telefono IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_138746_5_not_null' AND table_name = 'solicitudes_demo' AND table_schema = 'public') THEN
        ALTER TABLE public.solicitudes_demo ADD CONSTRAINT "2200_138746_5_not_null" CHECK (restaurante IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_91028_1_not_null' AND table_name = 'soporte_tickets' AND table_schema = 'public') THEN
        ALTER TABLE public.soporte_tickets ADD CONSTRAINT "2200_91028_1_not_null" CHECK (id_ticket IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_91028_2_not_null' AND table_name = 'soporte_tickets' AND table_schema = 'public') THEN
        ALTER TABLE public.soporte_tickets ADD CONSTRAINT "2200_91028_2_not_null" CHECK (id_vendedor IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_91028_3_not_null' AND table_name = 'soporte_tickets' AND table_schema = 'public') THEN
        ALTER TABLE public.soporte_tickets ADD CONSTRAINT "2200_91028_3_not_null" CHECK (id_restaurante IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_91028_4_not_null' AND table_name = 'soporte_tickets' AND table_schema = 'public') THEN
        ALTER TABLE public.soporte_tickets ADD CONSTRAINT "2200_91028_4_not_null" CHECK (asunto IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_91028_5_not_null' AND table_name = 'soporte_tickets' AND table_schema = 'public') THEN
        ALTER TABLE public.soporte_tickets ADD CONSTRAINT "2200_91028_5_not_null" CHECK (descripcion IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_90581_1_not_null' AND table_name = 'sucursales' AND table_schema = 'public') THEN
        ALTER TABLE public.sucursales ADD CONSTRAINT "2200_90581_1_not_null" CHECK (id_sucursal IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_90581_2_not_null' AND table_name = 'sucursales' AND table_schema = 'public') THEN
        ALTER TABLE public.sucursales ADD CONSTRAINT "2200_90581_2_not_null" CHECK (nombre IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_90581_3_not_null' AND table_name = 'sucursales' AND table_schema = 'public') THEN
        ALTER TABLE public.sucursales ADD CONSTRAINT "2200_90581_3_not_null" CHECK (ciudad IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_90581_7_not_null' AND table_name = 'sucursales' AND table_schema = 'public') THEN
        ALTER TABLE public.sucursales ADD CONSTRAINT "2200_90581_7_not_null" CHECK (id_restaurante IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_119090_1_not_null' AND table_name = 'suscripciones' AND table_schema = 'public') THEN
        ALTER TABLE public.suscripciones ADD CONSTRAINT "2200_119090_1_not_null" CHECK (id_suscripcion IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_119090_2_not_null' AND table_name = 'suscripciones' AND table_schema = 'public') THEN
        ALTER TABLE public.suscripciones ADD CONSTRAINT "2200_119090_2_not_null" CHECK (id_restaurante IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_119090_3_not_null' AND table_name = 'suscripciones' AND table_schema = 'public') THEN
        ALTER TABLE public.suscripciones ADD CONSTRAINT "2200_119090_3_not_null" CHECK (id_plan IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_119090_5_not_null' AND table_name = 'suscripciones' AND table_schema = 'public') THEN
        ALTER TABLE public.suscripciones ADD CONSTRAINT "2200_119090_5_not_null" CHECK (fecha_inicio IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_99711_1_not_null' AND table_name = 'system_tasks' AND table_schema = 'public') THEN
        ALTER TABLE public.system_tasks ADD CONSTRAINT "2200_99711_1_not_null" CHECK (id IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_99711_2_not_null' AND table_name = 'system_tasks' AND table_schema = 'public') THEN
        ALTER TABLE public.system_tasks ADD CONSTRAINT "2200_99711_2_not_null" CHECK (task_name IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_102615_1_not_null' AND table_name = 'testimonios_web' AND table_schema = 'public') THEN
        ALTER TABLE public.testimonios_web ADD CONSTRAINT "2200_102615_1_not_null" CHECK (id IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_102615_2_not_null' AND table_name = 'testimonios_web' AND table_schema = 'public') THEN
        ALTER TABLE public.testimonios_web ADD CONSTRAINT "2200_102615_2_not_null" CHECK (nombre IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_102615_6_not_null' AND table_name = 'testimonios_web' AND table_schema = 'public') THEN
        ALTER TABLE public.testimonios_web ADD CONSTRAINT "2200_102615_6_not_null" CHECK (testimonio IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_99693_11_not_null' AND table_name = 'transferencias_almacen' AND table_schema = 'public') THEN
        ALTER TABLE public.transferencias_almacen ADD CONSTRAINT "2200_99693_11_not_null" CHECK (id_restaurante IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_99693_1_not_null' AND table_name = 'transferencias_almacen' AND table_schema = 'public') THEN
        ALTER TABLE public.transferencias_almacen ADD CONSTRAINT "2200_99693_1_not_null" CHECK (id_transferencia IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_99693_2_not_null' AND table_name = 'transferencias_almacen' AND table_schema = 'public') THEN
        ALTER TABLE public.transferencias_almacen ADD CONSTRAINT "2200_99693_2_not_null" CHECK (id_producto IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_99693_4_not_null' AND table_name = 'transferencias_almacen' AND table_schema = 'public') THEN
        ALTER TABLE public.transferencias_almacen ADD CONSTRAINT "2200_99693_4_not_null" CHECK (cantidad_transferida IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_99693_5_not_null' AND table_name = 'transferencias_almacen' AND table_schema = 'public') THEN
        ALTER TABLE public.transferencias_almacen ADD CONSTRAINT "2200_99693_5_not_null" CHECK (almacen_origen IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_99693_6_not_null' AND table_name = 'transferencias_almacen' AND table_schema = 'public') THEN
        ALTER TABLE public.transferencias_almacen ADD CONSTRAINT "2200_99693_6_not_null" CHECK (almacen_destino IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_99693_8_not_null' AND table_name = 'transferencias_almacen' AND table_schema = 'public') THEN
        ALTER TABLE public.transferencias_almacen ADD CONSTRAINT "2200_99693_8_not_null" CHECK (id_responsable IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_138770_1_not_null' AND table_name = 'user_sessions' AND table_schema = 'public') THEN
        ALTER TABLE public.user_sessions ADD CONSTRAINT "2200_138770_1_not_null" CHECK (id IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_138770_2_not_null' AND table_name = 'user_sessions' AND table_schema = 'public') THEN
        ALTER TABLE public.user_sessions ADD CONSTRAINT "2200_138770_2_not_null" CHECK (session_id IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_119118_10_not_null' AND table_name = 'uso_recursos' AND table_schema = 'public') THEN
        ALTER TABLE public.uso_recursos ADD CONSTRAINT "2200_119118_10_not_null" CHECK (año_medicion IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_119118_1_not_null' AND table_name = 'uso_recursos' AND table_schema = 'public') THEN
        ALTER TABLE public.uso_recursos ADD CONSTRAINT "2200_119118_1_not_null" CHECK (id_uso IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_119118_2_not_null' AND table_name = 'uso_recursos' AND table_schema = 'public') THEN
        ALTER TABLE public.uso_recursos ADD CONSTRAINT "2200_119118_2_not_null" CHECK (id_restaurante IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_119118_3_not_null' AND table_name = 'uso_recursos' AND table_schema = 'public') THEN
        ALTER TABLE public.uso_recursos ADD CONSTRAINT "2200_119118_3_not_null" CHECK (id_plan IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_119118_9_not_null' AND table_name = 'uso_recursos' AND table_schema = 'public') THEN
        ALTER TABLE public.uso_recursos ADD CONSTRAINT "2200_119118_9_not_null" CHECK (mes_medicion IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_90589_10_not_null' AND table_name = 'vendedores' AND table_schema = 'public') THEN
        ALTER TABLE public.vendedores ADD CONSTRAINT "2200_90589_10_not_null" CHECK (id_restaurante IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_90589_1_not_null' AND table_name = 'vendedores' AND table_schema = 'public') THEN
        ALTER TABLE public.vendedores ADD CONSTRAINT "2200_90589_1_not_null" CHECK (id_vendedor IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_90589_2_not_null' AND table_name = 'vendedores' AND table_schema = 'public') THEN
        ALTER TABLE public.vendedores ADD CONSTRAINT "2200_90589_2_not_null" CHECK (nombre IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_90589_3_not_null' AND table_name = 'vendedores' AND table_schema = 'public') THEN
        ALTER TABLE public.vendedores ADD CONSTRAINT "2200_90589_3_not_null" CHECK (username IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_90598_11_not_null' AND table_name = 'ventas' AND table_schema = 'public') THEN
        ALTER TABLE public.ventas ADD CONSTRAINT "2200_90598_11_not_null" CHECK (id_restaurante IS NOT NULL);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '2200_90598_1_not_null' AND table_name = 'ventas' AND table_schema = 'public') THEN
        ALTER TABLE public.ventas ADD CONSTRAINT "2200_90598_1_not_null" CHECK (id_venta IS NOT NULL);
    END IF;
END $$;

-- ÍNDICES
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'contadores_uso_id_restaurante_recurso_fecha_medicion_key' AND schemaname = 'public') THEN
        CREATE UNIQUE INDEX contadores_uso_id_restaurante_recurso_fecha_medicion_key ON public.contadores_uso USING btree (id_restaurante, recurso, fecha_medicion);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'contadores_uso_pkey' AND schemaname = 'public') THEN
        CREATE UNIQUE INDEX contadores_uso_pkey ON public.contadores_uso USING btree (id_contador);
    END IF;
END $$;

-- FUNCIONES
-- Función: update_contadores_on_plan_change
CREATE OR REPLACE FUNCTION public.update_contadores_on_plan_change()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
            BEGIN
                -- Solo actualizar si cambió el plan
                IF OLD.id_plan != NEW.id_plan THEN
                    -- Actualizar contadores existentes para el restaurante
                    UPDATE contadores_uso 
                    SET 
                        id_plan = NEW.id_plan,
                        limite_plan = CASE 
                            WHEN recurso = 'sucursales' THEN (SELECT max_sucursales FROM planes WHERE id_plan = NEW.id_plan)
                            WHEN recurso = 'usuarios' THEN (SELECT max_usuarios FROM planes WHERE id_plan = NEW.id_plan)
                            WHEN recurso = 'productos' THEN (SELECT max_productos FROM planes WHERE id_plan = NEW.id_plan)
                            WHEN recurso = 'transacciones' THEN (SELECT max_transacciones_mes FROM planes WHERE id_plan = NEW.id_plan)
                            WHEN recurso = 'almacenamiento' THEN (SELECT almacenamiento_gb * 1024 FROM planes WHERE id_plan = NEW.id_plan)
                            ELSE limite_plan
                        END,
                        updated_at = NOW()
                    WHERE id_restaurante = NEW.id_restaurante
                    AND fecha_medicion = CURRENT_DATE;
                    
                    -- Crear contadores si no existen
                    INSERT INTO contadores_uso (id_restaurante, id_plan, recurso, uso_actual, limite_plan, fecha_medicion, created_at, updated_at)
                    SELECT 
                        NEW.id_restaurante,
                        NEW.id_plan,
                        recurso,
                        0 as uso_actual,
                        CASE 
                            WHEN recurso = 'sucursales' THEN p.max_sucursales
                            WHEN recurso = 'usuarios' THEN p.max_usuarios
                            WHEN recurso = 'productos' THEN p.max_productos
                            WHEN recurso = 'transacciones' THEN p.max_transacciones_mes
                            WHEN recurso = 'almacenamiento' THEN p.almacenamiento_gb * 1024
                            ELSE 0
                        END as limite_plan,
                        CURRENT_DATE,
                        NOW(),
                        NOW()
                    FROM planes p
                    CROSS JOIN (
                        SELECT 'sucursales' as recurso
                        UNION SELECT 'usuarios'
                        UNION SELECT 'productos'
                        UNION SELECT 'transacciones'
                        UNION SELECT 'almacenamiento'
                    ) recursos
                    WHERE p.id_plan = NEW.id_plan
                    AND NOT EXISTS (
                        SELECT 1 FROM contadores_uso 
                        WHERE id_restaurante = NEW.id_restaurante 
                        AND recurso = recursos.recurso 
                        AND fecha_medicion = CURRENT_DATE
                    );
                END IF;
                
                RETURN NEW;
            END;
            $function$
;

-- TRIGGERS
-- Trigger: trigger_create_contadores_on_new_subscription
CREATE TRIGGER trigger_create_contadores_on_new_subscription
    AFTER INSERT
    ON suscripciones
    FOR EACH ROW
    EXECUTE FUNCTION update_contadores_on_plan_change();

-- Trigger: trigger_update_contadores_on_plan_change
CREATE TRIGGER trigger_update_contadores_on_plan_change
    AFTER UPDATE
    ON suscripciones
    FOR EACH ROW
    EXECUTE FUNCTION update_contadores_on_plan_change();


-- ========================================
-- FIN DE LA MIGRACIÓN
-- ========================================

COMMIT;

-- Verificar que la migración fue exitosa
DO $$
BEGIN
    RAISE NOTICE 'Migración completada exitosamente en: %', now();
END $$;