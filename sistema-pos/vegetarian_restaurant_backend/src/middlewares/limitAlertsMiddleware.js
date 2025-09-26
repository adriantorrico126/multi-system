const { pool } = require('../config/database');
const logger = require('../config/logger');

/**
 * Sistema de alertas de límites de planes
 */

/**
 * Crear una alerta de límite
 */
const createLimitAlert = async (restaurantId, alertType, resourceType, currentUsage, limit, severity = 'warning') => {
  try {
    const alertQuery = `
      INSERT INTO alertas_limites (
        id_restaurante,
        tipo_alerta,
        recurso_afectado,
        uso_actual,
        limite_maximo,
        severidad,
        mensaje,
        estado,
        created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'pendiente', NOW())
      ON CONFLICT (id_restaurante, tipo_alerta, recurso_afectado, estado)
      DO UPDATE SET
        uso_actual = $4,
        limite_maximo = $5,
        severidad = $6,
        mensaje = $7,
        updated_at = NOW()
    `;

    const message = generateAlertMessage(alertType, resourceType, currentUsage, limit, severity);

    await pool.query(alertQuery, [
      restaurantId,
      alertType,
      resourceType,
      currentUsage,
      limit,
      severity,
      message
    ]);

    logger.warn(`Alerta de límite creada para restaurante ${restaurantId}: ${message}`);

  } catch (error) {
    logger.error('Error creando alerta de límite:', error);
    throw error;
  }
};

/**
 * Generar mensaje de alerta
 */
const generateAlertMessage = (alertType, resourceType, currentUsage, limit, severity) => {
  const resourceNames = {
    'productos': 'productos',
    'usuarios': 'usuarios',
    'sucursales': 'sucursales',
    'transacciones': 'transacciones mensuales',
    'almacenamiento': 'almacenamiento'
  };

  const resourceName = resourceNames[resourceType] || resourceType;
  const percentage = Math.round((currentUsage / limit) * 100);

  switch (alertType) {
    case 'limit_warning':
      return `Has alcanzado el ${percentage}% del límite de ${resourceName} (${currentUsage}/${limit}). Considera actualizar tu plan.`;
    
    case 'limit_exceeded':
      return `Has excedido el límite de ${resourceName} (${currentUsage}/${limit}). Actualiza tu plan para continuar usando esta funcionalidad.`;
    
    case 'limit_critical':
      return `Límite crítico de ${resourceName} alcanzado (${currentUsage}/${limit}). Actualización de plan requerida.`;
    
    default:
      return `Alerta de límite para ${resourceName}: ${currentUsage}/${limit}`;
  }
};

/**
 * Verificar límites y crear alertas
 */
const checkLimitsAndCreateAlerts = async (restaurantId) => {
  try {
    // Obtener información del plan y uso actual
    const planQuery = `
      SELECT 
        p.max_sucursales,
        p.max_usuarios,
        p.max_productos,
        p.max_transacciones_mes,
        p.almacenamiento_gb,
        p.nombre as plan_nombre
      FROM planes p
      JOIN suscripciones s ON p.id_plan = s.id_plan
      WHERE s.id_restaurante = $1
      AND s.estado = 'activa'
      ORDER BY s.created_at DESC
      LIMIT 1
    `;

    const { rows: planRows } = await pool.query(planQuery, [restaurantId]);

    if (planRows.length === 0) {
      logger.warn(`No se encontró plan activo para restaurante ${restaurantId}`);
      return;
    }

    const plan = planRows[0];

    // Obtener uso actual
    const usageQuery = `
      SELECT 
        productos_actuales,
        usuarios_actuales,
        sucursales_actuales,
        transacciones_mes_actual,
        almacenamiento_usado_mb
      FROM uso_recursos
      WHERE id_restaurante = $1
      AND mes_medicion = EXTRACT(MONTH FROM CURRENT_DATE)
      AND año_medicion = EXTRACT(YEAR FROM CURRENT_DATE)
    `;

    const { rows: usageRows } = await pool.query(usageQuery, [restaurantId]);

    let usage = {
      productos: 0,
      usuarios: 0,
      sucursales: 0,
      transacciones: 0,
      almacenamiento: 0
    };

    if (usageRows.length > 0) {
      const usageData = usageRows[0];
      usage = {
        productos: usageData.productos_actuales,
        usuarios: usageData.usuarios_actuales,
        sucursales: usageData.sucursales_actuales,
        transacciones: usageData.transacciones_mes_actual,
        almacenamiento: usageData.almacenamiento_usado_mb
      };
    }

    // Verificar cada límite
    const limits = {
      productos: plan.max_productos,
      usuarios: plan.max_usuarios,
      sucursales: plan.max_sucursales,
      transacciones: plan.max_transacciones_mes,
      almacenamiento: plan.almacenamiento_gb * 1024 // Convertir GB a MB
    };

    for (const [resourceType, limit] of Object.entries(limits)) {
      if (limit > 0) { // Solo verificar límites finitos
        const currentUsage = usage[resourceType];
        const percentage = (currentUsage / limit) * 100;

        // Crear alertas según el porcentaje de uso
        if (percentage >= 100) {
          // Límite excedido
          await createLimitAlert(
            restaurantId,
            'limit_exceeded',
            resourceType,
            currentUsage,
            limit,
            'critical'
          );
        } else if (percentage >= 90) {
          // Límite crítico
          await createLimitAlert(
            restaurantId,
            'limit_critical',
            resourceType,
            currentUsage,
            limit,
            'critical'
          );
        } else if (percentage >= 75) {
          // Advertencia
          await createLimitAlert(
            restaurantId,
            'limit_warning',
            resourceType,
            currentUsage,
            limit,
            'warning'
          );
        }
      }
    }

  } catch (error) {
    logger.error('Error verificando límites y creando alertas:', error);
    throw error;
  }
};

/**
 * Obtener alertas activas de un restaurante
 */
const getActiveAlerts = async (restaurantId) => {
  try {
    const alertsQuery = `
      SELECT 
        id_alerta,
        tipo_alerta,
        recurso_afectado,
        uso_actual,
        limite_maximo,
        severidad,
        mensaje,
        estado,
        created_at,
        updated_at
      FROM alertas_limites
      WHERE id_restaurante = $1
      AND estado = 'pendiente'
      ORDER BY created_at DESC
    `;

    const { rows } = await pool.query(alertsQuery, [restaurantId]);

    return rows.map(alert => ({
      id: alert.id_alerta,
      tipo: alert.tipo_alerta,
      recurso: alert.recurso_afectado,
      uso_actual: alert.uso_actual,
      limite_maximo: alert.limite_maximo,
      severidad: alert.severidad,
      mensaje: alert.mensaje,
      estado: alert.estado,
      creado: alert.created_at,
      actualizado: alert.updated_at
    }));

  } catch (error) {
    logger.error('Error obteniendo alertas activas:', error);
    throw error;
  }
};

/**
 * Marcar alerta como resuelta
 */
const resolveAlert = async (alertId, restaurantId) => {
  try {
    const resolveQuery = `
      UPDATE alertas_limites
      SET estado = 'resuelta',
          updated_at = NOW()
      WHERE id_alerta = $1
      AND id_restaurante = $2
      AND estado = 'pendiente'
    `;

    const result = await pool.query(resolveQuery, [alertId, restaurantId]);

    if (result.rowCount > 0) {
      logger.info(`Alerta ${alertId} marcada como resuelta para restaurante ${restaurantId}`);
      return true;
    }

    return false;

  } catch (error) {
    logger.error('Error resolviendo alerta:', error);
    throw error;
  }
};

/**
 * Limpiar alertas antiguas (más de 30 días)
 */
const cleanOldAlerts = async () => {
  try {
    const cleanQuery = `
      DELETE FROM alertas_limites
      WHERE created_at < NOW() - INTERVAL '30 days'
      AND estado = 'resuelta'
    `;

    const result = await pool.query(cleanQuery);
    logger.info(`${result.rowCount} alertas antiguas eliminadas`);

  } catch (error) {
    logger.error('Error limpiando alertas antiguas:', error);
    throw error;
  }
};

/**
 * Middleware para verificar límites y crear alertas automáticamente
 */
const limitAlertMiddleware = () => {
  return async (req, res, next) => {
    try {
      const restaurantId = req.user?.id_restaurante;
      
      if (!restaurantId) {
        return next();
      }

      // Verificar límites después de operación exitosa
      const originalSend = res.send;
      res.send = function(data) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          checkLimitsAndCreateAlerts(restaurantId)
            .catch(error => {
              logger.error('Error verificando límites:', error);
            });
        }
        originalSend.call(this, data);
      };

      next();
    } catch (error) {
      logger.error('Error en middleware de alertas de límites:', error);
      next();
    }
  };
};

module.exports = {
  createLimitAlert,
  checkLimitsAndCreateAlerts,
  getActiveAlerts,
  resolveAlert,
  cleanOldAlerts,
  limitAlertMiddleware,
  generateAlertMessage
};
