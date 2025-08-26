const { Pool } = require('pg');

// Cargar variables de entorno (si es necesario, aunque DigitalOcean las inyecta)
// require('dotenv').config();

const config = {
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
  ssl: process.env.DB_SSL_MODE === 'require' ? { rejectUnauthorized: false } : false,
};

console.log('--- INTENTANDO CONEXIÓN A DB ---');
console.log('DB_HOST:', config.host);
console.log('DB_PORT:', config.port);
console.log('DB_USER:', config.user);
console.log('DB_NAME:', config.database);
console.log('DB_SSL_MODE:', process.env.DB_SSL_MODE);
// NO IMPRIMIR LA CONTRASEÑA EN LOGS DE PRODUCCIÓN

const pool = new Pool(config);

pool.query('SELECT NOW()')
  .then(res => {
    console.log('✅ Conexión a la base de datos exitosa!');
    console.log('Hora del servidor DB:', res.rows[0].now);
    process.exit(0); // Salir con éxito
  })
  .catch(err => {
    console.error('❌ Error de conexión a la base de datos:', err.message);
    console.error('Código de error PG:', err.code);
    console.error('Rutina PG:', err.routine);
    console.error('Detalles del error:', err);
    process.exit(1); // Salir con error
  });
