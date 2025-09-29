const { Pool } = require('pg');

class PlanModel {
    constructor() {
        this.pool = new Pool({
            user: process.env.DB_USER || 'postgres',
            host: process.env.DB_HOST || 'localhost',
            database: process.env.DB_NAME || 'sistempos',
            password: process.env.DB_PASSWORD || 'password',
            port: process.env.DB_PORT || 5432,
        });
    }

    // =====================================================
    // MÉTODOS DE CONSULTA DE PLANES
    // =====================================================

    /**
     * Obtener todos los planes activos
     * @returns {Promise<Array>} Lista de planes activos
     */
    async getAllPlans() {
        try {
            const query = `
                SELECT 
                    id_plan,
                    nombre,
                    descripcion,
                    precio_mensual,
                    precio_anual,
                    max_sucursales,
                    max_usuarios,
                    max_productos,
                    max_transacciones_mes,
                    almacenamiento_gb,
                    incluye_pos,
                    incluye_inventario_basico,
                    incluye_inventario_avanzado,
                    incluye_promociones,
                    incluye_reservas,
                    incluye_arqueo_caja,
                    incluye_egresos,
                    incluye_egresos_avanzados,
                    incluye_reportes_avanzados,
                    incluye_analytics,
                    incluye_delivery,
                    incluye_impresion,
                    incluye_soporte_24h,
                    incluye_api,
                    incluye_white_label,
                    orden_display,
                    created_at,
                    updated_at
                FROM planes 
                WHERE activo = true 
                ORDER BY orden_display ASC, precio_mensual ASC
            `;
            
            const result = await this.pool.query(query);
            return result.rows;
        } catch (error) {
            console.error('Error al obtener planes:', error);
            throw new Error('Error interno del servidor al obtener planes');
        }
    }

    /**
     * Obtener un plan por ID
     * @param {number} idPlan - ID del plan
     * @returns {Promise<Object|null>} Plan encontrado o null
     */
    async getPlanById(idPlan) {
        try {
            const query = `
                SELECT 
                    id_plan,
                    nombre,
                    descripcion,
                    precio_mensual,
                    precio_anual,
                    max_sucursales,
                    max_usuarios,
                    max_productos,
                    max_transacciones_mes,
                    almacenamiento_gb,
                    incluye_pos,
                    incluye_inventario_basico,
                    incluye_inventario_avanzado,
                    incluye_promociones,
                    incluye_reservas,
                    incluye_arqueo_caja,
                    incluye_egresos,
                    incluye_egresos_avanzados,
                    incluye_reportes_avanzados,
                    incluye_analytics,
                    incluye_delivery,
                    incluye_impresion,
                    incluye_soporte_24h,
                    incluye_api,
                    incluye_white_label,
                    orden_display,
                    activo,
                    created_at,
                    updated_at
                FROM planes 
                WHERE id_plan = $1
            `;
            
            const result = await this.pool.query(query, [idPlan]);
            return result.rows[0] || null;
        } catch (error) {
            console.error('Error al obtener plan por ID:', error);
            throw new Error('Error interno del servidor al obtener plan');
        }
    }

    /**
     * Obtener un plan por nombre
     * @param {string} nombre - Nombre del plan
     * @returns {Promise<Object|null>} Plan encontrado o null
     */
    async getPlanByName(nombre) {
        try {
            const query = `
                SELECT 
                    id_plan,
                    nombre,
                    descripcion,
                    precio_mensual,
                    precio_anual,
                    max_sucursales,
                    max_usuarios,
                    max_productos,
                    max_transacciones_mes,
                    almacenamiento_gb,
                    incluye_pos,
                    incluye_inventario_basico,
                    incluye_inventario_avanzado,
                    incluye_promociones,
                    incluye_reservas,
                    incluye_arqueo_caja,
                    incluye_egresos,
                    incluye_egresos_avanzados,
                    incluye_reportes_avanzados,
                    incluye_analytics,
                    incluye_delivery,
                    incluye_impresion,
                    incluye_soporte_24h,
                    incluye_api,
                    incluye_white_label,
                    orden_display,
                    activo,
                    created_at,
                    updated_at
                FROM planes 
                WHERE nombre = $1 AND activo = true
            `;
            
            const result = await this.pool.query(query, [nombre]);
            return result.rows[0] || null;
        } catch (error) {
            console.error('Error al obtener plan por nombre:', error);
            throw new Error('Error interno del servidor al obtener plan');
        }
    }

    /**
     * Obtener planes con descuento anual
     * @returns {Promise<Array>} Lista de planes con descuento
     */
    async getPlansWithAnnualDiscount() {
        try {
            const query = `
                SELECT 
                    id_plan,
                    nombre,
                    descripcion,
                    precio_mensual,
                    precio_anual,
                    ROUND(((precio_mensual * 12) - precio_anual) / (precio_mensual * 12) * 100, 2) as descuento_porcentaje,
                    (precio_mensual * 12) - precio_anual as ahorro_anual,
                    max_sucursales,
                    max_usuarios,
                    max_productos,
                    max_transacciones_mes,
                    almacenamiento_gb
                FROM planes 
                WHERE activo = true 
                AND precio_anual IS NOT NULL 
                AND precio_anual < (precio_mensual * 12)
                ORDER BY descuento_porcentaje DESC
            `;
            
            const result = await this.pool.query(query);
            return result.rows;
        } catch (error) {
            console.error('Error al obtener planes con descuento:', error);
            throw new Error('Error interno del servidor al obtener planes con descuento');
        }
    }

    // =====================================================
    // MÉTODOS DE VALIDACIÓN
    // =====================================================

    /**
     * Validar si un plan existe y está activo
     * @param {number} idPlan - ID del plan
     * @returns {Promise<boolean>} True si el plan es válido
     */
    async validatePlan(idPlan) {
        try {
            const query = `
                SELECT 1 FROM planes 
                WHERE id_plan = $1 AND activo = true
            `;
            
            const result = await this.pool.query(query, [idPlan]);
            return result.rows.length > 0;
        } catch (error) {
            console.error('Error al validar plan:', error);
            return false;
        }
    }

    /**
     * Verificar si una funcionalidad está disponible en un plan
     * @param {number} idPlan - ID del plan
     * @param {string} funcionalidad - Nombre de la funcionalidad
     * @returns {Promise<boolean>} True si la funcionalidad está disponible
     */
    async checkFeatureAvailability(idPlan, funcionalidad) {
        try {
            const query = `
                SELECT ${funcionalidad} as disponible
                FROM planes 
                WHERE id_plan = $1 AND activo = true
            `;
            
            const result = await this.pool.query(query, [idPlan]);
            return result.rows[0]?.disponible || false;
        } catch (error) {
            console.error('Error al verificar funcionalidad:', error);
            return false;
        }
    }

    /**
     * Obtener límites de un plan
     * @param {number} idPlan - ID del plan
     * @returns {Promise<Object|null>} Límites del plan
     */
    async getPlanLimits(idPlan) {
        try {
            const query = `
                SELECT 
                    max_sucursales,
                    max_usuarios,
                    max_productos,
                    max_transacciones_mes,
                    almacenamiento_gb
                FROM planes 
                WHERE id_plan = $1 AND activo = true
            `;
            
            const result = await this.pool.query(query, [idPlan]);
            return result.rows[0] || null;
        } catch (error) {
            console.error('Error al obtener límites del plan:', error);
            throw new Error('Error interno del servidor al obtener límites');
        }
    }

    // =====================================================
    // MÉTODOS DE COMPARACIÓN
    // =====================================================

    /**
     * Comparar dos planes
     * @param {number} idPlan1 - ID del primer plan
     * @param {number} idPlan2 - ID del segundo plan
     * @returns {Promise<Object>} Comparación de planes
     */
    async comparePlans(idPlan1, idPlan2) {
        try {
            const query = `
                SELECT 
                    id_plan,
                    nombre,
                    precio_mensual,
                    precio_anual,
                    max_sucursales,
                    max_usuarios,
                    max_productos,
                    max_transacciones_mes,
                    almacenamiento_gb,
                    incluye_pos,
                    incluye_inventario_basico,
                    incluye_inventario_avanzado,
                    incluye_promociones,
                    incluye_reservas,
                    incluye_arqueo_caja,
                    incluye_egresos,
                    incluye_egresos_avanzados,
                    incluye_reportes_avanzados,
                    incluye_analytics,
                    incluye_delivery,
                    incluye_impresion,
                    incluye_soporte_24h,
                    incluye_api,
                    incluye_white_label
                FROM planes 
                WHERE id_plan IN ($1, $2) AND activo = true
                ORDER BY id_plan
            `;
            
            const result = await this.pool.query(query, [idPlan1, idPlan2]);
            
            if (result.rows.length !== 2) {
                throw new Error('No se encontraron ambos planes para comparar');
            }
            
            const [plan1, plan2] = result.rows;
            
            return {
                plan1,
                plan2,
                comparacion: {
                    diferencia_precio_mensual: plan2.precio_mensual - plan1.precio_mensual,
                    diferencia_precio_anual: plan2.precio_anual - plan1.precio_anual,
                    diferencia_sucursales: plan2.max_sucursales - plan1.max_sucursales,
                    diferencia_usuarios: plan2.max_usuarios - plan1.max_usuarios,
                    diferencia_productos: plan2.max_productos - plan1.max_productos,
                    diferencia_transacciones: plan2.max_transacciones_mes - plan1.max_transacciones_mes,
                    diferencia_almacenamiento: plan2.almacenamiento_gb - plan1.almacenamiento_gb
                }
            };
        } catch (error) {
            console.error('Error al comparar planes:', error);
            throw new Error('Error interno del servidor al comparar planes');
        }
    }

    // =====================================================
    // MÉTODOS DE ESTADÍSTICAS
    // =====================================================

    /**
     * Obtener estadísticas de uso de planes
     * @returns {Promise<Array>} Estadísticas por plan
     */
    async getPlanUsageStats() {
        try {
            const query = `
                SELECT 
                    p.id_plan,
                    p.nombre,
                    p.precio_mensual,
                    COUNT(sa.id_suscripcion) as total_suscripciones,
                    COUNT(CASE WHEN sa.estado = 'activa' THEN 1 END) as suscripciones,
                    COUNT(CASE WHEN sa.estado = 'suspendida' THEN 1 END) as suscripciones_suspendidas,
                    COUNT(CASE WHEN sa.estado = 'cancelada' THEN 1 END) as suscripciones_canceladas,
                    AVG(CASE WHEN sa.estado = 'activa' THEN 
                        EXTRACT(DAYS FROM (sa.fecha_fin - sa.fecha_inicio)) 
                    END) as duracion_promedio_dias
                FROM planes p
                LEFT JOIN suscripciones sa ON p.id_plan = sa.id_plan
                WHERE p.activo = true
                GROUP BY p.id_plan, p.nombre, p.precio_mensual
                ORDER BY total_suscripciones DESC
            `;
            
            const result = await this.pool.query(query);
            return result.rows;
        } catch (error) {
            console.error('Error al obtener estadísticas de planes:', error);
            throw new Error('Error interno del servidor al obtener estadísticas');
        }
    }

    /**
     * Obtener el plan más popular
     * @returns {Promise<Object|null>} Plan más popular
     */
    async getMostPopularPlan() {
        try {
            const query = `
                SELECT 
                    p.id_plan,
                    p.nombre,
                    p.precio_mensual,
                    COUNT(sa.id_suscripcion) as total_suscripciones
                FROM planes p
                LEFT JOIN suscripciones sa ON p.id_plan = sa.id_plan
                WHERE p.activo = true
                GROUP BY p.id_plan, p.nombre, p.precio_mensual
                ORDER BY total_suscripciones DESC
                LIMIT 1
            `;
            
            const result = await this.pool.query(query);
            return result.rows[0] || null;
        } catch (error) {
            console.error('Error al obtener plan más popular:', error);
            throw new Error('Error interno del servidor al obtener plan más popular');
        }
    }

    // =====================================================
    // MÉTODOS DE ADMINISTRACIÓN
    // =====================================================

    /**
     * Crear un nuevo plan
     * @param {Object} planData - Datos del plan
     * @returns {Promise<Object>} Plan creado
     */
    async createPlan(planData) {
        try {
            const {
                nombre, descripcion, precio_mensual, precio_anual,
                max_sucursales, max_usuarios, max_productos, max_transacciones_mes, almacenamiento_gb,
                incluye_pos, incluye_inventario_basico, incluye_inventario_avanzado,
                incluye_promociones, incluye_reservas, incluye_arqueo_caja,
                incluye_egresos, incluye_egresos_avanzados, incluye_reportes_avanzados,
                incluye_analytics, incluye_delivery, incluye_impresion, incluye_soporte_24h,
                incluye_api, incluye_white_label, orden_display
            } = planData;

            const query = `
                INSERT INTO planes (
                    nombre, descripcion, precio_mensual, precio_anual,
                    max_sucursales, max_usuarios, max_productos, max_transacciones_mes, almacenamiento_gb,
                    incluye_pos, incluye_inventario_basico, incluye_inventario_avanzado,
                    incluye_promociones, incluye_reservas, incluye_arqueo_caja,
                    incluye_egresos, incluye_egresos_avanzados, incluye_reportes_avanzados,
                    incluye_analytics, incluye_delivery, incluye_impresion, incluye_soporte_24h,
                    incluye_api, incluye_white_label, orden_display
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25
                ) RETURNING *
            `;

            const values = [
                nombre, descripcion, precio_mensual, precio_anual,
                max_sucursales, max_usuarios, max_productos, max_transacciones_mes, almacenamiento_gb,
                incluye_pos, incluye_inventario_basico, incluye_inventario_avanzado,
                incluye_promociones, incluye_reservas, incluye_arqueo_caja,
                incluye_egresos, incluye_egresos_avanzados, incluye_reportes_avanzados,
                incluye_analytics, incluye_delivery, incluye_impresion, incluye_soporte_24h,
                incluye_api, incluye_white_label, orden_display
            ];

            const result = await this.pool.query(query, values);
            return result.rows[0];
        } catch (error) {
            console.error('Error al crear plan:', error);
            if (error.code === '23505') { // Unique violation
                throw new Error('Ya existe un plan con ese nombre');
            }
            throw new Error('Error interno del servidor al crear plan');
        }
    }

    /**
     * Actualizar un plan
     * @param {number} idPlan - ID del plan
     * @param {Object} planData - Datos a actualizar
     * @returns {Promise<Object>} Plan actualizado
     */
    async updatePlan(idPlan, planData) {
        try {
            const fields = [];
            const values = [];
            let paramCount = 1;

            // Construir query dinámicamente
            Object.keys(planData).forEach(key => {
                if (planData[key] !== undefined) {
                    fields.push(`${key} = $${paramCount}`);
                    values.push(planData[key]);
                    paramCount++;
                }
            });

            if (fields.length === 0) {
                throw new Error('No hay campos para actualizar');
            }

            values.push(idPlan);
            const query = `
                UPDATE planes 
                SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
                WHERE id_plan = $${paramCount}
                RETURNING *
            `;

            const result = await this.pool.query(query, values);
            
            if (result.rows.length === 0) {
                throw new Error('Plan no encontrado');
            }

            return result.rows[0];
        } catch (error) {
            console.error('Error al actualizar plan:', error);
            if (error.message === 'Plan no encontrado') {
                throw error;
            }
            throw new Error('Error interno del servidor al actualizar plan');
        }
    }

    /**
     * Desactivar un plan
     * @param {number} idPlan - ID del plan
     * @returns {Promise<boolean>} True si se desactivó correctamente
     */
    async deactivatePlan(idPlan) {
        try {
            const query = `
                UPDATE planes 
                SET activo = false, updated_at = CURRENT_TIMESTAMP
                WHERE id_plan = $1
                RETURNING id_plan
            `;

            const result = await this.pool.query(query, [idPlan]);
            return result.rows.length > 0;
        } catch (error) {
            console.error('Error al desactivar plan:', error);
            throw new Error('Error interno del servidor al desactivar plan');
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

module.exports = PlanModel;
