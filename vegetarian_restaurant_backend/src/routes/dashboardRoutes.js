const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');
const dashboardController = require('../controllers/dashboardController');

// Obtener estadísticas del dashboard
router.get('/stats', authenticateToken, authorizeRoles('admin', 'gerente'), dashboardController.getDashboardStats);

module.exports = router; 