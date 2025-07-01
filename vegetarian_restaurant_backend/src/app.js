// Carga la configuración de entorno PRIMERO para que esté disponible globalmente.
const envConfig = require('./config/envConfig');

const express = require('express');
const cors = require('cors');
const db = require('./config/database'); // Para la prueba de healthcheck

// Importar rutas
const categoriaRoutes = require('./routes/categoriaRoutes');

const app = express();

// Middlewares básicos
app.use(cors()); // Habilita CORS para todas las rutas y orígenes por defecto.
app.use(express.json()); // Para parsear application/json
app.use(express.urlencoded({ extended: true })); // Para parsear application/x-www-form-urlencoded

// Ruta de Healthcheck para verificar que la API está viva y conectada a la BD
app.get(`${envConfig.API_PREFIX}/healthcheck`, async (req, res) => {
  try {
    // Intenta una consulta simple a la base de datos
    const dbStatus = await db.query('SELECT NOW()');
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
    console.error('Error en healthcheck al conectar a la BD:', error);
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

// Rutas de la API
app.use(`${envConfig.API_PREFIX}/categorias`, categoriaRoutes);


// Middleware para manejar rutas no encontradas (404)
// Si ninguna ruta anterior coincide, esta se ejecutará.
app.use((req, res, next) => {
  const error = new Error('Ruta no encontrada');
  error.status = 404;
  next(error);
});

// Middleware de manejo de errores global
// eslint-disable-next-line no-unused-vars
app.use((error, req, res, next) => {
  console.error('Error global:', error.message);
  console.error(error.stack);
  res.status(error.status || 500).json({
    error: {
      message: error.message || 'Error interno del servidor.',
      status: error.status || 500,
      // stack: envConfig.NODE_ENV === 'development' ? error.stack : undefined // Opcional: mostrar stack en desarrollo
    },
  });
});

module.exports = app;
