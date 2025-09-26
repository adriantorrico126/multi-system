const { pool } = require('../config/database');
const logger = require('../config/logger');
const { getPlanInfo } = require('../middlewares/planMiddleware');

/**
 * Obtener información del plan actual del restaurante
 */
exports.getCurrentPlan = async (req, res, next) => {
  try {
    const restaurantId = req.user?.id_restaurante;

    if (!restaurantId) {
      return res.status(400).json({
        error: 'Restaurante no encontrado',
        message: 'No se pudo identificar el restaurante del usuario'
      });
    }

    logger.info(`Obteniendo plan actual para restaurante ${restaurantId}`);

    // Usar la función del middleware para obtener información completa del plan
    const planInfo = await getPlanInfo(restaurantId);

    if (!planInfo) {
      logger.warn(`No se encontró plan activo para restaurante ${restaurantId}`);
      return res.status(404).json({
        error: 'Plan no encontrado',
        message: 'No se encontró un plan activo para este restaurante',
        code: 'NO_ACTIVE_PLAN'
      });
    }

    logger.info(`Plan encontrado para restaurante ${restaurantId}: ${planInfo.plan.nombre}`);

    res.status(200).json({
      message: 'Plan obtenido exitosamente',
      data: planInfo
    });

  } catch (error) {
    logger.error('Error obteniendo plan actual:', error);
    next(error);
  }
};

/**
 * Obtener estadísticas de uso del plan
 */
exports.getUsageStats = async (req, res, next) => {
  try {
    const restaurantId = req.user?.id_restaurante;

    if (!restaurantId) {
      return res.status(400).json({
        error: 'Restaurante no encontrado',
        message: 'No se pudo identificar el restaurante del usuario'
      });
    }

    logger.info(`Obteniendo estadísticas de uso para restaurante ${restaurantId}`);

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
    
    const usage = usageRows.length > 0 ? usageRows[0] : {
      productos_actuales: 0,
      usuarios_actuales: 0,
      sucursales_actuales: 0,
      transacciones_mes_actual: 0,
      almacenamiento_usado_mb: 0
    };

    res.status(200).json({
      message: 'Estadísticas de uso obtenidas exitosamente',
      data: {
        productos: usage.productos_actuales,
        usuarios: usage.usuarios_actuales,
        sucursales: usage.sucursales_actuales,
        transacciones: usage.transacciones_mes_actual,
        almacenamiento: usage.almacenamiento_usado_mb
      }
    });

  } catch (error) {
    logger.error('Error obteniendo estadísticas de uso:', error);
    next(error);
  }
};

/**
 * Obtener todos los planes disponibles
 */
exports.getAllPlans = async (req, res, next) => {
  try {
    logger.info('Obteniendo todos los planes disponibles');

    const plansQuery = `
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
        funcionalidades,
        activo
      FROM planes
      WHERE activo = true
      ORDER BY precio_mensual ASC
    `;

    const { rows: plans } = await pool.query(plansQuery);

    res.status(200).json({
      message: 'Planes obtenidos exitosamente',
      data: plans
    });

  } catch (error) {
    logger.error('Error obteniendo planes:', error);
    next(error);
  }
};