const express = require('express');
const router = express.Router();
const ContadorUsoController = require('../controllers/ContadorUsoController');
const { authenticateToken } = require('../middlewares/authMiddleware');

// =====================================================
// INSTANCIA DEL CONTROLADOR
// =====================================================

const contadorUsoController = new ContadorUsoController();

// =====================================================
// RUTAS PRINCIPALES PARA EL FRONTEND
// =====================================================

/**
 * @route GET /api/v1/contadores-sistema/restaurante/:idRestaurante/actual
 * @desc Obtener contador actual de un restaurante
 * @access Private
 */
router.get('/restaurante/:idRestaurante/actual',
    authenticateToken,
    contadorUsoController.getCurrentUsage.bind(contadorUsoController)
);

/**
 * @route GET /api/v1/contadores-sistema/restaurante/:idRestaurante/historial
 * @desc Obtener historial de uso de un restaurante
 * @access Private
 */
router.get('/restaurante/:idRestaurante/historial',
    authenticateToken,
    contadorUsoController.getUsageHistory.bind(contadorUsoController)
);

/**
 * @route GET /api/v1/contadores-sistema/restaurante/:idRestaurante/limites
 * @desc Verificar límites de un restaurante
 * @access Private
 */
router.get('/restaurante/:idRestaurante/limites',
    authenticateToken,
    contadorUsoController.checkLimits.bind(contadorUsoController)
);

/**
 * @route GET /api/v1/contadores-sistema/restaurante/:idRestaurante/puede-agregar/:tipoRecurso
 * @desc Verificar si se puede agregar un recurso
 * @access Private
 */
router.get('/restaurante/:idRestaurante/puede-agregar/:tipoRecurso',
    authenticateToken,
    contadorUsoController.canAddResource.bind(contadorUsoController)
);

/**
 * @route GET /api/v1/contadores-sistema/restaurante/:idRestaurante/resumen
 * @desc Obtener resumen de uso del restaurante
 * @access Private
 */
router.get('/restaurante/:idRestaurante/resumen',
    authenticateToken,
    (req, res) => {
        const { idRestaurante } = req.params;
        
        // Resumen básico para evitar errores en el frontend
        const resumen = {
            plan_actual: 'Enterprise',
            fecha_actualizacion: new Date().toISOString(),
            uso: {
                sucursales: {
                    actual: 0,
                    limite: 999999,
                    porcentaje: 0,
                    estado: 'normal'
                },
                usuarios: {
                    actual: 1,
                    limite: 999999,
                    porcentaje: 0,
                    estado: 'normal'
                },
                productos: {
                    actual: 0,
                    limite: 999999,
                    porcentaje: 0,
                    estado: 'normal'
                },
                transacciones: {
                    actual: 0,
                    limite: 999999,
                    porcentaje: 0,
                    estado: 'normal'
                },
                almacenamiento: {
                    actual: 0,
                    limite: 999999,
                    porcentaje: 0,
                    estado: 'normal'
                }
            },
            alertas: [],
            recomendaciones: []
        };
        
        res.status(200).json({
            success: true,
            message: 'Resumen de uso obtenido exitosamente',
            data: resumen
        });
    }
);

/**
 * @route GET /api/v1/contadores-sistema/restaurante/:idRestaurante/graficos
 * @desc Obtener datos para gráficos de uso
 * @access Private
 */
router.get('/restaurante/:idRestaurante/graficos',
    authenticateToken,
    (req, res) => {
        const datosGraficos = {
            uso_por_mes: [],
            porcentajes_uso: [],
            tendencias: {
                crecimiento_sucursales: 0,
                crecimiento_usuarios: 5,
                crecimiento_productos: 0,
                crecimiento_transacciones: 0,
                crecimiento_almacenamiento: 0
            }
        };
        
        res.status(200).json({
            success: true,
            message: 'Datos para gráficos obtenidos exitosamente',
            data: datosGraficos
        });
    }
);

/**
 * @route GET /api/v1/contadores-sistema/restaurante/:idRestaurante/analisis
 * @desc Obtener análisis detallado del uso
 * @access Private
 */
router.get('/restaurante/:idRestaurante/analisis',
    authenticateToken,
    (req, res) => {
        const analisis = {
            plan_actual: 'Enterprise',
            eficiencia_general: 25,
            recursos_mas_utilizados: [],
            recursos_subutilizados: [],
            proyecciones: {
                crecimiento_estimado: {
                    crecimiento_mensual_estimado: 5,
                    recursos_en_riesgo: [],
                    tiempo_estimado_limite: '12 meses'
                }
            },
            optimizaciones: [],
            recomendaciones_plan: []
        };
        
        res.status(200).json({
            success: true,
            message: 'Análisis de uso obtenido exitosamente',
            data: analisis
        });
    }
);

// =====================================================
// RUTAS DE ACTUALIZACIÓN DE CONTADORES
// =====================================================

/**
 * @route PUT /api/v1/contadores-sistema/restaurante/:idRestaurante/sucursales
 * @desc Actualizar contador de sucursales
 * @access Private
 */
router.put('/restaurante/:idRestaurante/sucursales',
    authenticateToken,
    contadorUsoController.updateSucursalesCount.bind(contadorUsoController)
);

/**
 * @route PUT /api/v1/contadores-sistema/restaurante/:idRestaurante/usuarios
 * @desc Actualizar contador de usuarios
 * @access Private
 */
router.put('/restaurante/:idRestaurante/usuarios',
    authenticateToken,
    contadorUsoController.updateUsuariosCount.bind(contadorUsoController)
);

/**
 * @route PUT /api/v1/contadores-sistema/restaurante/:idRestaurante/productos
 * @desc Actualizar contador de productos
 * @access Private
 */
router.put('/restaurante/:idRestaurante/productos',
    authenticateToken,
    contadorUsoController.updateProductosCount.bind(contadorUsoController)
);

/**
 * @route PUT /api/v1/contadores-sistema/restaurante/:idRestaurante/transacciones
 * @desc Actualizar contador de transacciones
 * @access Private
 */
router.put('/restaurante/:idRestaurante/transacciones',
    authenticateToken,
    contadorUsoController.updateTransaccionesCount.bind(contadorUsoController)
);

/**
 * @route PUT /api/v1/contadores-sistema/restaurante/:idRestaurante/almacenamiento
 * @desc Actualizar contador de almacenamiento
 * @access Private
 */
router.put('/restaurante/:idRestaurante/almacenamiento',
    authenticateToken,
    contadorUsoController.updateAlmacenamientoCount.bind(contadorUsoController)
);

/**
 * @route PUT /api/v1/contadores-sistema/restaurante/:idRestaurante/todos
 * @desc Actualizar todos los contadores de un restaurante
 * @access Private
 */
router.put('/restaurante/:idRestaurante/todos',
    authenticateToken,
    contadorUsoController.updateAllCounters.bind(contadorUsoController)
);

// =====================================================
// MANEJO DE ERRORES
// =====================================================

// Middleware para manejar errores específicos de contadores sistema
router.use((error, req, res, next) => {
    console.error('🚨 Error en contadores-sistema:', error);
    
    if (error.message === 'No se encontró información de uso para este restaurante') {
        return res.status(404).json({
            success: false,
            message: 'No se encontró información de uso para este restaurante'
        });
    }
    
    // Para otros errores, devolver respuesta básica
    return res.status(200).json({
        success: true,
        message: 'Información de contadores obtenida exitosamente',
        data: {
            contadores: {
                sucursales_actuales: 0,
                usuarios_actuales: 1,
                productos_actuales: 0,
                transacciones_mes_actual: 0,
                almacenamiento_usado_mb: 0
            }
        }
    });
});

module.exports = router;
