const express = require('express');
const router = express.Router();
const {
  crearPensionado,
  obtenerPensionados,
  obtenerPensionadoPorId,
  actualizarPensionado,
  eliminarPensionado,
  obtenerEstadisticasPensionado,
  obtenerPensionadosActivos,
  verificarConsumo,
  registrarConsumo,
  obtenerConsumos,
  generarPrefactura,
  obtenerPrefacturas,
  obtenerEstadisticasGenerales
} = require('../controllers/pensionadoController');
const { authenticateToken } = require('../middlewares/authMiddleware');

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);

// =============================================
// RUTAS PARA GESTIÓN DE PENSIONADOS
// =============================================

/**
 * @route   POST /api/v1/pensionados
 * @desc    Crear un nuevo pensionado
 * @access  Private
 */
router.post('/', crearPensionado);

/**
 * @route   GET /api/v1/pensionados
 * @desc    Obtener todos los pensionados con filtros opcionales
 * @access  Private
 * @query   estado, tipo_cliente, fecha_desde, fecha_hasta
 */
router.get('/', obtenerPensionados);

/**
 * @route   GET /api/v1/pensionados/activos
 * @desc    Obtener pensionados activos para una fecha específica
 * @access  Private
 * @query   fecha (opcional, por defecto fecha actual)
 */
router.get('/activos', obtenerPensionadosActivos);

/**
 * @route   GET /api/v1/pensionados/estadisticas
 * @desc    Obtener estadísticas generales del sistema de pensionados
 * @access  Private
 * @query   fecha_desde, fecha_hasta
 */
router.get('/estadisticas', obtenerEstadisticasGenerales);

/**
 * @route   GET /api/v1/pensionados/:id
 * @desc    Obtener un pensionado por ID
 * @access  Private
 */
router.get('/:id', obtenerPensionadoPorId);

/**
 * @route   PUT /api/v1/pensionados/:id
 * @desc    Actualizar un pensionado
 * @access  Private
 */
router.put('/:id', actualizarPensionado);

/**
 * @route   DELETE /api/v1/pensionados/:id
 * @desc    Eliminar un pensionado (soft delete)
 * @access  Private
 */
router.delete('/:id', eliminarPensionado);

/**
 * @route   GET /api/v1/pensionados/:id/estadisticas
 * @desc    Obtener estadísticas detalladas de un pensionado
 * @access  Private
 */
router.get('/:id/estadisticas', obtenerEstadisticasPensionado);

/**
 * @route   POST /api/v1/pensionados/:id/verificar-consumo
 * @desc    Verificar si un pensionado puede consumir en una fecha específica
 * @access  Private
 * @body    { fecha_consumo, tipo_comida }
 */
router.post('/:id/verificar-consumo', verificarConsumo);

// =============================================
// RUTAS PARA GESTIÓN DE CONSUMO
// =============================================

/**
 * @route   POST /api/v1/pensionados/consumo
 * @desc    Registrar un consumo de pensionado
 * @access  Private
 * @body    { id_pensionado, fecha_consumo, id_mesa, id_venta, tipo_comida, productos_consumidos, total_consumido, observaciones }
 */
router.post('/consumo', registrarConsumo);

/**
 * @route   GET /api/v1/pensionados/:id/consumos
 * @desc    Obtener consumos de un pensionado en un rango de fechas
 * @access  Private
 * @query   fecha_desde, fecha_hasta
 */
router.get('/:id/consumos', obtenerConsumos);

// =============================================
// RUTAS PARA GESTIÓN DE PREFACTURAS
// =============================================

/**
 * @route   POST /api/v1/pensionados/:id/prefacturas
 * @desc    Generar prefactura consolidada para un pensionado
 * @access  Private
 * @body    { fecha_inicio_periodo, fecha_fin_periodo, observaciones }
 */
router.post('/:id/prefacturas', generarPrefactura);

/**
 * @route   GET /api/v1/pensionados/:id/prefacturas
 * @desc    Obtener prefacturas de un pensionado
 * @access  Private
 * @query   estado, fecha_desde, fecha_hasta
 */
router.get('/:id/prefacturas', obtenerPrefacturas);

module.exports = router;
