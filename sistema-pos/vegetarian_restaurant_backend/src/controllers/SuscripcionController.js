const SuscripcionModel = require('../models/SuscripcionModel');
const PlanModel = require('../models/PlanModel');
const ContadorUsoModel = require('../models/ContadorUsoModel');
const AlertaLimiteModel = require('../models/AlertaLimiteModel');

class SuscripcionController {
    constructor() {
        this.suscripcionModel = new SuscripcionModel();
        this.planModel = new PlanModel();
        this.contadorUsoModel = new ContadorUsoModel();
        this.alertaLimiteModel = new AlertaLimiteModel();
    }

    // =====================================================
    // MÉTODOS DE CONSULTA DE SUSCRIPCIONES
    // =====================================================

    /**
     * Obtener suscripción activa de un restaurante
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    async getActiveSubscription(req, res) {
        try {
            const { idRestaurante } = req.params;
            const id = parseInt(idRestaurante);

            if (isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de restaurante inválido'
                });
            }

            const suscripcion = await this.suscripcionModel.getActiveSubscription(id);

            if (!suscripcion) {
                return res.status(404).json({
                    success: false,
                    message: 'No se encontró suscripción activa para este restaurante'
                });
            }

            res.status(200).json({
                success: true,
                message: 'Suscripción activa obtenida exitosamente',
                data: suscripcion
            });
        } catch (error) {
            console.error('Error en getActiveSubscription:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    /**
     * Obtener todas las suscripciones de un restaurante
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    async getRestaurantSubscriptions(req, res) {
        try {
            const { idRestaurante } = req.params;
            const id = parseInt(idRestaurante);

            if (isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de restaurante inválido'
                });
            }

            const suscripciones = await this.suscripcionModel.getRestaurantSubscriptions(id);

            res.status(200).json({
                success: true,
                message: 'Suscripciones del restaurante obtenidas exitosamente',
                data: suscripciones,
                count: suscripciones.length
            });
        } catch (error) {
            console.error('Error en getRestaurantSubscriptions:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    /**
     * Obtener suscripciones por estado
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    async getSubscriptionsByStatus(req, res) {
        try {
            const { estado } = req.params;

            if (!estado) {
                return res.status(400).json({
                    success: false,
                    message: 'Estado requerido'
                });
            }

            const suscripciones = await this.suscripcionModel.getSubscriptionsByStatus(estado);

            res.status(200).json({
                success: true,
                message: `Suscripciones con estado '${estado}' obtenidas exitosamente`,
                data: suscripciones,
                count: suscripciones.length
            });
        } catch (error) {
            console.error('Error en getSubscriptionsByStatus:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    /**
     * Obtener suscripciones próximas a vencer
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    async getSubscriptionsExpiringSoon(req, res) {
        try {
            const { dias } = req.query;
            const diasAnticipacion = dias ? parseInt(dias) : 7;

            if (isNaN(diasAnticipacion) || diasAnticipacion < 1) {
                return res.status(400).json({
                    success: false,
                    message: 'Número de días inválido'
                });
            }

            const suscripciones = await this.suscripcionModel.getSubscriptionsExpiringSoon(diasAnticipacion);

            res.status(200).json({
                success: true,
                message: `Suscripciones próximas a vencer (${diasAnticipacion} días) obtenidas exitosamente`,
                data: suscripciones,
                count: suscripciones.length
            });
        } catch (error) {
            console.error('Error en getSubscriptionsExpiringSoon:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    /**
     * Obtener suscripciones vencidas
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    async getExpiredSubscriptions(req, res) {
        try {
            const suscripciones = await this.suscripcionModel.getExpiredSubscriptions();

            res.status(200).json({
                success: true,
                message: 'Suscripciones vencidas obtenidas exitosamente',
                data: suscripciones,
                count: suscripciones.length
            });
        } catch (error) {
            console.error('Error en getExpiredSubscriptions:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    // =====================================================
    // MÉTODOS DE GESTIÓN DE SUSCRIPCIONES
    // =====================================================

    /**
     * Crear una nueva suscripción
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    async createSubscription(req, res) {
        try {
            const suscripcionData = req.body;

            // Validar datos requeridos
            const requiredFields = ['id_restaurante', 'id_plan', 'fecha_inicio', 'fecha_fin'];
            const missingFields = requiredFields.filter(field => !suscripcionData[field]);

            if (missingFields.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Campos requeridos faltantes',
                    missing_fields: missingFields
                });
            }

            // Verificar que el plan existe
            const planExists = await this.planModel.validatePlan(suscripcionData.id_plan);
            if (!planExists) {
                return res.status(400).json({
                    success: false,
                    message: 'Plan no válido'
                });
            }

            // Verificar que no existe una suscripción activa
            const hasActive = await this.suscripcionModel.hasActiveSubscription(suscripcionData.id_restaurante);
            if (hasActive) {
                return res.status(400).json({
                    success: false,
                    message: 'Ya existe una suscripción activa para este restaurante'
                });
            }

            const suscripcion = await this.suscripcionModel.createSubscription(suscripcionData);

            res.status(201).json({
                success: true,
                message: 'Suscripción creada exitosamente',
                data: suscripcion
            });
        } catch (error) {
            console.error('Error en createSubscription:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    /**
     * Actualizar una suscripción
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    async updateSubscription(req, res) {
        try {
            const { id } = req.params;
            const idSuscripcion = parseInt(id);
            const suscripcionData = req.body;

            if (isNaN(idSuscripcion)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de suscripción inválido'
                });
            }

            const suscripcion = await this.suscripcionModel.updateSubscription(idSuscripcion, suscripcionData);

            res.status(200).json({
                success: true,
                message: 'Suscripción actualizada exitosamente',
                data: suscripcion
            });
        } catch (error) {
            console.error('Error en updateSubscription:', error);
            if (error.message === 'Suscripción no encontrada') {
                return res.status(404).json({
                    success: false,
                    message: error.message
                });
            }
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    /**
     * Cambiar el plan de una suscripción
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    async changePlan(req, res) {
        try {
            const { id } = req.params;
            const idSuscripcion = parseInt(id);
            const { nuevoIdPlan, motivo } = req.body;

            if (isNaN(idSuscripcion)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de suscripción inválido'
                });
            }

            if (!nuevoIdPlan) {
                return res.status(400).json({
                    success: false,
                    message: 'Nuevo ID de plan requerido'
                });
            }

            // Verificar que el nuevo plan existe
            const planExists = await this.planModel.validatePlan(nuevoIdPlan);
            if (!planExists) {
                return res.status(400).json({
                    success: false,
                    message: 'Nuevo plan no válido'
                });
            }

            const suscripcion = await this.suscripcionModel.changePlan(idSuscripcion, nuevoIdPlan, motivo);

            res.status(200).json({
                success: true,
                message: 'Plan cambiado exitosamente',
                data: suscripcion
            });
        } catch (error) {
            console.error('Error en changePlan:', error);
            if (error.message === 'Suscripción no encontrada') {
                return res.status(404).json({
                    success: false,
                    message: error.message
                });
            }
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    /**
     * Suspender una suscripción
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    async suspendSubscription(req, res) {
        try {
            const { id } = req.params;
            const idSuscripcion = parseInt(id);
            const { motivo } = req.body;

            if (isNaN(idSuscripcion)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de suscripción inválido'
                });
            }

            if (!motivo) {
                return res.status(400).json({
                    success: false,
                    message: 'Motivo de suspensión requerido'
                });
            }

            const suscripcion = await this.suscripcionModel.suspendSubscription(idSuscripcion, motivo);

            res.status(200).json({
                success: true,
                message: 'Suscripción suspendida exitosamente',
                data: suscripcion
            });
        } catch (error) {
            console.error('Error en suspendSubscription:', error);
            if (error.message === 'Suscripción no encontrada') {
                return res.status(404).json({
                    success: false,
                    message: error.message
                });
            }
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    /**
     * Reactivar una suscripción
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    async reactivateSubscription(req, res) {
        try {
            const { id } = req.params;
            const idSuscripcion = parseInt(id);
            const { motivo } = req.body;

            if (isNaN(idSuscripcion)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de suscripción inválido'
                });
            }

            const suscripcion = await this.suscripcionModel.reactivateSubscription(idSuscripcion, motivo);

            res.status(200).json({
                success: true,
                message: 'Suscripción reactivada exitosamente',
                data: suscripcion
            });
        } catch (error) {
            console.error('Error en reactivateSubscription:', error);
            if (error.message === 'Suscripción no encontrada') {
                return res.status(404).json({
                    success: false,
                    message: error.message
                });
            }
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    /**
     * Cancelar una suscripción
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    async cancelSubscription(req, res) {
        try {
            const { id } = req.params;
            const idSuscripcion = parseInt(id);
            const { motivo } = req.body;

            if (isNaN(idSuscripcion)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de suscripción inválido'
                });
            }

            if (!motivo) {
                return res.status(400).json({
                    success: false,
                    message: 'Motivo de cancelación requerido'
                });
            }

            const suscripcion = await this.suscripcionModel.cancelSubscription(idSuscripcion, motivo);

            res.status(200).json({
                success: true,
                message: 'Suscripción cancelada exitosamente',
                data: suscripcion
            });
        } catch (error) {
            console.error('Error en cancelSubscription:', error);
            if (error.message === 'Suscripción no encontrada') {
                return res.status(404).json({
                    success: false,
                    message: error.message
                });
            }
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    // =====================================================
    // MÉTODOS DE VALIDACIÓN
    // =====================================================

    /**
     * Verificar si un restaurante tiene suscripción activa
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    async hasActiveSubscription(req, res) {
        try {
            const { idRestaurante } = req.params;
            const id = parseInt(idRestaurante);

            if (isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de restaurante inválido'
                });
            }

            const hasActive = await this.suscripcionModel.hasActiveSubscription(id);

            res.status(200).json({
                success: true,
                message: 'Verificación de suscripción completada',
                data: {
                    id_restaurante: id,
                    tiene_suscripcion_activa: hasActive
                }
            });
        } catch (error) {
            console.error('Error en hasActiveSubscription:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    /**
     * Verificar si una suscripción está próxima a vencer
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    async isSubscriptionExpiringSoon(req, res) {
        try {
            const { id } = req.params;
            const idSuscripcion = parseInt(id);
            const { dias } = req.query;
            const diasAnticipacion = dias ? parseInt(dias) : 7;

            if (isNaN(idSuscripcion)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de suscripción inválido'
                });
            }

            if (isNaN(diasAnticipacion) || diasAnticipacion < 1) {
                return res.status(400).json({
                    success: false,
                    message: 'Número de días inválido'
                });
            }

            const isExpiring = await this.suscripcionModel.isSubscriptionExpiringSoon(idSuscripcion, diasAnticipacion);

            res.status(200).json({
                success: true,
                message: 'Verificación de vencimiento completada',
                data: {
                    id_suscripcion: idSuscripcion,
                    proxima_a_vencer: isExpiring,
                    dias_anticipacion: diasAnticipacion
                }
            });
        } catch (error) {
            console.error('Error en isSubscriptionExpiringSoon:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    /**
     * Verificar si una suscripción está vencida
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    async isSubscriptionExpired(req, res) {
        try {
            const { id } = req.params;
            const idSuscripcion = parseInt(id);

            if (isNaN(idSuscripcion)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de suscripción inválido'
                });
            }

            const isExpired = await this.suscripcionModel.isSubscriptionExpired(idSuscripcion);

            res.status(200).json({
                success: true,
                message: 'Verificación de vencimiento completada',
                data: {
                    id_suscripcion: idSuscripcion,
                    vencida: isExpired
                }
            });
        } catch (error) {
            console.error('Error en isSubscriptionExpired:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    // =====================================================
    // MÉTODOS DE ESTADÍSTICAS
    // =====================================================

    /**
     * Obtener estadísticas de suscripciones
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    async getSubscriptionStats(req, res) {
        try {
            const stats = await this.suscripcionModel.getSubscriptionStats();
            
            res.status(200).json({
                success: true,
                message: 'Estadísticas de suscripciones obtenidas exitosamente',
                data: stats
            });
        } catch (error) {
            console.error('Error en getSubscriptionStats:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    /**
     * Obtener ingresos por suscripciones
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    async getSubscriptionRevenue(req, res) {
        try {
            const { periodo } = req.query;
            const tipoPeriodo = periodo || 'mensual';

            if (!['mensual', 'anual'].includes(tipoPeriodo)) {
                return res.status(400).json({
                    success: false,
                    message: 'Período inválido. Use "mensual" o "anual"'
                });
            }

            const ingresos = await this.suscripcionModel.getSubscriptionRevenue(tipoPeriodo);
            
            res.status(200).json({
                success: true,
                message: `Ingresos por suscripciones (${tipoPeriodo}) obtenidos exitosamente`,
                data: ingresos
            });
        } catch (error) {
            console.error('Error en getSubscriptionRevenue:', error);
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
     * Cerrar conexiones a la base de datos
     */
    async close() {
        await this.suscripcionModel.close();
        await this.planModel.close();
        await this.contadorUsoModel.close();
        await this.alertaLimiteModel.close();
    }
}

module.exports = SuscripcionController;
