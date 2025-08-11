import { Router } from 'express';
import * as restauranteController from '../controllers/restauranteController';

const router = Router();

router.post('/', restauranteController.createRestaurante);

export default router;
