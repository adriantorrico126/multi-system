const express = require('express');
const router = express.Router();
const ventaController = require('../controllers/ventaController');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware'); // Importar middlewares

// Registrar una nueva venta
router.post('/', ventaController.createVenta);

// Obtener pedidos para la cocina
router.get('/cocina', authenticateToken, authorizeRoles('cocinero', 'admin', 'gerente'), ventaController.getPedidosParaCocina);

// Actualizar estado de pedido
router.put('/:id/status', authenticateToken, authorizeRoles('cocinero', 'admin', 'gerente'), ventaController.actualizarEstadoPedido);

// Actualizar estado de venta (nuevo endpoint profesional)
router.patch('/:id/estado', authenticateToken, authorizeRoles('cocinero', 'admin', 'gerente'), ventaController.updateEstadoVenta);

// Cerrar mesa con facturación
router.post('/cerrar-mesa', ventaController.cerrarMesaConFactura);

// Obtener datos de arqueo
router.get('/arqueo', authenticateToken, authorizeRoles('admin', 'gerente'), ventaController.getArqueoData);

// Obtener ventas ordenadas por fecha
router.get('/ordenadas', authenticateToken, authorizeRoles('admin', 'gerente'), ventaController.getVentasOrdenadas);

// Verificar fechas de ventas (para debugging)
router.get('/verificar-fechas', authenticateToken, authorizeRoles('admin'), ventaController.verificarFechasVentas);

// Obtener ventas ordenadas por fecha (para debugging)
router.get('/por-fecha', authenticateToken, authorizeRoles('admin'), ventaController.getVentasPorFecha);

// Verificar duplicados por fecha (para debugging)
router.get('/verificar-duplicados', authenticateToken, authorizeRoles('admin'), ventaController.verificarDuplicadosFecha);

// Corregir fechas de ventas (para debugging)
router.post('/corregir-fechas', authenticateToken, authorizeRoles('admin'), ventaController.corregirFechasVentas);

// Verificar ventas de hoy (para debugging)
router.get('/ventas-hoy', authenticateToken, authorizeRoles('admin'), ventaController.getVentasHoy);

module.exports = router; 