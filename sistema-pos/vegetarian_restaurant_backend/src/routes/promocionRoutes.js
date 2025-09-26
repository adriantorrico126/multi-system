const express = require('express');
const router = express.Router();
const promocionController = require('../controllers/promocionController');
const { authenticateToken, authorizeRoles, ensureTenantContext } = require('../middlewares/authMiddleware');
const { planMiddleware } = require('../middlewares/planMiddleware');

// Aplicar middleware de planes para funcionalidades de promociones (plan avanzado+)
router.use(authenticateToken, ensureTenantContext, planMiddleware('promociones', 'avanzado'));

// Crear promoción
router.post('/', authorizeRoles('admin', 'super_admin'), promocionController.crearPromocion);

// Obtener promociones activas
router.get('/activas', authorizeRoles('admin', 'cajero', 'super_admin', 'cocinero', 'mesero'), promocionController.getPromocionesActivas);

// Obtener todas las promociones
router.get('/', authorizeRoles('admin', 'super_admin'), promocionController.getTodasPromociones);

// Calcular descuento para un producto
router.post('/calcular-descuento', authorizeRoles('admin', 'cajero', 'super_admin', 'cocinero', 'mesero'), promocionController.calcularDescuento);

// Aplicar descuentos a productos
router.post('/aplicar-descuentos', authorizeRoles('admin', 'cajero', 'super_admin', 'cocinero', 'mesero'), promocionController.aplicarDescuentosAProductos);

// Actualizar promoción
router.put('/:id_promocion', authorizeRoles('admin', 'super_admin'), promocionController.actualizarPromocion);

// Eliminar promoción
router.delete('/:id_promocion', authorizeRoles('admin', 'super_admin'), promocionController.eliminarPromocion);

// Verificar si un producto tiene promociones activas
router.get('/producto/:id_producto/verificar', authorizeRoles('admin', 'cajero', 'super_admin', 'cocinero', 'mesero'), promocionController.tienePromocionesActivas);

// Obtener sucursales disponibles para asignar promociones
router.get('/sucursales-disponibles', authorizeRoles('admin', 'super_admin'), promocionController.getSucursalesDisponibles);

module.exports = router; 