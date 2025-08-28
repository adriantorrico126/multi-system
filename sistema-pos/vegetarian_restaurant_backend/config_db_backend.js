// Configuración de la base de datos para el BACKEND (misma base local)
require('dotenv').config();

module.exports = {
  host: 'localhost', // Usar localhost para conectar a la base local
  port: 5432,
  user: 'postgres',
  password: process.env.DB_PASSWORD || '69512310Anacleta',
  database: 'sistempos', // O el nombre de tu base de datos local
  // Sin SSL para conexiones locales
  ssl: false
};
