const express = require('express');
const router = express.Router();
const cocinaController = require('../controllers/cocinaController');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');

// Todas las rutas de cocina requieren autenticación
router.use(authenticateToken);

// Rutas específicas para el rol 'cocinero'
router.get('/pedidos', authorizeRoles('cocinero', 'admin', 'super_admin'), cocinaController.getPedidosPendientes);
router.patch('/pedidos/:id_detalle/estado', authorizeRoles('cocinero', 'admin', 'super_admin'), cocinaController.actualizarEstadoPedido);


module.exports = router;
