const SuscripcionModel = require('../models/SuscripcionModel');
const ContadorUsoModel = require('../models/ContadorUsoModel');
const AlertaLimiteModel = require('../models/AlertaLimiteModel');

class PlanLimitsMiddleware {
    constructor() {
        this.suscripcionModel = new SuscripcionModel();
        this.contadorUsoModel = new ContadorUsoModel();
        this.alertaLimiteModel = new AlertaLimiteModel();
    }

    // =====================================================
    // MIDDLEWARE DE VALIDACIÓN DE LÍMITES
    // =====================================================

    /**
     * Middleware para validar límites de sucursales
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @param {Function} next - Next function
     */
    async validateSucursalesLimit(req, res, next) {
        try {
            const idRestaurante = req.body.id_restaurante || req.params.idRestaurante;
            
            if (!idRestaurante) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de restaurante requerido'
                });
            }

            const puedeAgregar = await this.contadorUsoModel.canAddResource(
                parseInt(idRestaurante), 
                'sucursales', 
                1
            );

            if (!puedeAgregar) {
                // Obtener información del límite para el mensaje de error
                const uso = await this.contadorUsoModel.getCurrentUsage(parseInt(idRestaurante));
                const suscripcion = await this.suscripcionModel.getActiveSubscription(parseInt(idRestaurante));
                
                return res.status(403).json({
                    success: false,
                    message: 'Límite de sucursales excedido',
                    error: 'LIMIT_EXCEEDED',
                    data: {
                        tipo_recurso: 'sucursales',
                        limite_actual: suscripcion?.max_sucursales || 0,
                        uso_actual: uso?.sucursales_actuales || 0,
                        plan_actual: suscripcion?.nombre_plan || 'N/A'
                    }
                });
            }

            next();
        } catch (error) {
            console.error('Error en validateSucursalesLimit:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    /**
     * Middleware para validar límites de usuarios
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @param {Function} next - Next function
     */
    async validateUsuariosLimit(req, res, next) {
        try {
            const idRestaurante = req.body.id_restaurante || req.params.idRestaurante;
            
            if (!idRestaurante) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de restaurante requerido'
                });
            }

            const puedeAgregar = await this.contadorUsoModel.canAddResource(
                parseInt(idRestaurante), 
                'usuarios', 
                1
            );

            if (!puedeAgregar) {
                // Obtener información del límite para el mensaje de error
                const uso = await this.contadorUsoModel.getCurrentUsage(parseInt(idRestaurante));
                const suscripcion = await this.suscripcionModel.getActiveSubscription(parseInt(idRestaurante));
                
                return res.status(403).json({
                    success: false,
                    message: 'Límite de usuarios excedido',
                    error: 'LIMIT_EXCEEDED',
                    data: {
                        tipo_recurso: 'usuarios',
                        limite_actual: suscripcion?.max_usuarios || 0,
                        uso_actual: uso?.usuarios_actuales || 0,
                        plan_actual: suscripcion?.nombre_plan || 'N/A'
                    }
                });
            }

            next();
        } catch (error) {
            console.error('Error en validateUsuariosLimit:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    /**
     * Middleware para validar límites de productos
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @param {Function} next - Next function
     */
    async validateProductosLimit(req, res, next) {
        try {
            const idRestaurante = req.body.id_restaurante || req.params.idRestaurante;
            
            if (!idRestaurante) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de restaurante requerido'
                });
            }

            const puedeAgregar = await this.contadorUsoModel.canAddResource(
                parseInt(idRestaurante), 
                'productos', 
                1
            );

            if (!puedeAgregar) {
                // Obtener información del límite para el mensaje de error
                const uso = await this.contadorUsoModel.getCurrentUsage(parseInt(idRestaurante));
                const suscripcion = await this.suscripcionModel.getActiveSubscription(parseInt(idRestaurante));
                
                return res.status(403).json({
                    success: false,
                    message: 'Límite de productos excedido',
                    error: 'LIMIT_EXCEEDED',
                    data: {
                        tipo_recurso: 'productos',
                        limite_actual: suscripcion?.max_productos || 0,
                        uso_actual: uso?.productos_actuales || 0,
                        plan_actual: suscripcion?.nombre_plan || 'N/A'
                    }
                });
            }

            next();
        } catch (error) {
            console.error('Error en validateProductosLimit:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    /**
     * Middleware para validar límites de transacciones
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @param {Function} next - Next function
     */
    async validateTransaccionesLimit(req, res, next) {
        try {
            const idRestaurante = req.body.id_restaurante || req.params.idRestaurante;
            
            if (!idRestaurante) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de restaurante requerido'
                });
            }

            const puedeAgregar = await this.contadorUsoModel.canAddResource(
                parseInt(idRestaurante), 
                'transacciones', 
                1
            );

            if (!puedeAgregar) {
                // Obtener información del límite para el mensaje de error
                const uso = await this.contadorUsoModel.getCurrentUsage(parseInt(idRestaurante));
                const suscripcion = await this.suscripcionModel.getActiveSubscription(parseInt(idRestaurante));
                
                return res.status(403).json({
                    success: false,
                    message: 'Límite de transacciones mensuales excedido',
                    error: 'LIMIT_EXCEEDED',
                    data: {
                        tipo_recurso: 'transacciones',
                        limite_actual: suscripcion?.max_transacciones_mes || 0,
                        uso_actual: uso?.transacciones_mes_actual || 0,
                        plan_actual: suscripcion?.nombre_plan || 'N/A'
                    }
                });
            }

            next();
        } catch (error) {
            console.error('Error en validateTransaccionesLimit:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    /**
     * Middleware para validar límites de almacenamiento
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @param {Function} next - Next function
     */
    async validateAlmacenamientoLimit(req, res, next) {
        try {
            const idRestaurante = req.body.id_restaurante || req.params.idRestaurante;
            const tamañoArchivo = req.body.tamaño_archivo || req.body.file_size || 0;
            
            if (!idRestaurante) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de restaurante requerido'
                });
            }

            const puedeAgregar = await this.contadorUsoModel.canAddResource(
                parseInt(idRestaurante), 
                'almacenamiento', 
                parseInt(tamañoArchivo)
            );

            if (!puedeAgregar) {
                // Obtener información del límite para el mensaje de error
                const uso = await this.contadorUsoModel.getCurrentUsage(parseInt(idRestaurante));
                const suscripcion = await this.suscripcionModel.getActiveSubscription(parseInt(idRestaurante));
                
                return res.status(403).json({
                    success: false,
                    message: 'Límite de almacenamiento excedido',
                    error: 'LIMIT_EXCEEDED',
                    data: {
                        tipo_recurso: 'almacenamiento',
                        limite_actual: suscripcion?.almacenamiento_gb || 0,
                        uso_actual: uso?.almacenamiento_usado_mb || 0,
                        tamaño_solicitado: parseInt(tamañoArchivo),
                        plan_actual: suscripcion?.nombre_plan || 'N/A'
                    }
                });
            }

            next();
        } catch (error) {
            console.error('Error en validateAlmacenamientoLimit:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    // =====================================================
    // MIDDLEWARE DE VALIDACIÓN DE FUNCIONALIDADES
    // =====================================================

    /**
     * Middleware para validar funcionalidad de inventario avanzado
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @param {Function} next - Next function
     */
    async validateInventarioAvanzado(req, res, next) {
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
                return res.status(404).json({
                    success: false,
                    message: 'No se encontró suscripción activa'
                });
            }

            if (!suscripcion.incluye_inventario_avanzado) {
                return res.status(403).json({
                    success: false,
                    message: 'Funcionalidad de inventario avanzado no disponible en su plan actual',
                    error: 'FEATURE_NOT_AVAILABLE',
                    data: {
                        funcionalidad: 'inventario_avanzado',
                        plan_actual: suscripcion.nombre_plan,
                        planes_disponibles: ['Profesional', 'Avanzado', 'Enterprise']
                    }
                });
            }

            next();
        } catch (error) {
            console.error('Error en validateInventarioAvanzado:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    /**
     * Middleware para validar funcionalidad de promociones
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @param {Function} next - Next function
     */
    async validatePromociones(req, res, next) {
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
                return res.status(404).json({
                    success: false,
                    message: 'No se encontró suscripción activa'
                });
            }

            if (!suscripcion.incluye_promociones) {
                return res.status(403).json({
                    success: false,
                    message: 'Funcionalidad de promociones no disponible en su plan actual',
                    error: 'FEATURE_NOT_AVAILABLE',
                    data: {
                        funcionalidad: 'promociones',
                        plan_actual: suscripcion.nombre_plan,
                        planes_disponibles: ['Avanzado', 'Enterprise']
                    }
                });
            }

            next();
        } catch (error) {
            console.error('Error en validatePromociones:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    /**
     * Middleware para validar funcionalidad de reservas
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @param {Function} next - Next function
     */
    async validateReservas(req, res, next) {
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
                return res.status(404).json({
                    success: false,
                    message: 'No se encontró suscripción activa'
                });
            }

            if (!suscripcion.incluye_reservas) {
                return res.status(403).json({
                    success: false,
                    message: 'Funcionalidad de reservas no disponible en su plan actual',
                    error: 'FEATURE_NOT_AVAILABLE',
                    data: {
                        funcionalidad: 'reservas',
                        plan_actual: suscripcion.nombre_plan,
                        planes_disponibles: ['Profesional', 'Avanzado', 'Enterprise']
                    }
                });
            }

            next();
        } catch (error) {
            console.error('Error en validateReservas:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    /**
     * Middleware para validar funcionalidad de arqueo de caja
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @param {Function} next - Next function
     */
    async validateArqueoCaja(req, res, next) {
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
                return res.status(404).json({
                    success: false,
                    message: 'No se encontró suscripción activa'
                });
            }

            if (!suscripcion.incluye_arqueo_caja) {
                return res.status(403).json({
                    success: false,
                    message: 'Funcionalidad de arqueo de caja no disponible en su plan actual',
                    error: 'FEATURE_NOT_AVAILABLE',
                    data: {
                        funcionalidad: 'arqueo_caja',
                        plan_actual: suscripcion.nombre_plan,
                        planes_disponibles: ['Profesional', 'Avanzado', 'Enterprise']
                    }
                });
            }

            next();
        } catch (error) {
            console.error('Error en validateArqueoCaja:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    /**
     * Middleware para validar funcionalidad de egresos
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @param {Function} next - Next function
     */
    async validateEgresos(req, res, next) {
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
                return res.status(404).json({
                    success: false,
                    message: 'No se encontró suscripción activa'
                });
            }

            if (!suscripcion.incluye_egresos) {
                return res.status(403).json({
                    success: false,
                    message: 'Funcionalidad de egresos no disponible en su plan actual',
                    error: 'FEATURE_NOT_AVAILABLE',
                    data: {
                        funcionalidad: 'egresos',
                        plan_actual: suscripcion.nombre_plan,
                        planes_disponibles: ['Profesional', 'Avanzado', 'Enterprise']
                    }
                });
            }

            next();
        } catch (error) {
            console.error('Error en validateEgresos:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    /**
     * Middleware para validar funcionalidad de egresos avanzados
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @param {Function} next - Next function
     */
    async validateEgresosAvanzados(req, res, next) {
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
                return res.status(404).json({
                    success: false,
                    message: 'No se encontró suscripción activa'
                });
            }

            if (!suscripcion.incluye_egresos_avanzados) {
                return res.status(403).json({
                    success: false,
                    message: 'Funcionalidad de egresos avanzados no disponible en su plan actual',
                    error: 'FEATURE_NOT_AVAILABLE',
                    data: {
                        funcionalidad: 'egresos_avanzados',
                        plan_actual: suscripcion.nombre_plan,
                        planes_disponibles: ['Avanzado', 'Enterprise']
                    }
                });
            }

            next();
        } catch (error) {
            console.error('Error en validateEgresosAvanzados:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    /**
     * Middleware para validar funcionalidad de reportes avanzados
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @param {Function} next - Next function
     */
    async validateReportesAvanzados(req, res, next) {
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
                return res.status(404).json({
                    success: false,
                    message: 'No se encontró suscripción activa'
                });
            }

            if (!suscripcion.incluye_reportes_avanzados) {
                return res.status(403).json({
                    success: false,
                    message: 'Funcionalidad de reportes avanzados no disponible en su plan actual',
                    error: 'FEATURE_NOT_AVAILABLE',
                    data: {
                        funcionalidad: 'reportes_avanzados',
                        plan_actual: suscripcion.nombre_plan,
                        planes_disponibles: ['Avanzado', 'Enterprise']
                    }
                });
            }

            next();
        } catch (error) {
            console.error('Error en validateReportesAvanzados:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    /**
     * Middleware para validar funcionalidad de analytics
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @param {Function} next - Next function
     */
    async validateAnalytics(req, res, next) {
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
                return res.status(404).json({
                    success: false,
                    message: 'No se encontró suscripción activa'
                });
            }

            if (!suscripcion.incluye_analytics) {
                return res.status(403).json({
                    success: false,
                    message: 'Funcionalidad de analytics no disponible en su plan actual',
                    error: 'FEATURE_NOT_AVAILABLE',
                    data: {
                        funcionalidad: 'analytics',
                        plan_actual: suscripcion.nombre_plan,
                        planes_disponibles: ['Avanzado', 'Enterprise']
                    }
                });
            }

            next();
        } catch (error) {
            console.error('Error en validateAnalytics:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    /**
     * Middleware para validar funcionalidad de delivery
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @param {Function} next - Next function
     */
    async validateDelivery(req, res, next) {
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
                return res.status(404).json({
                    success: false,
                    message: 'No se encontró suscripción activa'
                });
            }

            if (!suscripcion.incluye_delivery) {
                return res.status(403).json({
                    success: false,
                    message: 'Funcionalidad de delivery no disponible en su plan actual',
                    error: 'FEATURE_NOT_AVAILABLE',
                    data: {
                        funcionalidad: 'delivery',
                        plan_actual: suscripcion.nombre_plan,
                        planes_disponibles: ['Enterprise']
                    }
                });
            }

            next();
        } catch (error) {
            console.error('Error en validateDelivery:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    /**
     * Middleware para validar funcionalidad de soporte 24h
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @param {Function} next - Next function
     */
    async validateSoporte24h(req, res, next) {
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
                return res.status(404).json({
                    success: false,
                    message: 'No se encontró suscripción activa'
                });
            }

            if (!suscripcion.incluye_soporte_24h) {
                return res.status(403).json({
                    success: false,
                    message: 'Funcionalidad de soporte 24h no disponible en su plan actual',
                    error: 'FEATURE_NOT_AVAILABLE',
                    data: {
                        funcionalidad: 'soporte_24h',
                        plan_actual: suscripcion.nombre_plan,
                        planes_disponibles: ['Enterprise']
                    }
                });
            }

            next();
        } catch (error) {
            console.error('Error en validateSoporte24h:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    /**
     * Middleware para validar funcionalidad de API
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @param {Function} next - Next function
     */
    async validateAPI(req, res, next) {
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
                return res.status(404).json({
                    success: false,
                    message: 'No se encontró suscripción activa'
                });
            }

            if (!suscripcion.incluye_api) {
                return res.status(403).json({
                    success: false,
                    message: 'Funcionalidad de API no disponible en su plan actual',
                    error: 'FEATURE_NOT_AVAILABLE',
                    data: {
                        funcionalidad: 'api',
                        plan_actual: suscripcion.nombre_plan,
                        planes_disponibles: ['Enterprise']
                    }
                });
            }

            next();
        } catch (error) {
            console.error('Error en validateAPI:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    /**
     * Middleware para validar funcionalidad de white label
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @param {Function} next - Next function
     */
    async validateWhiteLabel(req, res, next) {
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
                return res.status(404).json({
                    success: false,
                    message: 'No se encontró suscripción activa'
                });
            }

            if (!suscripcion.incluye_white_label) {
                return res.status(403).json({
                    success: false,
                    message: 'Funcionalidad de white label no disponible en su plan actual',
                    error: 'FEATURE_NOT_AVAILABLE',
                    data: {
                        funcionalidad: 'white_label',
                        plan_actual: suscripcion.nombre_plan,
                        planes_disponibles: ['Enterprise']
                    }
                });
            }

            next();
        } catch (error) {
            console.error('Error en validateWhiteLabel:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    // =====================================================
    // MIDDLEWARE DE VALIDACIÓN GENERAL
    // =====================================================

    /**
     * Middleware para validar suscripción activa
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
                return res.status(404).json({
                    success: false,
                    message: 'No se encontró suscripción activa para este restaurante',
                    error: 'NO_ACTIVE_SUBSCRIPTION'
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
     * Middleware para validar funcionalidad específica
     * @param {string} funcionalidad - Nombre de la funcionalidad
     * @returns {Function} Middleware function
     */
    validateFeature(funcionalidad) {
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
                    return res.status(404).json({
                        success: false,
                        message: 'No se encontró suscripción activa'
                    });
                }

                if (!suscripcion[`incluye_${funcionalidad}`]) {
                    return res.status(403).json({
                        success: false,
                        message: `Funcionalidad de ${funcionalidad} no disponible en su plan actual`,
                        error: 'FEATURE_NOT_AVAILABLE',
                        data: {
                            funcionalidad: funcionalidad,
                            plan_actual: suscripcion.nombre_plan
                        }
                    });
                }

                next();
            } catch (error) {
                console.error(`Error en validateFeature(${funcionalidad}):`, error);
                res.status(500).json({
                    success: false,
                    message: 'Error interno del servidor',
                    error: error.message
                });
            }
        };
    }

    // =====================================================
    // MÉTODOS DE UTILIDAD
    // =====================================================

    /**
     * Cerrar conexiones a la base de datos
     */
    async close() {
        await this.suscripcionModel.close();
        await this.contadorUsoModel.close();
        await this.alertaLimiteModel.close();
    }
}

module.exports = PlanLimitsMiddleware;
