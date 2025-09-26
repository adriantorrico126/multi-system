import { Router } from 'express';
import {
  createConversionEvent,
  getConversionEvents,
  getConversionStats,
  getConversionEventsBySession,
  getConversionEventsByIP,
  cleanupOldConversionEvents,
} from '../controllers/conversionEventsController.js';
import { validateSchema, validateQuery } from '../middleware/index.js';
import { conversionEventSchema } from '../validators/index.js';

const router = Router();

// Rutas para eventos de conversión
router.post('/', validateSchema(conversionEventSchema), createConversionEvent);
router.get('/', validateQuery, getConversionEvents);
router.get('/stats', validateQuery, getConversionStats);
router.get('/session/:sessionId', getConversionEventsBySession);
router.get('/ip/:ip', getConversionEventsByIP);
router.delete('/cleanup', cleanupOldConversionEvents);

export default router;


