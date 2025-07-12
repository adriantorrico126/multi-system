const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');
const { check } = require('express-validator');

// Reglas de validación para el login
const loginValidationRules = [
  check('username').notEmpty().withMessage('El nombre de usuario es requerido.').trim(),
  check('password').notEmpty().withMessage('La contraseña es requerida.'),
];

// Reglas de validación para la creación de usuarios
const createUserValidationRules = [
  check('nombre').notEmpty().withMessage('El nombre es requerido.').trim(),
  check('username').notEmpty().withMessage('El nombre de usuario es requerido.').trim(),
  check('email').isEmail().withMessage('Debe ser un email válido.').normalizeEmail(),
  check('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres.'),
  check('rol').isIn(['cajero', 'gerente', 'admin', 'cocinero']).withMessage('Rol inválido.'),
  check('id_sucursal').isInt({ gt: 0 }).withMessage('El ID de la sucursal debe ser un número entero positivo.'),
];

/**
 * @swagger
 * tags:
 *   name: Autenticación
 *   description: Gestión de usuarios y autenticación
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Iniciar sesión de usuario
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Inicio de sesión exitoso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: Datos de entrada inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Credenciales inválidas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Error del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login', loginValidationRules, authController.login);

/**
 * @swagger
 * /auth/users:
 *   post:
 *     summary: Crear un nuevo usuario (solo administradores)
 *     tags: [Autenticación]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NewVendedor'
 *     responses:
 *       201:
 *         description: Usuario creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Vendedor'
 *       400:
 *         description: Datos de entrada inválidos o usuario ya existe
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: No autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: No autorizado (solo administradores)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Error del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   get:
 *     summary: Obtener todos los usuarios (solo administradores)
 *     tags: [Autenticación]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuarios obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Vendedor'
 *       401:
 *         description: No autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: No autorizado (solo administradores)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Error del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/users', authenticateToken, authorizeRoles('admin'), createUserValidationRules, authController.createUser);
router.get('/users', authenticateToken, authorizeRoles('admin'), authController.getUsers);

module.exports = router;