const express = require('express');
const { createTicket, getTickets } = require('../controllers/soporteController');
const { authenticateToken } = require('../middlewares/authMiddleware');

const router = express.Router();

// Crear ticket de soporte
router.post('/tickets', authenticateToken, createTicket);

// Listar tickets del usuario
router.get('/tickets', authenticateToken, getTickets);

module.exports = router; 