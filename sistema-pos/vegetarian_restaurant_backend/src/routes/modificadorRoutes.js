const express = require('express');
const router = express.Router();
const modificadorController = require('../controllers/modificadorController');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');

// Listar modificadores de un producto
router.get('/producto/:id_producto', authenticateToken, modificadorController.listarPorProducto);
// Crear modificador para un producto
router.post('/', authenticateToken, authorizeRoles('admin', 'super_admin'), modificadorController.crear);
// Asociar modificadores a un detalle de venta
router.post('/detalle/:id_detalle_venta', authenticateToken, modificadorController.asociarAMovimiento);
// Listar modificadores de un detalle de venta
router.get('/detalle/:id_detalle_venta', authenticateToken, modificadorController.listarPorDetalleVenta);

module.exports = router; 