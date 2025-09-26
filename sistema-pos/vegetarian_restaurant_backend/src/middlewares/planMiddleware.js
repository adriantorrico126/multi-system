const { pool } = require('../config/database');
const logger = require('../config/logger');

/**
 * Middleware para verificar permisos de plan
 * Verifica si el usuario tiene acceso a una funcionalidad específica según su plan
 */
const planMiddleware = (requiredFeature, requiredPlan = null) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id_vendedor;
      const restaurantId = req.user?.id_restaurante;

      if (!userId || !restaurantId) {
        logger.warn('Usuario o restaurante no encontrado en el token');
        return res.status(401).json({
          error: 'Token inválido',
          message: 'No se pudo identificar el usuario o restaurante'
        });
      }

      // Obtener plan actual del restaurante
      const planQuery = `
        SELECT 
          p.id_plan,
          p.nombre as plan_nombre,
          p.precio_mensual,
          p.max_sucursales,
          p.max_usuarios,
          p.max_productos,
          p.max_transacciones_mes,
          p.almacenamiento_gb,
          p.funcionalidades,
          s.estado as suscripcion_estado,
          s.fecha_fin
        FROM planes p
        JOIN suscripciones s ON p.id_plan = s.id_plan
        WHERE s.id_restaurante = $1
        AND s.estado = 'activa'
        AND (s.fecha_fin IS NULL OR s.fecha_fin >= CURRENT_DATE)
        ORDER BY s.created_at DESC
        LIMIT 1
      `;

      const { rows: planRows } = await pool.query(planQuery, [restaurantId]);

      if (planRows.length === 0) {
        logger.warn(`No se encontró plan activo para el restaurante ${restaurantId}`);
        return res.status(403).json({
          error: 'Plan no encontrado',
          message: 'No se encontró un plan activo para este restaurante',
          code: 'NO_ACTIVE_PLAN'
        });
      }

      const currentPlan = planRows[0];
      const planFeatures = currentPlan.funcionalidades;

      // Verificar si el plan está activo
      if (currentPlan.suscripcion_estado !== 'activa') {
        logger.warn(`Suscripción inactiva para restaurante ${restaurantId}: ${currentPlan.suscripcion_estado}`);
        return res.status(403).json({
          error: 'Suscripción inactiva',
          message: 'La suscripción de este restaurante no está activa',
          code: 'INACTIVE_SUBSCRIPTION',
          plan: currentPlan.plan_nombre
        });
      }

      // Verificar plan específico si se requiere
      if (requiredPlan && !hasPlanAccess(currentPlan.plan_nombre, requiredPlan)) {
        logger.warn(`Plan insuficiente para restaurante ${restaurantId}: ${currentPlan.plan_nombre} < ${requiredPlan}`);
        return res.status(403).json({
          error: 'Funcionalidad Premium No Disponible',
          message: `La funcionalidad "${requiredFeature || 'solicitada'}" está disponible únicamente en el plan ${requiredPlan} o superior. Tu plan actual (${currentPlan.plan_nombre}) no incluye esta característica.`,
          code: 'INSUFFICIENT_PLAN',
          currentPlan: currentPlan.plan_nombre,
          requiredPlan: requiredPlan,
          featureName: requiredFeature || 'Funcionalidad solicitada',
          contactInfo: {
            phone: '69512310',
            email: 'forkasbib@gmail.com',
            message: 'Para acceder a esta funcionalidad, contacta con nuestro equipo de soporte para actualizar tu plan.'
          },
          upgradeMessage: `¿Interesado en actualizar a ${requiredPlan}? Contacta con nosotros para conocer los beneficios y precios especiales.`
        });
      }

      // Verificar funcionalidad específica
      if (requiredFeature && !hasFeatureAccess(planFeatures, requiredFeature)) {
        logger.warn(`Funcionalidad no disponible para restaurante ${restaurantId}: ${requiredFeature}`);
        return res.status(403).json({
          error: 'Funcionalidad No Incluida en tu Plan',
          message: `La funcionalidad "${requiredFeature}" no está disponible en tu plan actual (${currentPlan.plan_nombre}). Esta característica requiere una suscripción de nivel superior.`,
          code: 'FEATURE_NOT_AVAILABLE',
          currentPlan: currentPlan.plan_nombre,
          requiredFeature: requiredFeature,
          featureName: requiredFeature,
          contactInfo: {
            phone: '69512310',
            email: 'forkasbib@gmail.com',
            message: 'Para desbloquear esta funcionalidad, contacta con nuestro equipo de soporte para explorar opciones de actualización.'
          },
          upgradeMessage: `Descubre todos los beneficios disponibles en nuestros planes superiores. ¡Contacta con nosotros para una consulta personalizada!`
        });
      }

      // Verificar límites de uso
      const limitsCheck = await checkUsageLimits(restaurantId, currentPlan);
      if (!limitsCheck.allowed) {
        logger.warn(`Límite excedido para restaurante ${restaurantId}: ${limitsCheck.exceededResource}`);
        return res.status(403).json({
          error: 'Límite de Recursos Excedido',
          message: `Has alcanzado el límite máximo de ${limitsCheck.exceededResource} en tu plan actual (${currentPlan.plan_nombre}). Actualmente tienes ${limitsCheck.currentUsage} de ${limitsCheck.limit} permitidos.`,
          code: 'LIMIT_EXCEEDED',
          currentPlan: currentPlan.plan_nombre,
          exceededResource: limitsCheck.exceededResource,
          currentUsage: limitsCheck.currentUsage,
          limit: limitsCheck.limit,
          featureName: `Límite de ${limitsCheck.exceededResource}`,
          contactInfo: {
            phone: '69512310',
            email: 'forkasbib@gmail.com',
            message: 'Para aumentar tus límites y continuar creciendo, contacta con nuestro equipo para explorar opciones de plan superiores.'
          },
          upgradeMessage: `Los planes superiores ofrecen límites más altos y funcionalidades adicionales. ¡Contacta con nosotros para encontrar la solución perfecta para tu negocio!`
        });
      }

      // Agregar información del plan al request
      req.currentPlan = currentPlan;
      req.planFeatures = planFeatures;
      req.usageLimits = limitsCheck;

      logger.info(`Acceso autorizado para restaurante ${restaurantId} - Plan: ${currentPlan.plan_nombre}, Funcionalidad: ${requiredFeature || 'general'}`);
      next();

    } catch (error) {
      logger.error('Error en middleware de planes:', error);
      return res.status(500).json({
        error: 'Error interno del servidor',
        message: 'Error verificando permisos de plan'
      });
    }
  };
};

/**
 * Verifica si el plan actual tiene acceso a un plan requerido (jerarquía de planes)
 */
const hasPlanAccess = (currentPlan, requiredPlan) => {
  const planHierarchy = {
    'basico': 1,
    'profesional': 2,
    'avanzado': 3,
    'enterprise': 4
  };

  const currentLevel = planHierarchy[currentPlan.toLowerCase()] || 0;
  const requiredLevel = planHierarchy[requiredPlan.toLowerCase()] || 0;

  return currentLevel >= requiredLevel;
};

/**
 * Verifica si el plan tiene acceso a una funcionalidad específica
 */
const hasFeatureAccess = (planFeatures, feature) => {
  if (!planFeatures || !feature) return true;

  // Mapeo de funcionalidades a claves del JSON
  const featureMap = {
    'inventory.products': 'inventory',
    'inventory.lots': 'inventory',
    'inventory.complete': 'inventory',
    'dashboard.resumen': 'dashboard',
    'dashboard.productos': 'dashboard',
    'dashboard.categorias': 'dashboard',
    'dashboard.usuarios': 'dashboard',
    'dashboard.mesas': 'dashboard',
    'dashboard.completo': 'dashboard',
    'sales.basico': 'sales',
    'sales.pedidos': 'sales',
    'sales.avanzado': 'sales',
    'mesas': 'mesas',
    'reservas': 'reservas',
    'delivery': 'delivery',
    'promociones': 'promociones',
    'egresos.basico': 'egresos',
    'egresos.avanzado': 'egresos',
    'cocina': 'cocina',
    'arqueo': 'arqueo',
    'lotes': 'lotes',
    'analytics': 'analytics',
    'analytics-avanzados': 'analytics',
    'analytics-productos': 'analytics',
    'tendencias-temporales': 'analytics',
    'exportacion-avanzada': 'analytics',
    'api': 'api',
    'white_label': 'white_label'
  };

  const featureKey = featureMap[feature] || feature;

  // Verificar acceso directo
  if (planFeatures[featureKey] === true) return true;
  if (planFeatures[featureKey] === false) return false;

  // Verificar acceso por array (para funcionalidades con múltiples niveles)
  if (Array.isArray(planFeatures[featureKey])) {
    const featureParts = feature.split('.');
    if (featureParts.length > 1) {
      const subFeature = featureParts[1];
      return planFeatures[featureKey].includes(subFeature);
    }
    // Si no hay subfeature específica, verificar si el array tiene elementos
    return planFeatures[featureKey].length > 0;
  }

  // Verificar acceso por objeto
  if (typeof planFeatures[featureKey] === 'object') {
    return Object.keys(planFeatures[featureKey]).length > 0;
  }

  return false;
};

/**
 * Verifica los límites de uso del restaurante
 */
const checkUsageLimits = async (restaurantId, plan) => {
  try {
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

    let currentUsage = {
      productos: 0,
      usuarios: 0,
      sucursales: 0,
      transacciones: 0,
      almacenamiento: 0
    };

    if (usageRows.length > 0) {
      const usage = usageRows[0];
      currentUsage = {
        productos: usage.productos_actuales,
        usuarios: usage.usuarios_actuales,
        sucursales: usage.sucursales_actuales,
        transacciones: usage.transacciones_mes_actual,
        almacenamiento: usage.almacenamiento_usado_mb
      };
    }

    // Verificar límites
    const limits = {
      productos: plan.max_productos,
      usuarios: plan.max_usuarios,
      sucursales: plan.max_sucursales,
      transacciones: plan.max_transacciones_mes,
      almacenamiento: plan.almacenamiento_gb * 1024 // Convertir GB a MB
    };

    // Verificar cada límite
    for (const [resource, limit] of Object.entries(limits)) {
      if (limit > 0 && currentUsage[resource] >= limit) {
        return {
          allowed: false,
          exceededResource: resource,
          currentUsage: currentUsage[resource],
          limit: limit
        };
      }
    }

    return {
      allowed: true,
      currentUsage,
      limits
    };

  } catch (error) {
    logger.error('Error verificando límites de uso:', error);
    return {
      allowed: true, // En caso de error, permitir acceso
      error: error.message
    };
  }
};

/**
 * Middleware específico para verificar límites de recursos
 */
const resourceLimitMiddleware = (resourceType) => {
  return async (req, res, next) => {
    try {
      const restaurantId = req.user?.id_restaurante;
      const currentPlan = req.currentPlan;

      if (!currentPlan) {
        return res.status(500).json({
          error: 'Plan no encontrado',
          message: 'No se pudo obtener información del plan actual'
        });
      }

      // Obtener uso actual
      const usageQuery = `
        SELECT ${resourceType}_actuales as current_count
        FROM uso_recursos
        WHERE id_restaurante = $1
        AND mes_medicion = EXTRACT(MONTH FROM CURRENT_DATE)
        AND año_medicion = EXTRACT(YEAR FROM CURRENT_DATE)
      `;

      const { rows: usageRows } = await pool.query(usageQuery, [restaurantId]);
      const currentCount = usageRows.length > 0 ? usageRows[0].current_count : 0;

      // Obtener límite del plan
      const limitField = `max_${resourceType}`;
      const limit = currentPlan[limitField];

      // Verificar límite
      if (limit > 0 && currentCount >= limit) {
        logger.warn(`Límite de ${resourceType} excedido para restaurante ${restaurantId}: ${currentCount}/${limit}`);
        return res.status(403).json({
          error: 'Capacidad Máxima Alcanzada',
          message: `Has alcanzado el límite máximo de ${resourceType} en tu plan actual (${currentPlan.plan_nombre}). Actualmente tienes ${currentCount} de ${limit} permitidos.`,
          code: 'RESOURCE_LIMIT_EXCEEDED',
          resourceType,
          currentCount,
          limit,
          plan: currentPlan.plan_nombre,
          featureName: `Límite de ${resourceType}`,
          contactInfo: {
            phone: '69512310',
            email: 'forkasbib@gmail.com',
            message: `Para aumentar tu capacidad de ${resourceType} y continuar creciendo, contacta con nuestro equipo para explorar opciones de plan superiores.`
          },
          upgradeMessage: `Los planes superiores ofrecen mayor capacidad y funcionalidades adicionales. ¡Contacta con nosotros para encontrar la solución perfecta para tu negocio!`
        });
      }

      // Agregar información al request
      req.resourceUsage = {
        type: resourceType,
        current: currentCount,
        limit: limit,
        remaining: limit > 0 ? limit - currentCount : -1
      };

      next();

    } catch (error) {
      logger.error(`Error verificando límite de ${resourceType}:`, error);
      return res.status(500).json({
        error: 'Error interno del servidor',
        message: `Error verificando límite de ${resourceType}`
      });
    }
  };
};

/**
 * Función para incrementar contadores de uso
 */
const incrementUsageCounter = async (restaurantId, resourceType, increment = 1) => {
  try {
    const updateQuery = `
      INSERT INTO uso_recursos (
        id_restaurante, 
        id_plan, 
        mes_medicion, 
        año_medicion, 
        ${resourceType}_actuales
      )
      VALUES (
        $1, 
        (SELECT id_plan FROM suscripciones WHERE id_restaurante = $1 AND estado = 'activa' LIMIT 1),
        EXTRACT(MONTH FROM CURRENT_DATE),
        EXTRACT(YEAR FROM CURRENT_DATE),
        $2
      )
      ON CONFLICT (id_restaurante, mes_medicion, año_medicion)
      DO UPDATE SET 
        ${resourceType}_actuales = uso_recursos.${resourceType}_actuales + $2,
        updated_at = CURRENT_TIMESTAMP
    `;

    await pool.query(updateQuery, [restaurantId, increment]);
    logger.info(`Contador de ${resourceType} incrementado para restaurante ${restaurantId}: +${increment}`);

  } catch (error) {
    logger.error(`Error incrementando contador de ${resourceType}:`, error);
    throw error;
  }
};

/**
 * Función para decrementar contadores de uso
 */
const decrementUsageCounter = async (restaurantId, resourceType, decrement = 1) => {
  try {
    const updateQuery = `
      UPDATE uso_recursos 
      SET 
        ${resourceType}_actuales = GREATEST(0, ${resourceType}_actuales - $2),
        updated_at = CURRENT_TIMESTAMP
      WHERE id_restaurante = $1
      AND mes_medicion = EXTRACT(MONTH FROM CURRENT_DATE)
      AND año_medicion = EXTRACT(YEAR FROM CURRENT_DATE)
    `;

    const result = await pool.query(updateQuery, [restaurantId, decrement]);
    
    if (result.rowCount > 0) {
      logger.info(`Contador de ${resourceType} decrementado para restaurante ${restaurantId}: -${decrement}`);
    }

  } catch (error) {
    logger.error(`Error decrementando contador de ${resourceType}:`, error);
    throw error;
  }
};

/**
 * Función para obtener información completa del plan
 */
const getPlanInfo = async (restaurantId) => {
  try {
    const planQuery = `
      SELECT 
        p.*,
        s.estado as suscripcion_estado,
        s.fecha_inicio,
        s.fecha_fin,
        s.fecha_renovacion,
        s.auto_renovacion
      FROM planes p
      JOIN suscripciones s ON p.id_plan = s.id_plan
      WHERE s.id_restaurante = $1
      AND s.estado = 'activa'
      ORDER BY s.created_at DESC
      LIMIT 1
    `;

    const { rows: planRows } = await pool.query(planQuery, [restaurantId]);

    if (planRows.length === 0) {
      return null;
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
    const usage = usageRows.length > 0 ? usageRows[0] : {
      productos_actuales: 0,
      usuarios_actuales: 0,
      sucursales_actuales: 0,
      transacciones_mes_actual: 0,
      almacenamiento_usado_mb: 0
    };

    return {
      plan: {
        id: plan.id_plan,
        nombre: plan.nombre,
        descripcion: plan.descripcion,
        precio_mensual: parseFloat(plan.precio_mensual),
        precio_anual: plan.precio_anual ? parseFloat(plan.precio_anual) : null,
        funcionalidades: plan.funcionalidades
      },
      suscripcion: {
        estado: plan.suscripcion_estado,
        fecha_inicio: plan.fecha_inicio,
        fecha_fin: plan.fecha_fin,
        fecha_renovacion: plan.fecha_renovacion,
        auto_renovacion: plan.auto_renovacion
      },
      limites: {
        max_sucursales: plan.max_sucursales,
        max_usuarios: plan.max_usuarios,
        max_productos: plan.max_productos,
        max_transacciones_mes: plan.max_transacciones_mes,
        almacenamiento_gb: plan.almacenamiento_gb
      },
      uso_actual: {
        productos: usage.productos_actuales,
        usuarios: usage.usuarios_actuales,
        sucursales: usage.sucursales_actuales,
        transacciones: usage.transacciones_mes_actual,
        almacenamiento_mb: usage.almacenamiento_usado_mb
      }
    };

  } catch (error) {
    logger.error('Error obteniendo información del plan:', error);
    throw error;
  }
};

module.exports = {
  planMiddleware,
  resourceLimitMiddleware,
  incrementUsageCounter,
  decrementUsageCounter,
  getPlanInfo,
  hasFeatureAccess,
  hasPlanAccess,
  checkUsageLimits
};
