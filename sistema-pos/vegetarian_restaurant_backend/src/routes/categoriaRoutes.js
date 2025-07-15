const express = require('express');
const categoriaController = require('../controllers/categoriaController');
const apicache = require('apicache');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');
const { check } = require('express-validator');

let cache = apicache.middleware;

// Middleware para limpiar caché
const clearCache = (cacheKey) => (req, res, next) => {
  apicache.clear(cacheKey);
  next();
};

// Reglas de validación para la creación de categorías
const createCategoriaValidationRules = [
  check('nombre').notEmpty().withMessage('El nombre de la categoría es requerido.').trim(),
];

// Reglas de validación para la actualización de categorías
const updateCategoriaValidationRules = [
  check('nombre').optional().notEmpty().withMessage('El nombre de la categoría no puede estar vacío.').trim(),
  check('activo').optional().isBoolean().withMessage('Activo debe ser un valor booleano.'),
];

const router = express.Router();

// Rutas para Categorías
// POST /api/v1/categorias - Crear una nueva categoría
router.post(
  '/',
  authenticateToken, 
  authorizeRoles('admin', 'super_admin'),
  createCategoriaValidationRules,
  clearCache('categorias'), // Limpia la caché de categorías
  categoriaController.createCategoria
);

// GET /api/v1/categorias - Obtener todas las categorías (activas por defecto)
// GET /api/v1/categorias?includeInactive=true - Obtener todas las categorías (incluyendo inactivas)
router.get('/', authenticateToken, cache('1 minute'), categoriaController.getAllCategorias);

// GET /api/v1/categorias/:id - Obtener una categoría por ID
router.get('/:id', categoriaController.getCategoriaById);

// PUT /api/v1/categorias/:id - Actualizar una categoría por ID
router.put('/:id', authenticateToken, authorizeRoles('admin', 'super_admin'), updateCategoriaValidationRules, clearCache('categorias'), categoriaController.updateCategoria);

// DELETE /api/v1/categorias/:id - Eliminar una categoría por ID (soft delete)
router.delete('/:id', authenticateToken, authorizeRoles('admin', 'super_admin'), clearCache('categorias'), categoriaController.deleteCategoria);

module.exports = router;