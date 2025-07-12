const express = require('express');
const sucursalController = require('../controllers/sucursalController');

const router = express.Router();

// GET /api/v1/sucursales - Obtener todas las sucursales activas
router.get('/', sucursalController.getAllSucursales);

module.exports = router;