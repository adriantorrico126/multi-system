const express = require('express');
const sucursalController = require('../controllers/sucursalController');
const { authenticateToken } = require('../middlewares/authMiddleware');

const router = express.Router();

// GET /api/v1/sucursales - Obtener todas las sucursales activas
router.get('/', authenticateToken, sucursalController.getAllSucursales);

// POST /api/v1/sucursales - Crear nueva sucursal
router.post('/', authenticateToken, sucursalController.createSucursal);

// PUT /api/v1/sucursales/:id_sucursal - Actualizar sucursal
router.put('/:id_sucursal', authenticateToken, sucursalController.updateSucursal);

// DELETE /api/v1/sucursales/:id_sucursal - Eliminar sucursal (soft delete)
router.delete('/:id_sucursal', authenticateToken, sucursalController.deleteSucursal);

module.exports = router;