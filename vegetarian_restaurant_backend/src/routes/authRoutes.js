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

// Obtener usuarios (solo admin)
router.get('/users', authenticateToken, authorizeRoles('admin'), authController.getUsers);

module.exports = router;