const express = require('express');
const router = express.Router();
const categoriasAlmacenController = require('../controllers/categoriasAlmacenController');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');

// Obtener todas las categorías de almacén
router.get('/', authenticateToken, authorizeRoles('admin', 'gerente'), categoriasAlmacenController.getAllCategorias);

// Obtener categoría por ID
router.get('/:id', authenticateToken, authorizeRoles('admin', 'gerente'), categoriasAlmacenController.getCategoriaById);

// Obtener estadísticas de una categoría
router.get('/:id/estadisticas', authenticateToken, authorizeRoles('admin', 'gerente'), categoriasAlmacenController.getEstadisticasCategoria);

// Crear nueva categoría
router.post('/', authenticateToken, authorizeRoles('admin', 'gerente'), categoriasAlmacenController.createCategoria);

// Actualizar categoría
router.put('/:id', authenticateToken, authorizeRoles('admin', 'gerente'), categoriasAlmacenController.updateCategoria);

// Eliminar categoría
router.delete('/:id', authenticateToken, authorizeRoles('admin', 'gerente'), categoriasAlmacenController.deleteCategoria);

module.exports = router;
