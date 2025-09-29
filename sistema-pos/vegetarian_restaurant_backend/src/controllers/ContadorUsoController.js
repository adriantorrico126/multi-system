const ContadorUsoModel = require('../models/ContadorUsoModel');
const SuscripcionModel = require('../models/SuscripcionModel');
const AlertaLimiteModel = require('../models/AlertaLimiteModel');

class ContadorUsoController {
    constructor() {
        this.contadorUsoModel = new ContadorUsoModel();
        this.suscripcionModel = new SuscripcionModel();
        this.alertaLimiteModel = new AlertaLimiteModel();
    }

    // =====================================================
    // MÉTODOS DE CONSULTA DE CONTADORES
    // =====================================================

    /**
     * Obtener contador actual de un restaurante
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    async getCurrentUsage(req, res) {
        try {
            const { idRestaurante } = req.params;
            const id = parseInt(idRestaurante);

            console.log('🔍 [ContadorUsoController] getCurrentUsage llamado para restaurante:', id);

            if (isNaN(id)) {
                console.log('❌ [ContadorUsoController] ID de restaurante inválido:', idRestaurante);
                return res.status(400).json({
                    success: false,
                    message: 'ID de restaurante inválido'
                });
            }

            console.log('🔄 [ContadorUsoController] Consultando modelo...');
            const uso = await this.contadorUsoModel.getCurrentUsage(id);
            console.log('📊 [ContadorUsoController] Resultado del modelo:', uso ? 'Datos encontrados' : 'null');

            if (!uso) {
                console.log('❌ [ContadorUsoController] No se encontró información de uso');
                return res.status(404).json({
                    success: false,
                    message: 'No se encontró información de uso para este restaurante'
                });
            }

            console.log('✅ [ContadorUsoController] Enviando respuesta exitosa');
            res.status(200).json({
                success: true,
                message: 'Uso actual obtenido exitosamente',
                data: uso
            });
        } catch (error) {
            console.error('❌ [ContadorUsoController] Error en getCurrentUsage:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    /**
     * Obtener historial de uso de un restaurante
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    async getUsageHistory(req, res) {
        try {
            const { idRestaurante } = req.params;
            const { meses } = req.query;
            const id = parseInt(idRestaurante);
            const mesesHistorial = meses ? parseInt(meses) : 12;

            if (isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de restaurante inválido'
                });
            }

            if (isNaN(mesesHistorial) || mesesHistorial < 1 || mesesHistorial > 24) {
                return res.status(400).json({
                    success: false,
                    message: 'Número de meses inválido (1-24)'
                });
            }

            const historial = await this.contadorUsoModel.getUsageHistory(id, mesesHistorial);

            res.status(200).json({
                success: true,
                message: 'Historial de uso obtenido exitosamente',
                data: historial,
                count: historial.length
            });
        } catch (error) {
            console.error('Error en getUsageHistory:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    /**
     * Obtener contadores por plan
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    async getCountersByPlan(req, res) {
        try {
            const { idPlan } = req.params;
            const id = parseInt(idPlan);

            if (isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de plan inválido'
                });
            }

            const contadores = await this.contadorUsoModel.getCountersByPlan(id);

            res.status(200).json({
                success: true,
                message: 'Contadores por plan obtenidos exitosamente',
                data: contadores,
                count: contadores.length
            });
        } catch (error) {
            console.error('Error en getCountersByPlan:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    /**
     * Obtener contadores con alertas
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    async getCountersWithAlerts(req, res) {
        try {
            const contadores = await this.contadorUsoModel.getCountersWithAlerts();

            res.status(200).json({
                success: true,
                message: 'Contadores con alertas obtenidos exitosamente',
                data: contadores,
                count: contadores.length
            });
        } catch (error) {
            console.error('Error en getCountersWithAlerts:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    // =====================================================
    // MÉTODOS DE ACTUALIZACIÓN DE CONTADORES
    // =====================================================

    /**
     * Actualizar contador de sucursales
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    async updateSucursalesCount(req, res) {
        try {
            const { idRestaurante } = req.params;
            const { cantidad } = req.body;
            const id = parseInt(idRestaurante);

            if (isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de restaurante inválido'
                });
            }

            if (cantidad === undefined || cantidad === null || isNaN(parseInt(cantidad))) {
                return res.status(400).json({
                    success: false,
                    message: 'Cantidad inválida'
                });
            }

            const contador = await this.contadorUsoModel.updateSucursalesCount(id, parseInt(cantidad));

            res.status(200).json({
                success: true,
                message: 'Contador de sucursales actualizado exitosamente',
                data: contador
            });
        } catch (error) {
            console.error('Error en updateSucursalesCount:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    /**
     * Actualizar contador de usuarios
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    async updateUsuariosCount(req, res) {
        try {
            const { idRestaurante } = req.params;
            const { cantidad } = req.body;
            const id = parseInt(idRestaurante);

            if (isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de restaurante inválido'
                });
            }

            if (cantidad === undefined || cantidad === null || isNaN(parseInt(cantidad))) {
                return res.status(400).json({
                    success: false,
                    message: 'Cantidad inválida'
                });
            }

            const contador = await this.contadorUsoModel.updateUsuariosCount(id, parseInt(cantidad));

            res.status(200).json({
                success: true,
                message: 'Contador de usuarios actualizado exitosamente',
                data: contador
            });
        } catch (error) {
            console.error('Error en updateUsuariosCount:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    /**
     * Actualizar contador de productos
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    async updateProductosCount(req, res) {
        try {
            const { idRestaurante } = req.params;
            const { cantidad } = req.body;
            const id = parseInt(idRestaurante);

            if (isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de restaurante inválido'
                });
            }

            if (cantidad === undefined || cantidad === null || isNaN(parseInt(cantidad))) {
                return res.status(400).json({
                    success: false,
                    message: 'Cantidad inválida'
                });
            }

            const contador = await this.contadorUsoModel.updateProductosCount(id, parseInt(cantidad));

            res.status(200).json({
                success: true,
                message: 'Contador de productos actualizado exitosamente',
                data: contador
            });
        } catch (error) {
            console.error('Error en updateProductosCount:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    /**
     * Actualizar contador de transacciones
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    async updateTransaccionesCount(req, res) {
        try {
            const { idRestaurante } = req.params;
            const { cantidad } = req.body;
            const id = parseInt(idRestaurante);

            if (isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de restaurante inválido'
                });
            }

            if (cantidad === undefined || cantidad === null || isNaN(parseInt(cantidad))) {
                return res.status(400).json({
                    success: false,
                    message: 'Cantidad inválida'
                });
            }

            const contador = await this.contadorUsoModel.updateTransaccionesCount(id, parseInt(cantidad));

            res.status(200).json({
                success: true,
                message: 'Contador de transacciones actualizado exitosamente',
                data: contador
            });
        } catch (error) {
            console.error('Error en updateTransaccionesCount:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    /**
     * Actualizar contador de almacenamiento
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    async updateAlmacenamientoCount(req, res) {
        try {
            const { idRestaurante } = req.params;
            const { cantidad } = req.body;
            const id = parseInt(idRestaurante);

            if (isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de restaurante inválido'
                });
            }

            if (cantidad === undefined || cantidad === null || isNaN(parseInt(cantidad))) {
                return res.status(400).json({
                    success: false,
                    message: 'Cantidad inválida'
                });
            }

            const contador = await this.contadorUsoModel.updateAlmacenamientoCount(id, parseInt(cantidad));

            res.status(200).json({
                success: true,
                message: 'Contador de almacenamiento actualizado exitosamente',
                data: contador
            });
        } catch (error) {
            console.error('Error en updateAlmacenamientoCount:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    /**
     * Actualizar todos los contadores de un restaurante
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    async updateAllCounters(req, res) {
        try {
            const { idRestaurante } = req.params;
            const id = parseInt(idRestaurante);

            if (isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de restaurante inválido'
                });
            }

            const contador = await this.contadorUsoModel.updateAllCounters(id);

            res.status(200).json({
                success: true,
                message: 'Todos los contadores actualizados exitosamente',
                data: contador
            });
        } catch (error) {
            console.error('Error en updateAllCounters:', error);
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
     * Verificar si un restaurante excede los límites
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    async checkLimits(req, res) {
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
                message: 'Límites verificados exitosamente',
                data: limites
            });
        } catch (error) {
            console.error('Error en checkLimits:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    /**
     * Verificar si se puede agregar un recurso
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    async canAddResource(req, res) {
        try {
            const { idRestaurante, tipoRecurso } = req.params;
            const { cantidad } = req.query;
            const id = parseInt(idRestaurante);
            const cantidadRecurso = cantidad ? parseInt(cantidad) : 1;

            if (isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de restaurante inválido'
                });
            }

            if (!tipoRecurso) {
                return res.status(400).json({
                    success: false,
                    message: 'Tipo de recurso requerido'
                });
            }

            const tiposValidos = ['sucursales', 'usuarios', 'productos', 'transacciones', 'almacenamiento'];
            if (!tiposValidos.includes(tipoRecurso)) {
                return res.status(400).json({
                    success: false,
                    message: 'Tipo de recurso inválido',
                    tipos_validos: tiposValidos
                });
            }

            const puedeAgregar = await this.contadorUsoModel.canAddResource(id, tipoRecurso, cantidadRecurso);

            res.status(200).json({
                success: true,
                message: 'Verificación de recurso completada',
                data: {
                    id_restaurante: id,
                    tipo_recurso: tipoRecurso,
                    cantidad: cantidadRecurso,
                    puede_agregar: puedeAgregar
                }
            });
        } catch (error) {
            console.error('Error en canAddResource:', error);
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
     * Obtener estadísticas de uso global
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    async getGlobalUsageStats(req, res) {
        try {
            const stats = await this.contadorUsoModel.getGlobalUsageStats();
            
            res.status(200).json({
                success: true,
                message: 'Estadísticas globales de uso obtenidas exitosamente',
                data: stats
            });
        } catch (error) {
            console.error('Error en getGlobalUsageStats:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    /**
     * Obtener estadísticas de uso por plan
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    async getUsageStatsByPlan(req, res) {
        try {
            const stats = await this.contadorUsoModel.getUsageStatsByPlan();
            
            res.status(200).json({
                success: true,
                message: 'Estadísticas de uso por plan obtenidas exitosamente',
                data: stats
            });
        } catch (error) {
            console.error('Error en getUsageStatsByPlan:', error);
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
        await this.contadorUsoModel.close();
        await this.suscripcionModel.close();
        await this.alertaLimiteModel.close();
    }
}

module.exports = ContadorUsoController;
