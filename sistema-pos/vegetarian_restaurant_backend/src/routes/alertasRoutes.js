const express = require('express');
const router = express.Router();
const AlertaLimiteController = require('../controllers/AlertaLimiteController');
const {
    validateActiveSubscriptionPlan
} = require('../middleware');

// =====================================================
// INSTANCIA DEL CONTROLADOR
// =====================================================

const alertaLimiteController = new AlertaLimiteController();

// =====================================================
// RUTAS DE CONSULTA DE ALERTAS
// =====================================================

/**
 * @route GET /api/alertas/estadisticas
 * @desc Obtener estadísticas de alertas
 * @access Admin
 */
router.get('/estadisticas', alertaLimiteController.getAlertStats.bind(alertaLimiteController));

/**
 * @route GET /api/alertas/estadisticas-por-tipo
 * @desc Obtener estadísticas de alertas por tipo
 * @access Admin
 */
router.get('/estadisticas-por-tipo', alertaLimiteController.getAlertStatsByType.bind(alertaLimiteController));

/**
 * @route GET /api/alertas/estadisticas-por-restaurante
 * @desc Obtener estadísticas de alertas por restaurante
 * @access Admin
 */
router.get('/estadisticas-por-restaurante', alertaLimiteController.getAlertStatsByRestaurant.bind(alertaLimiteController));

/**
 * @route GET /api/alertas/criticas
 * @desc Obtener alertas críticas
 * @access Admin
 */
router.get('/criticas', alertaLimiteController.getCriticalAlerts.bind(alertaLimiteController));

/**
 * @route GET /api/alertas/pendientes-notificacion
 * @desc Obtener alertas pendientes de notificación
 * @access Admin
 */
router.get('/pendientes-notificacion', alertaLimiteController.getPendingNotificationAlerts.bind(alertaLimiteController));

/**
 * @route GET /api/alertas/estado/:estado
 * @desc Obtener alertas por estado
 * @access Admin
 */
router.get('/estado/:estado', alertaLimiteController.getAlertsByStatus.bind(alertaLimiteController));

/**
 * @route GET /api/alertas/urgencia/:nivelUrgencia
 * @desc Obtener alertas por nivel de urgencia
 * @access Admin
 */
router.get('/urgencia/:nivelUrgencia', alertaLimiteController.getAlertsByUrgency.bind(alertaLimiteController));

/**
 * @route GET /api/alertas/tipo/:tipoAlerta
 * @desc Obtener alertas por tipo
 * @access Admin
 */
router.get('/tipo/:tipoAlerta', alertaLimiteController.getAlertsByType.bind(alertaLimiteController));

// =====================================================
// RUTAS DE GESTIÓN DE ALERTAS
// =====================================================

/**
 * @route POST /api/alertas
 * @desc Crear una nueva alerta
 * @access Admin
 */
router.post('/', alertaLimiteController.createAlert.bind(alertaLimiteController));

/**
 * @route PUT /api/alertas/:id
 * @desc Actualizar una alerta
 * @access Admin
 */
router.put('/:id', alertaLimiteController.updateAlert.bind(alertaLimiteController));

/**
 * @route PUT /api/alertas/:id/marcar-enviada
 * @desc Marcar alerta como enviada
 * @access Admin
 */
router.put('/:id/marcar-enviada', alertaLimiteController.markAlertAsSent.bind(alertaLimiteController));

/**
 * @route PUT /api/alertas/:id/resolver
 * @desc Resolver una alerta
 * @access Admin
 */
router.put('/:id/resolver', alertaLimiteController.resolveAlert.bind(alertaLimiteController));

/**
 * @route PUT /api/alertas/:id/ignorar
 * @desc Ignorar una alerta
 * @access Admin
 */
router.put('/:id/ignorar', alertaLimiteController.ignoreAlert.bind(alertaLimiteController));

/**
 * @route DELETE /api/alertas/antiguas
 * @desc Eliminar alertas antiguas
 * @access Admin
 */
router.delete('/antiguas', alertaLimiteController.deleteOldAlerts.bind(alertaLimiteController));

// =====================================================
// RUTAS DE VALIDACIÓN
// =====================================================

/**
 * @route GET /api/alertas/:idRestaurante/:tipoAlerta/:recurso/tiene-activa
 * @desc Verificar si existe una alerta activa para un recurso
 * @access Private
 */
router.get('/:idRestaurante/:tipoAlerta/:recurso/tiene-activa', alertaLimiteController.hasActiveAlert.bind(alertaLimiteController));

/**
 * @route GET /api/alertas/:idRestaurante/:tipoAlerta/debe-crear
 * @desc Verificar si se debe crear una nueva alerta
 * @access Private
 */
router.get('/:idRestaurante/:tipoAlerta/debe-crear', alertaLimiteController.shouldCreateAlert.bind(alertaLimiteController));

// =====================================================
// RUTAS DE RESTAURANTES
// =====================================================

/**
 * @route GET /api/alertas/restaurante/:idRestaurante
 * @desc Obtener alertas de un restaurante
 * @access Private
 */
router.get('/restaurante/:idRestaurante',
    validateActiveSubscriptionPlan,
    alertaLimiteController.getRestaurantAlerts.bind(alertaLimiteController)
);

/**
 * @route GET /api/alertas/restaurante/:idRestaurante/activas
 * @desc Obtener alertas activas de un restaurante
 * @access Private
 */
router.get('/restaurante/:idRestaurante/activas',
    validateActiveSubscriptionPlan,
    (req, res) => {
        // Filtrar solo alertas activas
        req.query.estado = 'pendiente';
        alertaLimiteController.getRestaurantAlerts(req, res);
    }
);

/**
 * @route GET /api/alertas/restaurante/:idRestaurante/resueltas
 * @desc Obtener alertas resueltas de un restaurante
 * @access Private
 */
router.get('/restaurante/:idRestaurante/resueltas',
    validateActiveSubscriptionPlan,
    (req, res) => {
        // Filtrar solo alertas resueltas
        req.query.estado = 'resuelta';
        alertaLimiteController.getRestaurantAlerts(req, res);
    }
);

// =====================================================
// RUTAS DE INFORMACIÓN DE ALERTAS
// =====================================================

/**
 * @route GET /api/alertas/restaurante/:idRestaurante/resumen
 * @desc Obtener resumen de alertas del restaurante
 * @access Private
 */
router.get('/restaurante/:idRestaurante/resumen',
    validateActiveSubscriptionPlan,
    async (req, res) => {
        try {
            const { idRestaurante } = req.params;
            const id = parseInt(idRestaurante);
            
            // Obtener todas las alertas del restaurante
            const todasAlertas = await alertaLimiteController.alertaLimiteModel.getRestaurantAlerts(id);
            
            // Filtrar por estado
            const alertasPendientes = todasAlertas.filter(a => a.estado === 'pendiente');
            const alertasEnviadas = todasAlertas.filter(a => a.estado === 'enviada');
            const alertasResueltas = todasAlertas.filter(a => a.estado === 'resuelta');
            const alertasIgnoradas = todasAlertas.filter(a => a.estado === 'ignorada');
            
            // Filtrar por urgencia
            const alertasCriticas = todasAlertas.filter(a => a.nivel_urgencia === 'critico');
            const alertasAltas = todasAlertas.filter(a => a.nivel_urgencia === 'alto');
            const alertasMedias = todasAlertas.filter(a => a.nivel_urgencia === 'medio');
            const alertasBajas = todasAlertas.filter(a => a.nivel_urgencia === 'bajo');
            
            // Alertas recientes (últimos 7 días)
            const fechaLimite = new Date();
            fechaLimite.setDate(fechaLimite.getDate() - 7);
            const alertasRecientes = todasAlertas.filter(a => new Date(a.fecha_alerta) >= fechaLimite);
            
            const resumen = {
                total_alertas: todasAlertas.length,
                por_estado: {
                    pendientes: alertasPendientes.length,
                    enviadas: alertasEnviadas.length,
                    resueltas: alertasResueltas.length,
                    ignoradas: alertasIgnoradas.length
                },
                por_urgencia: {
                    criticas: alertasCriticas.length,
                    altas: alertasAltas.length,
                    medias: alertasMedias.length,
                    bajas: alertasBajas.length
                },
                recientes: alertasRecientes.length,
                requiere_atencion: alertasPendientes.length + alertasEnviadas.length,
                alertas_criticas: alertasCriticas.map(a => ({
                    id_alerta: a.id_alerta,
                    tipo_alerta: a.tipo_alerta,
                    recurso: a.recurso,
                    mensaje: a.mensaje,
                    fecha_alerta: a.fecha_alerta,
                    porcentaje_uso: a.porcentaje_uso
                })),
                tendencias: {
                    alertas_ultima_semana: alertasRecientes.length,
                    promedio_resolucion_dias: calcularPromedioResolucion(alertasResueltas),
                    tasa_resolucion: todasAlertas.length > 0 ? 
                        Math.round((alertasResueltas.length / todasAlertas.length) * 100) : 0
                }
            };
            
            res.status(200).json({
                success: true,
                message: 'Resumen de alertas obtenido exitosamente',
                data: resumen
            });
        } catch (error) {
            console.error('Error en resumen de alertas:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }
);

/**
 * @route GET /api/alertas/restaurante/:idRestaurante/dashboard
 * @desc Obtener datos para dashboard de alertas
 * @access Private
 */
router.get('/restaurante/:idRestaurante/dashboard',
    validateActiveSubscriptionPlan,
    async (req, res) => {
        try {
            const { idRestaurante } = req.params;
            const id = parseInt(idRestaurante);
            
            // Obtener alertas del restaurante
            const alertas = await alertaLimiteController.alertaLimiteModel.getRestaurantAlerts(id);
            
            // Procesar datos para dashboard
            const dashboard = {
                alertas_activas: alertas.filter(a => a.estado === 'pendiente' || a.estado === 'enviada'),
                alertas_criticas: alertas.filter(a => a.nivel_urgencia === 'critico'),
                alertas_por_tipo: agruparPorTipo(alertas),
                alertas_por_urgencia: agruparPorUrgencia(alertas),
                alertas_por_mes: agruparPorMes(alertas),
                metricas: {
                    total_alertas: alertas.length,
                    alertas_pendientes: alertas.filter(a => a.estado === 'pendiente').length,
                    alertas_resueltas: alertas.filter(a => a.estado === 'resuelta').length,
                    tiempo_promedio_resolucion: calcularPromedioResolucion(alertas.filter(a => a.estado === 'resuelta'))
                },
                recomendaciones: generarRecomendacionesAlertas(alertas)
            };
            
            res.status(200).json({
                success: true,
                message: 'Dashboard de alertas obtenido exitosamente',
                data: dashboard
            });
        } catch (error) {
            console.error('Error en dashboard de alertas:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }
);

// =====================================================
// RUTAS DE GESTIÓN DE ALERTAS DEL RESTAURANTE
// =====================================================

/**
 * @route PUT /api/alertas/restaurante/:idRestaurante/:idAlerta/resolver
 * @desc Resolver una alerta del restaurante
 * @access Private
 */
router.put('/restaurante/:idRestaurante/:idAlerta/resolver',
    validateActiveSubscriptionPlan,
    (req, res) => {
        const { idAlerta } = req.params;
        const { mensajeResolucion } = req.body;
        
        // Verificar que la alerta pertenece al restaurante
        req.params.id = idAlerta;
        alertaLimiteController.resolveAlert(req, res);
    }
);

/**
 * @route PUT /api/alertas/restaurante/:idRestaurante/:idAlerta/ignorar
 * @desc Ignorar una alerta del restaurante
 * @access Private
 */
router.put('/restaurante/:idRestaurante/:idAlerta/ignorar',
    validateActiveSubscriptionPlan,
    (req, res) => {
        const { idAlerta } = req.params;
        const { motivo } = req.body;
        
        // Verificar que la alerta pertenece al restaurante
        req.params.id = idAlerta;
        alertaLimiteController.ignoreAlert(req, res);
    }
);

/**
 * @route PUT /api/alertas/restaurante/:idRestaurante/marcar-todas-como-leidas
 * @desc Marcar todas las alertas como leídas
 * @access Private
 */
router.put('/restaurante/:idRestaurante/marcar-todas-como-leidas',
    validateActiveSubscriptionPlan,
    async (req, res) => {
        try {
            const { idRestaurante } = req.params;
            const id = parseInt(idRestaurante);
            
            // Obtener alertas pendientes del restaurante
            const alertasPendientes = await alertaLimiteController.alertaLimiteModel.getRestaurantAlerts(id, 'pendiente');
            
            // Marcar todas como enviadas
            let marcadas = 0;
            for (const alerta of alertasPendientes) {
                try {
                    await alertaLimiteController.alertaLimiteModel.markAlertAsSent(alerta.id_alerta);
                    marcadas++;
                } catch (error) {
                    console.error(`Error al marcar alerta ${alerta.id_alerta}:`, error);
                }
            }
            
            res.status(200).json({
                success: true,
                message: 'Alertas marcadas como leídas exitosamente',
                data: {
                    alertas_marcadas: marcadas,
                    total_alertas: alertasPendientes.length
                }
            });
        } catch (error) {
            console.error('Error al marcar alertas como leídas:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }
);

// =====================================================
// RUTAS DE CONFIGURACIÓN DE ALERTAS
// =====================================================

/**
 * @route GET /api/alertas/restaurante/:idRestaurante/configuracion
 * @desc Obtener configuración de alertas del restaurante
 * @access Private
 */
router.get('/restaurante/:idRestaurante/configuracion',
    validateActiveSubscriptionPlan,
    (req, res) => {
        const suscripcion = req.suscripcion;
        
        const configuracion = {
            umbrales: {
                bajo: 60,
                medio: 80,
                alto: 90,
                critico: 100
            },
            notificaciones: {
                email: suscripcion.notificaciones_email,
                sms: suscripcion.notificaciones_sms
            },
            tipos_alertas: {
                limite_sucursales: {
                    activo: true,
                    umbral: 80,
                    notificacion: 'email'
                },
                limite_usuarios: {
                    activo: true,
                    umbral: 80,
                    notificacion: 'email'
                },
                limite_productos: {
                    activo: true,
                    umbral: 80,
                    notificacion: 'email'
                },
                limite_transacciones: {
                    activo: true,
                    umbral: 80,
                    notificacion: 'email'
                },
                limite_almacenamiento: {
                    activo: true,
                    umbral: 80,
                    notificacion: 'email'
                }
            },
            frecuencia: {
                verificacion: 'diaria',
                notificacion: 'inmediata'
            }
        };
        
        res.status(200).json({
            success: true,
            message: 'Configuración de alertas obtenida exitosamente',
            data: configuracion
        });
    }
);

/**
 * @route PUT /api/alertas/restaurante/:idRestaurante/configuracion
 * @desc Actualizar configuración de alertas del restaurante
 * @access Private
 */
router.put('/restaurante/:idRestaurante/configuracion',
    validateActiveSubscriptionPlan,
    (req, res) => {
        const { idRestaurante } = req.params;
        const configuracion = req.body;
        
        // Esta funcionalidad se implementaría en el controlador
        res.status(200).json({
            success: true,
            message: 'Configuración de alertas actualizada exitosamente',
            data: {
                id_restaurante: parseInt(idRestaurante),
                configuracion: configuracion
            }
        });
    }
);

// =====================================================
// FUNCIONES AUXILIARES
// =====================================================

/**
 * Calcular promedio de resolución en días
 */
function calcularPromedioResolucion(alertasResueltas) {
    if (alertasResueltas.length === 0) return 0;
    
    const tiemposResolucion = alertasResueltas
        .filter(a => a.fecha_resolucion)
        .map(a => {
            const fechaAlerta = new Date(a.fecha_alerta);
            const fechaResolucion = new Date(a.fecha_resolucion);
            return Math.ceil((fechaResolucion - fechaAlerta) / (1000 * 60 * 60 * 24));
        });
    
    if (tiemposResolucion.length === 0) return 0;
    
    const promedio = tiemposResolucion.reduce((sum, tiempo) => sum + tiempo, 0) / tiemposResolucion.length;
    return Math.round(promedio);
}

/**
 * Agrupar alertas por tipo
 */
function agruparPorTipo(alertas) {
    const agrupadas = {};
    
    alertas.forEach(alerta => {
        if (!agrupadas[alerta.tipo_alerta]) {
            agrupadas[alerta.tipo_alerta] = 0;
        }
        agrupadas[alerta.tipo_alerta]++;
    });
    
    return agrupadas;
}

/**
 * Agrupar alertas por urgencia
 */
function agruparPorUrgencia(alertas) {
    const agrupadas = {
        critico: 0,
        alto: 0,
        medio: 0,
        bajo: 0
    };
    
    alertas.forEach(alerta => {
        if (agrupadas.hasOwnProperty(alerta.nivel_urgencia)) {
            agrupadas[alerta.nivel_urgencia]++;
        }
    });
    
    return agrupadas;
}

/**
 * Agrupar alertas por mes
 */
function agruparPorMes(alertas) {
    const agrupadas = {};
    
    alertas.forEach(alerta => {
        const fecha = new Date(alerta.fecha_alerta);
        const mes = `${fecha.getFullYear()}-${(fecha.getMonth() + 1).toString().padStart(2, '0')}`;
        
        if (!agrupadas[mes]) {
            agrupadas[mes] = 0;
        }
        agrupadas[mes]++;
    });
    
    return agrupadas;
}

/**
 * Generar recomendaciones basadas en alertas
 */
function generarRecomendacionesAlertas(alertas) {
    const recomendaciones = [];
    
    // Alertas críticas
    const alertasCriticas = alertas.filter(a => a.nivel_urgencia === 'critico');
    if (alertasCriticas.length > 0) {
        recomendaciones.push({
            tipo: 'urgente',
            mensaje: 'Tiene alertas críticas que requieren atención inmediata',
            accion: 'revisar_alertas_criticas'
        });
    }
    
    // Alertas no resueltas
    const alertasNoResueltas = alertas.filter(a => a.estado === 'pendiente' || a.estado === 'enviada');
    if (alertasNoResueltas.length > 5) {
        recomendaciones.push({
            tipo: 'atencion',
            mensaje: 'Tiene muchas alertas pendientes de resolución',
            accion: 'resolver_alertas_pendientes'
        });
    }
    
    // Tiempo de resolución
    const alertasResueltas = alertas.filter(a => a.estado === 'resuelta');
    const tiempoPromedio = calcularPromedioResolucion(alertasResueltas);
    if (tiempoPromedio > 7) {
        recomendaciones.push({
            tipo: 'mejora',
            mensaje: 'El tiempo promedio de resolución de alertas es alto',
            accion: 'mejorar_tiempo_resolucion'
        });
    }
    
    return recomendaciones;
}

// =====================================================
// MANEJO DE ERRORES
// =====================================================

// Middleware para manejar errores específicos de alertas
router.use((error, req, res, next) => {
    if (error.message === 'Alerta no encontrada') {
        return res.status(404).json({
            success: false,
            message: 'Alerta no encontrada'
        });
    }
    
    next(error);
});

module.exports = router;
