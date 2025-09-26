const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');
const { check } = require('express-validator');

const loginValidationRules = [
  check('username').notEmpty().withMessage('El nombre de usuario es requerido.').trim(),
  check('password').notEmpty().withMessage('La contraseña es requerida.'),
];

router.post('/login', loginValidationRules, authController.login);

// Renovar token (requiere token válido)
router.post('/refresh', authenticateToken, authController.refreshToken);

// Verificar el estado de la sesión actual del token
router.get('/status', authenticateToken, authController.getSessionStatus);

// Validar token (endpoint simple para verificar si el token es válido)
router.get('/validate', authenticateToken, authController.validateToken);

// Obtener usuarios (solo admin)
router.get('/users', authenticateToken, authorizeRoles('admin'), authController.getUsers);

module.exports = router;