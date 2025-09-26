const { pool } = require('./src/config/database');
const logger = require('./src/config/logger');

/**
 * Script para implementar restricciones específicas por rol según cada plan
 * Basado en PLANES_FUNCIONALIDADES_COMPLETO.md
 */

/**
 * Restricciones por rol según cada plan
 */
const ROLE_RESTRICTIONS = {
  basico: {
    admin: {
      allowedFeatures: ['sales.basico', 'inventory.products', 'dashboard.resumen', 'dashboard.productos', 'dashboard.categorias', 'dashboard.usuarios'],
      restrictedFeatures: ['mesas', 'lotes', 'arqueo', 'cocina', 'egresos', 'delivery', 'reservas', 'analytics', 'promociones', 'api', 'white_label'],
      maxUsers: 2,
      userRoles: ['admin', 'cajero']
    },
    cajero: {
      allowedFeatures: ['sales.basico'],
      restrictedFeatures: ['inventory', 'dashboard', 'mesas', 'lotes', 'arqueo', 'cocina', 'egresos', 'delivery', 'reservas', 'analytics', 'promociones', 'api', 'white_label'],
      maxUsers: 1,
      userRoles: ['cajero']
    }
  },
  profesional: {
    admin: {
      allowedFeatures: ['sales.basico', 'sales.pedidos', 'inventory.products', 'inventory.lots', 'dashboard.resumen', 'dashboard.productos', 'dashboard.categorias', 'dashboard.usuarios', 'dashboard.mesas', 'mesas', 'lotes', 'arqueo', 'cocina', 'egresos.basico'],
      restrictedFeatures: ['egresos.avanzado', 'delivery', 'reservas', 'analytics', 'promociones', 'api', 'white_label'],
      maxUsers: 7,
      userRoles: ['admin', 'cajero', 'cocinero', 'mesero']
    },
    cajero: {
      allowedFeatures: ['sales.basico', 'sales.pedidos', 'egresos.basico'],
      restrictedFeatures: ['inventory', 'dashboard', 'mesas', 'lotes', 'arqueo', 'cocina', 'egresos.avanzado', 'delivery', 'reservas', 'analytics', 'promociones', 'api', 'white_label'],
      maxUsers: 2,
      userRoles: ['cajero']
    },
    cocinero: {
      allowedFeatures: ['cocina'],
      restrictedFeatures: ['sales', 'inventory', 'dashboard', 'mesas', 'lotes', 'arqueo', 'egresos', 'delivery', 'reservas', 'analytics', 'promociones', 'api', 'white_label'],
      maxUsers: 1,
      userRoles: ['cocinero']
    },
    mesero: {
      allowedFeatures: ['mesas'],
      restrictedFeatures: ['sales', 'inventory', 'dashboard', 'lotes', 'arqueo', 'cocina', 'egresos', 'delivery', 'reservas', 'analytics', 'promociones', 'api', 'white_label'],
      maxUsers: 3,
      userRoles: ['mesero']
    }
  },
  avanzado: {
    admin: {
      allowedFeatures: ['sales.basico', 'sales.pedidos', 'sales.avanzado', 'inventory.products', 'inventory.lots', 'inventory.complete', 'dashboard.resumen', 'dashboard.productos', 'dashboard.categorias', 'dashboard.usuarios', 'dashboard.mesas', 'dashboard.completo', 'mesas', 'lotes', 'arqueo', 'cocina', 'egresos.basico', 'egresos.avanzado', 'delivery', 'reservas', 'analytics', 'promociones'],
      restrictedFeatures: ['api', 'white_label'],
      maxUsers: 0, // Ilimitado
      userRoles: ['admin', 'cajero', 'cocinero', 'mesero', 'gerente']
    },
    cajero: {
      allowedFeatures: ['sales.basico', 'sales.pedidos', 'sales.avanzado', 'egresos.basico', 'egresos.avanzado'],
      restrictedFeatures: ['inventory', 'dashboard', 'mesas', 'lotes', 'arqueo', 'cocina', 'delivery', 'reservas', 'analytics', 'promociones', 'api', 'white_label'],
      maxUsers: 0, // Ilimitado
      userRoles: ['cajero']
    },
    cocinero: {
      allowedFeatures: ['cocina', 'analytics'],
      restrictedFeatures: ['sales', 'inventory', 'dashboard', 'mesas', 'lotes', 'arqueo', 'egresos', 'delivery', 'reservas', 'promociones', 'api', 'white_label'],
      maxUsers: 0, // Ilimitado
      userRoles: ['cocinero']
    },
    mesero: {
      allowedFeatures: ['mesas', 'reservas'],
      restrictedFeatures: ['sales', 'inventory', 'dashboard', 'lotes', 'arqueo', 'cocina', 'egresos', 'delivery', 'analytics', 'promociones', 'api', 'white_label'],
      maxUsers: 0, // Ilimitado
      userRoles: ['mesero']
    },
    gerente: {
      allowedFeatures: ['sales.basico', 'sales.pedidos', 'sales.avanzado', 'inventory.products', 'inventory.lots', 'inventory.complete', 'dashboard.resumen', 'dashboard.productos', 'dashboard.categorias', 'dashboard.usuarios', 'dashboard.mesas', 'dashboard.completo', 'mesas', 'lotes', 'arqueo', 'cocina', 'egresos.basico', 'egresos.avanzado', 'delivery', 'reservas', 'analytics', 'promociones'],
      restrictedFeatures: ['api', 'white_label'],
      maxUsers: 0, // Ilimitado
      userRoles: ['gerente']
    }
  },
  enterprise: {
    admin: {
      allowedFeatures: ['sales.basico', 'sales.pedidos', 'sales.avanzado', 'inventory.products', 'inventory.lots', 'inventory.complete', 'dashboard.resumen', 'dashboard.productos', 'dashboard.categorias', 'dashboard.usuarios', 'dashboard.mesas', 'dashboard.completo', 'mesas', 'lotes', 'arqueo', 'cocina', 'egresos.basico', 'egresos.avanzado', 'delivery', 'reservas', 'analytics', 'promociones', 'api', 'white_label'],
      restrictedFeatures: [],
      maxUsers: 0, // Ilimitado
      userRoles: ['admin', 'cajero', 'cocinero', 'mesero', 'gerente', 'super_admin']
    },
    cajero: {
      allowedFeatures: ['sales.basico', 'sales.pedidos', 'sales.avanzado', 'inventory.products', 'inventory.lots', 'inventory.complete', 'dashboard.resumen', 'dashboard.productos', 'dashboard.categorias', 'dashboard.usuarios', 'dashboard.mesas', 'dashboard.completo', 'mesas', 'lotes', 'arqueo', 'cocina', 'egresos.basico', 'egresos.avanzado', 'delivery', 'reservas', 'analytics', 'promociones', 'api', 'white_label'],
      restrictedFeatures: [],
      maxUsers: 0, // Ilimitado
      userRoles: ['cajero']
    },
    cocinero: {
      allowedFeatures: ['sales.basico', 'sales.pedidos', 'sales.avanzado', 'inventory.products', 'inventory.lots', 'inventory.complete', 'dashboard.resumen', 'dashboard.productos', 'dashboard.categorias', 'dashboard.usuarios', 'dashboard.mesas', 'dashboard.completo', 'mesas', 'lotes', 'arqueo', 'cocina', 'egresos.basico', 'egresos.avanzado', 'delivery', 'reservas', 'analytics', 'promociones', 'api', 'white_label'],
      restrictedFeatures: [],
      maxUsers: 0, // Ilimitado
      userRoles: ['cocinero']
    },
    mesero: {
      allowedFeatures: ['sales.basico', 'sales.pedidos', 'sales.avanzado', 'inventory.products', 'inventory.lots', 'inventory.complete', 'dashboard.resumen', 'dashboard.productos', 'dashboard.categorias', 'dashboard.usuarios', 'dashboard.mesas', 'dashboard.completo', 'mesas', 'lotes', 'arqueo', 'cocina', 'egresos.basico', 'egresos.avanzado', 'delivery', 'reservas', 'analytics', 'promociones', 'api', 'white_label'],
      restrictedFeatures: [],
      maxUsers: 0, // Ilimitado
      userRoles: ['mesero']
    },
    gerente: {
      allowedFeatures: ['sales.basico', 'sales.pedidos', 'sales.avanzado', 'inventory.products', 'inventory.lots', 'inventory.complete', 'dashboard.resumen', 'dashboard.productos', 'dashboard.categorias', 'dashboard.usuarios', 'dashboard.mesas', 'dashboard.completo', 'mesas', 'lotes', 'arqueo', 'cocina', 'egresos.basico', 'egresos.avanzado', 'delivery', 'reservas', 'analytics', 'promociones', 'api', 'white_label'],
      restrictedFeatures: [],
      maxUsers: 0, // Ilimitado
      userRoles: ['gerente']
    },
    super_admin: {
      allowedFeatures: ['sales.basico', 'sales.pedidos', 'sales.avanzado', 'inventory.products', 'inventory.lots', 'inventory.complete', 'dashboard.resumen', 'dashboard.productos', 'dashboard.categorias', 'dashboard.usuarios', 'dashboard.mesas', 'dashboard.completo', 'mesas', 'lotes', 'arqueo', 'cocina', 'egresos.basico', 'egresos.avanzado', 'delivery', 'reservas', 'analytics', 'promociones', 'api', 'white_label'],
      restrictedFeatures: [],
      maxUsers: 0, // Ilimitado
      userRoles: ['super_admin']
    }
  }
};

/**
 * Verificar si un usuario tiene acceso a una funcionalidad específica
 */
function hasFeatureAccess(userRole, planName, feature) {
  const planRestrictions = ROLE_RESTRICTIONS[planName];
  if (!planRestrictions) {
    logger.warn(`Plan ${planName} no encontrado en restricciones`);
    return false;
  }
  
  const roleRestrictions = planRestrictions[userRole];
  if (!roleRestrictions) {
    logger.warn(`Rol ${userRole} no encontrado en plan ${planName}`);
    return false;
  }
  
  // Verificar si la funcionalidad está permitida
  if (roleRestrictions.allowedFeatures.includes(feature)) {
    return true;
  }
  
  // Verificar si la funcionalidad está restringida
  if (roleRestrictions.restrictedFeatures.includes(feature)) {
    return false;
  }
  
  // Verificar funcionalidades específicas
  const featureParts = feature.split('.');
  if (featureParts.length > 1) {
    const baseFeature = featureParts[0];
    const subFeature = featureParts[1];
    
    // Verificar si el rol tiene acceso a la funcionalidad base
    if (roleRestrictions.allowedFeatures.includes(baseFeature)) {
      return true;
    }
    
    // Verificar si el rol tiene acceso a la funcionalidad específica
    if (roleRestrictions.allowedFeatures.includes(feature)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Verificar si un usuario puede crear un nuevo usuario con un rol específico
 */
function canCreateUser(userRole, planName, newUserRole) {
  const planRestrictions = ROLE_RESTRICTIONS[planName];
  if (!planRestrictions) {
    return false;
  }
  
  const roleRestrictions = planRestrictions[userRole];
  if (!roleRestrictions) {
    return false;
  }
  
  // Verificar si el rol del nuevo usuario está permitido
  return roleRestrictions.userRoles.includes(newUserRole);
}

/**
 * Obtener restricciones para un usuario específico
 */
function getUserRestrictions(userRole, planName) {
  const planRestrictions = ROLE_RESTRICTIONS[planName];
  if (!planRestrictions) {
    return null;
  }
  
  const roleRestrictions = planRestrictions[userRole];
  if (!roleRestrictions) {
    return null;
  }
  
  return {
    allowedFeatures: roleRestrictions.allowedFeatures,
    restrictedFeatures: roleRestrictions.restrictedFeatures,
    maxUsers: roleRestrictions.maxUsers,
    userRoles: roleRestrictions.userRoles
  };
}

/**
 * Middleware para verificar restricciones por rol
 */
function createRoleRestrictionMiddleware(feature) {
  return (req, res, next) => {
    try {
      const userRole = req.user?.rol;
      const planName = req.currentPlan?.plan_nombre;
      
      if (!userRole || !planName) {
        return res.status(401).json({
          error: 'Información de usuario o plan no encontrada',
          message: 'No se pudo verificar los permisos del usuario'
        });
      }
      
      if (!hasFeatureAccess(userRole, planName, feature)) {
        logger.warn(`Acceso denegado para usuario ${req.user?.username} (${userRole}) a funcionalidad ${feature} en plan ${planName}`);
        return res.status(403).json({
          error: 'Acceso Denegado por Rol',
          message: `Tu rol (${userRole}) no tiene acceso a la funcionalidad "${feature}" en el plan ${planName}`,
          code: 'ROLE_ACCESS_DENIED',
          userRole,
          planName,
          feature,
          contactInfo: {
            phone: '69512310',
            email: 'forkasbib@gmail.com',
            message: 'Para acceder a esta funcionalidad, contacta con el administrador para verificar los permisos de tu rol.'
          }
        });
      }
      
      next();
    } catch (error) {
      logger.error('Error en middleware de restricciones por rol:', error);
      return res.status(500).json({
        error: 'Error interno del servidor',
        message: 'Error verificando permisos de rol'
      });
    }
  };
}

/**
 * Verificar restricciones para todos los usuarios de un restaurante
 */
async function checkRestaurantRoleRestrictions(restaurantId) {
  try {
    // Obtener plan actual del restaurante
    const planQuery = `
      SELECT 
        p.nombre as plan_nombre,
        p.funcionalidades
      FROM planes p
      JOIN suscripciones s ON p.id_plan = s.id_plan
      WHERE s.id_restaurante = $1
      AND s.estado = 'activa'
      ORDER BY s.created_at DESC
      LIMIT 1
    `;
    
    const { rows: planRows } = await pool.query(planQuery, [restaurantId]);
    
    if (planRows.length === 0) {
      throw new Error(`No se encontró plan activo para el restaurante ${restaurantId}`);
    }
    
    const plan = planRows[0];
    
    // Obtener usuarios del restaurante
    const usersQuery = `
      SELECT 
        id_vendedor,
        username,
        rol,
        activo
      FROM vendedores
      WHERE id_restaurante = $1
      ORDER BY rol, username
    `;
    
    const { rows: users } = await pool.query(usersQuery, [restaurantId]);
    
    const results = [];
    
    for (const user of users) {
      const restrictions = getUserRestrictions(user.rol, plan.plan_nombre);
      
      results.push({
        userId: user.id_vendedor,
        username: user.username,
        role: user.rol,
        active: user.activo,
        plan: plan.plan_nombre,
        restrictions: restrictions,
        hasValidRole: restrictions !== null
      });
    }
    
    return {
      restaurantId,
      plan: plan.plan_nombre,
      users: results,
      totalUsers: users.length,
      validUsers: results.filter(u => u.hasValidRole).length,
      invalidUsers: results.filter(u => !u.hasValidRole).length
    };
    
  } catch (error) {
    logger.error(`Error verificando restricciones por rol para restaurante ${restaurantId}:`, error);
    throw error;
  }
}

/**
 * Verificar restricciones para todos los restaurantes
 */
async function checkAllRestaurantsRoleRestrictions() {
  try {
    logger.info('Iniciando verificación de restricciones por rol para todos los restaurantes');
    
    const restaurantsQuery = `
      SELECT id_restaurante, nombre_restaurante
      FROM restaurantes
      WHERE activo = true
    `;
    
    const { rows: restaurants } = await pool.query(restaurantsQuery);
    
    const results = [];
    
    for (const restaurant of restaurants) {
      try {
        const result = await checkRestaurantRoleRestrictions(restaurant.id_restaurante);
        results.push({
          restaurantId: restaurant.id_restaurante,
          restaurantName: restaurant.nombre_restaurante,
          ...result
        });
      } catch (error) {
        logger.error(`Error procesando restaurante ${restaurant.id_restaurante}:`, error);
        results.push({
          restaurantId: restaurant.id_restaurante,
          restaurantName: restaurant.nombre_restaurante,
          error: error.message
        });
      }
    }
    
    logger.info(`Verificación completada para ${results.length} restaurantes`);
    
    // Mostrar resumen
    const invalidUsers = results.filter(r => r.invalidUsers > 0);
    if (invalidUsers.length > 0) {
      logger.warn(`${invalidUsers.length} restaurantes tienen usuarios con roles inválidos:`);
      invalidUsers.forEach(r => {
        logger.warn(`- ${r.restaurantName}: ${r.invalidUsers} usuarios con roles inválidos`);
      });
    }
    
    return results;
    
  } catch (error) {
    logger.error('Error verificando restricciones por rol para todos los restaurantes:', error);
    throw error;
  }
}

/**
 * Función principal para ejecutar el script
 */
async function main() {
  try {
    console.log('🚀 Iniciando verificación de restricciones por rol...');
    
    // Verificar conexión a la base de datos
    await pool.query('SELECT 1');
    console.log('✅ Conexión a base de datos establecida');
    
    // Verificar todos los restaurantes
    const results = await checkAllRestaurantsRoleRestrictions();
    
    console.log('✅ Verificación completada');
    console.log(`📊 Procesados: ${results.length} restaurantes`);
    
    const invalidUsers = results.filter(r => r.invalidUsers > 0);
    if (invalidUsers.length > 0) {
      console.log(`⚠️  ${invalidUsers.length} restaurantes tienen usuarios con roles inválidos`);
    } else {
      console.log('✅ Todos los usuarios tienen roles válidos para sus planes');
    }
    
  } catch (error) {
    console.error('❌ Error ejecutando script:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Exportar funciones para uso en otros módulos
module.exports = {
  ROLE_RESTRICTIONS,
  hasFeatureAccess,
  canCreateUser,
  getUserRestrictions,
  createRoleRestrictionMiddleware,
  checkRestaurantRoleRestrictions,
  checkAllRestaurantsRoleRestrictions
};

// Ejecutar si se llama directamente
if (require.main === module) {
  main();
}
