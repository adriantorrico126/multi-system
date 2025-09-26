import { Router } from 'express';
import {
  createOrUpdateUserSession,
  getUserSessionById,
  getUserSessions,
  updateUserSession,
  getUserSessionStats,
  cleanupOldUserSessions,
} from '../controllers/userSessionsController.js';
import { validateSchema, validateQuery } from '../middleware/index.js';
import { userSessionSchema } from '../validators/index.js';

const router = Router();

// Rutas para sesiones de usuario
router.post('/', validateSchema(userSessionSchema), createOrUpdateUserSession);
router.get('/', validateQuery, getUserSessions);
router.get('/stats', validateQuery, getUserSessionStats);
router.get('/:sessionId', getUserSessionById);
router.put('/:sessionId', updateUserSession);
router.delete('/cleanup', cleanupOldUserSessions);

export default router;


