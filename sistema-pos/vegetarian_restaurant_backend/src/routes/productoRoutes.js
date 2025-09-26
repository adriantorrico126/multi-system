const express = require('express');
const router = express.Router();
const productoController = require('../controllers/productoController');
const { authenticateToken, authorizeRoles, ensureTenantContext } = require('../middlewares/authMiddleware');
const { planMiddleware, resourceLimitMiddleware } = require('../middlewares/planMiddleware');
const { autoIncrementCounter, autoDecrementCounter, updateProductCounter } = require('../middlewares/usageCountersMiddleware');
const { limitAlertMiddleware } = require('../middlewares/limitAlertsMiddleware');
const { check } = require('express-validator');
const apicache = require('apicache');

let cache = apicache.middleware;

// Middleware para limpiar caché
const clearCache = (cacheKey) => (req, res, next) => {
  apicache.clear(cacheKey);
  next();
};

// Reglas de validación para la creación de productos
const createProductValidationRules = [
  check('nombre').notEmpty().withMessage('El nombre del producto es requerido.').trim(),
  check('precio').isFloat({ gt: 0 }).withMessage('El precio debe ser un número positivo.'),
  check('id_categoria').isInt({ gt: 0 }).withMessage('La categoría debe ser un ID válido.'),
  check('stock_actual').optional().isInt({ min: 0 }).withMessage('El stock actual debe ser un número entero no negativo.'),
  check('imagen_url').optional().isURL().withMessage('La URL de la imagen no es válida.'),
];

// Reglas de validación para la actualización de productos
const updateProductValidationRules = [
  check('nombre').optional().notEmpty().withMessage('El nombre del producto no puede estar vacío.').trim(),
  check('precio').optional().isFloat({ gt: 0 }).withMessage('El precio debe ser un número positivo.'),
  check('id_categoria').optional().isInt({ gt: 0 }).withMessage('La categoría debe ser un ID válido.'),
  check('stock_actual').optional().isInt({ min: 0 }).withMessage('El stock actual debe ser un número entero no negativo.'),
  check('activo').optional().isBoolean().withMessage('Activo debe ser un valor booleano.'),
  check('imagen_url').optional().isURL().withMessage('La URL de la imagen no es válida.'),
];

// Reglas de validación para la actualización de stock
const updateStockValidationRules = [
  check('cantidad').isNumeric().withMessage('La cantidad debe ser un número válido.'),
  check('tipo_movimiento').isIn(['entrada', 'salida', 'ajuste_positivo', 'ajuste_negativo']).withMessage('El tipo de movimiento debe ser válido.'),
  check('stock_anterior').optional().isNumeric().withMessage('El stock anterior debe ser un número válido.'),
  check('stock_actual').optional().isNumeric().withMessage('El stock actual debe ser un número válido.'),
];

// Obtener todos los productos (multitenant: NO usar cache global para evitar mezcla entre restaurantes)
router.get('/', authenticateToken, ensureTenantContext, planMiddleware('inventory'), productoController.getAllProductos);

// Crear un nuevo producto (limpia la caché de productos) - Verificar límite de productos
router.post('/', 
  authenticateToken, 
  authorizeRoles('admin', 'super_admin'), 
  planMiddleware('inventory'), 
  resourceLimitMiddleware('productos'), 
  createProductValidationRules, 
  clearCache('productos'), 
  updateProductCounter(),
  limitAlertMiddleware(),
  productoController.createProducto
);

// Actualizar un producto (limpia la caché de productos)
router.put('/:id', 
  authenticateToken, 
  authorizeRoles('admin', 'super_admin'), 
  planMiddleware('inventory'), 
  updateProductValidationRules, 
  clearCache('productos'), 
  updateProductCounter(),
  limitAlertMiddleware(),
  productoController.updateProducto
);

// Eliminar un producto (soft delete) (limpia la caché de productos)
router.delete('/:id', 
  authenticateToken, 
  authorizeRoles('admin', 'super_admin'), 
  planMiddleware('inventory'), 
  clearCache('productos'), 
  updateProductCounter(),
  limitAlertMiddleware(),
  productoController.deleteProducto
);

// Rutas de inventario (para administradores, gerentes y cajeros)
router.get('/inventario/resumen', authenticateToken, authorizeRoles('admin', 'cajero', 'super_admin'), planMiddleware('inventory'), productoController.getInventorySummary);
router.post('/inventario/:id/stock', authenticateToken, authorizeRoles('admin', 'gerente', 'super_admin'), planMiddleware('inventory'), updateStockValidationRules, clearCache('productos'), productoController.updateProductStock);
router.get('/inventario/movimientos', authenticateToken, authorizeRoles('admin', 'super_admin'), planMiddleware('inventory'), productoController.getStockMovementsHistory);

module.exports = router;