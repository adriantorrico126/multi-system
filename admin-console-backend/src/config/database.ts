import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  ssl: process.env.DB_SSL_MODE === 'require' ? { rejectUnauthorized: false } : false,
  max: 10, // Limitar conexiones desde la consola admin
});

console.log('DB ENV:', process.env.DB_USER, process.env.DB_DATABASE, process.env.DB_HOST);

export default pool;

// Inicializar tabla de administradores si no existe
export async function initAdminUsersTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      nombre VARCHAR(100) NOT NULL,
      activo BOOLEAN DEFAULT true,
      creado_en TIMESTAMP DEFAULT NOW(),
      actualizado_en TIMESTAMP DEFAULT NOW()
    )
  `);
}

// Inicializar tabla de restaurantes si no existe
export async function initRestaurantesTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS restaurantes (
      id_restaurante SERIAL PRIMARY KEY,
      nombre VARCHAR(255) NOT NULL,
      direccion VARCHAR(255),
      telefono VARCHAR(50),
      activo BOOLEAN DEFAULT true,
      creado_en TIMESTAMP DEFAULT NOW(),
      actualizado_en TIMESTAMP DEFAULT NOW()
    )
  `);
}

// Inicializar tabla de pagos de restaurantes si no existe
export async function initPagosRestaurantesTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS pagos_restaurantes (
      id SERIAL PRIMARY KEY,
      id_restaurante INTEGER NOT NULL REFERENCES restaurantes(id_restaurante) ON DELETE CASCADE,
      monto NUMERIC(10,2) NOT NULL,
      fecha_pago TIMESTAMP NOT NULL DEFAULT NOW(),
      metodo_pago VARCHAR(50),
      observaciones TEXT,
      registrado_por INTEGER, -- id del admin
      creado_en TIMESTAMP DEFAULT NOW()
    )
  `);
} 

// Inicializar tabla de configuraciones del sistema
export async function initConfiguracionesSistemaTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS configuraciones_sistema (
      clave_config VARCHAR(100) PRIMARY KEY,
      valor_config JSONB NOT NULL DEFAULT '{}'::jsonb,
      creado_en TIMESTAMP DEFAULT NOW(),
      actualizado_en TIMESTAMP DEFAULT NOW()
    )
  `);
}

// Inicializar tabla de servicios (suscripciones) por restaurante
export async function initServiciosRestauranteTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS servicios_restaurante (
      id SERIAL PRIMARY KEY,
      id_restaurante INTEGER NOT NULL REFERENCES restaurantes(id_restaurante) ON DELETE CASCADE,
      nombre_plan VARCHAR(100) NOT NULL,
      descripcion_plan TEXT,
      fecha_inicio TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      fecha_fin TIMESTAMP WITH TIME ZONE,
      estado_suscripcion VARCHAR(50) NOT NULL DEFAULT 'activo',
      precio_mensual NUMERIC(10,2),
      funcionalidades_json JSONB NOT NULL DEFAULT '{}'::jsonb,
      creado_en TIMESTAMP DEFAULT NOW(),
      actualizado_en TIMESTAMP DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_servicios_restaurante_rest ON servicios_restaurante(id_restaurante);
    CREATE INDEX IF NOT EXISTS idx_servicios_restaurante_estado ON servicios_restaurante(estado_suscripcion);
  `);
}