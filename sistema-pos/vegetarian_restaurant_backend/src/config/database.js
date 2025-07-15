// vegetarian_restaurant_backend/src/config/database.js

const { Pool } = require('pg');
const envConfig = require('./envConfig');

console.log('🔧 Configurando pool de conexión con:', {
  user: envConfig.DB_USER,
  host: envConfig.DB_HOST,
  database: envConfig.DB_NAME,
  port: envConfig.DB_PORT,
  password: envConfig.DB_PASSWORD ? '[HIDDEN]' : 'undefined'
});

const pool = new Pool({
  user: envConfig.DB_USER || 'postgres',
  host: envConfig.DB_HOST || 'localhost',
  database: envConfig.DB_NAME || 'sistempos', // Cambiado a sistempos por defecto
  password: envConfig.DB_PASSWORD || 'tu_password',
  port: envConfig.DB_PORT || 5432,
  ssl: envConfig.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  // options: '-c timezone=America/Caracas', // COMENTADO PARA DESCARTAR PROBLEMAS
  max: 20, // Número máximo de clientes en el pool
  idleTimeoutMillis: 30000, // Cierra clientes inactivos después de 30 segundos
  connectionTimeoutMillis: 2000, // Tiempo máximo para adquirir un cliente (2 segundos)
});

// Agregar event listeners para debug
pool.on('connect', (client) => {
  console.log('✅ Cliente conectado a PostgreSQL');
});

pool.on('error', (err, client) => {
  console.error('❌ Error en el pool de conexión:', err.message);
});

pool.on('acquire', (client) => {
  console.log('🔗 Cliente adquirido del pool');
});

pool.on('release', (client) => {
  console.log('🔓 Cliente liberado del pool');
});

// Función para inicializar la base de datos con el esquema completo
const initDatabase = async (client) => {
  try {
    console.log('Probando query simple...');
    const res = await client.query('SELECT NOW()');
    console.log('Resultado de SELECT NOW():', res.rows[0]);

    console.log('Antes de crear tabla restaurantes');
    await client.query(`
      -- ===================================
      -- 🔹 0. Tabla de Restaurantes (Tenant)
      -- ===================================
      CREATE TABLE IF NOT EXISTS restaurantes (
          id_restaurante SERIAL PRIMARY KEY,
          nombre VARCHAR(255) NOT NULL UNIQUE,
          direccion TEXT,
          ciudad VARCHAR(100),
          telefono VARCHAR(20),
          email VARCHAR(255),
          activo BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('Después de crear tabla restaurantes');

    console.log('Antes de crear tabla categorias');
    await client.query(`
      -- ===================================
      -- 🔹 1. Categorías de productos
      -- ===================================
      CREATE TABLE IF NOT EXISTS categorias (
          id_categoria SERIAL PRIMARY KEY,
          id_restaurante INTEGER NOT NULL REFERENCES restaurantes(id_restaurante) ON DELETE CASCADE,
          nombre VARCHAR(100) NOT NULL,
          activo BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(id_restaurante, nombre)
      );
    `);
    console.log('Después de crear tabla categorias');

    console.log('Antes de crear tabla productos');
    await client.query(`
      -- ===================================
      -- �� 2. Productos
      -- ===================================
      CREATE TABLE IF NOT EXISTS productos (
          id_producto SERIAL PRIMARY KEY,
          id_restaurante INTEGER NOT NULL REFERENCES restaurantes(id_restaurante) ON DELETE CASCADE,
          nombre VARCHAR(200) NOT NULL,
          precio DECIMAL(10,2) NOT NULL CHECK (precio > 0),
          id_categoria INTEGER REFERENCES categorias(id_categoria),
          stock_actual INTEGER DEFAULT 0 CHECK (stock_actual >= 0),
          activo BOOLEAN DEFAULT true,
          imagen_url TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(id_restaurante, nombre)
      );
    `);
    console.log('Después de crear tabla productos');

    console.log('Antes de crear tabla vendedores');
    await client.query(`
      -- ===================================
      -- 🔹 3. Vendedores (usuarios)
      -- ===================================
      CREATE TABLE IF NOT EXISTS vendedores (
          id_vendedor SERIAL PRIMARY KEY,
          id_restaurante INTEGER NOT NULL REFERENCES restaurantes(id_restaurante) ON DELETE CASCADE,
          nombre VARCHAR(150) NOT NULL,
          username VARCHAR(50) NOT NULL,
          email VARCHAR(255) UNIQUE,
          password_hash VARCHAR(255),
          rol VARCHAR(20) DEFAULT 'cajero' CHECK (rol IN ('cajero', 'admin', 'cocinero', 'super_admin')),
          activo BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT NOW(),
          id_sucursal INTEGER, -- Se mantendrá para sucursales dentro del mismo restaurante
          UNIQUE(id_restaurante, username)
      );
    `);
    console.log('Después de crear tabla vendedores');

    console.log('Antes de crear tabla metodos_pago');
    await client.query(`
      -- ===================================
      -- 🔹 4. Métodos de pago
      -- ===================================
      CREATE TABLE IF NOT EXISTS metodos_pago (
          id_pago SERIAL PRIMARY KEY,
          id_restaurante INTEGER NOT NULL REFERENCES restaurantes(id_restaurante) ON DELETE CASCADE,
          descripcion VARCHAR(50) NOT NULL,
          activo BOOLEAN DEFAULT true,
          UNIQUE(id_restaurante, descripcion)
      );
    `);
    console.log('Después de crear tabla metodos_pago');

    console.log('Antes de crear tabla sucursales');
    await client.query(`
      -- ===================================
      -- 🔹 5. Sucursales
      -- ===================================
      CREATE TABLE IF NOT EXISTS sucursales (
          id_sucursal SERIAL PRIMARY KEY,
          id_restaurante INTEGER NOT NULL REFERENCES restaurantes(id_restaurante) ON DELETE CASCADE,
          nombre VARCHAR(150) NOT NULL,
          ciudad VARCHAR(100) NOT NULL,
          direccion TEXT,
          activo BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(id_restaurante, nombre)
      );
    `);
    console.log('Después de crear tabla sucursales');

    console.log('Antes de crear tabla mesas');
    await client.query(`
      -- ===================================
      -- 🔹 5.1. Gestión de Mesas
      -- ===================================
      CREATE TABLE IF NOT EXISTS mesas (
          id_mesa SERIAL PRIMARY KEY,
          id_restaurante INTEGER NOT NULL REFERENCES restaurantes(id_restaurante) ON DELETE CASCADE,
          numero INTEGER NOT NULL,
          id_sucursal INTEGER REFERENCES sucursales(id_sucursal),
          capacidad INTEGER DEFAULT 4,
          estado VARCHAR(20) DEFAULT 'libre' CHECK (estado IN ('libre', 'en_uso', 'pendiente_cobro', 'reservada', 'mantenimiento')),
          id_venta_actual INTEGER, -- No FK directa para evitar ciclos, se gestiona en la lógica
          hora_apertura TIMESTAMP,
          hora_cierre TIMESTAMP,
          total_acumulado DECIMAL(10,2) DEFAULT 0,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(id_restaurante, numero, id_sucursal)
      );
    `);
    console.log('Después de crear tabla mesas');

    console.log('Antes de crear tabla ventas');
    await client.query(`
      -- ===================================
      -- 🔹 6. Ventas
      -- ===================================
      CREATE TABLE IF NOT EXISTS ventas (
          id_venta SERIAL PRIMARY KEY,
          id_restaurante INTEGER NOT NULL REFERENCES restaurantes(id_restaurante) ON DELETE CASCADE,
          fecha TIMESTAMP DEFAULT NOW(),
          id_vendedor INTEGER REFERENCES vendedores(id_vendedor),
          id_pago INTEGER REFERENCES metodos_pago(id_pago),
          id_sucursal INTEGER REFERENCES sucursales(id_sucursal),
          tipo_servicio VARCHAR(20) DEFAULT 'Mesa' CHECK (tipo_servicio IN ('Mesa', 'Delivery', 'Para Llevar')),
          total DECIMAL(10,2) DEFAULT 0,
          mesa_numero INTEGER,
          created_at TIMESTAMP DEFAULT NOW(),
          estado VARCHAR(30) DEFAULT 'recibido' CHECK (estado IN ('recibido', 'en_preparacion', 'listo_para_servir', 'entregado', 'cancelado'))
      );
    `);
    console.log('Después de crear tabla ventas');

    console.log('Antes de crear tabla detalle_ventas');
    await client.query(`
      -- ===================================
      -- 🔹 7. Detalle de ventas
      -- ===================================
      CREATE TABLE IF NOT EXISTS detalle_ventas (
          id_detalle SERIAL PRIMARY KEY,
          id_restaurante INTEGER NOT NULL REFERENCES restaurantes(id_restaurante) ON DELETE CASCADE,
          id_venta INTEGER REFERENCES ventas(id_venta) ON DELETE CASCADE,
          id_producto INTEGER REFERENCES productos(id_producto),
          cantidad INTEGER NOT NULL CHECK (cantidad > 0),
          precio_unitario DECIMAL(10,2) NOT NULL CHECK (precio_unitario > 0),
          subtotal DECIMAL(10,2) GENERATED ALWAYS AS (cantidad * precio_unitario) STORED,
          observaciones TEXT,
          created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('Después de crear tabla detalle_ventas');

    console.log('Antes de crear tabla dim_tiempo');
    await client.query(`
      -- ===================================
      -- 🔹 8. Dimensión de tiempo (para BI)
      -- ===================================
      CREATE TABLE IF NOT EXISTS dim_tiempo (
          id_tiempo SERIAL PRIMARY KEY,
          id_restaurante INTEGER NOT NULL REFERENCES restaurantes(id_restaurante) ON DELETE CASCADE,
          fecha DATE UNIQUE NOT NULL,
          dia INTEGER NOT NULL,
          mes INTEGER NOT NULL,
          anio INTEGER NOT NULL,
          nombre_mes VARCHAR(20) NOT NULL,
          nombre_dia VARCHAR(20) NOT NULL,
          es_fin_de_semana BOOLEAN NOT NULL,
          turno VARCHAR(10) NOT NULL CHECK (turno IN ('mañana', 'tarde', 'noche')),
          UNIQUE(id_restaurante, fecha)
      );
    `);
    console.log('Después de crear tabla dim_tiempo');

    console.log('Antes de crear tabla clientes');
    await client.query(`
      -- ===================================
      -- 🔹 9. Clientes (opcional)
      -- ===================================
      CREATE TABLE IF NOT EXISTS clientes (
          id_cliente SERIAL PRIMARY KEY,
          id_restaurante INTEGER NOT NULL REFERENCES restaurantes(id_restaurante) ON DELETE CASCADE,
          nombre VARCHAR(150),
          telefono VARCHAR(20),
          email VARCHAR(100),
          fecha_registro TIMESTAMP DEFAULT NOW(),
          UNIQUE(id_restaurante, email) -- Asumiendo que el email es único por restaurante
      );
    `);
    console.log('Después de crear tabla clientes');

    console.log('Antes de crear tabla facturas');
    await client.query(`
      -- ===================================
      -- 🔹 10. Facturación (opcional)
      -- ===================================
      CREATE TABLE IF NOT EXISTS facturas (
          id_factura SERIAL PRIMARY KEY,
          id_restaurante INTEGER NOT NULL REFERENCES restaurantes(id_restaurante) ON DELETE CASCADE,
          numero VARCHAR(50) NOT NULL,
          nit_cliente VARCHAR(20),
          razon_social VARCHAR(200),
          total DECIMAL(10,2),
          fecha TIMESTAMP DEFAULT NOW(),
          id_venta INTEGER REFERENCES ventas(id_venta),
          UNIQUE(id_restaurante, numero)
      );
    `);
    console.log('Después de crear tabla facturas');

    console.log('Antes de crear tabla prefacturas');
    await client.query(`
      -- ===================================
      -- 🔹 10.1. Prefacturas (para gestión de mesas)
      -- ===================================
      CREATE TABLE IF NOT EXISTS prefacturas (
          id_prefactura SERIAL PRIMARY KEY,
          id_restaurante INTEGER NOT NULL REFERENCES restaurantes(id_restaurante) ON DELETE CASCADE,
          id_mesa INTEGER REFERENCES mesas(id_mesa),
          id_venta_principal INTEGER REFERENCES ventas(id_venta),
          total_acumulado DECIMAL(10,2) DEFAULT 0,
          estado VARCHAR(20) DEFAULT 'abierta' CHECK (estado IN ('abierta', 'cerrada', 'facturada')),
          fecha_apertura TIMESTAMP DEFAULT NOW(),
          fecha_cierre TIMESTAMP,
          observaciones TEXT,
          created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('Después de crear tabla prefacturas');

    console.log('Antes de crear tabla promociones');
    await client.query(`
      -- ===================================
      -- 🔹 11. Promociones (opcional)
      -- ===================================
      CREATE TABLE IF NOT EXISTS promociones (
          id_promocion SERIAL PRIMARY KEY,
          id_restaurante INTEGER NOT NULL REFERENCES restaurantes(id_restaurante) ON DELETE CASCADE,
          nombre VARCHAR(100),
          tipo VARCHAR(20) CHECK (tipo IN ('porcentaje', 'fijo')),
          valor DECIMAL(10,2) CHECK (valor > 0),
          fecha_inicio DATE,
          fecha_fin DATE,
          id_producto INTEGER REFERENCES productos(id_producto),
          UNIQUE(id_restaurante, nombre)
      );
    `);
    console.log('Después de crear tabla promociones');

    console.log('Antes de crear tabla movimientos_inventario');
    await client.query(`
      -- ===================================
      -- 🔹 12. Movimientos de Inventario (Añadida)
      -- ===================================
      CREATE TABLE IF NOT EXISTS movimientos_inventario (
          id_movimiento SERIAL PRIMARY KEY,
          id_restaurante INTEGER NOT NULL REFERENCES restaurantes(id_restaurante) ON DELETE CASCADE,
          id_producto INTEGER REFERENCES productos(id_producto),
          tipo_movimiento VARCHAR(50) NOT NULL,
          cantidad INTEGER NOT NULL,
          stock_anterior INTEGER,
          stock_actual INTEGER,
          fecha_movimiento TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          id_vendedor INTEGER REFERENCES vendedores(id_vendedor)
      );
    `);
    console.log('Después de crear tabla movimientos_inventario');

    console.log('Antes de crear tabla pagos_suscripcion');
    await client.query(`
      -- ===================================
      -- 🔹 13. Pagos de Suscripción (Empresa)
      -- ===================================
      CREATE TABLE IF NOT EXISTS pagos_suscripcion (
          id_pago SERIAL PRIMARY KEY,
          id_restaurante INTEGER NOT NULL REFERENCES restaurantes(id_restaurante) ON DELETE CASCADE,
          monto DECIMAL(10,2) NOT NULL,
          banco_origen VARCHAR(100) NOT NULL,
          banco_destino VARCHAR(100) NOT NULL,
          nro_operacion VARCHAR(100) NOT NULL,
          fecha_transferencia DATE NOT NULL,
          comprobante_url TEXT,
          estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aprobado', 'rechazado')),
          fecha_registro TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('Después de crear tabla pagos_suscripcion');

    // Create trigger function for updating updated_at
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    // Create trigger for mesas table
    await client.query(`
      DROP TRIGGER IF EXISTS update_mesas_updated_at ON mesas;
      CREATE TRIGGER update_mesas_updated_at 
          BEFORE UPDATE ON mesas 
          FOR EACH ROW 
          EXECUTE FUNCTION update_updated_at_column();
    `);

    // Crear índices si no existen
    // Crear índices si no existen
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_ventas_restaurante_fecha ON ventas(id_restaurante, fecha);
      CREATE INDEX IF NOT EXISTS idx_detalle_ventas_restaurante_id_venta ON detalle_ventas(id_restaurante, id_venta);
      CREATE INDEX IF NOT EXISTS idx_productos_restaurante_categoria ON productos(id_restaurante, id_categoria);
      CREATE INDEX IF NOT EXISTS idx_dim_tiempo_restaurante_fecha ON dim_tiempo(id_restaurante, fecha);
      CREATE INDEX IF NOT EXISTS idx_vendedores_restaurante ON vendedores(id_restaurante);
      CREATE INDEX IF NOT EXISTS idx_sucursales_restaurante ON sucursales(id_restaurante);
      CREATE INDEX IF NOT EXISTS idx_mesas_restaurante ON mesas(id_restaurante);
      CREATE INDEX IF NOT EXISTS idx_clientes_restaurante ON clientes(id_restaurante);
      CREATE INDEX IF NOT EXISTS idx_facturas_restaurante ON facturas(id_restaurante);
      CREATE INDEX IF NOT EXISTS idx_prefacturas_restaurante ON prefacturas(id_restaurante);
      CREATE INDEX IF NOT EXISTS idx_promociones_restaurante ON promociones(id_restaurante);
      CREATE INDEX IF NOT EXISTS idx_movimientos_inventario_restaurante ON movimientos_inventario(id_restaurante);
    `);

    // Insertar datos de ejemplo si las tablas están vacías
    // Primero, insertar un restaurante por defecto si no existe
    const restaurantesCount = await client.query('SELECT COUNT(*) FROM restaurantes');
    let defaultRestauranteId;
    if (parseInt(restaurantesCount.rows[0].count) === 0) {
      const { rows } = await client.query(`
        INSERT INTO restaurantes (nombre, direccion, ciudad, telefono, email)
        VALUES ('Restaurante Principal', 'Calle Falsa 123', 'Ciudad Ejemplo', '123456789', 'info@restaurante.com')
        RETURNING id_restaurante;
      `);
      defaultRestauranteId = rows[0].id_restaurante;
    } else {
      const { rows } = await client.query('SELECT id_restaurante FROM restaurantes LIMIT 1;');
      defaultRestauranteId = rows[0].id_restaurante;
    }

    const categoriasCount = await client.query('SELECT COUNT(*) FROM categorias WHERE id_restaurante = $1', [defaultRestauranteId]);
    if (parseInt(categoriasCount.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO categorias (id_restaurante, nombre) VALUES 
        ($1, 'Ensaladas'),
        ($1, 'Sopas'),
        ($1, 'Platos Principales'),
        ($1, 'Bebidas'),
        ($1, 'Postres'),
        ($1, 'Aperitivos')
      `, [defaultRestauranteId]);
    }

    const metodosPagoCount = await client.query('SELECT COUNT(*) FROM metodos_pago WHERE id_restaurante = $1', [defaultRestauranteId]);
    if (parseInt(metodosPagoCount.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO metodos_pago (id_restaurante, descripcion) VALUES 
        ($1, 'Efectivo'),
        ($1, 'Tarjeta de Crédito'),
        ($1, 'Tarjeta de Débito'),
        ($1, 'Transferencia'),
        ($1, 'Pago Móvil')
      `, [defaultRestauranteId]);
    }

    const sucursalesCount = await client.query('SELECT COUNT(*) FROM sucursales WHERE id_restaurante = $1', [defaultRestauranteId]);
    if (parseInt(sucursalesCount.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO sucursales (id_restaurante, nombre, ciudad, direccion) VALUES 
        ($1, 'Sucursal Centro', 'Caracas', 'Av. Principal, Centro Comercial ABC'),
        ($1, 'Sucursal Este', 'Caracas', 'Calle Comercial, Plaza Mayor')
      `, [defaultRestauranteId]);
    }

    // Insertar mesas si no existen
    const mesasCount = await client.query('SELECT COUNT(*) FROM mesas WHERE id_restaurante = $1', [defaultRestauranteId]);
    if (parseInt(mesasCount.rows[0].count) === 0) {
      // Obtener la primera sucursal para asignar las mesas
      const sucursalResult = await client.query('SELECT id_sucursal FROM sucursales WHERE id_restaurante = $1 LIMIT 1', [defaultRestauranteId]);
      if (sucursalResult.rows.length > 0) {
        const sucursalId = sucursalResult.rows[0].id_sucursal;
        await client.query(`
          INSERT INTO mesas (id_restaurante, numero, id_sucursal, capacidad, estado) VALUES 
          ($1, 1, $2, 4, 'libre'),
          ($1, 2, $2, 4, 'libre'),
          ($1, 3, $2, 6, 'libre'),
          ($1, 4, $2, 4, 'libre'),
          ($1, 5, $2, 6, 'libre'),
          ($1, 6, $2, 4, 'libre'),
          ($1, 7, $2, 8, 'libre'),
          ($1, 8, $2, 4, 'libre'),
          ($1, 9, $2, 6, 'libre'),
          ($1, 10, $2, 4, 'libre')
        `, [defaultRestauranteId, sucursalId]);
      }
    }

    const productosCount = await client.query('SELECT COUNT(*) FROM productos WHERE id_restaurante = $1', [defaultRestauranteId]);
    if (parseInt(productosCount.rows[0].count) === 0) {
      // Obtener algunas categorías para asignar a los productos
      const categoriasResult = await client.query('SELECT id_categoria FROM categorias WHERE id_restaurante = $1 ORDER BY id_categoria LIMIT 6', [defaultRestauranteId]);
      const categoriaIds = categoriasResult.rows.map(row => row.id_categoria);

      await client.query(`
        INSERT INTO productos (id_restaurante, nombre, precio, id_categoria, stock_actual) VALUES 
        ($1, 'Ensalada César Vegana', 8.50, $2, 20),
        ($1, 'Sopa de Lentejas', 6.00, $3, 15),
        ($1, 'Pasta Primavera', 12.00, $4, 25),
        ($1, 'Jugo Verde', 4.50, $5, 30),
        ($1, 'Tarta de Chocolate Vegana', 5.50, $6, 10),
        ($1, 'Hummus con Pan', 3.50, $7, 15)
      `, [defaultRestauranteId, categoriaIds[0], categoriaIds[1], categoriaIds[2], categoriaIds[3], categoriaIds[4], categoriaIds[5]]);
    }

    console.log('Base de datos PostgreSQL inicializada correctamente con todas las tablas.');
  } catch (error) {
    console.error('Error al inicializar la base de datos:', error);
    throw error;
  }
};

// Solo inicializar la base de datos si no estamos en modo test
if (process.env.NODE_ENV !== 'test') {
  console.log('=== INICIANDO CONEXIÓN A BD ===');
  console.log('Intentando conectar a PostgreSQL...');
  try {
    pool.connect()
      .then((client) => {
        console.log('¡Conexión exitosa a PostgreSQL usando Pool en backend real!');
        client.release();
      })
      .catch((err) => {
        console.error('❌ Error al conectar a PostgreSQL:', err);
      });
  } catch (err) {
    console.error('❌ Error inesperado al intentar conectar a PostgreSQL:', err);
  }
}

// Exporta el pool para que pueda ser utilizado en controladores y modelos
module.exports = {
  query: pool.query.bind(pool),
  pool: pool
};