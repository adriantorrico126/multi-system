const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');
const { check } = require('express-validator');

// ... (reglas de validación para createUser)

router.post('/', authenticateToken, authorizeRoles('admin'), userController.createUser);
router.get('/', authenticateToken, authorizeRoles('admin'), userController.getUsers);
router.delete('/:id', authenticateToken, authorizeRoles('admin'), userController.deleteUser);

module.exports = router;