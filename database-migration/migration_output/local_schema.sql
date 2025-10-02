-- Esquema extraído automáticamente
-- Fecha: 2025-10-02 14:39:34

-- EXTENSIONES
CREATE EXTENSION IF NOT EXISTS plpgsql;

-- TIPOS PERSONALIZADOS
-- Tipo: admin_users
-- Definición: admin_users

-- Tipo: alertas_inventario
-- Definición: alertas_inventario

-- Tipo: alertas_limites
-- Definición: alertas_limites

-- Tipo: archivos_egresos
-- Definición: archivos_egresos

-- Tipo: arqueos_caja
-- Definición: arqueos_caja

-- Tipo: auditoria_admin
-- Definición: auditoria_admin

-- Tipo: auditoria_planes
-- Definición: auditoria_planes

-- Tipo: auditoria_pos
-- Definición: auditoria_pos

-- Tipo: casos_exito
-- Definición: casos_exito

-- Tipo: categorias
-- Definición: categorias

-- Tipo: categorias_almacen
-- Definición: categorias_almacen

-- Tipo: categorias_egresos
-- Definición: categorias_egresos

-- Tipo: clientes
-- Definición: clientes

-- Tipo: configuracion_web
-- Definición: configuracion_web

-- Tipo: configuraciones_restaurante
-- Definición: configuraciones_restaurante

-- Tipo: configuraciones_sistema
-- Definición: configuraciones_sistema

-- Tipo: contadores_uso
-- Definición: contadores_uso

-- Tipo: contenido_web
-- Definición: contenido_web

-- Tipo: conversion_events
-- Definición: conversion_events

-- Tipo: demos_reuniones
-- Definición: demos_reuniones

-- Tipo: detalle_ventas
-- Definición: detalle_ventas

-- Tipo: detalle_ventas_modificadores
-- Definición: detalle_ventas_modificadores

-- Tipo: dim_tiempo
-- Definición: dim_tiempo

-- Tipo: egresos
-- Definición: egresos

-- Tipo: facturas
-- Definición: facturas

-- Tipo: flujo_aprobaciones_egresos
-- Definición: flujo_aprobaciones_egresos

-- Tipo: grupos_mesas
-- Definición: grupos_mesas

-- Tipo: historial_pagos_diferidos
-- Definición: historial_pagos_diferidos

-- Tipo: integrity_logs
-- Definición: integrity_logs

-- Tipo: inventario_lotes
-- Definición: inventario_lotes

-- Tipo: leads_prospectos
-- Definición: leads_prospectos

-- Tipo: mesas
-- Definición: mesas

-- Tipo: mesas_en_grupo
-- Definición: mesas_en_grupo

-- Tipo: metodos_pago
-- Definición: metodos_pago

-- Tipo: metodos_pago_backup
-- Definición: metodos_pago_backup

-- Tipo: metricas_web
-- Definición: metricas_web

-- Tipo: migrations
-- Definición: migrations

-- Tipo: movimientos_inventario
-- Definición: movimientos_inventario

-- Tipo: newsletter_suscriptores
-- Definición: newsletter_suscriptores

-- Tipo: pagos_diferidos
-- Definición: pagos_diferidos

-- Tipo: pagos_restaurantes
-- Definición: pagos_restaurantes

-- Tipo: planes
-- Definición: planes

-- Tipo: planes_pos
-- Definición: planes_pos

-- Tipo: prefacturas
-- Definición: prefacturas

-- Tipo: presupuestos_egresos
-- Definición: presupuestos_egresos

-- Tipo: productos
-- Definición: productos

-- Tipo: productos_modificadores
-- Definición: productos_modificadores

-- Tipo: promociones
-- Definición: promociones

-- Tipo: promociones_sucursales
-- Definición: promociones_sucursales

-- Tipo: reservas
-- Definición: reservas

-- Tipo: restaurantes
-- Definición: restaurantes

-- Tipo: roles_admin
-- Definición: roles_admin

-- Tipo: servicios_restaurante
-- Definición: servicios_restaurante

-- Tipo: solicitudes_demo
-- Definición: solicitudes_demo

-- Tipo: soporte_tickets
-- Definición: soporte_tickets

-- Tipo: stock_sucursal
-- Definición: stock_sucursal

-- Tipo: sucursales
-- Definición: sucursales

-- Tipo: suscripciones
-- Definición: suscripciones

-- Tipo: system_tasks
-- Definición: system_tasks

-- Tipo: testimonios_web
-- Definición: testimonios_web

-- Tipo: transferencias_almacen
-- Definición: transferencias_almacen

-- Tipo: user_sessions
-- Definición: user_sessions

-- Tipo: uso_recursos
-- Definición: uso_recursos

-- Tipo: usuarios
-- Definición: usuarios

-- Tipo: v_integrity_monitoring
-- Definición: v_integrity_monitoring

-- Tipo: vendedores
-- Definición: vendedores

-- Tipo: ventas
-- Definición: ventas

-- Tipo: vista_lotes_criticos
-- Definición: vista_lotes_criticos

-- Tipo: vista_pagos_diferidos
-- Definición: vista_pagos_diferidos

-- Tipo: vista_resumen_inventario
-- Definición: vista_resumen_inventario


-- SECUENCIAS
CREATE SEQUENCE IF NOT EXISTS public.admin_users_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.alertas_inventario_id_alerta_seq;
CREATE SEQUENCE IF NOT EXISTS public.alertas_limites_id_alerta_seq;
CREATE SEQUENCE IF NOT EXISTS public.archivos_egresos_id_archivo_seq;
CREATE SEQUENCE IF NOT EXISTS public.arqueos_caja_id_arqueo_seq;
CREATE SEQUENCE IF NOT EXISTS public.auditoria_admin_id_auditoria_seq;
CREATE SEQUENCE IF NOT EXISTS public.auditoria_planes_id_auditoria_seq;
CREATE SEQUENCE IF NOT EXISTS public.auditoria_pos_id_auditoria_seq;
CREATE SEQUENCE IF NOT EXISTS public.casos_exito_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.categorias_almacen_id_categoria_almacen_seq;
CREATE SEQUENCE IF NOT EXISTS public.categorias_egresos_id_categoria_egreso_seq;
CREATE SEQUENCE IF NOT EXISTS public.categorias_id_categoria_seq;
CREATE SEQUENCE IF NOT EXISTS public.clientes_id_cliente_seq;
CREATE SEQUENCE IF NOT EXISTS public.configuracion_web_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.configuraciones_restaurante_id_config_seq;
CREATE SEQUENCE IF NOT EXISTS public.contadores_uso_id_contador_seq;
CREATE SEQUENCE IF NOT EXISTS public.contenido_web_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.conversion_events_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.demos_reuniones_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.detalle_ventas_id_detalle_seq;
CREATE SEQUENCE IF NOT EXISTS public.dim_tiempo_id_tiempo_seq;
CREATE SEQUENCE IF NOT EXISTS public.egresos_id_egreso_seq;
CREATE SEQUENCE IF NOT EXISTS public.facturas_id_factura_seq;
CREATE SEQUENCE IF NOT EXISTS public.flujo_aprobaciones_egresos_id_flujo_seq;
CREATE SEQUENCE IF NOT EXISTS public.grupos_mesas_id_grupo_mesa_seq;
CREATE SEQUENCE IF NOT EXISTS public.historial_pagos_diferidos_id_historial_seq;
CREATE SEQUENCE IF NOT EXISTS public.integrity_logs_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.inventario_lotes_id_lote_seq;
CREATE SEQUENCE IF NOT EXISTS public.leads_prospectos_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.mesas_en_grupo_id_mesa_en_grupo_seq;
CREATE SEQUENCE IF NOT EXISTS public.mesas_id_mesa_seq;
CREATE SEQUENCE IF NOT EXISTS public.metodos_pago_id_pago_seq;
CREATE SEQUENCE IF NOT EXISTS public.metodos_pago_id_pago_seq1;
CREATE SEQUENCE IF NOT EXISTS public.metricas_web_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.migrations_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.movimientos_inventario_id_movimiento_seq;
CREATE SEQUENCE IF NOT EXISTS public.newsletter_suscriptores_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.pagos_diferidos_id_pago_diferido_seq;
CREATE SEQUENCE IF NOT EXISTS public.pagos_restaurantes_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.planes_id_plan_seq;
CREATE SEQUENCE IF NOT EXISTS public.planes_pos_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.prefacturas_id_prefactura_seq;
CREATE SEQUENCE IF NOT EXISTS public.presupuestos_egresos_id_presupuesto_seq;
CREATE SEQUENCE IF NOT EXISTS public.productos_id_producto_seq;
CREATE SEQUENCE IF NOT EXISTS public.productos_modificadores_id_modificador_seq;
CREATE SEQUENCE IF NOT EXISTS public.promociones_id_promocion_seq;
CREATE SEQUENCE IF NOT EXISTS public.promociones_sucursales_id_relacion_seq;
CREATE SEQUENCE IF NOT EXISTS public.reservas_id_reserva_seq;
CREATE SEQUENCE IF NOT EXISTS public.restaurantes_id_restaurante_seq;
CREATE SEQUENCE IF NOT EXISTS public.roles_admin_id_rol_seq;
CREATE SEQUENCE IF NOT EXISTS public.servicios_restaurante_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.solicitudes_demo_id_solicitud_seq;
CREATE SEQUENCE IF NOT EXISTS public.soporte_tickets_id_ticket_seq;
CREATE SEQUENCE IF NOT EXISTS public.stock_sucursal_id_stock_sucursal_seq;
CREATE SEQUENCE IF NOT EXISTS public.sucursales_id_sucursal_seq;
CREATE SEQUENCE IF NOT EXISTS public.suscripciones_id_suscripcion_seq;
CREATE SEQUENCE IF NOT EXISTS public.system_tasks_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.testimonios_web_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.transferencias_almacen_id_transferencia_seq;
CREATE SEQUENCE IF NOT EXISTS public.user_sessions_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.uso_recursos_id_uso_seq;
CREATE SEQUENCE IF NOT EXISTS public.vendedores_id_vendedor_seq;
CREATE SEQUENCE IF NOT EXISTS public.ventas_id_venta_seq;

-- TABLAS
-- Tabla: public.admin_users
CREATE TABLE IF NOT EXISTS public.admin_users ();
-- Tabla: public.alertas_inventario
CREATE TABLE IF NOT EXISTS public.alertas_inventario ();
-- Tabla: public.alertas_limites
CREATE TABLE IF NOT EXISTS public.alertas_limites ();
-- Tabla: public.archivos_egresos
CREATE TABLE IF NOT EXISTS public.archivos_egresos ();
-- Tabla: public.arqueos_caja
CREATE TABLE IF NOT EXISTS public.arqueos_caja ();
-- Tabla: public.auditoria_admin
CREATE TABLE IF NOT EXISTS public.auditoria_admin ();
-- Tabla: public.auditoria_planes
CREATE TABLE IF NOT EXISTS public.auditoria_planes ();
-- Tabla: public.auditoria_pos
CREATE TABLE IF NOT EXISTS public.auditoria_pos ();
-- Tabla: public.casos_exito
CREATE TABLE IF NOT EXISTS public.casos_exito ();
-- Tabla: public.categorias
CREATE TABLE IF NOT EXISTS public.categorias ();
-- Tabla: public.categorias_almacen
CREATE TABLE IF NOT EXISTS public.categorias_almacen ();
-- Tabla: public.categorias_egresos
CREATE TABLE IF NOT EXISTS public.categorias_egresos ();
-- Tabla: public.clientes
CREATE TABLE IF NOT EXISTS public.clientes ();
-- Tabla: public.configuracion_web
CREATE TABLE IF NOT EXISTS public.configuracion_web ();
-- Tabla: public.configuraciones_restaurante
CREATE TABLE IF NOT EXISTS public.configuraciones_restaurante ();
-- Tabla: public.configuraciones_sistema
CREATE TABLE IF NOT EXISTS public.configuraciones_sistema ();
-- Tabla: public.contadores_uso
CREATE TABLE IF NOT EXISTS public.contadores_uso ();
-- Tabla: public.contenido_web
CREATE TABLE IF NOT EXISTS public.contenido_web ();
-- Tabla: public.conversion_events
CREATE TABLE IF NOT EXISTS public.conversion_events ();
-- Tabla: public.demos_reuniones
CREATE TABLE IF NOT EXISTS public.demos_reuniones ();
-- Tabla: public.detalle_ventas
CREATE TABLE IF NOT EXISTS public.detalle_ventas ();
-- Tabla: public.detalle_ventas_modificadores
CREATE TABLE IF NOT EXISTS public.detalle_ventas_modificadores ();
-- Tabla: public.dim_tiempo
CREATE TABLE IF NOT EXISTS public.dim_tiempo ();
-- Tabla: public.egresos
CREATE TABLE IF NOT EXISTS public.egresos ();
-- Tabla: public.facturas
CREATE TABLE IF NOT EXISTS public.facturas ();
-- Tabla: public.flujo_aprobaciones_egresos
CREATE TABLE IF NOT EXISTS public.flujo_aprobaciones_egresos ();
-- Tabla: public.grupos_mesas
CREATE TABLE IF NOT EXISTS public.grupos_mesas ();
-- Tabla: public.historial_pagos_diferidos
CREATE TABLE IF NOT EXISTS public.historial_pagos_diferidos ();
-- Tabla: public.integrity_logs
CREATE TABLE IF NOT EXISTS public.integrity_logs ();
-- Tabla: public.inventario_lotes
CREATE TABLE IF NOT EXISTS public.inventario_lotes ();
-- Tabla: public.leads_prospectos
CREATE TABLE IF NOT EXISTS public.leads_prospectos ();
-- Tabla: public.mesas
CREATE TABLE IF NOT EXISTS public.mesas ();
-- Tabla: public.mesas_en_grupo
CREATE TABLE IF NOT EXISTS public.mesas_en_grupo ();
-- Tabla: public.metodos_pago
CREATE TABLE IF NOT EXISTS public.metodos_pago ();
-- Tabla: public.metodos_pago_backup
CREATE TABLE IF NOT EXISTS public.metodos_pago_backup ();
-- Tabla: public.metricas_web
CREATE TABLE IF NOT EXISTS public.metricas_web ();
-- Tabla: public.migrations
CREATE TABLE IF NOT EXISTS public.migrations ();
-- Tabla: public.movimientos_inventario
CREATE TABLE IF NOT EXISTS public.movimientos_inventario ();
-- Tabla: public.newsletter_suscriptores
CREATE TABLE IF NOT EXISTS public.newsletter_suscriptores ();
-- Tabla: public.pagos_diferidos
CREATE TABLE IF NOT EXISTS public.pagos_diferidos ();
-- Tabla: public.pagos_restaurantes
CREATE TABLE IF NOT EXISTS public.pagos_restaurantes ();
-- Tabla: public.planes
CREATE TABLE IF NOT EXISTS public.planes ();
-- Tabla: public.planes_pos
CREATE TABLE IF NOT EXISTS public.planes_pos ();
-- Tabla: public.prefacturas
CREATE TABLE IF NOT EXISTS public.prefacturas ();
-- Tabla: public.presupuestos_egresos
CREATE TABLE IF NOT EXISTS public.presupuestos_egresos ();
-- Tabla: public.productos
CREATE TABLE IF NOT EXISTS public.productos ();
-- Tabla: public.productos_modificadores
CREATE TABLE IF NOT EXISTS public.productos_modificadores ();
-- Tabla: public.promociones
CREATE TABLE IF NOT EXISTS public.promociones ();
-- Tabla: public.promociones_sucursales
CREATE TABLE IF NOT EXISTS public.promociones_sucursales ();
-- Tabla: public.reservas
CREATE TABLE IF NOT EXISTS public.reservas ();
-- Tabla: public.restaurantes
CREATE TABLE IF NOT EXISTS public.restaurantes ();
-- Tabla: public.roles_admin
CREATE TABLE IF NOT EXISTS public.roles_admin ();
-- Tabla: public.servicios_restaurante
CREATE TABLE IF NOT EXISTS public.servicios_restaurante ();
-- Tabla: public.solicitudes_demo
CREATE TABLE IF NOT EXISTS public.solicitudes_demo ();
-- Tabla: public.soporte_tickets
CREATE TABLE IF NOT EXISTS public.soporte_tickets ();
-- Tabla: public.stock_sucursal
CREATE TABLE IF NOT EXISTS public.stock_sucursal ();
-- Tabla: public.sucursales
CREATE TABLE IF NOT EXISTS public.sucursales ();
-- Tabla: public.suscripciones
CREATE TABLE IF NOT EXISTS public.suscripciones ();
-- Tabla: public.system_tasks
CREATE TABLE IF NOT EXISTS public.system_tasks ();
-- Tabla: public.testimonios_web
CREATE TABLE IF NOT EXISTS public.testimonios_web ();
-- Tabla: public.transferencias_almacen
CREATE TABLE IF NOT EXISTS public.transferencias_almacen ();
-- Tabla: public.user_sessions
CREATE TABLE IF NOT EXISTS public.user_sessions ();
-- Tabla: public.uso_recursos
CREATE TABLE IF NOT EXISTS public.uso_recursos ();
-- Tabla: public.vendedores
CREATE TABLE IF NOT EXISTS public.vendedores ();
-- Tabla: public.ventas
CREATE TABLE IF NOT EXISTS public.ventas ();

-- COLUMNAS

-- Columnas de public.admin_users
ALTER TABLE public.admin_users ADD COLUMN IF NOT EXISTS id integer DEFAULT nextval('admin_users_id_seq'::regclass) NOT NULL;
ALTER TABLE public.admin_users ADD COLUMN IF NOT EXISTS username character varying(50) NOT NULL;
ALTER TABLE public.admin_users ADD COLUMN IF NOT EXISTS password_hash character varying(255) NOT NULL;
ALTER TABLE public.admin_users ADD COLUMN IF NOT EXISTS nombre character varying(100) NOT NULL;
ALTER TABLE public.admin_users ADD COLUMN IF NOT EXISTS activo boolean DEFAULT true;
ALTER TABLE public.admin_users ADD COLUMN IF NOT EXISTS creado_en timestamp without time zone DEFAULT now();
ALTER TABLE public.admin_users ADD COLUMN IF NOT EXISTS actualizado_en timestamp without time zone DEFAULT now();

-- Columnas de public.alertas_inventario
ALTER TABLE public.alertas_inventario ADD COLUMN IF NOT EXISTS id_alerta integer DEFAULT nextval('alertas_inventario_id_alerta_seq'::regclass) NOT NULL;
ALTER TABLE public.alertas_inventario ADD COLUMN IF NOT EXISTS id_producto integer NOT NULL;
ALTER TABLE public.alertas_inventario ADD COLUMN IF NOT EXISTS id_lote integer;
ALTER TABLE public.alertas_inventario ADD COLUMN IF NOT EXISTS tipo_alerta character varying(50) NOT NULL;
ALTER TABLE public.alertas_inventario ADD COLUMN IF NOT EXISTS mensaje text NOT NULL;
ALTER TABLE public.alertas_inventario ADD COLUMN IF NOT EXISTS nivel_urgencia character varying(20) NOT NULL;
ALTER TABLE public.alertas_inventario ADD COLUMN IF NOT EXISTS resuelta boolean DEFAULT false;
ALTER TABLE public.alertas_inventario ADD COLUMN IF NOT EXISTS fecha_creacion timestamp without time zone DEFAULT now();
ALTER TABLE public.alertas_inventario ADD COLUMN IF NOT EXISTS fecha_resolucion timestamp without time zone;
ALTER TABLE public.alertas_inventario ADD COLUMN IF NOT EXISTS id_restaurante integer NOT NULL;

-- Columnas de public.alertas_limites
ALTER TABLE public.alertas_limites ADD COLUMN IF NOT EXISTS id_alerta integer DEFAULT nextval('alertas_limites_id_alerta_seq'::regclass) NOT NULL;
ALTER TABLE public.alertas_limites ADD COLUMN IF NOT EXISTS id_restaurante integer NOT NULL;
ALTER TABLE public.alertas_limites ADD COLUMN IF NOT EXISTS id_plan integer NOT NULL;
ALTER TABLE public.alertas_limites ADD COLUMN IF NOT EXISTS tipo_alerta character varying(20) NOT NULL;
ALTER TABLE public.alertas_limites ADD COLUMN IF NOT EXISTS recurso character varying(30) NOT NULL;
ALTER TABLE public.alertas_limites ADD COLUMN IF NOT EXISTS valor_actual integer NOT NULL;
ALTER TABLE public.alertas_limites ADD COLUMN IF NOT EXISTS valor_limite integer NOT NULL;
ALTER TABLE public.alertas_limites ADD COLUMN IF NOT EXISTS porcentaje_uso numeric(5,2) NOT NULL;
ALTER TABLE public.alertas_limites ADD COLUMN IF NOT EXISTS estado character varying(20) DEFAULT 'pendiente'::character varying;
ALTER TABLE public.alertas_limites ADD COLUMN IF NOT EXISTS fecha_alerta timestamp without time zone DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE public.alertas_limites ADD COLUMN IF NOT EXISTS fecha_resolucion timestamp without time zone;
ALTER TABLE public.alertas_limites ADD COLUMN IF NOT EXISTS mensaje text;
ALTER TABLE public.alertas_limites ADD COLUMN IF NOT EXISTS datos_adicionales jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.alertas_limites ADD COLUMN IF NOT EXISTS nivel_urgencia character varying(20) DEFAULT 'medio'::character varying;

-- Columnas de public.archivos_egresos
ALTER TABLE public.archivos_egresos ADD COLUMN IF NOT EXISTS id_archivo integer DEFAULT nextval('archivos_egresos_id_archivo_seq'::regclass) NOT NULL;
ALTER TABLE public.archivos_egresos ADD COLUMN IF NOT EXISTS id_egreso integer NOT NULL;
ALTER TABLE public.archivos_egresos ADD COLUMN IF NOT EXISTS nombre_archivo character varying(255) NOT NULL;
ALTER TABLE public.archivos_egresos ADD COLUMN IF NOT EXISTS ruta_archivo character varying(500) NOT NULL;
ALTER TABLE public.archivos_egresos ADD COLUMN IF NOT EXISTS tipo_archivo character varying(50);
ALTER TABLE public.archivos_egresos ADD COLUMN IF NOT EXISTS tamaño_archivo integer;
ALTER TABLE public.archivos_egresos ADD COLUMN IF NOT EXISTS subido_por integer NOT NULL;
ALTER TABLE public.archivos_egresos ADD COLUMN IF NOT EXISTS fecha_subida timestamp without time zone DEFAULT now();

-- Columnas de public.arqueos_caja
ALTER TABLE public.arqueos_caja ADD COLUMN IF NOT EXISTS id_arqueo integer DEFAULT nextval('arqueos_caja_id_arqueo_seq'::regclass) NOT NULL;
ALTER TABLE public.arqueos_caja ADD COLUMN IF NOT EXISTS id_restaurante integer NOT NULL;
ALTER TABLE public.arqueos_caja ADD COLUMN IF NOT EXISTS id_sucursal integer;
ALTER TABLE public.arqueos_caja ADD COLUMN IF NOT EXISTS id_vendedor integer;
ALTER TABLE public.arqueos_caja ADD COLUMN IF NOT EXISTS monto_inicial numeric(12,2) NOT NULL;
ALTER TABLE public.arqueos_caja ADD COLUMN IF NOT EXISTS fecha_apertura timestamp without time zone DEFAULT now() NOT NULL;
ALTER TABLE public.arqueos_caja ADD COLUMN IF NOT EXISTS monto_final numeric(12,2);
ALTER TABLE public.arqueos_caja ADD COLUMN IF NOT EXISTS fecha_cierre timestamp without time zone;
ALTER TABLE public.arqueos_caja ADD COLUMN IF NOT EXISTS diferencia numeric(12,2);
ALTER TABLE public.arqueos_caja ADD COLUMN IF NOT EXISTS estado character varying(20) DEFAULT 'abierto'::character varying NOT NULL;
ALTER TABLE public.arqueos_caja ADD COLUMN IF NOT EXISTS observaciones text;

-- Columnas de public.auditoria_admin
ALTER TABLE public.auditoria_admin ADD COLUMN IF NOT EXISTS id_auditoria integer DEFAULT nextval('auditoria_admin_id_auditoria_seq'::regclass) NOT NULL;
ALTER TABLE public.auditoria_admin ADD COLUMN IF NOT EXISTS id_usuario integer;
ALTER TABLE public.auditoria_admin ADD COLUMN IF NOT EXISTS accion character varying(64);
ALTER TABLE public.auditoria_admin ADD COLUMN IF NOT EXISTS tabla_afectada character varying(32);
ALTER TABLE public.auditoria_admin ADD COLUMN IF NOT EXISTS id_registro integer;
ALTER TABLE public.auditoria_admin ADD COLUMN IF NOT EXISTS datos_anteriores jsonb;
ALTER TABLE public.auditoria_admin ADD COLUMN IF NOT EXISTS datos_nuevos jsonb;
ALTER TABLE public.auditoria_admin ADD COLUMN IF NOT EXISTS fecha_accion timestamp without time zone DEFAULT CURRENT_TIMESTAMP;

-- Columnas de public.auditoria_planes
ALTER TABLE public.auditoria_planes ADD COLUMN IF NOT EXISTS id_auditoria integer DEFAULT nextval('auditoria_planes_id_auditoria_seq'::regclass) NOT NULL;
ALTER TABLE public.auditoria_planes ADD COLUMN IF NOT EXISTS id_restaurante integer NOT NULL;
ALTER TABLE public.auditoria_planes ADD COLUMN IF NOT EXISTS id_plan_anterior integer;
ALTER TABLE public.auditoria_planes ADD COLUMN IF NOT EXISTS id_plan_nuevo integer NOT NULL;
ALTER TABLE public.auditoria_planes ADD COLUMN IF NOT EXISTS tipo_cambio character varying(20) NOT NULL;
ALTER TABLE public.auditoria_planes ADD COLUMN IF NOT EXISTS motivo text;
ALTER TABLE public.auditoria_planes ADD COLUMN IF NOT EXISTS id_usuario_cambio integer;
ALTER TABLE public.auditoria_planes ADD COLUMN IF NOT EXISTS nombre_usuario character varying(100);
ALTER TABLE public.auditoria_planes ADD COLUMN IF NOT EXISTS fecha_cambio timestamp without time zone DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE public.auditoria_planes ADD COLUMN IF NOT EXISTS fecha_efectiva date DEFAULT CURRENT_DATE;
ALTER TABLE public.auditoria_planes ADD COLUMN IF NOT EXISTS datos_adicionales jsonb DEFAULT '{}'::jsonb;

-- Columnas de public.auditoria_pos
ALTER TABLE public.auditoria_pos ADD COLUMN IF NOT EXISTS id_auditoria bigint DEFAULT nextval('auditoria_pos_id_auditoria_seq'::regclass) NOT NULL;
ALTER TABLE public.auditoria_pos ADD COLUMN IF NOT EXISTS id_vendedor integer;
ALTER TABLE public.auditoria_pos ADD COLUMN IF NOT EXISTS accion character varying(64) NOT NULL;
ALTER TABLE public.auditoria_pos ADD COLUMN IF NOT EXISTS tabla_afectada character varying(64) NOT NULL;
ALTER TABLE public.auditoria_pos ADD COLUMN IF NOT EXISTS id_registro bigint;
ALTER TABLE public.auditoria_pos ADD COLUMN IF NOT EXISTS datos_anteriores jsonb;
ALTER TABLE public.auditoria_pos ADD COLUMN IF NOT EXISTS datos_nuevos jsonb;
ALTER TABLE public.auditoria_pos ADD COLUMN IF NOT EXISTS fecha_accion timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE public.auditoria_pos ADD COLUMN IF NOT EXISTS id_restaurante integer;
ALTER TABLE public.auditoria_pos ADD COLUMN IF NOT EXISTS ip_origen inet;
ALTER TABLE public.auditoria_pos ADD COLUMN IF NOT EXISTS user_agent character varying(256);
ALTER TABLE public.auditoria_pos ADD COLUMN IF NOT EXISTS descripcion text;
ALTER TABLE public.auditoria_pos ADD COLUMN IF NOT EXISTS exito boolean DEFAULT true;
ALTER TABLE public.auditoria_pos ADD COLUMN IF NOT EXISTS error_msg text;

-- Columnas de public.casos_exito
ALTER TABLE public.casos_exito ADD COLUMN IF NOT EXISTS id integer DEFAULT nextval('casos_exito_id_seq'::regclass) NOT NULL;
ALTER TABLE public.casos_exito ADD COLUMN IF NOT EXISTS nombre_restaurante character varying(100) NOT NULL;
ALTER TABLE public.casos_exito ADD COLUMN IF NOT EXISTS logo_url character varying(255);
ALTER TABLE public.casos_exito ADD COLUMN IF NOT EXISTS tipo_restaurante character varying(50);
ALTER TABLE public.casos_exito ADD COLUMN IF NOT EXISTS ciudad character varying(50);
ALTER TABLE public.casos_exito ADD COLUMN IF NOT EXISTS sucursales integer DEFAULT 1;
ALTER TABLE public.casos_exito ADD COLUMN IF NOT EXISTS tiempo_uso_meses integer;
ALTER TABLE public.casos_exito ADD COLUMN IF NOT EXISTS testimonio text;
ALTER TABLE public.casos_exito ADD COLUMN IF NOT EXISTS nombre_contacto character varying(100);
ALTER TABLE public.casos_exito ADD COLUMN IF NOT EXISTS cargo_contacto character varying(50);
ALTER TABLE public.casos_exito ADD COLUMN IF NOT EXISTS foto_contacto character varying(255);
ALTER TABLE public.casos_exito ADD COLUMN IF NOT EXISTS video_testimonio character varying(255);
ALTER TABLE public.casos_exito ADD COLUMN IF NOT EXISTS metricas_antes jsonb;
ALTER TABLE public.casos_exito ADD COLUMN IF NOT EXISTS metricas_despues jsonb;
ALTER TABLE public.casos_exito ADD COLUMN IF NOT EXISTS mejoras_especificas ARRAY;
ALTER TABLE public.casos_exito ADD COLUMN IF NOT EXISTS plan_contratado character varying(50);
ALTER TABLE public.casos_exito ADD COLUMN IF NOT EXISTS fecha_implementacion date;
ALTER TABLE public.casos_exito ADD COLUMN IF NOT EXISTS activo boolean DEFAULT true;
ALTER TABLE public.casos_exito ADD COLUMN IF NOT EXISTS destacado boolean DEFAULT false;
ALTER TABLE public.casos_exito ADD COLUMN IF NOT EXISTS orden_display integer DEFAULT 0;
ALTER TABLE public.casos_exito ADD COLUMN IF NOT EXISTS created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE public.casos_exito ADD COLUMN IF NOT EXISTS updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP;

-- Columnas de public.categorias
ALTER TABLE public.categorias ADD COLUMN IF NOT EXISTS id_categoria integer DEFAULT nextval('categorias_id_categoria_seq'::regclass) NOT NULL;
ALTER TABLE public.categorias ADD COLUMN IF NOT EXISTS nombre character varying(100) NOT NULL;
ALTER TABLE public.categorias ADD COLUMN IF NOT EXISTS activo boolean DEFAULT true;
ALTER TABLE public.categorias ADD COLUMN IF NOT EXISTS created_at timestamp without time zone DEFAULT now();
ALTER TABLE public.categorias ADD COLUMN IF NOT EXISTS id_restaurante integer DEFAULT 1 NOT NULL;

-- Columnas de public.categorias_almacen
ALTER TABLE public.categorias_almacen ADD COLUMN IF NOT EXISTS id_categoria_almacen integer DEFAULT nextval('categorias_almacen_id_categoria_almacen_seq'::regclass) NOT NULL;
ALTER TABLE public.categorias_almacen ADD COLUMN IF NOT EXISTS nombre character varying(100) NOT NULL;
ALTER TABLE public.categorias_almacen ADD COLUMN IF NOT EXISTS descripcion text;
ALTER TABLE public.categorias_almacen ADD COLUMN IF NOT EXISTS tipo_almacen character varying(50) NOT NULL;
ALTER TABLE public.categorias_almacen ADD COLUMN IF NOT EXISTS condiciones_especiales text;
ALTER TABLE public.categorias_almacen ADD COLUMN IF NOT EXISTS rotacion_recomendada character varying(50);
ALTER TABLE public.categorias_almacen ADD COLUMN IF NOT EXISTS id_restaurante integer NOT NULL;
ALTER TABLE public.categorias_almacen ADD COLUMN IF NOT EXISTS activo boolean DEFAULT true;
ALTER TABLE public.categorias_almacen ADD COLUMN IF NOT EXISTS created_at timestamp without time zone DEFAULT now();
ALTER TABLE public.categorias_almacen ADD COLUMN IF NOT EXISTS updated_at timestamp without time zone DEFAULT now();

-- Columnas de public.categorias_egresos
ALTER TABLE public.categorias_egresos ADD COLUMN IF NOT EXISTS id_categoria_egreso integer DEFAULT nextval('categorias_egresos_id_categoria_egreso_seq'::regclass) NOT NULL;
ALTER TABLE public.categorias_egresos ADD COLUMN IF NOT EXISTS nombre character varying(100) NOT NULL;
ALTER TABLE public.categorias_egresos ADD COLUMN IF NOT EXISTS descripcion text;
ALTER TABLE public.categorias_egresos ADD COLUMN IF NOT EXISTS color character varying(7) DEFAULT '#6B7280'::character varying;
ALTER TABLE public.categorias_egresos ADD COLUMN IF NOT EXISTS icono character varying(50) DEFAULT 'DollarSign'::character varying;
ALTER TABLE public.categorias_egresos ADD COLUMN IF NOT EXISTS activo boolean DEFAULT true;
ALTER TABLE public.categorias_egresos ADD COLUMN IF NOT EXISTS id_restaurante integer NOT NULL;
ALTER TABLE public.categorias_egresos ADD COLUMN IF NOT EXISTS created_at timestamp without time zone DEFAULT now();
ALTER TABLE public.categorias_egresos ADD COLUMN IF NOT EXISTS updated_at timestamp without time zone DEFAULT now();

-- Columnas de public.clientes
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS id_cliente integer DEFAULT nextval('clientes_id_cliente_seq'::regclass) NOT NULL;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS nombre character varying(150);
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS telefono character varying(20);
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS email character varying(100);
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS fecha_registro timestamp without time zone DEFAULT now();

-- Columnas de public.configuracion_web
ALTER TABLE public.configuracion_web ADD COLUMN IF NOT EXISTS id integer DEFAULT nextval('configuracion_web_id_seq'::regclass) NOT NULL;
ALTER TABLE public.configuracion_web ADD COLUMN IF NOT EXISTS clave character varying(100) NOT NULL;
ALTER TABLE public.configuracion_web ADD COLUMN IF NOT EXISTS valor text;
ALTER TABLE public.configuracion_web ADD COLUMN IF NOT EXISTS descripcion text;
ALTER TABLE public.configuracion_web ADD COLUMN IF NOT EXISTS tipo character varying(30);
ALTER TABLE public.configuracion_web ADD COLUMN IF NOT EXISTS seccion character varying(50);
ALTER TABLE public.configuracion_web ADD COLUMN IF NOT EXISTS created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE public.configuracion_web ADD COLUMN IF NOT EXISTS updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP;

-- Columnas de public.configuraciones_restaurante
ALTER TABLE public.configuraciones_restaurante ADD COLUMN IF NOT EXISTS id_config integer DEFAULT nextval('configuraciones_restaurante_id_config_seq'::regclass) NOT NULL;
ALTER TABLE public.configuraciones_restaurante ADD COLUMN IF NOT EXISTS id_restaurante integer NOT NULL;
ALTER TABLE public.configuraciones_restaurante ADD COLUMN IF NOT EXISTS clave_config text NOT NULL;
ALTER TABLE public.configuraciones_restaurante ADD COLUMN IF NOT EXISTS valor_config jsonb NOT NULL;

-- Columnas de public.configuraciones_sistema
ALTER TABLE public.configuraciones_sistema ADD COLUMN IF NOT EXISTS clave_config character varying(100) NOT NULL;
ALTER TABLE public.configuraciones_sistema ADD COLUMN IF NOT EXISTS valor_config jsonb DEFAULT '{}'::jsonb NOT NULL;
ALTER TABLE public.configuraciones_sistema ADD COLUMN IF NOT EXISTS creado_en timestamp without time zone DEFAULT now();
ALTER TABLE public.configuraciones_sistema ADD COLUMN IF NOT EXISTS actualizado_en timestamp without time zone DEFAULT now();

-- Columnas de public.contadores_uso
ALTER TABLE public.contadores_uso ADD COLUMN IF NOT EXISTS id_contador integer DEFAULT nextval('contadores_uso_id_contador_seq'::regclass) NOT NULL;
ALTER TABLE public.contadores_uso ADD COLUMN IF NOT EXISTS id_restaurante integer NOT NULL;
ALTER TABLE public.contadores_uso ADD COLUMN IF NOT EXISTS id_plan integer NOT NULL;
ALTER TABLE public.contadores_uso ADD COLUMN IF NOT EXISTS recurso character varying(50) NOT NULL;
ALTER TABLE public.contadores_uso ADD COLUMN IF NOT EXISTS uso_actual integer DEFAULT 0;
ALTER TABLE public.contadores_uso ADD COLUMN IF NOT EXISTS limite_plan integer NOT NULL;
ALTER TABLE public.contadores_uso ADD COLUMN IF NOT EXISTS fecha_medicion date DEFAULT CURRENT_DATE;
ALTER TABLE public.contadores_uso ADD COLUMN IF NOT EXISTS created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE public.contadores_uso ADD COLUMN IF NOT EXISTS updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP;

-- Columnas de public.contenido_web
ALTER TABLE public.contenido_web ADD COLUMN IF NOT EXISTS id integer DEFAULT nextval('contenido_web_id_seq'::regclass) NOT NULL;
ALTER TABLE public.contenido_web ADD COLUMN IF NOT EXISTS titulo character varying(200) NOT NULL;
ALTER TABLE public.contenido_web ADD COLUMN IF NOT EXISTS slug character varying(200) NOT NULL;
ALTER TABLE public.contenido_web ADD COLUMN IF NOT EXISTS contenido text;
ALTER TABLE public.contenido_web ADD COLUMN IF NOT EXISTS resumen text;
ALTER TABLE public.contenido_web ADD COLUMN IF NOT EXISTS imagen_portada character varying(255);
ALTER TABLE public.contenido_web ADD COLUMN IF NOT EXISTS tipo_contenido character varying(30);
ALTER TABLE public.contenido_web ADD COLUMN IF NOT EXISTS autor character varying(100);
ALTER TABLE public.contenido_web ADD COLUMN IF NOT EXISTS tags ARRAY;
ALTER TABLE public.contenido_web ADD COLUMN IF NOT EXISTS estado character varying(20) DEFAULT 'borrador'::character varying;
ALTER TABLE public.contenido_web ADD COLUMN IF NOT EXISTS fecha_publicacion timestamp without time zone;
ALTER TABLE public.contenido_web ADD COLUMN IF NOT EXISTS fecha_modificacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE public.contenido_web ADD COLUMN IF NOT EXISTS meta_title character varying(200);
ALTER TABLE public.contenido_web ADD COLUMN IF NOT EXISTS meta_description text;
ALTER TABLE public.contenido_web ADD COLUMN IF NOT EXISTS created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE public.contenido_web ADD COLUMN IF NOT EXISTS updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP;

-- Columnas de public.conversion_events
ALTER TABLE public.conversion_events ADD COLUMN IF NOT EXISTS id integer DEFAULT nextval('conversion_events_id_seq'::regclass) NOT NULL;
ALTER TABLE public.conversion_events ADD COLUMN IF NOT EXISTS event_type character varying(50) NOT NULL;
ALTER TABLE public.conversion_events ADD COLUMN IF NOT EXISTS timestamp timestamp without time zone NOT NULL;
ALTER TABLE public.conversion_events ADD COLUMN IF NOT EXISTS plan_name character varying(50);
ALTER TABLE public.conversion_events ADD COLUMN IF NOT EXISTS user_agent text;
ALTER TABLE public.conversion_events ADD COLUMN IF NOT EXISTS referrer text;
ALTER TABLE public.conversion_events ADD COLUMN IF NOT EXISTS session_id character varying(100);
ALTER TABLE public.conversion_events ADD COLUMN IF NOT EXISTS ip_address inet;
ALTER TABLE public.conversion_events ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.conversion_events ADD COLUMN IF NOT EXISTS created_at timestamp without time zone DEFAULT now();

-- Columnas de public.demos_reuniones
ALTER TABLE public.demos_reuniones ADD COLUMN IF NOT EXISTS id integer DEFAULT nextval('demos_reuniones_id_seq'::regclass) NOT NULL;
ALTER TABLE public.demos_reuniones ADD COLUMN IF NOT EXISTS lead_id integer;
ALTER TABLE public.demos_reuniones ADD COLUMN IF NOT EXISTS tipo_reunion character varying(30);
ALTER TABLE public.demos_reuniones ADD COLUMN IF NOT EXISTS fecha_programada timestamp without time zone NOT NULL;
ALTER TABLE public.demos_reuniones ADD COLUMN IF NOT EXISTS duracion_minutos integer DEFAULT 60;
ALTER TABLE public.demos_reuniones ADD COLUMN IF NOT EXISTS plataforma character varying(50);
ALTER TABLE public.demos_reuniones ADD COLUMN IF NOT EXISTS link_reunion character varying(255);
ALTER TABLE public.demos_reuniones ADD COLUMN IF NOT EXISTS estado character varying(30) DEFAULT 'programada'::character varying;
ALTER TABLE public.demos_reuniones ADD COLUMN IF NOT EXISTS notas_pre_reunion text;
ALTER TABLE public.demos_reuniones ADD COLUMN IF NOT EXISTS notas_post_reunion text;
ALTER TABLE public.demos_reuniones ADD COLUMN IF NOT EXISTS resultado character varying(30);
ALTER TABLE public.demos_reuniones ADD COLUMN IF NOT EXISTS proximo_seguimiento timestamp without time zone;
ALTER TABLE public.demos_reuniones ADD COLUMN IF NOT EXISTS created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE public.demos_reuniones ADD COLUMN IF NOT EXISTS updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP;

-- Columnas de public.detalle_ventas
ALTER TABLE public.detalle_ventas ADD COLUMN IF NOT EXISTS id_detalle integer DEFAULT nextval('detalle_ventas_id_detalle_seq'::regclass) NOT NULL;
ALTER TABLE public.detalle_ventas ADD COLUMN IF NOT EXISTS id_venta integer;
ALTER TABLE public.detalle_ventas ADD COLUMN IF NOT EXISTS id_producto integer;
ALTER TABLE public.detalle_ventas ADD COLUMN IF NOT EXISTS cantidad integer NOT NULL;
ALTER TABLE public.detalle_ventas ADD COLUMN IF NOT EXISTS precio_unitario numeric(10,2) NOT NULL;
ALTER TABLE public.detalle_ventas ADD COLUMN IF NOT EXISTS subtotal numeric(10,2);
ALTER TABLE public.detalle_ventas ADD COLUMN IF NOT EXISTS observaciones text;
ALTER TABLE public.detalle_ventas ADD COLUMN IF NOT EXISTS created_at timestamp without time zone DEFAULT now();
ALTER TABLE public.detalle_ventas ADD COLUMN IF NOT EXISTS id_restaurante integer DEFAULT 1 NOT NULL;

-- Columnas de public.detalle_ventas_modificadores
ALTER TABLE public.detalle_ventas_modificadores ADD COLUMN IF NOT EXISTS id_detalle_venta integer NOT NULL;
ALTER TABLE public.detalle_ventas_modificadores ADD COLUMN IF NOT EXISTS id_modificador integer NOT NULL;
ALTER TABLE public.detalle_ventas_modificadores ADD COLUMN IF NOT EXISTS precio_aplicado numeric(10,2) DEFAULT 0.00;
ALTER TABLE public.detalle_ventas_modificadores ADD COLUMN IF NOT EXISTS created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP;

-- Columnas de public.dim_tiempo
ALTER TABLE public.dim_tiempo ADD COLUMN IF NOT EXISTS id_tiempo integer DEFAULT nextval('dim_tiempo_id_tiempo_seq'::regclass) NOT NULL;
ALTER TABLE public.dim_tiempo ADD COLUMN IF NOT EXISTS fecha date NOT NULL;
ALTER TABLE public.dim_tiempo ADD COLUMN IF NOT EXISTS dia integer NOT NULL;
ALTER TABLE public.dim_tiempo ADD COLUMN IF NOT EXISTS mes integer NOT NULL;
ALTER TABLE public.dim_tiempo ADD COLUMN IF NOT EXISTS anio integer NOT NULL;
ALTER TABLE public.dim_tiempo ADD COLUMN IF NOT EXISTS nombre_mes character varying(20) NOT NULL;
ALTER TABLE public.dim_tiempo ADD COLUMN IF NOT EXISTS nombre_dia character varying(20) NOT NULL;
ALTER TABLE public.dim_tiempo ADD COLUMN IF NOT EXISTS es_fin_de_semana boolean NOT NULL;
ALTER TABLE public.dim_tiempo ADD COLUMN IF NOT EXISTS turno character varying(10) NOT NULL;

-- Columnas de public.egresos
ALTER TABLE public.egresos ADD COLUMN IF NOT EXISTS id_egreso integer DEFAULT nextval('egresos_id_egreso_seq'::regclass) NOT NULL;
ALTER TABLE public.egresos ADD COLUMN IF NOT EXISTS concepto character varying(200) NOT NULL;
ALTER TABLE public.egresos ADD COLUMN IF NOT EXISTS descripcion text;
ALTER TABLE public.egresos ADD COLUMN IF NOT EXISTS monto numeric(12,2) NOT NULL;
ALTER TABLE public.egresos ADD COLUMN IF NOT EXISTS fecha_egreso date DEFAULT CURRENT_DATE NOT NULL;
ALTER TABLE public.egresos ADD COLUMN IF NOT EXISTS id_categoria_egreso integer NOT NULL;
ALTER TABLE public.egresos ADD COLUMN IF NOT EXISTS metodo_pago character varying(50) DEFAULT 'efectivo'::character varying NOT NULL;
ALTER TABLE public.egresos ADD COLUMN IF NOT EXISTS proveedor_nombre character varying(150);
ALTER TABLE public.egresos ADD COLUMN IF NOT EXISTS proveedor_documento character varying(50);
ALTER TABLE public.egresos ADD COLUMN IF NOT EXISTS proveedor_telefono character varying(20);
ALTER TABLE public.egresos ADD COLUMN IF NOT EXISTS proveedor_email character varying(100);
ALTER TABLE public.egresos ADD COLUMN IF NOT EXISTS numero_factura character varying(50);
ALTER TABLE public.egresos ADD COLUMN IF NOT EXISTS numero_recibo character varying(50);
ALTER TABLE public.egresos ADD COLUMN IF NOT EXISTS numero_comprobante character varying(50);
ALTER TABLE public.egresos ADD COLUMN IF NOT EXISTS estado character varying(30) DEFAULT 'pendiente'::character varying;
ALTER TABLE public.egresos ADD COLUMN IF NOT EXISTS requiere_aprobacion boolean DEFAULT false;
ALTER TABLE public.egresos ADD COLUMN IF NOT EXISTS aprobado_por integer;
ALTER TABLE public.egresos ADD COLUMN IF NOT EXISTS fecha_aprobacion timestamp without time zone;
ALTER TABLE public.egresos ADD COLUMN IF NOT EXISTS comentario_aprobacion text;
ALTER TABLE public.egresos ADD COLUMN IF NOT EXISTS es_deducible boolean DEFAULT true;
ALTER TABLE public.egresos ADD COLUMN IF NOT EXISTS numero_autorizacion_fiscal character varying(50);
ALTER TABLE public.egresos ADD COLUMN IF NOT EXISTS codigo_control character varying(50);
ALTER TABLE public.egresos ADD COLUMN IF NOT EXISTS es_recurrente boolean DEFAULT false;
ALTER TABLE public.egresos ADD COLUMN IF NOT EXISTS frecuencia_recurrencia character varying(20);
ALTER TABLE public.egresos ADD COLUMN IF NOT EXISTS proxima_fecha_recurrencia date;
ALTER TABLE public.egresos ADD COLUMN IF NOT EXISTS archivos_adjuntos jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.egresos ADD COLUMN IF NOT EXISTS registrado_por integer NOT NULL;
ALTER TABLE public.egresos ADD COLUMN IF NOT EXISTS id_sucursal integer NOT NULL;
ALTER TABLE public.egresos ADD COLUMN IF NOT EXISTS id_restaurante integer NOT NULL;
ALTER TABLE public.egresos ADD COLUMN IF NOT EXISTS created_at timestamp without time zone DEFAULT now();
ALTER TABLE public.egresos ADD COLUMN IF NOT EXISTS updated_at timestamp without time zone DEFAULT now();

-- Columnas de public.facturas
ALTER TABLE public.facturas ADD COLUMN IF NOT EXISTS id_factura integer DEFAULT nextval('facturas_id_factura_seq'::regclass) NOT NULL;
ALTER TABLE public.facturas ADD COLUMN IF NOT EXISTS numero character varying(50) NOT NULL;
ALTER TABLE public.facturas ADD COLUMN IF NOT EXISTS nit_cliente character varying(20);
ALTER TABLE public.facturas ADD COLUMN IF NOT EXISTS razon_social character varying(200);
ALTER TABLE public.facturas ADD COLUMN IF NOT EXISTS total numeric(10,2);
ALTER TABLE public.facturas ADD COLUMN IF NOT EXISTS fecha timestamp without time zone DEFAULT now();
ALTER TABLE public.facturas ADD COLUMN IF NOT EXISTS id_venta integer;

-- Columnas de public.flujo_aprobaciones_egresos
ALTER TABLE public.flujo_aprobaciones_egresos ADD COLUMN IF NOT EXISTS id_flujo integer DEFAULT nextval('flujo_aprobaciones_egresos_id_flujo_seq'::regclass) NOT NULL;
ALTER TABLE public.flujo_aprobaciones_egresos ADD COLUMN IF NOT EXISTS id_egreso integer NOT NULL;
ALTER TABLE public.flujo_aprobaciones_egresos ADD COLUMN IF NOT EXISTS id_vendedor integer NOT NULL;
ALTER TABLE public.flujo_aprobaciones_egresos ADD COLUMN IF NOT EXISTS accion character varying(20) NOT NULL;
ALTER TABLE public.flujo_aprobaciones_egresos ADD COLUMN IF NOT EXISTS comentario text;
ALTER TABLE public.flujo_aprobaciones_egresos ADD COLUMN IF NOT EXISTS fecha_accion timestamp without time zone DEFAULT now();

-- Columnas de public.grupos_mesas
ALTER TABLE public.grupos_mesas ADD COLUMN IF NOT EXISTS id_grupo_mesa integer DEFAULT nextval('grupos_mesas_id_grupo_mesa_seq'::regclass) NOT NULL;
ALTER TABLE public.grupos_mesas ADD COLUMN IF NOT EXISTS id_restaurante integer NOT NULL;
ALTER TABLE public.grupos_mesas ADD COLUMN IF NOT EXISTS id_sucursal integer NOT NULL;
ALTER TABLE public.grupos_mesas ADD COLUMN IF NOT EXISTS id_venta_principal integer;
ALTER TABLE public.grupos_mesas ADD COLUMN IF NOT EXISTS estado character varying(50) DEFAULT 'ABIERTO'::character varying NOT NULL;
ALTER TABLE public.grupos_mesas ADD COLUMN IF NOT EXISTS created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE public.grupos_mesas ADD COLUMN IF NOT EXISTS updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE public.grupos_mesas ADD COLUMN IF NOT EXISTS id_mesero integer;

-- Columnas de public.historial_pagos_diferidos
ALTER TABLE public.historial_pagos_diferidos ADD COLUMN IF NOT EXISTS id_historial integer DEFAULT nextval('historial_pagos_diferidos_id_historial_seq'::regclass) NOT NULL;
ALTER TABLE public.historial_pagos_diferidos ADD COLUMN IF NOT EXISTS id_pago_diferido integer NOT NULL;
ALTER TABLE public.historial_pagos_diferidos ADD COLUMN IF NOT EXISTS id_venta integer NOT NULL;
ALTER TABLE public.historial_pagos_diferidos ADD COLUMN IF NOT EXISTS id_pago_final integer NOT NULL;
ALTER TABLE public.historial_pagos_diferidos ADD COLUMN IF NOT EXISTS monto_pagado numeric NOT NULL;
ALTER TABLE public.historial_pagos_diferidos ADD COLUMN IF NOT EXISTS fecha_pago timestamp without time zone DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE public.historial_pagos_diferidos ADD COLUMN IF NOT EXISTS id_vendedor integer NOT NULL;
ALTER TABLE public.historial_pagos_diferidos ADD COLUMN IF NOT EXISTS observaciones text;
ALTER TABLE public.historial_pagos_diferidos ADD COLUMN IF NOT EXISTS id_restaurante integer NOT NULL;
ALTER TABLE public.historial_pagos_diferidos ADD COLUMN IF NOT EXISTS created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE public.historial_pagos_diferidos ADD COLUMN IF NOT EXISTS procesado_por integer;

-- Columnas de public.integrity_logs
ALTER TABLE public.integrity_logs ADD COLUMN IF NOT EXISTS id integer DEFAULT nextval('integrity_logs_id_seq'::regclass) NOT NULL;
ALTER TABLE public.integrity_logs ADD COLUMN IF NOT EXISTS check_name character varying(100) NOT NULL;
ALTER TABLE public.integrity_logs ADD COLUMN IF NOT EXISTS status character varying(20) NOT NULL;
ALTER TABLE public.integrity_logs ADD COLUMN IF NOT EXISTS message text;
ALTER TABLE public.integrity_logs ADD COLUMN IF NOT EXISTS details_count integer;
ALTER TABLE public.integrity_logs ADD COLUMN IF NOT EXISTS execution_time_ms integer;
ALTER TABLE public.integrity_logs ADD COLUMN IF NOT EXISTS created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP;

-- Columnas de public.inventario_lotes
ALTER TABLE public.inventario_lotes ADD COLUMN IF NOT EXISTS id_lote integer DEFAULT nextval('inventario_lotes_id_lote_seq'::regclass) NOT NULL;
ALTER TABLE public.inventario_lotes ADD COLUMN IF NOT EXISTS id_producto integer NOT NULL;
ALTER TABLE public.inventario_lotes ADD COLUMN IF NOT EXISTS numero_lote character varying(100) NOT NULL;
ALTER TABLE public.inventario_lotes ADD COLUMN IF NOT EXISTS cantidad_inicial numeric(10,2) DEFAULT 0 NOT NULL;
ALTER TABLE public.inventario_lotes ADD COLUMN IF NOT EXISTS cantidad_actual numeric(10,2) DEFAULT 0 NOT NULL;
ALTER TABLE public.inventario_lotes ADD COLUMN IF NOT EXISTS fecha_fabricacion date;
ALTER TABLE public.inventario_lotes ADD COLUMN IF NOT EXISTS fecha_caducidad date;
ALTER TABLE public.inventario_lotes ADD COLUMN IF NOT EXISTS precio_compra numeric(10,2) DEFAULT 0;
ALTER TABLE public.inventario_lotes ADD COLUMN IF NOT EXISTS activo boolean DEFAULT true;
ALTER TABLE public.inventario_lotes ADD COLUMN IF NOT EXISTS id_restaurante integer NOT NULL;
ALTER TABLE public.inventario_lotes ADD COLUMN IF NOT EXISTS created_at timestamp without time zone DEFAULT now();
ALTER TABLE public.inventario_lotes ADD COLUMN IF NOT EXISTS updated_at timestamp without time zone DEFAULT now();
ALTER TABLE public.inventario_lotes ADD COLUMN IF NOT EXISTS id_categoria_almacen integer DEFAULT 1;
ALTER TABLE public.inventario_lotes ADD COLUMN IF NOT EXISTS ubicacion_especifica character varying(100);
ALTER TABLE public.inventario_lotes ADD COLUMN IF NOT EXISTS proveedor character varying(100);
ALTER TABLE public.inventario_lotes ADD COLUMN IF NOT EXISTS certificacion_organica boolean DEFAULT false;
ALTER TABLE public.inventario_lotes ADD COLUMN IF NOT EXISTS id_sucursal integer;

-- Columnas de public.leads_prospectos
ALTER TABLE public.leads_prospectos ADD COLUMN IF NOT EXISTS id integer DEFAULT nextval('leads_prospectos_id_seq'::regclass) NOT NULL;
ALTER TABLE public.leads_prospectos ADD COLUMN IF NOT EXISTS nombre character varying(100) NOT NULL;
ALTER TABLE public.leads_prospectos ADD COLUMN IF NOT EXISTS email character varying(100) NOT NULL;
ALTER TABLE public.leads_prospectos ADD COLUMN IF NOT EXISTS telefono character varying(20);
ALTER TABLE public.leads_prospectos ADD COLUMN IF NOT EXISTS nombre_restaurante character varying(100);
ALTER TABLE public.leads_prospectos ADD COLUMN IF NOT EXISTS tipo_restaurante character varying(50);
ALTER TABLE public.leads_prospectos ADD COLUMN IF NOT EXISTS num_sucursales integer DEFAULT 1;
ALTER TABLE public.leads_prospectos ADD COLUMN IF NOT EXISTS num_empleados integer;
ALTER TABLE public.leads_prospectos ADD COLUMN IF NOT EXISTS ciudad character varying(50);
ALTER TABLE public.leads_prospectos ADD COLUMN IF NOT EXISTS pais character varying(50) DEFAULT 'Bolivia'::character varying;
ALTER TABLE public.leads_prospectos ADD COLUMN IF NOT EXISTS fuente_lead character varying(50);
ALTER TABLE public.leads_prospectos ADD COLUMN IF NOT EXISTS estado character varying(30) DEFAULT 'nuevo'::character varying;
ALTER TABLE public.leads_prospectos ADD COLUMN IF NOT EXISTS interes_plan_id integer;
ALTER TABLE public.leads_prospectos ADD COLUMN IF NOT EXISTS notas text;
ALTER TABLE public.leads_prospectos ADD COLUMN IF NOT EXISTS fecha_contacto timestamp without time zone;
ALTER TABLE public.leads_prospectos ADD COLUMN IF NOT EXISTS fecha_demo timestamp without time zone;
ALTER TABLE public.leads_prospectos ADD COLUMN IF NOT EXISTS vendedor_asignado character varying(100);
ALTER TABLE public.leads_prospectos ADD COLUMN IF NOT EXISTS created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE public.leads_prospectos ADD COLUMN IF NOT EXISTS updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP;

-- Columnas de public.mesas
ALTER TABLE public.mesas ADD COLUMN IF NOT EXISTS id_mesa integer DEFAULT nextval('mesas_id_mesa_seq'::regclass) NOT NULL;
ALTER TABLE public.mesas ADD COLUMN IF NOT EXISTS numero integer NOT NULL;
ALTER TABLE public.mesas ADD COLUMN IF NOT EXISTS id_sucursal integer;
ALTER TABLE public.mesas ADD COLUMN IF NOT EXISTS capacidad integer DEFAULT 4;
ALTER TABLE public.mesas ADD COLUMN IF NOT EXISTS estado character varying(20) DEFAULT 'libre'::character varying;
ALTER TABLE public.mesas ADD COLUMN IF NOT EXISTS id_venta_actual integer;
ALTER TABLE public.mesas ADD COLUMN IF NOT EXISTS hora_apertura timestamp without time zone;
ALTER TABLE public.mesas ADD COLUMN IF NOT EXISTS hora_cierre timestamp without time zone;
ALTER TABLE public.mesas ADD COLUMN IF NOT EXISTS total_acumulado numeric(10,2) DEFAULT 0;
ALTER TABLE public.mesas ADD COLUMN IF NOT EXISTS created_at timestamp without time zone DEFAULT now();
ALTER TABLE public.mesas ADD COLUMN IF NOT EXISTS updated_at timestamp without time zone DEFAULT now();
ALTER TABLE public.mesas ADD COLUMN IF NOT EXISTS id_restaurante integer DEFAULT 1 NOT NULL;
ALTER TABLE public.mesas ADD COLUMN IF NOT EXISTS id_mesero_actual integer;
ALTER TABLE public.mesas ADD COLUMN IF NOT EXISTS id_grupo_mesa integer;

-- Columnas de public.mesas_en_grupo
ALTER TABLE public.mesas_en_grupo ADD COLUMN IF NOT EXISTS id_mesa_en_grupo integer DEFAULT nextval('mesas_en_grupo_id_mesa_en_grupo_seq'::regclass) NOT NULL;
ALTER TABLE public.mesas_en_grupo ADD COLUMN IF NOT EXISTS id_grupo_mesa integer NOT NULL;
ALTER TABLE public.mesas_en_grupo ADD COLUMN IF NOT EXISTS id_mesa integer NOT NULL;
ALTER TABLE public.mesas_en_grupo ADD COLUMN IF NOT EXISTS created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP;

-- Columnas de public.metodos_pago
ALTER TABLE public.metodos_pago ADD COLUMN IF NOT EXISTS id_pago integer DEFAULT nextval('metodos_pago_id_pago_seq1'::regclass) NOT NULL;
ALTER TABLE public.metodos_pago ADD COLUMN IF NOT EXISTS descripcion character varying(100) NOT NULL;
ALTER TABLE public.metodos_pago ADD COLUMN IF NOT EXISTS activo boolean DEFAULT true;
ALTER TABLE public.metodos_pago ADD COLUMN IF NOT EXISTS created_at timestamp without time zone DEFAULT now();
ALTER TABLE public.metodos_pago ADD COLUMN IF NOT EXISTS updated_at timestamp without time zone DEFAULT now();

-- Columnas de public.metodos_pago_backup
ALTER TABLE public.metodos_pago_backup ADD COLUMN IF NOT EXISTS id_pago integer DEFAULT nextval('metodos_pago_id_pago_seq'::regclass) NOT NULL;
ALTER TABLE public.metodos_pago_backup ADD COLUMN IF NOT EXISTS descripcion character varying(50) NOT NULL;
ALTER TABLE public.metodos_pago_backup ADD COLUMN IF NOT EXISTS activo boolean DEFAULT true;
ALTER TABLE public.metodos_pago_backup ADD COLUMN IF NOT EXISTS id_restaurante integer DEFAULT 1 NOT NULL;

-- Columnas de public.metricas_web
ALTER TABLE public.metricas_web ADD COLUMN IF NOT EXISTS id integer DEFAULT nextval('metricas_web_id_seq'::regclass) NOT NULL;
ALTER TABLE public.metricas_web ADD COLUMN IF NOT EXISTS fecha date NOT NULL;
ALTER TABLE public.metricas_web ADD COLUMN IF NOT EXISTS tipo_metrica character varying(50);
ALTER TABLE public.metricas_web ADD COLUMN IF NOT EXISTS valor integer DEFAULT 0;
ALTER TABLE public.metricas_web ADD COLUMN IF NOT EXISTS fuente character varying(50);
ALTER TABLE public.metricas_web ADD COLUMN IF NOT EXISTS pagina character varying(100);
ALTER TABLE public.metricas_web ADD COLUMN IF NOT EXISTS created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP;

-- Columnas de public.migrations
ALTER TABLE public.migrations ADD COLUMN IF NOT EXISTS id integer DEFAULT nextval('migrations_id_seq'::regclass) NOT NULL;
ALTER TABLE public.migrations ADD COLUMN IF NOT EXISTS migration_name character varying(255) NOT NULL;
ALTER TABLE public.migrations ADD COLUMN IF NOT EXISTS executed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE public.migrations ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.migrations ADD COLUMN IF NOT EXISTS status character varying(50) DEFAULT 'completed'::character varying;

-- Columnas de public.movimientos_inventario
ALTER TABLE public.movimientos_inventario ADD COLUMN IF NOT EXISTS id_movimiento integer DEFAULT nextval('movimientos_inventario_id_movimiento_seq'::regclass) NOT NULL;
ALTER TABLE public.movimientos_inventario ADD COLUMN IF NOT EXISTS id_producto integer NOT NULL;
ALTER TABLE public.movimientos_inventario ADD COLUMN IF NOT EXISTS tipo_movimiento character varying(50) NOT NULL;
ALTER TABLE public.movimientos_inventario ADD COLUMN IF NOT EXISTS cantidad integer NOT NULL;
ALTER TABLE public.movimientos_inventario ADD COLUMN IF NOT EXISTS stock_anterior integer NOT NULL;
ALTER TABLE public.movimientos_inventario ADD COLUMN IF NOT EXISTS stock_actual integer NOT NULL;
ALTER TABLE public.movimientos_inventario ADD COLUMN IF NOT EXISTS fecha_movimiento timestamp with time zone DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE public.movimientos_inventario ADD COLUMN IF NOT EXISTS id_vendedor integer;
ALTER TABLE public.movimientos_inventario ADD COLUMN IF NOT EXISTS id_restaurante integer DEFAULT 1 NOT NULL;
ALTER TABLE public.movimientos_inventario ADD COLUMN IF NOT EXISTS id_lote integer;
ALTER TABLE public.movimientos_inventario ADD COLUMN IF NOT EXISTS id_categoria_almacen integer;
ALTER TABLE public.movimientos_inventario ADD COLUMN IF NOT EXISTS motivo text;
ALTER TABLE public.movimientos_inventario ADD COLUMN IF NOT EXISTS id_sucursal integer;
ALTER TABLE public.movimientos_inventario ADD COLUMN IF NOT EXISTS observaciones text;

-- Columnas de public.newsletter_suscriptores
ALTER TABLE public.newsletter_suscriptores ADD COLUMN IF NOT EXISTS id integer DEFAULT nextval('newsletter_suscriptores_id_seq'::regclass) NOT NULL;
ALTER TABLE public.newsletter_suscriptores ADD COLUMN IF NOT EXISTS email character varying(100) NOT NULL;
ALTER TABLE public.newsletter_suscriptores ADD COLUMN IF NOT EXISTS nombre character varying(100);
ALTER TABLE public.newsletter_suscriptores ADD COLUMN IF NOT EXISTS estado character varying(20) DEFAULT 'activo'::character varying;
ALTER TABLE public.newsletter_suscriptores ADD COLUMN IF NOT EXISTS fecha_suscripcion timestamp without time zone DEFAULT now();
ALTER TABLE public.newsletter_suscriptores ADD COLUMN IF NOT EXISTS fecha_baja timestamp without time zone;
ALTER TABLE public.newsletter_suscriptores ADD COLUMN IF NOT EXISTS fuente character varying(50);
ALTER TABLE public.newsletter_suscriptores ADD COLUMN IF NOT EXISTS ip_address inet;
ALTER TABLE public.newsletter_suscriptores ADD COLUMN IF NOT EXISTS user_agent text;
ALTER TABLE public.newsletter_suscriptores ADD COLUMN IF NOT EXISTS created_at timestamp without time zone DEFAULT now();
ALTER TABLE public.newsletter_suscriptores ADD COLUMN IF NOT EXISTS updated_at timestamp without time zone DEFAULT now();

-- Columnas de public.pagos_diferidos
ALTER TABLE public.pagos_diferidos ADD COLUMN IF NOT EXISTS id_pago_diferido integer DEFAULT nextval('pagos_diferidos_id_pago_diferido_seq'::regclass) NOT NULL;
ALTER TABLE public.pagos_diferidos ADD COLUMN IF NOT EXISTS id_venta integer NOT NULL;
ALTER TABLE public.pagos_diferidos ADD COLUMN IF NOT EXISTS id_mesa integer;
ALTER TABLE public.pagos_diferidos ADD COLUMN IF NOT EXISTS total_pendiente numeric NOT NULL;
ALTER TABLE public.pagos_diferidos ADD COLUMN IF NOT EXISTS fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE public.pagos_diferidos ADD COLUMN IF NOT EXISTS fecha_vencimiento timestamp without time zone;
ALTER TABLE public.pagos_diferidos ADD COLUMN IF NOT EXISTS estado character varying(20) DEFAULT 'pendiente'::character varying;
ALTER TABLE public.pagos_diferidos ADD COLUMN IF NOT EXISTS observaciones text;
ALTER TABLE public.pagos_diferidos ADD COLUMN IF NOT EXISTS id_restaurante integer NOT NULL;
ALTER TABLE public.pagos_diferidos ADD COLUMN IF NOT EXISTS created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE public.pagos_diferidos ADD COLUMN IF NOT EXISTS updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP;

-- Columnas de public.pagos_restaurantes
ALTER TABLE public.pagos_restaurantes ADD COLUMN IF NOT EXISTS id integer DEFAULT nextval('pagos_restaurantes_id_seq'::regclass) NOT NULL;
ALTER TABLE public.pagos_restaurantes ADD COLUMN IF NOT EXISTS id_restaurante integer NOT NULL;
ALTER TABLE public.pagos_restaurantes ADD COLUMN IF NOT EXISTS monto numeric(10,2) NOT NULL;
ALTER TABLE public.pagos_restaurantes ADD COLUMN IF NOT EXISTS fecha_pago timestamp without time zone DEFAULT now() NOT NULL;
ALTER TABLE public.pagos_restaurantes ADD COLUMN IF NOT EXISTS metodo_pago character varying(50);
ALTER TABLE public.pagos_restaurantes ADD COLUMN IF NOT EXISTS observaciones text;
ALTER TABLE public.pagos_restaurantes ADD COLUMN IF NOT EXISTS registrado_por integer;
ALTER TABLE public.pagos_restaurantes ADD COLUMN IF NOT EXISTS creado_en timestamp without time zone DEFAULT now();

-- Columnas de public.planes
ALTER TABLE public.planes ADD COLUMN IF NOT EXISTS id_plan integer DEFAULT nextval('planes_id_plan_seq'::regclass) NOT NULL;
ALTER TABLE public.planes ADD COLUMN IF NOT EXISTS nombre character varying(50) NOT NULL;
ALTER TABLE public.planes ADD COLUMN IF NOT EXISTS descripcion text;
ALTER TABLE public.planes ADD COLUMN IF NOT EXISTS precio_mensual numeric(10,2) NOT NULL;
ALTER TABLE public.planes ADD COLUMN IF NOT EXISTS precio_anual numeric(10,2);
ALTER TABLE public.planes ADD COLUMN IF NOT EXISTS max_sucursales integer DEFAULT 1 NOT NULL;
ALTER TABLE public.planes ADD COLUMN IF NOT EXISTS max_usuarios integer DEFAULT 2 NOT NULL;
ALTER TABLE public.planes ADD COLUMN IF NOT EXISTS max_productos integer DEFAULT 100 NOT NULL;
ALTER TABLE public.planes ADD COLUMN IF NOT EXISTS max_transacciones_mes integer DEFAULT 500 NOT NULL;
ALTER TABLE public.planes ADD COLUMN IF NOT EXISTS almacenamiento_gb integer DEFAULT 1 NOT NULL;
ALTER TABLE public.planes ADD COLUMN IF NOT EXISTS funcionalidades jsonb DEFAULT '{}'::jsonb NOT NULL;
ALTER TABLE public.planes ADD COLUMN IF NOT EXISTS activo boolean DEFAULT true;
ALTER TABLE public.planes ADD COLUMN IF NOT EXISTS orden_display integer DEFAULT 0;
ALTER TABLE public.planes ADD COLUMN IF NOT EXISTS created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE public.planes ADD COLUMN IF NOT EXISTS updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP;
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

-- Columnas de public.planes_pos
ALTER TABLE public.planes_pos ADD COLUMN IF NOT EXISTS id integer DEFAULT nextval('planes_pos_id_seq'::regclass) NOT NULL;
ALTER TABLE public.planes_pos ADD COLUMN IF NOT EXISTS nombre character varying(100) NOT NULL;
ALTER TABLE public.planes_pos ADD COLUMN IF NOT EXISTS descripcion text;
ALTER TABLE public.planes_pos ADD COLUMN IF NOT EXISTS precio_mensual numeric(10,2);
ALTER TABLE public.planes_pos ADD COLUMN IF NOT EXISTS precio_anual numeric(10,2);
ALTER TABLE public.planes_pos ADD COLUMN IF NOT EXISTS caracteristicas jsonb;
ALTER TABLE public.planes_pos ADD COLUMN IF NOT EXISTS max_sucursales integer DEFAULT 1;
ALTER TABLE public.planes_pos ADD COLUMN IF NOT EXISTS max_usuarios integer DEFAULT 5;
ALTER TABLE public.planes_pos ADD COLUMN IF NOT EXISTS incluye_impresion boolean DEFAULT false;
ALTER TABLE public.planes_pos ADD COLUMN IF NOT EXISTS incluye_delivery boolean DEFAULT false;
ALTER TABLE public.planes_pos ADD COLUMN IF NOT EXISTS incluye_reservas boolean DEFAULT false;
ALTER TABLE public.planes_pos ADD COLUMN IF NOT EXISTS incluye_analytics boolean DEFAULT false;
ALTER TABLE public.planes_pos ADD COLUMN IF NOT EXISTS incluye_soporte_24h boolean DEFAULT false;
ALTER TABLE public.planes_pos ADD COLUMN IF NOT EXISTS activo boolean DEFAULT true;
ALTER TABLE public.planes_pos ADD COLUMN IF NOT EXISTS orden_display integer DEFAULT 0;
ALTER TABLE public.planes_pos ADD COLUMN IF NOT EXISTS created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE public.planes_pos ADD COLUMN IF NOT EXISTS updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP;

-- Columnas de public.prefacturas
ALTER TABLE public.prefacturas ADD COLUMN IF NOT EXISTS id_prefactura integer DEFAULT nextval('prefacturas_id_prefactura_seq'::regclass) NOT NULL;
ALTER TABLE public.prefacturas ADD COLUMN IF NOT EXISTS id_mesa integer;
ALTER TABLE public.prefacturas ADD COLUMN IF NOT EXISTS id_venta_principal integer;
ALTER TABLE public.prefacturas ADD COLUMN IF NOT EXISTS total_acumulado numeric(10,2) DEFAULT 0;
ALTER TABLE public.prefacturas ADD COLUMN IF NOT EXISTS estado character varying(20) DEFAULT 'abierta'::character varying;
ALTER TABLE public.prefacturas ADD COLUMN IF NOT EXISTS fecha_apertura timestamp without time zone DEFAULT now();
ALTER TABLE public.prefacturas ADD COLUMN IF NOT EXISTS fecha_cierre timestamp without time zone;
ALTER TABLE public.prefacturas ADD COLUMN IF NOT EXISTS observaciones text;
ALTER TABLE public.prefacturas ADD COLUMN IF NOT EXISTS created_at timestamp without time zone DEFAULT now();
ALTER TABLE public.prefacturas ADD COLUMN IF NOT EXISTS id_restaurante integer DEFAULT 1 NOT NULL;

-- Columnas de public.presupuestos_egresos
ALTER TABLE public.presupuestos_egresos ADD COLUMN IF NOT EXISTS id_presupuesto integer DEFAULT nextval('presupuestos_egresos_id_presupuesto_seq'::regclass) NOT NULL;
ALTER TABLE public.presupuestos_egresos ADD COLUMN IF NOT EXISTS anio integer NOT NULL;
ALTER TABLE public.presupuestos_egresos ADD COLUMN IF NOT EXISTS mes integer;
ALTER TABLE public.presupuestos_egresos ADD COLUMN IF NOT EXISTS id_categoria_egreso integer NOT NULL;
ALTER TABLE public.presupuestos_egresos ADD COLUMN IF NOT EXISTS monto_presupuestado numeric(12,2) NOT NULL;
ALTER TABLE public.presupuestos_egresos ADD COLUMN IF NOT EXISTS monto_gastado numeric(12,2) DEFAULT 0;
ALTER TABLE public.presupuestos_egresos ADD COLUMN IF NOT EXISTS activo boolean DEFAULT true;
ALTER TABLE public.presupuestos_egresos ADD COLUMN IF NOT EXISTS id_restaurante integer NOT NULL;
ALTER TABLE public.presupuestos_egresos ADD COLUMN IF NOT EXISTS created_at timestamp without time zone DEFAULT now();
ALTER TABLE public.presupuestos_egresos ADD COLUMN IF NOT EXISTS updated_at timestamp without time zone DEFAULT now();

-- Columnas de public.productos
ALTER TABLE public.productos ADD COLUMN IF NOT EXISTS id_producto integer DEFAULT nextval('productos_id_producto_seq'::regclass) NOT NULL;
ALTER TABLE public.productos ADD COLUMN IF NOT EXISTS nombre character varying(200) NOT NULL;
ALTER TABLE public.productos ADD COLUMN IF NOT EXISTS precio numeric(10,2) NOT NULL;
ALTER TABLE public.productos ADD COLUMN IF NOT EXISTS id_categoria integer;
ALTER TABLE public.productos ADD COLUMN IF NOT EXISTS stock_actual integer DEFAULT 0;
ALTER TABLE public.productos ADD COLUMN IF NOT EXISTS activo boolean DEFAULT true;
ALTER TABLE public.productos ADD COLUMN IF NOT EXISTS imagen_url text;
ALTER TABLE public.productos ADD COLUMN IF NOT EXISTS created_at timestamp without time zone DEFAULT now();
ALTER TABLE public.productos ADD COLUMN IF NOT EXISTS id_restaurante integer DEFAULT 1 NOT NULL;

-- Columnas de public.productos_modificadores
ALTER TABLE public.productos_modificadores ADD COLUMN IF NOT EXISTS id_modificador integer DEFAULT nextval('productos_modificadores_id_modificador_seq'::regclass) NOT NULL;
ALTER TABLE public.productos_modificadores ADD COLUMN IF NOT EXISTS id_producto integer NOT NULL;
ALTER TABLE public.productos_modificadores ADD COLUMN IF NOT EXISTS nombre_modificador character varying(100) NOT NULL;
ALTER TABLE public.productos_modificadores ADD COLUMN IF NOT EXISTS precio_extra numeric(10,2) DEFAULT 0.00;
ALTER TABLE public.productos_modificadores ADD COLUMN IF NOT EXISTS tipo_modificador character varying(50) DEFAULT 'opcional'::character varying;
ALTER TABLE public.productos_modificadores ADD COLUMN IF NOT EXISTS activo boolean DEFAULT true;
ALTER TABLE public.productos_modificadores ADD COLUMN IF NOT EXISTS created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE public.productos_modificadores ADD COLUMN IF NOT EXISTS updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP;

-- Columnas de public.promociones
ALTER TABLE public.promociones ADD COLUMN IF NOT EXISTS id_promocion integer DEFAULT nextval('promociones_id_promocion_seq'::regclass) NOT NULL;
ALTER TABLE public.promociones ADD COLUMN IF NOT EXISTS nombre character varying(100);
ALTER TABLE public.promociones ADD COLUMN IF NOT EXISTS tipo character varying(20);
ALTER TABLE public.promociones ADD COLUMN IF NOT EXISTS valor numeric(10,2);
ALTER TABLE public.promociones ADD COLUMN IF NOT EXISTS fecha_inicio date;
ALTER TABLE public.promociones ADD COLUMN IF NOT EXISTS fecha_fin date;
ALTER TABLE public.promociones ADD COLUMN IF NOT EXISTS id_producto integer;
ALTER TABLE public.promociones ADD COLUMN IF NOT EXISTS creada_en timestamp without time zone DEFAULT now();
ALTER TABLE public.promociones ADD COLUMN IF NOT EXISTS activa boolean DEFAULT true;
ALTER TABLE public.promociones ADD COLUMN IF NOT EXISTS id_restaurante integer NOT NULL;

-- Columnas de public.promociones_sucursales
ALTER TABLE public.promociones_sucursales ADD COLUMN IF NOT EXISTS id_relacion integer DEFAULT nextval('promociones_sucursales_id_relacion_seq'::regclass) NOT NULL;
ALTER TABLE public.promociones_sucursales ADD COLUMN IF NOT EXISTS id_promocion integer NOT NULL;
ALTER TABLE public.promociones_sucursales ADD COLUMN IF NOT EXISTS id_sucursal integer NOT NULL;
ALTER TABLE public.promociones_sucursales ADD COLUMN IF NOT EXISTS aplicada_en timestamp without time zone DEFAULT now();

-- Columnas de public.reservas
ALTER TABLE public.reservas ADD COLUMN IF NOT EXISTS id_reserva integer DEFAULT nextval('reservas_id_reserva_seq'::regclass) NOT NULL;
ALTER TABLE public.reservas ADD COLUMN IF NOT EXISTS id_restaurante integer NOT NULL;
ALTER TABLE public.reservas ADD COLUMN IF NOT EXISTS id_sucursal integer NOT NULL;
ALTER TABLE public.reservas ADD COLUMN IF NOT EXISTS id_mesa integer;
ALTER TABLE public.reservas ADD COLUMN IF NOT EXISTS id_cliente integer;
ALTER TABLE public.reservas ADD COLUMN IF NOT EXISTS nombre_cliente character varying(255) NOT NULL;
ALTER TABLE public.reservas ADD COLUMN IF NOT EXISTS telefono_cliente character varying(50);
ALTER TABLE public.reservas ADD COLUMN IF NOT EXISTS email_cliente character varying(255);
ALTER TABLE public.reservas ADD COLUMN IF NOT EXISTS fecha_hora_inicio timestamp with time zone NOT NULL;
ALTER TABLE public.reservas ADD COLUMN IF NOT EXISTS fecha_hora_fin timestamp with time zone NOT NULL;
ALTER TABLE public.reservas ADD COLUMN IF NOT EXISTS numero_personas integer NOT NULL;
ALTER TABLE public.reservas ADD COLUMN IF NOT EXISTS estado character varying(50) DEFAULT 'PENDIENTE'::character varying NOT NULL;
ALTER TABLE public.reservas ADD COLUMN IF NOT EXISTS observaciones text;
ALTER TABLE public.reservas ADD COLUMN IF NOT EXISTS created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE public.reservas ADD COLUMN IF NOT EXISTS updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE public.reservas ADD COLUMN IF NOT EXISTS registrado_por integer;

-- Columnas de public.restaurantes
ALTER TABLE public.restaurantes ADD COLUMN IF NOT EXISTS id_restaurante integer DEFAULT nextval('restaurantes_id_restaurante_seq'::regclass) NOT NULL;
ALTER TABLE public.restaurantes ADD COLUMN IF NOT EXISTS nombre character varying(255) NOT NULL;
ALTER TABLE public.restaurantes ADD COLUMN IF NOT EXISTS direccion text;
ALTER TABLE public.restaurantes ADD COLUMN IF NOT EXISTS ciudad character varying(100);
ALTER TABLE public.restaurantes ADD COLUMN IF NOT EXISTS telefono character varying(20);
ALTER TABLE public.restaurantes ADD COLUMN IF NOT EXISTS email character varying(255);
ALTER TABLE public.restaurantes ADD COLUMN IF NOT EXISTS activo boolean DEFAULT true;
ALTER TABLE public.restaurantes ADD COLUMN IF NOT EXISTS created_at timestamp without time zone DEFAULT now();

-- Columnas de public.roles_admin
ALTER TABLE public.roles_admin ADD COLUMN IF NOT EXISTS id_rol integer DEFAULT nextval('roles_admin_id_rol_seq'::regclass) NOT NULL;
ALTER TABLE public.roles_admin ADD COLUMN IF NOT EXISTS nombre character varying(32) NOT NULL;
ALTER TABLE public.roles_admin ADD COLUMN IF NOT EXISTS descripcion character varying(255);
ALTER TABLE public.roles_admin ADD COLUMN IF NOT EXISTS permisos jsonb;
ALTER TABLE public.roles_admin ADD COLUMN IF NOT EXISTS creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP;

-- Columnas de public.servicios_restaurante
ALTER TABLE public.servicios_restaurante ADD COLUMN IF NOT EXISTS id integer DEFAULT nextval('servicios_restaurante_id_seq'::regclass) NOT NULL;
ALTER TABLE public.servicios_restaurante ADD COLUMN IF NOT EXISTS id_restaurante integer NOT NULL;
ALTER TABLE public.servicios_restaurante ADD COLUMN IF NOT EXISTS nombre_plan character varying(100) NOT NULL;
ALTER TABLE public.servicios_restaurante ADD COLUMN IF NOT EXISTS descripcion_plan text;
ALTER TABLE public.servicios_restaurante ADD COLUMN IF NOT EXISTS fecha_inicio date DEFAULT CURRENT_DATE NOT NULL;
ALTER TABLE public.servicios_restaurante ADD COLUMN IF NOT EXISTS fecha_fin date;
ALTER TABLE public.servicios_restaurante ADD COLUMN IF NOT EXISTS estado_suscripcion character varying(50) DEFAULT 'activo'::character varying NOT NULL;
ALTER TABLE public.servicios_restaurante ADD COLUMN IF NOT EXISTS precio_mensual numeric(10,2);
ALTER TABLE public.servicios_restaurante ADD COLUMN IF NOT EXISTS ultimo_pago date;
ALTER TABLE public.servicios_restaurante ADD COLUMN IF NOT EXISTS funcionalidades_json jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.servicios_restaurante ADD COLUMN IF NOT EXISTS creado_en timestamp with time zone DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE public.servicios_restaurante ADD COLUMN IF NOT EXISTS actualizado_en timestamp with time zone DEFAULT CURRENT_TIMESTAMP;

-- Columnas de public.solicitudes_demo
ALTER TABLE public.solicitudes_demo ADD COLUMN IF NOT EXISTS id_solicitud integer DEFAULT nextval('solicitudes_demo_id_solicitud_seq'::regclass) NOT NULL;
ALTER TABLE public.solicitudes_demo ADD COLUMN IF NOT EXISTS nombre character varying(100) NOT NULL;
ALTER TABLE public.solicitudes_demo ADD COLUMN IF NOT EXISTS email character varying(100) NOT NULL;
ALTER TABLE public.solicitudes_demo ADD COLUMN IF NOT EXISTS telefono character varying(20) NOT NULL;
ALTER TABLE public.solicitudes_demo ADD COLUMN IF NOT EXISTS restaurante character varying(100) NOT NULL;
ALTER TABLE public.solicitudes_demo ADD COLUMN IF NOT EXISTS plan_interes character varying(50);
ALTER TABLE public.solicitudes_demo ADD COLUMN IF NOT EXISTS tipo_negocio character varying(50);
ALTER TABLE public.solicitudes_demo ADD COLUMN IF NOT EXISTS mensaje text;
ALTER TABLE public.solicitudes_demo ADD COLUMN IF NOT EXISTS horario_preferido character varying(50);
ALTER TABLE public.solicitudes_demo ADD COLUMN IF NOT EXISTS estado character varying(20) DEFAULT 'pendiente'::character varying;
ALTER TABLE public.solicitudes_demo ADD COLUMN IF NOT EXISTS fecha_solicitud timestamp without time zone DEFAULT now();
ALTER TABLE public.solicitudes_demo ADD COLUMN IF NOT EXISTS ip_address inet;
ALTER TABLE public.solicitudes_demo ADD COLUMN IF NOT EXISTS user_agent text;
ALTER TABLE public.solicitudes_demo ADD COLUMN IF NOT EXISTS procesado_por integer;
ALTER TABLE public.solicitudes_demo ADD COLUMN IF NOT EXISTS fecha_procesamiento timestamp without time zone;
ALTER TABLE public.solicitudes_demo ADD COLUMN IF NOT EXISTS observaciones text;
ALTER TABLE public.solicitudes_demo ADD COLUMN IF NOT EXISTS created_at timestamp without time zone DEFAULT now();
ALTER TABLE public.solicitudes_demo ADD COLUMN IF NOT EXISTS updated_at timestamp without time zone DEFAULT now();

-- Columnas de public.soporte_tickets
ALTER TABLE public.soporte_tickets ADD COLUMN IF NOT EXISTS id_ticket integer DEFAULT nextval('soporte_tickets_id_ticket_seq'::regclass) NOT NULL;
ALTER TABLE public.soporte_tickets ADD COLUMN IF NOT EXISTS id_vendedor integer NOT NULL;
ALTER TABLE public.soporte_tickets ADD COLUMN IF NOT EXISTS id_restaurante integer NOT NULL;
ALTER TABLE public.soporte_tickets ADD COLUMN IF NOT EXISTS asunto character varying(100) NOT NULL;
ALTER TABLE public.soporte_tickets ADD COLUMN IF NOT EXISTS descripcion text NOT NULL;
ALTER TABLE public.soporte_tickets ADD COLUMN IF NOT EXISTS estado character varying(20) DEFAULT 'pendiente'::character varying;
ALTER TABLE public.soporte_tickets ADD COLUMN IF NOT EXISTS fecha_creacion timestamp without time zone DEFAULT now();
ALTER TABLE public.soporte_tickets ADD COLUMN IF NOT EXISTS fecha_resuelto timestamp without time zone;
ALTER TABLE public.soporte_tickets ADD COLUMN IF NOT EXISTS respuesta text;

-- Columnas de public.stock_sucursal
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

-- Columnas de public.sucursales
ALTER TABLE public.sucursales ADD COLUMN IF NOT EXISTS id_sucursal integer DEFAULT nextval('sucursales_id_sucursal_seq'::regclass) NOT NULL;
ALTER TABLE public.sucursales ADD COLUMN IF NOT EXISTS nombre character varying(150) NOT NULL;
ALTER TABLE public.sucursales ADD COLUMN IF NOT EXISTS ciudad character varying(100) NOT NULL;
ALTER TABLE public.sucursales ADD COLUMN IF NOT EXISTS direccion text;
ALTER TABLE public.sucursales ADD COLUMN IF NOT EXISTS activo boolean DEFAULT true;
ALTER TABLE public.sucursales ADD COLUMN IF NOT EXISTS created_at timestamp without time zone DEFAULT now();
ALTER TABLE public.sucursales ADD COLUMN IF NOT EXISTS id_restaurante integer DEFAULT 1 NOT NULL;

-- Columnas de public.suscripciones
ALTER TABLE public.suscripciones ADD COLUMN IF NOT EXISTS id_suscripcion integer DEFAULT nextval('suscripciones_id_suscripcion_seq'::regclass) NOT NULL;
ALTER TABLE public.suscripciones ADD COLUMN IF NOT EXISTS id_restaurante integer NOT NULL;
ALTER TABLE public.suscripciones ADD COLUMN IF NOT EXISTS id_plan integer NOT NULL;
ALTER TABLE public.suscripciones ADD COLUMN IF NOT EXISTS estado character varying(20) DEFAULT 'activa'::character varying;
ALTER TABLE public.suscripciones ADD COLUMN IF NOT EXISTS fecha_inicio date DEFAULT CURRENT_DATE NOT NULL;
ALTER TABLE public.suscripciones ADD COLUMN IF NOT EXISTS fecha_fin date;
ALTER TABLE public.suscripciones ADD COLUMN IF NOT EXISTS fecha_renovacion date;
ALTER TABLE public.suscripciones ADD COLUMN IF NOT EXISTS metodo_pago character varying(20) DEFAULT 'mensual'::character varying;
ALTER TABLE public.suscripciones ADD COLUMN IF NOT EXISTS ultimo_pago timestamp without time zone;
ALTER TABLE public.suscripciones ADD COLUMN IF NOT EXISTS proximo_pago timestamp without time zone;
ALTER TABLE public.suscripciones ADD COLUMN IF NOT EXISTS auto_renovacion boolean DEFAULT true;
ALTER TABLE public.suscripciones ADD COLUMN IF NOT EXISTS notificaciones_email boolean DEFAULT true;
ALTER TABLE public.suscripciones ADD COLUMN IF NOT EXISTS created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE public.suscripciones ADD COLUMN IF NOT EXISTS updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP;

-- Columnas de public.system_tasks
ALTER TABLE public.system_tasks ADD COLUMN IF NOT EXISTS id integer DEFAULT nextval('system_tasks_id_seq'::regclass) NOT NULL;
ALTER TABLE public.system_tasks ADD COLUMN IF NOT EXISTS task_name character varying(100) NOT NULL;
ALTER TABLE public.system_tasks ADD COLUMN IF NOT EXISTS last_run timestamp without time zone;
ALTER TABLE public.system_tasks ADD COLUMN IF NOT EXISTS next_run timestamp without time zone;
ALTER TABLE public.system_tasks ADD COLUMN IF NOT EXISTS interval_minutes integer DEFAULT 60;
ALTER TABLE public.system_tasks ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE public.system_tasks ADD COLUMN IF NOT EXISTS created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP;

-- Columnas de public.testimonios_web
ALTER TABLE public.testimonios_web ADD COLUMN IF NOT EXISTS id integer DEFAULT nextval('testimonios_web_id_seq'::regclass) NOT NULL;
ALTER TABLE public.testimonios_web ADD COLUMN IF NOT EXISTS nombre character varying(100) NOT NULL;
ALTER TABLE public.testimonios_web ADD COLUMN IF NOT EXISTS cargo character varying(50);
ALTER TABLE public.testimonios_web ADD COLUMN IF NOT EXISTS empresa character varying(100);
ALTER TABLE public.testimonios_web ADD COLUMN IF NOT EXISTS foto_url character varying(255);
ALTER TABLE public.testimonios_web ADD COLUMN IF NOT EXISTS testimonio text NOT NULL;
ALTER TABLE public.testimonios_web ADD COLUMN IF NOT EXISTS calificacion integer;
ALTER TABLE public.testimonios_web ADD COLUMN IF NOT EXISTS ciudad character varying(50);
ALTER TABLE public.testimonios_web ADD COLUMN IF NOT EXISTS fecha_experiencia date;
ALTER TABLE public.testimonios_web ADD COLUMN IF NOT EXISTS plan_contratado character varying(50);
ALTER TABLE public.testimonios_web ADD COLUMN IF NOT EXISTS tiempo_uso_meses integer;
ALTER TABLE public.testimonios_web ADD COLUMN IF NOT EXISTS activo boolean DEFAULT true;
ALTER TABLE public.testimonios_web ADD COLUMN IF NOT EXISTS destacado boolean DEFAULT false;
ALTER TABLE public.testimonios_web ADD COLUMN IF NOT EXISTS orden_display integer DEFAULT 0;
ALTER TABLE public.testimonios_web ADD COLUMN IF NOT EXISTS created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE public.testimonios_web ADD COLUMN IF NOT EXISTS updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP;

-- Columnas de public.transferencias_almacen
ALTER TABLE public.transferencias_almacen ADD COLUMN IF NOT EXISTS id_transferencia integer DEFAULT nextval('transferencias_almacen_id_transferencia_seq'::regclass) NOT NULL;
ALTER TABLE public.transferencias_almacen ADD COLUMN IF NOT EXISTS id_producto integer NOT NULL;
ALTER TABLE public.transferencias_almacen ADD COLUMN IF NOT EXISTS id_lote integer;
ALTER TABLE public.transferencias_almacen ADD COLUMN IF NOT EXISTS cantidad_transferida numeric(10,2) NOT NULL;
ALTER TABLE public.transferencias_almacen ADD COLUMN IF NOT EXISTS almacen_origen integer NOT NULL;
ALTER TABLE public.transferencias_almacen ADD COLUMN IF NOT EXISTS almacen_destino integer NOT NULL;
ALTER TABLE public.transferencias_almacen ADD COLUMN IF NOT EXISTS motivo character varying(200);
ALTER TABLE public.transferencias_almacen ADD COLUMN IF NOT EXISTS id_responsable integer NOT NULL;
ALTER TABLE public.transferencias_almacen ADD COLUMN IF NOT EXISTS fecha_transferencia timestamp without time zone DEFAULT now();
ALTER TABLE public.transferencias_almacen ADD COLUMN IF NOT EXISTS estado character varying(20) DEFAULT 'pendiente'::character varying;
ALTER TABLE public.transferencias_almacen ADD COLUMN IF NOT EXISTS id_restaurante integer NOT NULL;

-- Columnas de public.user_sessions
ALTER TABLE public.user_sessions ADD COLUMN IF NOT EXISTS id integer DEFAULT nextval('user_sessions_id_seq'::regclass) NOT NULL;
ALTER TABLE public.user_sessions ADD COLUMN IF NOT EXISTS session_id character varying(100) NOT NULL;
ALTER TABLE public.user_sessions ADD COLUMN IF NOT EXISTS ip_address inet;
ALTER TABLE public.user_sessions ADD COLUMN IF NOT EXISTS user_agent text;
ALTER TABLE public.user_sessions ADD COLUMN IF NOT EXISTS referrer text;
ALTER TABLE public.user_sessions ADD COLUMN IF NOT EXISTS landing_page character varying(500);
ALTER TABLE public.user_sessions ADD COLUMN IF NOT EXISTS utm_source character varying(100);
ALTER TABLE public.user_sessions ADD COLUMN IF NOT EXISTS utm_medium character varying(100);
ALTER TABLE public.user_sessions ADD COLUMN IF NOT EXISTS utm_campaign character varying(100);
ALTER TABLE public.user_sessions ADD COLUMN IF NOT EXISTS utm_term character varying(100);
ALTER TABLE public.user_sessions ADD COLUMN IF NOT EXISTS utm_content character varying(100);
ALTER TABLE public.user_sessions ADD COLUMN IF NOT EXISTS country character varying(50);
ALTER TABLE public.user_sessions ADD COLUMN IF NOT EXISTS city character varying(100);
ALTER TABLE public.user_sessions ADD COLUMN IF NOT EXISTS device_type character varying(50);
ALTER TABLE public.user_sessions ADD COLUMN IF NOT EXISTS browser character varying(100);
ALTER TABLE public.user_sessions ADD COLUMN IF NOT EXISTS os character varying(100);
ALTER TABLE public.user_sessions ADD COLUMN IF NOT EXISTS first_visit timestamp without time zone DEFAULT now();
ALTER TABLE public.user_sessions ADD COLUMN IF NOT EXISTS last_visit timestamp without time zone DEFAULT now();
ALTER TABLE public.user_sessions ADD COLUMN IF NOT EXISTS visit_count integer DEFAULT 1;
ALTER TABLE public.user_sessions ADD COLUMN IF NOT EXISTS is_converted boolean DEFAULT false;
ALTER TABLE public.user_sessions ADD COLUMN IF NOT EXISTS conversion_event character varying(50);
ALTER TABLE public.user_sessions ADD COLUMN IF NOT EXISTS conversion_timestamp timestamp without time zone;
ALTER TABLE public.user_sessions ADD COLUMN IF NOT EXISTS created_at timestamp without time zone DEFAULT now();
ALTER TABLE public.user_sessions ADD COLUMN IF NOT EXISTS updated_at timestamp without time zone DEFAULT now();

-- Columnas de public.uso_recursos
ALTER TABLE public.uso_recursos ADD COLUMN IF NOT EXISTS id_uso integer DEFAULT nextval('uso_recursos_id_uso_seq'::regclass) NOT NULL;
ALTER TABLE public.uso_recursos ADD COLUMN IF NOT EXISTS id_restaurante integer NOT NULL;
ALTER TABLE public.uso_recursos ADD COLUMN IF NOT EXISTS id_plan integer NOT NULL;
ALTER TABLE public.uso_recursos ADD COLUMN IF NOT EXISTS productos_actuales integer DEFAULT 0;
ALTER TABLE public.uso_recursos ADD COLUMN IF NOT EXISTS usuarios_actuales integer DEFAULT 0;
ALTER TABLE public.uso_recursos ADD COLUMN IF NOT EXISTS sucursales_actuales integer DEFAULT 0;
ALTER TABLE public.uso_recursos ADD COLUMN IF NOT EXISTS transacciones_mes_actual integer DEFAULT 0;
ALTER TABLE public.uso_recursos ADD COLUMN IF NOT EXISTS almacenamiento_usado_mb integer DEFAULT 0;
ALTER TABLE public.uso_recursos ADD COLUMN IF NOT EXISTS mes_medicion integer NOT NULL;
ALTER TABLE public.uso_recursos ADD COLUMN IF NOT EXISTS año_medicion integer NOT NULL;
ALTER TABLE public.uso_recursos ADD COLUMN IF NOT EXISTS created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE public.uso_recursos ADD COLUMN IF NOT EXISTS updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP;

-- Columnas de public.usuarios
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS id_usuario integer;
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS nombre character varying(150);
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS email character varying(255);
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS password_hash character varying(255);
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS rol_id integer;
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS id_sucursal integer;
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS activo boolean;
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS creado_en timestamp without time zone;
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS actualizado_en timestamp without time zone;

-- Columnas de public.v_integrity_monitoring
ALTER TABLE public.v_integrity_monitoring ADD COLUMN IF NOT EXISTS table_name text;
ALTER TABLE public.v_integrity_monitoring ADD COLUMN IF NOT EXISTS total_records bigint;
ALTER TABLE public.v_integrity_monitoring ADD COLUMN IF NOT EXISTS active_mesas bigint;
ALTER TABLE public.v_integrity_monitoring ADD COLUMN IF NOT EXISTS free_mesas bigint;
ALTER TABLE public.v_integrity_monitoring ADD COLUMN IF NOT EXISTS total_acumulado numeric;

-- Columnas de public.vendedores
ALTER TABLE public.vendedores ADD COLUMN IF NOT EXISTS id_vendedor integer DEFAULT nextval('vendedores_id_vendedor_seq'::regclass) NOT NULL;
ALTER TABLE public.vendedores ADD COLUMN IF NOT EXISTS nombre character varying(150) NOT NULL;
ALTER TABLE public.vendedores ADD COLUMN IF NOT EXISTS username character varying(50) NOT NULL;
ALTER TABLE public.vendedores ADD COLUMN IF NOT EXISTS email character varying(255);
ALTER TABLE public.vendedores ADD COLUMN IF NOT EXISTS password_hash character varying(255);
ALTER TABLE public.vendedores ADD COLUMN IF NOT EXISTS rol character varying(255) DEFAULT 'cajero'::character varying;
ALTER TABLE public.vendedores ADD COLUMN IF NOT EXISTS activo boolean DEFAULT true;
ALTER TABLE public.vendedores ADD COLUMN IF NOT EXISTS created_at timestamp without time zone DEFAULT now();
ALTER TABLE public.vendedores ADD COLUMN IF NOT EXISTS id_sucursal integer;
ALTER TABLE public.vendedores ADD COLUMN IF NOT EXISTS id_restaurante integer DEFAULT 1 NOT NULL;
ALTER TABLE public.vendedores ADD COLUMN IF NOT EXISTS rol_admin_id integer;

-- Columnas de public.ventas
ALTER TABLE public.ventas ADD COLUMN IF NOT EXISTS id_venta integer DEFAULT nextval('ventas_id_venta_seq'::regclass) NOT NULL;
ALTER TABLE public.ventas ADD COLUMN IF NOT EXISTS fecha timestamp without time zone DEFAULT now();
ALTER TABLE public.ventas ADD COLUMN IF NOT EXISTS id_vendedor integer;
ALTER TABLE public.ventas ADD COLUMN IF NOT EXISTS id_pago integer;
ALTER TABLE public.ventas ADD COLUMN IF NOT EXISTS id_sucursal integer;
ALTER TABLE public.ventas ADD COLUMN IF NOT EXISTS tipo_servicio character varying(20) DEFAULT 'Mesa'::character varying;
ALTER TABLE public.ventas ADD COLUMN IF NOT EXISTS total numeric(10,2) DEFAULT 0;
ALTER TABLE public.ventas ADD COLUMN IF NOT EXISTS mesa_numero integer;
ALTER TABLE public.ventas ADD COLUMN IF NOT EXISTS created_at timestamp without time zone DEFAULT now();
ALTER TABLE public.ventas ADD COLUMN IF NOT EXISTS estado character varying(30) DEFAULT 'recibido'::character varying;
ALTER TABLE public.ventas ADD COLUMN IF NOT EXISTS id_restaurante integer DEFAULT 1 NOT NULL;
ALTER TABLE public.ventas ADD COLUMN IF NOT EXISTS id_mesa integer;
ALTER TABLE public.ventas ADD COLUMN IF NOT EXISTS tipo_pago character varying(20) DEFAULT 'anticipado'::character varying;
ALTER TABLE public.ventas ADD COLUMN IF NOT EXISTS id_pago_final integer;
ALTER TABLE public.ventas ADD COLUMN IF NOT EXISTS fecha_pago_final timestamp without time zone;
ALTER TABLE public.ventas ADD COLUMN IF NOT EXISTS estado_pago character varying(20) DEFAULT 'pagado'::character varying;
ALTER TABLE public.ventas ADD COLUMN IF NOT EXISTS updated_at timestamp without time zone DEFAULT now();

-- Columnas de public.vista_lotes_criticos
ALTER TABLE public.vista_lotes_criticos ADD COLUMN IF NOT EXISTS id_lote integer;
ALTER TABLE public.vista_lotes_criticos ADD COLUMN IF NOT EXISTS numero_lote character varying(100);
ALTER TABLE public.vista_lotes_criticos ADD COLUMN IF NOT EXISTS producto_nombre character varying(200);
ALTER TABLE public.vista_lotes_criticos ADD COLUMN IF NOT EXISTS categoria_nombre character varying(100);
ALTER TABLE public.vista_lotes_criticos ADD COLUMN IF NOT EXISTS cantidad_actual numeric(10,2);
ALTER TABLE public.vista_lotes_criticos ADD COLUMN IF NOT EXISTS fecha_caducidad date;
ALTER TABLE public.vista_lotes_criticos ADD COLUMN IF NOT EXISTS precio_compra numeric(10,2);
ALTER TABLE public.vista_lotes_criticos ADD COLUMN IF NOT EXISTS estado_caducidad text;
ALTER TABLE public.vista_lotes_criticos ADD COLUMN IF NOT EXISTS estado_stock text;
ALTER TABLE public.vista_lotes_criticos ADD COLUMN IF NOT EXISTS dias_vencido integer;
ALTER TABLE public.vista_lotes_criticos ADD COLUMN IF NOT EXISTS dias_restantes integer;

-- Columnas de public.vista_pagos_diferidos
ALTER TABLE public.vista_pagos_diferidos ADD COLUMN IF NOT EXISTS id_pago_diferido integer;
ALTER TABLE public.vista_pagos_diferidos ADD COLUMN IF NOT EXISTS id_venta integer;
ALTER TABLE public.vista_pagos_diferidos ADD COLUMN IF NOT EXISTS mesa_numero integer;
ALTER TABLE public.vista_pagos_diferidos ADD COLUMN IF NOT EXISTS total numeric(10,2);
ALTER TABLE public.vista_pagos_diferidos ADD COLUMN IF NOT EXISTS tipo_servicio character varying(20);
ALTER TABLE public.vista_pagos_diferidos ADD COLUMN IF NOT EXISTS fecha_creacion timestamp without time zone;
ALTER TABLE public.vista_pagos_diferidos ADD COLUMN IF NOT EXISTS fecha_vencimiento timestamp without time zone;
ALTER TABLE public.vista_pagos_diferidos ADD COLUMN IF NOT EXISTS estado character varying(20);
ALTER TABLE public.vista_pagos_diferidos ADD COLUMN IF NOT EXISTS observaciones text;
ALTER TABLE public.vista_pagos_diferidos ADD COLUMN IF NOT EXISTS id_restaurante integer;
ALTER TABLE public.vista_pagos_diferidos ADD COLUMN IF NOT EXISTS estado_real character varying;
ALTER TABLE public.vista_pagos_diferidos ADD COLUMN IF NOT EXISTS dias_pendiente integer;

-- Columnas de public.vista_resumen_inventario
ALTER TABLE public.vista_resumen_inventario ADD COLUMN IF NOT EXISTS id_producto integer;
ALTER TABLE public.vista_resumen_inventario ADD COLUMN IF NOT EXISTS producto_nombre character varying(200);
ALTER TABLE public.vista_resumen_inventario ADD COLUMN IF NOT EXISTS categoria_nombre character varying(100);
ALTER TABLE public.vista_resumen_inventario ADD COLUMN IF NOT EXISTS stock_actual integer;
ALTER TABLE public.vista_resumen_inventario ADD COLUMN IF NOT EXISTS precio numeric(10,2);
ALTER TABLE public.vista_resumen_inventario ADD COLUMN IF NOT EXISTS stock_en_lotes numeric;
ALTER TABLE public.vista_resumen_inventario ADD COLUMN IF NOT EXISTS total_lotes bigint;
ALTER TABLE public.vista_resumen_inventario ADD COLUMN IF NOT EXISTS lotes_vencidos bigint;
ALTER TABLE public.vista_resumen_inventario ADD COLUMN IF NOT EXISTS lotes_por_vencer bigint;
ALTER TABLE public.vista_resumen_inventario ADD COLUMN IF NOT EXISTS proxima_caducidad date;
ALTER TABLE public.vista_resumen_inventario ADD COLUMN IF NOT EXISTS estado_stock text;

-- RESTRICCIONES
ALTER TABLE public.admin_users ADD CONSTRAINT admin_users_pkey PRIMARY KEY (id);
ALTER TABLE public.admin_users ADD CONSTRAINT admin_users_username_key UNIQUE (username);
ALTER TABLE public.alertas_inventario ADD CONSTRAINT alertas_inventario_pkey PRIMARY KEY (id_alerta);
ALTER TABLE public.alertas_limites ADD CONSTRAINT alertas_limites_pkey PRIMARY KEY (id_alerta);
ALTER TABLE public.alertas_limites ADD CONSTRAINT fk_alerta_plan FOREIGN KEY (id_plan) REFERENCES public.planes(id_plan);
ALTER TABLE public.alertas_limites ADD CONSTRAINT fk_alerta_restaurante FOREIGN KEY (id_restaurante) REFERENCES public.restaurantes(id_restaurante);
ALTER TABLE public.archivos_egresos ADD CONSTRAINT archivos_egresos_pkey PRIMARY KEY (id_archivo);
ALTER TABLE public.archivos_egresos ADD CONSTRAINT fk_archivos_egreso FOREIGN KEY (id_egreso) REFERENCES public.egresos(id_egreso);
ALTER TABLE public.archivos_egresos ADD CONSTRAINT fk_archivos_vendedor FOREIGN KEY (subido_por) REFERENCES public.vendedores(id_vendedor);
ALTER TABLE public.arqueos_caja ADD CONSTRAINT arqueos_caja_pkey PRIMARY KEY (id_arqueo);
ALTER TABLE public.auditoria_admin ADD CONSTRAINT auditoria_admin_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.vendedores(id_vendedor);
ALTER TABLE public.auditoria_admin ADD CONSTRAINT auditoria_admin_pkey PRIMARY KEY (id_auditoria);
ALTER TABLE public.auditoria_planes ADD CONSTRAINT auditoria_planes_pkey PRIMARY KEY (id_auditoria);
ALTER TABLE public.auditoria_planes ADD CONSTRAINT fk_auditoria_plan_anterior FOREIGN KEY (id_plan_anterior) REFERENCES public.planes(id_plan);
ALTER TABLE public.auditoria_planes ADD CONSTRAINT fk_auditoria_plan_nuevo FOREIGN KEY (id_plan_nuevo) REFERENCES public.planes(id_plan);
ALTER TABLE public.auditoria_planes ADD CONSTRAINT fk_auditoria_restaurante FOREIGN KEY (id_restaurante) REFERENCES public.restaurantes(id_restaurante);
ALTER TABLE public.auditoria_planes ADD CONSTRAINT fk_auditoria_usuario FOREIGN KEY (id_usuario_cambio) REFERENCES public.vendedores(id_vendedor);
ALTER TABLE public.auditoria_pos ADD CONSTRAINT auditoria_pos_id_restaurante_fkey FOREIGN KEY (id_restaurante) REFERENCES public.restaurantes(id_restaurante);
ALTER TABLE public.auditoria_pos ADD CONSTRAINT auditoria_pos_id_vendedor_fkey FOREIGN KEY (id_vendedor) REFERENCES public.vendedores(id_vendedor);
ALTER TABLE public.auditoria_pos ADD CONSTRAINT auditoria_pos_pkey PRIMARY KEY (id_auditoria);
ALTER TABLE public.casos_exito ADD CONSTRAINT casos_exito_pkey PRIMARY KEY (id);
ALTER TABLE public.categorias ADD CONSTRAINT categorias_nombre_key UNIQUE (nombre);
ALTER TABLE public.categorias ADD CONSTRAINT categorias_pkey PRIMARY KEY (id_categoria);
ALTER TABLE public.categorias ADD CONSTRAINT fk_categorias_restaurante FOREIGN KEY (id_restaurante) REFERENCES public.restaurantes(id_restaurante);
ALTER TABLE public.categorias ADD CONSTRAINT unique_categoria_restaurante UNIQUE (nombre);
ALTER TABLE public.categorias ADD CONSTRAINT unique_categoria_restaurante UNIQUE (id_restaurante);
ALTER TABLE public.categorias ADD CONSTRAINT unique_categoria_restaurante UNIQUE (id_restaurante);
ALTER TABLE public.categorias ADD CONSTRAINT unique_categoria_restaurante UNIQUE (nombre);
ALTER TABLE public.categorias_almacen ADD CONSTRAINT categorias_almacen_nombre_key UNIQUE (nombre);
ALTER TABLE public.categorias_almacen ADD CONSTRAINT categorias_almacen_pkey PRIMARY KEY (id_categoria_almacen);
ALTER TABLE public.categorias_egresos ADD CONSTRAINT categorias_egresos_pkey PRIMARY KEY (id_categoria_egreso);
ALTER TABLE public.categorias_egresos ADD CONSTRAINT fk_categorias_egresos_restaurante FOREIGN KEY (id_restaurante) REFERENCES public.restaurantes(id_restaurante);
ALTER TABLE public.categorias_egresos ADD CONSTRAINT uk_categorias_egresos_nombre_restaurante UNIQUE (nombre);
ALTER TABLE public.categorias_egresos ADD CONSTRAINT uk_categorias_egresos_nombre_restaurante UNIQUE (nombre);
ALTER TABLE public.categorias_egresos ADD CONSTRAINT uk_categorias_egresos_nombre_restaurante UNIQUE (id_restaurante);
ALTER TABLE public.categorias_egresos ADD CONSTRAINT uk_categorias_egresos_nombre_restaurante UNIQUE (id_restaurante);
ALTER TABLE public.clientes ADD CONSTRAINT clientes_pkey PRIMARY KEY (id_cliente);
ALTER TABLE public.configuracion_web ADD CONSTRAINT configuracion_web_clave_key UNIQUE (clave);
ALTER TABLE public.configuracion_web ADD CONSTRAINT configuracion_web_pkey PRIMARY KEY (id);
ALTER TABLE public.configuraciones_restaurante ADD CONSTRAINT configuraciones_restaurante_id_restaurante_clave_config_key UNIQUE (clave_config);
ALTER TABLE public.configuraciones_restaurante ADD CONSTRAINT configuraciones_restaurante_id_restaurante_clave_config_key UNIQUE (id_restaurante);
ALTER TABLE public.configuraciones_restaurante ADD CONSTRAINT configuraciones_restaurante_id_restaurante_clave_config_key UNIQUE (id_restaurante);
ALTER TABLE public.configuraciones_restaurante ADD CONSTRAINT configuraciones_restaurante_id_restaurante_clave_config_key UNIQUE (clave_config);
ALTER TABLE public.configuraciones_restaurante ADD CONSTRAINT configuraciones_restaurante_pkey PRIMARY KEY (id_config);
ALTER TABLE public.configuraciones_sistema ADD CONSTRAINT configuraciones_sistema_pkey PRIMARY KEY (clave_config);
ALTER TABLE public.contadores_uso ADD CONSTRAINT contadores_uso_id_plan_fkey FOREIGN KEY (id_plan) REFERENCES public.planes(id_plan);
ALTER TABLE public.contadores_uso ADD CONSTRAINT contadores_uso_id_restaurante_recurso_fecha_medicion_key UNIQUE (fecha_medicion);
ALTER TABLE public.contadores_uso ADD CONSTRAINT contadores_uso_id_restaurante_recurso_fecha_medicion_key UNIQUE (id_restaurante);
ALTER TABLE public.contadores_uso ADD CONSTRAINT contadores_uso_id_restaurante_recurso_fecha_medicion_key UNIQUE (fecha_medicion);
ALTER TABLE public.contadores_uso ADD CONSTRAINT contadores_uso_id_restaurante_recurso_fecha_medicion_key UNIQUE (fecha_medicion);
ALTER TABLE public.contadores_uso ADD CONSTRAINT contadores_uso_id_restaurante_recurso_fecha_medicion_key UNIQUE (recurso);
ALTER TABLE public.contadores_uso ADD CONSTRAINT contadores_uso_id_restaurante_recurso_fecha_medicion_key UNIQUE (recurso);
ALTER TABLE public.contadores_uso ADD CONSTRAINT contadores_uso_id_restaurante_recurso_fecha_medicion_key UNIQUE (recurso);
ALTER TABLE public.contadores_uso ADD CONSTRAINT contadores_uso_id_restaurante_recurso_fecha_medicion_key UNIQUE (id_restaurante);
ALTER TABLE public.contadores_uso ADD CONSTRAINT contadores_uso_id_restaurante_recurso_fecha_medicion_key UNIQUE (id_restaurante);
ALTER TABLE public.contadores_uso ADD CONSTRAINT contadores_uso_pkey PRIMARY KEY (id_contador);
ALTER TABLE public.contenido_web ADD CONSTRAINT contenido_web_pkey PRIMARY KEY (id);
ALTER TABLE public.contenido_web ADD CONSTRAINT contenido_web_slug_key UNIQUE (slug);
ALTER TABLE public.conversion_events ADD CONSTRAINT conversion_events_pkey PRIMARY KEY (id);
ALTER TABLE public.demos_reuniones ADD CONSTRAINT demos_reuniones_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads_prospectos(id);
ALTER TABLE public.demos_reuniones ADD CONSTRAINT demos_reuniones_pkey PRIMARY KEY (id);
ALTER TABLE public.detalle_ventas ADD CONSTRAINT detalle_ventas_id_producto_fkey FOREIGN KEY (id_producto) REFERENCES public.productos(id_producto);
ALTER TABLE public.detalle_ventas ADD CONSTRAINT detalle_ventas_id_venta_fkey FOREIGN KEY (id_venta) REFERENCES public.ventas(id_venta);
ALTER TABLE public.detalle_ventas ADD CONSTRAINT detalle_ventas_pkey PRIMARY KEY (id_detalle);
ALTER TABLE public.detalle_ventas ADD CONSTRAINT fk_detalle_ventas_restaurante FOREIGN KEY (id_restaurante) REFERENCES public.restaurantes(id_restaurante);
ALTER TABLE public.detalle_ventas_modificadores ADD CONSTRAINT detalle_ventas_modificadores_id_detalle_venta_fkey FOREIGN KEY (id_detalle_venta) REFERENCES public.detalle_ventas(id_detalle);
ALTER TABLE public.detalle_ventas_modificadores ADD CONSTRAINT detalle_ventas_modificadores_id_modificador_fkey FOREIGN KEY (id_modificador) REFERENCES public.productos_modificadores(id_modificador);
ALTER TABLE public.detalle_ventas_modificadores ADD CONSTRAINT detalle_ventas_modificadores_pkey PRIMARY KEY (id_detalle_venta);
ALTER TABLE public.detalle_ventas_modificadores ADD CONSTRAINT detalle_ventas_modificadores_pkey PRIMARY KEY (id_detalle_venta);
ALTER TABLE public.detalle_ventas_modificadores ADD CONSTRAINT detalle_ventas_modificadores_pkey PRIMARY KEY (id_modificador);
ALTER TABLE public.detalle_ventas_modificadores ADD CONSTRAINT detalle_ventas_modificadores_pkey PRIMARY KEY (id_modificador);
ALTER TABLE public.dim_tiempo ADD CONSTRAINT dim_tiempo_fecha_key UNIQUE (fecha);
ALTER TABLE public.dim_tiempo ADD CONSTRAINT dim_tiempo_pkey PRIMARY KEY (id_tiempo);
ALTER TABLE public.egresos ADD CONSTRAINT egresos_pkey PRIMARY KEY (id_egreso);
ALTER TABLE public.egresos ADD CONSTRAINT fk_egresos_aprobado_por FOREIGN KEY (aprobado_por) REFERENCES public.vendedores(id_vendedor);
ALTER TABLE public.egresos ADD CONSTRAINT fk_egresos_categoria FOREIGN KEY (id_categoria_egreso) REFERENCES public.categorias_egresos(id_categoria_egreso);
ALTER TABLE public.egresos ADD CONSTRAINT fk_egresos_registrado_por FOREIGN KEY (registrado_por) REFERENCES public.vendedores(id_vendedor);
ALTER TABLE public.egresos ADD CONSTRAINT fk_egresos_restaurante FOREIGN KEY (id_restaurante) REFERENCES public.restaurantes(id_restaurante);
ALTER TABLE public.egresos ADD CONSTRAINT fk_egresos_sucursal FOREIGN KEY (id_sucursal) REFERENCES public.sucursales(id_sucursal);
ALTER TABLE public.facturas ADD CONSTRAINT facturas_id_venta_fkey FOREIGN KEY (id_venta) REFERENCES public.ventas(id_venta);
ALTER TABLE public.facturas ADD CONSTRAINT facturas_numero_key UNIQUE (numero);
ALTER TABLE public.facturas ADD CONSTRAINT facturas_pkey PRIMARY KEY (id_factura);
ALTER TABLE public.flujo_aprobaciones_egresos ADD CONSTRAINT fk_flujo_egreso FOREIGN KEY (id_egreso) REFERENCES public.egresos(id_egreso);
ALTER TABLE public.flujo_aprobaciones_egresos ADD CONSTRAINT fk_flujo_vendedor FOREIGN KEY (id_vendedor) REFERENCES public.vendedores(id_vendedor);
ALTER TABLE public.flujo_aprobaciones_egresos ADD CONSTRAINT flujo_aprobaciones_egresos_pkey PRIMARY KEY (id_flujo);
ALTER TABLE public.grupos_mesas ADD CONSTRAINT fk_grupos_mesas_mesero FOREIGN KEY (id_mesero) REFERENCES public.vendedores(id_vendedor);
ALTER TABLE public.grupos_mesas ADD CONSTRAINT fk_grupos_mesas_restaurante FOREIGN KEY (id_restaurante) REFERENCES public.restaurantes(id_restaurante);
ALTER TABLE public.grupos_mesas ADD CONSTRAINT fk_grupos_mesas_sucursal FOREIGN KEY (id_sucursal) REFERENCES public.sucursales(id_sucursal);
ALTER TABLE public.grupos_mesas ADD CONSTRAINT grupos_mesas_pkey PRIMARY KEY (id_grupo_mesa);
ALTER TABLE public.historial_pagos_diferidos ADD CONSTRAINT historial_pagos_diferidos_id_pago_diferido_fkey FOREIGN KEY (id_pago_diferido) REFERENCES public.pagos_diferidos(id_pago_diferido);
ALTER TABLE public.historial_pagos_diferidos ADD CONSTRAINT historial_pagos_diferidos_id_pago_final_fkey FOREIGN KEY (id_pago_final) REFERENCES public.metodos_pago_backup(id_pago);
ALTER TABLE public.historial_pagos_diferidos ADD CONSTRAINT historial_pagos_diferidos_id_vendedor_fkey FOREIGN KEY (id_vendedor) REFERENCES public.vendedores(id_vendedor);
ALTER TABLE public.historial_pagos_diferidos ADD CONSTRAINT historial_pagos_diferidos_id_venta_fkey FOREIGN KEY (id_venta) REFERENCES public.ventas(id_venta);
ALTER TABLE public.historial_pagos_diferidos ADD CONSTRAINT historial_pagos_diferidos_pkey PRIMARY KEY (id_historial);
ALTER TABLE public.integrity_logs ADD CONSTRAINT integrity_logs_pkey PRIMARY KEY (id);
ALTER TABLE public.inventario_lotes ADD CONSTRAINT fk_lotes_sucursal FOREIGN KEY (id_sucursal) REFERENCES public.sucursales(id_sucursal);
ALTER TABLE public.inventario_lotes ADD CONSTRAINT inventario_lotes_pkey PRIMARY KEY (id_lote);
ALTER TABLE public.leads_prospectos ADD CONSTRAINT leads_prospectos_interes_plan_id_fkey FOREIGN KEY (interes_plan_id) REFERENCES public.planes_pos(id);
ALTER TABLE public.leads_prospectos ADD CONSTRAINT leads_prospectos_pkey PRIMARY KEY (id);
ALTER TABLE public.mesas ADD CONSTRAINT fk_mesas_grupo_mesa FOREIGN KEY (id_grupo_mesa) REFERENCES public.grupos_mesas(id_grupo_mesa);
ALTER TABLE public.mesas ADD CONSTRAINT fk_mesas_mesero_actual FOREIGN KEY (id_mesero_actual) REFERENCES public.vendedores(id_vendedor);
ALTER TABLE public.mesas ADD CONSTRAINT fk_mesas_restaurante FOREIGN KEY (id_restaurante) REFERENCES public.restaurantes(id_restaurante);
ALTER TABLE public.mesas ADD CONSTRAINT mesas_id_sucursal_fkey FOREIGN KEY (id_sucursal) REFERENCES public.sucursales(id_sucursal);
ALTER TABLE public.mesas ADD CONSTRAINT mesas_id_venta_actual_fkey FOREIGN KEY (id_venta_actual) REFERENCES public.ventas(id_venta);
ALTER TABLE public.mesas ADD CONSTRAINT mesas_numero_sucursal_restaurante_unique UNIQUE (id_restaurante);
ALTER TABLE public.mesas ADD CONSTRAINT mesas_numero_sucursal_restaurante_unique UNIQUE (id_restaurante);
ALTER TABLE public.mesas ADD CONSTRAINT mesas_numero_sucursal_restaurante_unique UNIQUE (id_restaurante);
ALTER TABLE public.mesas ADD CONSTRAINT mesas_numero_sucursal_restaurante_unique UNIQUE (numero);
ALTER TABLE public.mesas ADD CONSTRAINT mesas_numero_sucursal_restaurante_unique UNIQUE (numero);
ALTER TABLE public.mesas ADD CONSTRAINT mesas_numero_sucursal_restaurante_unique UNIQUE (numero);
ALTER TABLE public.mesas ADD CONSTRAINT mesas_numero_sucursal_restaurante_unique UNIQUE (id_sucursal);
ALTER TABLE public.mesas ADD CONSTRAINT mesas_numero_sucursal_restaurante_unique UNIQUE (id_sucursal);
ALTER TABLE public.mesas ADD CONSTRAINT mesas_numero_sucursal_restaurante_unique UNIQUE (id_sucursal);
ALTER TABLE public.mesas ADD CONSTRAINT mesas_pkey PRIMARY KEY (id_mesa);
ALTER TABLE public.mesas_en_grupo ADD CONSTRAINT fk_mesas_en_grupo_grupo_mesa FOREIGN KEY (id_grupo_mesa) REFERENCES public.grupos_mesas(id_grupo_mesa);
ALTER TABLE public.mesas_en_grupo ADD CONSTRAINT fk_mesas_en_grupo_mesa FOREIGN KEY (id_mesa) REFERENCES public.mesas(id_mesa);
ALTER TABLE public.mesas_en_grupo ADD CONSTRAINT mesas_en_grupo_pkey PRIMARY KEY (id_mesa_en_grupo);
ALTER TABLE public.mesas_en_grupo ADD CONSTRAINT uq_mesa_en_grupo UNIQUE (id_mesa);
ALTER TABLE public.metodos_pago ADD CONSTRAINT metodos_pago_descripcion_unique UNIQUE (descripcion);
ALTER TABLE public.metodos_pago ADD CONSTRAINT metodos_pago_pkey1 PRIMARY KEY (id_pago);
ALTER TABLE public.metodos_pago_backup ADD CONSTRAINT fk_metodos_pago_restaurante FOREIGN KEY (id_restaurante) REFERENCES public.restaurantes(id_restaurante);
ALTER TABLE public.metodos_pago_backup ADD CONSTRAINT metodos_pago_pkey PRIMARY KEY (id_pago);
ALTER TABLE public.metodos_pago_backup ADD CONSTRAINT unique_metodo_pago_restaurante UNIQUE (id_restaurante);
ALTER TABLE public.metodos_pago_backup ADD CONSTRAINT unique_metodo_pago_restaurante UNIQUE (descripcion);
ALTER TABLE public.metodos_pago_backup ADD CONSTRAINT unique_metodo_pago_restaurante UNIQUE (descripcion);
ALTER TABLE public.metodos_pago_backup ADD CONSTRAINT unique_metodo_pago_restaurante UNIQUE (id_restaurante);
ALTER TABLE public.metricas_web ADD CONSTRAINT metricas_web_pkey PRIMARY KEY (id);
ALTER TABLE public.migrations ADD CONSTRAINT migrations_migration_name_key UNIQUE (migration_name);
ALTER TABLE public.migrations ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);
ALTER TABLE public.movimientos_inventario ADD CONSTRAINT fk_movimientos_sucursal FOREIGN KEY (id_sucursal) REFERENCES public.sucursales(id_sucursal);
ALTER TABLE public.movimientos_inventario ADD CONSTRAINT movimientos_inventario_id_producto_fkey FOREIGN KEY (id_producto) REFERENCES public.productos(id_producto);
ALTER TABLE public.movimientos_inventario ADD CONSTRAINT movimientos_inventario_id_restaurante_fkey FOREIGN KEY (id_restaurante) REFERENCES public.restaurantes(id_restaurante);
ALTER TABLE public.movimientos_inventario ADD CONSTRAINT movimientos_inventario_id_vendedor_fkey FOREIGN KEY (id_vendedor) REFERENCES public.vendedores(id_vendedor);
ALTER TABLE public.movimientos_inventario ADD CONSTRAINT movimientos_inventario_pkey PRIMARY KEY (id_movimiento);
ALTER TABLE public.newsletter_suscriptores ADD CONSTRAINT newsletter_suscriptores_email_key UNIQUE (email);
ALTER TABLE public.newsletter_suscriptores ADD CONSTRAINT newsletter_suscriptores_pkey PRIMARY KEY (id);
ALTER TABLE public.pagos_diferidos ADD CONSTRAINT pagos_diferidos_id_mesa_fkey FOREIGN KEY (id_mesa) REFERENCES public.mesas(id_mesa);
ALTER TABLE public.pagos_diferidos ADD CONSTRAINT pagos_diferidos_id_venta_fkey FOREIGN KEY (id_venta) REFERENCES public.ventas(id_venta);
ALTER TABLE public.pagos_diferidos ADD CONSTRAINT pagos_diferidos_pkey PRIMARY KEY (id_pago_diferido);
ALTER TABLE public.pagos_restaurantes ADD CONSTRAINT pagos_restaurantes_id_restaurante_fkey FOREIGN KEY (id_restaurante) REFERENCES public.restaurantes(id_restaurante);
ALTER TABLE public.pagos_restaurantes ADD CONSTRAINT pagos_restaurantes_pkey PRIMARY KEY (id);
ALTER TABLE public.planes ADD CONSTRAINT planes_nombre_key UNIQUE (nombre);
ALTER TABLE public.planes ADD CONSTRAINT planes_pkey PRIMARY KEY (id_plan);
ALTER TABLE public.planes_pos ADD CONSTRAINT planes_pos_pkey PRIMARY KEY (id);
ALTER TABLE public.prefacturas ADD CONSTRAINT prefacturas_id_mesa_fkey FOREIGN KEY (id_mesa) REFERENCES public.mesas(id_mesa);
ALTER TABLE public.prefacturas ADD CONSTRAINT prefacturas_id_venta_principal_fkey FOREIGN KEY (id_venta_principal) REFERENCES public.ventas(id_venta);
ALTER TABLE public.prefacturas ADD CONSTRAINT prefacturas_pkey PRIMARY KEY (id_prefactura);
ALTER TABLE public.presupuestos_egresos ADD CONSTRAINT fk_presupuestos_categoria FOREIGN KEY (id_categoria_egreso) REFERENCES public.categorias_egresos(id_categoria_egreso);
ALTER TABLE public.presupuestos_egresos ADD CONSTRAINT fk_presupuestos_restaurante FOREIGN KEY (id_restaurante) REFERENCES public.restaurantes(id_restaurante);
ALTER TABLE public.presupuestos_egresos ADD CONSTRAINT presupuestos_egresos_pkey PRIMARY KEY (id_presupuesto);
ALTER TABLE public.presupuestos_egresos ADD CONSTRAINT uk_presupuestos_categoria_periodo UNIQUE (id_categoria_egreso);
ALTER TABLE public.presupuestos_egresos ADD CONSTRAINT uk_presupuestos_categoria_periodo UNIQUE (id_categoria_egreso);
ALTER TABLE public.presupuestos_egresos ADD CONSTRAINT uk_presupuestos_categoria_periodo UNIQUE (id_categoria_egreso);
ALTER TABLE public.presupuestos_egresos ADD CONSTRAINT uk_presupuestos_categoria_periodo UNIQUE (id_categoria_egreso);
ALTER TABLE public.presupuestos_egresos ADD CONSTRAINT uk_presupuestos_categoria_periodo UNIQUE (anio);
ALTER TABLE public.presupuestos_egresos ADD CONSTRAINT uk_presupuestos_categoria_periodo UNIQUE (anio);
ALTER TABLE public.presupuestos_egresos ADD CONSTRAINT uk_presupuestos_categoria_periodo UNIQUE (anio);
ALTER TABLE public.presupuestos_egresos ADD CONSTRAINT uk_presupuestos_categoria_periodo UNIQUE (anio);
ALTER TABLE public.presupuestos_egresos ADD CONSTRAINT uk_presupuestos_categoria_periodo UNIQUE (mes);
ALTER TABLE public.presupuestos_egresos ADD CONSTRAINT uk_presupuestos_categoria_periodo UNIQUE (mes);
ALTER TABLE public.presupuestos_egresos ADD CONSTRAINT uk_presupuestos_categoria_periodo UNIQUE (mes);
ALTER TABLE public.presupuestos_egresos ADD CONSTRAINT uk_presupuestos_categoria_periodo UNIQUE (mes);
ALTER TABLE public.presupuestos_egresos ADD CONSTRAINT uk_presupuestos_categoria_periodo UNIQUE (id_restaurante);
ALTER TABLE public.presupuestos_egresos ADD CONSTRAINT uk_presupuestos_categoria_periodo UNIQUE (id_restaurante);
ALTER TABLE public.presupuestos_egresos ADD CONSTRAINT uk_presupuestos_categoria_periodo UNIQUE (id_restaurante);
ALTER TABLE public.presupuestos_egresos ADD CONSTRAINT uk_presupuestos_categoria_periodo UNIQUE (id_restaurante);
ALTER TABLE public.productos ADD CONSTRAINT fk_productos_restaurante FOREIGN KEY (id_restaurante) REFERENCES public.restaurantes(id_restaurante);
ALTER TABLE public.productos ADD CONSTRAINT productos_id_categoria_fkey FOREIGN KEY (id_categoria) REFERENCES public.categorias(id_categoria);
ALTER TABLE public.productos ADD CONSTRAINT productos_pkey PRIMARY KEY (id_producto);
ALTER TABLE public.productos ADD CONSTRAINT unique_producto_restaurante UNIQUE (nombre);
ALTER TABLE public.productos ADD CONSTRAINT unique_producto_restaurante UNIQUE (nombre);
ALTER TABLE public.productos ADD CONSTRAINT unique_producto_restaurante UNIQUE (id_restaurante);
ALTER TABLE public.productos ADD CONSTRAINT unique_producto_restaurante UNIQUE (id_restaurante);
ALTER TABLE public.productos_modificadores ADD CONSTRAINT productos_modificadores_id_producto_fkey FOREIGN KEY (id_producto) REFERENCES public.productos(id_producto);
ALTER TABLE public.productos_modificadores ADD CONSTRAINT productos_modificadores_pkey PRIMARY KEY (id_modificador);
ALTER TABLE public.promociones ADD CONSTRAINT promociones_id_producto_fkey FOREIGN KEY (id_producto) REFERENCES public.productos(id_producto);
ALTER TABLE public.promociones ADD CONSTRAINT promociones_id_restaurante_fkey FOREIGN KEY (id_restaurante) REFERENCES public.restaurantes(id_restaurante);
ALTER TABLE public.promociones ADD CONSTRAINT promociones_pkey PRIMARY KEY (id_promocion);
ALTER TABLE public.promociones_sucursales ADD CONSTRAINT fk_promociones_sucursales_promocion FOREIGN KEY (id_promocion) REFERENCES public.promociones(id_promocion);
ALTER TABLE public.promociones_sucursales ADD CONSTRAINT fk_promociones_sucursales_sucursal FOREIGN KEY (id_sucursal) REFERENCES public.sucursales(id_sucursal);
ALTER TABLE public.promociones_sucursales ADD CONSTRAINT promociones_sucursales_pkey PRIMARY KEY (id_relacion);
ALTER TABLE public.promociones_sucursales ADD CONSTRAINT unique_promocion_sucursal UNIQUE (id_promocion);
ALTER TABLE public.promociones_sucursales ADD CONSTRAINT unique_promocion_sucursal UNIQUE (id_promocion);
ALTER TABLE public.promociones_sucursales ADD CONSTRAINT unique_promocion_sucursal UNIQUE (id_sucursal);
ALTER TABLE public.promociones_sucursales ADD CONSTRAINT unique_promocion_sucursal UNIQUE (id_sucursal);
ALTER TABLE public.reservas ADD CONSTRAINT fk_reservas_cliente FOREIGN KEY (id_cliente) REFERENCES public.clientes(id_cliente);
ALTER TABLE public.reservas ADD CONSTRAINT fk_reservas_mesa FOREIGN KEY (id_mesa) REFERENCES public.mesas(id_mesa);
ALTER TABLE public.reservas ADD CONSTRAINT fk_reservas_registrado_por FOREIGN KEY (registrado_por) REFERENCES public.vendedores(id_vendedor);
ALTER TABLE public.reservas ADD CONSTRAINT fk_reservas_restaurante FOREIGN KEY (id_restaurante) REFERENCES public.restaurantes(id_restaurante);
ALTER TABLE public.reservas ADD CONSTRAINT fk_reservas_sucursal FOREIGN KEY (id_sucursal) REFERENCES public.sucursales(id_sucursal);
ALTER TABLE public.reservas ADD CONSTRAINT reservas_pkey PRIMARY KEY (id_reserva);
ALTER TABLE public.restaurantes ADD CONSTRAINT restaurantes_nombre_key UNIQUE (nombre);
ALTER TABLE public.restaurantes ADD CONSTRAINT restaurantes_pkey PRIMARY KEY (id_restaurante);
ALTER TABLE public.roles_admin ADD CONSTRAINT roles_admin_nombre_key UNIQUE (nombre);
ALTER TABLE public.roles_admin ADD CONSTRAINT roles_admin_pkey PRIMARY KEY (id_rol);
ALTER TABLE public.servicios_restaurante ADD CONSTRAINT fk_restaurante FOREIGN KEY (id_restaurante) REFERENCES public.restaurantes(id_restaurante);
ALTER TABLE public.servicios_restaurante ADD CONSTRAINT servicios_restaurante_pkey PRIMARY KEY (id);
ALTER TABLE public.solicitudes_demo ADD CONSTRAINT solicitudes_demo_pkey PRIMARY KEY (id_solicitud);
ALTER TABLE public.soporte_tickets ADD CONSTRAINT soporte_tickets_id_restaurante_fkey FOREIGN KEY (id_restaurante) REFERENCES public.restaurantes(id_restaurante);
ALTER TABLE public.soporte_tickets ADD CONSTRAINT soporte_tickets_id_vendedor_fkey FOREIGN KEY (id_vendedor) REFERENCES public.vendedores(id_vendedor);
ALTER TABLE public.soporte_tickets ADD CONSTRAINT soporte_tickets_pkey PRIMARY KEY (id_ticket);
ALTER TABLE public.stock_sucursal ADD CONSTRAINT fk_stock_producto FOREIGN KEY (id_producto) REFERENCES public.productos(id_producto);
ALTER TABLE public.stock_sucursal ADD CONSTRAINT fk_stock_sucursal FOREIGN KEY (id_sucursal) REFERENCES public.sucursales(id_sucursal);
ALTER TABLE public.stock_sucursal ADD CONSTRAINT stock_sucursal_pkey PRIMARY KEY (id_stock_sucursal);
ALTER TABLE public.stock_sucursal ADD CONSTRAINT unique_stock_sucursal UNIQUE (id_producto);
ALTER TABLE public.stock_sucursal ADD CONSTRAINT unique_stock_sucursal UNIQUE (id_sucursal);
ALTER TABLE public.stock_sucursal ADD CONSTRAINT unique_stock_sucursal UNIQUE (id_sucursal);
ALTER TABLE public.stock_sucursal ADD CONSTRAINT unique_stock_sucursal UNIQUE (id_producto);
ALTER TABLE public.sucursales ADD CONSTRAINT fk_sucursales_restaurante FOREIGN KEY (id_restaurante) REFERENCES public.restaurantes(id_restaurante);
ALTER TABLE public.sucursales ADD CONSTRAINT sucursales_pkey PRIMARY KEY (id_sucursal);
ALTER TABLE public.sucursales ADD CONSTRAINT unique_sucursal_restaurante UNIQUE (nombre);
ALTER TABLE public.sucursales ADD CONSTRAINT unique_sucursal_restaurante UNIQUE (id_restaurante);
ALTER TABLE public.sucursales ADD CONSTRAINT unique_sucursal_restaurante UNIQUE (nombre);
ALTER TABLE public.sucursales ADD CONSTRAINT unique_sucursal_restaurante UNIQUE (id_restaurante);
ALTER TABLE public.suscripciones ADD CONSTRAINT fk_suscripcion_plan FOREIGN KEY (id_plan) REFERENCES public.planes(id_plan);
ALTER TABLE public.suscripciones ADD CONSTRAINT fk_suscripcion_restaurante FOREIGN KEY (id_restaurante) REFERENCES public.restaurantes(id_restaurante);
ALTER TABLE public.suscripciones ADD CONSTRAINT suscripciones_pkey PRIMARY KEY (id_suscripcion);
ALTER TABLE public.system_tasks ADD CONSTRAINT system_tasks_pkey PRIMARY KEY (id);
ALTER TABLE public.system_tasks ADD CONSTRAINT system_tasks_task_name_key UNIQUE (task_name);
ALTER TABLE public.testimonios_web ADD CONSTRAINT testimonios_web_pkey PRIMARY KEY (id);
ALTER TABLE public.transferencias_almacen ADD CONSTRAINT transferencias_almacen_pkey PRIMARY KEY (id_transferencia);
ALTER TABLE public.user_sessions ADD CONSTRAINT user_sessions_pkey PRIMARY KEY (id);
ALTER TABLE public.user_sessions ADD CONSTRAINT user_sessions_session_id_key UNIQUE (session_id);
ALTER TABLE public.uso_recursos ADD CONSTRAINT fk_uso_plan FOREIGN KEY (id_plan) REFERENCES public.planes(id_plan);
ALTER TABLE public.uso_recursos ADD CONSTRAINT fk_uso_restaurante FOREIGN KEY (id_restaurante) REFERENCES public.restaurantes(id_restaurante);
ALTER TABLE public.uso_recursos ADD CONSTRAINT uso_recursos_id_restaurante_mes_medicion_año_medicion_key UNIQUE (mes_medicion);
ALTER TABLE public.uso_recursos ADD CONSTRAINT uso_recursos_id_restaurante_mes_medicion_año_medicion_key UNIQUE (id_restaurante);
ALTER TABLE public.uso_recursos ADD CONSTRAINT uso_recursos_id_restaurante_mes_medicion_año_medicion_key UNIQUE (id_restaurante);
ALTER TABLE public.uso_recursos ADD CONSTRAINT uso_recursos_id_restaurante_mes_medicion_año_medicion_key UNIQUE (mes_medicion);
ALTER TABLE public.uso_recursos ADD CONSTRAINT uso_recursos_id_restaurante_mes_medicion_año_medicion_key UNIQUE (id_restaurante);
ALTER TABLE public.uso_recursos ADD CONSTRAINT uso_recursos_id_restaurante_mes_medicion_año_medicion_key UNIQUE (mes_medicion);
ALTER TABLE public.uso_recursos ADD CONSTRAINT uso_recursos_id_restaurante_mes_medicion_año_medicion_key UNIQUE (año_medicion);
ALTER TABLE public.uso_recursos ADD CONSTRAINT uso_recursos_id_restaurante_mes_medicion_año_medicion_key UNIQUE (año_medicion);
ALTER TABLE public.uso_recursos ADD CONSTRAINT uso_recursos_id_restaurante_mes_medicion_año_medicion_key UNIQUE (año_medicion);
ALTER TABLE public.uso_recursos ADD CONSTRAINT uso_recursos_pkey PRIMARY KEY (id_uso);
ALTER TABLE public.vendedores ADD CONSTRAINT fk_vendedores_restaurante FOREIGN KEY (id_restaurante) REFERENCES public.restaurantes(id_restaurante);
ALTER TABLE public.vendedores ADD CONSTRAINT unique_vendedor_restaurante UNIQUE (username);
ALTER TABLE public.vendedores ADD CONSTRAINT unique_vendedor_restaurante UNIQUE (id_restaurante);
ALTER TABLE public.vendedores ADD CONSTRAINT unique_vendedor_restaurante UNIQUE (id_restaurante);
ALTER TABLE public.vendedores ADD CONSTRAINT unique_vendedor_restaurante UNIQUE (username);
ALTER TABLE public.vendedores ADD CONSTRAINT vendedores_email_key UNIQUE (email);
ALTER TABLE public.vendedores ADD CONSTRAINT vendedores_id_sucursal_fkey FOREIGN KEY (id_sucursal) REFERENCES public.sucursales(id_sucursal);
ALTER TABLE public.vendedores ADD CONSTRAINT vendedores_pkey PRIMARY KEY (id_vendedor);
ALTER TABLE public.vendedores ADD CONSTRAINT vendedores_rol_admin_id_fkey FOREIGN KEY (rol_admin_id) REFERENCES public.roles_admin(id_rol);
ALTER TABLE public.vendedores ADD CONSTRAINT vendedores_username_key UNIQUE (username);
ALTER TABLE public.ventas ADD CONSTRAINT fk_ventas_mesa FOREIGN KEY (id_mesa) REFERENCES public.mesas(id_mesa);
ALTER TABLE public.ventas ADD CONSTRAINT fk_ventas_restaurante FOREIGN KEY (id_restaurante) REFERENCES public.restaurantes(id_restaurante);
ALTER TABLE public.ventas ADD CONSTRAINT ventas_id_pago_final_fkey FOREIGN KEY (id_pago_final) REFERENCES public.metodos_pago_backup(id_pago);
ALTER TABLE public.ventas ADD CONSTRAINT ventas_id_pago_fkey FOREIGN KEY (id_pago) REFERENCES public.metodos_pago_backup(id_pago);
ALTER TABLE public.ventas ADD CONSTRAINT ventas_id_sucursal_fkey FOREIGN KEY (id_sucursal) REFERENCES public.sucursales(id_sucursal);
ALTER TABLE public.ventas ADD CONSTRAINT ventas_id_vendedor_fkey FOREIGN KEY (id_vendedor) REFERENCES public.vendedores(id_vendedor);
ALTER TABLE public.ventas ADD CONSTRAINT ventas_pkey PRIMARY KEY (id_venta);

-- ÍNDICES
-- Índice: admin_users_pkey
CREATE UNIQUE INDEX admin_users_pkey ON public.admin_users USING btree (id);

-- Índice: admin_users_username_key
CREATE UNIQUE INDEX admin_users_username_key ON public.admin_users USING btree (username);

-- Índice: alertas_inventario_pkey
CREATE UNIQUE INDEX alertas_inventario_pkey ON public.alertas_inventario USING btree (id_alerta);

-- Índice: idx_alertas_inventario_restaurante
CREATE INDEX idx_alertas_inventario_restaurante ON public.alertas_inventario USING btree (id_restaurante);

-- Índice: idx_alertas_producto
CREATE INDEX idx_alertas_producto ON public.alertas_inventario USING btree (id_producto);

-- Índice: idx_alertas_restaurante
CREATE INDEX idx_alertas_restaurante ON public.alertas_inventario USING btree (id_restaurante);

-- Índice: idx_alertas_resuelta
CREATE INDEX idx_alertas_resuelta ON public.alertas_inventario USING btree (resuelta);

-- Índice: idx_alertas_urgencia
CREATE INDEX idx_alertas_urgencia ON public.alertas_inventario USING btree (nivel_urgencia);

-- Índice: alertas_limites_pkey
CREATE UNIQUE INDEX alertas_limites_pkey ON public.alertas_limites USING btree (id_alerta);

-- Índice: idx_alertas_estado
CREATE INDEX idx_alertas_estado ON public.alertas_limites USING btree (estado);

-- Índice: idx_alertas_fecha
CREATE INDEX idx_alertas_fecha ON public.alertas_limites USING btree (fecha_alerta);

-- Índice: archivos_egresos_pkey
CREATE UNIQUE INDEX archivos_egresos_pkey ON public.archivos_egresos USING btree (id_archivo);

-- Índice: arqueos_caja_pkey
CREATE UNIQUE INDEX arqueos_caja_pkey ON public.arqueos_caja USING btree (id_arqueo);

-- Índice: idx_arqueo_rest_suc_estado
CREATE INDEX idx_arqueo_rest_suc_estado ON public.arqueos_caja USING btree (id_restaurante, id_sucursal, estado);

-- Índice: auditoria_admin_pkey
CREATE UNIQUE INDEX auditoria_admin_pkey ON public.auditoria_admin USING btree (id_auditoria);

-- Índice: auditoria_planes_pkey
CREATE UNIQUE INDEX auditoria_planes_pkey ON public.auditoria_planes USING btree (id_auditoria);

-- Índice: idx_auditoria_fecha
CREATE INDEX idx_auditoria_fecha ON public.auditoria_planes USING btree (fecha_cambio);

-- Índice: idx_auditoria_restaurante
CREATE INDEX idx_auditoria_restaurante ON public.auditoria_planes USING btree (id_restaurante);

-- Índice: auditoria_pos_pkey
CREATE UNIQUE INDEX auditoria_pos_pkey ON public.auditoria_pos USING btree (id_auditoria);

-- Índice: idx_auditoria_pos_accion
CREATE INDEX idx_auditoria_pos_accion ON public.auditoria_pos USING btree (accion);

-- Índice: idx_auditoria_pos_restaurante_fecha
CREATE INDEX idx_auditoria_pos_restaurante_fecha ON public.auditoria_pos USING btree (id_restaurante, fecha_accion DESC);

-- Índice: idx_auditoria_pos_tabla_registro
CREATE INDEX idx_auditoria_pos_tabla_registro ON public.auditoria_pos USING btree (tabla_afectada, id_registro);

-- Índice: idx_auditoria_pos_vendedor_fecha
CREATE INDEX idx_auditoria_pos_vendedor_fecha ON public.auditoria_pos USING btree (id_vendedor, fecha_accion DESC);

-- Índice: casos_exito_pkey
CREATE UNIQUE INDEX casos_exito_pkey ON public.casos_exito USING btree (id);

-- Índice: idx_casos_exito_activo
CREATE INDEX idx_casos_exito_activo ON public.casos_exito USING btree (activo);

-- Índice: idx_casos_exito_destacado
CREATE INDEX idx_casos_exito_destacado ON public.casos_exito USING btree (destacado);

-- Índice: categorias_nombre_key
CREATE UNIQUE INDEX categorias_nombre_key ON public.categorias USING btree (nombre);

-- Índice: categorias_pkey
CREATE UNIQUE INDEX categorias_pkey ON public.categorias USING btree (id_categoria);

-- Índice: idx_categorias_restaurante
CREATE INDEX idx_categorias_restaurante ON public.categorias USING btree (id_restaurante);

-- Índice: unique_categoria_restaurante
CREATE UNIQUE INDEX unique_categoria_restaurante ON public.categorias USING btree (id_restaurante, nombre);

-- Índice: categorias_almacen_nombre_key
CREATE UNIQUE INDEX categorias_almacen_nombre_key ON public.categorias_almacen USING btree (nombre);

-- Índice: categorias_almacen_pkey
CREATE UNIQUE INDEX categorias_almacen_pkey ON public.categorias_almacen USING btree (id_categoria_almacen);

-- Índice: categorias_egresos_pkey
CREATE UNIQUE INDEX categorias_egresos_pkey ON public.categorias_egresos USING btree (id_categoria_egreso);

-- Índice: uk_categorias_egresos_nombre_restaurante
CREATE UNIQUE INDEX uk_categorias_egresos_nombre_restaurante ON public.categorias_egresos USING btree (nombre, id_restaurante);

-- Índice: clientes_pkey
CREATE UNIQUE INDEX clientes_pkey ON public.clientes USING btree (id_cliente);

-- Índice: configuracion_web_clave_key
CREATE UNIQUE INDEX configuracion_web_clave_key ON public.configuracion_web USING btree (clave);

-- Índice: configuracion_web_pkey
CREATE UNIQUE INDEX configuracion_web_pkey ON public.configuracion_web USING btree (id);

-- Índice: configuraciones_restaurante_id_restaurante_clave_config_key
CREATE UNIQUE INDEX configuraciones_restaurante_id_restaurante_clave_config_key ON public.configuraciones_restaurante USING btree (id_restaurante, clave_config);

-- Índice: configuraciones_restaurante_pkey
CREATE UNIQUE INDEX configuraciones_restaurante_pkey ON public.configuraciones_restaurante USING btree (id_config);

-- Índice: configuraciones_sistema_pkey
CREATE UNIQUE INDEX configuraciones_sistema_pkey ON public.configuraciones_sistema USING btree (clave_config);

-- Índice: contadores_uso_id_restaurante_recurso_fecha_medicion_key
CREATE UNIQUE INDEX contadores_uso_id_restaurante_recurso_fecha_medicion_key ON public.contadores_uso USING btree (id_restaurante, recurso, fecha_medicion);

-- Índice: contadores_uso_pkey
CREATE UNIQUE INDEX contadores_uso_pkey ON public.contadores_uso USING btree (id_contador);

-- Índice: contenido_web_pkey
CREATE UNIQUE INDEX contenido_web_pkey ON public.contenido_web USING btree (id);

-- Índice: contenido_web_slug_key
CREATE UNIQUE INDEX contenido_web_slug_key ON public.contenido_web USING btree (slug);

-- Índice: idx_contenido_web_estado
CREATE INDEX idx_contenido_web_estado ON public.contenido_web USING btree (estado);

-- Índice: idx_contenido_web_fecha_publicacion
CREATE INDEX idx_contenido_web_fecha_publicacion ON public.contenido_web USING btree (fecha_publicacion);

-- Índice: idx_contenido_web_slug
CREATE INDEX idx_contenido_web_slug ON public.contenido_web USING btree (slug);

-- Índice: conversion_events_pkey
CREATE UNIQUE INDEX conversion_events_pkey ON public.conversion_events USING btree (id);

-- Índice: idx_conversion_events_session
CREATE INDEX idx_conversion_events_session ON public.conversion_events USING btree (session_id);

-- Índice: idx_conversion_events_timestamp
CREATE INDEX idx_conversion_events_timestamp ON public.conversion_events USING btree ("timestamp");

-- Índice: idx_conversion_events_type
CREATE INDEX idx_conversion_events_type ON public.conversion_events USING btree (event_type);

-- Índice: demos_reuniones_pkey
CREATE UNIQUE INDEX demos_reuniones_pkey ON public.demos_reuniones USING btree (id);

-- Índice: idx_demos_reuniones_estado
CREATE INDEX idx_demos_reuniones_estado ON public.demos_reuniones USING btree (estado);

-- Índice: idx_demos_reuniones_fecha
CREATE INDEX idx_demos_reuniones_fecha ON public.demos_reuniones USING btree (fecha_programada);

-- Índice: detalle_ventas_pkey
CREATE UNIQUE INDEX detalle_ventas_pkey ON public.detalle_ventas USING btree (id_detalle);

-- Índice: idx_detalle_ventas_id_venta
CREATE INDEX idx_detalle_ventas_id_venta ON public.detalle_ventas USING btree (id_venta);

-- Índice: idx_detalle_ventas_venta_producto
CREATE INDEX idx_detalle_ventas_venta_producto ON public.detalle_ventas USING btree (id_venta, id_producto);

-- Índice: detalle_ventas_modificadores_pkey
CREATE UNIQUE INDEX detalle_ventas_modificadores_pkey ON public.detalle_ventas_modificadores USING btree (id_detalle_venta, id_modificador);

-- Índice: idx_detalle_ventas_modificadores_detalle
CREATE INDEX idx_detalle_ventas_modificadores_detalle ON public.detalle_ventas_modificadores USING btree (id_detalle_venta);

-- Índice: idx_detalle_ventas_modificadores_modificador
CREATE INDEX idx_detalle_ventas_modificadores_modificador ON public.detalle_ventas_modificadores USING btree (id_modificador);

-- Índice: dim_tiempo_fecha_key
CREATE UNIQUE INDEX dim_tiempo_fecha_key ON public.dim_tiempo USING btree (fecha);

-- Índice: dim_tiempo_pkey
CREATE UNIQUE INDEX dim_tiempo_pkey ON public.dim_tiempo USING btree (id_tiempo);

-- Índice: idx_dim_tiempo_fecha
CREATE INDEX idx_dim_tiempo_fecha ON public.dim_tiempo USING btree (fecha);

-- Índice: egresos_pkey
CREATE UNIQUE INDEX egresos_pkey ON public.egresos USING btree (id_egreso);

-- Índice: idx_egresos_categoria_fecha
CREATE INDEX idx_egresos_categoria_fecha ON public.egresos USING btree (id_categoria_egreso, fecha_egreso);

-- Índice: idx_egresos_estado_restaurante
CREATE INDEX idx_egresos_estado_restaurante ON public.egresos USING btree (estado, id_restaurante);

-- Índice: idx_egresos_fecha_restaurante
CREATE INDEX idx_egresos_fecha_restaurante ON public.egresos USING btree (fecha_egreso, id_restaurante);

-- Índice: idx_egresos_proveedor
CREATE INDEX idx_egresos_proveedor ON public.egresos USING btree (proveedor_nombre);

-- Índice: idx_egresos_sucursal_fecha
CREATE INDEX idx_egresos_sucursal_fecha ON public.egresos USING btree (id_sucursal, fecha_egreso);

-- Índice: facturas_numero_key
CREATE UNIQUE INDEX facturas_numero_key ON public.facturas USING btree (numero);

-- Índice: facturas_pkey
CREATE UNIQUE INDEX facturas_pkey ON public.facturas USING btree (id_factura);

-- Índice: flujo_aprobaciones_egresos_pkey
CREATE UNIQUE INDEX flujo_aprobaciones_egresos_pkey ON public.flujo_aprobaciones_egresos USING btree (id_flujo);

-- Índice: idx_flujo_egreso_fecha
CREATE INDEX idx_flujo_egreso_fecha ON public.flujo_aprobaciones_egresos USING btree (id_egreso, fecha_accion);

-- Índice: grupos_mesas_pkey
CREATE UNIQUE INDEX grupos_mesas_pkey ON public.grupos_mesas USING btree (id_grupo_mesa);

-- Índice: idx_grupos_mesas_estado
CREATE INDEX idx_grupos_mesas_estado ON public.grupos_mesas USING btree (estado);

-- Índice: idx_grupos_mesas_mesero
CREATE INDEX idx_grupos_mesas_mesero ON public.grupos_mesas USING btree (id_mesero);

-- Índice: idx_grupos_mesas_restaurante
CREATE INDEX idx_grupos_mesas_restaurante ON public.grupos_mesas USING btree (id_restaurante);

-- Índice: idx_grupos_mesas_restaurante_sucursal
CREATE INDEX idx_grupos_mesas_restaurante_sucursal ON public.grupos_mesas USING btree (id_restaurante, id_sucursal);

-- Índice: idx_grupos_mesas_sucursal
CREATE INDEX idx_grupos_mesas_sucursal ON public.grupos_mesas USING btree (id_sucursal);

-- Índice: historial_pagos_diferidos_pkey
CREATE UNIQUE INDEX historial_pagos_diferidos_pkey ON public.historial_pagos_diferidos USING btree (id_historial);

-- Índice: idx_historial_pagos_diferidos_pago
CREATE INDEX idx_historial_pagos_diferidos_pago ON public.historial_pagos_diferidos USING btree (id_pago_diferido);

-- Índice: idx_historial_pagos_diferidos_venta
CREATE INDEX idx_historial_pagos_diferidos_venta ON public.historial_pagos_diferidos USING btree (id_venta);

-- Índice: integrity_logs_pkey
CREATE UNIQUE INDEX integrity_logs_pkey ON public.integrity_logs USING btree (id);

-- Índice: idx_inventario_lotes_activo
CREATE INDEX idx_inventario_lotes_activo ON public.inventario_lotes USING btree (activo);

-- Índice: idx_inventario_lotes_caducidad
CREATE INDEX idx_inventario_lotes_caducidad ON public.inventario_lotes USING btree (fecha_caducidad);

-- Índice: idx_inventario_lotes_cantidad
CREATE INDEX idx_inventario_lotes_cantidad ON public.inventario_lotes USING btree (cantidad_actual);

-- Índice: idx_inventario_lotes_categoria
CREATE INDEX idx_inventario_lotes_categoria ON public.inventario_lotes USING btree (id_categoria_almacen);

-- Índice: idx_inventario_lotes_fecha_caducidad
CREATE INDEX idx_inventario_lotes_fecha_caducidad ON public.inventario_lotes USING btree (fecha_caducidad);

-- Índice: idx_inventario_lotes_producto
CREATE INDEX idx_inventario_lotes_producto ON public.inventario_lotes USING btree (id_producto);

-- Índice: idx_inventario_lotes_proveedor
CREATE INDEX idx_inventario_lotes_proveedor ON public.inventario_lotes USING btree (proveedor);

-- Índice: idx_inventario_lotes_restaurante
CREATE INDEX idx_inventario_lotes_restaurante ON public.inventario_lotes USING btree (id_restaurante);

-- Índice: inventario_lotes_pkey
CREATE UNIQUE INDEX inventario_lotes_pkey ON public.inventario_lotes USING btree (id_lote);

-- Índice: idx_leads_prospectos_email
CREATE INDEX idx_leads_prospectos_email ON public.leads_prospectos USING btree (email);

-- Índice: idx_leads_prospectos_estado
CREATE INDEX idx_leads_prospectos_estado ON public.leads_prospectos USING btree (estado);

-- Índice: idx_leads_prospectos_fecha_contacto
CREATE INDEX idx_leads_prospectos_fecha_contacto ON public.leads_prospectos USING btree (fecha_contacto);

-- Índice: leads_prospectos_pkey
CREATE UNIQUE INDEX leads_prospectos_pkey ON public.leads_prospectos USING btree (id);

-- Índice: idx_mesas_grupo_mesa
CREATE INDEX idx_mesas_grupo_mesa ON public.mesas USING btree (id_grupo_mesa);

-- Índice: idx_mesas_numero_restaurante
CREATE INDEX idx_mesas_numero_restaurante ON public.mesas USING btree (numero, id_restaurante);

-- Índice: idx_mesas_restaurante
CREATE INDEX idx_mesas_restaurante ON public.mesas USING btree (id_restaurante);

-- Índice: mesas_numero_sucursal_restaurante_unique
CREATE UNIQUE INDEX mesas_numero_sucursal_restaurante_unique ON public.mesas USING btree (numero, id_sucursal, id_restaurante);

-- Índice: mesas_pkey
CREATE UNIQUE INDEX mesas_pkey ON public.mesas USING btree (id_mesa);

-- Índice: idx_mesas_en_grupo_grupo
CREATE INDEX idx_mesas_en_grupo_grupo ON public.mesas_en_grupo USING btree (id_grupo_mesa);

-- Índice: idx_mesas_en_grupo_mesa
CREATE INDEX idx_mesas_en_grupo_mesa ON public.mesas_en_grupo USING btree (id_mesa);

-- Índice: mesas_en_grupo_pkey
CREATE UNIQUE INDEX mesas_en_grupo_pkey ON public.mesas_en_grupo USING btree (id_mesa_en_grupo);

-- Índice: uq_mesa_en_grupo
CREATE UNIQUE INDEX uq_mesa_en_grupo ON public.mesas_en_grupo USING btree (id_mesa);

-- Índice: metodos_pago_descripcion_unique
CREATE UNIQUE INDEX metodos_pago_descripcion_unique ON public.metodos_pago USING btree (descripcion);

-- Índice: metodos_pago_pkey1
CREATE UNIQUE INDEX metodos_pago_pkey1 ON public.metodos_pago USING btree (id_pago);

-- Índice: metodos_pago_pkey
CREATE UNIQUE INDEX metodos_pago_pkey ON public.metodos_pago_backup USING btree (id_pago);

-- Índice: unique_metodo_pago_restaurante
CREATE UNIQUE INDEX unique_metodo_pago_restaurante ON public.metodos_pago_backup USING btree (id_restaurante, descripcion);

-- Índice: metricas_web_pkey
CREATE UNIQUE INDEX metricas_web_pkey ON public.metricas_web USING btree (id);

-- Índice: migrations_migration_name_key
CREATE UNIQUE INDEX migrations_migration_name_key ON public.migrations USING btree (migration_name);

-- Índice: migrations_pkey
CREATE UNIQUE INDEX migrations_pkey ON public.migrations USING btree (id);

-- Índice: idx_movimientos_fecha
CREATE INDEX idx_movimientos_fecha ON public.movimientos_inventario USING btree (fecha_movimiento);

-- Índice: idx_movimientos_inventario_restaurante
CREATE INDEX idx_movimientos_inventario_restaurante ON public.movimientos_inventario USING btree (id_restaurante);

-- Índice: idx_movimientos_producto
CREATE INDEX idx_movimientos_producto ON public.movimientos_inventario USING btree (id_producto);

-- Índice: idx_movimientos_restaurante
CREATE INDEX idx_movimientos_restaurante ON public.movimientos_inventario USING btree (id_restaurante);

-- Índice: idx_movimientos_tipo
CREATE INDEX idx_movimientos_tipo ON public.movimientos_inventario USING btree (tipo_movimiento);

-- Índice: movimientos_inventario_pkey
CREATE UNIQUE INDEX movimientos_inventario_pkey ON public.movimientos_inventario USING btree (id_movimiento);

-- Índice: idx_newsletter_email
CREATE INDEX idx_newsletter_email ON public.newsletter_suscriptores USING btree (email);

-- Índice: idx_newsletter_estado
CREATE INDEX idx_newsletter_estado ON public.newsletter_suscriptores USING btree (estado);

-- Índice: newsletter_suscriptores_email_key
CREATE UNIQUE INDEX newsletter_suscriptores_email_key ON public.newsletter_suscriptores USING btree (email);

-- Índice: newsletter_suscriptores_pkey
CREATE UNIQUE INDEX newsletter_suscriptores_pkey ON public.newsletter_suscriptores USING btree (id);

-- Índice: idx_pagos_diferidos_estado
CREATE INDEX idx_pagos_diferidos_estado ON public.pagos_diferidos USING btree (estado);

-- Índice: idx_pagos_diferidos_fecha_creacion
CREATE INDEX idx_pagos_diferidos_fecha_creacion ON public.pagos_diferidos USING btree (fecha_creacion);

-- Índice: idx_pagos_diferidos_mesa
CREATE INDEX idx_pagos_diferidos_mesa ON public.pagos_diferidos USING btree (id_mesa);

-- Índice: idx_pagos_diferidos_restaurante
CREATE INDEX idx_pagos_diferidos_restaurante ON public.pagos_diferidos USING btree (id_restaurante);

-- Índice: idx_pagos_diferidos_venta
CREATE INDEX idx_pagos_diferidos_venta ON public.pagos_diferidos USING btree (id_venta);

-- Índice: pagos_diferidos_pkey
CREATE UNIQUE INDEX pagos_diferidos_pkey ON public.pagos_diferidos USING btree (id_pago_diferido);

-- Índice: pagos_restaurantes_pkey
CREATE UNIQUE INDEX pagos_restaurantes_pkey ON public.pagos_restaurantes USING btree (id);

-- Índice: idx_planes_activo
CREATE INDEX idx_planes_activo ON public.planes USING btree (activo);

-- Índice: idx_planes_orden
CREATE INDEX idx_planes_orden ON public.planes USING btree (orden_display);

-- Índice: planes_nombre_key
CREATE UNIQUE INDEX planes_nombre_key ON public.planes USING btree (nombre);

-- Índice: planes_pkey
CREATE UNIQUE INDEX planes_pkey ON public.planes USING btree (id_plan);

-- Índice: planes_pos_pkey
CREATE UNIQUE INDEX planes_pos_pkey ON public.planes_pos USING btree (id);

-- Índice: prefacturas_pkey
CREATE UNIQUE INDEX prefacturas_pkey ON public.prefacturas USING btree (id_prefactura);

-- Índice: idx_presupuestos_categoria_periodo
CREATE INDEX idx_presupuestos_categoria_periodo ON public.presupuestos_egresos USING btree (id_categoria_egreso, anio, mes);

-- Índice: presupuestos_egresos_pkey
CREATE UNIQUE INDEX presupuestos_egresos_pkey ON public.presupuestos_egresos USING btree (id_presupuesto);

-- Índice: uk_presupuestos_categoria_periodo
CREATE UNIQUE INDEX uk_presupuestos_categoria_periodo ON public.presupuestos_egresos USING btree (id_categoria_egreso, anio, mes, id_restaurante);

-- Índice: idx_productos_categoria
CREATE INDEX idx_productos_categoria ON public.productos USING btree (id_categoria);

-- Índice: idx_productos_restaurante
CREATE INDEX idx_productos_restaurante ON public.productos USING btree (id_restaurante);

-- Índice: idx_productos_restaurante_nombre
CREATE INDEX idx_productos_restaurante_nombre ON public.productos USING btree (id_restaurante, nombre);

-- Índice: productos_pkey
CREATE UNIQUE INDEX productos_pkey ON public.productos USING btree (id_producto);

-- Índice: unique_producto_restaurante
CREATE UNIQUE INDEX unique_producto_restaurante ON public.productos USING btree (id_restaurante, nombre);

-- Índice: idx_productos_modificadores_activo
CREATE INDEX idx_productos_modificadores_activo ON public.productos_modificadores USING btree (activo);

-- Índice: idx_productos_modificadores_producto
CREATE INDEX idx_productos_modificadores_producto ON public.productos_modificadores USING btree (id_producto);

-- Índice: productos_modificadores_pkey
CREATE UNIQUE INDEX productos_modificadores_pkey ON public.productos_modificadores USING btree (id_modificador);

-- Índice: idx_promociones_activas
CREATE INDEX idx_promociones_activas ON public.promociones USING btree (fecha_inicio, fecha_fin) WHERE (activa = true);

-- Índice: idx_promociones_fechas
CREATE INDEX idx_promociones_fechas ON public.promociones USING btree (fecha_inicio, fecha_fin);

-- Índice: idx_promociones_producto
CREATE INDEX idx_promociones_producto ON public.promociones USING btree (id_producto);

-- Índice: idx_promociones_restaurante
CREATE INDEX idx_promociones_restaurante ON public.promociones USING btree (id_restaurante);

-- Índice: promociones_pkey
CREATE UNIQUE INDEX promociones_pkey ON public.promociones USING btree (id_promocion);

-- Índice: idx_ps_promocion
CREATE INDEX idx_ps_promocion ON public.promociones_sucursales USING btree (id_promocion);

-- Índice: idx_ps_sucursal
CREATE INDEX idx_ps_sucursal ON public.promociones_sucursales USING btree (id_sucursal);

-- Índice: promociones_sucursales_pkey
CREATE UNIQUE INDEX promociones_sucursales_pkey ON public.promociones_sucursales USING btree (id_relacion);

-- Índice: unique_promocion_sucursal
CREATE UNIQUE INDEX unique_promocion_sucursal ON public.promociones_sucursales USING btree (id_promocion, id_sucursal);

-- Índice: idx_reservas_cliente
CREATE INDEX idx_reservas_cliente ON public.reservas USING btree (id_cliente);

-- Índice: idx_reservas_estado
CREATE INDEX idx_reservas_estado ON public.reservas USING btree (estado);

-- Índice: idx_reservas_fecha_fin
CREATE INDEX idx_reservas_fecha_fin ON public.reservas USING btree (fecha_hora_fin);

-- Índice: idx_reservas_fecha_mesa
CREATE INDEX idx_reservas_fecha_mesa ON public.reservas USING btree (fecha_hora_inicio, id_mesa);

-- Índice: idx_reservas_mesa
CREATE INDEX idx_reservas_mesa ON public.reservas USING btree (id_mesa);

-- Índice: idx_reservas_restaurante_fecha
CREATE INDEX idx_reservas_restaurante_fecha ON public.reservas USING btree (id_restaurante, fecha_hora_inicio);

-- Índice: idx_reservas_restaurante_sucursal
CREATE INDEX idx_reservas_restaurante_sucursal ON public.reservas USING btree (id_restaurante, id_sucursal);

-- Índice: reservas_pkey
CREATE UNIQUE INDEX reservas_pkey ON public.reservas USING btree (id_reserva);

-- Índice: restaurantes_nombre_key
CREATE UNIQUE INDEX restaurantes_nombre_key ON public.restaurantes USING btree (nombre);

-- Índice: restaurantes_pkey
CREATE UNIQUE INDEX restaurantes_pkey ON public.restaurantes USING btree (id_restaurante);

-- Índice: roles_admin_nombre_key
CREATE UNIQUE INDEX roles_admin_nombre_key ON public.roles_admin USING btree (nombre);

-- Índice: roles_admin_pkey
CREATE UNIQUE INDEX roles_admin_pkey ON public.roles_admin USING btree (id_rol);

-- Índice: idx_servicios_restaurante_estado
CREATE INDEX idx_servicios_restaurante_estado ON public.servicios_restaurante USING btree (estado_suscripcion);

-- Índice: idx_servicios_restaurante_id_restaurante
CREATE INDEX idx_servicios_restaurante_id_restaurante ON public.servicios_restaurante USING btree (id_restaurante);

-- Índice: idx_servicios_restaurante_rest
CREATE INDEX idx_servicios_restaurante_rest ON public.servicios_restaurante USING btree (id_restaurante);

-- Índice: servicios_restaurante_pkey
CREATE UNIQUE INDEX servicios_restaurante_pkey ON public.servicios_restaurante USING btree (id);

-- Índice: idx_solicitudes_demo_email
CREATE INDEX idx_solicitudes_demo_email ON public.solicitudes_demo USING btree (email);

-- Índice: idx_solicitudes_demo_estado
CREATE INDEX idx_solicitudes_demo_estado ON public.solicitudes_demo USING btree (estado);

-- Índice: idx_solicitudes_demo_fecha
CREATE INDEX idx_solicitudes_demo_fecha ON public.solicitudes_demo USING btree (fecha_solicitud);

-- Índice: solicitudes_demo_pkey
CREATE UNIQUE INDEX solicitudes_demo_pkey ON public.solicitudes_demo USING btree (id_solicitud);

-- Índice: idx_soporte_tickets_restaurante_fecha
CREATE INDEX idx_soporte_tickets_restaurante_fecha ON public.soporte_tickets USING btree (id_restaurante, fecha_creacion);

-- Índice: idx_soporte_tickets_vendedor_fecha
CREATE INDEX idx_soporte_tickets_vendedor_fecha ON public.soporte_tickets USING btree (id_vendedor, fecha_creacion);

-- Índice: soporte_tickets_pkey
CREATE UNIQUE INDEX soporte_tickets_pkey ON public.soporte_tickets USING btree (id_ticket);

-- Índice: idx_stock_sucursal_activo
CREATE INDEX idx_stock_sucursal_activo ON public.stock_sucursal USING btree (activo);

-- Índice: idx_stock_sucursal_composite
CREATE INDEX idx_stock_sucursal_composite ON public.stock_sucursal USING btree (id_sucursal, id_producto, activo);

-- Índice: idx_stock_sucursal_producto
CREATE INDEX idx_stock_sucursal_producto ON public.stock_sucursal USING btree (id_producto);

-- Índice: idx_stock_sucursal_sucursal
CREATE INDEX idx_stock_sucursal_sucursal ON public.stock_sucursal USING btree (id_sucursal);

-- Índice: stock_sucursal_pkey
CREATE UNIQUE INDEX stock_sucursal_pkey ON public.stock_sucursal USING btree (id_stock_sucursal);

-- Índice: unique_stock_sucursal
CREATE UNIQUE INDEX unique_stock_sucursal ON public.stock_sucursal USING btree (id_producto, id_sucursal);

-- Índice: idx_sucursales_restaurante
CREATE INDEX idx_sucursales_restaurante ON public.sucursales USING btree (id_restaurante);

-- Índice: sucursales_pkey
CREATE UNIQUE INDEX sucursales_pkey ON public.sucursales USING btree (id_sucursal);

-- Índice: unique_sucursal_restaurante
CREATE UNIQUE INDEX unique_sucursal_restaurante ON public.sucursales USING btree (id_restaurante, nombre);

-- Índice: idx_suscripciones_estado
CREATE INDEX idx_suscripciones_estado ON public.suscripciones USING btree (estado);

-- Índice: idx_suscripciones_fecha_fin
CREATE INDEX idx_suscripciones_fecha_fin ON public.suscripciones USING btree (fecha_fin);

-- Índice: idx_suscripciones_plan
CREATE INDEX idx_suscripciones_plan ON public.suscripciones USING btree (id_plan);

-- Índice: idx_suscripciones_restaurante
CREATE INDEX idx_suscripciones_restaurante ON public.suscripciones USING btree (id_restaurante);

-- Índice: suscripciones_pkey
CREATE UNIQUE INDEX suscripciones_pkey ON public.suscripciones USING btree (id_suscripcion);

-- Índice: system_tasks_pkey
CREATE UNIQUE INDEX system_tasks_pkey ON public.system_tasks USING btree (id);

-- Índice: system_tasks_task_name_key
CREATE UNIQUE INDEX system_tasks_task_name_key ON public.system_tasks USING btree (task_name);

-- Índice: idx_testimonios_web_activo
CREATE INDEX idx_testimonios_web_activo ON public.testimonios_web USING btree (activo);

-- Índice: idx_testimonios_web_destacado
CREATE INDEX idx_testimonios_web_destacado ON public.testimonios_web USING btree (destacado);

-- Índice: testimonios_web_pkey
CREATE UNIQUE INDEX testimonios_web_pkey ON public.testimonios_web USING btree (id);

-- Índice: transferencias_almacen_pkey
CREATE UNIQUE INDEX transferencias_almacen_pkey ON public.transferencias_almacen USING btree (id_transferencia);

-- Índice: idx_user_sessions_converted
CREATE INDEX idx_user_sessions_converted ON public.user_sessions USING btree (is_converted);

-- Índice: idx_user_sessions_first_visit
CREATE INDEX idx_user_sessions_first_visit ON public.user_sessions USING btree (first_visit);

-- Índice: idx_user_sessions_session
CREATE INDEX idx_user_sessions_session ON public.user_sessions USING btree (session_id);

-- Índice: user_sessions_pkey
CREATE UNIQUE INDEX user_sessions_pkey ON public.user_sessions USING btree (id);

-- Índice: user_sessions_session_id_key
CREATE UNIQUE INDEX user_sessions_session_id_key ON public.user_sessions USING btree (session_id);

-- Índice: idx_uso_recursos_periodo
CREATE INDEX idx_uso_recursos_periodo ON public.uso_recursos USING btree ("año_medicion", mes_medicion);

-- Índice: idx_uso_recursos_restaurante
CREATE INDEX idx_uso_recursos_restaurante ON public.uso_recursos USING btree (id_restaurante);

-- Índice: uso_recursos_id_restaurante_mes_medicion_año_medicion_key
CREATE UNIQUE INDEX "uso_recursos_id_restaurante_mes_medicion_año_medicion_key" ON public.uso_recursos USING btree (id_restaurante, mes_medicion, "año_medicion");

-- Índice: uso_recursos_pkey
CREATE UNIQUE INDEX uso_recursos_pkey ON public.uso_recursos USING btree (id_uso);

-- Índice: idx_vendedores_restaurante
CREATE INDEX idx_vendedores_restaurante ON public.vendedores USING btree (id_restaurante);

-- Índice: unique_vendedor_restaurante
CREATE UNIQUE INDEX unique_vendedor_restaurante ON public.vendedores USING btree (id_restaurante, username);

-- Índice: vendedores_email_key
CREATE UNIQUE INDEX vendedores_email_key ON public.vendedores USING btree (email);

-- Índice: vendedores_pkey
CREATE UNIQUE INDEX vendedores_pkey ON public.vendedores USING btree (id_vendedor);

-- Índice: vendedores_username_key
CREATE UNIQUE INDEX vendedores_username_key ON public.vendedores USING btree (username);

-- Índice: idx_ventas_estado_pago
CREATE INDEX idx_ventas_estado_pago ON public.ventas USING btree (estado_pago);

-- Índice: idx_ventas_fecha
CREATE INDEX idx_ventas_fecha ON public.ventas USING btree (fecha);

-- Índice: idx_ventas_fecha_id
CREATE INDEX idx_ventas_fecha_id ON public.ventas USING btree (fecha DESC, id_venta DESC);

-- Índice: idx_ventas_fecha_pago_final
CREATE INDEX idx_ventas_fecha_pago_final ON public.ventas USING btree (fecha_pago_final);

-- Índice: idx_ventas_mesa_sucursal_restaurante
CREATE INDEX idx_ventas_mesa_sucursal_restaurante ON public.ventas USING btree (id_mesa, id_sucursal, id_restaurante);

-- Índice: idx_ventas_orden
CREATE INDEX idx_ventas_orden ON public.ventas USING btree (fecha DESC, id_venta DESC);

-- Índice: idx_ventas_restaurante
CREATE INDEX idx_ventas_restaurante ON public.ventas USING btree (id_restaurante);

-- Índice: idx_ventas_tipo_pago
CREATE INDEX idx_ventas_tipo_pago ON public.ventas USING btree (tipo_pago);

-- Índice: ventas_pkey
CREATE UNIQUE INDEX ventas_pkey ON public.ventas USING btree (id_venta);

-- FUNCIONES
-- Función: actualizar_presupuesto_gastado_egresos
CREATE OR REPLACE FUNCTION public.actualizar_presupuesto_gastado_egresos()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
      BEGIN
          -- Solo actualizar si el egreso está pagado o aprobado
          IF NEW.estado IN ('pagado', 'aprobado') THEN
              -- Actualizar el monto gastado en el presupuesto correspondiente
              UPDATE presupuestos_egresos 
              SET monto_gastado = (
                  SELECT COALESCE(SUM(monto), 0)
                  FROM egresos 
                  WHERE id_categoria_egreso = NEW.id_categoria_egreso
                    AND id_restaurante = NEW.id_restaurante
                    AND estado IN ('pagado', 'aprobado')
                    AND EXTRACT(YEAR FROM fecha_egreso) = presupuestos_egresos.anio
                    AND EXTRACT(MONTH FROM fecha_egreso) = presupuestos_egresos.mes
              )
              WHERE id_categoria_egreso = NEW.id_categoria_egreso
                AND id_restaurante = NEW.id_restaurante
                AND anio = EXTRACT(YEAR FROM NEW.fecha_egreso)
                AND mes = EXTRACT(MONTH FROM NEW.fecha_egreso);
          END IF;
          
          RETURN NEW;
      END;
      $function$
;

-- Función: actualizar_stock_producto
CREATE OR REPLACE FUNCTION public.actualizar_stock_producto()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
      DECLARE
        id_sucursal_lote INTEGER;
        id_restaurante_lote INTEGER;
      BEGIN
        -- Obtener información del lote
        IF TG_OP = 'DELETE' THEN
          id_sucursal_lote := OLD.id_sucursal;
          id_restaurante_lote := OLD.id_restaurante;
        ELSE
          id_sucursal_lote := NEW.id_sucursal;
          id_restaurante_lote := NEW.id_restaurante;
        END IF;
        
        -- Actualizar stock del producto en la sucursal específica
        IF id_sucursal_lote IS NOT NULL THEN
          UPDATE stock_sucursal 
          SET stock_actual = (
            SELECT COALESCE(SUM(cantidad_actual), 0)
            FROM inventario_lotes 
            WHERE id_producto = COALESCE(NEW.id_producto, OLD.id_producto) 
              AND id_sucursal = id_sucursal_lote 
              AND activo = true
          ),
          updated_at = NOW()
          WHERE id_producto = COALESCE(NEW.id_producto, OLD.id_producto)
            AND id_sucursal = id_sucursal_lote;
        END IF;
        
        -- También actualizar stock global del producto (para compatibilidad)
        UPDATE productos 
        SET stock_actual = (
          SELECT COALESCE(SUM(ss.stock_actual), 0)
          FROM stock_sucursal ss
          JOIN sucursales s ON ss.id_sucursal = s.id_sucursal
          WHERE ss.id_producto = COALESCE(NEW.id_producto, OLD.id_producto)
            AND s.id_restaurante = id_restaurante_lote
            AND ss.activo = true
        )
        WHERE id_producto = COALESCE(NEW.id_producto, OLD.id_producto);
        
        RETURN COALESCE(NEW, OLD);
      END;
      $function$
;

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

-- Función: actualizar_updated_at_egresos
CREATE OR REPLACE FUNCTION public.actualizar_updated_at_egresos()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
      BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
      END;
      $function$
;

-- Función: check_system_integrity
CREATE OR REPLACE FUNCTION public.check_system_integrity()
 RETURNS TABLE(check_name text, status text, message text, details_count integer)
 LANGUAGE plpgsql
AS $function$
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
$function$
;

-- Función: fn_promociones_set_created
CREATE OR REPLACE FUNCTION public.fn_promociones_set_created()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.creada_en := COALESCE(NEW.creada_en, CURRENT_TIMESTAMP);
  END IF;
  RETURN NEW;
END;
$function$
;

-- Función: generar_alertas_inventario
CREATE OR REPLACE FUNCTION public.generar_alertas_inventario()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
      DECLARE
        dias_restantes INTEGER;
        nivel_urgencia VARCHAR(20);
        mensaje TEXT;
        stock_sucursal_actual INTEGER;
      BEGIN
        -- Obtener stock actual en la sucursal
        SELECT stock_actual INTO stock_sucursal_actual
        FROM stock_sucursal
        WHERE id_producto = NEW.id_producto 
          AND id_sucursal = NEW.id_sucursal
          AND activo = true;
        
        -- Generar alerta por stock bajo en sucursal
        IF stock_sucursal_actual IS NOT NULL AND stock_sucursal_actual <= 5 AND stock_sucursal_actual > 0 THEN
          INSERT INTO alertas_inventario (
            id_producto, 
            id_sucursal,
            id_lote, 
            tipo_alerta, 
            mensaje, 
            nivel_urgencia, 
            id_restaurante
          ) VALUES (
            NEW.id_producto, 
            NEW.id_sucursal,
            NEW.id_lote, 
            'stock_bajo_sucursal', 
            'Stock bajo en sucursal - Lote ' || NEW.numero_lote, 
            'alta', 
            NEW.id_restaurante
          );
        END IF;
        
        -- Generar alerta por stock agotado
        IF stock_sucursal_actual IS NOT NULL AND stock_sucursal_actual = 0 THEN
          INSERT INTO alertas_inventario (
            id_producto, 
            id_sucursal,
            id_lote, 
            tipo_alerta, 
            mensaje, 
            nivel_urgencia, 
            id_restaurante
          ) VALUES (
            NEW.id_producto, 
            NEW.id_sucursal,
            NEW.id_lote, 
            'stock_agotado_sucursal', 
            'Stock agotado en sucursal - Lote ' || NEW.numero_lote, 
            'critica', 
            NEW.id_restaurante
          );
        END IF;
        
        -- Generar alerta por caducidad próxima
        IF NEW.fecha_caducidad IS NOT NULL THEN
          dias_restantes := NEW.fecha_caducidad - CURRENT_DATE;
          
          IF dias_restantes <= 7 AND dias_restantes > 0 THEN
            nivel_urgencia := 'alta';
            mensaje := 'Lote ' || NEW.numero_lote || ' caduca en ' || dias_restantes || ' días (Sucursal)';
          ELSIF dias_restantes <= 30 AND dias_restantes > 7 THEN
            nivel_urgencia := 'media';
            mensaje := 'Lote ' || NEW.numero_lote || ' caduca en ' || dias_restantes || ' días (Sucursal)';
          ELSIF dias_restantes < 0 THEN
            nivel_urgencia := 'critica';
            mensaje := 'Lote ' || NEW.numero_lote || ' está vencido (Sucursal)';
          END IF;
          
          IF nivel_urgencia IS NOT NULL THEN
            INSERT INTO alertas_inventario (
              id_producto, 
              id_sucursal,
              id_lote, 
              tipo_alerta, 
              mensaje, 
              nivel_urgencia, 
              id_restaurante
            ) VALUES (
              NEW.id_producto, 
              NEW.id_sucursal,
              NEW.id_lote, 
              'caducidad_sucursal', 
              mensaje, 
              nivel_urgencia, 
              NEW.id_restaurante
            );
          END IF;
        END IF;
        
        RETURN NEW;
      END;
      $function$
;

-- Función: generar_lote_automatico
CREATE OR REPLACE FUNCTION public.generar_lote_automatico(p_id_producto integer, p_cantidad numeric, p_precio_compra numeric DEFAULT NULL::numeric, p_proveedor character varying DEFAULT 'Proveedor General'::character varying, p_id_restaurante integer DEFAULT 1)
 RETURNS integer
 LANGUAGE plpgsql
AS $function$
        DECLARE
          v_id_lote INTEGER;
          v_numero_lote VARCHAR;
          v_id_categoria_almacen INTEGER;
          v_fecha_fabricacion DATE;
          v_fecha_caducidad DATE;
          v_categoria_producto VARCHAR;
        BEGIN
          -- Obtener categoría del producto
          SELECT c.nombre INTO v_categoria_producto
          FROM productos p
          JOIN categorias c ON p.id_categoria = c.id_categoria
          WHERE p.id_producto = p_id_producto;
          
          -- Determinar categoría de almacén basada en la categoría del producto
          IF v_categoria_producto ILIKE '%bebida%' OR v_categoria_producto ILIKE '%agua%' OR v_categoria_producto ILIKE '%cerveza%' THEN
            SELECT id_categoria_almacen INTO v_id_categoria_almacen
            FROM categorias_almacen 
            WHERE nombre = 'Almacén de Bebidas' AND activo = true;
          ELSIF v_categoria_producto ILIKE '%carne%' OR v_categoria_producto ILIKE '%pescado%' OR v_categoria_producto ILIKE '%helado%' THEN
            SELECT id_categoria_almacen INTO v_id_categoria_almacen
            FROM categorias_almacen 
            WHERE nombre = 'Cámara de Congelación' AND activo = true;
          ELSIF v_categoria_producto ILIKE '%pan%' OR v_categoria_producto ILIKE '%condimento%' OR v_categoria_producto ILIKE '%grano%' THEN
            SELECT id_categoria_almacen INTO v_id_categoria_almacen
            FROM categorias_almacen 
            WHERE nombre = 'Almacén Seco' AND activo = true;
          ELSIF v_categoria_producto ILIKE '%utensilio%' OR v_categoria_producto ILIKE '%vajilla%' THEN
            SELECT id_categoria_almacen INTO v_id_categoria_almacen
            FROM categorias_almacen 
            WHERE nombre = 'Almacén de Vajilla' AND activo = true;
          ELSIF v_categoria_producto ILIKE '%limpieza%' OR v_categoria_producto ILIKE '%desechable%' THEN
            SELECT id_categoria_almacen INTO v_id_categoria_almacen
            FROM categorias_almacen 
            WHERE nombre = 'Almacén de Limpieza' AND activo = true;
          ELSE
            -- Por defecto, usar Cámara Refrigerada
            SELECT id_categoria_almacen INTO v_id_categoria_almacen
            FROM categorias_almacen 
            WHERE nombre = 'Cámara Refrigerada' AND activo = true;
          END IF;
          
          -- Si no se encuentra ninguna categoría, usar la primera disponible
          IF v_id_categoria_almacen IS NULL THEN
            SELECT id_categoria_almacen INTO v_id_categoria_almacen
            FROM categorias_almacen 
            WHERE activo = true 
            LIMIT 1;
          END IF;
          
          -- Generar número de lote único
          v_numero_lote := 'LOT-' || p_id_producto || '-' || EXTRACT(YEAR FROM CURRENT_DATE) || 
                           LPAD(EXTRACT(MONTH FROM CURRENT_DATE)::TEXT, 2, '0') || 
                           LPAD(EXTRACT(DAY FROM CURRENT_DATE)::TEXT, 2, '0') || '-' ||
                           LPAD(FLOOR(RANDOM() * 1000)::TEXT, 3, '0');
          
          -- Establecer fechas por defecto
          v_fecha_fabricacion := CURRENT_DATE;
          v_fecha_caducidad := CURRENT_DATE + INTERVAL '1 year';
          
          -- Insertar lote
          INSERT INTO inventario_lotes (
            id_producto, numero_lote, cantidad_inicial, cantidad_actual,
            fecha_fabricacion, fecha_caducidad, precio_compra, id_categoria_almacen,
            proveedor, id_restaurante, activo, created_at
          ) VALUES (
            p_id_producto, v_numero_lote, p_cantidad, p_cantidad,
            v_fecha_fabricacion, v_fecha_caducidad, p_precio_compra, v_id_categoria_almacen,
            p_proveedor, p_id_restaurante, true, NOW()
          ) RETURNING id_lote INTO v_id_lote;
          
          RETURN v_id_lote;
        END;
        $function$
;

-- Función: get_promociones_activas
CREATE OR REPLACE FUNCTION public.get_promociones_activas(p_id_restaurante integer, p_id_sucursal integer DEFAULT NULL::integer)
 RETURNS TABLE(id_promocion integer, nombre text, tipo text, valor numeric, fecha_inicio date, fecha_fin date, id_producto integer, nombre_producto text, estado_promocion text)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
    SELECT
      p.id_promocion, 
      p.nombre::TEXT, 
      p.tipo::TEXT, 
      p.valor,
      p.fecha_inicio, 
      p.fecha_fin, 
      p.id_producto,
      COALESCE(pr.nombre, '')::TEXT AS nombre_producto,
      CASE
        WHEN p.fecha_inicio <= CURRENT_DATE AND p.fecha_fin >= CURRENT_DATE THEN 'activa'
        WHEN p.fecha_inicio > CURRENT_DATE THEN 'pendiente'
        ELSE 'expirada'
      END::TEXT AS estado_promocion
    FROM promociones p
    LEFT JOIN productos pr ON p.id_producto = pr.id_producto
    WHERE p.id_restaurante = p_id_restaurante
      AND p.activa = true
      AND p.fecha_inicio <= CURRENT_DATE
      AND p.fecha_fin >= CURRENT_DATE
      AND (
        p_id_sucursal IS NULL 
        OR EXISTS (
          SELECT 1 FROM promociones_sucursales ps 
          WHERE ps.id_promocion = p.id_promocion 
          AND ps.id_sucursal = p_id_sucursal
        )
      )
    ORDER BY p.valor DESC;
END;
$function$
;

-- Función: marcar_venta_diferida_como_pagada
CREATE OR REPLACE FUNCTION public.marcar_venta_diferida_como_pagada(p_id_venta integer, p_id_pago_final integer, p_id_vendedor integer, p_observaciones text DEFAULT NULL::text)
 RETURNS json
 LANGUAGE plpgsql
AS $function$
      DECLARE
        v_venta RECORD;
        v_pago_diferido RECORD;
        v_resultado JSON;
      BEGIN
        -- Obtener información de la venta
        SELECT * INTO v_venta FROM ventas WHERE id_venta = p_id_venta;
        
        IF NOT FOUND THEN
          RETURN json_build_object('success', false, 'message', 'Venta no encontrada');
        END IF;
        
        -- Verificar que la venta sea de tipo diferido
        IF v_venta.tipo_pago != 'diferido' THEN
          RETURN json_build_object('success', false, 'message', 'La venta no es de tipo diferido');
        END IF;
        
        -- Verificar que la venta esté pendiente de pago
        IF v_venta.estado_pago != 'pendiente' THEN
          RETURN json_build_object('success', false, 'message', 'La venta ya fue pagada');
        END IF;
        
        -- Actualizar la venta
        UPDATE ventas 
        SET 
          id_pago_final = p_id_pago_final,
          fecha_pago_final = CURRENT_TIMESTAMP,
          estado_pago = 'pagado',
          updated_at = CURRENT_TIMESTAMP
        WHERE id_venta = p_id_venta;
        
        -- Actualizar el pago diferido si existe
        UPDATE pagos_diferidos 
        SET 
          estado = 'pagado',
          updated_at = CURRENT_TIMESTAMP
        WHERE id_venta = p_id_venta;
        
        -- Registrar en el historial
        INSERT INTO historial_pagos_diferidos (
          id_pago_diferido,
          id_venta,
          id_pago_final,
          monto_pagado,
          id_vendedor,
          observaciones,
          id_restaurante
        )
        SELECT 
          pd.id_pago_diferido,
          p_id_venta,
          p_id_pago_final,
          v_venta.total,
          p_id_vendedor,
          p_observaciones,
          v_venta.id_restaurante
        FROM pagos_diferidos pd
        WHERE pd.id_venta = p_id_venta;
        
        RETURN json_build_object(
          'success', true, 
          'message', 'Venta marcada como pagada exitosamente',
          'venta_id', p_id_venta,
          'total', v_venta.total,
          'fecha_pago', CURRENT_TIMESTAMP
        );
      END;
      $function$
;

-- Función: obtener_plan_actual
CREATE OR REPLACE FUNCTION public.obtener_plan_actual(p_id_restaurante integer)
 RETURNS TABLE(id_plan integer, nombre character varying, precio_mensual numeric, max_sucursales integer, max_usuarios integer, max_productos integer, max_transacciones_mes integer, almacenamiento_gb integer, funcionalidades jsonb, estado character varying, fecha_fin date)
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        p.id_plan,
        p.nombre,
        p.precio_mensual,
        p.max_sucursales,
        p.max_usuarios,
        p.max_productos,
        p.max_transacciones_mes,
        p.almacenamiento_gb,
        p.funcionalidades,
        s.estado,
        s.fecha_fin
    FROM planes p
    JOIN suscripciones s ON p.id_plan = s.id_plan
    WHERE s.id_restaurante = p_id_restaurante
    AND s.estado = 'activa'
    AND (s.fecha_fin IS NULL OR s.fecha_fin >= CURRENT_DATE)
    ORDER BY s.created_at DESC
    LIMIT 1;
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

-- Función: obtener_ventas_pendientes_pago
CREATE OR REPLACE FUNCTION public.obtener_ventas_pendientes_pago(p_id_restaurante integer, p_id_mesa integer DEFAULT NULL::integer)
 RETURNS TABLE(id_venta integer, mesa_numero integer, total numeric, fecha_creacion timestamp without time zone, tipo_servicio character varying, estado_pago character varying, dias_pendiente integer)
 LANGUAGE plpgsql
AS $function$
      BEGIN
        RETURN QUERY
        SELECT 
          v.id_venta,
          v.mesa_numero,
          v.total,
          v.created_at,
          v.tipo_servicio,
          v.estado_pago,
          EXTRACT(DAY FROM (CURRENT_TIMESTAMP - v.created_at))::INTEGER as dias_pendiente
        FROM ventas v
        WHERE v.id_restaurante = p_id_restaurante
          AND v.tipo_pago = 'diferido'
          AND v.estado_pago = 'pendiente'
          AND (p_id_mesa IS NULL OR v.id_mesa = p_id_mesa)
        ORDER BY v.created_at ASC;
      END;
      $function$
;

-- Función: registrar_movimiento_inventario
CREATE OR REPLACE FUNCTION public.registrar_movimiento_inventario()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
      DECLARE
        stock_anterior_lote INTEGER;
        stock_nuevo_lote INTEGER;
        cantidad_cambio INTEGER;
        tipo_movimiento_lote VARCHAR(50);
      BEGIN
        -- Determinar tipo de movimiento y cantidad
        IF TG_OP = 'INSERT' THEN
          stock_anterior_lote := 0;
          stock_nuevo_lote := NEW.cantidad_actual;
          cantidad_cambio := NEW.cantidad_actual;
          tipo_movimiento_lote := 'entrada_lote';
        ELSIF TG_OP = 'UPDATE' THEN
          stock_anterior_lote := OLD.cantidad_actual;
          stock_nuevo_lote := NEW.cantidad_actual;
          cantidad_cambio := NEW.cantidad_actual - OLD.cantidad_actual;
          IF cantidad_cambio > 0 THEN
            tipo_movimiento_lote := 'entrada_lote';
          ELSE
            tipo_movimiento_lote := 'salida_lote';
          END IF;
        ELSIF TG_OP = 'DELETE' THEN
          stock_anterior_lote := OLD.cantidad_actual;
          stock_nuevo_lote := 0;
          cantidad_cambio := -OLD.cantidad_actual;
          tipo_movimiento_lote := 'eliminacion_lote';
        END IF;
        
        -- Registrar movimiento si hay cambio
        IF cantidad_cambio != 0 THEN
          INSERT INTO movimientos_inventario (
            id_producto,
            id_sucursal,
            tipo_movimiento,
            cantidad,
            stock_anterior,
            stock_actual,
            id_restaurante,
            id_lote,
            motivo
          ) VALUES (
            COALESCE(NEW.id_producto, OLD.id_producto),
            COALESCE(NEW.id_sucursal, OLD.id_sucursal),
            tipo_movimiento_lote,
            ABS(cantidad_cambio),
            stock_anterior_lote,
            stock_nuevo_lote,
            COALESCE(NEW.id_restaurante, OLD.id_restaurante),
            COALESCE(NEW.id_lote, OLD.id_lote),
            'Movimiento automático por lote: ' || tipo_movimiento_lote
          );
        END IF;
        
        RETURN COALESCE(NEW, OLD);
      END;
      $function$
;

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

-- Función: update_grupos_mesas_updated_at
CREATE OR REPLACE FUNCTION public.update_grupos_mesas_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$function$
;

-- Función: update_mesa_total_acumulado
CREATE OR REPLACE FUNCTION public.update_mesa_total_acumulado()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
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
$function$
;

-- Función: update_modificadores_updated_at
CREATE OR REPLACE FUNCTION public.update_modificadores_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$function$
;

-- Función: update_timestamp
CREATE OR REPLACE FUNCTION public.update_timestamp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.actualizado_en = NOW();
    RETURN NEW;
END;
$function$
;

-- Función: update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$function$
;

-- Función: update_venta_total
CREATE OR REPLACE FUNCTION public.update_venta_total()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
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
$function$
;

-- Función: validar_estado_venta
CREATE OR REPLACE FUNCTION public.validar_estado_venta()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
      BEGIN
        IF NEW.estado NOT IN (
          'recibido', 'en_preparacion', 'entregado', 'cancelado',
          'abierta', 'en_uso', 'pendiente_cobro', 'completada', 'pendiente', 'pagado',
          'pendiente_aprobacion', 'aceptado'
        ) THEN
          RAISE EXCEPTION 'Estado de venta inválido: %', NEW.estado;
        END IF;
        RETURN NEW;
      END;
      $function$
;

-- Función: validar_integridad_lote
CREATE OR REPLACE FUNCTION public.validar_integridad_lote()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
        BEGIN
          -- Validar que el producto existe y está activo
          IF NOT EXISTS (SELECT 1 FROM productos WHERE id_producto = NEW.id_producto AND activo = true) THEN
            RAISE EXCEPTION 'El producto % no existe o no está activo', NEW.id_producto;
          END IF;
          
          -- Validar que la categoría de almacén existe
          IF NEW.id_categoria_almacen IS NOT NULL AND 
             NOT EXISTS (SELECT 1 FROM categorias_almacen WHERE id_categoria_almacen = NEW.id_categoria_almacen AND activo = true) THEN
            RAISE EXCEPTION 'La categoría de almacén % no existe o no está activa', NEW.id_categoria_almacen;
          END IF;
          
          -- Validar fechas
          IF NEW.fecha_fabricacion IS NOT NULL AND NEW.fecha_caducidad IS NOT NULL AND 
             NEW.fecha_fabricacion >= NEW.fecha_caducidad THEN
            RAISE EXCEPTION 'La fecha de fabricación debe ser anterior a la fecha de caducidad';
          END IF;
          
          -- Validar cantidades
          IF NEW.cantidad_inicial < 0 OR NEW.cantidad_actual < 0 THEN
            RAISE EXCEPTION 'Las cantidades no pueden ser negativas';
          END IF;
          
          IF NEW.cantidad_actual > NEW.cantidad_inicial THEN
            RAISE EXCEPTION 'La cantidad actual no puede ser mayor a la cantidad inicial';
          END IF;
          
          -- Validar precio de compra
          IF NEW.precio_compra IS NOT NULL AND NEW.precio_compra < 0 THEN
            RAISE EXCEPTION 'El precio de compra no puede ser negativo';
          END IF;
          
          RETURN NEW;
        END;
        $function$
;

-- Función: validate_detalle_venta_integrity
CREATE OR REPLACE FUNCTION public.validate_detalle_venta_integrity()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
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
$function$
;

-- Función: validate_mesa_integrity
CREATE OR REPLACE FUNCTION public.validate_mesa_integrity()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Verificar que no haya mesas duplicadas por (numero, id_sucursal, id_restaurante)
  IF EXISTS (
    SELECT 1 FROM mesas 
    WHERE numero = NEW.numero 
      AND id_sucursal = NEW.id_sucursal
      AND id_restaurante = NEW.id_restaurante 
      AND id_mesa != COALESCE(NEW.id_mesa, 0)
  ) THEN
    RAISE EXCEPTION 'Ya existe una mesa con número % en la sucursal % del restaurante %', NEW.numero, NEW.id_sucursal, NEW.id_restaurante;
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
$function$
;

-- Función: validate_prefactura_integrity
CREATE OR REPLACE FUNCTION public.validate_prefactura_integrity()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
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
$function$
;

-- Función: validate_producto_integrity
CREATE OR REPLACE FUNCTION public.validate_producto_integrity()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
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
$function$
;

-- Función: validate_venta_integrity
CREATE OR REPLACE FUNCTION public.validate_venta_integrity()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
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
          'recibido', 'en_preparacion', 'listo_para_servir', 'entregado', 'cancelado',
          'abierta', 'en_uso', 'pendiente_cobro', 'completada', 'pendiente', 'pagado',
          'pendiente_aprobacion', 'aceptado'
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
      $function$
;

-- Función: validate_venta_mesa
CREATE OR REPLACE FUNCTION public.validate_venta_mesa()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Solo validar mesa cuando es servicio de Mesa
  IF NEW.tipo_servicio = 'Mesa' THEN
    IF NEW.id_mesa IS NULL OR NEW.mesa_numero IS NULL THEN
      RAISE EXCEPTION 'La mesa es obligatoria para ventas de Mesa' USING ERRCODE = 'P0001';
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM mesas m
      WHERE m.id_mesa = NEW.id_mesa
        AND m.numero = NEW.mesa_numero
        AND m.id_sucursal = NEW.id_sucursal
        AND m.id_restaurante = NEW.id_restaurante
    ) THEN
      RAISE EXCEPTION 'La mesa % no existe en la sucursal/restaurante', NEW.mesa_numero USING ERRCODE = 'P0001';
    END IF;
  END IF;

  RETURN NEW;
END;
$function$
;

-- Función: verificar_limites_plan
CREATE OR REPLACE FUNCTION public.verificar_limites_plan(p_id_restaurante integer)
 RETURNS TABLE(recurso character varying, valor_actual integer, valor_limite integer, porcentaje_uso numeric, estado character varying)
 LANGUAGE plpgsql
AS $function$
DECLARE
    plan_actual RECORD;
    uso_actual RECORD;
BEGIN
    -- Obtener plan actual
    SELECT * INTO plan_actual FROM obtener_plan_actual(p_id_restaurante);
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'No se encontró plan activo para el restaurante %', p_id_restaurante;
    END IF;
    
    -- Obtener uso actual
    SELECT 
        productos_actuales,
        usuarios_actuales,
        sucursales_actuales,
        transacciones_mes_actual,
        almacenamiento_usado_mb
    INTO uso_actual
    FROM uso_recursos
    WHERE id_restaurante = p_id_restaurante
    AND mes_medicion = EXTRACT(MONTH FROM CURRENT_DATE)
    AND año_medicion = EXTRACT(YEAR FROM CURRENT_DATE);
    
    -- Si no hay registro de uso, crear uno con valores 0
    IF NOT FOUND THEN
        INSERT INTO uso_recursos (id_restaurante, id_plan, mes_medicion, año_medicion)
        VALUES (p_id_restaurante, plan_actual.id_plan, EXTRACT(MONTH FROM CURRENT_DATE), EXTRACT(YEAR FROM CURRENT_DATE));
        
        SELECT 
            productos_actuales,
            usuarios_actuales,
            sucursales_actuales,
            transacciones_mes_actual,
            almacenamiento_usado_mb
        INTO uso_actual
        FROM uso_recursos
        WHERE id_restaurante = p_id_restaurante
        AND mes_medicion = EXTRACT(MONTH FROM CURRENT_DATE)
        AND año_medicion = EXTRACT(YEAR FROM CURRENT_DATE);
    END IF;
    
    -- Retornar verificación de límites
    RETURN QUERY
    SELECT 
        'productos'::VARCHAR(30),
        uso_actual.productos_actuales,
        CASE WHEN plan_actual.max_productos = 0 THEN 999999 ELSE plan_actual.max_productos END,
        CASE 
            WHEN plan_actual.max_productos = 0 THEN 0.0
            ELSE ROUND((uso_actual.productos_actuales::DECIMAL / plan_actual.max_productos) * 100, 2)
        END,
        CASE 
            WHEN plan_actual.max_productos = 0 THEN 'ilimitado'::VARCHAR(20)
            WHEN uso_actual.productos_actuales >= plan_actual.max_productos THEN 'excedido'::VARCHAR(20)
            WHEN uso_actual.productos_actuales >= (plan_actual.max_productos * 0.9) THEN 'critico'::VARCHAR(20)
            WHEN uso_actual.productos_actuales >= (plan_actual.max_productos * 0.8) THEN 'warning'::VARCHAR(20)
            ELSE 'ok'::VARCHAR(20)
        END
    
    UNION ALL
    
    SELECT 
        'usuarios'::VARCHAR(30),
        uso_actual.usuarios_actuales,
        CASE WHEN plan_actual.max_usuarios = 0 THEN 999999 ELSE plan_actual.max_usuarios END,
        CASE 
            WHEN plan_actual.max_usuarios = 0 THEN 0.0
            ELSE ROUND((uso_actual.usuarios_actuales::DECIMAL / plan_actual.max_usuarios) * 100, 2)
        END,
        CASE 
            WHEN plan_actual.max_usuarios = 0 THEN 'ilimitado'::VARCHAR(20)
            WHEN uso_actual.usuarios_actuales >= plan_actual.max_usuarios THEN 'excedido'::VARCHAR(20)
            WHEN uso_actual.usuarios_actuales >= (plan_actual.max_usuarios * 0.9) THEN 'critico'::VARCHAR(20)
            WHEN uso_actual.usuarios_actuales >= (plan_actual.max_usuarios * 0.8) THEN 'warning'::VARCHAR(20)
            ELSE 'ok'::VARCHAR(20)
        END
    
    UNION ALL
    
    SELECT 
        'sucursales'::VARCHAR(30),
        uso_actual.sucursales_actuales,
        CASE WHEN plan_actual.max_sucursales = 0 THEN 999999 ELSE plan_actual.max_sucursales END,
        CASE 
            WHEN plan_actual.max_sucursales = 0 THEN 0.0
            ELSE ROUND((uso_actual.sucursales_actuales::DECIMAL / plan_actual.max_sucursales) * 100, 2)
        END,
        CASE 
            WHEN plan_actual.max_sucursales = 0 THEN 'ilimitado'::VARCHAR(20)
            WHEN uso_actual.sucursales_actuales >= plan_actual.max_sucursales THEN 'excedido'::VARCHAR(20)
            WHEN uso_actual.sucursales_actuales >= (plan_actual.max_sucursales * 0.9) THEN 'critico'::VARCHAR(20)
            WHEN uso_actual.sucursales_actuales >= (plan_actual.max_sucursales * 0.8) THEN 'warning'::VARCHAR(20)
            ELSE 'ok'::VARCHAR(20)
        END
    
    UNION ALL
    
    SELECT 
        'transacciones'::VARCHAR(30),
        uso_actual.transacciones_mes_actual,
        CASE WHEN plan_actual.max_transacciones_mes = 0 THEN 999999 ELSE plan_actual.max_transacciones_mes END,
        CASE 
            WHEN plan_actual.max_transacciones_mes = 0 THEN 0.0
            ELSE ROUND((uso_actual.transacciones_mes_actual::DECIMAL / plan_actual.max_transacciones_mes) * 100, 2)
        END,
        CASE 
            WHEN plan_actual.max_transacciones_mes = 0 THEN 'ilimitado'::VARCHAR(20)
            WHEN uso_actual.transacciones_mes_actual >= plan_actual.max_transacciones_mes THEN 'excedido'::VARCHAR(20)
            WHEN uso_actual.transacciones_mes_actual >= (plan_actual.max_transacciones_mes * 0.9) THEN 'critico'::VARCHAR(20)
            WHEN uso_actual.transacciones_mes_actual >= (plan_actual.max_transacciones_mes * 0.8) THEN 'warning'::VARCHAR(20)
            ELSE 'ok'::VARCHAR(20)
        END;
END;
$function$
;

-- TRIGGERS
-- Trigger: update_casos_exito_updated_at
CREATE TRIGGER update_casos_exito_updated_at BEFORE UPDATE ON casos_exito FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger: trigger_categorias_egresos_updated_at
CREATE TRIGGER trigger_categorias_egresos_updated_at BEFORE UPDATE ON categorias_egresos FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at_egresos();

-- Trigger: update_clientes_updated_at
CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON clientes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger: update_configuracion_web_updated_at
CREATE TRIGGER update_configuracion_web_updated_at BEFORE UPDATE ON configuracion_web FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger: update_contenido_web_updated_at
CREATE TRIGGER update_contenido_web_updated_at BEFORE UPDATE ON contenido_web FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger: update_demos_reuniones_updated_at
CREATE TRIGGER update_demos_reuniones_updated_at BEFORE UPDATE ON demos_reuniones FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger: trigger_update_venta_total
CREATE TRIGGER trigger_update_venta_total AFTER INSERT ON detalle_ventas FOR EACH ROW EXECUTE FUNCTION update_venta_total();

-- Trigger: trigger_update_venta_total
CREATE TRIGGER trigger_update_venta_total AFTER DELETE ON detalle_ventas FOR EACH ROW EXECUTE FUNCTION update_venta_total();

-- Trigger: trigger_update_venta_total
CREATE TRIGGER trigger_update_venta_total AFTER UPDATE ON detalle_ventas FOR EACH ROW EXECUTE FUNCTION update_venta_total();

-- Trigger: trigger_validate_detalle_venta_integrity
CREATE TRIGGER trigger_validate_detalle_venta_integrity BEFORE UPDATE ON detalle_ventas FOR EACH ROW EXECUTE FUNCTION validate_detalle_venta_integrity();

-- Trigger: trigger_validate_detalle_venta_integrity
CREATE TRIGGER trigger_validate_detalle_venta_integrity BEFORE INSERT ON detalle_ventas FOR EACH ROW EXECUTE FUNCTION validate_detalle_venta_integrity();

-- Trigger: trigger_actualizar_presupuesto_egresos
CREATE TRIGGER trigger_actualizar_presupuesto_egresos AFTER UPDATE ON egresos FOR EACH ROW EXECUTE FUNCTION actualizar_presupuesto_gastado_egresos();

-- Trigger: trigger_actualizar_presupuesto_egresos
CREATE TRIGGER trigger_actualizar_presupuesto_egresos AFTER INSERT ON egresos FOR EACH ROW EXECUTE FUNCTION actualizar_presupuesto_gastado_egresos();

-- Trigger: trigger_egresos_updated_at
CREATE TRIGGER trigger_egresos_updated_at BEFORE UPDATE ON egresos FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at_egresos();

-- Trigger: update_grupos_mesas_updated_at
CREATE TRIGGER update_grupos_mesas_updated_at BEFORE UPDATE ON grupos_mesas FOR EACH ROW EXECUTE FUNCTION update_grupos_mesas_updated_at();

-- Trigger: trigger_actualizar_stock_producto
CREATE TRIGGER trigger_actualizar_stock_producto AFTER UPDATE ON inventario_lotes FOR EACH ROW EXECUTE FUNCTION actualizar_stock_producto();

-- Trigger: trigger_actualizar_stock_producto
CREATE TRIGGER trigger_actualizar_stock_producto AFTER INSERT ON inventario_lotes FOR EACH ROW EXECUTE FUNCTION actualizar_stock_producto();

-- Trigger: trigger_actualizar_stock_producto
CREATE TRIGGER trigger_actualizar_stock_producto AFTER DELETE ON inventario_lotes FOR EACH ROW EXECUTE FUNCTION actualizar_stock_producto();

-- Trigger: trigger_generar_alertas_inventario
CREATE TRIGGER trigger_generar_alertas_inventario AFTER INSERT ON inventario_lotes FOR EACH ROW EXECUTE FUNCTION generar_alertas_inventario();

-- Trigger: trigger_generar_alertas_inventario
CREATE TRIGGER trigger_generar_alertas_inventario AFTER UPDATE ON inventario_lotes FOR EACH ROW EXECUTE FUNCTION generar_alertas_inventario();

-- Trigger: trigger_registrar_movimiento_inventario
CREATE TRIGGER trigger_registrar_movimiento_inventario AFTER DELETE ON inventario_lotes FOR EACH ROW EXECUTE FUNCTION registrar_movimiento_inventario();

-- Trigger: trigger_registrar_movimiento_inventario
CREATE TRIGGER trigger_registrar_movimiento_inventario AFTER UPDATE ON inventario_lotes FOR EACH ROW EXECUTE FUNCTION registrar_movimiento_inventario();

-- Trigger: trigger_registrar_movimiento_inventario
CREATE TRIGGER trigger_registrar_movimiento_inventario AFTER INSERT ON inventario_lotes FOR EACH ROW EXECUTE FUNCTION registrar_movimiento_inventario();

-- Trigger: trigger_validar_integridad_lote
CREATE TRIGGER trigger_validar_integridad_lote BEFORE INSERT ON inventario_lotes FOR EACH ROW EXECUTE FUNCTION validar_integridad_lote();

-- Trigger: trigger_validar_integridad_lote
CREATE TRIGGER trigger_validar_integridad_lote BEFORE UPDATE ON inventario_lotes FOR EACH ROW EXECUTE FUNCTION validar_integridad_lote();

-- Trigger: update_leads_prospectos_updated_at
CREATE TRIGGER update_leads_prospectos_updated_at BEFORE UPDATE ON leads_prospectos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger: trg_validate_mesa_integrity
CREATE TRIGGER trg_validate_mesa_integrity BEFORE INSERT ON mesas FOR EACH ROW EXECUTE FUNCTION validate_mesa_integrity();

-- Trigger: trg_validate_mesa_integrity
CREATE TRIGGER trg_validate_mesa_integrity BEFORE UPDATE ON mesas FOR EACH ROW EXECUTE FUNCTION validate_mesa_integrity();

-- Trigger: trigger_validate_mesa_integrity
CREATE TRIGGER trigger_validate_mesa_integrity BEFORE UPDATE ON mesas FOR EACH ROW EXECUTE FUNCTION validate_mesa_integrity();

-- Trigger: trigger_validate_mesa_integrity
CREATE TRIGGER trigger_validate_mesa_integrity BEFORE INSERT ON mesas FOR EACH ROW EXECUTE FUNCTION validate_mesa_integrity();

-- Trigger: update_mesas_updated_at
CREATE TRIGGER update_mesas_updated_at BEFORE UPDATE ON mesas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger: update_pagos_diferidos_updated_at
CREATE TRIGGER update_pagos_diferidos_updated_at BEFORE UPDATE ON pagos_diferidos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger: update_planes_updated_at
CREATE TRIGGER update_planes_updated_at BEFORE UPDATE ON planes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger: update_planes_pos_updated_at
CREATE TRIGGER update_planes_pos_updated_at BEFORE UPDATE ON planes_pos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger: trigger_validate_prefactura_integrity
CREATE TRIGGER trigger_validate_prefactura_integrity BEFORE INSERT ON prefacturas FOR EACH ROW EXECUTE FUNCTION validate_prefactura_integrity();

-- Trigger: trigger_validate_prefactura_integrity
CREATE TRIGGER trigger_validate_prefactura_integrity BEFORE UPDATE ON prefacturas FOR EACH ROW EXECUTE FUNCTION validate_prefactura_integrity();

-- Trigger: trigger_presupuestos_egresos_updated_at
CREATE TRIGGER trigger_presupuestos_egresos_updated_at BEFORE UPDATE ON presupuestos_egresos FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at_egresos();

-- Trigger: trigger_validate_producto_integrity
CREATE TRIGGER trigger_validate_producto_integrity BEFORE INSERT ON productos FOR EACH ROW EXECUTE FUNCTION validate_producto_integrity();

-- Trigger: trigger_validate_producto_integrity
CREATE TRIGGER trigger_validate_producto_integrity BEFORE UPDATE ON productos FOR EACH ROW EXECUTE FUNCTION validate_producto_integrity();

-- Trigger: update_productos_modificadores_updated_at
CREATE TRIGGER update_productos_modificadores_updated_at BEFORE UPDATE ON productos_modificadores FOR EACH ROW EXECUTE FUNCTION update_modificadores_updated_at();

-- Trigger: trg_promociones_timestamp
CREATE TRIGGER trg_promociones_timestamp BEFORE INSERT ON promociones FOR EACH ROW EXECUTE FUNCTION fn_promociones_set_created();

-- Trigger: update_servicios_restaurante_actualizado_en
CREATE TRIGGER update_servicios_restaurante_actualizado_en BEFORE UPDATE ON servicios_restaurante FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Trigger: trigger_create_contadores_on_new_subscription
CREATE TRIGGER trigger_create_contadores_on_new_subscription AFTER INSERT ON suscripciones FOR EACH ROW EXECUTE FUNCTION update_contadores_on_plan_change();

-- Trigger: trigger_update_contadores_on_plan_change
CREATE TRIGGER trigger_update_contadores_on_plan_change AFTER UPDATE ON suscripciones FOR EACH ROW EXECUTE FUNCTION update_contadores_on_plan_change();

-- Trigger: update_suscripciones_updated_at
CREATE TRIGGER update_suscripciones_updated_at BEFORE UPDATE ON suscripciones FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger: update_testimonios_web_updated_at
CREATE TRIGGER update_testimonios_web_updated_at BEFORE UPDATE ON testimonios_web FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger: update_uso_recursos_updated_at
CREATE TRIGGER update_uso_recursos_updated_at BEFORE UPDATE ON uso_recursos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger: trg_validate_venta_mesa
CREATE TRIGGER trg_validate_venta_mesa BEFORE INSERT ON ventas FOR EACH ROW EXECUTE FUNCTION validate_venta_mesa();

-- Trigger: trg_validate_venta_mesa
CREATE TRIGGER trg_validate_venta_mesa BEFORE UPDATE ON ventas FOR EACH ROW EXECUTE FUNCTION validate_venta_mesa();

-- Trigger: trigger_update_mesa_total_acumulado
CREATE TRIGGER trigger_update_mesa_total_acumulado AFTER DELETE ON ventas FOR EACH ROW EXECUTE FUNCTION update_mesa_total_acumulado();

-- Trigger: trigger_update_mesa_total_acumulado
CREATE TRIGGER trigger_update_mesa_total_acumulado AFTER UPDATE ON ventas FOR EACH ROW EXECUTE FUNCTION update_mesa_total_acumulado();

-- Trigger: trigger_update_mesa_total_acumulado
CREATE TRIGGER trigger_update_mesa_total_acumulado AFTER INSERT ON ventas FOR EACH ROW EXECUTE FUNCTION update_mesa_total_acumulado();

-- Trigger: trigger_validate_venta_integrity
CREATE TRIGGER trigger_validate_venta_integrity BEFORE UPDATE ON ventas FOR EACH ROW EXECUTE FUNCTION validate_venta_integrity();

-- Trigger: trigger_validate_venta_integrity
CREATE TRIGGER trigger_validate_venta_integrity BEFORE INSERT ON ventas FOR EACH ROW EXECUTE FUNCTION validate_venta_integrity();

-- Trigger: validar_estado_venta
CREATE TRIGGER validar_estado_venta BEFORE UPDATE ON ventas FOR EACH ROW EXECUTE FUNCTION validar_estado_venta();

-- VISTAS
-- Vista: usuarios
CREATE OR REPLACE VIEW public.usuarios AS  SELECT id_vendedor AS id_usuario,
    nombre,
    email,
    password_hash,
    rol_admin_id AS rol_id,
    id_sucursal,
    activo,
    created_at AS creado_en,
    created_at AS actualizado_en
   FROM vendedores;;

-- Vista: v_integrity_monitoring
CREATE OR REPLACE VIEW public.v_integrity_monitoring AS  SELECT 'mesas'::text AS table_name,
    count(*) AS total_records,
    count(
        CASE
            WHEN ((mesas.estado)::text = 'en_uso'::text) THEN 1
            ELSE NULL::integer
        END) AS active_mesas,
    count(
        CASE
            WHEN ((mesas.estado)::text = 'libre'::text) THEN 1
            ELSE NULL::integer
        END) AS free_mesas,
    COALESCE(sum(mesas.total_acumulado), (0)::numeric) AS total_acumulado
   FROM mesas
UNION ALL
 SELECT 'ventas'::text AS table_name,
    count(*) AS total_records,
    count(
        CASE
            WHEN ((ventas.estado)::text = ANY ((ARRAY['recibido'::character varying, 'en_preparacion'::character varying, 'listo_para_servir'::character varying, 'abierta'::character varying, 'en_uso'::character varying, 'pendiente_cobro'::character varying])::text[])) THEN 1
            ELSE NULL::integer
        END) AS active_mesas,
    count(
        CASE
            WHEN ((ventas.estado)::text = ANY ((ARRAY['entregado'::character varying, 'completada'::character varying, 'pagado'::character varying])::text[])) THEN 1
            ELSE NULL::integer
        END) AS free_mesas,
    COALESCE(sum(ventas.total), (0)::numeric) AS total_acumulado
   FROM ventas
UNION ALL
 SELECT 'detalle_ventas'::text AS table_name,
    count(*) AS total_records,
    count(
        CASE
            WHEN (detalle_ventas.id_producto IS NOT NULL) THEN 1
            ELSE NULL::integer
        END) AS active_mesas,
    count(
        CASE
            WHEN (detalle_ventas.id_producto IS NULL) THEN 1
            ELSE NULL::integer
        END) AS free_mesas,
    COALESCE(sum(detalle_ventas.subtotal), (0)::numeric) AS total_acumulado
   FROM detalle_ventas;;

-- Vista: vista_lotes_criticos
CREATE OR REPLACE VIEW public.vista_lotes_criticos AS  SELECT il.id_lote,
    il.numero_lote,
    p.nombre AS producto_nombre,
    c.nombre AS categoria_nombre,
    il.cantidad_actual,
    il.fecha_caducidad,
    il.precio_compra,
        CASE
            WHEN (il.fecha_caducidad < now()) THEN 'vencido'::text
            WHEN (il.fecha_caducidad < (now() + '7 days'::interval)) THEN 'por_vencer'::text
            WHEN (il.fecha_caducidad < (now() + '30 days'::interval)) THEN 'proximo_vencer'::text
            ELSE 'vigente'::text
        END AS estado_caducidad,
        CASE
            WHEN (il.cantidad_actual = (0)::numeric) THEN 'sin_stock'::text
            WHEN (il.cantidad_actual <= (5)::numeric) THEN 'stock_bajo'::text
            ELSE 'stock_ok'::text
        END AS estado_stock,
    (CURRENT_DATE - il.fecha_caducidad) AS dias_vencido,
    (il.fecha_caducidad - CURRENT_DATE) AS dias_restantes
   FROM ((inventario_lotes il
     JOIN productos p ON ((il.id_producto = p.id_producto)))
     JOIN categorias c ON ((p.id_categoria = c.id_categoria)))
  WHERE ((il.activo = true) AND ((il.fecha_caducidad < (now() + '30 days'::interval)) OR (il.cantidad_actual <= (5)::numeric)))
  ORDER BY
        CASE
            WHEN (il.fecha_caducidad < now()) THEN 1
            WHEN (il.fecha_caducidad < (now() + '7 days'::interval)) THEN 2
            WHEN (il.fecha_caducidad < (now() + '30 days'::interval)) THEN 3
            ELSE 4
        END, il.fecha_caducidad;;

-- Vista: vista_pagos_diferidos
CREATE OR REPLACE VIEW public.vista_pagos_diferidos AS  SELECT pd.id_pago_diferido,
    pd.id_venta,
    v.mesa_numero,
    v.total,
    v.tipo_servicio,
    pd.fecha_creacion,
    pd.fecha_vencimiento,
    pd.estado,
    pd.observaciones,
    pd.id_restaurante,
        CASE
            WHEN ((pd.fecha_vencimiento < CURRENT_TIMESTAMP) AND ((pd.estado)::text = 'pendiente'::text)) THEN 'vencido'::character varying
            ELSE pd.estado
        END AS estado_real,
    (EXTRACT(day FROM (CURRENT_TIMESTAMP - (pd.fecha_creacion)::timestamp with time zone)))::integer AS dias_pendiente
   FROM (pagos_diferidos pd
     JOIN ventas v ON ((pd.id_venta = v.id_venta)));;

-- Vista: vista_resumen_inventario
CREATE OR REPLACE VIEW public.vista_resumen_inventario AS  SELECT p.id_producto,
    p.nombre AS producto_nombre,
    c.nombre AS categoria_nombre,
    p.stock_actual,
    p.precio,
    COALESCE(sum(il.cantidad_actual), (0)::numeric) AS stock_en_lotes,
    count(il.id_lote) AS total_lotes,
    count(
        CASE
            WHEN (il.fecha_caducidad < now()) THEN 1
            ELSE NULL::integer
        END) AS lotes_vencidos,
    count(
        CASE
            WHEN (il.fecha_caducidad < (now() + '7 days'::interval)) THEN 1
            ELSE NULL::integer
        END) AS lotes_por_vencer,
    min(il.fecha_caducidad) AS proxima_caducidad,
        CASE
            WHEN (p.stock_actual = 0) THEN 'sin_stock'::text
            WHEN (p.stock_actual <= 5) THEN 'stock_critico'::text
            WHEN (p.stock_actual <= 10) THEN 'stock_bajo'::text
            ELSE 'stock_ok'::text
        END AS estado_stock
   FROM ((productos p
     LEFT JOIN categorias c ON ((p.id_categoria = c.id_categoria)))
     LEFT JOIN inventario_lotes il ON (((p.id_producto = il.id_producto) AND (il.activo = true))))
  WHERE (p.activo = true)
  GROUP BY p.id_producto, p.nombre, c.nombre, p.stock_actual, p.precio
  ORDER BY p.stock_actual, p.nombre;;

