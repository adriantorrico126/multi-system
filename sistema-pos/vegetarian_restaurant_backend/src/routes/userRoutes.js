const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');
const { check } = require('express-validator');

// Reglas de validación para actualizar usuario
const updateUserValidationRules = [
  check('nombre').notEmpty().withMessage('El nombre es requerido'),
  check('username').notEmpty().withMessage('El nombre de usuario es requerido'),
  check('email').optional().custom((value) => {
    if (value === null || value === undefined || value === '') return true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(value)) return true;
    throw new Error('El email debe ser válido');
  }).withMessage('El email debe ser válido'),
  check('rol').isIn(['cajero', 'admin', 'cocinero', 'mesero', 'super_admin', 'superadmin']).withMessage('Rol inválido'),
  check('id_sucursal').optional().custom((value) => {
    if (value === null || value === undefined) return true;
    if (typeof value === 'number' && value >= 1) return true;
    throw new Error('ID de sucursal debe ser null o un número entero mayor a 0');
  }).withMessage('ID de sucursal inválido'),
  check('activo').isBoolean().withMessage('El estado activo debe ser un booleano')
];

router.post('/', authenticateToken, authorizeRoles('admin'), userController.createUser);
router.get('/', authenticateToken, authorizeRoles('admin'), userController.getUsers);
router.put('/:id', authenticateToken, authorizeRoles('admin'), updateUserValidationRules, userController.updateUser);
router.delete('/:id', authenticateToken, authorizeRoles('admin'), userController.deleteUser);

module.exports = router;