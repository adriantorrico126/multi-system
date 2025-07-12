categorias	id_categoria	integer
categorias	nombre	character varying
categorias	activo	boolean
categorias	created_at	timestamp without time zone
clientes	id_cliente	integer
clientes	nombre	character varying
clientes	telefono	character varying
clientes	email	character varying
clientes	fecha_registro	timestamp without time zone
detalle_ventas	id_detalle	integer
detalle_ventas	id_venta	integer
detalle_ventas	id_producto	integer
detalle_ventas	cantidad	integer
detalle_ventas	precio_unitario	numeric
detalle_ventas	subtotal	numeric
detalle_ventas	observaciones	text
detalle_ventas	created_at	timestamp without time zone
dim_tiempo	id_tiempo	integer
dim_tiempo	fecha	date
dim_tiempo	dia	integer
dim_tiempo	mes	integer
dim_tiempo	anio	integer
dim_tiempo	nombre_mes	character varying
dim_tiempo	nombre_dia	character varying
dim_tiempo	es_fin_de_semana	boolean
dim_tiempo	turno	character varying
facturas	id_factura	integer
facturas	numero	character varying
facturas	nit_cliente	character varying
facturas	razon_social	character varying
facturas	total	numeric
facturas	fecha	timestamp without time zone
facturas	id_venta	integer
mesas	id_mesa	integer
mesas	numero	integer
mesas	id_sucursal	integer
mesas	capacidad	integer
mesas	estado	character varying
mesas	id_venta_actual	integer
mesas	hora_apertura	timestamp without time zone
mesas	hora_cierre	timestamp without time zone
mesas	total_acumulado	numeric
mesas	created_at	timestamp without time zone
mesas	updated_at	timestamp without time zone
metodos_pago	id_pago	integer
metodos_pago	descripcion	character varying
metodos_pago	activo	boolean
movimientos_inventario	id_movimiento	integer
movimientos_inventario	id_producto	integer
movimientos_inventario	tipo_movimiento	character varying
movimientos_inventario	cantidad	integer
movimientos_inventario	stock_anterior	integer
movimientos_inventario	stock_actual	integer
movimientos_inventario	fecha_movimiento	timestamp with time zone
movimientos_inventario	id_vendedor	integer
prefacturas	id_prefactura	integer
prefacturas	id_mesa	integer
prefacturas	id_venta_principal	integer
prefacturas	total_acumulado	numeric
prefacturas	estado	character varying
prefacturas	fecha_apertura	timestamp without time zone
prefacturas	fecha_cierre	timestamp without time zone
prefacturas	observaciones	text
prefacturas	created_at	timestamp without time zone
productos	id_producto	integer
productos	nombre	character varying
productos	precio	numeric
productos	id_categoria	integer
productos	stock_actual	integer
productos	activo	boolean
productos	imagen_url	text
productos	created_at	timestamp without time zone
promociones	id_promocion	integer
promociones	nombre	character varying
promociones	tipo	character varying
promociones	valor	numeric
promociones	fecha_inicio	date
promociones	fecha_fin	date
promociones	id_producto	integer
sucursales	id_sucursal	integer
sucursales	nombre	character varying
sucursales	ciudad	character varying
sucursales	direccion	text
sucursales	activo	boolean
sucursales	created_at	timestamp without time zone
vendedores	id_vendedor	integer
vendedores	nombre	character varying
vendedores	username	character varying
vendedores	email	character varying
vendedores	password_hash	character varying
vendedores	rol	character varying
vendedores	activo	boolean
vendedores	created_at	timestamp without time zone
vendedores	id_sucursal	integer
ventas	id_venta	integer
ventas	fecha	timestamp without time zone
ventas	id_vendedor	integer
ventas	id_pago	integer
ventas	id_sucursal	integer
ventas	tipo_servicio	character varying
ventas	total	numeric
ventas	mesa_numero	integer
ventas	created_at	timestamp without time zone
ventas	estado	character varying

