const ContadorUsoModel = require('../models/ContadorUsoModel');
const AlertaLimiteModel = require('../models/AlertaLimiteModel');

class UsageTrackingMiddleware {
    constructor() {
        this.contadorUsoModel = new ContadorUsoModel();
        this.alertaLimiteModel = new AlertaLimiteModel();
    }

    // =====================================================
    // MIDDLEWARE DE SEGUIMIENTO DE USO
    // =====================================================

    /**
     * Middleware para rastrear creación de sucursales
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @param {Function} next - Next function
     */
    async trackSucursalCreation(req, res, next) {
        try {
            const idRestaurante = req.body.id_restaurante || req.params.idRestaurante;
            
            if (!idRestaurante) {
                return next();
            }

            // Ejecutar la operación original
            const originalSend = res.send;
            res.send = function(data) {
                // Si la operación fue exitosa, actualizar contador
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    UsageTrackingMiddleware.prototype.updateSucursalesCount(parseInt(idRestaurante));
                }
                originalSend.call(this, data);
            };

            next();
        } catch (error) {
            console.error('Error en trackSucursalCreation:', error);
            next();
        }
    }

    /**
     * Middleware para rastrear creación de usuarios
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @param {Function} next - Next function
     */
    async trackUsuarioCreation(req, res, next) {
        try {
            const idRestaurante = req.body.id_restaurante || req.params.idRestaurante;
            
            if (!idRestaurante) {
                return next();
            }

            // Ejecutar la operación original
            const originalSend = res.send;
            res.send = function(data) {
                // Si la operación fue exitosa, actualizar contador
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    UsageTrackingMiddleware.prototype.updateUsuariosCount(parseInt(idRestaurante));
                }
                originalSend.call(this, data);
            };

            next();
        } catch (error) {
            console.error('Error en trackUsuarioCreation:', error);
            next();
        }
    }

    /**
     * Middleware para rastrear creación de productos
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @param {Function} next - Next function
     */
    async trackProductoCreation(req, res, next) {
        try {
            const idRestaurante = req.body.id_restaurante || req.params.idRestaurante;
            
            if (!idRestaurante) {
                return next();
            }

            // Ejecutar la operación original
            const originalSend = res.send;
            res.send = function(data) {
                // Si la operación fue exitosa, actualizar contador
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    UsageTrackingMiddleware.prototype.updateProductosCount(parseInt(idRestaurante));
                }
                originalSend.call(this, data);
            };

            next();
        } catch (error) {
            console.error('Error en trackProductoCreation:', error);
            next();
        }
    }

    /**
     * Middleware para rastrear transacciones
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @param {Function} next - Next function
     */
    async trackTransaccion(req, res, next) {
        try {
            const idRestaurante = req.body.id_restaurante || req.params.idRestaurante;
            
            if (!idRestaurante) {
                return next();
            }

            // Ejecutar la operación original
            const originalSend = res.send;
            res.send = function(data) {
                // Si la operación fue exitosa, actualizar contador
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    UsageTrackingMiddleware.prototype.updateTransaccionesCount(parseInt(idRestaurante));
                }
                originalSend.call(this, data);
            };

            next();
        } catch (error) {
            console.error('Error en trackTransaccion:', error);
            next();
        }
    }

    /**
     * Middleware para rastrear uso de almacenamiento
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @param {Function} next - Next function
     */
    async trackAlmacenamiento(req, res, next) {
        try {
            const idRestaurante = req.body.id_restaurante || req.params.idRestaurante;
            const tamañoArchivo = req.body.tamaño_archivo || req.body.file_size || 0;
            
            if (!idRestaurante || !tamañoArchivo) {
                return next();
            }

            // Ejecutar la operación original
            const originalSend = res.send;
            res.send = function(data) {
                // Si la operación fue exitosa, actualizar contador
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    UsageTrackingMiddleware.prototype.updateAlmacenamientoCount(parseInt(idRestaurante), parseInt(tamañoArchivo));
                }
                originalSend.call(this, data);
            };

            next();
        } catch (error) {
            console.error('Error en trackAlmacenamiento:', error);
            next();
        }
    }

    // =====================================================
    // MÉTODOS DE ACTUALIZACIÓN DE CONTADORES
    // =====================================================

    /**
     * Actualizar contador de sucursales
     * @param {number} idRestaurante - ID del restaurante
     */
    async updateSucursalesCount(idRestaurante) {
        try {
            const contador = await this.contadorUsoModel.updateAllCounters(idRestaurante);
            
            // Verificar si se exceden límites y generar alertas
            if (contador) {
                await this.checkAndGenerateAlerts(idRestaurante, 'sucursales', contador);
            }
        } catch (error) {
            console.error('Error al actualizar contador de sucursales:', error);
        }
    }

    /**
     * Actualizar contador de usuarios
     * @param {number} idRestaurante - ID del restaurante
     */
    async updateUsuariosCount(idRestaurante) {
        try {
            const contador = await this.contadorUsoModel.updateAllCounters(idRestaurante);
            
            // Verificar si se exceden límites y generar alertas
            if (contador) {
                await this.checkAndGenerateAlerts(idRestaurante, 'usuarios', contador);
            }
        } catch (error) {
            console.error('Error al actualizar contador de usuarios:', error);
        }
    }

    /**
     * Actualizar contador de productos
     * @param {number} idRestaurante - ID del restaurante
     */
    async updateProductosCount(idRestaurante) {
        try {
            const contador = await this.contadorUsoModel.updateAllCounters(idRestaurante);
            
            // Verificar si se exceden límites y generar alertas
            if (contador) {
                await this.checkAndGenerateAlerts(idRestaurante, 'productos', contador);
            }
        } catch (error) {
            console.error('Error al actualizar contador de productos:', error);
        }
    }

    /**
     * Actualizar contador de transacciones
     * @param {number} idRestaurante - ID del restaurante
     */
    async updateTransaccionesCount(idRestaurante) {
        try {
            const contador = await this.contadorUsoModel.updateAllCounters(idRestaurante);
            
            // Verificar si se exceden límites y generar alertas
            if (contador) {
                await this.checkAndGenerateAlerts(idRestaurante, 'transacciones', contador);
            }
        } catch (error) {
            console.error('Error al actualizar contador de transacciones:', error);
        }
    }

    /**
     * Actualizar contador de almacenamiento
     * @param {number} idRestaurante - ID del restaurante
     * @param {number} tamañoArchivo - Tamaño del archivo en MB
     */
    async updateAlmacenamientoCount(idRestaurante, tamañoArchivo) {
        try {
            const contador = await this.contadorUsoModel.updateAllCounters(idRestaurante);
            
            // Verificar si se exceden límites y generar alertas
            if (contador) {
                await this.checkAndGenerateAlerts(idRestaurante, 'almacenamiento', contador);
            }
        } catch (error) {
            console.error('Error al actualizar contador de almacenamiento:', error);
        }
    }

    // =====================================================
    // MÉTODOS DE GENERACIÓN DE ALERTAS
    // =====================================================

    /**
     * Verificar límites y generar alertas
     * @param {number} idRestaurante - ID del restaurante
     * @param {string} tipoRecurso - Tipo de recurso
     * @param {Object} contador - Datos del contador
     */
    async checkAndGenerateAlerts(idRestaurante, tipoRecurso, contador) {
        try {
            const uso = await this.contadorUsoModel.getCurrentUsage(idRestaurante);
            
            if (!uso) {
                return;
            }

            let porcentajeUso = 0;
            let valorActual = 0;
            let valorLimite = 0;
            let tipoAlerta = '';

            // Determinar el tipo de recurso y calcular porcentaje
            switch (tipoRecurso) {
                case 'sucursales':
                    valorActual = uso.sucursales_actuales;
                    valorLimite = uso.max_sucursales;
                    tipoAlerta = 'limite_sucursales';
                    break;
                case 'usuarios':
                    valorActual = uso.usuarios_actuales;
                    valorLimite = uso.max_usuarios;
                    tipoAlerta = 'limite_usuarios';
                    break;
                case 'productos':
                    valorActual = uso.productos_actuales;
                    valorLimite = uso.max_productos;
                    tipoAlerta = 'limite_productos';
                    break;
                case 'transacciones':
                    valorActual = uso.transacciones_mes_actual;
                    valorLimite = uso.max_transacciones_mes;
                    tipoAlerta = 'limite_transacciones';
                    break;
                case 'almacenamiento':
                    valorActual = uso.almacenamiento_usado_mb;
                    valorLimite = uso.almacenamiento_gb * 1024; // Convertir GB a MB
                    tipoAlerta = 'limite_almacenamiento';
                    break;
                default:
                    return;
            }

            if (valorLimite > 0) {
                porcentajeUso = (valorActual / valorLimite) * 100;
            }

            // Verificar si se debe crear una alerta
            const shouldCreate = await this.alertaLimiteModel.shouldCreateAlert(idRestaurante, tipoAlerta, porcentajeUso);
            
            if (shouldCreate) {
                let nivelUrgencia = 'medio';
                let mensaje = '';

                if (porcentajeUso >= 100) {
                    nivelUrgencia = 'critico';
                    mensaje = `Límite de ${tipoRecurso} excedido: ${valorActual}/${valorLimite}`;
                } else if (porcentajeUso >= 90) {
                    nivelUrgencia = 'alto';
                    mensaje = `Límite de ${tipoRecurso} casi excedido: ${valorActual}/${valorLimite}`;
                } else if (porcentajeUso >= 80) {
                    nivelUrgencia = 'medio';
                    mensaje = `Uso alto de ${tipoRecurso}: ${valorActual}/${valorLimite}`;
                }

                // Crear la alerta
                await this.alertaLimiteModel.createAlert({
                    id_restaurante: idRestaurante,
                    id_plan: uso.id_plan,
                    tipo_alerta: tipoAlerta,
                    recurso: tipoRecurso,
                    valor_actual: valorActual,
                    valor_limite: valorLimite,
                    porcentaje_uso: porcentajeUso,
                    nivel_urgencia: nivelUrgencia,
                    mensaje: mensaje
                });
            }
        } catch (error) {
            console.error('Error al verificar límites y generar alertas:', error);
        }
    }

    // =====================================================
    // MIDDLEWARE DE LOGGING DE USO
    // =====================================================

    /**
     * Middleware para logging de uso de funcionalidades
     * @param {string} funcionalidad - Nombre de la funcionalidad
     * @returns {Function} Middleware function
     */
    logFeatureUsage(funcionalidad) {
        return async (req, res, next) => {
            try {
                const idRestaurante = req.body.id_restaurante || req.params.idRestaurante;
                const idUsuario = req.user?.id || req.body.id_usuario;
                
                if (!idRestaurante) {
                    return next();
                }

                // Ejecutar la operación original
                const originalSend = res.send;
                res.send = function(data) {
                    // Si la operación fue exitosa, registrar el uso
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        UsageTrackingMiddleware.prototype.logUsage(parseInt(idRestaurante), funcionalidad, idUsuario);
                    }
                    originalSend.call(this, data);
                };

                next();
            } catch (error) {
                console.error(`Error en logFeatureUsage(${funcionalidad}):`, error);
                next();
            }
        };
    }

    /**
     * Registrar uso de funcionalidad
     * @param {number} idRestaurante - ID del restaurante
     * @param {string} funcionalidad - Nombre de la funcionalidad
     * @param {number} idUsuario - ID del usuario
     */
    async logUsage(idRestaurante, funcionalidad, idUsuario) {
        try {
            // Aquí se podría implementar un sistema de logging más sofisticado
            // Por ahora, solo registramos en consola
            console.log(`Uso de funcionalidad: ${funcionalidad} - Restaurante: ${idRestaurante} - Usuario: ${idUsuario} - Fecha: ${new Date().toISOString()}`);
            
            // En el futuro, se podría guardar en una tabla de logs de uso
            // await this.logModel.createLog({
            //     id_restaurante: idRestaurante,
            //     funcionalidad: funcionalidad,
            //     id_usuario: idUsuario,
            //     fecha_uso: new Date()
            // });
        } catch (error) {
            console.error('Error al registrar uso de funcionalidad:', error);
        }
    }

    // =====================================================
    // MIDDLEWARE DE ACTUALIZACIÓN AUTOMÁTICA
    // =====================================================

    /**
     * Middleware para actualizar todos los contadores
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @param {Function} next - Next function
     */
    async updateAllCounters(req, res, next) {
        try {
            const idRestaurante = req.body.id_restaurante || req.params.idRestaurante;
            
            if (!idRestaurante) {
                return next();
            }

            // Ejecutar la operación original
            const originalSend = res.send;
            res.send = function(data) {
                // Si la operación fue exitosa, actualizar todos los contadores
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    UsageTrackingMiddleware.prototype.updateAllCounters(parseInt(idRestaurante));
                }
                originalSend.call(this, data);
            };

            next();
        } catch (error) {
            console.error('Error en updateAllCounters:', error);
            next();
        }
    }

    /**
     * Actualizar todos los contadores de un restaurante
     * @param {number} idRestaurante - ID del restaurante
     */
    async updateAllCounters(idRestaurante) {
        try {
            const contador = await this.contadorUsoModel.updateAllCounters(idRestaurante);
            
            if (contador) {
                // Verificar límites para todos los recursos
                await this.checkAndGenerateAlerts(idRestaurante, 'sucursales', contador);
                await this.checkAndGenerateAlerts(idRestaurante, 'usuarios', contador);
                await this.checkAndGenerateAlerts(idRestaurante, 'productos', contador);
                await this.checkAndGenerateAlerts(idRestaurante, 'transacciones', contador);
                await this.checkAndGenerateAlerts(idRestaurante, 'almacenamiento', contador);
            }
        } catch (error) {
            console.error('Error al actualizar todos los contadores:', error);
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
        await this.alertaLimiteModel.close();
    }
}

module.exports = UsageTrackingMiddleware;
