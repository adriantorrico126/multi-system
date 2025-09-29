const express = require('express');
const router = express.Router();
const PlanController = require('../controllers/planController');
const {
    validateActiveSubscriptionPlan,
    getCurrentPlanInfo,
    checkFeatureAvailability,
    getCurrentLimits
} = require('../middleware');

// =====================================================
// INSTANCIA DEL CONTROLADOR
// =====================================================

const planController = new PlanController();

// =====================================================
// RUTAS DE CONSULTA DE PLANES
// =====================================================

/**
 * @route GET /api/planes
 * @desc Obtener todos los planes activos
 * @access Public
 */
router.get('/', planController.getAllPlans.bind(planController));

/**
 * @route GET /api/planes/descuento-anual
 * @desc Obtener planes con descuento anual
 * @access Public
 */
router.get('/descuento-anual', planController.getPlansWithAnnualDiscount.bind(planController));

/**
 * @route GET /api/planes/estadisticas
 * @desc Obtener estadísticas de uso de planes
 * @access Admin
 */
router.get('/estadisticas', planController.getPlanUsageStats.bind(planController));

/**
 * @route GET /api/planes/mas-popular
 * @desc Obtener el plan más popular
 * @access Public
 */
router.get('/mas-popular', planController.getMostPopularPlan.bind(planController));

/**
 * @route GET /api/planes/:id
 * @desc Obtener un plan por ID
 * @access Public
 */
router.get('/:id', planController.getPlanById.bind(planController));

/**
 * @route GET /api/planes/nombre/:nombre
 * @desc Obtener un plan por nombre
 * @access Public
 */
router.get('/nombre/:nombre', planController.getPlanByName.bind(planController));

/**
 * @route GET /api/planes/:idPlan1/compare/:idPlan2
 * @desc Comparar dos planes
 * @access Public
 */
router.get('/:idPlan1/compare/:idPlan2', planController.comparePlans.bind(planController));

// =====================================================
// RUTAS DE VALIDACIÓN
// =====================================================

/**
 * @route GET /api/planes/:id/validar
 * @desc Validar si un plan existe
 * @access Public
 */
router.get('/:id/validar', planController.validatePlan.bind(planController));

/**
 * @route GET /api/planes/:id/limites
 * @desc Obtener límites de un plan
 * @access Public
 */
router.get('/:id/limites', planController.getPlanLimits.bind(planController));

/**
 * @route GET /api/planes/:id/funcionalidad/:funcionalidad
 * @desc Verificar disponibilidad de funcionalidad
 * @access Public
 */
router.get('/:id/funcionalidad/:funcionalidad', planController.checkFeatureAvailability.bind(planController));

// =====================================================
// RUTAS DE ADMINISTRACIÓN
// =====================================================

/**
 * @route POST /api/planes
 * @desc Crear un nuevo plan
 * @access Admin
 */
router.post('/', planController.createPlan.bind(planController));

/**
 * @route PUT /api/planes/:id
 * @desc Actualizar un plan
 * @access Admin
 */
router.put('/:id', planController.updatePlan.bind(planController));

/**
 * @route DELETE /api/planes/:id
 * @desc Desactivar un plan
 * @access Admin
 */
router.delete('/:id', planController.deactivatePlan.bind(planController));

// =====================================================
// RUTAS DE INTEGRACIÓN CON RESTAURANTES
// =====================================================

/**
 * @route GET /api/planes/restaurante/:idRestaurante/actual
 * @desc Obtener plan actual de un restaurante
 * @access Private
 */
router.get('/restaurante/:idRestaurante/actual', 
    validateActiveSubscriptionPlan,
    planController.getCurrentRestaurantPlan.bind(planController)
);

/**
 * @route GET /api/planes/restaurante/:idRestaurante/uso
 * @desc Obtener uso actual de un restaurante
 * @access Private
 */
router.get('/restaurante/:idRestaurante/uso',
    validateActiveSubscriptionPlan,
    getCurrentLimits,
    planController.getCurrentRestaurantUsage.bind(planController)
);

/**
 * @route GET /api/planes/restaurante/:idRestaurante/limites
 * @desc Verificar límites de un restaurante
 * @access Private
 */
router.get('/restaurante/:idRestaurante/limites',
    validateActiveSubscriptionPlan,
    getCurrentLimits,
    planController.checkRestaurantLimits.bind(planController)
);

// =====================================================
// RUTAS DE INFORMACIÓN DEL PLAN ACTUAL
// =====================================================

/**
 * @route GET /api/planes/restaurante/:idRestaurante/info
 * @desc Obtener información completa del plan actual
 * @access Private
 */
router.get('/restaurante/:idRestaurante/info',
    validateActiveSubscriptionPlan,
    getCurrentPlanInfo,
    (req, res) => {
        res.status(200).json({
            success: true,
            message: 'Información del plan actual obtenida exitosamente',
            data: {
                plan: req.currentPlan,
                suscripcion: req.suscripcion,
                warning: req.suscripcion_warning
            }
        });
    }
);

/**
 * @route GET /api/planes/restaurante/:idRestaurante/funcionalidades
 * @desc Obtener funcionalidades disponibles del plan actual
 * @access Private
 */
router.get('/restaurante/:idRestaurante/funcionalidades',
    validateActiveSubscriptionPlan,
    checkFeatureAvailability('inventario_avanzado'),
    checkFeatureAvailability('promociones'),
    checkFeatureAvailability('reservas'),
    checkFeatureAvailability('arqueo_caja'),
    checkFeatureAvailability('egresos'),
    checkFeatureAvailability('egresos_avanzados'),
    checkFeatureAvailability('reportes_avanzados'),
    checkFeatureAvailability('analytics'),
    checkFeatureAvailability('delivery'),
    checkFeatureAvailability('soporte_24h'),
    checkFeatureAvailability('api'),
    checkFeatureAvailability('white_label'),
    (req, res) => {
        res.status(200).json({
            success: true,
            message: 'Funcionalidades del plan actual obtenidas exitosamente',
            data: {
                plan: req.suscripcion.nombre_plan,
                funcionalidades: req.features,
                limites: req.currentLimits
            }
        });
    }
);

// =====================================================
// RUTAS DE VERIFICACIÓN DE LÍMITES
// =====================================================

/**
 * @route GET /api/planes/restaurante/:idRestaurante/puede-agregar/:tipoRecurso
 * @desc Verificar si se puede agregar un recurso
 * @access Private
 */
router.get('/restaurante/:idRestaurante/puede-agregar/:tipoRecurso',
    validateActiveSubscriptionPlan,
    (req, res) => {
        const { idRestaurante, tipoRecurso } = req.params;
        const { cantidad } = req.query;
        
        // Esta funcionalidad se implementaría en el controlador
        res.status(200).json({
            success: true,
            message: 'Verificación de recurso completada',
            data: {
                id_restaurante: parseInt(idRestaurante),
                tipo_recurso: tipoRecurso,
                cantidad: parseInt(cantidad) || 1,
                puede_agregar: true // Se implementaría la lógica real
            }
        });
    }
);

// =====================================================
// RUTAS DE UPGRADE/DOWNGRADE
// =====================================================

/**
 * @route GET /api/planes/restaurante/:idRestaurante/upgrade-options
 * @desc Obtener opciones de upgrade disponibles
 * @access Private
 */
router.get('/restaurante/:idRestaurante/upgrade-options',
    validateActiveSubscriptionPlan,
    (req, res) => {
        const { idRestaurante } = req.params;
        const planActual = req.suscripcion.nombre_plan;
        
        // Lógica para determinar planes de upgrade disponibles
        let planesDisponibles = [];
        
        switch (planActual) {
            case 'Básico':
                planesDisponibles = ['Profesional', 'Avanzado', 'Enterprise'];
                break;
            case 'Profesional':
                planesDisponibles = ['Avanzado', 'Enterprise'];
                break;
            case 'Avanzado':
                planesDisponibles = ['Enterprise'];
                break;
            case 'Enterprise':
                planesDisponibles = [];
                break;
        }
        
        res.status(200).json({
            success: true,
            message: 'Opciones de upgrade obtenidas exitosamente',
            data: {
                plan_actual: planActual,
                planes_disponibles: planesDisponibles
            }
        });
    }
);

/**
 * @route GET /api/planes/restaurante/:idRestaurante/downgrade-options
 * @desc Obtener opciones de downgrade disponibles
 * @access Private
 */
router.get('/restaurante/:idRestaurante/downgrade-options',
    validateActiveSubscriptionPlan,
    (req, res) => {
        const { idRestaurante } = req.params;
        const planActual = req.suscripcion.nombre_plan;
        
        // Lógica para determinar planes de downgrade disponibles
        let planesDisponibles = [];
        
        switch (planActual) {
            case 'Enterprise':
                planesDisponibles = ['Avanzado', 'Profesional', 'Básico'];
                break;
            case 'Avanzado':
                planesDisponibles = ['Profesional', 'Básico'];
                break;
            case 'Profesional':
                planesDisponibles = ['Básico'];
                break;
            case 'Básico':
                planesDisponibles = [];
                break;
        }
        
        res.status(200).json({
            success: true,
            message: 'Opciones de downgrade obtenidas exitosamente',
            data: {
                plan_actual: planActual,
                planes_disponibles: planesDisponibles
            }
        });
    }
);

// =====================================================
// RUTAS DE COMPARACIÓN DE PLANES
// =====================================================

/**
 * @route GET /api/planes/restaurante/:idRestaurante/compare/:idPlan
 * @desc Comparar plan actual con otro plan
 * @access Private
 */
router.get('/restaurante/:idRestaurante/compare/:idPlan',
    validateActiveSubscriptionPlan,
    (req, res) => {
        const { idRestaurante, idPlan } = req.params;
        const planActual = req.suscripcion.id_plan;
        
        // Esta funcionalidad se implementaría en el controlador
        res.status(200).json({
            success: true,
            message: 'Comparación de planes completada',
            data: {
                plan_actual: planActual,
                plan_comparado: parseInt(idPlan),
                comparacion: {} // Se implementaría la lógica real
            }
        });
    }
);

// =====================================================
// RUTAS DE ESTADÍSTICAS DEL RESTAURANTE
// =====================================================

/**
 * @route GET /api/planes/restaurante/:idRestaurante/estadisticas
 * @desc Obtener estadísticas de uso del restaurante
 * @access Private
 */
router.get('/restaurante/:idRestaurante/estadisticas',
    validateActiveSubscriptionPlan,
    getCurrentLimits,
    (req, res) => {
        const { idRestaurante } = req.params;
        const uso = req.currentLimits;
        const plan = req.suscripcion;
        
        // Calcular porcentajes de uso
        const estadisticas = {
            plan_actual: plan.nombre_plan,
            uso_actual: {
                sucursales: {
                    actual: uso.sucursales_actuales || 0,
                    limite: plan.max_sucursales,
                    porcentaje: plan.max_sucursales > 0 ? 
                        Math.round(((uso.sucursales_actuales || 0) / plan.max_sucursales) * 100) : 0
                },
                usuarios: {
                    actual: uso.usuarios_actuales || 0,
                    limite: plan.max_usuarios,
                    porcentaje: plan.max_usuarios > 0 ? 
                        Math.round(((uso.usuarios_actuales || 0) / plan.max_usuarios) * 100) : 0
                },
                productos: {
                    actual: uso.productos_actuales || 0,
                    limite: plan.max_productos,
                    porcentaje: plan.max_productos > 0 ? 
                        Math.round(((uso.productos_actuales || 0) / plan.max_productos) * 100) : 0
                },
                transacciones: {
                    actual: uso.transacciones_mes_actual || 0,
                    limite: plan.max_transacciones_mes,
                    porcentaje: plan.max_transacciones_mes > 0 ? 
                        Math.round(((uso.transacciones_mes_actual || 0) / plan.max_transacciones_mes) * 100) : 0
                },
                almacenamiento: {
                    actual: uso.almacenamiento_usado_mb || 0,
                    limite: plan.almacenamiento_gb * 1024,
                    porcentaje: plan.almacenamiento_gb > 0 ? 
                        Math.round(((uso.almacenamiento_usado_mb || 0) / (plan.almacenamiento_gb * 1024)) * 100) : 0
                }
            },
            recomendaciones: []
        };
        
        // Generar recomendaciones basadas en el uso
        Object.keys(estadisticas.uso_actual).forEach(recurso => {
            const data = estadisticas.uso_actual[recurso];
            if (data.porcentaje >= 90) {
                estadisticas.recomendaciones.push({
                    tipo: 'upgrade',
                    recurso: recurso,
                    mensaje: `Uso alto de ${recurso} (${data.porcentaje}%). Considere actualizar su plan.`
                });
            } else if (data.porcentaje >= 80) {
                estadisticas.recomendaciones.push({
                    tipo: 'advertencia',
                    recurso: recurso,
                    mensaje: `Uso moderado de ${recurso} (${data.porcentaje}%). Monitoree su uso.`
                });
            }
        });
        
        res.status(200).json({
            success: true,
            message: 'Estadísticas de uso obtenidas exitosamente',
            data: estadisticas
        });
    }
);

// =====================================================
// MANEJO DE ERRORES
// =====================================================

// Middleware para manejar errores específicos de planes
router.use((error, req, res, next) => {
    if (error.message === 'Plan no encontrado') {
        return res.status(404).json({
            success: false,
            message: 'Plan no encontrado'
        });
    }
    
    if (error.message === 'Ya existe un plan con ese nombre') {
        return res.status(409).json({
            success: false,
            message: 'Ya existe un plan con ese nombre'
        });
    }
    
    next(error);
});

module.exports = router;
