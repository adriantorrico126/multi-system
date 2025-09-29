const { Pool } = require('pg');
const envConfig = require('../config/envConfig');

class ContadorUsoModel {
    constructor() {
        this.pool = new Pool({
            user: envConfig.DB_USER,
            host: envConfig.DB_HOST,
            database: envConfig.DB_NAME,
            password: envConfig.DB_PASSWORD,
            port: envConfig.DB_PORT,
            ssl: false,
            connectionTimeoutMillis: 2000
        });
    }

    // =====================================================
    // MÉTODOS DE CONSULTA DE CONTADORES
    // =====================================================

    /**
     * Obtener contador actual de un restaurante
     * @param {number} idRestaurante - ID del restaurante
     * @returns {Promise<Object|null>} Contador actual o null
     */
    async getCurrentUsage(idRestaurante) {
        try {
            console.log('🔍 [ContadorUsoModel] getCurrentUsage llamado para restaurante:', idRestaurante);
            
            // Obtener todos los contadores del restaurante
            const query = `
                SELECT 
                    cu.id_contador,
                    cu.id_restaurante,
                    cu.id_plan,
                    cu.recurso,
                    cu.uso_actual,
                    cu.limite_plan,
                    cu.fecha_medicion,
                    cu.created_at,
                    cu.updated_at,
                    p.nombre as nombre_plan,
                    -- Calcular porcentaje de uso
                    ROUND((cu.uso_actual::DECIMAL / NULLIF(cu.limite_plan, 0)) * 100, 2) as porcentaje_uso
                FROM contadores_uso cu
                JOIN planes p ON cu.id_plan = p.id_plan
                WHERE cu.id_restaurante = $1
                ORDER BY cu.recurso
            `;
            
            console.log('🔄 [ContadorUsoModel] Ejecutando query...');
            const result = await this.pool.query(query, [idRestaurante]);
            console.log('📊 [ContadorUsoModel] Filas encontradas:', result.rows.length);
            
            if (result.rows.length > 0) {
                console.log('✅ [ContadorUsoModel] Procesando datos...');
                // Agrupar por recurso para crear un objeto consolidado
                const contadores = {};
                result.rows.forEach(row => {
                    contadores[row.recurso] = {
                        uso_actual: row.uso_actual,
                        limite_plan: row.limite_plan,
                        porcentaje_uso: row.porcentaje_uso
                    };
                });
                
                const resultado = {
                    id_restaurante: idRestaurante,
                    id_plan: result.rows[0].id_plan,
                    nombre_plan: result.rows[0].nombre_plan,
                    contadores: contadores,
                    fecha_medicion: result.rows[0].fecha_medicion,
                    created_at: result.rows[0].created_at,
                    updated_at: result.rows[0].updated_at
                };
                
                console.log('✅ [ContadorUsoModel] Resultado preparado');
                return resultado;
            }
            
            console.log('❌ [ContadorUsoModel] No se encontraron datos');
            return null;
            
        } catch (error) {
            console.error('❌ [ContadorUsoModel] Error al obtener contador actual:', error);
            throw new Error('Error interno del servidor al obtener contador de uso');
        }
    }

    /**
     * Obtener todos los contadores actuales de un restaurante
     * @param {number} idRestaurante - ID del restaurante
     * @returns {Promise<Array>} Array de contadores actuales
     */
    async getAllCurrentUsage(idRestaurante) {
        try {
            const query = `
                SELECT 
                    cu.id_contador,
                    cu.id_restaurante,
                    cu.id_plan,
                    cu.recurso,
                    cu.uso_actual,
                    cu.limite_plan,
                    cu.fecha_medicion,
                    cu.created_at,
                    cu.updated_at,
                    p.nombre as nombre_plan,
                    -- Calcular porcentaje de uso
                    ROUND((cu.uso_actual::DECIMAL / NULLIF(cu.limite_plan, 0)) * 100, 2) as porcentaje_uso
                FROM contadores_uso cu
                JOIN planes p ON cu.id_plan = p.id_plan
                WHERE cu.id_restaurante = $1
                ORDER BY cu.recurso
            `;
            
            const result = await this.pool.query(query, [idRestaurante]);
            return result.rows;
        } catch (error) {
            console.error('Error al obtener contadores actuales:', error);
            throw new Error('Error interno del servidor al obtener contadores de uso');
        }
    }

    /**
     * Obtener historial de uso de un restaurante
     * @param {number} idRestaurante - ID del restaurante
     * @param {number} meses - Número de meses a consultar
     * @returns {Promise<Array>} Historial de uso
     */
    async getUsageHistory(idRestaurante, meses = 12) {
        try {
            const query = `
                SELECT 
                    cu.id_contador,
                    cu.id_restaurante,
                    cu.id_plan,
                    cu.sucursales_actuales,
                    cu.usuarios_actuales,
                    cu.productos_actuales,
                    cu.transacciones_mes_actual,
                    cu.almacenamiento_usado_mb,
                    cu.mes_medicion,
                    cu.año_medicion,
                    cu.ultima_actualizacion,
                    cu.created_at,
                    cu.updated_at,
                    p.nombre as nombre_plan,
                    p.max_sucursales,
                    p.max_usuarios,
                    p.max_productos,
                    p.max_transacciones_mes,
                    p.almacenamiento_gb,
                    -- Calcular porcentajes de uso
                    ROUND((cu.sucursales_actuales::DECIMAL / NULLIF(p.max_sucursales, 0)) * 100, 2) as porcentaje_sucursales,
                    ROUND((cu.usuarios_actuales::DECIMAL / NULLIF(p.max_usuarios, 0)) * 100, 2) as porcentaje_usuarios,
                    ROUND((cu.productos_actuales::DECIMAL / NULLIF(p.max_productos, 0)) * 100, 2) as porcentaje_productos,
                    ROUND((cu.transacciones_mes_actual::DECIMAL / NULLIF(p.max_transacciones_mes, 0)) * 100, 2) as porcentaje_transacciones,
                    ROUND((cu.almacenamiento_usado_mb::DECIMAL / NULLIF(p.almacenamiento_gb * 1024, 0)) * 100, 2) as porcentaje_almacenamiento
                FROM contadores_uso cu
                JOIN planes p ON cu.id_plan = p.id_plan
                WHERE cu.id_restaurante = $1
                AND (cu.año_medicion * 12 + cu.mes_medicion) >= 
                    (EXTRACT(YEAR FROM CURRENT_DATE) * 12 + EXTRACT(MONTH FROM CURRENT_DATE) - $2)
                ORDER BY cu.año_medicion DESC, cu.mes_medicion DESC
            `;
            
            const result = await this.pool.query(query, [idRestaurante, meses]);
            return result.rows;
        } catch (error) {
            console.error('Error al obtener historial de uso:', error);
            throw new Error('Error interno del servidor al obtener historial de uso');
        }
    }

    /**
     * Obtener contadores por plan
     * @param {number} idPlan - ID del plan
     * @returns {Promise<Array>} Lista de contadores
     */
    async getCountersByPlan(idPlan) {
        try {
            const query = `
                SELECT 
                    cu.id_contador,
                    cu.id_restaurante,
                    cu.id_plan,
                    cu.sucursales_actuales,
                    cu.usuarios_actuales,
                    cu.productos_actuales,
                    cu.transacciones_mes_actual,
                    cu.almacenamiento_usado_mb,
                    cu.mes_medicion,
                    cu.año_medicion,
                    cu.ultima_actualizacion,
                    cu.created_at,
                    cu.updated_at,
                    p.nombre as nombre_plan,
                    r.nombre as nombre_restaurante
                FROM contadores_uso cu
                JOIN planes p ON cu.id_plan = p.id_plan
                JOIN restaurantes r ON cu.id_restaurante = r.id_restaurante
                WHERE cu.id_plan = $1
                AND cu.mes_medicion = EXTRACT(MONTH FROM CURRENT_DATE)
                AND cu.año_medicion = EXTRACT(YEAR FROM CURRENT_DATE)
                ORDER BY cu.ultima_actualizacion DESC
            `;
            
            const result = await this.pool.query(query, [idPlan]);
            return result.rows;
        } catch (error) {
            console.error('Error al obtener contadores por plan:', error);
            throw new Error('Error interno del servidor al obtener contadores');
        }
    }

    /**
     * Obtener contadores con alertas
     * @returns {Promise<Array>} Lista de contadores con alertas
     */
    async getCountersWithAlerts() {
        try {
            const query = `
                SELECT 
                    cu.id_contador,
                    cu.id_restaurante,
                    cu.id_plan,
                    cu.sucursales_actuales,
                    cu.usuarios_actuales,
                    cu.productos_actuales,
                    cu.transacciones_mes_actual,
                    cu.almacenamiento_usado_mb,
                    cu.mes_medicion,
                    cu.año_medicion,
                    cu.ultima_actualizacion,
                    cu.created_at,
                    cu.updated_at,
                    p.nombre as nombre_plan,
                    r.nombre as nombre_restaurante,
                    p.max_sucursales,
                    p.max_usuarios,
                    p.max_productos,
                    p.max_transacciones_mes,
                    p.almacenamiento_gb,
                    -- Calcular porcentajes de uso
                    ROUND((cu.sucursales_actuales::DECIMAL / NULLIF(p.max_sucursales, 0)) * 100, 2) as porcentaje_sucursales,
                    ROUND((cu.usuarios_actuales::DECIMAL / NULLIF(p.max_usuarios, 0)) * 100, 2) as porcentaje_usuarios,
                    ROUND((cu.productos_actuales::DECIMAL / NULLIF(p.max_productos, 0)) * 100, 2) as porcentaje_productos,
                    ROUND((cu.transacciones_mes_actual::DECIMAL / NULLIF(p.max_transacciones_mes, 0)) * 100, 2) as porcentaje_transacciones,
                    ROUND((cu.almacenamiento_usado_mb::DECIMAL / NULLIF(p.almacenamiento_gb * 1024, 0)) * 100, 2) as porcentaje_almacenamiento
                FROM contadores_uso cu
                JOIN planes p ON cu.id_plan = p.id_plan
                JOIN restaurantes r ON cu.id_restaurante = r.id_restaurante
                WHERE cu.mes_medicion = EXTRACT(MONTH FROM CURRENT_DATE)
                AND cu.año_medicion = EXTRACT(YEAR FROM CURRENT_DATE)
                AND (
                    (cu.sucursales_actuales::DECIMAL / NULLIF(p.max_sucursales, 0)) >= 0.8 OR
                    (cu.usuarios_actuales::DECIMAL / NULLIF(p.max_usuarios, 0)) >= 0.8 OR
                    (cu.productos_actuales::DECIMAL / NULLIF(p.max_productos, 0)) >= 0.8 OR
                    (cu.transacciones_mes_actual::DECIMAL / NULLIF(p.max_transacciones_mes, 0)) >= 0.8 OR
                    (cu.almacenamiento_usado_mb::DECIMAL / NULLIF(p.almacenamiento_gb * 1024, 0)) >= 0.8
                )
                ORDER BY 
                    GREATEST(
                        COALESCE((cu.sucursales_actuales::DECIMAL / NULLIF(p.max_sucursales, 0)), 0),
                        COALESCE((cu.usuarios_actuales::DECIMAL / NULLIF(p.max_usuarios, 0)), 0),
                        COALESCE((cu.productos_actuales::DECIMAL / NULLIF(p.max_productos, 0)), 0),
                        COALESCE((cu.transacciones_mes_actual::DECIMAL / NULLIF(p.max_transacciones_mes, 0)), 0),
                        COALESCE((cu.almacenamiento_usado_mb::DECIMAL / NULLIF(p.almacenamiento_gb * 1024, 0)), 0)
                    ) DESC
            `;
            
            const result = await this.pool.query(query);
            return result.rows;
        } catch (error) {
            console.error('Error al obtener contadores con alertas:', error);
            throw new Error('Error interno del servidor al obtener contadores con alertas');
        }
    }

    // =====================================================
    // MÉTODOS DE ACTUALIZACIÓN DE CONTADORES
    // =====================================================

    /**
     * Actualizar contador de sucursales
     * @param {number} idRestaurante - ID del restaurante
     * @param {number} cantidad - Cantidad a actualizar
     * @returns {Promise<Object>} Contador actualizado
     */
    async updateSucursalesCount(idRestaurante, cantidad) {
        try {
            const query = `
                INSERT INTO contadores_uso (
                    id_restaurante, id_plan, sucursales_actuales, mes_medicion, año_medicion
                )
                SELECT 
                    $1, sa.id_plan, $2, EXTRACT(MONTH FROM CURRENT_DATE), EXTRACT(YEAR FROM CURRENT_DATE)
                FROM suscripciones sa
                WHERE sa.id_restaurante = $1 AND sa.estado = 'activa'
                ON CONFLICT (id_restaurante, mes_medicion, año_medicion)
                DO UPDATE SET
                    sucursales_actuales = $2,
                    ultima_actualizacion = CURRENT_TIMESTAMP
                RETURNING *
            `;
            
            const result = await this.pool.query(query, [idRestaurante, cantidad]);
            return result.rows[0];
        } catch (error) {
            console.error('Error al actualizar contador de sucursales:', error);
            throw new Error('Error interno del servidor al actualizar contador');
        }
    }

    /**
     * Actualizar contador de usuarios
     * @param {number} idRestaurante - ID del restaurante
     * @param {number} cantidad - Cantidad a actualizar
     * @returns {Promise<Object>} Contador actualizado
     */
    async updateUsuariosCount(idRestaurante, cantidad) {
        try {
            const query = `
                INSERT INTO contadores_uso (
                    id_restaurante, id_plan, usuarios_actuales, mes_medicion, año_medicion
                )
                SELECT 
                    $1, sa.id_plan, $2, EXTRACT(MONTH FROM CURRENT_DATE), EXTRACT(YEAR FROM CURRENT_DATE)
                FROM suscripciones sa
                WHERE sa.id_restaurante = $1 AND sa.estado = 'activa'
                ON CONFLICT (id_restaurante, mes_medicion, año_medicion)
                DO UPDATE SET
                    usuarios_actuales = $2,
                    ultima_actualizacion = CURRENT_TIMESTAMP
                RETURNING *
            `;
            
            const result = await this.pool.query(query, [idRestaurante, cantidad]);
            return result.rows[0];
        } catch (error) {
            console.error('Error al actualizar contador de usuarios:', error);
            throw new Error('Error interno del servidor al actualizar contador');
        }
    }

    /**
     * Actualizar contador de productos
     * @param {number} idRestaurante - ID del restaurante
     * @param {number} cantidad - Cantidad a actualizar
     * @returns {Promise<Object>} Contador actualizado
     */
    async updateProductosCount(idRestaurante, cantidad) {
        try {
            const query = `
                INSERT INTO contadores_uso (
                    id_restaurante, id_plan, productos_actuales, mes_medicion, año_medicion
                )
                SELECT 
                    $1, sa.id_plan, $2, EXTRACT(MONTH FROM CURRENT_DATE), EXTRACT(YEAR FROM CURRENT_DATE)
                FROM suscripciones sa
                WHERE sa.id_restaurante = $1 AND sa.estado = 'activa'
                ON CONFLICT (id_restaurante, mes_medicion, año_medicion)
                DO UPDATE SET
                    productos_actuales = $2,
                    ultima_actualizacion = CURRENT_TIMESTAMP
                RETURNING *
            `;
            
            const result = await this.pool.query(query, [idRestaurante, cantidad]);
            return result.rows[0];
        } catch (error) {
            console.error('Error al actualizar contador de productos:', error);
            throw new Error('Error interno del servidor al actualizar contador');
        }
    }

    /**
     * Actualizar contador de transacciones
     * @param {number} idRestaurante - ID del restaurante
     * @param {number} cantidad - Cantidad a actualizar
     * @returns {Promise<Object>} Contador actualizado
     */
    async updateTransaccionesCount(idRestaurante, cantidad) {
        try {
            const query = `
                INSERT INTO contadores_uso (
                    id_restaurante, id_plan, transacciones_mes_actual, mes_medicion, año_medicion
                )
                SELECT 
                    $1, sa.id_plan, $2, EXTRACT(MONTH FROM CURRENT_DATE), EXTRACT(YEAR FROM CURRENT_DATE)
                FROM suscripciones sa
                WHERE sa.id_restaurante = $1 AND sa.estado = 'activa'
                ON CONFLICT (id_restaurante, mes_medicion, año_medicion)
                DO UPDATE SET
                    transacciones_mes_actual = $2,
                    ultima_actualizacion = CURRENT_TIMESTAMP
                RETURNING *
            `;
            
            const result = await this.pool.query(query, [idRestaurante, cantidad]);
            return result.rows[0];
        } catch (error) {
            console.error('Error al actualizar contador de transacciones:', error);
            throw new Error('Error interno del servidor al actualizar contador');
        }
    }

    /**
     * Actualizar contador de almacenamiento
     * @param {number} idRestaurante - ID del restaurante
     * @param {number} cantidad - Cantidad en MB
     * @returns {Promise<Object>} Contador actualizado
     */
    async updateAlmacenamientoCount(idRestaurante, cantidad) {
        try {
            const query = `
                INSERT INTO contadores_uso (
                    id_restaurante, id_plan, almacenamiento_usado_mb, mes_medicion, año_medicion
                )
                SELECT 
                    $1, sa.id_plan, $2, EXTRACT(MONTH FROM CURRENT_DATE), EXTRACT(YEAR FROM CURRENT_DATE)
                FROM suscripciones sa
                WHERE sa.id_restaurante = $1 AND sa.estado = 'activa'
                ON CONFLICT (id_restaurante, mes_medicion, año_medicion)
                DO UPDATE SET
                    almacenamiento_usado_mb = $2,
                    ultima_actualizacion = CURRENT_TIMESTAMP
                RETURNING *
            `;
            
            const result = await this.pool.query(query, [idRestaurante, cantidad]);
            return result.rows[0];
        } catch (error) {
            console.error('Error al actualizar contador de almacenamiento:', error);
            throw new Error('Error interno del servidor al actualizar contador');
        }
    }

    /**
     * Actualizar todos los contadores de un restaurante
     * @param {number} idRestaurante - ID del restaurante
     * @returns {Promise<Object>} Contador actualizado
     */
    async updateAllCounters(idRestaurante) {
        try {
            // Obtener el plan del restaurante
            const planQuery = `
                SELECT sa.id_plan, p.nombre as nombre_plan
                FROM suscripciones sa
                JOIN planes p ON sa.id_plan = p.id_plan
                WHERE sa.id_restaurante = $1 AND sa.estado = 'activa'
            `;
            
            const planResult = await this.pool.query(planQuery, [idRestaurante]);
            
            if (planResult.rows.length === 0) {
                throw new Error('No se encontró una suscripción activa para este restaurante');
            }
            
            const plan = planResult.rows[0];
            
            // Definir los recursos a actualizar
            const recursos = [
                {
                    recurso: 'sucursales',
                    query: 'SELECT COUNT(*) FROM sucursales WHERE id_restaurante = $1 AND activo = true'
                },
                {
                    recurso: 'usuarios',
                    query: 'SELECT COUNT(*) FROM vendedores WHERE id_restaurante = $1 AND activo = true'
                },
                {
                    recurso: 'productos',
                    query: 'SELECT COUNT(*) FROM productos WHERE id_restaurante = $1 AND activo = true'
                },
                {
                    recurso: 'transacciones',
                    query: `SELECT COUNT(*) FROM ventas 
                            WHERE id_restaurante = $1 
                            AND EXTRACT(MONTH FROM fecha) = EXTRACT(MONTH FROM CURRENT_DATE)
                            AND EXTRACT(YEAR FROM fecha) = EXTRACT(YEAR FROM CURRENT_DATE)
                            AND estado != 'cancelado'`
                },
                {
                    recurso: 'almacenamiento',
                    query: 'SELECT 0' // Por ahora 0, se puede implementar después
                }
            ];
            
            const resultados = [];
            
            // Actualizar cada recurso
            for (const recurso of recursos) {
                const countResult = await this.pool.query(recurso.query, [idRestaurante]);
                const usoActual = parseInt(countResult.rows[0].count);
                
                // Obtener el límite del plan para este recurso
                let limitePlan = 0;
                switch (recurso.recurso) {
                    case 'sucursales':
                        limitePlan = plan.max_sucursales || 0;
                        break;
                    case 'usuarios':
                        limitePlan = plan.max_usuarios || 0;
                        break;
                    case 'productos':
                        limitePlan = plan.max_productos || 0;
                        break;
                    case 'transacciones':
                        limitePlan = plan.max_transacciones_mes || 0;
                        break;
                    case 'almacenamiento':
                        limitePlan = (plan.almacenamiento_gb || 0) * 1024; // Convertir GB a MB
                        break;
                }
                
                // Insertar o actualizar el contador
                const insertQuery = `
                    INSERT INTO contadores_uso (
                        id_restaurante, id_plan, recurso, uso_actual, limite_plan, fecha_medicion
                    )
                    VALUES ($1, $2, $3, $4, $5, CURRENT_DATE)
                    ON CONFLICT (id_restaurante, recurso)
                    DO UPDATE SET
                        uso_actual = EXCLUDED.uso_actual,
                        limite_plan = EXCLUDED.limite_plan,
                        fecha_medicion = EXCLUDED.fecha_medicion,
                        updated_at = CURRENT_TIMESTAMP
                    RETURNING *
                `;
                
                const insertResult = await this.pool.query(insertQuery, [
                    idRestaurante, plan.id_plan, recurso.recurso, usoActual, limitePlan
                ]);
                
                resultados.push(insertResult.rows[0]);
            }
            
            return {
                id_restaurante: idRestaurante,
                id_plan: plan.id_plan,
                nombre_plan: plan.nombre_plan,
                contadores: resultados
            };
            
        } catch (error) {
            console.error('Error al actualizar todos los contadores:', error);
            throw new Error('Error interno del servidor al actualizar contadores');
        }
    }

    // =====================================================
    // MÉTODOS DE VALIDACIÓN
    // =====================================================

    /**
     * Verificar si un restaurante excede los límites
     * @param {number} idRestaurante - ID del restaurante
     * @returns {Promise<Object>} Estado de límites
     */
    async checkLimits(idRestaurante) {
        try {
            const query = `
                SELECT 
                    cu.sucursales_actuales,
                    cu.usuarios_actuales,
                    cu.productos_actuales,
                    cu.transacciones_mes_actual,
                    cu.almacenamiento_usado_mb,
                    p.max_sucursales,
                    p.max_usuarios,
                    p.max_productos,
                    p.max_transacciones_mes,
                    p.almacenamiento_gb,
                    -- Verificar excesos
                    (cu.sucursales_actuales > p.max_sucursales) as excede_sucursales,
                    (cu.usuarios_actuales > p.max_usuarios) as excede_usuarios,
                    (cu.productos_actuales > p.max_productos) as excede_productos,
                    (cu.transacciones_mes_actual > p.max_transacciones_mes) as excede_transacciones,
                    (cu.almacenamiento_usado_mb > (p.almacenamiento_gb * 1024)) as excede_almacenamiento
                FROM contadores_uso cu
                JOIN planes p ON cu.id_plan = p.id_plan
                WHERE cu.id_restaurante = $1
                AND cu.mes_medicion = EXTRACT(MONTH FROM CURRENT_DATE)
                AND cu.año_medicion = EXTRACT(YEAR FROM CURRENT_DATE)
            `;
            
            const result = await this.pool.query(query, [idRestaurante]);
            return result.rows[0] || null;
        } catch (error) {
            console.error('Error al verificar límites:', error);
            throw new Error('Error interno del servidor al verificar límites');
        }
    }

    /**
     * Verificar si se puede agregar un recurso
     * @param {number} idRestaurante - ID del restaurante
     * @param {string} tipoRecurso - Tipo de recurso
     * @param {number} cantidad - Cantidad a agregar
     * @returns {Promise<boolean>} True si se puede agregar
     */
    async canAddResource(idRestaurante, tipoRecurso, cantidad = 1) {
        try {
            const query = `
                SELECT 
                    CASE 
                        WHEN $2 = 'sucursales' THEN (cu.sucursales_actuales + $3) <= p.max_sucursales
                        WHEN $2 = 'usuarios' THEN (cu.usuarios_actuales + $3) <= p.max_usuarios
                        WHEN $2 = 'productos' THEN (cu.productos_actuales + $3) <= p.max_productos
                        WHEN $2 = 'transacciones' THEN (cu.transacciones_mes_actual + $3) <= p.max_transacciones_mes
                        WHEN $2 = 'almacenamiento' THEN (cu.almacenamiento_usado_mb + $3) <= (p.almacenamiento_gb * 1024)
                        ELSE false
                    END as puede_agregar
                FROM contadores_uso cu
                JOIN planes p ON cu.id_plan = p.id_plan
                WHERE cu.id_restaurante = $1
                AND cu.mes_medicion = EXTRACT(MONTH FROM CURRENT_DATE)
                AND cu.año_medicion = EXTRACT(YEAR FROM CURRENT_DATE)
            `;
            
            const result = await this.pool.query(query, [idRestaurante, tipoRecurso, cantidad]);
            return result.rows[0]?.puede_agregar || false;
        } catch (error) {
            console.error('Error al verificar si se puede agregar recurso:', error);
            return false;
        }
    }

    // =====================================================
    // MÉTODOS DE ESTADÍSTICAS
    // =====================================================

    /**
     * Obtener estadísticas de uso global
     * @returns {Promise<Object>} Estadísticas globales
     */
    async getGlobalUsageStats() {
        try {
            const query = `
                SELECT 
                    COUNT(*) as total_restaurantes,
                    SUM(sucursales_actuales) as total_sucursales,
                    SUM(usuarios_actuales) as total_usuarios,
                    SUM(productos_actuales) as total_productos,
                    SUM(transacciones_mes_actual) as total_transacciones,
                    SUM(almacenamiento_usado_mb) as total_almacenamiento_mb,
                    AVG(sucursales_actuales) as promedio_sucursales,
                    AVG(usuarios_actuales) as promedio_usuarios,
                    AVG(productos_actuales) as promedio_productos,
                    AVG(transacciones_mes_actual) as promedio_transacciones,
                    AVG(almacenamiento_usado_mb) as promedio_almacenamiento_mb
                FROM contadores_uso
                WHERE mes_medicion = EXTRACT(MONTH FROM CURRENT_DATE)
                AND año_medicion = EXTRACT(YEAR FROM CURRENT_DATE)
            `;
            
            const result = await this.pool.query(query);
            return result.rows[0];
        } catch (error) {
            console.error('Error al obtener estadísticas globales:', error);
            throw new Error('Error interno del servidor al obtener estadísticas');
        }
    }

    /**
     * Obtener estadísticas de uso por plan
     * @returns {Promise<Array>} Estadísticas por plan
     */
    async getUsageStatsByPlan() {
        try {
            const query = `
                SELECT 
                    p.id_plan,
                    p.nombre as nombre_plan,
                    p.precio_mensual,
                    COUNT(cu.id_contador) as total_restaurantes,
                    SUM(cu.sucursales_actuales) as total_sucursales,
                    SUM(cu.usuarios_actuales) as total_usuarios,
                    SUM(cu.productos_actuales) as total_productos,
                    SUM(cu.transacciones_mes_actual) as total_transacciones,
                    SUM(cu.almacenamiento_usado_mb) as total_almacenamiento_mb,
                    AVG(cu.sucursales_actuales) as promedio_sucursales,
                    AVG(cu.usuarios_actuales) as promedio_usuarios,
                    AVG(cu.productos_actuales) as promedio_productos,
                    AVG(cu.transacciones_mes_actual) as promedio_transacciones,
                    AVG(cu.almacenamiento_usado_mb) as promedio_almacenamiento_mb,
                    -- Calcular porcentaje de uso promedio
                    ROUND(AVG((cu.sucursales_actuales::DECIMAL / NULLIF(p.max_sucursales, 0)) * 100), 2) as porcentaje_uso_sucursales,
                    ROUND(AVG((cu.usuarios_actuales::DECIMAL / NULLIF(p.max_usuarios, 0)) * 100), 2) as porcentaje_uso_usuarios,
                    ROUND(AVG((cu.productos_actuales::DECIMAL / NULLIF(p.max_productos, 0)) * 100), 2) as porcentaje_uso_productos,
                    ROUND(AVG((cu.transacciones_mes_actual::DECIMAL / NULLIF(p.max_transacciones_mes, 0)) * 100), 2) as porcentaje_uso_transacciones,
                    ROUND(AVG((cu.almacenamiento_usado_mb::DECIMAL / NULLIF(p.almacenamiento_gb * 1024, 0)) * 100), 2) as porcentaje_uso_almacenamiento
                FROM contadores_uso cu
                JOIN planes p ON cu.id_plan = p.id_plan
                WHERE cu.mes_medicion = EXTRACT(MONTH FROM CURRENT_DATE)
                AND cu.año_medicion = EXTRACT(YEAR FROM CURRENT_DATE)
                GROUP BY p.id_plan, p.nombre, p.precio_mensual, p.max_sucursales, p.max_usuarios, p.max_productos, p.max_transacciones_mes, p.almacenamiento_gb
                ORDER BY total_restaurantes DESC
            `;
            
            const result = await this.pool.query(query);
            return result.rows;
        } catch (error) {
            console.error('Error al obtener estadísticas por plan:', error);
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

module.exports = ContadorUsoModel;
