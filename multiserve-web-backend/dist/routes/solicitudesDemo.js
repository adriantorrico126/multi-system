import { Router } from 'express';
import { getSolicitudesDemo, getSolicitudDemoById, createSolicitudDemo, updateSolicitudDemo, deleteSolicitudDemo, getSolicitudesDemoStats, } from '../controllers/solicitudesDemoController.js';
import { validateSchema, validateQuery } from '../middleware/index.js';
import { solicitudDemoSchema } from '../validators/index.js';
const router = Router();
// Rutas para solicitudes de demo
router.get('/', validateQuery, getSolicitudesDemo);
router.get('/stats', validateQuery, getSolicitudesDemoStats);
router.get('/:id', getSolicitudDemoById);
router.post('/', validateSchema(solicitudDemoSchema), createSolicitudDemo);
router.put('/:id', updateSolicitudDemo);
router.delete('/:id', deleteSolicitudDemo);
export default router;
//# sourceMappingURL=solicitudesDemo.js.map