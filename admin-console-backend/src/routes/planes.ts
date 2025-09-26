import { Router } from 'express';
import { authenticateAdmin } from '../middlewares/authMiddleware';
import {
  getAllPlanes,
  getPlanById,
  getRestauranteSuscripcion,
  cambiarPlanRestaurante,
  getRestauranteUso,
  getRestaurantesConPlanes
} from '../controllers/planesController';

const router = Router();

// Todas las rutas requieren autenticación de admin
router.use(authenticateAdmin);

// Obtener todos los planes disponibles
router.get('/', getAllPlanes);

// Obtener plan por ID
router.get('/:id', getPlanById);

// Obtener restaurantes con sus planes
router.get('/restaurantes/listado', getRestaurantesConPlanes);

// Obtener suscripción actual de un restaurante
router.get('/restaurante/:id_restaurante/suscripcion', getRestauranteSuscripcion);

// Obtener estadísticas de uso de un restaurante
router.get('/restaurante/:id_restaurante/uso', getRestauranteUso);

// Cambiar plan de un restaurante
router.post('/restaurante/:id_restaurante/cambiar-plan', cambiarPlanRestaurante);

export default router;
