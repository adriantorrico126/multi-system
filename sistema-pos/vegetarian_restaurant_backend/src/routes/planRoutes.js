const express = require('express');
const PlanController = require('../controllers/planController');
const { authenticateToken } = require('../middlewares/authMiddleware');

const router = express.Router();

// Crear instancia del controlador
const planController = new PlanController();

// GET /api/v1/plans/current - Obtener plan actual del restaurante
router.get('/current', authenticateToken, (req, res) => planController.getCurrentRestaurantPlan(req, res));

// GET /api/v1/plans/usage-stats - Obtener estadísticas de uso del plan
router.get('/usage-stats', authenticateToken, (req, res) => planController.getCurrentRestaurantUsage(req, res));

// GET /api/v1/plans - Obtener todos los planes disponibles
router.get('/', authenticateToken, (req, res) => planController.getAllPlans(req, res));

module.exports = router;