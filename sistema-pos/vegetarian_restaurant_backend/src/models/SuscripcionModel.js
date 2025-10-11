const { Pool } = require('pg');

class SuscripcionModel {
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
    // MÉTODOS DE CONSULTA DE SUSCRIPCIONES
    // =====================================================

    /**
     * Obtener suscripción activa de un restaurante
     * @param {number} idRestaurante - ID del restaurante
     * @returns {Promise<Object|null>} Suscripción activa o null
     */
    async getActiveSubscription(idRestaurante) {
        try {
            console.log(`🔍 [SuscripcionModel] Obteniendo suscripción activa para restaurante: ${idRestaurante}`);
            
            const query = `
                SELECT 
                    sa.id_suscripcion,
                    sa.id_restaurante,
                    sa.id_plan,
                    sa.estado,
                    sa.fecha_inicio,
                    sa.fecha_fin,
                    sa.fecha_renovacion,
                    sa.created_at,
                    sa.updated_at,
                    p.nombre as nombre_plan,
                    p.precio_mensual,
                    p.precio_anual,
                    p.max_sucursales,
                    p.max_usuarios,
                    p.max_productos,
                    p.max_transacciones_mes,
                    p.almacenamiento_gb
                FROM suscripciones sa
                JOIN planes_pos p ON sa.id_plan = p.id
                WHERE sa.id_restaurante = $1 
                AND sa.estado = 'activa'
                AND (sa.fecha_fin IS NULL OR sa.fecha_fin >= CURRENT_DATE)
            `;
            
            console.log(`🔍 [SuscripcionModel] Ejecutando query...`);
            const result = await this.pool.query(query, [idRestaurante]);
            console.log(`🔍 [SuscripcionModel] Query ejecutado. Filas encontradas: ${result.rows.length}`);
            
            const suscripcion = result.rows[0] || null;
            if (suscripcion) {
                console.log(`🔍 [SuscripcionModel] Suscripción encontrada: Plan ${suscripcion.nombre_plan} (ID: ${suscripcion.id_plan})`);
            } else {
                console.log(`🔍 [SuscripcionModel] No se encontró suscripción activa`);
            }
            
            return suscripcion;
        } catch (error) {
            console.error('❌ [SuscripcionModel] Error al obtener suscripción activa:', error);
            console.error('❌ [SuscripcionModel] Stack trace:', error.stack);
            throw new Error('Error interno del servidor al obtener suscripción');
        }
    }

    /**
     * Obtener todas las suscripciones de un restaurante
     * @param {number} idRestaurante - ID del restaurante
     * @returns {Promise<Array>} Lista de suscripciones
     */
    async getRestaurantSubscriptions(idRestaurante) {
        try {
            const query = `
                SELECT 
                    sa.id_suscripcion,
                    sa.id_restaurante,
                    sa.id_plan,
                    sa.estado,
                    sa.fecha_inicio,
                    sa.fecha_fin,
                    sa.fecha_renovacion,
                    sa.fecha_suspension,
                    sa.fecha_cancelacion,
                    sa.metodo_pago,
                    sa.ultimo_pago,
                    sa.proximo_pago,
                    sa.auto_renovacion,
                    sa.notificaciones_email,
                    sa.notificaciones_sms,
                    sa.motivo_suspension,
                    sa.motivo_cancelacion,
                    sa.datos_adicionales,
                    sa.created_at,
                    sa.updated_at,
                    p.nombre as nombre_plan,
                    p.precio_mensual,
                    p.precio_anual
                FROM suscripciones sa
                JOIN planes_pos p ON sa.id_plan = p.id
                WHERE sa.id_restaurante = $1
                ORDER BY sa.created_at DESC
            `;
            
            const result = await this.pool.query(query, [idRestaurante]);
            return result.rows;
        } catch (error) {
            console.error('Error al obtener suscripciones del restaurante:', error);
            throw new Error('Error interno del servidor al obtener suscripciones');
        }
    }

    /**
     * Obtener suscripciones por estado
     * @param {string} estado - Estado de la suscripción
     * @returns {Promise<Array>} Lista de suscripciones
     */
    async getSubscriptionsByStatus(estado) {
        try {
            const query = `
                SELECT 
                    sa.id_suscripcion,
                    sa.id_restaurante,
                    sa.id_plan,
                    sa.estado,
                    sa.fecha_inicio,
                    sa.fecha_fin,
                    sa.fecha_renovacion,
                    sa.fecha_suspension,
                    sa.fecha_cancelacion,
                    sa.metodo_pago,
                    sa.ultimo_pago,
                    sa.proximo_pago,
                    sa.auto_renovacion,
                    sa.notificaciones_email,
                    sa.notificaciones_sms,
                    sa.motivo_suspension,
                    sa.motivo_cancelacion,
                    sa.datos_adicionales,
                    sa.created_at,
                    sa.updated_at,
                    p.nombre as nombre_plan,
                    p.precio_mensual,
                    p.precio_anual,
                    r.nombre as nombre_restaurante
                FROM suscripciones sa
                JOIN planes_pos p ON sa.id_plan = p.id
                JOIN restaurantes r ON sa.id_restaurante = r.id_restaurante
                WHERE sa.estado = $1
                ORDER BY sa.created_at DESC
            `;
            
            const result = await this.pool.query(query, [estado]);
            return result.rows;
        } catch (error) {
            console.error('Error al obtener suscripciones por estado:', error);
            throw new Error('Error interno del servidor al obtener suscripciones');
        }
    }

    /**
     * Obtener suscripciones próximas a vencer
     * @param {number} dias - Días de anticipación
     * @returns {Promise<Array>} Lista de suscripciones próximas a vencer
     */
    async getSubscriptionsExpiringSoon(dias = 7) {
        try {
            const query = `
                SELECT 
                    sa.id_suscripcion,
                    sa.id_restaurante,
                    sa.id_plan,
                    sa.estado,
                    sa.fecha_inicio,
                    sa.fecha_fin,
                    sa.fecha_renovacion,
                    sa.metodo_pago,
                    sa.ultimo_pago,
                    sa.proximo_pago,
                    sa.auto_renovacion,
                    sa.notificaciones_email,
                    sa.notificaciones_sms,
                    sa.created_at,
                    sa.updated_at,
                    p.nombre as nombre_plan,
                    p.precio_mensual,
                    p.precio_anual,
                    r.nombre as nombre_restaurante,
                    EXTRACT(DAYS FROM (sa.fecha_fin - CURRENT_DATE)) as dias_restantes
                FROM suscripciones sa
                JOIN planes_pos p ON sa.id_plan = p.id
                JOIN restaurantes r ON sa.id_restaurante = r.id_restaurante
                WHERE sa.estado = 'activa'
                AND sa.fecha_fin BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '${dias} days'
                ORDER BY sa.fecha_fin ASC
            `;
            
            const result = await this.pool.query(query);
            return result.rows;
        } catch (error) {
            console.error('Error al obtener suscripciones próximas a vencer:', error);
            throw new Error('Error interno del servidor al obtener suscripciones');
        }
    }

    /**
     * Obtener suscripciones vencidas
     * @returns {Promise<Array>} Lista de suscripciones vencidas
     */
    async getExpiredSubscriptions() {
        try {
            const query = `
                SELECT 
                    sa.id_suscripcion,
                    sa.id_restaurante,
                    sa.id_plan,
                    sa.estado,
                    sa.fecha_inicio,
                    sa.fecha_fin,
                    sa.fecha_renovacion,
                    sa.metodo_pago,
                    sa.ultimo_pago,
                    sa.proximo_pago,
                    sa.auto_renovacion,
                    sa.notificaciones_email,
                    sa.notificaciones_sms,
                    sa.created_at,
                    sa.updated_at,
                    p.nombre as nombre_plan,
                    p.precio_mensual,
                    p.precio_anual,
                    r.nombre as nombre_restaurante,
                    EXTRACT(DAYS FROM (CURRENT_DATE - sa.fecha_fin)) as dias_vencida
                FROM suscripciones sa
                JOIN planes_pos p ON sa.id_plan = p.id
                JOIN restaurantes r ON sa.id_restaurante = r.id_restaurante
                WHERE sa.estado = 'activa'
                AND sa.fecha_fin < CURRENT_DATE
                ORDER BY sa.fecha_fin ASC
            `;
            
            const result = await this.pool.query(query);
            return result.rows;
        } catch (error) {
            console.error('Error al obtener suscripciones vencidas:', error);
            throw new Error('Error interno del servidor al obtener suscripciones');
        }
    }

    // =====================================================
    // MÉTODOS DE GESTIÓN DE SUSCRIPCIONES
    // =====================================================

    /**
     * Crear una nueva suscripción
     * @param {Object} suscripcionData - Datos de la suscripción
     * @returns {Promise<Object>} Suscripción creada
     */
    async createSubscription(suscripcionData) {
        try {
            const {
                id_restaurante, id_plan, estado = 'activa', fecha_inicio, fecha_fin,
                fecha_renovacion, metodo_pago, ultimo_pago, proximo_pago,
                auto_renovacion = true, notificaciones_email = true, notificaciones_sms = false,
                motivo_suspension, motivo_cancelacion, datos_adicionales
            } = suscripcionData;

            const query = `
                INSERT INTO suscripciones (
                    id_restaurante, id_plan, estado, fecha_inicio, fecha_fin,
                    fecha_renovacion, metodo_pago, ultimo_pago, proximo_pago,
                    auto_renovacion, notificaciones_email, notificaciones_sms,
                    motivo_suspension, motivo_cancelacion, datos_adicionales
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
                ) RETURNING *
            `;

            const values = [
                id_restaurante, id_plan, estado, fecha_inicio, fecha_fin,
                fecha_renovacion, metodo_pago, ultimo_pago, proximo_pago,
                auto_renovacion, notificaciones_email, notificaciones_sms,
                motivo_suspension, motivo_cancelacion, datos_adicionales
            ];

            const result = await this.pool.query(query, values);
            return result.rows[0];
        } catch (error) {
            console.error('Error al crear suscripción:', error);
            if (error.code === '23505') { // Unique violation
                throw new Error('Ya existe una suscripción activa para este restaurante');
            }
            throw new Error('Error interno del servidor al crear suscripción');
        }
    }

    /**
     * Actualizar una suscripción
     * @param {number} idSuscripcion - ID de la suscripción
     * @param {Object} suscripcionData - Datos a actualizar
     * @returns {Promise<Object>} Suscripción actualizada
     */
    async updateSubscription(idSuscripcion, suscripcionData) {
        try {
            const fields = [];
            const values = [];
            let paramCount = 1;

            // Construir query dinámicamente
            Object.keys(suscripcionData).forEach(key => {
                if (suscripcionData[key] !== undefined) {
                    fields.push(`${key} = $${paramCount}`);
                    values.push(suscripcionData[key]);
                    paramCount++;
                }
            });

            if (fields.length === 0) {
                throw new Error('No hay campos para actualizar');
            }

            values.push(idSuscripcion);
            const query = `
                UPDATE suscripciones 
                SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
                WHERE id_suscripcion = $${paramCount}
                RETURNING *
            `;

            const result = await this.pool.query(query, values);
            
            if (result.rows.length === 0) {
                throw new Error('Suscripción no encontrada');
            }

            return result.rows[0];
        } catch (error) {
            console.error('Error al actualizar suscripción:', error);
            if (error.message === 'Suscripción no encontrada') {
                throw error;
            }
            throw new Error('Error interno del servidor al actualizar suscripción');
        }
    }

    /**
     * Cambiar el plan de una suscripción
     * @param {number} idSuscripcion - ID de la suscripción
     * @param {number} nuevoIdPlan - ID del nuevo plan
     * @param {string} motivo - Motivo del cambio
     * @returns {Promise<Object>} Suscripción actualizada
     */
    async changePlan(idSuscripcion, nuevoIdPlan, motivo = 'Cambio de plan solicitado') {
        try {
            const query = `
                UPDATE suscripciones 
                SET id_plan = $1, updated_at = CURRENT_TIMESTAMP
                WHERE id_suscripcion = $2
                RETURNING *
            `;

            const result = await this.pool.query(query, [nuevoIdPlan, idSuscripcion]);
            
            if (result.rows.length === 0) {
                throw new Error('Suscripción no encontrada');
            }

            return result.rows[0];
        } catch (error) {
            console.error('Error al cambiar plan:', error);
            if (error.message === 'Suscripción no encontrada') {
                throw error;
            }
            throw new Error('Error interno del servidor al cambiar plan');
        }
    }

    /**
     * Suspender una suscripción
     * @param {number} idSuscripcion - ID de la suscripción
     * @param {string} motivo - Motivo de la suspensión
     * @returns {Promise<Object>} Suscripción suspendida
     */
    async suspendSubscription(idSuscripcion, motivo) {
        try {
            const query = `
                UPDATE suscripciones 
                SET estado = 'suspendida', 
                    fecha_suspension = CURRENT_TIMESTAMP,
                    motivo_suspension = $1,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id_suscripcion = $2
                RETURNING *
            `;

            const result = await this.pool.query(query, [motivo, idSuscripcion]);
            
            if (result.rows.length === 0) {
                throw new Error('Suscripción no encontrada');
            }

            return result.rows[0];
        } catch (error) {
            console.error('Error al suspender suscripción:', error);
            if (error.message === 'Suscripción no encontrada') {
                throw error;
            }
            throw new Error('Error interno del servidor al suspender suscripción');
        }
    }

    /**
     * Reactivar una suscripción
     * @param {number} idSuscripcion - ID de la suscripción
     * @param {string} motivo - Motivo de la reactivación
     * @returns {Promise<Object>} Suscripción reactivada
     */
    async reactivateSubscription(idSuscripcion, motivo) {
        try {
            const query = `
                UPDATE suscripciones 
                SET estado = 'activa', 
                    fecha_suspension = NULL,
                    motivo_suspension = NULL,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id_suscripcion = $2
                RETURNING *
            `;

            const result = await this.pool.query(query, [motivo, idSuscripcion]);
            
            if (result.rows.length === 0) {
                throw new Error('Suscripción no encontrada');
            }

            return result.rows[0];
        } catch (error) {
            console.error('Error al reactivar suscripción:', error);
            if (error.message === 'Suscripción no encontrada') {
                throw error;
            }
            throw new Error('Error interno del servidor al reactivar suscripción');
        }
    }

    /**
     * Cancelar una suscripción
     * @param {number} idSuscripcion - ID de la suscripción
     * @param {string} motivo - Motivo de la cancelación
     * @returns {Promise<Object>} Suscripción cancelada
     */
    async cancelSubscription(idSuscripcion, motivo) {
        try {
            const query = `
                UPDATE suscripciones 
                SET estado = 'cancelada', 
                    fecha_cancelacion = CURRENT_TIMESTAMP,
                    motivo_cancelacion = $1,
                    auto_renovacion = false,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id_suscripcion = $2
                RETURNING *
            `;

            const result = await this.pool.query(query, [motivo, idSuscripcion]);
            
            if (result.rows.length === 0) {
                throw new Error('Suscripción no encontrada');
            }

            return result.rows[0];
        } catch (error) {
            console.error('Error al cancelar suscripción:', error);
            if (error.message === 'Suscripción no encontrada') {
                throw error;
            }
            throw new Error('Error interno del servidor al cancelar suscripción');
        }
    }

    // =====================================================
    // MÉTODOS DE VALIDACIÓN
    // =====================================================

    /**
     * Verificar si un restaurante tiene suscripción activa
     * @param {number} idRestaurante - ID del restaurante
     * @returns {Promise<boolean>} True si tiene suscripción activa
     */
    async hasActiveSubscription(idRestaurante) {
        try {
            const query = `
                SELECT 1 FROM suscripciones 
                WHERE id_restaurante = $1 
                AND estado = 'activa'
                AND fecha_fin >= CURRENT_DATE
            `;
            
            const result = await this.pool.query(query, [idRestaurante]);
            return result.rows.length > 0;
        } catch (error) {
            console.error('Error al verificar suscripción activa:', error);
            return false;
        }
    }

    /**
     * Verificar si una suscripción está próxima a vencer
     * @param {number} idSuscripcion - ID de la suscripción
     * @param {number} dias - Días de anticipación
     * @returns {Promise<boolean>} True si está próxima a vencer
     */
    async isSubscriptionExpiringSoon(idSuscripcion, dias = 7) {
        try {
            const query = `
                SELECT 1 FROM suscripciones 
                WHERE id_suscripcion = $1 
                AND estado = 'activa'
                AND fecha_fin BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '${dias} days'
            `;
            
            const result = await this.pool.query(query, [idSuscripcion]);
            return result.rows.length > 0;
        } catch (error) {
            console.error('Error al verificar vencimiento de suscripción:', error);
            return false;
        }
    }

    /**
     * Verificar si una suscripción está vencida
     * @param {number} idSuscripcion - ID de la suscripción
     * @returns {Promise<boolean>} True si está vencida
     */
    async isSubscriptionExpired(idSuscripcion) {
        try {
            const query = `
                SELECT 1 FROM suscripciones 
                WHERE id_suscripcion = $1 
                AND estado = 'activa'
                AND fecha_fin < CURRENT_DATE
            `;
            
            const result = await this.pool.query(query, [idSuscripcion]);
            return result.rows.length > 0;
        } catch (error) {
            console.error('Error al verificar suscripción vencida:', error);
            return false;
        }
    }

    // =====================================================
    // MÉTODOS DE ESTADÍSTICAS
    // =====================================================

    /**
     * Obtener estadísticas de suscripciones
     * @returns {Promise<Object>} Estadísticas de suscripciones
     */
    async getSubscriptionStats() {
        try {
            const query = `
                SELECT 
                    COUNT(*) as total_suscripciones,
                    COUNT(CASE WHEN estado = 'activa' THEN 1 END) as suscripciones,
                    COUNT(CASE WHEN estado = 'suspendida' THEN 1 END) as suscripciones_suspendidas,
                    COUNT(CASE WHEN estado = 'cancelada' THEN 1 END) as suscripciones_canceladas,
                    COUNT(CASE WHEN estado = 'expirada' THEN 1 END) as suscripciones_expiradas,
                    COUNT(CASE WHEN fecha_fin BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days' THEN 1 END) as proximas_a_vencer,
                    COUNT(CASE WHEN fecha_fin < CURRENT_DATE AND estado = 'activa' THEN 1 END) as vencidas,
                    AVG(CASE WHEN estado = 'activa' THEN 
                        EXTRACT(DAYS FROM (fecha_fin - fecha_inicio)) 
                    END) as duracion_promedio_dias
                FROM suscripciones
            `;
            
            const result = await this.pool.query(query);
            return result.rows[0];
        } catch (error) {
            console.error('Error al obtener estadísticas de suscripciones:', error);
            throw new Error('Error interno del servidor al obtener estadísticas');
        }
    }

    /**
     * Obtener ingresos por suscripciones
     * @param {string} periodo - 'mensual' o 'anual'
     * @returns {Promise<Object>} Ingresos por suscripciones
     */
    async getSubscriptionRevenue(periodo = 'mensual') {
        try {
            let query;
            
            if (periodo === 'mensual') {
                query = `
                    SELECT 
                        SUM(p.precio_mensual) as ingresos_mensuales,
                        COUNT(*) as total_suscripciones
                    FROM suscripciones sa
                    JOIN planes_pos p ON sa.id_plan = p.id
                    WHERE sa.estado = 'activa'
                `;
            } else {
                query = `
                    SELECT 
                        SUM(p.precio_anual) as ingresos_anuales,
                        COUNT(*) as total_suscripciones
                    FROM suscripciones sa
                    JOIN planes_pos p ON sa.id_plan = p.id
                    WHERE sa.estado = 'activa'
                    AND p.precio_anual IS NOT NULL
                `;
            }
            
            const result = await this.pool.query(query);
            return result.rows[0];
        } catch (error) {
            console.error('Error al obtener ingresos de suscripciones:', error);
            throw new Error('Error interno del servidor al obtener ingresos');
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

module.exports = SuscripcionModel;
