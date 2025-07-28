import { Router } from 'express';
import { getAllRestaurantes, getRestauranteById, updateRestauranteStatus, createRestaurante, updateRestaurante,
  getServiciosRestaurante,
  createServicioRestaurante,
  updateServicioRestaurante,
  updateEstadoServicioRestaurante
} from '../controllers/restaurantesController';
import { body } from 'express-validator';
import { validateRequest } from '../middlewares/validateRequest';
import { authenticateAdmin, authorizePerm } from '../middlewares/authMiddleware';

const router = Router();

// GET /restaurantes
router.get('/', authenticateAdmin, authorizePerm('restaurantes', 'ver'), getAllRestaurantes);
// GET /restaurantes/:id
router.get('/:id', authenticateAdmin, authorizePerm('restaurantes', 'ver'), getRestauranteById);
// POST /restaurantes
router.post(
  '/',
  authenticateAdmin,
  authorizePerm('restaurantes', 'crear'),
  [
    body('nombre').isString().notEmpty(),
    body('direccion').isString().notEmpty(),
    body('ciudad').isString().notEmpty(),
    body('telefono').optional().isString(),
    body('email').optional().isEmail()
  ],
  validateRequest,
  createRestaurante
);
// PATCH /restaurantes/:id
router.patch(
  '/:id',
  authenticateAdmin,
  authorizePerm('restaurantes', 'editar'),
  [
    body('nombre').optional().isString().notEmpty(),
    body('direccion').optional().isString().notEmpty(),
    body('ciudad').optional().isString().notEmpty(),
    body('telefono').optional().isString(),
    body('email').optional().isEmail()
  ],
  validateRequest,
  updateRestaurante
);
// PATCH /restaurantes/:id/estado
router.patch(
  '/:id/estado',
  authenticateAdmin,
  authorizePerm('restaurantes', 'editar'),
  [body('activo').isBoolean()],
  validateRequest,
  updateRestauranteStatus
);

// Servicios POS para restaurante
router.get('/:id/servicios', authenticateAdmin, authorizePerm('servicios_restaurante', 'ver'), getServiciosRestaurante);
router.post(
  '/:id/servicios',
  authenticateAdmin,
  authorizePerm('servicios_restaurante', 'crear'),
  [
    body('nombre_plan').isString().notEmpty(),
    body('descripcion_plan').optional().isString(),
    body('fecha_inicio').optional().isISO8601(),
    body('fecha_fin').optional().isISO8601(),
    body('estado_suscripcion').optional().isString(),
    body('precio_mensual').optional().isNumeric(),
    body('funcionalidades_json').optional().isObject()
  ],
  validateRequest,
  createServicioRestaurante
);
router.patch(
  '/:id/servicios/:id_servicio',
  authenticateAdmin,
  authorizePerm('servicios_restaurante', 'editar'),
  [
    body('nombre_plan').optional().isString().notEmpty(),
    body('descripcion_plan').optional().isString(),
    body('fecha_inicio').optional().isISO8601(),
    body('fecha_fin').optional().isISO8601(),
    body('estado_suscripcion').optional().isString(),
    body('precio_mensual').optional().isNumeric(),
    body('funcionalidades_json').optional().isObject()
  ],
  validateRequest,
  updateServicioRestaurante
);
router.patch(
  '/:id/servicios/:id_servicio/estado',
  authenticateAdmin,
  authorizePerm('servicios_restaurante', 'editar'),
  [body('estado_suscripcion').isString().notEmpty()],
  validateRequest,
  updateEstadoServicioRestaurante
);

export default router; 