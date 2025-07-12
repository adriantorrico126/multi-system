const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authorizeRoles } = require('../middlewares/authMiddleware');
const { check } = require('express-validator');

// ... (reglas de validación para createUser)

router.post('/', authorizeRoles('admin'), /* validación */, userController.createUser);
router.get('/', authorizeRoles('admin'), userController.getUsers);

module.exports = router;