import { Router } from 'express';
import { getAllSucursales, getSucursalById, updateSucursalStatus, createSucursal, updateSucursal } from '../controllers/sucursalesController';
import { body } from 'express-validator';
import { validateRequest } from '../middlewares/validateRequest';
import { authenticateAdmin, authorizePerm } from '../middlewares/authMiddleware';

const router = Router();

// GET /sucursales
router.get('/', authenticateAdmin, authorizePerm('sucursales', 'ver'), getAllSucursales);
// GET /sucursales/:id
router.get('/:id', authenticateAdmin, authorizePerm('sucursales', 'ver'), getSucursalById);
// POST /sucursales
router.post(
  '/',
  authenticateAdmin,
  authorizePerm('sucursales', 'crear'),
  [
    body('nombre').isString().notEmpty(),
    body('ciudad').isString().notEmpty(),
    body('direccion').isString().notEmpty(),
    body('id_restaurante').isInt()
  ],
  validateRequest,
  createSucursal
);
// PATCH /sucursales/:id
router.patch(
  '/:id',
  authenticateAdmin,
  authorizePerm('sucursales', 'editar'),
  [
    body('nombre').optional().isString().notEmpty(),
    body('ciudad').optional().isString().notEmpty(),
    body('direccion').optional().isString().notEmpty(),
    body('id_restaurante').optional().isInt()
  ],
  validateRequest,
  updateSucursal
);
// PATCH /sucursales/:id/estado
router.patch(
  '/:id/estado',
  authenticateAdmin,
  authorizePerm('sucursales', 'editar'),
  [body('activo').isBoolean()],
  validateRequest,
  updateSucursalStatus
);

export default router; 