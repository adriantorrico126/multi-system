// vegetarian_restaurant_backend/src/config/database.js

const { Pool } = require('pg');
const envConfig = require('./envConfig');

// Pool básico, igual que en el test y el REPL
const pool = new Pool({
  user: envConfig.DB_USER,
  host: envConfig.DB_HOST,
  database: envConfig.DB_NAME,
  password: envConfig.DB_PASSWORD,
  port: envConfig.DB_PORT,
  connectionTimeoutMillis: 2000 // 2 segundos
});

// Ya no es necesario realizar una prueba de conexión aquí.
// El pool se conectará bajo demanda cuando se realice la primera consulta.
// Esto evita que el proceso se quede colgado si la conexión inicial
// no se cierra correctamente.

module.exports = {
  pool
};