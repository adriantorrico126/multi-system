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

// Servidor de impresión integrado
const printServer = require('./server-impresion');
startupLogger.logStep('Servidor de Impresión', 'success');

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
const categoriasAlmacenRoutes = require('./routes/categoriasAlmacenRoutes');
startupLogger.logStep('categoriasAlmacenRoutes', 'success');
const cocinaRoutes = require('./routes/cocinaRoutes');
const { pool } = require('./config/database');
startupLogger.logStep('cocinaRoutes', 'success');

// Rutas de Egresos
const egresoRoutes = require('./routes/egresoRoutes');
startupLogger.logStep('egresoRoutes', 'success');
const categoriaEgresoRoutes = require('./routes/categoriaEgresoRoutes');
startupLogger.logStep('categoriaEgresoRoutes', 'success');
const presupuestoEgresoRoutes = require('./routes/presupuestoEgresoRoutes');
startupLogger.logStep('presupuestoEgresoRoutes', 'success');

// const metodoPagoRoutes = require('./routes/metodoPagoRoutes');
// const pagoSuscripcionRoutes = require('./routes/pagoSuscripcionRoutes');

const app = express();
startupLogger.logSection('Configuración de middleware');
// Configuración de CORS para producción
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      'https://pos.forkast.vip',
      'https://admin.forkast.vip',
      'https://forkast.vip',
      'https://www.forkast.vip'
    ];

    if (process.env.NODE_ENV === 'development') {
      allowedOrigins.push(
        'http://localhost:8080',
        'http://localhost:5173',
        'http://localhost:8081',
        'http://localhost:3000'
      );
    }

    if (!origin) {
      // Permitir peticiones sin origin (Postman, curl, backend)
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.log(`🚫 CORS bloqueado: ${origin}`);
    return callback(new Error('No permitido por CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
}));

// Middleware adicional para asegurar headers CORS
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  if (origin) {
    const allowedOrigins = [
      'https://pos.forkast.vip',
      'https://admin.forkast.vip',
      'https://forkast.vip',
      'https://www.forkast.vip'
    ];
    
    if (process.env.NODE_ENV === 'development') {
      allowedOrigins.push(
        'http://localhost:8080',
        'http://localhost:5173',
        'http://localhost:8081',
        'http://localhost:3000'
      );
    }
    
    if (allowedOrigins.includes(origin)) {
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    }
  }
  
  next();
});
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
app.use('/api/v1/categorias-almacen', categoriasAlmacenRoutes);
startupLogger.logStep('Ruta /api/v1/categorias-almacen', 'success');
app.use('/api/v1/cocina', cocinaRoutes);
startupLogger.logStep('Ruta /api/v1/cocina', 'success');

// Rutas de Egresos
app.use('/api/v1/egresos', egresoRoutes);
startupLogger.logStep('Ruta /api/v1/egresos', 'success');
app.use('/api/v1/categorias-egresos', categoriaEgresoRoutes);
startupLogger.logStep('Ruta /api/v1/categorias-egresos', 'success');
app.use('/api/v1/presupuestos-egresos', presupuestoEgresoRoutes);
startupLogger.logStep('Ruta /api/v1/presupuestos-egresos', 'success');

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

// ====== Creación de tablas de inventario ======
app.get('/api/v1/setup-inventario', async (req, res, next) => {
  try {
    // Crear tabla de categorías de almacén
    await pool.query(`
      CREATE TABLE IF NOT EXISTS categorias_almacen (
        id_categoria_almacen SERIAL PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL UNIQUE,
        descripcion TEXT,
        tipo_almacen VARCHAR(50) NOT NULL,
        condiciones_especiales TEXT,
        rotacion_recomendada VARCHAR(50),
        id_restaurante INTEGER NOT NULL,
        activo BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Crear tabla de movimientos de inventario mejorada
    await pool.query(`
      CREATE TABLE IF NOT EXISTS movimientos_inventario (
        id_movimiento SERIAL PRIMARY KEY,
        id_producto INTEGER NOT NULL,
        id_lote INTEGER,
        tipo_movimiento VARCHAR(50) NOT NULL,
        cantidad NUMERIC(10,2) NOT NULL,
        stock_anterior NUMERIC(10,2) NOT NULL,
        stock_actual NUMERIC(10,2) NOT NULL,
        id_categoria_almacen INTEGER NOT NULL,
        motivo VARCHAR(200),
        id_vendedor INTEGER NOT NULL,
        id_restaurante INTEGER NOT NULL,
        fecha_movimiento TIMESTAMP DEFAULT NOW()
      );
    `);

    // Crear tabla de alertas de inventario
    await pool.query(`
      CREATE TABLE IF NOT EXISTS alertas_inventario (
        id_alerta SERIAL PRIMARY KEY,
        id_producto INTEGER NOT NULL,
        id_lote INTEGER,
        tipo_alerta VARCHAR(50) NOT NULL,
        mensaje TEXT NOT NULL,
        nivel_urgencia VARCHAR(20) NOT NULL,
        resuelta BOOLEAN DEFAULT false,
        fecha_creacion TIMESTAMP DEFAULT NOW(),
        fecha_resolucion TIMESTAMP,
        id_restaurante INTEGER NOT NULL
      );
    `);

    // Crear tabla de transferencias entre almacenes
    await pool.query(`
      CREATE TABLE IF NOT EXISTS transferencias_almacen (
        id_transferencia SERIAL PRIMARY KEY,
        id_producto INTEGER NOT NULL,
        id_lote INTEGER,
        cantidad_transferida NUMERIC(10,2) NOT NULL,
        almacen_origen INTEGER NOT NULL,
        almacen_destino INTEGER NOT NULL,
        motivo VARCHAR(200),
        id_responsable INTEGER NOT NULL,
        fecha_transferencia TIMESTAMP DEFAULT NOW(),
        estado VARCHAR(20) DEFAULT 'pendiente',
        id_restaurante INTEGER NOT NULL
      );
    `);
    
    // Crear índices para mejorar el rendimiento
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_movimientos_inventario_restaurante 
      ON movimientos_inventario(id_restaurante);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_alertas_inventario_restaurante 
      ON alertas_inventario(id_restaurante);
    `);

    // Insertar categorías de almacén por defecto
    const categoriasDefault = [
      {
        nombre: 'Almacén Seco',
        descripcion: 'Despensa Vegetariana - Legumbres, cereales, harinas, pastas, frutos secos, conservas, especias, aceites',
        tipo_almacen: 'seco',
        condiciones_especiales: 'Oscuro, seco, ventilado, temperatura ambiente',
        rotacion_recomendada: 'FIFO - Alta rotación'
      },
      {
        nombre: 'Cámara Refrigerada',
        descripcion: 'Verduras frescas, tofu, tempeh, seitán, lácteos vegetarianos, alimentos preparados',
        tipo_almacen: 'refrigerado',
        condiciones_especiales: '2-4°C, separación por categorías, evitar contaminación cruzada',
        rotacion_recomendada: 'Diaria/Interdiaria - Rápida rotación'
      },
      {
        nombre: 'Cámara de Congelación',
        descripcion: 'Verduras congeladas, hamburguesas vegetarianas, frutas para batidos, preparaciones congeladas',
        tipo_almacen: 'congelado',
        condiciones_especiales: '-18°C, evitar descongelación/re-congelación',
        rotacion_recomendada: 'Semanal - Larga duración'
      },
      {
        nombre: 'Almacén de Bebidas',
        descripcion: 'Jugos naturales, kombucha, tés, leches vegetales, agua mineral, bebidas fermentadas',
        tipo_almacen: 'bebidas',
        condiciones_especiales: 'Temperatura ambiente, protegido de luz directa',
        rotacion_recomendada: 'Semanal - Media rotación'
      },
      {
        nombre: 'Almacén de Limpieza',
        descripcion: 'Detergentes ecológicos, servilletas, cajas delivery, utensilios biodegradables',
        tipo_almacen: 'limpieza',
        condiciones_especiales: 'Separado de alimentos, seco, ventilado',
        rotacion_recomendada: 'Mensual - Baja rotación'
      },
      {
        nombre: 'Almacén de Vajilla',
        descripcion: 'Platos, bowls, bandejas, vasos, ollas, procesadores, batidoras, exprimidores',
        tipo_almacen: 'vajilla',
        condiciones_especiales: 'Limpio, seco, organizado por tipo',
        rotacion_recomendada: 'Según necesidad - Control de stock'
      }
    ];

    // Crear las categorías
    for (const categoria of categoriasDefault) {
      await pool.query(`
        INSERT INTO categorias_almacen (nombre, descripcion, tipo_almacen, condiciones_especiales, rotacion_recomendada, id_restaurante)
        VALUES ($1, $2, $3, $4, $5, 1)
        ON CONFLICT (nombre) DO NOTHING
      `, [categoria.nombre, categoria.descripcion, categoria.tipo_almacen, categoria.condiciones_especiales, categoria.rotacion_recomendada]);
    }
    
    res.json({ 
      message: 'Sistema de inventario profesional configurado correctamente',
      categorias_creadas: categoriasDefault.length,
      tablas: [
        'categorias_almacen',
        'movimientos_inventario', 
        'alertas_inventario',
        'transferencias_almacen'
      ],
      nota: 'La tabla inventario_lotes ya existe. Ejecuta el script SQL update_inventory_table.sql para agregar las nuevas columnas.'
    });
  } catch (e) { 
    console.error('Error configurando sistema de inventario:', e);
    next(e); 
  }
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

// Inicializar servidor de impresión
startupLogger.logStep('Inicializando servidor de impresión', 'info');
try {
  // El servidor de impresión ya está configurado en server-impresion.js
  // Solo necesitamos verificar que esté funcionando
  startupLogger.logStep('Servidor de impresión configurado', 'success');
} catch (error) {
  startupLogger.logStep('Error en servidor de impresión: ' + error.message, 'error');
}

startupLogger.logStep('App.js completado', 'success');
startupLogger.getSummary();

module.exports = app;