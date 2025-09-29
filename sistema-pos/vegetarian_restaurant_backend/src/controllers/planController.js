const PlanModel = require('../models/PlanModel');
const SuscripcionModel = require('../models/SuscripcionModel');
const ContadorUsoModel = require('../models/ContadorUsoModel');
const AlertaLimiteModel = require('../models/AlertaLimiteModel');

class PlanController {
    constructor() {
        this.planModel = new PlanModel();
        this.suscripcionModel = new SuscripcionModel();
        this.contadorUsoModel = new ContadorUsoModel();
        this.alertaLimiteModel = new AlertaLimiteModel();
    }

    // =====================================================
    // MÉTODOS DE CONSULTA DE PLANES
    // =====================================================

    /**
     * Obtener todos los planes activos
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    async getAllPlans(req, res) {
        try {
            const planes = await this.planModel.getAllPlans();
            
            res.status(200).json({
                success: true,
                message: 'Planes obtenidos exitosamente',
                data: planes,
                count: planes.length
            });
        } catch (error) {
            console.error('Error en getAllPlans:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    /**
     * Obtener un plan por ID
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    async getPlanById(req, res) {
        try {
            const { id } = req.params;
            const idPlan = parseInt(id);

            if (isNaN(idPlan)) {
      return res.status(400).json({
                    success: false,
                    message: 'ID de plan inválido'
                });
            }

            const plan = await this.planModel.getPlanById(idPlan);

            if (!plan) {
                return res.status(404).json({
                    success: false,
                    message: 'Plan no encontrado'
                });
            }

            res.status(200).json({
                success: true,
                message: 'Plan obtenido exitosamente',
                data: plan
            });
        } catch (error) {
            console.error('Error en getPlanById:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    /**
     * Obtener un plan por nombre
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    async getPlanByName(req, res) {
        try {
            const { nombre } = req.params;

            if (!nombre) {
                return res.status(400).json({
                    success: false,
                    message: 'Nombre de plan requerido'
                });
            }

            const plan = await this.planModel.getPlanByName(nombre);

            if (!plan) {
      return res.status(404).json({
                    success: false,
                    message: 'Plan no encontrado'
                });
            }

            res.status(200).json({
                success: true,
                message: 'Plan obtenido exitosamente',
                data: plan
            });
        } catch (error) {
            console.error('Error en getPlanByName:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    /**
     * Obtener planes con descuento anual
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    async getPlansWithAnnualDiscount(req, res) {
        try {
            const planes = await this.planModel.getPlansWithAnnualDiscount();

    res.status(200).json({
                success: true,
                message: 'Planes con descuento anual obtenidos exitosamente',
                data: planes,
                count: planes.length
            });
        } catch (error) {
            console.error('Error en getPlansWithAnnualDiscount:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    /**
     * Comparar dos planes
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    async comparePlans(req, res) {
        try {
            const { idPlan1, idPlan2 } = req.params;
            const plan1 = parseInt(idPlan1);
            const plan2 = parseInt(idPlan2);

            if (isNaN(plan1) || isNaN(plan2)) {
                return res.status(400).json({
                    success: false,
                    message: 'IDs de planes inválidos'
                });
            }

            if (plan1 === plan2) {
                return res.status(400).json({
                    success: false,
                    message: 'No se pueden comparar el mismo plan'
                });
            }

            const comparacion = await this.planModel.comparePlans(plan1, plan2);

            res.status(200).json({
                success: true,
                message: 'Comparación de planes realizada exitosamente',
                data: comparacion
            });
  } catch (error) {
            console.error('Error en comparePlans:', error);
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
     * Validar si un plan existe
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    async validatePlan(req, res) {
        try {
            const { id } = req.params;
            const idPlan = parseInt(id);

            if (isNaN(idPlan)) {
      return res.status(400).json({
                    success: false,
                    message: 'ID de plan inválido'
                });
            }

            const isValid = await this.planModel.validatePlan(idPlan);

            res.status(200).json({
                success: true,
                message: 'Validación de plan completada',
                data: {
                    id_plan: idPlan,
                    valido: isValid
                }
            });
        } catch (error) {
            console.error('Error en validatePlan:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    /**
     * Verificar disponibilidad de funcionalidad
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    async checkFeatureAvailability(req, res) {
        try {
            const { id, funcionalidad } = req.params;
            const idPlan = parseInt(id);

            if (isNaN(idPlan)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de plan inválido'
                });
            }

            if (!funcionalidad) {
                return res.status(400).json({
                    success: false,
                    message: 'Funcionalidad requerida'
                });
            }

            const isAvailable = await this.planModel.checkFeatureAvailability(idPlan, funcionalidad);

    res.status(200).json({
                success: true,
                message: 'Verificación de funcionalidad completada',
      data: {
                    id_plan: idPlan,
                    funcionalidad: funcionalidad,
                    disponible: isAvailable
                }
            });
        } catch (error) {
            console.error('Error en checkFeatureAvailability:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    /**
     * Obtener límites de un plan
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    async getPlanLimits(req, res) {
        try {
            const { id } = req.params;
            const idPlan = parseInt(id);

            if (isNaN(idPlan)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de plan inválido'
                });
            }

            const limites = await this.planModel.getPlanLimits(idPlan);

            if (!limites) {
                return res.status(404).json({
                    success: false,
                    message: 'Plan no encontrado'
                });
            }

            res.status(200).json({
                success: true,
                message: 'Límites del plan obtenidos exitosamente',
                data: limites
            });
        } catch (error) {
            console.error('Error en getPlanLimits:', error);
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
     * Obtener estadísticas de uso de planes
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    async getPlanUsageStats(req, res) {
        try {
            const stats = await this.planModel.getPlanUsageStats();
            
            res.status(200).json({
                success: true,
                message: 'Estadísticas de uso de planes obtenidas exitosamente',
                data: stats
            });
        } catch (error) {
            console.error('Error en getPlanUsageStats:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    /**
     * Obtener el plan más popular
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    async getMostPopularPlan(req, res) {
        try {
            const plan = await this.planModel.getMostPopularPlan();
            
            res.status(200).json({
                success: true,
                message: 'Plan más popular obtenido exitosamente',
                data: plan
            });
        } catch (error) {
            console.error('Error en getMostPopularPlan:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    // =====================================================
    // MÉTODOS DE ADMINISTRACIÓN
    // =====================================================

    /**
     * Crear un nuevo plan
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    async createPlan(req, res) {
        try {
            const planData = req.body;

            // Validar datos requeridos
            const requiredFields = ['nombre', 'precio_mensual'];
            const missingFields = requiredFields.filter(field => !planData[field]);

            if (missingFields.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Campos requeridos faltantes',
                    missing_fields: missingFields
                });
            }

            const plan = await this.planModel.createPlan(planData);

            res.status(201).json({
                success: true,
                message: 'Plan creado exitosamente',
                data: plan
            });
        } catch (error) {
            console.error('Error en createPlan:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    /**
     * Actualizar un plan
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    async updatePlan(req, res) {
        try {
            const { id } = req.params;
            const idPlan = parseInt(id);
            const planData = req.body;

            if (isNaN(idPlan)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de plan inválido'
                });
            }

            const plan = await this.planModel.updatePlan(idPlan, planData);

            res.status(200).json({
                success: true,
                message: 'Plan actualizado exitosamente',
                data: plan
            });
        } catch (error) {
            console.error('Error en updatePlan:', error);
            if (error.message === 'Plan no encontrado') {
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
     * Desactivar un plan
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    async deactivatePlan(req, res) {
        try {
            const { id } = req.params;
            const idPlan = parseInt(id);

            if (isNaN(idPlan)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de plan inválido'
                });
            }

            const success = await this.planModel.deactivatePlan(idPlan);

            if (!success) {
                return res.status(404).json({
                    success: false,
                    message: 'Plan no encontrado'
                });
            }

            res.status(200).json({
                success: true,
                message: 'Plan desactivado exitosamente'
            });
  } catch (error) {
            console.error('Error en deactivatePlan:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    // =====================================================
    // MÉTODOS DE INTEGRACIÓN CON SUSCRIPCIONES
    // =====================================================

    /**
     * Obtener plan actual de un restaurante
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    async getCurrentRestaurantPlan(req, res) {
        try {
            const { idRestaurante } = req.params;
            const id = parseInt(idRestaurante);

            if (isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de restaurante inválido'
                });
            }

            // Obtener suscripción activa
            const suscripcion = await this.suscripcionModel.getActiveSubscription(id);

            if (!suscripcion) {
                return res.status(404).json({
                    success: false,
                    message: 'No se encontró suscripción activa para este restaurante'
                });
            }

            // Obtener información completa del plan
            const plan = await this.planModel.getPlanById(suscripcion.id_plan);

            if (!plan) {
                return res.status(404).json({
                    success: false,
                    message: 'No se encontró información del plan'
                });
            }

            // Obtener todos los contadores de uso actuales
            const contadores = await this.contadorUsoModel.getAllCurrentUsage(id);

            // Construir respuesta con estructura completa
            const planInfo = {
                plan: plan,
                suscripcion: suscripcion,
                limites: {
                    max_sucursales: plan.max_sucursales,
                    max_usuarios: plan.max_usuarios,
                    max_productos: plan.max_productos,
                    max_transacciones_mes: plan.max_transacciones_mes,
                    almacenamiento_gb: plan.almacenamiento_gb
                },
                uso_actual: {
                    sucursales_actuales: contadores.find(c => c.recurso === 'sucursales')?.uso_actual || 0,
                    usuarios_actuales: contadores.find(c => c.recurso === 'usuarios')?.uso_actual || 0,
                    productos_actuales: contadores.find(c => c.recurso === 'productos')?.uso_actual || 0,
                    transacciones_mes_actual: contadores.find(c => c.recurso === 'transacciones')?.uso_actual || 0,
                    almacenamiento_usado_mb: contadores.find(c => c.recurso === 'almacenamiento')?.uso_actual || 0
                },
                funcionalidades: {
                    incluye_pos: plan.incluye_pos,
                    incluye_inventario_basico: plan.incluye_inventario_basico,
                    incluye_inventario_avanzado: plan.incluye_inventario_avanzado,
                    incluye_promociones: plan.incluye_promociones,
                    incluye_reservas: plan.incluye_reservas,
                    incluye_arqueo_caja: plan.incluye_arqueo_caja,
                    incluye_egresos: plan.incluye_egresos,
                    incluye_egresos_avanzados: plan.incluye_egresos_avanzados,
                    incluye_reportes_avanzados: plan.incluye_reportes_avanzados,
                    incluye_analytics: plan.incluye_analytics,
                    incluye_delivery: plan.incluye_delivery,
                    incluye_impresion: plan.incluye_impresion,
                    incluye_soporte_24h: plan.incluye_soporte_24h,
                    incluye_api: plan.incluye_api,
                    incluye_white_label: plan.incluye_white_label
                }
            };

            res.status(200).json({
                success: true,
                message: 'Plan actual del restaurante obtenido exitosamente',
                data: planInfo
            });
        } catch (error) {
            console.error('Error en getCurrentRestaurantPlan:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    /**
     * Obtener uso actual de un restaurante
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    async getCurrentRestaurantUsage(req, res) {
        try {
            const { idRestaurante } = req.params;
            const id = parseInt(idRestaurante);

            if (isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de restaurante inválido'
                });
            }

            const uso = await this.contadorUsoModel.getCurrentUsage(id);

            if (!uso) {
                return res.status(404).json({
                    success: false,
                    message: 'No se encontró información de uso para este restaurante'
                });
            }

    res.status(200).json({
                success: true,
                message: 'Uso actual del restaurante obtenido exitosamente',
                data: uso
            });
        } catch (error) {
            console.error('Error en getCurrentRestaurantUsage:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    /**
     * Verificar límites de un restaurante
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    async checkRestaurantLimits(req, res) {
        try {
            const { idRestaurante } = req.params;
            const id = parseInt(idRestaurante);

            if (isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de restaurante inválido'
                });
            }

            const limites = await this.contadorUsoModel.checkLimits(id);

            if (!limites) {
                return res.status(404).json({
                    success: false,
                    message: 'No se encontró información de límites para este restaurante'
                });
            }

            res.status(200).json({
                success: true,
                message: 'Límites del restaurante verificados exitosamente',
                data: limites
            });
  } catch (error) {
            console.error('Error en checkRestaurantLimits:', error);
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
        await this.planModel.close();
        await this.suscripcionModel.close();
        await this.contadorUsoModel.close();
        await this.alertaLimiteModel.close();
    }
}

module.exports = PlanController;