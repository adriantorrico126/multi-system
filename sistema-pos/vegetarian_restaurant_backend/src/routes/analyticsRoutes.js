const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');
const { planMiddleware } = require('../middlewares/planMiddleware');

/**
 * RUTAS DE ANALYTICS AVANZADOS
 * Funcionalidades avanzadas para análisis del historial de ventas
 */

// Middleware común: autenticación requerida
router.use(authenticateToken);

// Obtener métricas avanzadas de ventas
// Requiere plan Profesional o superior
router.get('/sales/metrics', 
  authorizeRoles('admin', 'cajero', 'super_admin'),
  planMiddleware('analytics-avanzados', 'profesional'),
  analyticsController.getAdvancedSalesMetrics
);

// Obtener análisis detallado de productos
// Requiere plan Profesional o superior
router.get('/products/analysis',
  authorizeRoles('admin', 'cajero', 'super_admin'),
  planMiddleware('analytics-productos', 'profesional'),
  analyticsController.getProductAnalytics
);

// Obtener tendencias temporales
// Requiere plan Avanzado o superior
router.get('/trends/temporal',
  authorizeRoles('admin', 'cajero', 'super_admin'),
  planMiddleware('tendencias-temporales', 'avanzado'),
  analyticsController.getTimeTrends
);

// Exportar datos avanzados
// Requiere plan Avanzado o superior
router.get('/export/advanced',
  authorizeRoles('admin', 'super_admin'),
  planMiddleware('exportacion-avanzada', 'avanzado'),
  analyticsController.exportAdvancedData
);

// Ruta de prueba para verificar disponibilidad del servicio
router.get('/health', (req, res) => {
  res.status(200).json({
    message: 'Servicio de Analytics Avanzados activo',
    timestamp: new Date().toISOString(),
    user: req.user?.username || 'No autenticado'
  });
});

module.exports = router;
