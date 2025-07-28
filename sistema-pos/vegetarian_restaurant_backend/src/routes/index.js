const express = require('express');
const router = express.Router();

// Importar todas las rutas
const authRoutes = require('./authRoutes');
const ventaRoutes = require('./ventaRoutes');
const productoRoutes = require('./productoRoutes');
const categoriaRoutes = require('./categoriaRoutes');
const mesaRoutes = require('./mesaRoutes');
const sucursalRoutes = require('./sucursalRoutes');
const soporteRoutes = require('./soporteRoutes');
const grupoMesaRoutes = require('./grupoMesaRoutes');
const modificadorRoutes = require('./modificadorRoutes');
const reservaRoutes = require('./reservaRoutes');

// Montar las rutas
router.use('/auth', authRoutes);
router.use('/ventas', ventaRoutes);
router.use('/productos', productoRoutes);
router.use('/categorias', categoriaRoutes);
router.use('/mesas', mesaRoutes);
router.use('/sucursales', sucursalRoutes);
router.use('/soporte', soporteRoutes);
router.use('/grupos-mesas', grupoMesaRoutes);
router.use('/modificadores', modificadorRoutes);
router.use('/reservas', reservaRoutes);

module.exports = router; 