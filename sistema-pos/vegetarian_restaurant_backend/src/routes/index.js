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

// Rutas del sistema de egresos
const egresoRoutes = require('./egresoRoutes');
const categoriaEgresoRoutes = require('./categoriaEgresoRoutes');
const presupuestoEgresoRoutes = require('./presupuestoEgresoRoutes');

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

// Montar rutas del sistema de egresos
router.use('/egresos', egresoRoutes);
router.use('/categorias-egresos', categoriaEgresoRoutes);
router.use('/presupuestos-egresos', presupuestoEgresoRoutes);

module.exports = router; 