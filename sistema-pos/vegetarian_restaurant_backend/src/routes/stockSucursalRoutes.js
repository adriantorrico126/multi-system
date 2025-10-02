const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');
const StockSucursalController = require('../controllers/stockSucursalController');

// Middleware de autenticación para todas las rutas
router.use(authenticateToken);

// ==================== RUTAS DE STOCK POR SUCURSAL ====================

// IMPORTANTE: Las rutas específicas deben ir ANTES que las rutas con parámetros
// para evitar conflictos de enrutamiento

/**
 * GET /api/v1/stock-sucursal/alerts
 * Obtiene alertas de stock (productos con stock bajo, crítico o sin stock)
 */
router.get('/alerts',
  authorizeRoles('admin', 'super_admin'),
  StockSucursalController.getStockAlerts
);

/**
 * GET /api/v1/stock-sucursal/reports
 * Obtiene reportes de stock con filtros opcionales
 */
router.get('/reports',
  authorizeRoles('admin', 'super_admin'),
  StockSucursalController.getStockReports
);

/**
 * GET /api/v1/stock-sucursal/consolidated
 * Obtiene un resumen consolidado del stock de todas las sucursales
 */
router.get('/consolidated',
  authorizeRoles('admin', 'super_admin'),
  StockSucursalController.getConsolidatedStock
);

/**
 * GET /api/v1/stock-sucursal/compare/:sucursal1/:sucursal2
 * Compara el stock entre dos sucursales
 */
router.get('/compare/:sucursal1/:sucursal2',
  authorizeRoles('admin', 'super_admin'),
  StockSucursalController.compareStockBetweenBranches
);

/**
 * POST /api/v1/stock-sucursal/transfer
 * Transfiere stock entre sucursales
 */
router.post('/transfer',
  authorizeRoles('admin', 'super_admin'),
  StockSucursalController.transferStockBetweenBranches
);

/**
 * GET /api/v1/stock-sucursal/:id_sucursal
 * Obtiene el stock de todos los productos para una sucursal específica
 */
router.get('/:id_sucursal', 
  authorizeRoles('admin', 'super_admin'),
  StockSucursalController.getStockByBranch
);

/**
 * PUT /api/v1/stock-sucursal/:id_producto/:id_sucursal
 * Actualiza el stock de un producto específico en una sucursal
 */
router.put('/:id_producto/:id_sucursal',
  authorizeRoles('admin', 'super_admin'),
  StockSucursalController.updateStockByBranch
);

/**
 * GET /api/v1/stock-sucursal/:id_sucursal/product/:id_producto
 * Obtiene el stock de un producto específico en una sucursal
 */
router.get('/:id_sucursal/product/:id_producto',
  authorizeRoles('admin', 'super_admin'),
  StockSucursalController.getProductStockByBranch
);

/**
 * POST /api/v1/stock-sucursal/:id_sucursal/product/:id_producto
 * Crea o inicializa el stock de un producto en una sucursal
 */
router.post('/:id_sucursal/product/:id_producto',
  authorizeRoles('admin', 'super_admin'),
  StockSucursalController.createProductStockInBranch
);

/**
 * DELETE /api/v1/stock-sucursal/:id_sucursal/product/:id_producto
 * Elimina el stock de un producto en una sucursal (marca como inactivo)
 */
router.delete('/:id_sucursal/product/:id_producto',
  authorizeRoles('admin', 'super_admin'),
  StockSucursalController.deleteProductStockInBranch
);


module.exports = router;
