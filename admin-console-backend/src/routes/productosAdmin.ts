import { Router } from 'express';
import { authenticateAdmin, authorizePerm } from '../middlewares/authMiddleware';
import { getProductosByRestaurante, importProductos } from '../controllers/productosAdminController';

const router = Router();

// Productos por restaurante
router.get('/:id_restaurante', authenticateAdmin, authorizePerm('productos', 'ver'), (req, res) => {
  (req.params as any).id = req.params.id_restaurante;
  return getProductosByRestaurante(req as any, res as any);
});

// Importación/migración masiva de productos
router.post('/:id_restaurante/import', authenticateAdmin, authorizePerm('productos', 'crear'), (req, res) => {
  (req.params as any).id = req.params.id_restaurante;
  return importProductos(req as any, res as any);
});

export default router;


