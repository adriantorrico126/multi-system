const express = require('express');
const { createTicket, getTickets, getTicketsForHub, updateTicketStatus, addTicketResponse } = require('../controllers/soporteController');
const { authenticateToken } = require('../middlewares/authMiddleware');

const router = express.Router();

// Crear ticket de soporte
router.post('/tickets', authenticateToken, createTicket);

// Listar tickets del usuario
router.get('/tickets', authenticateToken, getTickets);

// Endpoint para el HUB de gestión (consumido por multi-resto-insights-hub)
router.get('/tickets/hub', getTicketsForHub);

// Actualizar estado del ticket (HUB)
router.patch('/tickets/:id/estado', updateTicketStatus);

// Agregar respuesta al ticket (HUB)
router.post('/tickets/:id/respuestas', addTicketResponse);

module.exports = router; 