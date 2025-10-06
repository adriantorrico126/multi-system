const express = require('express');
const router = express.Router();
const reconciliacionesController = require('../controllers/reconciliacionesController');
const { authenticateToken } = require('../middlewares/authMiddleware');

// =====================================================
// RUTAS DE RECONCILIACIONES DE CAJA
// Multi-tenant por restaurante y sucursal
// =====================================================

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);

/**
 * @route POST /api/v1/reconciliaciones
 * @desc Crear nueva reconciliación
 * @access Private (Cajero, Admin)
 * @body {
 *   tipo_reconciliacion: 'efectivo' | 'completa',
 *   monto_inicial?: number,
 *   efectivo_esperado?: number,
 *   efectivo_fisico?: number,
 *   total_esperado?: number,
 *   total_registrado?: number,
 *   datos_por_metodo?: object,
 *   observaciones?: string
 * }
 */
router.post('/', reconciliacionesController.crearReconciliacion);

/**
 * @route GET /api/v1/reconciliaciones
 * @desc Obtener reconciliaciones con filtros
 * @access Private (Cajero, Admin)
 * @query {
 *   fecha_inicio?: string (YYYY-MM-DD),
 *   fecha_fin?: string (YYYY-MM-DD),
 *   id_sucursal?: number,
 *   tipo_reconciliacion?: 'efectivo' | 'completa'
 * }
 */
router.get('/', reconciliacionesController.obtenerReconciliaciones);

/**
 * @route GET /api/v1/reconciliaciones/hoy
 * @desc Obtener reconciliaciones del día actual
 * @access Private (Cajero, Admin)
 */
router.get('/hoy', reconciliacionesController.obtenerReconciliacionesHoy);

/**
 * @route GET /api/v1/reconciliaciones/resumen
 * @desc Obtener resumen de reconciliaciones por período
 * @access Private (Cajero, Admin)
 * @query {
 *   fecha_inicio?: string (YYYY-MM-DD),
 *   fecha_fin?: string (YYYY-MM-DD),
 *   id_sucursal?: number
 * }
 */
router.get('/resumen', reconciliacionesController.obtenerResumenReconciliaciones);

/**
 * @route GET /api/v1/reconciliaciones/estadisticas
 * @desc Obtener estadísticas de reconciliaciones
 * @access Private (Cajero, Admin)
 * @query {
 *   fecha_inicio?: string (YYYY-MM-DD),
 *   fecha_fin?: string (YYYY-MM-DD),
 *   id_sucursal?: number
 * }
 */
router.get('/estadisticas', reconciliacionesController.obtenerEstadisticasReconciliaciones);

/**
 * @route GET /api/v1/reconciliaciones/:id
 * @desc Obtener reconciliación específica con detalles
 * @access Private (Cajero, Admin)
 * @params { id: number }
 */
router.get('/:id', reconciliacionesController.obtenerReconciliacion);

/**
 * @route PUT /api/v1/reconciliaciones/:id
 * @desc Actualizar reconciliación
 * @access Private (Cajero, Admin)
 * @params { id: number }
 * @body {
 *   efectivo_fisico?: number,
 *   total_registrado?: number,
 *   datos_por_metodo?: object,
 *   observaciones?: string
 * }
 */
router.put('/:id', reconciliacionesController.actualizarReconciliacion);

/**
 * @route DELETE /api/v1/reconciliaciones/:id
 * @desc Eliminar reconciliación
 * @access Private (Admin)
 * @params { id: number }
 */
router.delete('/:id', reconciliacionesController.eliminarReconciliacion);

module.exports = router;
