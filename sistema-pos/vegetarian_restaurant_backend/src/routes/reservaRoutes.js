const express = require('express');
const router = express.Router();
const reservaController = require('../controllers/reservaController');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');

console.log('🔍 [reservaRoutes] Inicializando rutas de reservas');

// Ruta de prueba para verificar que las rutas están funcionando (SIN AUTENTICACIÓN)
router.get('/test', (req, res) => {
  console.log('🔍 [reservaRoutes] Ruta de prueba /test llamada');
  res.json({ message: 'Rutas de reservas funcionando correctamente' });
});

// Middleware para verificar roles permitidos
const rolesPermitidos = ['admin', 'cajero', 'mesero', 'super_admin'];

// Aplicar autenticación a todas las rutas EXCEPTO /test
router.use(authenticateToken);
router.use(authorizeRoles('admin', 'cajero', 'mesero', 'super_admin'));

// Rutas más específicas primero
// Obtener disponibilidad de mesas
router.get('/sucursal/:id_sucursal/disponibilidad', reservaController.getDisponibilidadMesas);
console.log('🔍 [reservaRoutes] Ruta GET /sucursal/:id_sucursal/disponibilidad registrada');

// Obtener estadísticas de reservas
router.get('/sucursal/:id_sucursal/estadisticas', reservaController.getEstadisticasReservas);
console.log('🔍 [reservaRoutes] Ruta GET /sucursal/:id_sucursal/estadisticas registrada');

// Obtener reservas por mesa
router.get('/mesa/:id_mesa', reservaController.getReservasByMesa);
console.log('🔍 [reservaRoutes] Ruta GET /mesa/:id_mesa registrada');

// Obtener todas las reservas de una sucursal
router.get('/sucursal/:id_sucursal', reservaController.getReservas);
console.log('🔍 [reservaRoutes] Ruta GET /sucursal/:id_sucursal registrada');

// Obtener todas las reservas del restaurante
router.get('/', reservaController.getReservasRestaurante);
console.log('🔍 [reservaRoutes] Ruta GET / registrada');

// Cancelar una reserva
router.patch('/:id_reserva/cancelar', reservaController.cancelarReserva);
console.log('🔍 [reservaRoutes] Ruta PATCH /:id_reserva/cancelar registrada');

// Rutas más generales después
// Crear una nueva reserva
router.post('/', reservaController.crearReserva);
console.log('🔍 [reservaRoutes] Ruta POST / registrada');

// Obtener una reserva específica
router.get('/:id_reserva', reservaController.getReserva);
console.log('🔍 [reservaRoutes] Ruta GET /:id_reserva registrada');

// Actualizar una reserva
router.put('/:id_reserva', reservaController.actualizarReserva);
console.log('🔍 [reservaRoutes] Ruta PUT /:id_reserva registrada');

// Eliminar una reserva
router.delete('/:id_reserva', reservaController.eliminarReserva);
console.log('🔍 [reservaRoutes] Ruta DELETE /:id_reserva registrada');

// Limpiar estados de mesas
router.post('/limpiar-estados-mesas', reservaController.limpiarEstadosMesas);
console.log('🔍 [reservaRoutes] Ruta POST /limpiar-estados-mesas registrada');

console.log('🔍 [reservaRoutes] Todas las rutas de reservas registradas correctamente');

module.exports = router; 