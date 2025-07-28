import { Router } from 'express';
import { registrarPago, listarPagosPorRestaurante, getEstadoSuscripcion, suspenderActivarRestaurante } from '../controllers/pagosController';
import { body, param } from 'express-validator';
import { validateRequest } from '../middlewares/validateRequest';
import { authenticateAdmin, authorizePerm } from '../middlewares/authMiddleware';

const router = Router();

// POST /pagos/registrar
router.post(
  '/registrar',
  authenticateAdmin,
  authorizePerm('pagos', 'crear'),
  [
    body('id_restaurante').isInt(),
    body('monto').isNumeric(),
    body('metodo_pago').optional().isString(),
    body('observaciones').optional().isString()
  ],
  validateRequest,
  registrarPago
);
// GET /pagos/:id_restaurante
router.get(
  '/:id_restaurante',
  authenticateAdmin,
  authorizePerm('pagos', 'ver'),
  [param('id_restaurante').isInt()],
  validateRequest,
  listarPagosPorRestaurante
);
// GET /pagos/estado/:id_restaurante
router.get(
  '/estado/:id_restaurante',
  authenticateAdmin,
  authorizePerm('pagos', 'ver'),
  [param('id_restaurante').isInt()],
  validateRequest,
  getEstadoSuscripcion
);
// PATCH /pagos/suspender-activar/:id_restaurante
router.patch(
  '/suspender-activar/:id_restaurante',
  authenticateAdmin,
  authorizePerm('pagos', 'editar'),
  [param('id_restaurante').isInt(), body('activo').isBoolean()],
  validateRequest,
  suspenderActivarRestaurante
);

export default router; 