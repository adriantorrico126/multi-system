-- =====================================================
-- ESTRUCTURA COMPLETA DE BASE DE DATOS SITEMM POS
-- Sistema Multitenancy para Gestión de Restaurantes
-- =====================================================
-- Versión: 2.0.0
-- Base de Datos: PostgreSQL 12+
-- Fecha: Octubre 2025
-- =====================================================

-- =====================================================
-- 1. AUTENTICACIÓN Y USUARIOS
-- =====================================================

-- Administradores del sistema central
CREATE TABLE IF NOT EXISTS admin_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    activo BOOLEAN DEFAULT true,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Roles administrativos
CREATE TABLE IF NOT EXISTS roles_admin (
    id_rol SERIAL PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE NOT NULL,
    descripcion VARCHAR(255),
    permisos JSONB,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. GESTIÓN DE RESTAURANTES (Multitenancy)
-- =====================================================

-- Tabla maestra de restaurantes (Tenants)
CREATE TABLE IF NOT EXISTS restaurantes (
    id_restaurante SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    direccion TEXT,
    ciudad VARCHAR(100),
    telefono VARCHAR(20),
    email VARCHAR(100),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sucursales por restaurante
CREATE TABLE IF NOT EXISTS sucursales (
    id_sucursal SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    ciudad VARCHAR(100),
    direccion TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    id_restaurante INTEGER NOT NULL,
    FOREIGN KEY (id_restaurante) REFERENCES restaurantes(id_restaurante) ON DELETE CASCADE
);

-- Configuraciones por restaurante
CREATE TABLE IF NOT EXISTS configuraciones_restaurante (
    id_config SERIAL PRIMARY KEY,
    id_restaurante INTEGER NOT NULL,
    clave_config TEXT NOT NULL,
    valor_config JSONB NOT NULL,
    UNIQUE(id_restaurante, clave_config),
    FOREIGN KEY (id_restaurante) REFERENCES restaurantes(id_restaurante) ON DELETE CASCADE
);

-- Configuraciones globales del sistema
CREATE TABLE IF NOT EXISTS configuraciones_sistema (
    clave_config VARCHAR(100) PRIMARY KEY,
    valor_config JSONB,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. SISTEMA DE PLANES Y SUSCRIPCIONES
-- =====================================================

-- Definición de planes comerciales
CREATE TABLE IF NOT EXISTS planes (
    id_plan SERIAL PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE NOT NULL,
    descripcion TEXT,
    precio_mensual NUMERIC(10,2),
    precio_anual NUMERIC(10,2),
    max_sucursales INTEGER,
    max_usuarios INTEGER,
    max_productos INTEGER,
    max_transacciones_mes INTEGER,
    almacenamiento_gb INTEGER,
    funcionalidades JSONB,
    activo BOOLEAN DEFAULT true,
    orden_display INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Funcionalidades específicas
    incluye_pos BOOLEAN DEFAULT true,
    incluye_inventario_basico BOOLEAN DEFAULT true,
    incluye_inventario_avanzado BOOLEAN DEFAULT false,
    incluye_promociones BOOLEAN DEFAULT false,
    incluye_reservas BOOLEAN DEFAULT false,
    incluye_arqueo_caja BOOLEAN DEFAULT false,
    incluye_egresos BOOLEAN DEFAULT false,
    incluye_egresos_avanzados BOOLEAN DEFAULT false,
    incluye_reportes_avanzados BOOLEAN DEFAULT false,
    incluye_analytics BOOLEAN DEFAULT false,
    incluye_delivery BOOLEAN DEFAULT false,
    incluye_impresion BOOLEAN DEFAULT false,
    incluye_soporte_24h BOOLEAN DEFAULT false,
    incluye_api BOOLEAN DEFAULT false,
    incluye_white_label BOOLEAN DEFAULT false
);

-- Suscripciones activas
CREATE TABLE IF NOT EXISTS suscripciones (
    id_suscripcion SERIAL PRIMARY KEY,
    id_restaurante INTEGER NOT NULL,
    id_plan INTEGER NOT NULL,
    estado VARCHAR(20) DEFAULT 'activa' CHECK (estado IN ('activa', 'suspendida', 'cancelada', 'vencida')),
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE,
    fecha_renovacion DATE,
    metodo_pago VARCHAR(20),
    ultimo_pago TIMESTAMP WITH TIME ZONE,
    proximo_pago TIMESTAMP WITH TIME ZONE,
    auto_renovacion BOOLEAN DEFAULT true,
    notificaciones_email BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (id_restaurante) REFERENCES restaurantes(id_restaurante) ON DELETE CASCADE,
    FOREIGN KEY (id_plan) REFERENCES planes(id_plan)
);

-- Contadores de uso de recursos
CREATE TABLE IF NOT EXISTS contadores_uso (
    id_contador SERIAL PRIMARY KEY,
    id_restaurante INTEGER NOT NULL,
    id_plan INTEGER NOT NULL,
    recurso VARCHAR(50) NOT NULL,
    uso_actual INTEGER DEFAULT 0,
    limite_plan INTEGER,
    fecha_medicion DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (id_restaurante) REFERENCES restaurantes(id_restaurante) ON DELETE CASCADE,
    FOREIGN KEY (id_plan) REFERENCES planes(id_plan)
);

-- Uso histórico de recursos
CREATE TABLE IF NOT EXISTS uso_recursos (
    id_uso SERIAL PRIMARY KEY,
    id_restaurante INTEGER NOT NULL,
    id_plan INTEGER NOT NULL,
    productos_actuales INTEGER DEFAULT 0,
    usuarios_actuales INTEGER DEFAULT 0,
    sucursales_actuales INTEGER DEFAULT 0,
    transacciones_mes_actual INTEGER DEFAULT 0,
    almacenamiento_usado_mb INTEGER DEFAULT 0,
    mes_medicion INTEGER,
    año_medicion INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (id_restaurante) REFERENCES restaurantes(id_restaurante) ON DELETE CASCADE,
    FOREIGN KEY (id_plan) REFERENCES planes(id_plan)
);

-- Alertas de límites
CREATE TABLE IF NOT EXISTS alertas_limites (
    id_alerta SERIAL PRIMARY KEY,
    id_restaurante INTEGER NOT NULL,
    id_plan INTEGER NOT NULL,
    tipo_alerta VARCHAR(20) CHECK (tipo_alerta IN ('advertencia', 'critico', 'bloqueado')),
    recurso VARCHAR(30),
    valor_actual INTEGER,
    valor_limite INTEGER,
    porcentaje_uso NUMERIC(5,2),
    estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'resuelta', 'ignorada')),
    fecha_alerta TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fecha_resolucion TIMESTAMP WITH TIME ZONE,
    mensaje TEXT,
    datos_adicionales JSONB,
    nivel_urgencia VARCHAR(20),
    FOREIGN KEY (id_restaurante) REFERENCES restaurantes(id_restaurante) ON DELETE CASCADE,
    FOREIGN KEY (id_plan) REFERENCES planes(id_plan)
);

-- Auditoría de cambios de planes
CREATE TABLE IF NOT EXISTS auditoria_planes (
    id_auditoria SERIAL PRIMARY KEY,
    id_restaurante INTEGER NOT NULL,
    id_plan_anterior INTEGER,
    id_plan_nuevo INTEGER,
    tipo_cambio VARCHAR(20) CHECK (tipo_cambio IN ('upgrade', 'downgrade', 'renovacion', 'cancelacion')),
    motivo TEXT,
    id_usuario_cambio INTEGER,
    nombre_usuario VARCHAR(150),
    fecha_cambio TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fecha_efectiva DATE,
    datos_adicionales JSONB,
    FOREIGN KEY (id_restaurante) REFERENCES restaurantes(id_restaurante) ON DELETE CASCADE,
    FOREIGN KEY (id_plan_anterior) REFERENCES planes(id_plan),
    FOREIGN KEY (id_plan_nuevo) REFERENCES planes(id_plan)
);

-- Pagos de restaurantes
CREATE TABLE IF NOT EXISTS pagos_restaurantes (
    id SERIAL PRIMARY KEY,
    id_restaurante INTEGER NOT NULL,
    monto NUMERIC(10,2) NOT NULL,
    fecha_pago TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metodo_pago VARCHAR(50),
    observaciones TEXT,
    registrado_por INTEGER,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (id_restaurante) REFERENCES restaurantes(id_restaurante) ON DELETE CASCADE
);

-- =====================================================
-- 4. USUARIOS DEL SISTEMA POS
-- =====================================================

-- Vendedores/Usuarios del POS
CREATE TABLE IF NOT EXISTS vendedores (
    id_vendedor SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(100),
    password_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(20) NOT NULL CHECK (rol IN ('admin', 'cajero', 'mesero', 'cocinero', 'gerente', 'contador', 'super_admin')),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    id_sucursal INTEGER,
    id_restaurante INTEGER NOT NULL,
    rol_admin_id INTEGER,
    FOREIGN KEY (id_sucursal) REFERENCES sucursales(id_sucursal) ON DELETE SET NULL,
    FOREIGN KEY (id_restaurante) REFERENCES restaurantes(id_restaurante) ON DELETE CASCADE,
    FOREIGN KEY (rol_admin_id) REFERENCES roles_admin(id_rol) ON DELETE SET NULL
);

-- =====================================================
-- 5. SISTEMA POS - PRODUCTOS Y CATEGORÍAS
-- =====================================================

-- Categorías de productos
CREATE TABLE IF NOT EXISTS categorias (
    id_categoria SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    id_restaurante INTEGER NOT NULL,
    FOREIGN KEY (id_restaurante) REFERENCES restaurantes(id_restaurante) ON DELETE CASCADE
);

-- Productos del menú
CREATE TABLE IF NOT EXISTS productos (
    id_producto SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    precio NUMERIC(10,2) NOT NULL,
    id_categoria INTEGER,
    stock_actual INTEGER DEFAULT 0,
    activo BOOLEAN DEFAULT true,
    imagen_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    id_restaurante INTEGER NOT NULL,
    FOREIGN KEY (id_categoria) REFERENCES categorias(id_categoria) ON DELETE SET NULL,
    FOREIGN KEY (id_restaurante) REFERENCES restaurantes(id_restaurante) ON DELETE CASCADE
);

-- Modificadores de productos (extras, ingredientes)
CREATE TABLE IF NOT EXISTS productos_modificadores (
    id_modificador SERIAL PRIMARY KEY,
    id_producto INTEGER NOT NULL,
    nombre_modificador VARCHAR(100) NOT NULL,
    precio_extra NUMERIC(10,2) DEFAULT 0,
    tipo_modificador VARCHAR(50),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (id_producto) REFERENCES productos(id_producto) ON DELETE CASCADE
);

-- Stock por sucursal
CREATE TABLE IF NOT EXISTS stock_sucursal (
    id_stock_sucursal SERIAL PRIMARY KEY,
    id_producto INTEGER NOT NULL,
    id_sucursal INTEGER NOT NULL,
    stock_actual INTEGER DEFAULT 0,
    stock_minimo INTEGER DEFAULT 0,
    stock_maximo INTEGER,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(id_producto, id_sucursal),
    FOREIGN KEY (id_producto) REFERENCES productos(id_producto) ON DELETE CASCADE,
    FOREIGN KEY (id_sucursal) REFERENCES sucursales(id_sucursal) ON DELETE CASCADE
);

-- =====================================================
-- 6. SISTEMA POS - MESAS Y GRUPOS
-- =====================================================

-- Mesas del restaurante
CREATE TABLE IF NOT EXISTS mesas (
    id_mesa SERIAL PRIMARY KEY,
    numero INTEGER NOT NULL,
    id_sucursal INTEGER NOT NULL,
    capacidad INTEGER,
    estado VARCHAR(20) DEFAULT 'libre' CHECK (estado IN ('libre', 'ocupada', 'reservada')),
    id_venta_actual INTEGER,
    hora_apertura TIMESTAMP WITH TIME ZONE,
    hora_cierre TIMESTAMP WITH TIME ZONE,
    total_acumulado NUMERIC(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    id_restaurante INTEGER NOT NULL,
    id_mesero_actual INTEGER,
    id_grupo_mesa INTEGER,
    UNIQUE(numero, id_sucursal, id_restaurante),
    FOREIGN KEY (id_sucursal) REFERENCES sucursales(id_sucursal) ON DELETE CASCADE,
    FOREIGN KEY (id_restaurante) REFERENCES restaurantes(id_restaurante) ON DELETE CASCADE,
    FOREIGN KEY (id_mesero_actual) REFERENCES vendedores(id_vendedor) ON DELETE SET NULL
);

-- Grupos de mesas (unión de varias mesas)
CREATE TABLE IF NOT EXISTS grupos_mesas (
    id_grupo_mesa SERIAL PRIMARY KEY,
    id_restaurante INTEGER NOT NULL,
    id_sucursal INTEGER NOT NULL,
    id_venta_principal INTEGER,
    estado VARCHAR(20) DEFAULT 'activo' CHECK (estado IN ('activo', 'cerrado')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    id_mesero INTEGER,
    FOREIGN KEY (id_restaurante) REFERENCES restaurantes(id_restaurante) ON DELETE CASCADE,
    FOREIGN KEY (id_sucursal) REFERENCES sucursales(id_sucursal) ON DELETE CASCADE,
    FOREIGN KEY (id_mesero) REFERENCES vendedores(id_vendedor) ON DELETE SET NULL
);

-- Mesas pertenecientes a un grupo
CREATE TABLE IF NOT EXISTS mesas_en_grupo (
    id_mesa_en_grupo SERIAL PRIMARY KEY,
    id_grupo_mesa INTEGER NOT NULL,
    id_mesa INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (id_grupo_mesa) REFERENCES grupos_mesas(id_grupo_mesa) ON DELETE CASCADE,
    FOREIGN KEY (id_mesa) REFERENCES mesas(id_mesa) ON DELETE CASCADE
);

-- Prefacturas (precuentas por mesa)
CREATE TABLE IF NOT EXISTS prefacturas (
    id_prefactura SERIAL PRIMARY KEY,
    id_mesa INTEGER,
    id_venta_principal INTEGER,
    total_acumulado NUMERIC(10,2) DEFAULT 0,
    estado VARCHAR(20) DEFAULT 'abierta' CHECK (estado IN ('abierta', 'cerrada', 'cancelada')),
    fecha_apertura TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fecha_cierre TIMESTAMP WITH TIME ZONE,
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    id_restaurante INTEGER NOT NULL,
    FOREIGN KEY (id_mesa) REFERENCES mesas(id_mesa) ON DELETE SET NULL,
    FOREIGN KEY (id_restaurante) REFERENCES restaurantes(id_restaurante) ON DELETE CASCADE
);

-- =====================================================
-- 7. SISTEMA POS - VENTAS
-- =====================================================

-- Métodos de pago globales
CREATE TABLE IF NOT EXISTS metodos_pago (
    id_pago SERIAL PRIMARY KEY,
    descripcion VARCHAR(50) UNIQUE NOT NULL,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ventas/Transacciones
CREATE TABLE IF NOT EXISTS ventas (
    id_venta SERIAL PRIMARY KEY,
    fecha TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    id_vendedor INTEGER NOT NULL,
    id_pago INTEGER,
    id_sucursal INTEGER NOT NULL,
    tipo_servicio VARCHAR(20) CHECK (tipo_servicio IN ('mesa', 'llevar', 'delivery', 'pickup')),
    total NUMERIC(10,2) NOT NULL,
    mesa_numero INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'completada', 'cancelada', 'en_preparacion', 'lista', 'entregada')),
    id_restaurante INTEGER NOT NULL,
    id_mesa INTEGER,
    tipo_pago VARCHAR(50),
    id_pago_final INTEGER,
    fecha_pago_final TIMESTAMP WITH TIME ZONE,
    estado_pago VARCHAR(20) DEFAULT 'pendiente' CHECK (estado_pago IN ('pendiente', 'pagado', 'cancelado', 'diferido')),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (id_vendedor) REFERENCES vendedores(id_vendedor) ON DELETE RESTRICT,
    FOREIGN KEY (id_pago) REFERENCES metodos_pago(id_pago) ON DELETE SET NULL,
    FOREIGN KEY (id_sucursal) REFERENCES sucursales(id_sucursal) ON DELETE RESTRICT,
    FOREIGN KEY (id_restaurante) REFERENCES restaurantes(id_restaurante) ON DELETE CASCADE,
    FOREIGN KEY (id_mesa) REFERENCES mesas(id_mesa) ON DELETE SET NULL,
    FOREIGN KEY (id_pago_final) REFERENCES metodos_pago(id_pago) ON DELETE SET NULL
);

-- Detalle de ventas (ítems vendidos)
CREATE TABLE IF NOT EXISTS detalle_ventas (
    id_detalle SERIAL PRIMARY KEY,
    id_venta INTEGER NOT NULL,
    id_producto INTEGER NOT NULL,
    cantidad INTEGER NOT NULL,
    precio_unitario NUMERIC(10,2) NOT NULL,
    subtotal NUMERIC(10,2) NOT NULL,
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    id_restaurante INTEGER NOT NULL,
    FOREIGN KEY (id_venta) REFERENCES ventas(id_venta) ON DELETE CASCADE,
    FOREIGN KEY (id_producto) REFERENCES productos(id_producto) ON DELETE RESTRICT,
    FOREIGN KEY (id_restaurante) REFERENCES restaurantes(id_restaurante) ON DELETE CASCADE
);

-- Modificadores aplicados en detalle de venta
CREATE TABLE IF NOT EXISTS detalle_ventas_modificadores (
    id_detalle_venta INTEGER NOT NULL,
    id_modificador INTEGER NOT NULL,
    precio_aplicado NUMERIC(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (id_detalle_venta, id_modificador),
    FOREIGN KEY (id_detalle_venta) REFERENCES detalle_ventas(id_detalle) ON DELETE CASCADE,
    FOREIGN KEY (id_modificador) REFERENCES productos_modificadores(id_modificador) ON DELETE CASCADE
);

-- Pagos diferidos (cuentas por cobrar)
CREATE TABLE IF NOT EXISTS pagos_diferidos (
    id_pago_diferido SERIAL PRIMARY KEY,
    id_venta INTEGER NOT NULL,
    id_mesa INTEGER,
    total_pendiente NUMERIC(10,2) NOT NULL,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fecha_vencimiento TIMESTAMP WITH TIME ZONE,
    estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'pagado_parcial', 'pagado_total', 'vencido', 'cancelado')),
    observaciones TEXT,
    id_restaurante INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (id_venta) REFERENCES ventas(id_venta) ON DELETE CASCADE,
    FOREIGN KEY (id_mesa) REFERENCES mesas(id_mesa) ON DELETE SET NULL,
    FOREIGN KEY (id_restaurante) REFERENCES restaurantes(id_restaurante) ON DELETE CASCADE
);

-- Historial de pagos diferidos
CREATE TABLE IF NOT EXISTS historial_pagos_diferidos (
    id_historial SERIAL PRIMARY KEY,
    id_pago_diferido INTEGER NOT NULL,
    id_venta INTEGER,
    id_pago_final INTEGER,
    monto_pagado NUMERIC(10,2) NOT NULL,
    fecha_pago TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    id_vendedor INTEGER,
    observaciones TEXT,
    id_restaurante INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    procesado_por INTEGER,
    FOREIGN KEY (id_pago_diferido) REFERENCES pagos_diferidos(id_pago_diferido) ON DELETE CASCADE,
    FOREIGN KEY (id_venta) REFERENCES ventas(id_venta) ON DELETE SET NULL,
    FOREIGN KEY (id_pago_final) REFERENCES metodos_pago(id_pago) ON DELETE SET NULL,
    FOREIGN KEY (id_vendedor) REFERENCES vendedores(id_vendedor) ON DELETE SET NULL,
    FOREIGN KEY (id_restaurante) REFERENCES restaurantes(id_restaurante) ON DELETE CASCADE,
    FOREIGN KEY (procesado_por) REFERENCES vendedores(id_vendedor) ON DELETE SET NULL
);

-- Facturas fiscales
CREATE TABLE IF NOT EXISTS facturas (
    id_factura SERIAL PRIMARY KEY,
    numero VARCHAR(50) UNIQUE NOT NULL,
    nit_cliente VARCHAR(20),
    razon_social VARCHAR(200),
    total NUMERIC(10,2) NOT NULL,
    fecha TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    id_venta INTEGER,
    FOREIGN KEY (id_venta) REFERENCES ventas(id_venta) ON DELETE SET NULL
);

-- =====================================================
-- 8. INVENTARIO AVANZADO
-- =====================================================

-- Categorías de almacén
CREATE TABLE IF NOT EXISTS categorias_almacen (
    id_categoria_almacen SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    tipo_almacen VARCHAR(50) NOT NULL,
    condiciones_especiales TEXT,
    rotacion_recomendada VARCHAR(50),
    id_restaurante INTEGER NOT NULL,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (id_restaurante) REFERENCES restaurantes(id_restaurante) ON DELETE CASCADE
);

-- Lotes de inventario
CREATE TABLE IF NOT EXISTS inventario_lotes (
    id_lote SERIAL PRIMARY KEY,
    id_producto INTEGER NOT NULL,
    numero_lote VARCHAR(50),
    cantidad_inicial NUMERIC(10,2),
    cantidad_actual NUMERIC(10,2),
    fecha_fabricacion DATE,
    fecha_caducidad DATE,
    precio_compra NUMERIC(10,2),
    activo BOOLEAN DEFAULT true,
    id_restaurante INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    id_categoria_almacen INTEGER,
    ubicacion_especifica VARCHAR(100),
    proveedor VARCHAR(150),
    certificacion_organica BOOLEAN DEFAULT false,
    id_sucursal INTEGER,
    FOREIGN KEY (id_producto) REFERENCES productos(id_producto) ON DELETE CASCADE,
    FOREIGN KEY (id_restaurante) REFERENCES restaurantes(id_restaurante) ON DELETE CASCADE,
    FOREIGN KEY (id_categoria_almacen) REFERENCES categorias_almacen(id_categoria_almacen) ON DELETE SET NULL,
    FOREIGN KEY (id_sucursal) REFERENCES sucursales(id_sucursal) ON DELETE SET NULL
);

-- Movimientos de inventario
CREATE TABLE IF NOT EXISTS movimientos_inventario (
    id_movimiento SERIAL PRIMARY KEY,
    id_producto INTEGER NOT NULL,
    tipo_movimiento VARCHAR(50) NOT NULL,
    cantidad INTEGER NOT NULL,
    stock_anterior INTEGER,
    stock_actual INTEGER,
    fecha_movimiento TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    id_vendedor INTEGER,
    id_restaurante INTEGER NOT NULL,
    id_lote INTEGER,
    id_categoria_almacen INTEGER,
    motivo TEXT,
    id_sucursal INTEGER,
    observaciones TEXT,
    FOREIGN KEY (id_producto) REFERENCES productos(id_producto) ON DELETE CASCADE,
    FOREIGN KEY (id_vendedor) REFERENCES vendedores(id_vendedor) ON DELETE SET NULL,
    FOREIGN KEY (id_restaurante) REFERENCES restaurantes(id_restaurante) ON DELETE CASCADE,
    FOREIGN KEY (id_lote) REFERENCES inventario_lotes(id_lote) ON DELETE SET NULL,
    FOREIGN KEY (id_categoria_almacen) REFERENCES categorias_almacen(id_categoria_almacen) ON DELETE SET NULL,
    FOREIGN KEY (id_sucursal) REFERENCES sucursales(id_sucursal) ON DELETE SET NULL
);

-- Alertas de inventario
CREATE TABLE IF NOT EXISTS alertas_inventario (
    id_alerta SERIAL PRIMARY KEY,
    id_producto INTEGER NOT NULL,
    id_lote INTEGER,
    tipo_alerta VARCHAR(50) NOT NULL,
    mensaje TEXT NOT NULL,
    nivel_urgencia VARCHAR(20) NOT NULL CHECK (nivel_urgencia IN ('baja', 'media', 'alta', 'critica')),
    resuelta BOOLEAN DEFAULT false,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fecha_resolucion TIMESTAMP WITH TIME ZONE,
    id_restaurante INTEGER NOT NULL,
    FOREIGN KEY (id_producto) REFERENCES productos(id_producto) ON DELETE CASCADE,
    FOREIGN KEY (id_lote) REFERENCES inventario_lotes(id_lote) ON DELETE CASCADE,
    FOREIGN KEY (id_restaurante) REFERENCES restaurantes(id_restaurante) ON DELETE CASCADE
);

-- Transferencias entre almacenes
CREATE TABLE IF NOT EXISTS transferencias_almacen (
    id_transferencia SERIAL PRIMARY KEY,
    id_producto INTEGER NOT NULL,
    id_lote INTEGER,
    cantidad_transferida NUMERIC(10,2) NOT NULL,
    almacen_origen INTEGER NOT NULL,
    almacen_destino INTEGER NOT NULL,
    motivo VARCHAR(200),
    id_responsable INTEGER,
    fecha_transferencia TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_transito', 'completada', 'cancelada')),
    id_restaurante INTEGER NOT NULL,
    FOREIGN KEY (id_producto) REFERENCES productos(id_producto) ON DELETE CASCADE,
    FOREIGN KEY (id_lote) REFERENCES inventario_lotes(id_lote) ON DELETE SET NULL,
    FOREIGN KEY (almacen_origen) REFERENCES categorias_almacen(id_categoria_almacen),
    FOREIGN KEY (almacen_destino) REFERENCES categorias_almacen(id_categoria_almacen),
    FOREIGN KEY (id_responsable) REFERENCES vendedores(id_vendedor) ON DELETE SET NULL,
    FOREIGN KEY (id_restaurante) REFERENCES restaurantes(id_restaurante) ON DELETE CASCADE
);

-- =====================================================
-- 9. PROMOCIONES
-- =====================================================

-- Promociones y descuentos
CREATE TABLE IF NOT EXISTS promociones (
    id_promocion SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    tipo VARCHAR(20) CHECK (tipo IN ('porcentaje', 'monto_fijo', '2x1', '3x2')),
    valor NUMERIC(10,2),
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    id_producto INTEGER,
    creada_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    activa BOOLEAN DEFAULT true,
    id_restaurante INTEGER NOT NULL,
    FOREIGN KEY (id_producto) REFERENCES productos(id_producto) ON DELETE CASCADE,
    FOREIGN KEY (id_restaurante) REFERENCES restaurantes(id_restaurante) ON DELETE CASCADE
);

-- Asignación de promociones por sucursal
CREATE TABLE IF NOT EXISTS promociones_sucursales (
    id_relacion SERIAL PRIMARY KEY,
    id_promocion INTEGER NOT NULL,
    id_sucursal INTEGER NOT NULL,
    aplicada_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (id_promocion) REFERENCES promociones(id_promocion) ON DELETE CASCADE,
    FOREIGN KEY (id_sucursal) REFERENCES sucursales(id_sucursal) ON DELETE CASCADE
);

-- =====================================================
-- 10. RESERVAS
-- =====================================================

-- Clientes
CREATE TABLE IF NOT EXISTS clientes (
    id_cliente SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    telefono VARCHAR(20),
    email VARCHAR(100),
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reservas de mesas
CREATE TABLE IF NOT EXISTS reservas (
    id_reserva SERIAL PRIMARY KEY,
    id_restaurante INTEGER NOT NULL,
    id_sucursal INTEGER NOT NULL,
    id_mesa INTEGER,
    id_cliente INTEGER,
    nombre_cliente VARCHAR(150),
    telefono_cliente VARCHAR(20),
    email_cliente VARCHAR(100),
    fecha_hora_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
    fecha_hora_fin TIMESTAMP WITH TIME ZONE NOT NULL,
    numero_personas INTEGER NOT NULL,
    estado VARCHAR(20) DEFAULT 'CONFIRMADA' CHECK (estado IN ('PENDIENTE', 'CONFIRMADA', 'CANCELADA', 'COMPLETADA')),
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    registrado_por INTEGER,
    FOREIGN KEY (id_restaurante) REFERENCES restaurantes(id_restaurante) ON DELETE CASCADE,
    FOREIGN KEY (id_sucursal) REFERENCES sucursales(id_sucursal) ON DELETE CASCADE,
    FOREIGN KEY (id_mesa) REFERENCES mesas(id_mesa) ON DELETE SET NULL,
    FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente) ON DELETE SET NULL,
    FOREIGN KEY (registrado_por) REFERENCES vendedores(id_vendedor) ON DELETE SET NULL
);

-- =====================================================
-- 11. EGRESOS Y CONTABILIDAD
-- =====================================================

-- Categorías de egresos
CREATE TABLE IF NOT EXISTS categorias_egresos (
    id_categoria_egreso SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    color VARCHAR(20),
    icono VARCHAR(50),
    activo BOOLEAN DEFAULT true,
    id_restaurante INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (id_restaurante) REFERENCES restaurantes(id_restaurante) ON DELETE CASCADE
);

-- Egresos (gastos)
CREATE TABLE IF NOT EXISTS egresos (
    id_egreso SERIAL PRIMARY KEY,
    concepto VARCHAR(200) NOT NULL,
    descripcion TEXT,
    monto NUMERIC(12,2) NOT NULL,
    fecha_egreso DATE NOT NULL,
    id_categoria_egreso INTEGER,
    metodo_pago VARCHAR(50),
    proveedor_nombre VARCHAR(150),
    proveedor_documento VARCHAR(50),
    proveedor_telefono VARCHAR(20),
    proveedor_email VARCHAR(100),
    numero_factura VARCHAR(50),
    numero_recibo VARCHAR(50),
    numero_comprobante VARCHAR(50),
    estado VARCHAR(20) DEFAULT 'registrado' CHECK (estado IN ('registrado', 'pendiente', 'aprobado', 'rechazado', 'pagado')),
    requiere_aprobacion BOOLEAN DEFAULT false,
    aprobado_por INTEGER,
    fecha_aprobacion TIMESTAMP WITH TIME ZONE,
    comentario_aprobacion TEXT,
    es_deducible BOOLEAN DEFAULT false,
    numero_autorizacion_fiscal VARCHAR(50),
    codigo_control VARCHAR(50),
    es_recurrente BOOLEAN DEFAULT false,
    frecuencia_recurrencia VARCHAR(20) CHECK (frecuencia_recurrencia IS NULL OR frecuencia_recurrencia IN ('diaria', 'semanal', 'quincenal', 'mensual', 'bimensual', 'trimestral', 'semestral', 'anual')),
    proxima_fecha_recurrencia DATE,
    archivos_adjuntos JSONB,
    registrado_por INTEGER,
    id_sucursal INTEGER,
    id_restaurante INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (id_categoria_egreso) REFERENCES categorias_egresos(id_categoria_egreso) ON DELETE SET NULL,
    FOREIGN KEY (aprobado_por) REFERENCES vendedores(id_vendedor) ON DELETE SET NULL,
    FOREIGN KEY (registrado_por) REFERENCES vendedores(id_vendedor) ON DELETE SET NULL,
    FOREIGN KEY (id_sucursal) REFERENCES sucursales(id_sucursal) ON DELETE SET NULL,
    FOREIGN KEY (id_restaurante) REFERENCES restaurantes(id_restaurante) ON DELETE CASCADE
);

-- Archivos adjuntos de egresos
CREATE TABLE IF NOT EXISTS archivos_egresos (
    id_archivo SERIAL PRIMARY KEY,
    id_egreso INTEGER NOT NULL,
    nombre_archivo VARCHAR(255) NOT NULL,
    ruta_archivo VARCHAR(500) NOT NULL,
    tipo_archivo VARCHAR(50),
    tamaño_archivo INTEGER,
    subido_por INTEGER,
    fecha_subida TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (id_egreso) REFERENCES egresos(id_egreso) ON DELETE CASCADE,
    FOREIGN KEY (subido_por) REFERENCES vendedores(id_vendedor) ON DELETE SET NULL
);

-- Flujo de aprobaciones de egresos
CREATE TABLE IF NOT EXISTS flujo_aprobaciones_egresos (
    id_flujo SERIAL PRIMARY KEY,
    id_egreso INTEGER NOT NULL,
    id_vendedor INTEGER NOT NULL,
    accion VARCHAR(20) CHECK (accion IN ('aprobar', 'rechazar', 'solicitar_revision')),
    comentario TEXT,
    fecha_accion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (id_egreso) REFERENCES egresos(id_egreso) ON DELETE CASCADE,
    FOREIGN KEY (id_vendedor) REFERENCES vendedores(id_vendedor) ON DELETE CASCADE
);

-- Presupuestos de egresos
CREATE TABLE IF NOT EXISTS presupuestos_egresos (
    id_presupuesto SERIAL PRIMARY KEY,
    anio INTEGER NOT NULL,
    mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
    id_categoria_egreso INTEGER,
    monto_presupuestado NUMERIC(12,2) NOT NULL,
    monto_gastado NUMERIC(12,2) DEFAULT 0,
    activo BOOLEAN DEFAULT true,
    id_restaurante INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(anio, mes, id_categoria_egreso, id_restaurante),
    FOREIGN KEY (id_categoria_egreso) REFERENCES categorias_egresos(id_categoria_egreso) ON DELETE CASCADE,
    FOREIGN KEY (id_restaurante) REFERENCES restaurantes(id_restaurante) ON DELETE CASCADE
);

-- =====================================================
-- 12. ARQUEOS DE CAJA
-- =====================================================

CREATE TABLE IF NOT EXISTS arqueos_caja (
    id_arqueo SERIAL PRIMARY KEY,
    id_restaurante INTEGER NOT NULL,
    id_sucursal INTEGER,
    id_vendedor INTEGER,
    monto_inicial NUMERIC(12,2) NOT NULL,
    fecha_apertura TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    monto_final NUMERIC(12,2),
    fecha_cierre TIMESTAMP WITH TIME ZONE,
    diferencia NUMERIC(12,2),
    estado VARCHAR(20) NOT NULL DEFAULT 'abierto' CHECK (estado IN ('abierto', 'cerrado')),
    observaciones TEXT,
    FOREIGN KEY (id_restaurante) REFERENCES restaurantes(id_restaurante) ON DELETE CASCADE,
    FOREIGN KEY (id_sucursal) REFERENCES sucursales(id_sucursal) ON DELETE SET NULL,
    FOREIGN KEY (id_vendedor) REFERENCES vendedores(id_vendedor) ON DELETE SET NULL
);

-- =====================================================
-- 13. SOPORTE
-- =====================================================

CREATE TABLE IF NOT EXISTS soporte_tickets (
    id_ticket SERIAL PRIMARY KEY,
    id_vendedor INTEGER NOT NULL,
    id_restaurante INTEGER NOT NULL,
    asunto TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_proceso', 'resuelto', 'cerrado')),
    fecha_creacion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    fecha_resuelto TIMESTAMP WITH TIME ZONE,
    respuesta TEXT,
    FOREIGN KEY (id_vendedor) REFERENCES vendedores(id_vendedor) ON DELETE CASCADE,
    FOREIGN KEY (id_restaurante) REFERENCES restaurantes(id_restaurante) ON DELETE CASCADE
);

-- =====================================================
-- 14. AUDITORÍA Y TRAZABILIDAD
-- =====================================================

-- Auditoría del admin backend
CREATE TABLE IF NOT EXISTS auditoria_admin (
    id_auditoria SERIAL PRIMARY KEY,
    id_usuario INTEGER,
    accion VARCHAR(100),
    tabla_afectada VARCHAR(100),
    id_registro INTEGER,
    datos_anteriores JSONB,
    datos_nuevos JSONB,
    fecha_accion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (id_usuario) REFERENCES admin_users(id) ON DELETE SET NULL
);

-- Auditoría del POS
CREATE TABLE IF NOT EXISTS auditoria_pos (
    id_auditoria BIGSERIAL PRIMARY KEY,
    id_vendedor INTEGER,
    accion VARCHAR(100),
    tabla_afectada VARCHAR(100),
    id_registro BIGINT,
    datos_anteriores JSONB,
    datos_nuevos JSONB,
    fecha_accion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    id_restaurante INTEGER,
    ip_origen INET,
    user_agent VARCHAR(500),
    descripcion TEXT,
    exito BOOLEAN DEFAULT true,
    error_msg TEXT,
    FOREIGN KEY (id_vendedor) REFERENCES vendedores(id_vendedor) ON DELETE SET NULL,
    FOREIGN KEY (id_restaurante) REFERENCES restaurantes(id_restaurante) ON DELETE CASCADE
);

-- =====================================================
-- 15. SISTEMA DE INTEGRIDAD
-- =====================================================

CREATE TABLE IF NOT EXISTS integrity_logs (
    id SERIAL PRIMARY KEY,
    check_name VARCHAR(100) NOT NULL,
    status VARCHAR(20) CHECK (status IN ('pass', 'warning', 'error')),
    message TEXT,
    details_count INTEGER,
    execution_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 16. ANALYTICS Y REPORTES
-- =====================================================

-- Dimensión de tiempo para analytics
CREATE TABLE IF NOT EXISTS dim_tiempo (
    id_tiempo SERIAL PRIMARY KEY,
    fecha DATE UNIQUE NOT NULL,
    dia INTEGER,
    mes INTEGER,
    anio INTEGER,
    nombre_mes VARCHAR(20),
    nombre_dia VARCHAR(20),
    es_fin_de_semana BOOLEAN,
    turno VARCHAR(20)
);

-- Tareas del sistema
CREATE TABLE IF NOT EXISTS system_tasks (
    id SERIAL PRIMARY KEY,
    task_name VARCHAR(100) UNIQUE NOT NULL,
    last_run TIMESTAMP WITH TIME ZONE,
    next_run TIMESTAMP WITH TIME ZONE,
    interval_minutes INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Migraciones aplicadas
CREATE TABLE IF NOT EXISTS migrations (
    id SERIAL PRIMARY KEY,
    migration_name VARCHAR(255) UNIQUE NOT NULL,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    description TEXT,
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'rolled_back'))
);

-- =====================================================
-- 17. ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

-- Índices en tablas principales
CREATE INDEX IF NOT EXISTS idx_ventas_restaurante_fecha ON ventas(id_restaurante, fecha);
CREATE INDEX IF NOT EXISTS idx_ventas_sucursal ON ventas(id_sucursal);
CREATE INDEX IF NOT EXISTS idx_ventas_vendedor ON ventas(id_vendedor);
CREATE INDEX IF NOT EXISTS idx_ventas_estado ON ventas(estado);
CREATE INDEX IF NOT EXISTS idx_ventas_estado_pago ON ventas(estado_pago);

CREATE INDEX IF NOT EXISTS idx_detalle_ventas_venta ON detalle_ventas(id_venta);
CREATE INDEX IF NOT EXISTS idx_detalle_ventas_producto ON detalle_ventas(id_producto);
CREATE INDEX IF NOT EXISTS idx_detalle_ventas_restaurante ON detalle_ventas(id_restaurante);

CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(id_categoria);
CREATE INDEX IF NOT EXISTS idx_productos_restaurante ON productos(id_restaurante);
CREATE INDEX IF NOT EXISTS idx_productos_activo ON productos(activo);

CREATE INDEX IF NOT EXISTS idx_mesas_sucursal ON mesas(id_sucursal);
CREATE INDEX IF NOT EXISTS idx_mesas_restaurante ON mesas(id_restaurante);
CREATE INDEX IF NOT EXISTS idx_mesas_estado ON mesas(estado);

CREATE INDEX IF NOT EXISTS idx_vendedores_restaurante ON vendedores(id_restaurante);
CREATE INDEX IF NOT EXISTS idx_vendedores_sucursal ON vendedores(id_sucursal);
CREATE INDEX IF NOT EXISTS idx_vendedores_rol ON vendedores(rol);

CREATE INDEX IF NOT EXISTS idx_suscripciones_restaurante ON suscripciones(id_restaurante);
CREATE INDEX IF NOT EXISTS idx_suscripciones_plan ON suscripciones(id_plan);
CREATE INDEX IF NOT EXISTS idx_suscripciones_estado ON suscripciones(estado);

CREATE INDEX IF NOT EXISTS idx_contadores_uso_restaurante ON contadores_uso(id_restaurante);
CREATE INDEX IF NOT EXISTS idx_contadores_uso_recurso ON contadores_uso(recurso);

CREATE INDEX IF NOT EXISTS idx_alertas_limites_restaurante ON alertas_limites(id_restaurante);
CREATE INDEX IF NOT EXISTS idx_alertas_limites_estado ON alertas_limites(estado);

CREATE INDEX IF NOT EXISTS idx_egresos_restaurante ON egresos(id_restaurante);
CREATE INDEX IF NOT EXISTS idx_egresos_categoria ON egresos(id_categoria_egreso);
CREATE INDEX IF NOT EXISTS idx_egresos_estado ON egresos(estado);
CREATE INDEX IF NOT EXISTS idx_egresos_fecha ON egresos(fecha_egreso);

CREATE INDEX IF NOT EXISTS idx_inventario_lotes_producto ON inventario_lotes(id_producto);
CREATE INDEX IF NOT EXISTS idx_inventario_lotes_restaurante ON inventario_lotes(id_restaurante);
CREATE INDEX IF NOT EXISTS idx_inventario_lotes_caducidad ON inventario_lotes(fecha_caducidad);

CREATE INDEX IF NOT EXISTS idx_movimientos_inventario_producto ON movimientos_inventario(id_producto);
CREATE INDEX IF NOT EXISTS idx_movimientos_inventario_restaurante ON movimientos_inventario(id_restaurante);
CREATE INDEX IF NOT EXISTS idx_movimientos_inventario_fecha ON movimientos_inventario(fecha_movimiento);

CREATE INDEX IF NOT EXISTS idx_reservas_restaurante ON reservas(id_restaurante);
CREATE INDEX IF NOT EXISTS idx_reservas_mesa ON reservas(id_mesa);
CREATE INDEX IF NOT EXISTS idx_reservas_estado ON reservas(estado);
CREATE INDEX IF NOT EXISTS idx_reservas_fecha_inicio ON reservas(fecha_hora_inicio);

CREATE INDEX IF NOT EXISTS idx_arqueos_rest_suc_estado ON arqueos_caja(id_restaurante, id_sucursal, estado);

CREATE INDEX IF NOT EXISTS idx_soporte_tickets_vendedor_fecha ON soporte_tickets(id_vendedor, fecha_creacion);
CREATE INDEX IF NOT EXISTS idx_soporte_tickets_restaurante_fecha ON soporte_tickets(id_restaurante, fecha_creacion);

CREATE INDEX IF NOT EXISTS idx_auditoria_pos_restaurante ON auditoria_pos(id_restaurante);
CREATE INDEX IF NOT EXISTS idx_auditoria_pos_vendedor ON auditoria_pos(id_vendedor);
CREATE INDEX IF NOT EXISTS idx_auditoria_pos_fecha ON auditoria_pos(fecha_accion);

-- =====================================================
-- 18. VISTAS ÚTILES
-- =====================================================

-- Vista de lotes críticos
CREATE OR REPLACE VIEW vista_lotes_criticos AS
SELECT 
    il.id_lote,
    il.numero_lote,
    p.nombre AS producto_nombre,
    c.nombre AS categoria_nombre,
    il.cantidad_actual,
    il.fecha_caducidad,
    il.precio_compra,
    CASE
        WHEN il.fecha_caducidad < CURRENT_DATE THEN 'Vencido'
        WHEN il.fecha_caducidad <= CURRENT_DATE + INTERVAL '7 days' THEN 'Por vencer (7 días)'
        WHEN il.fecha_caducidad <= CURRENT_DATE + INTERVAL '30 days' THEN 'Por vencer (30 días)'
        ELSE 'Vigente'
    END AS estado_caducidad,
    CASE
        WHEN il.cantidad_actual = 0 THEN 'Sin stock'
        WHEN il.cantidad_actual < 10 THEN 'Stock bajo'
        ELSE 'Stock normal'
    END AS estado_stock,
    CASE
        WHEN il.fecha_caducidad < CURRENT_DATE 
        THEN DATE_PART('day', CURRENT_DATE - il.fecha_caducidad)::INTEGER
        ELSE NULL
    END AS dias_vencido,
    CASE
        WHEN il.fecha_caducidad >= CURRENT_DATE 
        THEN DATE_PART('day', il.fecha_caducidad - CURRENT_DATE)::INTEGER
        ELSE NULL
    END AS dias_restantes
FROM inventario_lotes il
JOIN productos p ON il.id_producto = p.id_producto
LEFT JOIN categorias c ON p.id_categoria = c.id_categoria
WHERE il.activo = true
ORDER BY il.fecha_caducidad;

-- Vista de resumen de inventario
CREATE OR REPLACE VIEW vista_resumen_inventario AS
SELECT 
    p.id_producto,
    p.nombre AS producto_nombre,
    c.nombre AS categoria_nombre,
    p.stock_actual,
    p.precio,
    COALESCE(SUM(il.cantidad_actual), 0) AS stock_en_lotes,
    COUNT(il.id_lote) AS total_lotes,
    COUNT(CASE WHEN il.fecha_caducidad < CURRENT_DATE THEN 1 END) AS lotes_vencidos,
    COUNT(CASE WHEN il.fecha_caducidad BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days' THEN 1 END) AS lotes_por_vencer,
    MIN(il.fecha_caducidad) AS proxima_caducidad,
    CASE
        WHEN p.stock_actual = 0 THEN 'Sin stock'
        WHEN p.stock_actual < 10 THEN 'Stock bajo'
        WHEN p.stock_actual < 50 THEN 'Stock medio'
        ELSE 'Stock alto'
    END AS estado_stock
FROM productos p
LEFT JOIN categorias c ON p.id_categoria = c.id_categoria
LEFT JOIN inventario_lotes il ON p.id_producto = il.id_producto AND il.activo = true
WHERE p.activo = true
GROUP BY p.id_producto, p.nombre, c.nombre, p.stock_actual, p.precio
ORDER BY p.nombre;

-- Vista de pagos diferidos
CREATE OR REPLACE VIEW vista_pagos_diferidos AS
SELECT 
    pd.*,
    v.total,
    v.tipo_servicio,
    v.estado AS estado_real,
    DATE_PART('day', CURRENT_DATE - pd.fecha_creacion::DATE)::INTEGER AS dias_pendiente
FROM pagos_diferidos pd
JOIN ventas v ON pd.id_venta = v.id_venta
WHERE pd.estado IN ('pendiente', 'pagado_parcial');

-- Vista de monitoreo de integridad
CREATE OR REPLACE VIEW v_integrity_monitoring AS
SELECT 
    'mesas' AS table_name,
    COUNT(*) AS total_records,
    COUNT(CASE WHEN estado = 'ocupada' THEN 1 END) AS active_mesas,
    COUNT(CASE WHEN estado = 'libre' THEN 1 END) AS free_mesas,
    SUM(total_acumulado) AS total_acumulado
FROM mesas;

-- =====================================================
-- FIN DE LA ESTRUCTURA
-- =====================================================

-- Comentarios informativos
COMMENT ON DATABASE current_database() IS 'Sistema SITEMM POS - Plataforma Multitenancy para Gestión de Restaurantes';
COMMENT ON TABLE restaurantes IS 'Tabla maestra de restaurantes (Tenants)';
COMMENT ON TABLE planes IS 'Definición de planes comerciales del sistema';
COMMENT ON TABLE suscripciones IS 'Suscripciones activas de restaurantes a planes';
COMMENT ON TABLE ventas IS 'Transacciones principales del POS';
COMMENT ON TABLE detalle_ventas IS 'Ítems vendidos en cada transacción';

