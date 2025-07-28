import { Router } from 'express';
import { createTicket, getTickets } from '../controllers/soporteController';
import { authenticateAdmin } from '../middlewares/authMiddleware';

const router = Router();

// Crear ticket de soporte
router.post('/tickets', authenticateAdmin, createTicket);

// Listar tickets del usuario
router.get('/tickets', authenticateAdmin, getTickets);

export default router; 