// vegetarian_restaurant_backend/src/app.js

console.log('=== INICIANDO APP.JS ===');
// Carga la configuración de entorno PRIMERO para que esté disponible globalmente.
const envConfig = require('./config/envConfig');
console.log('envConfig cargado en app.js');

const express = require('express');
const cors = require('cors');
const db = require('./config/database'); // Por ahora no se importa para aislar
const logger = require('./config/logger'); // Importar el logger
// const rateLimit = require('express-rate-limit');

// Importar rutas básicas
const categoriaRoutes = require('./routes/categoriaRoutes');
const authRoutes = require('./routes/authRoutes');
const sucursalRoutes = require('./routes/sucursalRoutes');
const ventaRoutes = require('./routes/ventaRoutes');
const productoRoutes = require('./routes/productoRoutes');
const mesaRoutes = require('./routes/mesaRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const userRoutes = require('./routes/userRoutes');
// const metodoPagoRoutes = require('./routes/metodoPagoRoutes');
// const pagoSuscripcionRoutes = require('./routes/pagoSuscripcionRoutes');

const app = express();
app.use(cors({
  origin: 'http://localhost:8080', // Cambia esto si tu frontend usa otro puerto
  credentials: true,
}));
app.use(express.json());

// Rutas básicas
app.use('/api/v1/categorias', categoriaRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/sucursales', sucursalRoutes);
app.use('/api/v1/ventas', ventaRoutes);
app.use('/api/v1/productos', productoRoutes);
app.use('/api/v1/mesas', mesaRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/users', userRoutes);
// app.use('/api/v1/metodos_pago', metodoPagoRoutes);
// app.use('/api/v1/pagos_suscripcion', pagoSuscripcionRoutes);

// Middleware de logging de solicitudes
app.use((req, res, next) => {
  logger.info(`[${req.method}] ${req.originalUrl} - IP: ${req.ip}`);
  next();
});

// Healthcheck
app.get('/api/v1/healthcheck', (req, res) => res.json({ status: 'ok' }));

module.exports = app;