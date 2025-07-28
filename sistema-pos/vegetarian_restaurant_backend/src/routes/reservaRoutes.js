const express = require('express');
const router = express.Router();
const reservaController = require('../controllers/reservaController');
const { authenticateToken } = require('../middlewares/authMiddleware');

// Listar reservas
router.get('/', authenticateToken, reservaController.listarReservas);
// Crear reserva
router.post('/', authenticateToken, reservaController.crearReserva);
// Actualizar reserva
router.patch('/:id_reserva', authenticateToken, reservaController.actualizarReserva);
// Eliminar reserva
router.delete('/:id_reserva', authenticateToken, reservaController.eliminarReserva);

module.exports = router; 