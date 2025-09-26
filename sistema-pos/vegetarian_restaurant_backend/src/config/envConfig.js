// vegetarian_restaurant_backend/src/config/envConfig.js

const path = require('path');

// Carga las variables de entorno desde .env al objeto process.env
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const envConfig = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000, // Puerto para desarrollo local
  API_PREFIX: process.env.API_PREFIX || '/api/v1',
  DB_HOST: process.env.DB_HOST,
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_NAME: process.env.DB_NAME,
  DB_PORT: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
};

// Validar que las variables esenciales de la base de datos estén definidas
const requiredDbVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
const missingDbVars = requiredDbVars.filter(varName => !envConfig[varName]);

if (missingDbVars.length > 0 && envConfig.NODE_ENV !== 'test') { // No requerir para tests si usan mock
  throw new Error(`Variables de entorno de base de datos faltantes: ${missingDbVars.join(', ')}. Asegúrate de que el archivo .env esté configurado correctamente.`);
}

module.exports = envConfig;