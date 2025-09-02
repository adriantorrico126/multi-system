import { Pool } from 'pg';

// Usar las variables de entorno del archivo .env
const pool = new Pool({
  host: process.env.POS_DB_HOST || 'localhost',
  port: Number(process.env.POS_DB_PORT) || 5432,
  user: process.env.POS_DB_USER || 'postgres',
  password: process.env.POS_DB_PASSWORD || '',
  database: process.env.POS_DB_NAME || 'sistempos',
  ssl: false, // SSL deshabilitado para desarrollo local
  max: 10, // Limitar conexiones desde la consola admin
});

console.log('DB ENV:', process.env.POS_DB_USER, process.env.POS_DB_DATABASE, process.env.POS_DB_HOST);

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
  
  // Crear usuario administrador por defecto si no existe
  try {
    const bcrypt = require('bcryptjs');
    const passwordHash = bcrypt.hashSync('admin123', 10);
    
    await pool.query(`
      INSERT INTO admin_users (username, password_hash, nombre, activo)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (username) DO NOTHING
    `, ['admin@possolutions.com', passwordHash, 'Administrador Global', true]);
    
    console.log('✅ Usuario administrador creado/verificado');
  } catch (error) {
    console.log('⚠️ Usuario administrador ya existe o error al crear:', error);
  }
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