const express = require('express');
const router = express.Router();
const modificadorController = require('../controllers/modificadorController');
const grupoModificadorController = require('../controllers/grupoModificadorController');
const { authenticateToken, authorizeRoles, ensureTenantContext } = require('../middlewares/authMiddleware');

// =====================================================
// RUTAS DE MODIFICADORES (Compatibilidad Legacy)
// =====================================================

// Listar modificadores de un producto (Legacy)
router.get(
  '/producto/:id_producto', 
  authenticateToken, 
  modificadorController.listarPorProducto
);

// Crear modificador simple (Legacy)
router.post(
  '/', 
  authenticateToken, 
  authorizeRoles('admin', 'gerente', 'super_admin'), 
  modificadorController.crear
);

// Asociar modificadores a un detalle de venta
router.post(
  '/detalle/:id_detalle_venta', 
  authenticateToken, 
  modificadorController.asociarAMovimiento
);

// Listar modificadores de un detalle de venta
router.get(
  '/detalle/:id_detalle_venta', 
  authenticateToken, 
  modificadorController.listarPorDetalleVenta
);

// =====================================================
// RUTAS NUEVAS - SISTEMA PROFESIONAL
// =====================================================

// Obtener grupos con modificadores de un producto (JSON anidado)
router.get(
  '/producto/:id_producto/grupos',
  authenticateToken,
  ensureTenantContext,
  modificadorController.obtenerGruposPorProducto
);

// Obtener modificadores completos de un producto
router.get(
  '/producto/:id_producto/completos',
  authenticateToken,
  ensureTenantContext,
  modificadorController.obtenerModificadoresCompletos
);

// Crear modificador completo (con todos los campos)
router.post(
  '/completo',
  authenticateToken,
  authorizeRoles('admin', 'gerente', 'super_admin'),
  ensureTenantContext,
  modificadorController.crearCompleto
);

// Actualizar modificador
router.put(
  '/:id_modificador',
  authenticateToken,
  authorizeRoles('admin', 'gerente', 'super_admin'),
  ensureTenantContext,
  modificadorController.actualizar
);

// Eliminar (desactivar) modificador
router.delete(
  '/:id_modificador',
  authenticateToken,
  authorizeRoles('admin', 'gerente', 'super_admin'),
  ensureTenantContext,
  modificadorController.eliminar
);

// Validar selección de modificadores (antes de agregar al carrito)
router.post(
  '/validar',
  authenticateToken,
  ensureTenantContext,
  modificadorController.validarSeleccion
);

// Verificar stock de modificadores
router.post(
  '/verificar-stock',
  authenticateToken,
  ensureTenantContext,
  modificadorController.verificarStock
);

// Actualizar stock de un modificador
router.patch(
  '/:id_modificador/stock',
  authenticateToken,
  authorizeRoles('admin', 'gerente', 'super_admin'),
  ensureTenantContext,
  modificadorController.actualizarStock
);

// Obtener estadísticas de modificadores
router.get(
  '/estadisticas',
  authenticateToken,
  authorizeRoles('admin', 'gerente', 'super_admin'),
  ensureTenantContext,
  modificadorController.obtenerEstadisticas
);

// Obtener modificadores más populares
router.get(
  '/populares',
  authenticateToken,
  authorizeRoles('admin', 'gerente', 'super_admin'),
  ensureTenantContext,
  modificadorController.obtenerMasPopulares
);

// Obtener modificadores con stock bajo
router.get(
  '/stock-bajo',
  authenticateToken,
  authorizeRoles('admin', 'gerente', 'super_admin'),
  ensureTenantContext,
  modificadorController.obtenerConStockBajo
);

// =====================================================
// RUTAS DE GRUPOS DE MODIFICADORES
// =====================================================

// Obtener todos los grupos (para administración)
router.get(
  '/grupos',
  authenticateToken,
  authorizeRoles('admin', 'gerente', 'super_admin'),
  ensureTenantContext,
  grupoModificadorController.obtenerTodos
);

// Obtener un grupo por ID
router.get(
  '/grupos/:id_grupo',
  authenticateToken,
  authorizeRoles('admin', 'gerente', 'super_admin'),
  ensureTenantContext,
  grupoModificadorController.obtenerPorId
);

// Crear grupo de modificadores
router.post(
  '/grupos',
  authenticateToken,
  authorizeRoles('admin', 'gerente', 'super_admin'),
  ensureTenantContext,
  grupoModificadorController.crear
);

// Actualizar grupo
router.put(
  '/grupos/:id_grupo',
  authenticateToken,
  authorizeRoles('admin', 'gerente', 'super_admin'),
  ensureTenantContext,
  grupoModificadorController.actualizar
);

// Eliminar (desactivar) grupo
router.delete(
  '/grupos/:id_grupo',
  authenticateToken,
  authorizeRoles('admin', 'gerente', 'super_admin'),
  ensureTenantContext,
  grupoModificadorController.eliminar
);

// Asociar grupo a producto
router.post(
  '/grupos/:id_grupo/productos/:id_producto',
  authenticateToken,
  authorizeRoles('admin', 'gerente', 'super_admin'),
  ensureTenantContext,
  grupoModificadorController.asociarAProducto
);

// Desasociar grupo de producto
router.delete(
  '/grupos/:id_grupo/productos/:id_producto',
  authenticateToken,
  authorizeRoles('admin', 'gerente', 'super_admin'),
  ensureTenantContext,
  grupoModificadorController.desasociarDeProducto
);

// Obtener grupos de un producto específico
router.get(
  '/grupos/producto/:id_producto',
  authenticateToken,
  ensureTenantContext,
  grupoModificadorController.obtenerPorProducto
);

// Obtener productos que usan un grupo
router.get(
  '/grupos/:id_grupo/productos',
  authenticateToken,
  authorizeRoles('admin', 'gerente', 'super_admin'),
  ensureTenantContext,
  grupoModificadorController.obtenerProductosDelGrupo
);

// Obtener estadísticas de un grupo
router.get(
  '/grupos/:id_grupo/estadisticas',
  authenticateToken,
  authorizeRoles('admin', 'gerente', 'super_admin'),
  ensureTenantContext,
  grupoModificadorController.obtenerEstadisticas
);

module.exports = router; 