const PlanLimitsMiddleware = require('./planLimitsMiddleware');
const UsageTrackingMiddleware = require('./usageTrackingMiddleware');
const PlanValidationMiddleware = require('./planValidationMiddleware');

// =====================================================
// INSTANCIAS DE MIDDLEWARE
// =====================================================

const planLimitsMiddleware = new PlanLimitsMiddleware();
const usageTrackingMiddleware = new UsageTrackingMiddleware();
const planValidationMiddleware = new PlanValidationMiddleware();

// =====================================================
// MIDDLEWARE DE LÍMITES DE PLANES
// =====================================================

// Límites de recursos
const validateSucursalesLimit = planLimitsMiddleware.validateSucursalesLimit.bind(planLimitsMiddleware);
const validateUsuariosLimit = planLimitsMiddleware.validateUsuariosLimit.bind(planLimitsMiddleware);
const validateProductosLimit = planLimitsMiddleware.validateProductosLimit.bind(planLimitsMiddleware);
const validateTransaccionesLimit = planLimitsMiddleware.validateTransaccionesLimit.bind(planLimitsMiddleware);
const validateAlmacenamientoLimit = planLimitsMiddleware.validateAlmacenamientoLimit.bind(planLimitsMiddleware);

// Funcionalidades
const validateInventarioAvanzado = planLimitsMiddleware.validateInventarioAvanzado.bind(planLimitsMiddleware);
const validatePromociones = planLimitsMiddleware.validatePromociones.bind(planLimitsMiddleware);
const validateReservas = planLimitsMiddleware.validateReservas.bind(planLimitsMiddleware);
const validateArqueoCaja = planLimitsMiddleware.validateArqueoCaja.bind(planLimitsMiddleware);
const validateEgresos = planLimitsMiddleware.validateEgresos.bind(planLimitsMiddleware);
const validateEgresosAvanzados = planLimitsMiddleware.validateEgresosAvanzados.bind(planLimitsMiddleware);
const validateReportesAvanzados = planLimitsMiddleware.validateReportesAvanzados.bind(planLimitsMiddleware);
const validateAnalytics = planLimitsMiddleware.validateAnalytics.bind(planLimitsMiddleware);
const validateDelivery = planLimitsMiddleware.validateDelivery.bind(planLimitsMiddleware);
const validateSoporte24h = planLimitsMiddleware.validateSoporte24h.bind(planLimitsMiddleware);
const validateAPI = planLimitsMiddleware.validateAPI.bind(planLimitsMiddleware);
const validateWhiteLabel = planLimitsMiddleware.validateWhiteLabel.bind(planLimitsMiddleware);

// Validación general
const validateActiveSubscription = planLimitsMiddleware.validateActiveSubscription.bind(planLimitsMiddleware);
const validateFeature = planLimitsMiddleware.validateFeature.bind(planLimitsMiddleware);

// =====================================================
// MIDDLEWARE DE SEGUIMIENTO DE USO
// =====================================================

// Seguimiento de recursos
const trackSucursalCreation = usageTrackingMiddleware.trackSucursalCreation.bind(usageTrackingMiddleware);
const trackUsuarioCreation = usageTrackingMiddleware.trackUsuarioCreation.bind(usageTrackingMiddleware);
const trackProductoCreation = usageTrackingMiddleware.trackProductoCreation.bind(usageTrackingMiddleware);
const trackTransaccion = usageTrackingMiddleware.trackTransaccion.bind(usageTrackingMiddleware);
const trackAlmacenamiento = usageTrackingMiddleware.trackAlmacenamiento.bind(usageTrackingMiddleware);

// Logging de funcionalidades
const logFeatureUsage = usageTrackingMiddleware.logFeatureUsage.bind(usageTrackingMiddleware);

// Actualización automática
const updateAllCounters = usageTrackingMiddleware.updateAllCounters.bind(usageTrackingMiddleware);

// =====================================================
// MIDDLEWARE DE VALIDACIÓN DE PLANES
// =====================================================

// Validación de suscripción
const validateActiveSubscriptionPlan = planValidationMiddleware.validateActiveSubscription.bind(planValidationMiddleware);
const validateNotSuspended = planValidationMiddleware.validateNotSuspended.bind(planValidationMiddleware);
const validateNotCancelled = planValidationMiddleware.validateNotCancelled.bind(planValidationMiddleware);
const validateAutoRenewal = planValidationMiddleware.validateAutoRenewal.bind(planValidationMiddleware);

// Validación de funcionalidades
const validatePlanFeature = planValidationMiddleware.validatePlanFeature.bind(planValidationMiddleware);

// Validación de límites
const validateResourceLimit = planValidationMiddleware.validateResourceLimit.bind(planValidationMiddleware);

// =====================================================
// MIDDLEWARE COMPUESTOS
// =====================================================

/**
 * Middleware compuesto para validar suscripción activa y no suspendida
 */
const validateActiveAndNotSuspended = [
    validateActiveSubscriptionPlan,
    validateNotSuspended
];

/**
 * Middleware compuesto para validar suscripción activa y no cancelada
 */
const validateActiveAndNotCancelled = [
    validateActiveSubscriptionPlan,
    validateNotCancelled
];

/**
 * Middleware compuesto para validar suscripción activa, no suspendida y no cancelada
 */
const validateActiveAndValid = [
    validateActiveSubscriptionPlan,
    validateNotSuspended,
    validateNotCancelled
];

/**
 * Middleware compuesto para validar límites de sucursales
 */
const validateSucursalesComplete = [
    validateActiveSubscriptionPlan,
    validateSucursalesLimit,
    trackSucursalCreation
];

/**
 * Middleware compuesto para validar límites de usuarios
 */
const validateUsuariosComplete = [
    validateActiveSubscriptionPlan,
    validateUsuariosLimit,
    trackUsuarioCreation
];

/**
 * Middleware compuesto para validar límites de productos
 */
const validateProductosComplete = [
    validateActiveSubscriptionPlan,
    validateProductosLimit,
    trackProductoCreation
];

/**
 * Middleware compuesto para validar límites de transacciones
 */
const validateTransaccionesComplete = [
    validateActiveSubscriptionPlan,
    validateTransaccionesLimit,
    trackTransaccion
];

/**
 * Middleware compuesto para validar límites de almacenamiento
 */
const validateAlmacenamientoComplete = [
    validateActiveSubscriptionPlan,
    validateAlmacenamientoLimit,
    trackAlmacenamiento
];

/**
 * Middleware compuesto para validar funcionalidad de inventario avanzado
 */
const validateInventarioAvanzadoComplete = [
    validateActiveSubscriptionPlan,
    validateInventarioAvanzado,
    logFeatureUsage('inventario_avanzado')
];

/**
 * Middleware compuesto para validar funcionalidad de promociones
 */
const validatePromocionesComplete = [
    validateActiveSubscriptionPlan,
    validatePromociones,
    logFeatureUsage('promociones')
];

/**
 * Middleware compuesto para validar funcionalidad de reservas
 */
const validateReservasComplete = [
    validateActiveSubscriptionPlan,
    validateReservas,
    logFeatureUsage('reservas')
];

/**
 * Middleware compuesto para validar funcionalidad de arqueo de caja
 */
const validateArqueoCajaComplete = [
    validateActiveSubscriptionPlan,
    validateArqueoCaja,
    logFeatureUsage('arqueo_caja')
];

/**
 * Middleware compuesto para validar funcionalidad de egresos
 */
const validateEgresosComplete = [
    validateActiveSubscriptionPlan,
    validateEgresos,
    logFeatureUsage('egresos')
];

/**
 * Middleware compuesto para validar funcionalidad de egresos avanzados
 */
const validateEgresosAvanzadosComplete = [
    validateActiveSubscriptionPlan,
    validateEgresosAvanzados,
    logFeatureUsage('egresos_avanzados')
];

/**
 * Middleware compuesto para validar funcionalidad de reportes avanzados
 */
const validateReportesAvanzadosComplete = [
    validateActiveSubscriptionPlan,
    validateReportesAvanzados,
    logFeatureUsage('reportes_avanzados')
];

/**
 * Middleware compuesto para validar funcionalidad de analytics
 */
const validateAnalyticsComplete = [
    validateActiveSubscriptionPlan,
    validateAnalytics,
    logFeatureUsage('analytics')
];

/**
 * Middleware compuesto para validar funcionalidad de delivery
 */
const validateDeliveryComplete = [
    validateActiveSubscriptionPlan,
    validateDelivery,
    logFeatureUsage('delivery')
];

/**
 * Middleware compuesto para validar funcionalidad de soporte 24h
 */
const validateSoporte24hComplete = [
    validateActiveSubscriptionPlan,
    validateSoporte24h,
    logFeatureUsage('soporte_24h')
];

/**
 * Middleware compuesto para validar funcionalidad de API
 */
const validateAPIComplete = [
    validateActiveSubscriptionPlan,
    validateAPI,
    logFeatureUsage('api')
];

/**
 * Middleware compuesto para validar funcionalidad de white label
 */
const validateWhiteLabelComplete = [
    validateActiveSubscriptionPlan,
    validateWhiteLabel,
    logFeatureUsage('white_label')
];

// =====================================================
// MIDDLEWARE DE UTILIDAD
// =====================================================

/**
 * Middleware para obtener información del plan actual
 */
const getCurrentPlanInfo = async (req, res, next) => {
    try {
        const idRestaurante = req.body.id_restaurante || req.params.idRestaurante;
        
        if (!idRestaurante) {
            return next();
        }

        const planInfo = await planValidationMiddleware.getCurrentPlanInfo(parseInt(idRestaurante));
        
        if (planInfo) {
            req.currentPlan = planInfo;
        }

        next();
    } catch (error) {
        console.error('Error en getCurrentPlanInfo:', error);
        next();
    }
};

/**
 * Middleware para verificar si una funcionalidad está disponible
 */
const checkFeatureAvailability = (funcionalidad) => {
    return async (req, res, next) => {
        try {
            const idRestaurante = req.body.id_restaurante || req.params.idRestaurante;
            
            if (!idRestaurante) {
                return next();
            }

            const isAvailable = await planValidationMiddleware.isFeatureAvailable(parseInt(idRestaurante), funcionalidad);
            
            req.features = req.features || {};
            req.features[funcionalidad] = isAvailable;

            next();
        } catch (error) {
            console.error(`Error en checkFeatureAvailability(${funcionalidad}):`, error);
            next();
        }
    };
};

/**
 * Middleware para obtener límites actuales
 */
const getCurrentLimits = async (req, res, next) => {
    try {
        const idRestaurante = req.body.id_restaurante || req.params.idRestaurante;
        
        if (!idRestaurante) {
            return next();
        }

        const limits = await planValidationMiddleware.getCurrentLimits(parseInt(idRestaurante));
        
        if (limits) {
            req.currentLimits = limits;
        }

        next();
    } catch (error) {
        console.error('Error en getCurrentLimits:', error);
        next();
    }
};

// =====================================================
// EXPORTAR MIDDLEWARE
// =====================================================

module.exports = {
    // Middleware individual
    validateSucursalesLimit,
    validateUsuariosLimit,
    validateProductosLimit,
    validateTransaccionesLimit,
    validateAlmacenamientoLimit,
    
    validateInventarioAvanzado,
    validatePromociones,
    validateReservas,
    validateArqueoCaja,
    validateEgresos,
    validateEgresosAvanzados,
    validateReportesAvanzados,
    validateAnalytics,
    validateDelivery,
    validateSoporte24h,
    validateAPI,
    validateWhiteLabel,
    
    validateActiveSubscription,
    validateFeature,
    
    trackSucursalCreation,
    trackUsuarioCreation,
    trackProductoCreation,
    trackTransaccion,
    trackAlmacenamiento,
    
    logFeatureUsage,
    updateAllCounters,
    
    validateActiveSubscriptionPlan,
    validateNotSuspended,
    validateNotCancelled,
    validateAutoRenewal,
    validatePlanFeature,
    validateResourceLimit,
    
    // Middleware compuestos
    validateActiveAndNotSuspended,
    validateActiveAndNotCancelled,
    validateActiveAndValid,
    
    validateSucursalesComplete,
    validateUsuariosComplete,
    validateProductosComplete,
    validateTransaccionesComplete,
    validateAlmacenamientoComplete,
    
    validateInventarioAvanzadoComplete,
    validatePromocionesComplete,
    validateReservasComplete,
    validateArqueoCajaComplete,
    validateEgresosComplete,
    validateEgresosAvanzadosComplete,
    validateReportesAvanzadosComplete,
    validateAnalyticsComplete,
    validateDeliveryComplete,
    validateSoporte24hComplete,
    validateAPIComplete,
    validateWhiteLabelComplete,
    
    // Middleware de utilidad
    getCurrentPlanInfo,
    checkFeatureAvailability,
    getCurrentLimits,
    
    // Instancias para uso directo
    planLimitsMiddleware,
    usageTrackingMiddleware,
    planValidationMiddleware
};
