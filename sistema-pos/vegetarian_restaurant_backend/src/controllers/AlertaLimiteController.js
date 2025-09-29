const AlertaLimiteModel = require('../models/AlertaLimiteModel');
const SuscripcionModel = require('../models/SuscripcionModel');
const ContadorUsoModel = require('../models/ContadorUsoModel');

class AlertaLimiteController {
    constructor() {
        this.alertaLimiteModel = new AlertaLimiteModel();
        this.suscripcionModel = new SuscripcionModel();
        this.contadorUsoModel = new ContadorUsoModel();
    }

    // =====================================================
    // MÉTODOS DE CONSULTA DE ALERTAS
    // =====================================================

    /**
     * Obtener alertas de un restaurante
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    async getRestaurantAlerts(req, res) {
        try {
            const { idRestaurante } = req.params;
            const { estado } = req.query;
            const id = parseInt(idRestaurante);

            if (isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de restaurante inválido'
                });
            }

            const alertas = await this.alertaLimiteModel.getRestaurantAlerts(id, estado);

            res.status(200).json({
                success: true,
                message: 'Alertas del restaurante obtenidas exitosamente',
                data: alertas,
                count: alertas.length
            });
        } catch (error) {
            console.error('Error en getRestaurantAlerts:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    /**
     * Obtener alertas por estado
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    async getAlertsByStatus(req, res) {
        try {
            const { estado } = req.params;

            if (!estado) {
                return res.status(400).json({
                    success: false,
                    message: 'Estado requerido'
                });
            }

            const estadosValidos = ['pendiente', 'enviada', 'resuelta', 'ignorada'];
            if (!estadosValidos.includes(estado)) {
                return res.status(400).json({
                    success: false,
                    message: 'Estado inválido',
                    estados_validos: estadosValidos
                });
            }

            const alertas = await this.alertaLimiteModel.getAlertsByStatus(estado);

            res.status(200).json({
                success: true,
                message: `Alertas con estado '${estado}' obtenidas exitosamente`,
                data: alertas,
                count: alertas.length
            });
        } catch (error) {
            console.error('Error en getAlertsByStatus:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    /**
     * Obtener alertas por nivel de urgencia
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    async getAlertsByUrgency(req, res) {
        try {
            const { nivelUrgencia } = req.params;

            if (!nivelUrgencia) {
                return res.status(400).json({
                    success: false,
                    message: 'Nivel de urgencia requerido'
                });
            }

            const nivelesValidos = ['bajo', 'medio', 'alto', 'critico'];
            if (!nivelesValidos.includes(nivelUrgencia)) {
                return res.status(400).json({
                    success: false,
                    message: 'Nivel de urgencia inválido',
                    niveles_validos: nivelesValidos
                });
            }

            const alertas = await this.alertaLimiteModel.getAlertsByUrgency(nivelUrgencia);

            res.status(200).json({
                success: true,
                message: `Alertas con nivel de urgencia '${nivelUrgencia}' obtenidas exitosamente`,
                data: alertas,
                count: alertas.length
            });
        } catch (error) {
            console.error('Error en getAlertsByUrgency:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    /**
     * Obtener alertas críticas
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    async getCriticalAlerts(req, res) {
        try {
            const alertas = await this.alertaLimiteModel.getCriticalAlerts();

            res.status(200).json({
                success: true,
                message: 'Alertas críticas obtenidas exitosamente',
                data: alertas,
                count: alertas.length
            });
        } catch (error) {
            console.error('Error en getCriticalAlerts:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    /**
     * Obtener alertas pendientes de notificación
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    async getPendingNotificationAlerts(req, res) {
        try {
            const alertas = await this.alertaLimiteModel.getPendingNotificationAlerts();

            res.status(200).json({
                success: true,
                message: 'Alertas pendientes de notificación obtenidas exitosamente',
                data: alertas,
                count: alertas.length
            });
        } catch (error) {
            console.error('Error en getPendingNotificationAlerts:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    /**
     * Obtener alertas por tipo
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    async getAlertsByType(req, res) {
        try {
            const { tipoAlerta } = req.params;

            if (!tipoAlerta) {
                return res.status(400).json({
                    success: false,
                    message: 'Tipo de alerta requerido'
                });
            }

            const tiposValidos = [
                'limite_sucursales', 'limite_usuarios', 'limite_productos', 
                'limite_transacciones', 'limite_almacenamiento', 'limite_funcionalidad'
            ];
            if (!tiposValidos.includes(tipoAlerta)) {
                return res.status(400).json({
                    success: false,
                    message: 'Tipo de alerta inválido',
                    tipos_validos: tiposValidos
                });
            }

            const alertas = await this.alertaLimiteModel.getAlertsByType(tipoAlerta);

            res.status(200).json({
                success: true,
                message: `Alertas de tipo '${tipoAlerta}' obtenidas exitosamente`,
                data: alertas,
                count: alertas.length
            });
        } catch (error) {
            console.error('Error en getAlertsByType:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    // =====================================================
    // MÉTODOS DE GESTIÓN DE ALERTAS
    // =====================================================

    /**
     * Crear una nueva alerta
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    async createAlert(req, res) {
        try {
            const alertaData = req.body;

            // Validar datos requeridos
            const requiredFields = [
                'id_restaurante', 'id_plan', 'tipo_alerta', 'recurso', 
                'valor_actual', 'valor_limite', 'porcentaje_uso', 'mensaje'
            ];
            const missingFields = requiredFields.filter(field => !alertaData[field]);

            if (missingFields.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Campos requeridos faltantes',
                    missing_fields: missingFields
                });
            }

            // Validar tipos de alerta
            const tiposValidos = [
                'limite_sucursales', 'limite_usuarios', 'limite_productos', 
                'limite_transacciones', 'limite_almacenamiento', 'limite_funcionalidad'
            ];
            if (!tiposValidos.includes(alertaData.tipo_alerta)) {
                return res.status(400).json({
                    success: false,
                    message: 'Tipo de alerta inválido',
                    tipos_validos: tiposValidos
                });
            }

            // Validar niveles de urgencia
            const nivelesValidos = ['bajo', 'medio', 'alto', 'critico'];
            if (alertaData.nivel_urgencia && !nivelesValidos.includes(alertaData.nivel_urgencia)) {
                return res.status(400).json({
                    success: false,
                    message: 'Nivel de urgencia inválido',
                    niveles_validos: nivelesValidos
                });
            }

            const alerta = await this.alertaLimiteModel.createAlert(alertaData);

            res.status(201).json({
                success: true,
                message: 'Alerta creada exitosamente',
                data: alerta
            });
        } catch (error) {
            console.error('Error en createAlert:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    /**
     * Actualizar una alerta
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    async updateAlert(req, res) {
        try {
            const { id } = req.params;
            const idAlerta = parseInt(id);
            const alertaData = req.body;

            if (isNaN(idAlerta)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de alerta inválido'
                });
            }

            const alerta = await this.alertaLimiteModel.updateAlert(idAlerta, alertaData);

            res.status(200).json({
                success: true,
                message: 'Alerta actualizada exitosamente',
                data: alerta
            });
        } catch (error) {
            console.error('Error en updateAlert:', error);
            if (error.message === 'Alerta no encontrada') {
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
     * Marcar alerta como enviada
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    async markAlertAsSent(req, res) {
        try {
            const { id } = req.params;
            const idAlerta = parseInt(id);

            if (isNaN(idAlerta)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de alerta inválido'
                });
            }

            const alerta = await this.alertaLimiteModel.markAlertAsSent(idAlerta);

            res.status(200).json({
                success: true,
                message: 'Alerta marcada como enviada exitosamente',
                data: alerta
            });
        } catch (error) {
            console.error('Error en markAlertAsSent:', error);
            if (error.message === 'Alerta no encontrada') {
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
     * Resolver una alerta
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    async resolveAlert(req, res) {
        try {
            const { id } = req.params;
            const idAlerta = parseInt(id);
            const { mensajeResolucion } = req.body;

            if (isNaN(idAlerta)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de alerta inválido'
                });
            }

            if (!mensajeResolucion) {
                return res.status(400).json({
                    success: false,
                    message: 'Mensaje de resolución requerido'
                });
            }

            const alerta = await this.alertaLimiteModel.resolveAlert(idAlerta, mensajeResolucion);

            res.status(200).json({
                success: true,
                message: 'Alerta resuelta exitosamente',
                data: alerta
            });
        } catch (error) {
            console.error('Error en resolveAlert:', error);
            if (error.message === 'Alerta no encontrada') {
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
     * Ignorar una alerta
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    async ignoreAlert(req, res) {
        try {
            const { id } = req.params;
            const idAlerta = parseInt(id);
            const { motivo } = req.body;

            if (isNaN(idAlerta)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de alerta inválido'
                });
            }

            if (!motivo) {
                return res.status(400).json({
                    success: false,
                    message: 'Motivo para ignorar requerido'
                });
            }

            const alerta = await this.alertaLimiteModel.ignoreAlert(idAlerta, motivo);

            res.status(200).json({
                success: true,
                message: 'Alerta ignorada exitosamente',
                data: alerta
            });
        } catch (error) {
            console.error('Error en ignoreAlert:', error);
            if (error.message === 'Alerta no encontrada') {
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
     * Eliminar alertas antiguas
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    async deleteOldAlerts(req, res) {
        try {
            const { dias } = req.query;
            const diasAntiguedad = dias ? parseInt(dias) : 90;

            if (isNaN(diasAntiguedad) || diasAntiguedad < 1) {
                return res.status(400).json({
                    success: false,
                    message: 'Número de días inválido'
                });
            }

            const eliminadas = await this.alertaLimiteModel.deleteOldAlerts(diasAntiguedad);

            res.status(200).json({
                success: true,
                message: `Alertas antiguas eliminadas exitosamente (${diasAntiguedad} días)`,
                data: {
                    alertas_eliminadas: eliminadas
                }
            });
        } catch (error) {
            console.error('Error en deleteOldAlerts:', error);
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
     * Verificar si existe una alerta activa para un recurso
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    async hasActiveAlert(req, res) {
        try {
            const { idRestaurante, tipoAlerta, recurso } = req.params;
            const id = parseInt(idRestaurante);

            if (isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de restaurante inválido'
                });
            }

            if (!tipoAlerta || !recurso) {
                return res.status(400).json({
                    success: false,
                    message: 'Tipo de alerta y recurso requeridos'
                });
            }

            const hasActive = await this.alertaLimiteModel.hasActiveAlert(id, tipoAlerta, recurso);

            res.status(200).json({
                success: true,
                message: 'Verificación de alerta activa completada',
                data: {
                    id_restaurante: id,
                    tipo_alerta: tipoAlerta,
                    recurso: recurso,
                    tiene_alerta_activa: hasActive
                }
            });
        } catch (error) {
            console.error('Error en hasActiveAlert:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    /**
     * Verificar si se debe crear una nueva alerta
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    async shouldCreateAlert(req, res) {
        try {
            const { idRestaurante, tipoAlerta } = req.params;
            const { porcentajeUso } = req.query;
            const id = parseInt(idRestaurante);
            const porcentaje = parseFloat(porcentajeUso);

            if (isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de restaurante inválido'
                });
            }

            if (!tipoAlerta) {
                return res.status(400).json({
                    success: false,
                    message: 'Tipo de alerta requerido'
                });
            }

            if (isNaN(porcentaje) || porcentaje < 0 || porcentaje > 100) {
                return res.status(400).json({
                    success: false,
                    message: 'Porcentaje de uso inválido (0-100)'
                });
            }

            const shouldCreate = await this.alertaLimiteModel.shouldCreateAlert(id, tipoAlerta, porcentaje);

            res.status(200).json({
                success: true,
                message: 'Verificación de creación de alerta completada',
                data: {
                    id_restaurante: id,
                    tipo_alerta: tipoAlerta,
                    porcentaje_uso: porcentaje,
                    debe_crear_alerta: shouldCreate
                }
            });
        } catch (error) {
            console.error('Error en shouldCreateAlert:', error);
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
     * Obtener estadísticas de alertas
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    async getAlertStats(req, res) {
        try {
            const stats = await this.alertaLimiteModel.getAlertStats();
            
            res.status(200).json({
                success: true,
                message: 'Estadísticas de alertas obtenidas exitosamente',
                data: stats
            });
        } catch (error) {
            console.error('Error en getAlertStats:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    /**
     * Obtener estadísticas de alertas por tipo
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    async getAlertStatsByType(req, res) {
        try {
            const stats = await this.alertaLimiteModel.getAlertStatsByType();
            
            res.status(200).json({
                success: true,
                message: 'Estadísticas de alertas por tipo obtenidas exitosamente',
                data: stats
            });
        } catch (error) {
            console.error('Error en getAlertStatsByType:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    /**
     * Obtener estadísticas de alertas por restaurante
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    async getAlertStatsByRestaurant(req, res) {
        try {
            const stats = await this.alertaLimiteModel.getAlertStatsByRestaurant();
            
            res.status(200).json({
                success: true,
                message: 'Estadísticas de alertas por restaurante obtenidas exitosamente',
                data: stats
            });
        } catch (error) {
            console.error('Error en getAlertStatsByRestaurant:', error);
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
        await this.alertaLimiteModel.close();
        await this.suscripcionModel.close();
        await this.contadorUsoModel.close();
    }
}

module.exports = AlertaLimiteController;

