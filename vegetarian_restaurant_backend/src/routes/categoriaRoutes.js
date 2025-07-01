const express = require('express');
const categoriaController = require('../controllers/categoriaController');
// Podríamos añadir middlewares de validación o autenticación aquí si los tuviéramos
// const { validateCategoriaCreation } = require('../middlewares/validationMiddleware');
// const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// Rutas para Categorías
// POST /api/v1/categorias - Crear una nueva categoría
router.post(
  '/',
  // validateCategoriaCreation, // Ejemplo de middleware de validación
  categoriaController.createCategoria
);

// GET /api/v1/categorias - Obtener todas las categorías (activas por defecto)
// GET /api/v1/categorias?includeInactive=true - Obtener todas las categorías (incluyendo inactivas)
router.get('/', categoriaController.getAllCategorias);

// GET /api/v1/categorias/:id - Obtener una categoría por ID
router.get('/:id', categoriaController.getCategoriaById);

// PUT /api/v1/categorias/:id - Actualizar una categoría por ID
router.put('/:id', categoriaController.updateCategoria);

// DELETE /api/v1/categorias/:id - Eliminar una categoría por ID (soft delete)
router.delete('/:id', categoriaController.deleteCategoria);

// Ejemplo de ruta para hard delete (si se decide implementar)
// router.delete('/:id/hard', authMiddleware.isAdmin, categoriaController.hardDeleteCategoria);


module.exports = router;
