const express = require('express');
const router = express.Router();
const inventarioLotesController = require('../controllers/inventarioLotesController');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');

// Obtener todos los lotes
router.get('/', authenticateToken, authorizeRoles('admin', 'gerente'), inventarioLotesController.getAllLotes);

// Obtener lotes por categoría de almacén
router.get('/categoria/:id_categoria', authenticateToken, authorizeRoles('admin', 'gerente'), inventarioLotesController.getLotesByCategoriaAlmacen);

// Obtener lotes por vencer
router.get('/por-vencer', authenticateToken, authorizeRoles('admin', 'gerente'), inventarioLotesController.getLotesPorVencer);

// Obtener productos con stock bajo
router.get('/stock-bajo', authenticateToken, authorizeRoles('admin', 'gerente'), inventarioLotesController.getProductosStockBajo);

// Crear nuevo lote
router.post('/', authenticateToken, authorizeRoles('admin', 'gerente'), inventarioLotesController.createLote);

// Actualizar lote
router.put('/:id', authenticateToken, authorizeRoles('admin', 'gerente'), inventarioLotesController.updateLote);

// Eliminar lote
router.delete('/:id', authenticateToken, authorizeRoles('admin', 'gerente'), inventarioLotesController.deleteLote);

module.exports = router;
