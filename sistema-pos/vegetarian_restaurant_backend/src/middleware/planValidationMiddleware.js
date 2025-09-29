const SuscripcionModel = require('../models/SuscripcionModel');
const PlanModel = require('../models/PlanModel');

class PlanValidationMiddleware {
    constructor() {
        this.suscripcionModel = new SuscripcionModel();
        this.planModel = new PlanModel();
    }

    // =====================================================
    // MIDDLEWARE DE VALIDACIÓN DE PLANES
    // =====================================================

    /**
     * Middleware para validar que el restaurante tenga suscripción activa
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @param {Function} next - Next function
     */
    async validateActiveSubscription(req, res, next) {
        try {
            const idRestaurante = req.body.id_restaurante || req.params.idRestaurante;
            
            if (!idRestaurante) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de restaurante requerido'
                });
            }

            const suscripcion = await this.suscripcionModel.getActiveSubscription(parseInt(idRestaurante));
            
            if (!suscripcion) {
                return res.status(403).json({
                    success: false,
                    message: 'No se encontró una suscripción activa para este restaurante',
                    error: 'NO_ACTIVE_SUBSCRIPTION',
                    data: {
                        id_restaurante: parseInt(idRestaurante),
                        requiere_suscripcion: true
                    }
                });
            }

            // Verificar si la suscripción está próxima a vencer
            const diasRestantes = Math.ceil((new Date(suscripcion.fecha_fin) - new Date()) / (1000 * 60 * 60 * 24));
            
            if (diasRestantes <= 7 && diasRestantes > 0) {
                // Agregar advertencia de vencimiento
                req.suscripcion_warning = {
                    dias_restantes: diasRestantes,
                    fecha_vencimiento: suscripcion.fecha_fin,
                    mensaje: `Su suscripción vence en ${diasRestantes} días`
                };
            } else if (diasRestantes <= 0) {
                return res.status(403).json({
                    success: false,
                    message: 'Su suscripción ha expirado',
                    error: 'SUBSCRIPTION_EXPIRED',
                    data: {
                        id_restaurante: parseInt(idRestaurante),
                        fecha_vencimiento: suscripcion.fecha_fin,
                        dias_vencida: Math.abs(diasRestantes)
                    }
                });
            }

            // Agregar información de la suscripción al request
            req.suscripcion = suscripcion;
            next();
        } catch (error) {
            console.error('Error en validateActiveSubscription:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    /**
     * Middleware para validar que el plan tenga una funcionalidad específica
     * @param {string} funcionalidad - Nombre de la funcionalidad
     * @returns {Function} Middleware function
     */
    validatePlanFeature(funcionalidad) {
        return async (req, res, next) => {
            try {
                const idRestaurante = req.body.id_restaurante || req.params.idRestaurante;
                
                if (!idRestaurante) {
                    return res.status(400).json({
                        success: false,
                        message: 'ID de restaurante requerido'
                    });
                }

                const suscripcion = await this.suscripcionModel.getActiveSubscription(parseInt(idRestaurante));
                
                if (!suscripcion) {
                    return res.status(403).json({
                        success: false,
                        message: 'No se encontró una suscripción activa para este restaurante',
                        error: 'NO_ACTIVE_SUBSCRIPTION'
                    });
                }

                // Verificar si la funcionalidad está disponible
                const isAvailable = suscripcion[`incluye_${funcionalidad}`];
                
                if (!isAvailable) {
                    // Obtener planes que incluyen esta funcionalidad
                    const planesDisponibles = await this.getPlansWithFeature(funcionalidad);
                    
                    return res.status(403).json({
                        success: false,
                        message: `La funcionalidad '${funcionalidad}' no está disponible en su plan actual`,
                        error: 'FEATURE_NOT_AVAILABLE',
                        data: {
                            funcionalidad: funcionalidad,
                            plan_actual: suscripcion.nombre_plan,
                            planes_disponibles: planesDisponibles
                        }
                    });
                }

                next();
            } catch (error) {
                console.error(`Error en validatePlanFeature(${funcionalidad}):`, error);
                res.status(500).json({
                    success: false,
                    message: 'Error interno del servidor',
                    error: error.message
                });
            }
        };
    }

    /**
     * Middleware para validar límites de recursos
     * @param {string} tipoRecurso - Tipo de recurso
     * @param {number} cantidad - Cantidad a verificar
     * @returns {Function} Middleware function
     */
    validateResourceLimit(tipoRecurso, cantidad = 1) {
        return async (req, res, next) => {
            try {
                const idRestaurante = req.body.id_restaurante || req.params.idRestaurante;
                
                if (!idRestaurante) {
                    return res.status(400).json({
                        success: false,
                        message: 'ID de restaurante requerido'
                    });
                }

                const suscripcion = await this.suscripcionModel.getActiveSubscription(parseInt(idRestaurante));
                
                if (!suscripcion) {
                    return res.status(403).json({
                        success: false,
                        message: 'No se encontró una suscripción activa para este restaurante',
                        error: 'NO_ACTIVE_SUBSCRIPTION'
                    });
                }

                // Obtener límite del plan
                let limite = 0;
                switch (tipoRecurso) {
                    case 'sucursales':
                        limite = suscripcion.max_sucursales;
                        break;
                    case 'usuarios':
                        limite = suscripcion.max_usuarios;
                        break;
                    case 'productos':
                        limite = suscripcion.max_productos;
                        break;
                    case 'transacciones':
                        limite = suscripcion.max_transacciones_mes;
                        break;
                    case 'almacenamiento':
                        limite = suscripcion.almacenamiento_gb * 1024; // Convertir GB a MB
                        break;
                    default:
                        return res.status(400).json({
                            success: false,
                            message: 'Tipo de recurso inválido'
                        });
                }

                // Verificar si el límite permite la operación
                if (limite > 0 && cantidad > limite) {
                    return res.status(403).json({
                        success: false,
                        message: `Límite de ${tipoRecurso} excedido`,
                        error: 'LIMIT_EXCEEDED',
                        data: {
                            tipo_recurso: tipoRecurso,
                            limite_plan: limite,
                            cantidad_solicitada: cantidad,
                            plan_actual: suscripcion.nombre_plan
                        }
                    });
                }

                next();
            } catch (error) {
                console.error(`Error en validateResourceLimit(${tipoRecurso}):`, error);
                res.status(500).json({
                    success: false,
                    message: 'Error interno del servidor',
                    error: error.message
                });
            }
        };
    }

    /**
     * Middleware para validar que el plan no esté suspendido
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @param {Function} next - Next function
     */
    async validateNotSuspended(req, res, next) {
        try {
            const idRestaurante = req.body.id_restaurante || req.params.idRestaurante;
            
            if (!idRestaurante) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de restaurante requerido'
                });
            }

            const suscripcion = await this.suscripcionModel.getActiveSubscription(parseInt(idRestaurante));
            
            if (!suscripcion) {
                return res.status(403).json({
                    success: false,
                    message: 'No se encontró una suscripción activa para este restaurante',
                    error: 'NO_ACTIVE_SUBSCRIPTION'
                });
            }

            if (suscripcion.estado === 'suspendida') {
                return res.status(403).json({
                    success: false,
                    message: 'Su suscripción está suspendida',
                    error: 'SUBSCRIPTION_SUSPENDED',
                    data: {
                        id_restaurante: parseInt(idRestaurante),
                        estado: suscripcion.estado,
                        motivo_suspension: suscripcion.motivo_suspension,
                        fecha_suspension: suscripcion.fecha_suspension
                    }
                });
            }

            next();
        } catch (error) {
            console.error('Error en validateNotSuspended:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    /**
     * Middleware para validar que el plan no esté cancelado
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @param {Function} next - Next function
     */
    async validateNotCancelled(req, res, next) {
        try {
            const idRestaurante = req.body.id_restaurante || req.params.idRestaurante;
            
            if (!idRestaurante) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de restaurante requerido'
                });
            }

            const suscripcion = await this.suscripcionModel.getActiveSubscription(parseInt(idRestaurante));
            
            if (!suscripcion) {
                return res.status(403).json({
                    success: false,
                    message: 'No se encontró una suscripción activa para este restaurante',
                    error: 'NO_ACTIVE_SUBSCRIPTION'
                });
            }

            if (suscripcion.estado === 'cancelada') {
                return res.status(403).json({
                    success: false,
                    message: 'Su suscripción ha sido cancelada',
                    error: 'SUBSCRIPTION_CANCELLED',
                    data: {
                        id_restaurante: parseInt(idRestaurante),
                        estado: suscripcion.estado,
                        motivo_cancelacion: suscripcion.motivo_cancelacion,
                        fecha_cancelacion: suscripcion.fecha_cancelacion
                    }
                });
            }

            next();
        } catch (error) {
            console.error('Error en validateNotCancelled:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    /**
     * Middleware para validar que el plan tenga auto-renovación activa
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @param {Function} next - Next function
     */
    async validateAutoRenewal(req, res, next) {
        try {
            const idRestaurante = req.body.id_restaurante || req.params.idRestaurante;
            
            if (!idRestaurante) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de restaurante requerido'
                });
            }

            const suscripcion = await this.suscripcionModel.getActiveSubscription(parseInt(idRestaurante));
            
            if (!suscripcion) {
                return res.status(403).json({
                    success: false,
                    message: 'No se encontró una suscripción activa para este restaurante',
                    error: 'NO_ACTIVE_SUBSCRIPTION'
                });
            }

            if (!suscripcion.auto_renovacion) {
                return res.status(403).json({
                    success: false,
                    message: 'La auto-renovación está desactivada para su suscripción',
                    error: 'AUTO_RENEWAL_DISABLED',
                    data: {
                        id_restaurante: parseInt(idRestaurante),
                        auto_renovacion: suscripcion.auto_renovacion,
                        fecha_fin: suscripcion.fecha_fin
                    }
                });
            }

            next();
        } catch (error) {
            console.error('Error en validateAutoRenewal:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    // =====================================================
    // MÉTODOS DE UTILIDAD
    // =====================================================

    /**
     * Obtener planes que incluyen una funcionalidad específica
     * @param {string} funcionalidad - Nombre de la funcionalidad
     * @returns {Promise<Array>} Lista de planes
     */
    async getPlansWithFeature(funcionalidad) {
        try {
            const planes = await this.planModel.getAllPlans();
            return planes
                .filter(plan => plan[`incluye_${funcionalidad}`])
                .map(plan => ({
                    id_plan: plan.id_plan,
                    nombre: plan.nombre,
                    precio_mensual: plan.precio_mensual
                }));
        } catch (error) {
            console.error('Error al obtener planes con funcionalidad:', error);
            return [];
        }
    }

    /**
     * Obtener información del plan actual
     * @param {number} idRestaurante - ID del restaurante
     * @returns {Promise<Object|null>} Información del plan
     */
    async getCurrentPlanInfo(idRestaurante) {
        try {
            const suscripcion = await this.suscripcionModel.getActiveSubscription(idRestaurante);
            
            if (!suscripcion) {
                return null;
            }

            return {
                id_plan: suscripcion.id_plan,
                nombre_plan: suscripcion.nombre_plan,
                precio_mensual: suscripcion.precio_mensual,
                precio_anual: suscripcion.precio_anual,
                fecha_inicio: suscripcion.fecha_inicio,
                fecha_fin: suscripcion.fecha_fin,
                estado: suscripcion.estado,
                auto_renovacion: suscripcion.auto_renovacion,
                limites: {
                    max_sucursales: suscripcion.max_sucursales,
                    max_usuarios: suscripcion.max_usuarios,
                    max_productos: suscripcion.max_productos,
                    max_transacciones_mes: suscripcion.max_transacciones_mes,
                    almacenamiento_gb: suscripcion.almacenamiento_gb
                },
                funcionalidades: {
                    incluye_pos: suscripcion.incluye_pos,
                    incluye_inventario_basico: suscripcion.incluye_inventario_basico,
                    incluye_inventario_avanzado: suscripcion.incluye_inventario_avanzado,
                    incluye_promociones: suscripcion.incluye_promociones,
                    incluye_reservas: suscripcion.incluye_reservas,
                    incluye_arqueo_caja: suscripcion.incluye_arqueo_caja,
                    incluye_egresos: suscripcion.incluye_egresos,
                    incluye_egresos_avanzados: suscripcion.incluye_egresos_avanzados,
                    incluye_reportes_avanzados: suscripcion.incluye_reportes_avanzados,
                    incluye_analytics: suscripcion.incluye_analytics,
                    incluye_delivery: suscripcion.incluye_delivery,
                    incluye_impresion: suscripcion.incluye_impresion,
                    incluye_soporte_24h: suscripcion.incluye_soporte_24h,
                    incluye_api: suscripcion.incluye_api,
                    incluye_white_label: suscripcion.incluye_white_label
                }
            };
        } catch (error) {
            console.error('Error al obtener información del plan actual:', error);
            return null;
        }
    }

    /**
     * Verificar si una funcionalidad está disponible
     * @param {number} idRestaurante - ID del restaurante
     * @param {string} funcionalidad - Nombre de la funcionalidad
     * @returns {Promise<boolean>} True si está disponible
     */
    async isFeatureAvailable(idRestaurante, funcionalidad) {
        try {
            const suscripcion = await this.suscripcionModel.getActiveSubscription(idRestaurante);
            
            if (!suscripcion) {
                return false;
            }

            return suscripcion[`incluye_${funcionalidad}`] || false;
        } catch (error) {
            console.error('Error al verificar disponibilidad de funcionalidad:', error);
            return false;
        }
    }

    /**
     * Obtener límites del plan actual
     * @param {number} idRestaurante - ID del restaurante
     * @returns {Promise<Object|null>} Límites del plan
     */
    async getCurrentLimits(idRestaurante) {
        try {
            const suscripcion = await this.suscripcionModel.getActiveSubscription(idRestaurante);
            
            if (!suscripcion) {
                return null;
            }

            return {
                max_sucursales: suscripcion.max_sucursales,
                max_usuarios: suscripcion.max_usuarios,
                max_productos: suscripcion.max_productos,
                max_transacciones_mes: suscripcion.max_transacciones_mes,
                almacenamiento_gb: suscripcion.almacenamiento_gb
            };
        } catch (error) {
            console.error('Error al obtener límites actuales:', error);
            return null;
        }
    }

    // =====================================================
    // MÉTODOS DE UTILIDAD
    // =====================================================

    /**
     * Cerrar conexiones a la base de datos
     */
    async close() {
        await this.suscripcionModel.close();
        await this.planModel.close();
    }
}

module.exports = PlanValidationMiddleware;
