const express = require('express');
const router = express.Router();
const ventaController = require('../controllers/ventaController');
const { authenticateToken, authorizeRoles, ensureTenantContext } = require('../middlewares/authMiddleware'); // Importar middlewares

// Registrar una nueva venta
router.post('/', authenticateToken, authorizeRoles('admin', 'cajero', 'super_admin'), ensureTenantContext, ventaController.createVenta);

// Obtener pedidos para la cocina
router.get('/cocina', authenticateToken, authorizeRoles('cocinero', 'admin', 'cajero', 'super_admin'), ensureTenantContext, ventaController.getPedidosParaCocina);

// Actualizar estado de pedido
router.put('/:id/status', authenticateToken, authorizeRoles('cocinero', 'admin', 'super_admin'), ensureTenantContext, ventaController.actualizarEstadoPedido);

// Actualizar estado de venta (nuevo endpoint profesional)
router.patch('/:id/estado', authenticateToken, authorizeRoles('cocinero', 'admin', 'super_admin'), ensureTenantContext, ventaController.updateEstadoVenta);

// Cerrar mesa con facturación
router.post('/cerrar-mesa', authenticateToken, authorizeRoles('admin', 'cajero', 'super_admin'), ensureTenantContext, ventaController.cerrarMesaConFactura);

// Obtener datos de arqueo
router.get('/arqueo', authenticateToken, authorizeRoles('admin', 'super_admin'), ensureTenantContext, ventaController.getArqueoData);

// Obtener ventas ordenadas por fecha
router.get('/ordenadas', authenticateToken, authorizeRoles('admin', 'cajero', 'super_admin'), ensureTenantContext, ventaController.getVentasOrdenadas);

// Verificar fechas de ventas (para debugging)
router.get('/verificar-fechas', authenticateToken, authorizeRoles('admin', 'super_admin'), ensureTenantContext, ventaController.verificarFechasVentas);

// Obtener ventas ordenadas por fecha (para debugging)
router.get('/por-fecha', authenticateToken, authorizeRoles('admin', 'super_admin'), ensureTenantContext, ventaController.getVentasPorFecha);

// Verificar duplicados por fecha (para debugging)
router.get('/verificar-duplicados', authenticateToken, authorizeRoles('admin', 'super_admin'), ensureTenantContext, ventaController.verificarDuplicadosFecha);

// Corregir fechas de ventas (para debugging)
router.post('/corregir-fechas', authenticateToken, authorizeRoles('admin', 'super_admin'), ensureTenantContext, ventaController.corregirFechasVentas);

// Verificar ventas de hoy (para debugging)
router.get('/ventas-hoy', authenticateToken, authorizeRoles('admin', 'super_admin'), ensureTenantContext, ventaController.getVentasHoy);

// Exportar ventas filtradas (solo admin)
router.get('/export', authenticateToken, authorizeRoles('admin', 'super_admin'), ensureTenantContext, ventaController.exportVentasFiltradas);

module.exports = router; 