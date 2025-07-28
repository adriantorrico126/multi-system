import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.POS_DB_HOST,
  port: Number(process.env.POS_DB_PORT) || 5432,
  user: process.env.POS_DB_USER,
  password: process.env.POS_DB_PASSWORD,
  database: process.env.POS_DB_NAME,
  max: 10, // Limitar conexiones desde la consola admin
});

console.log('DB ENV:', process.env.POS_DB_USER, process.env.POS_DB_NAME, process.env.POS_DB_HOST);

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