const { Pool } = require('pg');
const envConfig = require('./envConfig'); // Asegura que dotenv se cargue primero desde envConfig

const dbConfig = {
  user: envConfig.DB_USER,
  host: envConfig.DB_HOST,
  database: envConfig.DB_NAME,
  password: envConfig.DB_PASSWORD,
  port: envConfig.DB_PORT,
  // Opciones adicionales del pool (ejemplos):
  // max: 20, // número máximo de clientes en el pool
  // idleTimeoutMillis: 30000, // cuánto tiempo un cliente puede estar inactivo antes de ser cerrado
  // connectionTimeoutMillis: 2000, // cuánto tiempo esperar para una conexión antes de fallar
};

// Solo crear el pool si no estamos en un entorno de prueba que podría mockearlo
// o si las variables de base de datos están definidas.
let pool;
if (envConfig.NODE_ENV !== 'test' || (envConfig.DB_HOST && envConfig.DB_USER && envConfig.DB_NAME)) {
    pool = new Pool(dbConfig);

    // Opcional: Probar la conexión al crear el pool
    pool.query('SELECT NOW()', (err, res) => {
        if (err) {
            console.error('Error al conectar con la base de datos PostgreSQL:', err.message);
            // Considerar terminar el proceso si la conexión es crítica al inicio
            // process.exit(1);
        } else {
            console.log('Conexión exitosa a la base de datos PostgreSQL.');
            // console.log('Current time from DB:', res.rows[0].now);
        }
    });
} else {
    console.warn('Pool de base de datos no inicializado (entorno de prueba o configuración faltante).');
}


module.exports = {
  query: (text, params) => {
    if (!pool) {
        // Esto puede pasar si se intenta usar la BD en test sin mockear o si falló la conexión inicial
        // y el proceso no terminó.
        console.error('Intento de usar el pool de BD cuando no está inicializado.');
        return Promise.reject(new Error('El pool de la base de datos no está inicializado.'));
    }
    return pool.query(text, params);
  },
  getClient: () => {
    if (!pool) {
        console.error('Intento de obtener cliente del pool de BD cuando no está inicializado.');
        return Promise.reject(new Error('El pool de la base de datos no está inicializado.'));
    }
    return pool.connect();
  },
  // Podríamos exponer el pool directamente si es necesario, pero es mejor encapsularlo.
  // pool: pool
};
