const express = require('express');
const router = express.Router();
const SuscripcionController = require('../controllers/SuscripcionController');
const {
    validateActiveSubscriptionPlan,
    getCurrentPlanInfo,
    getCurrentLimits
} = require('../middleware');

// =====================================================
// INSTANCIA DEL CONTROLADOR
// =====================================================

const suscripcionController = new SuscripcionController();

// =====================================================
// RUTAS DE CONSULTA DE SUSCRIPCIONES
// =====================================================

/**
 * @route GET /api/suscripciones/estadisticas
 * @desc Obtener estadísticas de suscripciones
 * @access Admin
 */
router.get('/estadisticas', suscripcionController.getSubscriptionStats.bind(suscripcionController));

/**
 * @route GET /api/suscripciones/ingresos
 * @desc Obtener ingresos por suscripciones
 * @access Admin
 */
router.get('/ingresos', suscripcionController.getSubscriptionRevenue.bind(suscripcionController));

/**
 * @route GET /api/suscripciones/estado/:estado
 * @desc Obtener suscripciones por estado
 * @access Admin
 */
router.get('/estado/:estado', suscripcionController.getSubscriptionsByStatus.bind(suscripcionController));

/**
 * @route GET /api/suscripciones/proximas-a-vencer
 * @desc Obtener suscripciones próximas a vencer
 * @access Admin
 */
router.get('/proximas-a-vencer', suscripcionController.getSubscriptionsExpiringSoon.bind(suscripcionController));

/**
 * @route GET /api/suscripciones/vencidas
 * @desc Obtener suscripciones vencidas
 * @access Admin
 */
router.get('/vencidas', suscripcionController.getExpiredSubscriptions.bind(suscripcionController));

// =====================================================
// RUTAS DE GESTIÓN DE SUSCRIPCIONES
// =====================================================

/**
 * @route POST /api/suscripciones
 * @desc Crear una nueva suscripción
 * @access Admin
 */
router.post('/', suscripcionController.createSubscription.bind(suscripcionController));

/**
 * @route PUT /api/suscripciones/:id
 * @desc Actualizar una suscripción
 * @access Admin
 */
router.put('/:id', suscripcionController.updateSubscription.bind(suscripcionController));

/**
 * @route PUT /api/suscripciones/:id/cambiar-plan
 * @desc Cambiar el plan de una suscripción
 * @access Admin
 */
router.put('/:id/cambiar-plan', suscripcionController.changePlan.bind(suscripcionController));

/**
 * @route PUT /api/suscripciones/:id/suspender
 * @desc Suspender una suscripción
 * @access Admin
 */
router.put('/:id/suspender', suscripcionController.suspendSubscription.bind(suscripcionController));

/**
 * @route PUT /api/suscripciones/:id/reactivar
 * @desc Reactivar una suscripción
 * @access Admin
 */
router.put('/:id/reactivar', suscripcionController.reactivateSubscription.bind(suscripcionController));

/**
 * @route PUT /api/suscripciones/:id/cancelar
 * @desc Cancelar una suscripción
 * @access Admin
 */
router.put('/:id/cancelar', suscripcionController.cancelSubscription.bind(suscripcionController));

// =====================================================
// RUTAS DE VALIDACIÓN
// =====================================================

/**
 * @route GET /api/suscripciones/:id/validar
 * @desc Verificar si una suscripción está activa
 * @access Private
 */
router.get('/:id/validar', suscripcionController.hasActiveSubscription.bind(suscripcionController));

/**
 * @route GET /api/suscripciones/:id/proxima-a-vencer
 * @desc Verificar si una suscripción está próxima a vencer
 * @access Private
 */
router.get('/:id/proxima-a-vencer', suscripcionController.isSubscriptionExpiringSoon.bind(suscripcionController));

/**
 * @route GET /api/suscripciones/:id/vencida
 * @desc Verificar si una suscripción está vencida
 * @access Private
 */
router.get('/:id/vencida', suscripcionController.isSubscriptionExpired.bind(suscripcionController));

// =====================================================
// RUTAS DE RESTAURANTES
// =====================================================

/**
 * @route GET /api/suscripciones/restaurante/:idRestaurante
 * @desc Obtener todas las suscripciones de un restaurante
 * @access Private
 */
router.get('/restaurante/:idRestaurante', suscripcionController.getRestaurantSubscriptions.bind(suscripcionController));

/**
 * @route GET /api/suscripciones/restaurante/:idRestaurante/activa
 * @desc Obtener suscripción activa de un restaurante
 * @access Private
 */
router.get('/restaurante/:idRestaurante/activa', suscripcionController.getActiveSubscription.bind(suscripcionController));

/**
 * @route GET /api/suscripciones/restaurante/:idRestaurante/tiene-activa
 * @desc Verificar si un restaurante tiene suscripción activa
 * @access Private
 */
router.get('/restaurante/:idRestaurante/tiene-activa', suscripcionController.hasActiveSubscription.bind(suscripcionController));

// =====================================================
// RUTAS DE INFORMACIÓN DE SUSCRIPCIÓN
// =====================================================

/**
 * @route GET /api/suscripciones/restaurante/:idRestaurante/info
 * @desc Obtener información completa de la suscripción
 * @access Private
 */
router.get('/restaurante/:idRestaurante/info',
    validateActiveSubscriptionPlan,
    getCurrentPlanInfo,
    (req, res) => {
        const suscripcion = req.suscripcion;
        const planInfo = req.currentPlan;
        const warning = req.suscripcion_warning;
        
        // Calcular días restantes
        const diasRestantes = Math.ceil((new Date(suscripcion.fecha_fin) - new Date()) / (1000 * 60 * 60 * 24));
        
        // Determinar estado de la suscripción
        let estadoSuscripcion = 'activa';
        if (diasRestantes <= 0) {
            estadoSuscripcion = 'expirada';
        } else if (diasRestantes <= 7) {
            estadoSuscripcion = 'proxima_a_vencer';
        } else if (diasRestantes <= 30) {
            estadoSuscripcion = 'vencimiento_proximo';
        }
        
        res.status(200).json({
            success: true,
            message: 'Información de suscripción obtenida exitosamente',
            data: {
                suscripcion: {
                    id_suscripcion: suscripcion.id_suscripcion,
                    estado: suscripcion.estado,
                    fecha_inicio: suscripcion.fecha_inicio,
                    fecha_fin: suscripcion.fecha_fin,
                    fecha_renovacion: suscripcion.fecha_renovacion,
                    auto_renovacion: suscripcion.auto_renovacion,
                    metodo_pago: suscripcion.metodo_pago,
                    ultimo_pago: suscripcion.ultimo_pago,
                    proximo_pago: suscripcion.proximo_pago,
                    dias_restantes: diasRestantes,
                    estado_suscripcion: estadoSuscripcion
                },
                plan: planInfo,
                alertas: warning ? [warning] : []
            }
        });
    }
);

/**
 * @route GET /api/suscripciones/restaurante/:idRestaurante/estado
 * @desc Obtener estado detallado de la suscripción
 * @access Private
 */
router.get('/restaurante/:idRestaurante/estado',
    validateActiveSubscriptionPlan,
    (req, res) => {
        const suscripcion = req.suscripcion;
        
        // Calcular días restantes
        const diasRestantes = Math.ceil((new Date(suscripcion.fecha_fin) - new Date()) / (1000 * 60 * 60 * 24));
        
        // Determinar estado de la suscripción
        let estadoSuscripcion = 'activa';
        let mensaje = 'Su suscripción está activa';
        let nivelAlerta = 'info';
        
        if (diasRestantes <= 0) {
            estadoSuscripcion = 'expirada';
            mensaje = 'Su suscripción ha expirado';
            nivelAlerta = 'error';
        } else if (diasRestantes <= 3) {
            estadoSuscripcion = 'critica';
            mensaje = `Su suscripción vence en ${diasRestantes} días`;
            nivelAlerta = 'error';
        } else if (diasRestantes <= 7) {
            estadoSuscripcion = 'proxima_a_vencer';
            mensaje = `Su suscripción vence en ${diasRestantes} días`;
            nivelAlerta = 'warning';
        } else if (diasRestantes <= 30) {
            estadoSuscripcion = 'vencimiento_proximo';
            mensaje = `Su suscripción vence en ${diasRestantes} días`;
            nivelAlerta = 'info';
        }
        
        res.status(200).json({
            success: true,
            message: 'Estado de suscripción obtenido exitosamente',
            data: {
                estado: suscripcion.estado,
                estado_suscripcion: estadoSuscripcion,
                mensaje: mensaje,
                nivel_alerta: nivelAlerta,
                dias_restantes: diasRestantes,
                fecha_vencimiento: suscripcion.fecha_fin,
                auto_renovacion: suscripcion.auto_renovacion,
                requiere_accion: diasRestantes <= 7
            }
        });
    }
);

// =====================================================
// RUTAS DE RENOVACIÓN
// =====================================================

/**
 * @route GET /api/suscripciones/restaurante/:idRestaurante/renovacion
 * @desc Obtener información de renovación
 * @access Private
 */
router.get('/restaurante/:idRestaurante/renovacion',
    validateActiveSubscriptionPlan,
    (req, res) => {
        const suscripcion = req.suscripcion;
        
        // Calcular días restantes
        const diasRestantes = Math.ceil((new Date(suscripcion.fecha_fin) - new Date()) / (1000 * 60 * 60 * 24));
        
        res.status(200).json({
            success: true,
            message: 'Información de renovación obtenida exitosamente',
            data: {
                auto_renovacion: suscripcion.auto_renovacion,
                fecha_renovacion: suscripcion.fecha_renovacion,
                proximo_pago: suscripcion.proximo_pago,
                dias_restantes: diasRestantes,
                plan_actual: suscripcion.nombre_plan,
                precio_mensual: suscripcion.precio_mensual,
                precio_anual: suscripcion.precio_anual,
                ahorro_anual: suscripcion.precio_anual ? 
                    (suscripcion.precio_mensual * 12) - suscripcion.precio_anual : 0
            }
        });
    }
);

/**
 * @route PUT /api/suscripciones/restaurante/:idRestaurante/activar-auto-renovacion
 * @desc Activar auto-renovación
 * @access Private
 */
router.put('/restaurante/:idRestaurante/activar-auto-renovacion',
    validateActiveSubscriptionPlan,
    (req, res) => {
        const { idRestaurante } = req.params;
        const suscripcion = req.suscripcion;
        
        // Esta funcionalidad se implementaría en el controlador
        res.status(200).json({
            success: true,
            message: 'Auto-renovación activada exitosamente',
            data: {
                id_restaurante: parseInt(idRestaurante),
                auto_renovacion: true,
                fecha_renovacion: suscripcion.fecha_renovacion
            }
        });
    }
);

/**
 * @route PUT /api/suscripciones/restaurante/:idRestaurante/desactivar-auto-renovacion
 * @desc Desactivar auto-renovación
 * @access Private
 */
router.put('/restaurante/:idRestaurante/desactivar-auto-renovacion',
    validateActiveSubscriptionPlan,
    (req, res) => {
        const { idRestaurante } = req.params;
        
        // Esta funcionalidad se implementaría en el controlador
        res.status(200).json({
            success: true,
            message: 'Auto-renovación desactivada exitosamente',
            data: {
                id_restaurante: parseInt(idRestaurante),
                auto_renovacion: false
            }
        });
    }
);

// =====================================================
// RUTAS DE CAMBIO DE PLAN
// =====================================================

/**
 * @route GET /api/suscripciones/restaurante/:idRestaurante/cambio-plan/opciones
 * @desc Obtener opciones de cambio de plan
 * @access Private
 */
router.get('/restaurante/:idRestaurante/cambio-plan/opciones',
    validateActiveSubscriptionPlan,
    (req, res) => {
        const { idRestaurante } = req.params;
        const planActual = req.suscripcion.nombre_plan;
        
        // Lógica para determinar planes disponibles
        let planesDisponibles = [];
        
        switch (planActual) {
            case 'Básico':
                planesDisponibles = [
                    { nombre: 'Profesional', precio_mensual: 49, diferencia: 30 },
                    { nombre: 'Avanzado', precio_mensual: 99, diferencia: 80 },
                    { nombre: 'Enterprise', precio_mensual: 119, diferencia: 100 }
                ];
                break;
            case 'Profesional':
                planesDisponibles = [
                    { nombre: 'Básico', precio_mensual: 19, diferencia: -30 },
                    { nombre: 'Avanzado', precio_mensual: 99, diferencia: 50 },
                    { nombre: 'Enterprise', precio_mensual: 119, diferencia: 70 }
                ];
                break;
            case 'Avanzado':
                planesDisponibles = [
                    { nombre: 'Básico', precio_mensual: 19, diferencia: -80 },
                    { nombre: 'Profesional', precio_mensual: 49, diferencia: -50 },
                    { nombre: 'Enterprise', precio_mensual: 119, diferencia: 20 }
                ];
                break;
            case 'Enterprise':
                planesDisponibles = [
                    { nombre: 'Básico', precio_mensual: 19, diferencia: -100 },
                    { nombre: 'Profesional', precio_mensual: 49, diferencia: -70 },
                    { nombre: 'Avanzado', precio_mensual: 99, diferencia: -20 }
                ];
                break;
        }
        
        res.status(200).json({
            success: true,
            message: 'Opciones de cambio de plan obtenidas exitosamente',
            data: {
                plan_actual: planActual,
                planes_disponibles: planesDisponibles
            }
        });
    }
);

/**
 * @route POST /api/suscripciones/restaurante/:idRestaurante/cambio-plan
 * @desc Solicitar cambio de plan
 * @access Private
 */
router.post('/restaurante/:idRestaurante/cambio-plan',
    validateActiveSubscriptionPlan,
    (req, res) => {
        const { idRestaurante } = req.params;
        const { nuevo_plan, motivo } = req.body;
        
        // Esta funcionalidad se implementaría en el controlador
        res.status(200).json({
            success: true,
            message: 'Solicitud de cambio de plan enviada exitosamente',
            data: {
                id_restaurante: parseInt(idRestaurante),
                plan_actual: req.suscripcion.nombre_plan,
                nuevo_plan: nuevo_plan,
                motivo: motivo,
                estado: 'pendiente'
            }
        });
    }
);

// =====================================================
// RUTAS DE NOTIFICACIONES
// =====================================================

/**
 * @route GET /api/suscripciones/restaurante/:idRestaurante/notificaciones
 * @desc Obtener configuración de notificaciones
 * @access Private
 */
router.get('/restaurante/:idRestaurante/notificaciones',
    validateActiveSubscriptionPlan,
    (req, res) => {
        const suscripcion = req.suscripcion;
        
        res.status(200).json({
            success: true,
            message: 'Configuración de notificaciones obtenida exitosamente',
            data: {
                notificaciones_email: suscripcion.notificaciones_email,
                notificaciones_sms: suscripcion.notificaciones_sms,
                configuracion: {
                    vencimiento_proximo: true,
                    renovacion_exitosa: true,
                    pago_fallido: true,
                    cambio_plan: true,
                    suspension: true
                }
            }
        });
    }
);

/**
 * @route PUT /api/suscripciones/restaurante/:idRestaurante/notificaciones
 * @desc Actualizar configuración de notificaciones
 * @access Private
 */
router.put('/restaurante/:idRestaurante/notificaciones',
    validateActiveSubscriptionPlan,
    (req, res) => {
        const { idRestaurante } = req.params;
        const { notificaciones_email, notificaciones_sms, configuracion } = req.body;
        
        // Esta funcionalidad se implementaría en el controlador
        res.status(200).json({
            success: true,
            message: 'Configuración de notificaciones actualizada exitosamente',
            data: {
                id_restaurante: parseInt(idRestaurante),
                notificaciones_email: notificaciones_email,
                notificaciones_sms: notificaciones_sms,
                configuracion: configuracion
            }
        });
    }
);

// =====================================================
// MANEJO DE ERRORES
// =====================================================

// Middleware para manejar errores específicos de suscripciones
router.use((error, req, res, next) => {
    if (error.message === 'Suscripción no encontrada') {
        return res.status(404).json({
            success: false,
            message: 'Suscripción no encontrada'
        });
    }
    
    if (error.message === 'Ya existe una suscripción activa para este restaurante') {
        return res.status(409).json({
            success: false,
            message: 'Ya existe una suscripción activa para este restaurante'
        });
    }
    
    next(error);
});

module.exports = router;
