// vegetarian_restaurant_backend/src/app.js

const StartupLogger = require('./utils/startupLogger');
const startupLogger = new StartupLogger();

console.log('=== INICIANDO APP.JS ===');
// Carga la configuración de entorno PRIMERO para que esté disponible globalmente.
const envConfig = require('./config/envConfig');
startupLogger.logStep('Configuración de entorno', 'success');

startupLogger.logSection('Inicialización de dependencias');
const express = require('express');
startupLogger.logStep('Express', 'success');

const cors = require('cors');
startupLogger.logStep('CORS', 'success');

const db = require('./config/database');
startupLogger.logStep('Database', 'success');

const logger = require('./config/logger');
startupLogger.logStep('Logger', 'success');

// Express y CORS ya están inicializados arriba
// const rateLimit = require('express-rate-limit');

startupLogger.logSection('Importación de rutas');
// Importar rutas básicas
const categoriaRoutes = require('./routes/categoriaRoutes');
startupLogger.logStep('categoriaRoutes', 'success');
const authRoutes = require('./routes/authRoutes');
startupLogger.logStep('authRoutes', 'success');
const sucursalRoutes = require('./routes/sucursalRoutes');
startupLogger.logStep('sucursalRoutes', 'success');
const ventaRoutes = require('./routes/ventaRoutes');
startupLogger.logStep('ventaRoutes', 'success');
const productoRoutes = require('./routes/productoRoutes');
startupLogger.logStep('productoRoutes', 'success');
const mesaRoutes = require('./routes/mesaRoutes');
startupLogger.logStep('mesaRoutes', 'success');
const dashboardRoutes = require('./routes/dashboardRoutes');
startupLogger.logStep('dashboardRoutes', 'success');
const userRoutes = require('./routes/userRoutes');
startupLogger.logStep('userRoutes', 'success');
const soporteRoutes = require('./routes/soporteRoutes');
startupLogger.logStep('soporteRoutes', 'success');
const modificadorRoutes = require('./routes/modificadorRoutes');
startupLogger.logStep('modificadorRoutes', 'success');
const grupoMesaRoutes = require('./routes/grupoMesaRoutes');
startupLogger.logStep('grupoMesaRoutes', 'success');
// const metodoPagoRoutes = require('./routes/metodoPagoRoutes');
// const pagoSuscripcionRoutes = require('./routes/pagoSuscripcionRoutes');

const app = express();
startupLogger.logSection('Configuración de middleware');
app.use(cors({
  origin: 'http://localhost:8080', // Cambia esto si tu frontend usa otro puerto
  credentials: true,
}));
startupLogger.logStep('CORS middleware', 'success');
app.use(express.json());
startupLogger.logStep('Express JSON middleware', 'success');

startupLogger.logSection('Montaje de rutas');
// Rutas básicas
app.use('/api/v1/categorias', categoriaRoutes);
startupLogger.logStep('Ruta /api/v1/categorias', 'success');
app.use('/api/v1/auth', authRoutes);
startupLogger.logStep('Ruta /api/v1/auth', 'success');
app.use('/api/v1/sucursales', sucursalRoutes);
startupLogger.logStep('Ruta /api/v1/sucursales', 'success');
app.use('/api/v1/ventas', ventaRoutes);
startupLogger.logStep('Ruta /api/v1/ventas', 'success');
app.use('/api/v1/productos', productoRoutes);
startupLogger.logStep('Ruta /api/v1/productos', 'success');
app.use('/api/v1/mesas', mesaRoutes);
startupLogger.logStep('Ruta /api/v1/mesas', 'success');
app.use('/api/v1/dashboard', dashboardRoutes);
startupLogger.logStep('Ruta /api/v1/dashboard', 'success');
app.use('/api/v1/users', userRoutes);
startupLogger.logStep('Ruta /api/v1/users', 'success');
app.use('/api/v1/soporte', soporteRoutes);
startupLogger.logStep('Ruta /api/v1/soporte', 'success');
app.use('/api/v1/modificadores', modificadorRoutes);
startupLogger.logStep('Ruta /api/v1/modificadores', 'success');
app.use('/api/v1/grupos-mesas', grupoMesaRoutes);
startupLogger.logStep('Ruta /api/v1/grupos-mesas', 'success');
// app.use('/api/v1/metodos_pago', metodoPagoRoutes);
// app.use('/api/v1/pagos_suscripcion', pagoSuscripcionRoutes);

// Middleware de logging de solicitudes
app.use((req, res, next) => {
  logger.info(`[${req.method}] ${req.originalUrl} - IP: ${req.ip}`);
  next();
});

// Healthcheck
app.get('/api/v1/healthcheck', (req, res) => res.json({ status: 'ok' }));
startupLogger.logStep('Healthcheck endpoint', 'success');

startupLogger.logSection('Finalización');
startupLogger.logStep('App.js completado', 'success');
startupLogger.getSummary();

module.exports = app;