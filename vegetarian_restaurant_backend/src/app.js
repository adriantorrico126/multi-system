// vegetarian_restaurant_backend/src/app.js

console.log('=== INICIANDO APP.JS ===');
// Carga la configuración de entorno PRIMERO para que esté disponible globalmente.
const envConfig = require('./config/envConfig');
console.log('envConfig cargado en app.js');

const express = require('express');
const cors = require('cors');
const db = require('./config/database'); // Para la prueba de healthcheck (asume que `db` tiene un método `query`)
const logger = require('./config/logger'); // Importar el logger
const rateLimit = require('express-rate-limit'); // Importar express-rate-limit

// Importar Swagger
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

// Importar rutas
const categoriaRoutes = require('./routes/categoriaRoutes');
const authRoutes = require('./routes/authRoutes');
const productoRoutes = require('./routes/productoRoutes');
const ventaRoutes = require('./routes/ventaRoutes');
const sucursalRoutes = require('./routes/sucursalRoutes');
const mesaRoutes = require('./routes/mesaRoutes');

const app = express();

// Middlewares básicos
// ----------------------------------------------------------------------
// ¡CONFIGURACIÓN DE CORS ESPECÍFICA!
// Asegúrate que 'http://localhost:8080' coincida con el puerto de tu frontend.
app.use(cors({
  origin: ['http://localhost:8080', 'http://localhost:8081', 'http://localhost:5173'], // <--- Agregado 8081
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], // Métodos HTTP permitidos
  allowedHeaders: ['Content-Type', 'Authorization'], // Headers permitidos (importante para tokens de autenticación)
  credentials: true // Habilita el envío de cookies/headers de autorización si los necesitas
}));

app.use(express.json()); // Para parsear application/json
app.use(express.urlencoded({ extended: true })); // Para parsear application/x-www-form-urlencoded

// Middleware de logging de solicitudes
app.use((req, res, next) => {
  logger.info(`[${req.method}] ${req.originalUrl} - IP: ${req.ip}`);
  next();
});

// Configuración de Rate Limiting para rutas generales
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Limita cada IP a 100 solicitudes por windowMs
  message: 'Demasiadas solicitudes desde esta IP, por favor intenta de nuevo después de 15 minutos.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate Limiter más permisivo para autenticación
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 1000, // Mucho más permisivo para login
  message: 'Demasiados intentos de login, por favor espera un momento.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Aplicar limitación de tasa a rutas específicas
// app.use(`${envConfig.API_PREFIX}/auth`, authLimiter);
// app.use(`${envConfig.API_PREFIX}/categorias`, apiLimiter);
// app.use(`${envConfig.API_PREFIX}/productos`, apiLimiter);
// app.use(`${envConfig.API_PREFIX}/ventas`, apiLimiter);
// app.use(`${envConfig.API_PREFIX}/sucursales`, apiLimiter);
// app.use(`${envConfig.API_PREFIX}/mesas`, apiLimiter);

// Ruta de Healthcheck para verificar que la API está viva y conectada a la BD
app.get(`${envConfig.API_PREFIX}/healthcheck`, async (req, res) => {
  try {
    // Intenta una consulta simple a la base de datos
    const dbStatus = await db.query('SELECT NOW()'); // Ejecuta una consulta SQL simple
    logger.info('Healthcheck: Conexión a la BD exitosa.');
    res.status(200).json({
      status: 'UP',
      message: 'API funcionando correctamente.',
      database: {
        status: 'UP',
        timestamp: dbStatus.rows[0].now,
      },
      environment: envConfig.NODE_ENV,
      apiVersion: envConfig.API_PREFIX
    });
  } catch (error) {
    logger.error('Healthcheck: Error al conectar a la BD:', error);
    res.status(503).json({ // Service Unavailable
      status: 'DOWN',
      message: 'La API está funcionando, pero hay un problema con la base de datos.',
      database: {
        status: 'DOWN',
        error: error.message,
      },
      environment: envConfig.NODE_ENV,
    });
  }
});

// Ruta de prueba simple para verificar conectividad
app.get(`${envConfig.API_PREFIX}/test`, (req, res) => {
  logger.info('Test endpoint called');
  res.status(200).json({
    message: 'Test endpoint working',
    timestamp: new Date().toISOString(),
    headers: req.headers
  });
});

// Rutas de la API - Usando el prefijo definido en envConfig
app.use(`${envConfig.API_PREFIX}/categorias`, categoriaRoutes);
app.use(`${envConfig.API_PREFIX}/auth`, authRoutes);
app.use(`${envConfig.API_PREFIX}/productos`, productoRoutes);
app.use(`${envConfig.API_PREFIX}/ventas`, ventaRoutes);
app.use(`${envConfig.API_PREFIX}/sucursales`, sucursalRoutes);
app.use(`${envConfig.API_PREFIX}/mesas`, mesaRoutes);

// Ruta para la documentación de Swagger UI
app.use(`${envConfig.API_PREFIX}/docs`, swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Middleware para manejar rutas no encontradas (404)
app.use((req, res, next) => {
  const error = new Error('Ruta no encontrada');
  error.status = 404;
  logger.warn(`Ruta no encontrada: ${req.originalUrl}`);
  next(error);
});

// Middleware de manejo de errores global
// eslint-disable-next-line no-unused-vars
app.use((error, req, res, next) => {
  logger.error(`Error global: ${error.message}`, { stack: error.stack });
  res.status(error.status || 500).json({
    error: {
      message: error.message || 'Error interno del servidor.',
      status: error.status || 500,
    },
  });
});

module.exports = app;