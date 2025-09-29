const express = require('express');
const router = express.Router();

// =====================================================
// RUTAS EXISTENTES DEL SISTEMA POS
// =====================================================

// Importar todas las rutas existentes
const authRoutes = require('./authRoutes');
const ventaRoutes = require('./ventaRoutes');
const productoRoutes = require('./productoRoutes');
const categoriaRoutes = require('./categoriaRoutes');
const mesaRoutes = require('./mesaRoutes');
const sucursalRoutes = require('./sucursalRoutes');
const soporteRoutes = require('./soporteRoutes');
const grupoMesaRoutes = require('./grupoMesaRoutes');
const modificadorRoutes = require('./modificadorRoutes');
const reservaRoutes = require('./reservaRoutes');
// const planRoutes = require('./planRoutes'); // Comentado - usando nuevo sistema de planes
const metodosPagoRoutes = require('./metodosPagoRoutes');

// Rutas del sistema de egresos
const egresoRoutes = require('./egresoRoutes');
const categoriaEgresoRoutes = require('./categoriaEgresoRoutes');
const presupuestoEgresoRoutes = require('./presupuestoEgresoRoutes');

// =====================================================
// NUEVAS RUTAS DEL SISTEMA DE PLANES
// =====================================================

// Importar nuevas rutas de planes
const planesRoutes = require('./planesRoutes');
const suscripcionesRoutes = require('./suscripcionesRoutes');
const contadoresRoutes = require('./contadoresRoutes');
const alertasRoutes = require('./alertasRoutes');

// =====================================================
// MONTAR RUTAS EXISTENTES
// =====================================================

// Montar las rutas existentes del sistema POS
router.use('/auth', authRoutes);
router.use('/ventas', ventaRoutes);
router.use('/productos', productoRoutes);
router.use('/categorias', categoriaRoutes);
router.use('/mesas', mesaRoutes);
router.use('/sucursales', sucursalRoutes);
router.use('/soporte', soporteRoutes);
router.use('/grupos-mesas', grupoMesaRoutes);
router.use('/modificadores', modificadorRoutes);
router.use('/reservas', reservaRoutes);
// router.use('/plans', planRoutes); // Comentado - usando nuevo sistema de planes
router.use('/metodos-pago', metodosPagoRoutes);

// Montar rutas del sistema de egresos
router.use('/egresos', egresoRoutes);
router.use('/categorias-egresos', categoriaEgresoRoutes);
router.use('/presupuestos-egresos', presupuestoEgresoRoutes);

// =====================================================
// MONTAR NUEVAS RUTAS DE PLANES
// =====================================================

// Montar rutas del sistema de planes y suscripciones
router.use('/planes-sistema', planesRoutes);
router.use('/suscripciones-sistema', suscripcionesRoutes);
router.use('/contadores-sistema', contadoresRoutes);
router.use('/alertas-sistema', alertasRoutes);

// =====================================================
// RUTA DE INFORMACIÓN GENERAL
// =====================================================

/**
 * @route GET /api/v1/info
 * @desc Obtener información general del sistema
 * @access Public
 */
router.get('/info', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Sistema POS - Información General',
        version: '2.0.0',
        sistemas: {
            pos: {
                nombre: 'Sistema POS',
                rutas: [
                    '/api/v1/auth',
                    '/api/v1/ventas',
                    '/api/v1/productos',
                    '/api/v1/categorias',
                    '/api/v1/mesas',
                    '/api/v1/sucursales',
                    '/api/v1/soporte',
                    '/api/v1/grupos-mesas',
                    '/api/v1/modificadores',
                    '/api/v1/reservas',
                    '/api/v1/plans',
                    '/api/v1/metodos-pago',
                    '/api/v1/egresos',
                    '/api/v1/categorias-egresos',
                    '/api/v1/presupuestos-egresos'
                ]
            },
            planes: {
                nombre: 'Sistema de Planes y Suscripciones',
                rutas: [
                    '/api/v1/planes-sistema',
                    '/api/v1/suscripciones-sistema',
                    '/api/v1/contadores-sistema',
                    '/api/v1/alertas-sistema'
                ]
            }
        }
    });
});

module.exports = router;