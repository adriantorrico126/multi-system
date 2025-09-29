const { Pool } = require('pg');

class AlertaLimiteModel {
    constructor() {
        const poolConfig = {
            user: process.env.DB_USER || 'postgres',
            host: process.env.DB_HOST || 'localhost',
            database: process.env.DB_NAME || 'sistempos',
            password: process.env.DB_PASSWORD || 'password',
            port: process.env.DB_PORT || 5432,
        };

        // Si está en producción (DigitalOcean), agregar SSL
        if (process.env.DB_HOST && process.env.DB_HOST.includes('digitalocean.com')) {
            poolConfig.ssl = { rejectUnauthorized: false };
        }

        this.pool = new Pool(poolConfig);
    }

    // =====================================================
    // MÉTODOS DE CONSULTA DE ALERTAS
    // =====================================================

    /**
     * Obtener alertas de un restaurante
     * @param {number} idRestaurante - ID del restaurante
     * @param {string} estado - Estado de la alerta (opcional)
     * @returns {Promise<Array>} Lista de alertas
     */
    async getRestaurantAlerts(idRestaurante, estado = null) {
        try {
            let query = `
                SELECT 
                    al.id_alerta,
                    al.id_restaurante,
                    al.id_plan,
                    al.tipo_alerta,
                    al.recurso,
                    al.valor_actual,
                    al.valor_limite,
                    al.porcentaje_uso,
                    al.estado,
                    al.nivel_urgencia,
                    al.fecha_alerta,
                    al.fecha_resolucion,
                    al.mensaje,
                    al.datos_adicionales,
                    p.nombre as nombre_plan,
                    r.nombre as nombre_restaurante
                FROM alertas_limites al
                JOIN planes p ON al.id_plan = p.id_plan
                JOIN restaurantes r ON al.id_restaurante = r.id_restaurante
                WHERE al.id_restaurante = $1
            `;
            
            const values = [idRestaurante];
            
            if (estado) {
                query += ` AND al.estado = $2`;
                values.push(estado);
            }
            
            query += ` ORDER BY al.fecha_alerta DESC`;
            
            const result = await this.pool.query(query, values);
            return result.rows;
        } catch (error) {
            console.error('Error al obtener alertas del restaurante:', error);
            throw new Error('Error interno del servidor al obtener alertas');
        }
    }

    /**
     * Obtener alertas por estado
     * @param {string} estado - Estado de la alerta
     * @returns {Promise<Array>} Lista de alertas
     */
    async getAlertsByStatus(estado) {
        try {
            const query = `
                SELECT 
                    al.id_alerta,
                    al.id_restaurante,
                    al.id_plan,
                    al.tipo_alerta,
                    al.recurso,
                    al.valor_actual,
                    al.valor_limite,
                    al.porcentaje_uso,
                    al.estado,
                    al.nivel_urgencia,
                    al.fecha_alerta,
                    al.fecha_resolucion,
                    al.mensaje,
                    al.mensaje_resolucion,
                    al.datos_adicionales,
                    al.notificaciones_enviadas,
                    al.created_at,
                    al.updated_at,
                    p.nombre as nombre_plan,
                    r.nombre as nombre_restaurante
                FROM alertas_limites al
                JOIN planes p ON al.id_plan = p.id_plan
                JOIN restaurantes r ON al.id_restaurante = r.id_restaurante
                WHERE al.estado = $1
                ORDER BY al.fecha_alerta DESC
            `;
            
            const result = await this.pool.query(query, [estado]);
            return result.rows;
        } catch (error) {
            console.error('Error al obtener alertas por estado:', error);
            throw new Error('Error interno del servidor al obtener alertas');
        }
    }

    /**
     * Obtener alertas por nivel de urgencia
     * @param {string} nivelUrgencia - Nivel de urgencia
     * @returns {Promise<Array>} Lista de alertas
     */
    async getAlertsByUrgency(nivelUrgencia) {
        try {
            const query = `
                SELECT 
                    al.id_alerta,
                    al.id_restaurante,
                    al.id_plan,
                    al.tipo_alerta,
                    al.recurso,
                    al.valor_actual,
                    al.valor_limite,
                    al.porcentaje_uso,
                    al.estado,
                    al.nivel_urgencia,
                    al.fecha_alerta,
                    al.fecha_resolucion,
                    al.mensaje,
                    al.mensaje_resolucion,
                    al.datos_adicionales,
                    al.notificaciones_enviadas,
                    al.created_at,
                    al.updated_at,
                    p.nombre as nombre_plan,
                    r.nombre as nombre_restaurante
                FROM alertas_limites al
                JOIN planes p ON al.id_plan = p.id_plan
                JOIN restaurantes r ON al.id_restaurante = r.id_restaurante
                WHERE al.nivel_urgencia = $1
                ORDER BY al.fecha_alerta DESC
            `;
            
            const result = await this.pool.query(query, [nivelUrgencia]);
            return result.rows;
        } catch (error) {
            console.error('Error al obtener alertas por urgencia:', error);
            throw new Error('Error interno del servidor al obtener alertas');
        }
    }

    /**
     * Obtener alertas críticas
     * @returns {Promise<Array>} Lista de alertas críticas
     */
    async getCriticalAlerts() {
        try {
            const query = `
                SELECT 
                    al.id_alerta,
                    al.id_restaurante,
                    al.id_plan,
                    al.tipo_alerta,
                    al.recurso,
                    al.valor_actual,
                    al.valor_limite,
                    al.porcentaje_uso,
                    al.estado,
                    al.nivel_urgencia,
                    al.fecha_alerta,
                    al.fecha_resolucion,
                    al.mensaje,
                    al.mensaje_resolucion,
                    al.datos_adicionales,
                    al.notificaciones_enviadas,
                    al.created_at,
                    al.updated_at,
                    p.nombre as nombre_plan,
                    r.nombre as nombre_restaurante
                FROM alertas_limites al
                JOIN planes p ON al.id_plan = p.id_plan
                JOIN restaurantes r ON al.id_restaurante = r.id_restaurante
                WHERE al.nivel_urgencia = 'critico' 
                AND al.estado IN ('pendiente', 'enviada')
                ORDER BY al.fecha_alerta DESC
            `;
            
            const result = await this.pool.query(query);
            return result.rows;
        } catch (error) {
            console.error('Error al obtener alertas críticas:', error);
            throw new Error('Error interno del servidor al obtener alertas críticas');
        }
    }

    /**
     * Obtener alertas pendientes de notificación
     * @returns {Promise<Array>} Lista de alertas pendientes
     */
    async getPendingNotificationAlerts() {
        try {
            const query = `
                SELECT 
                    al.id_alerta,
                    al.id_restaurante,
                    al.id_plan,
                    al.tipo_alerta,
                    al.recurso,
                    al.valor_actual,
                    al.valor_limite,
                    al.porcentaje_uso,
                    al.estado,
                    al.nivel_urgencia,
                    al.fecha_alerta,
                    al.fecha_resolucion,
                    al.mensaje,
                    al.mensaje_resolucion,
                    al.datos_adicionales,
                    al.notificaciones_enviadas,
                    al.created_at,
                    al.updated_at,
                    p.nombre as nombre_plan,
                    r.nombre as nombre_restaurante
                FROM alertas_limites al
                JOIN planes p ON al.id_plan = p.id_plan
                JOIN restaurantes r ON al.id_restaurante = r.id_restaurante
                WHERE al.estado = 'pendiente'
                AND al.fecha_alerta >= CURRENT_DATE - INTERVAL '7 days'
                ORDER BY al.nivel_urgencia DESC, al.fecha_alerta ASC
            `;
            
            const result = await this.pool.query(query);
            return result.rows;
        } catch (error) {
            console.error('Error al obtener alertas pendientes:', error);
            throw new Error('Error interno del servidor al obtener alertas pendientes');
        }
    }

    /**
     * Obtener alertas por tipo
     * @param {string} tipoAlerta - Tipo de alerta
     * @returns {Promise<Array>} Lista de alertas
     */
    async getAlertsByType(tipoAlerta) {
        try {
            const query = `
                SELECT 
                    al.id_alerta,
                    al.id_restaurante,
                    al.id_plan,
                    al.tipo_alerta,
                    al.recurso,
                    al.valor_actual,
                    al.valor_limite,
                    al.porcentaje_uso,
                    al.estado,
                    al.nivel_urgencia,
                    al.fecha_alerta,
                    al.fecha_resolucion,
                    al.mensaje,
                    al.mensaje_resolucion,
                    al.datos_adicionales,
                    al.notificaciones_enviadas,
                    al.created_at,
                    al.updated_at,
                    p.nombre as nombre_plan,
                    r.nombre as nombre_restaurante
                FROM alertas_limites al
                JOIN planes p ON al.id_plan = p.id_plan
                JOIN restaurantes r ON al.id_restaurante = r.id_restaurante
                WHERE al.tipo_alerta = $1
                ORDER BY al.fecha_alerta DESC
            `;
            
            const result = await this.pool.query(query, [tipoAlerta]);
            return result.rows;
        } catch (error) {
            console.error('Error al obtener alertas por tipo:', error);
            throw new Error('Error interno del servidor al obtener alertas');
        }
    }

    // =====================================================
    // MÉTODOS DE GESTIÓN DE ALERTAS
    // =====================================================

    /**
     * Crear una nueva alerta
     * @param {Object} alertaData - Datos de la alerta
     * @returns {Promise<Object>} Alerta creada
     */
    async createAlert(alertaData) {
        try {
            const {
                id_restaurante, id_plan, tipo_alerta, recurso, valor_actual,
                valor_limite, porcentaje_uso, estado = 'pendiente', nivel_urgencia = 'medio',
                mensaje, mensaje_resolucion, datos_adicionales
            } = alertaData;

            const query = `
                INSERT INTO alertas_limites (
                    id_restaurante, id_plan, tipo_alerta, recurso, valor_actual,
                    valor_limite, porcentaje_uso, estado, nivel_urgencia,
                    mensaje, mensaje_resolucion, datos_adicionales
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
                ) RETURNING *
            `;

            const values = [
                id_restaurante, id_plan, tipo_alerta, recurso, valor_actual,
                valor_limite, porcentaje_uso, estado, nivel_urgencia,
                mensaje, mensaje_resolucion, datos_adicionales
            ];

            const result = await this.pool.query(query, values);
            return result.rows[0];
        } catch (error) {
            console.error('Error al crear alerta:', error);
            throw new Error('Error interno del servidor al crear alerta');
        }
    }

    /**
     * Actualizar una alerta
     * @param {number} idAlerta - ID de la alerta
     * @param {Object} alertaData - Datos a actualizar
     * @returns {Promise<Object>} Alerta actualizada
     */
    async updateAlert(idAlerta, alertaData) {
        try {
            const fields = [];
            const values = [];
            let paramCount = 1;

            // Construir query dinámicamente
            Object.keys(alertaData).forEach(key => {
                if (alertaData[key] !== undefined) {
                    fields.push(`${key} = $${paramCount}`);
                    values.push(alertaData[key]);
                    paramCount++;
                }
            });

            if (fields.length === 0) {
                throw new Error('No hay campos para actualizar');
            }

            values.push(idAlerta);
            const query = `
                UPDATE alertas_limites 
                SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
                WHERE id_alerta = $${paramCount}
                RETURNING *
            `;

            const result = await this.pool.query(query, values);
            
            if (result.rows.length === 0) {
                throw new Error('Alerta no encontrada');
            }

            return result.rows[0];
        } catch (error) {
            console.error('Error al actualizar alerta:', error);
            if (error.message === 'Alerta no encontrada') {
                throw error;
            }
            throw new Error('Error interno del servidor al actualizar alerta');
        }
    }

    /**
     * Marcar alerta como enviada
     * @param {number} idAlerta - ID de la alerta
     * @returns {Promise<Object>} Alerta actualizada
     */
    async markAlertAsSent(idAlerta) {
        try {
            const query = `
                UPDATE alertas_limites 
                SET estado = 'enviada', 
                    notificaciones_enviadas = notificaciones_enviadas + 1,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id_alerta = $1
                RETURNING *
            `;

            const result = await this.pool.query(query, [idAlerta]);
            
            if (result.rows.length === 0) {
                throw new Error('Alerta no encontrada');
            }

            return result.rows[0];
        } catch (error) {
            console.error('Error al marcar alerta como enviada:', error);
            if (error.message === 'Alerta no encontrada') {
                throw error;
            }
            throw new Error('Error interno del servidor al actualizar alerta');
        }
    }

    /**
     * Resolver una alerta
     * @param {number} idAlerta - ID de la alerta
     * @param {string} mensajeResolucion - Mensaje de resolución
     * @returns {Promise<Object>} Alerta resuelta
     */
    async resolveAlert(idAlerta, mensajeResolucion) {
        try {
            const query = `
                UPDATE alertas_limites 
                SET estado = 'resuelta', 
                    fecha_resolucion = CURRENT_TIMESTAMP,
                    mensaje_resolucion = $1,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id_alerta = $2
                RETURNING *
            `;

            const result = await this.pool.query(query, [mensajeResolucion, idAlerta]);
            
            if (result.rows.length === 0) {
                throw new Error('Alerta no encontrada');
            }

            return result.rows[0];
        } catch (error) {
            console.error('Error al resolver alerta:', error);
            if (error.message === 'Alerta no encontrada') {
                throw error;
            }
            throw new Error('Error interno del servidor al resolver alerta');
        }
    }

    /**
     * Ignorar una alerta
     * @param {number} idAlerta - ID de la alerta
     * @param {string} motivo - Motivo para ignorar
     * @returns {Promise<Object>} Alerta ignorada
     */
    async ignoreAlert(idAlerta, motivo) {
        try {
            const query = `
                UPDATE alertas_limites 
                SET estado = 'ignorada', 
                    mensaje_resolucion = $1,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id_alerta = $2
                RETURNING *
            `;

            const result = await this.pool.query(query, [motivo, idAlerta]);
            
            if (result.rows.length === 0) {
                throw new Error('Alerta no encontrada');
            }

            return result.rows[0];
        } catch (error) {
            console.error('Error al ignorar alerta:', error);
            if (error.message === 'Alerta no encontrada') {
                throw error;
            }
            throw new Error('Error interno del servidor al ignorar alerta');
        }
    }

    /**
     * Eliminar alertas antiguas
     * @param {number} dias - Días de antigüedad
     * @returns {Promise<number>} Número de alertas eliminadas
     */
    async deleteOldAlerts(dias = 90) {
        try {
            const query = `
                DELETE FROM alertas_limites 
                WHERE fecha_alerta < CURRENT_DATE - INTERVAL '${dias} days'
                AND estado IN ('resuelta', 'ignorada')
                RETURNING id_alerta
            `;

            const result = await this.pool.query(query);
            return result.rows.length;
        } catch (error) {
            console.error('Error al eliminar alertas antiguas:', error);
            throw new Error('Error interno del servidor al eliminar alertas');
        }
    }

    // =====================================================
    // MÉTODOS DE VALIDACIÓN
    // =====================================================

    /**
     * Verificar si existe una alerta activa para un recurso
     * @param {number} idRestaurante - ID del restaurante
     * @param {string} tipoAlerta - Tipo de alerta
     * @param {string} recurso - Recurso
     * @returns {Promise<boolean>} True si existe alerta activa
     */
    async hasActiveAlert(idRestaurante, tipoAlerta, recurso) {
        try {
            const query = `
                SELECT 1 FROM alertas_limites 
                WHERE id_restaurante = $1 
                AND tipo_alerta = $2 
                AND recurso = $3
                AND estado IN ('pendiente', 'enviada')
            `;
            
            const result = await this.pool.query(query, [idRestaurante, tipoAlerta, recurso]);
            return result.rows.length > 0;
        } catch (error) {
            console.error('Error al verificar alerta activa:', error);
            return false;
        }
    }

    /**
     * Verificar si se debe crear una nueva alerta
     * @param {number} idRestaurante - ID del restaurante
     * @param {string} tipoAlerta - Tipo de alerta
     * @param {number} porcentajeUso - Porcentaje de uso actual
     * @returns {Promise<boolean>} True si se debe crear alerta
     */
    async shouldCreateAlert(idRestaurante, tipoAlerta, porcentajeUso) {
        try {
            // Verificar si ya existe una alerta reciente para este tipo
            const query = `
                SELECT 1 FROM alertas_limites 
                WHERE id_restaurante = $1 
                AND tipo_alerta = $2
                AND estado IN ('pendiente', 'enviada')
                AND fecha_alerta >= CURRENT_DATE - INTERVAL '1 day'
            `;
            
            const result = await this.pool.query(query, [idRestaurante, tipoAlerta]);
            
            // Si ya existe una alerta reciente, no crear otra
            if (result.rows.length > 0) {
                return false;
            }
            
            // Crear alerta si el porcentaje de uso es >= 80%
            return porcentajeUso >= 80;
        } catch (error) {
            console.error('Error al verificar si se debe crear alerta:', error);
            return false;
        }
    }

    // =====================================================
    // MÉTODOS DE ESTADÍSTICAS
    // =====================================================

    /**
     * Obtener estadísticas de alertas
     * @returns {Promise<Object>} Estadísticas de alertas
     */
    async getAlertStats() {
        try {
            const query = `
                SELECT 
                    COUNT(*) as total_alertas,
                    COUNT(CASE WHEN estado = 'pendiente' THEN 1 END) as alertas_pendientes,
                    COUNT(CASE WHEN estado = 'enviada' THEN 1 END) as alertas_enviadas,
                    COUNT(CASE WHEN estado = 'resuelta' THEN 1 END) as alertas_resueltas,
                    COUNT(CASE WHEN estado = 'ignorada' THEN 1 END) as alertas_ignoradas,
                    COUNT(CASE WHEN nivel_urgencia = 'critico' THEN 1 END) as alertas_criticas,
                    COUNT(CASE WHEN nivel_urgencia = 'alto' THEN 1 END) as alertas_altas,
                    COUNT(CASE WHEN nivel_urgencia = 'medio' THEN 1 END) as alertas_medias,
                    COUNT(CASE WHEN nivel_urgencia = 'bajo' THEN 1 END) as alertas_bajas,
                    COUNT(CASE WHEN fecha_alerta >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as alertas_ultima_semana,
                    COUNT(CASE WHEN fecha_alerta >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as alertas_ultimo_mes
                FROM alertas_limites
            `;
            
            const result = await this.pool.query(query);
            return result.rows[0];
        } catch (error) {
            console.error('Error al obtener estadísticas de alertas:', error);
            throw new Error('Error interno del servidor al obtener estadísticas');
        }
    }

    /**
     * Obtener estadísticas de alertas por tipo
     * @returns {Promise<Array>} Estadísticas por tipo
     */
    async getAlertStatsByType() {
        try {
            const query = `
                SELECT 
                    tipo_alerta,
                    COUNT(*) as total_alertas,
                    COUNT(CASE WHEN estado = 'pendiente' THEN 1 END) as alertas_pendientes,
                    COUNT(CASE WHEN estado = 'enviada' THEN 1 END) as alertas_enviadas,
                    COUNT(CASE WHEN estado = 'resuelta' THEN 1 END) as alertas_resueltas,
                    COUNT(CASE WHEN estado = 'ignorada' THEN 1 END) as alertas_ignoradas,
                    COUNT(CASE WHEN nivel_urgencia = 'critico' THEN 1 END) as alertas_criticas,
                    COUNT(CASE WHEN nivel_urgencia = 'alto' THEN 1 END) as alertas_altas,
                    COUNT(CASE WHEN nivel_urgencia = 'medio' THEN 1 END) as alertas_medias,
                    COUNT(CASE WHEN nivel_urgencia = 'bajo' THEN 1 END) as alertas_bajas,
                    AVG(porcentaje_uso) as porcentaje_uso_promedio,
                    MAX(porcentaje_uso) as porcentaje_uso_maximo
                FROM alertas_limites
                GROUP BY tipo_alerta
                ORDER BY total_alertas DESC
            `;
            
            const result = await this.pool.query(query);
            return result.rows;
        } catch (error) {
            console.error('Error al obtener estadísticas por tipo:', error);
            throw new Error('Error interno del servidor al obtener estadísticas');
        }
    }

    /**
     * Obtener estadísticas de alertas por restaurante
     * @returns {Promise<Array>} Estadísticas por restaurante
     */
    async getAlertStatsByRestaurant() {
        try {
            const query = `
                SELECT 
                    al.id_restaurante,
                    r.nombre as nombre_restaurante,
                    COUNT(*) as total_alertas,
                    COUNT(CASE WHEN al.estado = 'pendiente' THEN 1 END) as alertas_pendientes,
                    COUNT(CASE WHEN al.estado = 'enviada' THEN 1 END) as alertas_enviadas,
                    COUNT(CASE WHEN al.estado = 'resuelta' THEN 1 END) as alertas_resueltas,
                    COUNT(CASE WHEN al.estado = 'ignorada' THEN 1 END) as alertas_ignoradas,
                    COUNT(CASE WHEN al.nivel_urgencia = 'critico' THEN 1 END) as alertas_criticas,
                    COUNT(CASE WHEN al.nivel_urgencia = 'alto' THEN 1 END) as alertas_altas,
                    COUNT(CASE WHEN al.nivel_urgencia = 'medio' THEN 1 END) as alertas_medias,
                    COUNT(CASE WHEN al.nivel_urgencia = 'bajo' THEN 1 END) as alertas_bajas,
                    AVG(al.porcentaje_uso) as porcentaje_uso_promedio,
                    MAX(al.porcentaje_uso) as porcentaje_uso_maximo,
                    MAX(al.fecha_alerta) as ultima_alerta
                FROM alertas_limites al
                JOIN restaurantes r ON al.id_restaurante = r.id_restaurante
                GROUP BY al.id_restaurante, r.nombre
                ORDER BY total_alertas DESC
            `;
            
            const result = await this.pool.query(query);
            return result.rows;
        } catch (error) {
            console.error('Error al obtener estadísticas por restaurante:', error);
            throw new Error('Error interno del servidor al obtener estadísticas');
        }
    }

    // =====================================================
    // MÉTODOS DE UTILIDAD
    // =====================================================

    /**
     * Cerrar conexión a la base de datos
     */
    async close() {
        await this.pool.end();
    }

    /**
     * Verificar conexión a la base de datos
     * @returns {Promise<boolean>} True si la conexión es válida
     */
    async testConnection() {
        try {
            const result = await this.pool.query('SELECT 1');
            return result.rows.length > 0;
        } catch (error) {
            console.error('Error de conexión a la base de datos:', error);
            return false;
        }
    }
}

module.exports = AlertaLimiteModel;
