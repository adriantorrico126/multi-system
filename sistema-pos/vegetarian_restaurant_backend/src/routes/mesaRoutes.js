const express = require('express');
const mesaController = require('../controllers/mesaController');
const { authenticateToken } = require('../middlewares/authMiddleware');

const router = express.Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticateToken);

// ===================================
// 🔹 RUTAS DE CONFIGURACIÓN DE MESAS (MÁS ESPECÍFICAS PRIMERO)
// ===================================

// Obtener configuración de mesas
router.get('/configuracion/sucursal/:id_sucursal', mesaController.getConfiguracionMesas);

// Crear nueva mesa
router.post('/configuracion', mesaController.crearMesa);

// Actualizar mesa
router.put('/configuracion/:id_mesa', mesaController.actualizarMesa);

// Eliminar mesa
router.delete('/configuracion/:id_mesa', mesaController.eliminarMesa);

// ===================================
// 🔹 RUTAS OPERATIVAS DE MESAS
// ===================================

// Obtener todas las mesas de una sucursal
router.get('/sucursal/:id_sucursal', mesaController.getMesas);

// Obtener estadísticas de mesas
router.get('/sucursal/:id_sucursal/estadisticas', mesaController.getEstadisticasMesas);

// Abrir mesa (iniciar servicio)
router.post('/abrir', mesaController.abrirMesa);

// Agregar productos a mesa existente
router.post('/agregar-productos', mesaController.agregarProductosAMesa);

// Generar prefactura de mesa
router.get('/:id_mesa/prefactura', mesaController.generarPrefactura);

// Obtener historial de mesa
router.get('/:id_mesa/historial', mesaController.getHistorialMesa);

// Cerrar mesa (finalizar servicio)
router.put('/:id_mesa/cerrar', mesaController.cerrarMesa);

// Liberar mesa (marcar como libre sin facturar)
router.patch('/:id_mesa/liberar', mesaController.liberarMesa);

// Obtener una mesa específica (MÁS ESPECÍFICA AL FINAL)
router.get('/:numero/sucursal/:id_sucursal', mesaController.getMesa);

module.exports = router; 