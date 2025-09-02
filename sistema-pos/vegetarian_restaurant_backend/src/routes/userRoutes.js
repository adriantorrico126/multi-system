const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');
const { check } = require('express-validator');

// Reglas de validación para actualizar usuario
const updateUserValidationRules = [
  check('nombre').notEmpty().withMessage('El nombre es requerido'),
  check('username').notEmpty().withMessage('El nombre de usuario es requerido'),
  check('email').optional().isEmail().withMessage('El email debe ser válido'),
  check('rol').isIn(['cajero', 'admin', 'cocinero', 'mesero', 'super_admin']).withMessage('Rol inválido'),
  check('id_sucursal').isInt({ min: 1 }).withMessage('ID de sucursal inválido'),
  check('activo').isBoolean().withMessage('El estado activo debe ser un booleano')
];

router.post('/', authenticateToken, authorizeRoles('admin'), userController.createUser);
router.get('/', authenticateToken, authorizeRoles('admin'), userController.getUsers);
router.put('/:id', authenticateToken, authorizeRoles('admin'), updateUserValidationRules, userController.updateUser);
router.delete('/:id', authenticateToken, authorizeRoles('admin'), userController.deleteUser);

module.exports = router;