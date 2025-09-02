// vegetarian_restaurant_backend/src/config/database.js

const { Pool } = require('pg');
const envConfig = require('./envConfig');

// Pool básico con configuración condicional SSL
const pool = new Pool({
  user: envConfig.DB_USER,
  host: envConfig.DB_HOST,
  database: envConfig.DB_NAME,
  password: envConfig.DB_PASSWORD,
  port: envConfig.DB_PORT,
  // Solo usar SSL en producción (DigitalOcean)
  ssl: envConfig.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false,
  connectionTimeoutMillis: 2000 // 2 segundos
});

// Ya no es necesario realizar una prueba de conexión aquí.
// El pool se conectará bajo demanda cuando se realice la primera consulta.
// Esto evita que el proceso se quede colgado si la conexión inicial
// no se cierra correctamente.

module.exports = {
  pool
};