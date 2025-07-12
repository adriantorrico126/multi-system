const express = require('express');
const router = express.Router();
const productoController = require('../controllers/productoController');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');
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
  check('cantidad_cambio').isInt({ min: 1 }).withMessage('La cantidad de cambio debe ser un número entero positivo.'),
  check('tipo_movimiento').isIn(['entrada', 'salida']).withMessage('El tipo de movimiento debe ser \'entrada\' o \'salida\'.'),
];

// Obtener todos los productos (con caché de 1 minuto)
router.get('/', authenticateToken, cache('1 minute'), productoController.getAllProductos);

// Crear un nuevo producto (limpia la caché de productos)
router.post('/', authenticateToken, authorizeRoles('admin', 'gerente'), createProductValidationRules, clearCache('productos'), productoController.createProducto);

// Actualizar un producto (limpia la caché de productos)
router.put('/:id', authenticateToken, authorizeRoles('admin', 'gerente'), updateProductValidationRules, clearCache('productos'), productoController.updateProducto);

// Eliminar un producto (soft delete) (limpia la caché de productos)
router.delete('/:id', authenticateToken, authorizeRoles('admin', 'gerente'), clearCache('productos'), productoController.deleteProducto);

// Rutas de inventario (para administradores, gerentes y cajeros)
router.get('/inventario/resumen', authenticateToken, authorizeRoles('admin', 'gerente', 'cajero'), productoController.getInventorySummary);
router.post('/inventario/:id/stock', authenticateToken, authorizeRoles('admin', 'gerente'), updateStockValidationRules, clearCache('productos'), productoController.updateProductStock);
router.get('/inventario/movimientos', authenticateToken, authorizeRoles('admin', 'gerente'), productoController.getStockMovementsHistory);

module.exports = router;