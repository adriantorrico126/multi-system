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
const reservaRoutes = require('./routes/reservaRoutes');
startupLogger.logStep('reservaRoutes', 'success');
const promocionRoutes = require('./routes/promocionRoutes');
startupLogger.logStep('promocionRoutes', 'success');
const inventarioLotesRoutes = require('./routes/inventarioLotesRoutes');
startupLogger.logStep('inventarioLotesRoutes', 'success');
const cocinaRoutes = require('./routes/cocinaRoutes');
startupLogger.logStep('cocinaRoutes', 'success');

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

// Ruta de prueba para verificar que las rutas están funcionando (COMPLETAMENTE SEPARADA)
app.get('/api/v1/test-reservas', (req, res) => {
  console.log('🔍 [APP] Ruta de prueba /api/v1/test-reservas llamada');
  res.json({ message: 'Rutas de reservas funcionando correctamente' });
});
startupLogger.logStep('Ruta de prueba /api/v1/test-reservas', 'success');

app.use('/api/v1/reservas', reservaRoutes);
startupLogger.logStep('Ruta /api/v1/reservas', 'success');
app.use('/api/v1/promociones', promocionRoutes);
startupLogger.logStep('Ruta /api/v1/promociones', 'success');
app.use('/api/v1/inventario-lotes', inventarioLotesRoutes);
startupLogger.logStep('Ruta /api/v1/inventario-lotes', 'success');
app.use('/api/v1/cocina', cocinaRoutes);
startupLogger.logStep('Ruta /api/v1/cocina', 'success');



// app.use('/api/v1/metodos_pago', metodoPagoRoutes);
// app.use('/api/v1/pagos_suscripcion', pagoSuscripcionRoutes);

// Middleware de logging de solicitudes
app.use((req, res, next) => {
  console.log(`🔍 [APP] ${req.method} ${req.originalUrl} - IP: ${req.ip}`);
  logger.info(`[${req.method}] ${req.originalUrl} - IP: ${req.ip}`);
  next();
});

// Middleware para listar todas las rutas registradas
app.use((req, res, next) => {
  if (req.path === '/debug/routes') {
    console.log('🔍 [APP] Rutas registradas:');
    console.log('🔍 [APP] - /api/v1/categorias');
    console.log('🔍 [APP] - /api/v1/auth');
    console.log('🔍 [APP] - /api/v1/sucursales');
    console.log('🔍 [APP] - /api/v1/ventas');
    console.log('🔍 [APP] - /api/v1/productos');
    console.log('🔍 [APP] - /api/v1/mesas');
    console.log('🔍 [APP] - /api/v1/dashboard');
    console.log('🔍 [APP] - /api/v1/users');
    console.log('🔍 [APP] - /api/v1/soporte');
    console.log('🔍 [APP] - /api/v1/modificadores');
    console.log('🔍 [APP] - /api/v1/grupos-mesas');
    console.log('🔍 [APP] - /api/v1/reservas');
    console.log('🔍 [APP] - /api/v1/promociones');
    return res.json({ message: 'Rutas listadas en consola' });
  }
  next();
});

// Healthcheck
app.get('/api/v1/healthcheck', (req, res) => res.json({ status: 'ok' }));
startupLogger.logStep('Healthcheck endpoint', 'success');

startupLogger.logSection('Finalización');
startupLogger.logStep('App.js completado', 'success');
startupLogger.getSummary();

module.exports = app;