const express = require('express');
const mesaController = require('../controllers/mesaController');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');

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

// Marcar mesa como pagada (nuevo flujo)
router.post('/marcar-pagado', mesaController.marcarMesaComoPagada);

// Asignar mesa a mesero (solo mesero)
router.post('/:id_mesa/asignar', authorizeRoles('mesero'), mesaController.asignarMesa);

// Liberar mesa (mesero o admin/cajero)
router.post('/:id_mesa/liberar-mesero', authorizeRoles('mesero', 'admin', 'cajero'), mesaController.liberarMesaMesero);

// Consultar mesas asignadas al mesero autenticado
router.get('/mis-mesas', authorizeRoles('mesero'), mesaController.getMesasAsignadas);

// División de cuenta (split bill)
router.post('/:id_mesa/split-bill', authorizeRoles('mesero', 'admin', 'cajero', 'super_admin'), mesaController.splitBill);

// Transferir ítem individual entre mesas
router.post('/transferir-item', authorizeRoles('mesero', 'admin', 'cajero', 'super_admin'), mesaController.transferirItem);
// Transferir orden completa entre mesas
router.post('/transferir-orden', authorizeRoles('mesero', 'admin', 'cajero', 'super_admin'), mesaController.transferirOrden);

// Eliminar producto (detalle_ventas) de una orden
router.delete('/detalle/:id_detalle', authorizeRoles('mesero', 'admin', 'cajero', 'super_admin'), mesaController.eliminarDetalleVenta);
// Editar modificadores/observaciones de un producto (detalle_ventas)
router.patch('/detalle/:id_detalle', authorizeRoles('mesero', 'admin', 'cajero', 'super_admin'), mesaController.editarDetalleVenta);

// Endpoint para listar todas las mesas (con query params)
router.get('/', authorizeRoles('admin', 'cajero', 'mesero', 'super_admin'), mesaController.listarMesas);

// Obtener una mesa específica (MÁS ESPECÍFICA AL FINAL)
router.get('/:numero/sucursal/:id_sucursal', mesaController.getMesa);

// =============================
// NUEVAS RUTAS AVANZADAS DE MESAS
// =============================
// Crear grupo de mesas (unión)
router.post('/grupo', authorizeRoles('admin', 'cajero', 'super_admin'), mesaController.crearGrupoMesas);
// Reasignar mesero a mesa (admin/cajero)
router.patch('/:id_mesa/mesero', authorizeRoles('admin', 'cajero', 'super_admin'), mesaController.reasignarMesero);

module.exports = router; 