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
const arqueoRoutes = require('./routes/arqueoRoutes');
startupLogger.logStep('reservaRoutes', 'success');
const promocionRoutes = require('./routes/promocionRoutes');
startupLogger.logStep('promocionRoutes', 'success');
const inventarioLotesRoutes = require('./routes/inventarioLotesRoutes');
startupLogger.logStep('inventarioLotesRoutes', 'success');
const cocinaRoutes = require('./routes/cocinaRoutes');
const { pool } = require('./config/database');
startupLogger.logStep('cocinaRoutes', 'success');

// const metodoPagoRoutes = require('./routes/metodoPagoRoutes');
// const pagoSuscripcionRoutes = require('./routes/pagoSuscripcionRoutes');

const app = express();
startupLogger.logSection('Configuración de middleware');
app.use(cors({
  origin: (origin, callback) => {
    const allowed = (process.env.CORS_ORIGINS || 'http://localhost:8080,http://localhost:5173,http://localhost:8081').split(',').map(s => s.trim());
    if (!origin || allowed.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
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
app.use('/api/v1/arqueo', arqueoRoutes);
startupLogger.logStep('Ruta /api/v1/arqueo', 'success');

// Crear tabla de arqueos al iniciar
(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS arqueos_caja (
        id_arqueo SERIAL PRIMARY KEY,
        id_restaurante INTEGER NOT NULL,
        id_sucursal INTEGER,
        id_vendedor INTEGER,
        monto_inicial NUMERIC(12,2) NOT NULL,
        fecha_apertura TIMESTAMP NOT NULL DEFAULT NOW(),
        monto_final NUMERIC(12,2),
        fecha_cierre TIMESTAMP,
        diferencia NUMERIC(12,2),
        estado VARCHAR(20) NOT NULL DEFAULT 'abierto',
        observaciones TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_arqueo_rest_suc_estado ON arqueos_caja(id_restaurante, id_sucursal, estado);
      
      -- Tabla para tickets de soporte
      CREATE TABLE IF NOT EXISTS soporte_tickets (
        id_ticket SERIAL PRIMARY KEY,
        id_vendedor INTEGER NOT NULL,
        id_restaurante INTEGER NOT NULL,
        asunto TEXT NOT NULL,
        descripcion TEXT NOT NULL,
        estado VARCHAR(20) NOT NULL DEFAULT 'pendiente',
        fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_soporte_tickets_vendedor_fecha ON soporte_tickets(id_vendedor, fecha_creacion);
      CREATE INDEX IF NOT EXISTS idx_soporte_tickets_restaurante_fecha ON soporte_tickets(id_restaurante, fecha_creacion);
    `);
    startupLogger.logStep('Tabla arqueos_caja (init)', 'success');
    startupLogger.logStep('Tabla soporte_tickets (init)', 'success');
  } catch (e) {
    startupLogger.logStep('Tabla arqueos_caja (init error)', 'error');
    console.error('Error creando tabla arqueos_caja:', e);
  }
})();

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

// ====== Configuración por restaurante (MVP) ======
app.get('/api/v1/configuracion', async (req, res, next) => {
  try {
    const { id_restaurante } = req.query;
    if (!id_restaurante) return res.status(400).json({ message: 'id_restaurante es requerido' });
    await pool.query(`CREATE TABLE IF NOT EXISTS configuraciones_restaurante (
      id_config SERIAL PRIMARY KEY,
      id_restaurante INTEGER NOT NULL,
      clave_config TEXT NOT NULL,
      valor_config JSONB NOT NULL,
      UNIQUE(id_restaurante, clave_config)
    );`);
    const { rows } = await pool.query('SELECT clave_config, valor_config FROM configuraciones_restaurante WHERE id_restaurante = $1', [id_restaurante]);
    const cfg = rows.reduce((acc, r) => { acc[r.clave_config] = r.valor_config; return acc; }, {});
    res.json({ data: cfg });
  } catch (e) { next(e); }
});

app.post('/api/v1/configuracion', async (req, res, next) => {
  try {
    const { id_restaurante, configuracion } = req.body || {};
    if (!id_restaurante || !configuracion || typeof configuracion !== 'object') return res.status(400).json({ message: 'id_restaurante y configuracion (objeto) son requeridos' });
    await pool.query(`CREATE TABLE IF NOT EXISTS configuraciones_restaurante (
      id_config SERIAL PRIMARY KEY,
      id_restaurante INTEGER NOT NULL,
      clave_config TEXT NOT NULL,
      valor_config JSONB NOT NULL,
      UNIQUE(id_restaurante, clave_config)
    );`);
    const entries = Object.entries(configuracion);
    for (const [clave, valor] of entries) {
      await pool.query(
        `INSERT INTO configuraciones_restaurante (id_restaurante, clave_config, valor_config)
         VALUES ($1, $2, $3)
         ON CONFLICT (id_restaurante, clave_config) DO UPDATE SET valor_config = EXCLUDED.valor_config`,
        [id_restaurante, clave, valor]
      );
    }
    res.status(200).json({ message: 'Configuración guardada' });
  } catch (e) { next(e); }
});

startupLogger.logSection('Finalización');
startupLogger.logStep('App.js completado', 'success');
startupLogger.getSummary();

module.exports = app;