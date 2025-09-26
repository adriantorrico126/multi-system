const express = require('express');
const planController = require('../controllers/planController');
const { authenticateToken } = require('../middlewares/authMiddleware');

const router = express.Router();

// GET /api/v1/plans/current - Obtener plan actual del restaurante
router.get('/current', authenticateToken, planController.getCurrentPlan);

// GET /api/v1/plans/usage-stats - Obtener estadísticas de uso del plan
router.get('/usage-stats', authenticateToken, planController.getUsageStats);

// GET /api/v1/plans - Obtener todos los planes disponibles
router.get('/', authenticateToken, planController.getAllPlans);

module.exports = router;