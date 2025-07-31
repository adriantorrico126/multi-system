const express = require('express');
const router = express.Router();
const promocionController = require('../controllers/promocionController');
const { authenticateToken, authorizeRoles, ensureTenantContext } = require('../middlewares/authMiddleware');

// Crear promoción
router.post('/', authenticateToken, authorizeRoles('admin', 'super_admin'), ensureTenantContext, promocionController.crearPromocion);

// Obtener promociones activas
router.get('/activas', authenticateToken, authorizeRoles('admin', 'cajero', 'super_admin'), ensureTenantContext, promocionController.getPromocionesActivas);

// Obtener todas las promociones
router.get('/', authenticateToken, authorizeRoles('admin', 'super_admin'), ensureTenantContext, promocionController.getTodasPromociones);

// Calcular descuento para un producto
router.post('/calcular-descuento', authenticateToken, authorizeRoles('admin', 'cajero', 'super_admin'), ensureTenantContext, promocionController.calcularDescuento);

// Aplicar descuentos a productos
router.post('/aplicar-descuentos', authenticateToken, authorizeRoles('admin', 'cajero', 'super_admin'), ensureTenantContext, promocionController.aplicarDescuentosAProductos);

// Actualizar promoción
router.put('/:id_promocion', authenticateToken, authorizeRoles('admin', 'super_admin'), ensureTenantContext, promocionController.actualizarPromocion);

// Eliminar promoción
router.delete('/:id_promocion', authenticateToken, authorizeRoles('admin', 'super_admin'), ensureTenantContext, promocionController.eliminarPromocion);

// Verificar si un producto tiene promociones activas
router.get('/producto/:id_producto/verificar', authenticateToken, authorizeRoles('admin', 'cajero', 'super_admin'), ensureTenantContext, promocionController.tienePromocionesActivas);

// Obtener sucursales disponibles para asignar promociones
router.get('/sucursales-disponibles', authenticateToken, authorizeRoles('admin', 'super_admin'), ensureTenantContext, promocionController.getSucursalesDisponibles);

module.exports = router; 