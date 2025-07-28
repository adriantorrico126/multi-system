import { Router } from 'express';
import { getAllAdmins, createAdmin, updateAdmin, deleteAdmin } from '../controllers/adminUsersController';
import { body } from 'express-validator';
import { validateRequest } from '../middlewares/validateRequest';
import { authenticateAdmin, authorizePerm } from '../middlewares/authMiddleware';

const router = Router();

// GET /admin-users
router.get('/', authenticateAdmin, authorizePerm('usuarios', 'ver'), getAllAdmins);
// POST /admin-users
router.post(
  '/',
  authenticateAdmin,
  authorizePerm('usuarios', 'crear'),
  [
    body('nombre').isString().notEmpty(),
    body('email').isEmail(),
    body('password').isString().isLength({ min: 6 }),
    body('rol_id').isInt()
  ],
  validateRequest,
  createAdmin
);
// PATCH /admin-users/:id
router.patch(
  '/:id',
  authenticateAdmin,
  authorizePerm('usuarios', 'editar'),
  [
    body('nombre').optional().isString().notEmpty(),
    body('email').optional().isEmail(),
    body('password').optional().isString().isLength({ min: 6 }),
    body('rol_id').optional().isInt()
  ],
  validateRequest,
  updateAdmin
);
// DELETE /admin-users/:id
router.delete('/:id', authenticateAdmin, authorizePerm('usuarios', 'eliminar'), deleteAdmin);

export default router; 