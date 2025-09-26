const express = require('express');
const router = express.Router();
const cocinaController = require('../controllers/cocinaController');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');
const { planMiddleware } = require('../middlewares/planMiddleware');

// Todas las rutas de cocina requieren autenticación y plan profesional+
router.use(authenticateToken, planMiddleware('cocina', 'profesional'));

// Rutas específicas para el rol 'cocinero'
router.get('/pedidos', authorizeRoles('cocinero', 'admin', 'super_admin'), cocinaController.getPedidosPendientes);
router.patch('/pedidos/:id_detalle/estado', authorizeRoles('cocinero', 'admin', 'super_admin'), cocinaController.actualizarEstadoPedido);


module.exports = router;
