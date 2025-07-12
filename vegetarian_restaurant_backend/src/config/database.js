// vegetarian_restaurant_backend/src/config/database.js

const { Pool } = require('pg');
const envConfig = require('./envConfig');

const pool = new Pool({
  user: envConfig.DB_USER || 'postgres',
  host: envConfig.DB_HOST || 'localhost',
  database: envConfig.DB_NAME || 'vegetarian_restaurant',
  password: envConfig.DB_PASSWORD || 'tu_password',
  port: envConfig.DB_PORT || 5432,
  ssl: envConfig.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  // Configurar zona horaria para consistencia
  options: '-c timezone=America/Caracas',
  // Configuración del pool de conexiones para optimización
  max: 20, // Número máximo de clientes en el pool
  idleTimeoutMillis: 30000, // Cierra clientes inactivos después de 30 segundos
  connectionTimeoutMillis: 2000, // Tiempo máximo para adquirir un cliente (2 segundos)
});

// Función para inicializar la base de datos con el esquema completo
const initDatabase = async () => {
  const client = await pool.connect();
  try {
    // Crear tablas si no existen
    await client.query(`
      -- ===================================
      -- 🔹 1. Categorías de productos
      -- ===================================
      CREATE TABLE IF NOT EXISTS categorias (
          id_categoria SERIAL PRIMARY KEY,
          nombre VARCHAR(100) NOT NULL UNIQUE,
          activo BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT NOW()
      );

      -- ===================================
      -- 🔹 2. Productos
      -- ===================================
      CREATE TABLE IF NOT EXISTS productos (
          id_producto SERIAL PRIMARY KEY,
          nombre VARCHAR(200) NOT NULL,
          precio DECIMAL(10,2) NOT NULL CHECK (precio > 0),
          id_categoria INTEGER REFERENCES categorias(id_categoria),
          stock_actual INTEGER DEFAULT 0 CHECK (stock_actual >= 0),
          activo BOOLEAN DEFAULT true,
          imagen_url TEXT,
          created_at TIMESTAMP DEFAULT NOW()
      );

      -- ===================================
      -- 🔹 3. Vendedores (usuarios)
      -- ===================================
      CREATE TABLE IF NOT EXISTS vendedores (
          id_vendedor SERIAL PRIMARY KEY,
          nombre VARCHAR(150) NOT NULL,
          username VARCHAR(50) NOT NULL UNIQUE,
          email VARCHAR(255) UNIQUE,
          password_hash VARCHAR(255),
          rol VARCHAR(20) DEFAULT 'cajero' CHECK (rol IN ('cajero', 'gerente', 'admin', 'cocinero')),
          activo BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT NOW()
      );

      -- ===================================
      -- 🔹 4. Métodos de pago
      -- ===================================
      CREATE TABLE IF NOT EXISTS metodos_pago (
          id_pago SERIAL PRIMARY KEY,
          descripcion VARCHAR(50) NOT NULL UNIQUE,
          activo BOOLEAN DEFAULT true
      );

      -- ===================================
      -- 🔹 5. Sucursales
      -- ===================================
      CREATE TABLE IF NOT EXISTS sucursales (
          id_sucursal SERIAL PRIMARY KEY,
          nombre VARCHAR(150) NOT NULL,
          ciudad VARCHAR(100) NOT NULL,
          direccion TEXT,
          activo BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT NOW()
      );

      -- ===================================
      -- 🔹 5.1. Gestión de Mesas
      -- ===================================
      CREATE TABLE IF NOT EXISTS mesas (
          id_mesa SERIAL PRIMARY KEY,
          numero INTEGER NOT NULL,
          id_sucursal INTEGER REFERENCES sucursales(id_sucursal),
          capacidad INTEGER DEFAULT 4,
          estado VARCHAR(20) DEFAULT 'libre' CHECK (estado IN ('libre', 'en_uso', 'pendiente_cobro', 'reservada', 'mantenimiento')),
          id_venta_actual INTEGER REFERENCES ventas(id_venta),
          hora_apertura TIMESTAMP,
          hora_cierre TIMESTAMP,
          total_acumulado DECIMAL(10,2) DEFAULT 0,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(numero, id_sucursal)
      );

      -- ===================================
      -- 🔹 6. Ventas
      -- ===================================
      CREATE TABLE IF NOT EXISTS ventas (
          id_venta SERIAL PRIMARY KEY,
          fecha TIMESTAMP DEFAULT NOW(),
          id_vendedor INTEGER REFERENCES vendedores(id_vendedor),
          id_pago INTEGER REFERENCES metodos_pago(id_pago),
          id_sucursal INTEGER REFERENCES sucursales(id_sucursal),
          tipo_servicio VARCHAR(20) DEFAULT 'Mesa' CHECK (tipo_servicio IN ('Mesa', 'Delivery')),
          total DECIMAL(10,2) DEFAULT 0,
          mesa_numero INTEGER,
          created_at TIMESTAMP DEFAULT NOW()
      );

      -- ===================================
      -- 🔹 7. Detalle de ventas
      -- ===================================
      CREATE TABLE IF NOT EXISTS detalle_ventas (
          id_detalle SERIAL PRIMARY KEY,
          id_venta INTEGER REFERENCES ventas(id_venta) ON DELETE CASCADE,
          id_producto INTEGER REFERENCES productos(id_producto),
          cantidad INTEGER NOT NULL CHECK (cantidad > 0),
          precio_unitario DECIMAL(10,2) NOT NULL CHECK (precio_unitario > 0),
          subtotal DECIMAL(10,2) GENERATED ALWAYS AS (cantidad * precio_unitario) STORED,
          observaciones TEXT,
          created_at TIMESTAMP DEFAULT NOW()
      );

      -- ===================================
      -- 🔹 8. Dimensión de tiempo (para BI)
      -- ===================================
      CREATE TABLE IF NOT EXISTS dim_tiempo (
          id_tiempo SERIAL PRIMARY KEY,
          fecha DATE UNIQUE NOT NULL,
          dia INTEGER NOT NULL,
          mes INTEGER NOT NULL,
          anio INTEGER NOT NULL,
          nombre_mes VARCHAR(20) NOT NULL,
          nombre_dia VARCHAR(20) NOT NULL,
          es_fin_de_semana BOOLEAN NOT NULL,
          turno VARCHAR(10) NOT NULL CHECK (turno IN ('mañana', 'tarde', 'noche'))
      );

      -- ===================================
      -- 🔹 9. Clientes (opcional)
      -- ===================================
      CREATE TABLE IF NOT EXISTS clientes (
          id_cliente SERIAL PRIMARY KEY,
          nombre VARCHAR(150),
          telefono VARCHAR(20),
          email VARCHAR(100),
          fecha_registro TIMESTAMP DEFAULT NOW()
      );

      -- ===================================
      -- 🔹 10. Facturación (opcional)
      -- ===================================
      CREATE TABLE IF NOT EXISTS facturas (
          id_factura SERIAL PRIMARY KEY,
          numero VARCHAR(50) UNIQUE NOT NULL,
          nit_cliente VARCHAR(20),
          razon_social VARCHAR(200),
          total DECIMAL(10,2),
          fecha TIMESTAMP DEFAULT NOW(),
          id_venta INTEGER REFERENCES ventas(id_venta)
      );

      -- ===================================
      -- 🔹 10.1. Prefacturas (para gestión de mesas)
      -- ===================================
      CREATE TABLE IF NOT EXISTS prefacturas (
          id_prefactura SERIAL PRIMARY KEY,
          id_mesa INTEGER REFERENCES mesas(id_mesa),
          id_venta_principal INTEGER REFERENCES ventas(id_venta),
          total_acumulado DECIMAL(10,2) DEFAULT 0,
          estado VARCHAR(20) DEFAULT 'abierta' CHECK (estado IN ('abierta', 'cerrada', 'facturada')),
          fecha_apertura TIMESTAMP DEFAULT NOW(),
          fecha_cierre TIMESTAMP,
          observaciones TEXT,
          created_at TIMESTAMP DEFAULT NOW()
      );

      -- ===================================
      -- 🔹 11. Promociones (opcional)
      -- ===================================
      CREATE TABLE IF NOT EXISTS promociones (
          id_promocion SERIAL PRIMARY KEY,
          nombre VARCHAR(100),
          tipo VARCHAR(20) CHECK (tipo IN ('porcentaje', 'fijo')),
          valor DECIMAL(10,2) CHECK (valor > 0),
          fecha_inicio DATE,
          fecha_fin DATE,
          id_producto INTEGER REFERENCES productos(id_producto)
      );
    `);

    // Add 'estado' column to 'ventas' table if it doesn't exist
    await client.query(`
      ALTER TABLE ventas ADD COLUMN IF NOT EXISTS estado VARCHAR(30) DEFAULT 'recibido' CHECK (estado IN ('recibido', 'en_preparacion', 'listo_para_servir', 'entregado', 'cancelado'));
    `);

    // Add updated_at column to mesas table if it doesn't exist
    await client.query(`
      ALTER TABLE mesas ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
    `);

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
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_ventas_fecha ON ventas(fecha);
      CREATE INDEX IF NOT EXISTS idx_detalle_ventas_id_venta ON detalle_ventas(id_venta);
      CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(id_categoria);
      CREATE INDEX IF NOT EXISTS idx_dim_tiempo_fecha ON dim_tiempo(fecha);
    `);

    // Insertar datos de ejemplo si las tablas están vacías
    const categoriasCount = await client.query('SELECT COUNT(*) FROM categorias');
    if (parseInt(categoriasCount.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO categorias (nombre) VALUES 
        ('Ensaladas'),
        ('Sopas'),
        ('Platos Principales'),
        ('Bebidas'),
        ('Postres'),
        ('Aperitivos')
      `);
    }

    const metodosPagoCount = await client.query('SELECT COUNT(*) FROM metodos_pago');
    if (parseInt(metodosPagoCount.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO metodos_pago (descripcion) VALUES 
        ('Efectivo'),
        ('Tarjeta de Crédito'),
        ('Tarjeta de Débito'),
        ('Transferencia'),
        ('Pago Móvil')
      `);
    }

    const sucursalesCount = await client.query('SELECT COUNT(*) FROM sucursales');
    if (parseInt(sucursalesCount.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO sucursales (nombre, ciudad, direccion) VALUES 
        ('Sucursal Centro', 'Caracas', 'Av. Principal, Centro Comercial ABC'),
        ('Sucursal Este', 'Caracas', 'Calle Comercial, Plaza Mayor')
      `);
    }

    // Insertar mesas si no existen
    const mesasCount = await client.query('SELECT COUNT(*) FROM mesas');
    if (parseInt(mesasCount.rows[0].count) === 0) {
      // Obtener la primera sucursal para asignar las mesas
      const sucursalResult = await client.query('SELECT id_sucursal FROM sucursales LIMIT 1');
      if (sucursalResult.rows.length > 0) {
        const sucursalId = sucursalResult.rows[0].id_sucursal;
        await client.query(`
          INSERT INTO mesas (numero, id_sucursal, capacidad, estado) VALUES 
          (1, $1, 4, 'libre'),
          (2, $1, 4, 'libre'),
          (3, $1, 6, 'libre'),
          (4, $1, 4, 'libre'),
          (5, $1, 6, 'libre'),
          (6, $1, 4, 'libre'),
          (7, $1, 8, 'libre'),
          (8, $1, 4, 'libre'),
          (9, $1, 6, 'libre'),
          (10, $1, 4, 'libre')
        `, [sucursalId]);
      }
    }

    const productosCount = await client.query('SELECT COUNT(*) FROM productos');
    if (parseInt(productosCount.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO productos (nombre, precio, id_categoria, stock_actual) VALUES 
        ('Ensalada César Vegana', 8.50, 1, 20),
        ('Sopa de Lentejas', 6.00, 2, 15),
        ('Pasta Primavera', 12.00, 3, 25),
        ('Jugo Verde', 4.50, 4, 30),
        ('Tarta de Chocolate Vegana', 5.50, 5, 10),
        ('Hummus con Pan', 3.50, 6, 15)
      `);
    }

    console.log('Base de datos PostgreSQL inicializada correctamente con todas las tablas.');
  } catch (error) {
    console.error('Error al inicializar la base de datos:', error);
    throw error;
  } finally {
    client.release();
  }
};

console.log('=== INICIANDO CONEXIÓN A BD ===');
console.log('Intentando conectar a PostgreSQL...');
// Prueba la conexión a la base de datos
pool.connect()
  .then(async (client) => {
    console.log('Conectado a la base de datos PostgreSQL exitosamente.');
    console.log('Iniciando inicialización de la base de datos...');
    await initDatabase();
    console.log('Inicialización de BD completada');
    client.release();
  })
  .catch(err => {
    console.error('Error al conectar a la base de datos PostgreSQL:', err.message);
    console.error('Stack trace completo:', err.stack);
    console.error('Detalles del error:', err);
  });

// Exporta el pool para que pueda ser utilizado en controladores y modelos
module.exports = {
  query: pool.query.bind(pool),
  pool: pool
};