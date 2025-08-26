const winston = require('winston');

/**
 * Middleware específico para validar permisos de egresos
 */
const validateEgresosPermissions = (requiredAction) => {
  return (req, res, next) => {
    try {
      const { user } = req;
      const { rol } = user;

      // Definir permisos por rol
      const permissions = {
        admin: ['create', 'read', 'update', 'delete', 'approve', 'pay', 'report'],
        gerente: ['create', 'read', 'update', 'delete', 'approve', 'pay', 'report'],
        contador: ['create', 'read', 'update', 'report'],
        cajero: ['create', 'read'],
        cocinero: ['read'],
        mesero: ['read']
      };

      // Verificar si el rol tiene el permiso requerido
      const userPermissions = permissions[rol] || [];
      
      if (!userPermissions.includes(requiredAction)) {
        winston.warn(`[egresosMiddleware] Usuario ${user.username} (${rol}) intentó realizar acción '${requiredAction}' sin permisos`);
        return res.status(403).json({
          success: false,
          message: `No tienes permisos para realizar esta acción (${requiredAction})`
        });
      }

      // Validaciones adicionales por acción
      switch (requiredAction) {
        case 'approve':
          // Solo admin y gerente pueden aprobar
          if (!['admin', 'gerente'].includes(rol)) {
            return res.status(403).json({
              success: false,
              message: 'Solo administradores y gerentes pueden aprobar egresos'
            });
          }
          break;

        case 'pay':
          // Solo admin, gerente y contador pueden marcar como pagado
          if (!['admin', 'gerente', 'contador'].includes(rol)) {
            return res.status(403).json({
              success: false,
              message: 'Solo administradores, gerentes y contadores pueden marcar egresos como pagados'
            });
          }
          break;

        case 'delete':
          // Solo admin y gerente pueden eliminar
          if (!['admin', 'gerente'].includes(rol)) {
            return res.status(403).json({
              success: false,
              message: 'Solo administradores y gerentes pueden eliminar egresos'
            });
          }
          break;

        case 'report':
          // Solo roles con acceso a reportes
          if (!['admin', 'gerente', 'contador'].includes(rol)) {
            return res.status(403).json({
              success: false,
              message: 'No tienes permisos para acceder a los reportes'
            });
          }
          break;
      }

      next();
    } catch (error) {
      winston.error(`[egresosMiddleware] Error en validación de permisos: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error interno en validación de permisos'
      });
    }
  };
};

/**
 * Middleware para validar que el usuario solo pueda ver/editar egresos de su sucursal
 */
const validateSucursalAccess = (req, res, next) => {
  try {
    const { user } = req;
    const { id_restaurante: userRestauranteId } = user;

    // Los super_admin pueden ver todos los egresos
    if (user.rol === 'super_admin') {
      return next();
    }

    // Para otros roles, validar acceso a sucursal
    req.sucursalFilter = {
      id_restaurante: userRestauranteId
    };

    next();
  } catch (error) {
    winston.error(`[egresosMiddleware] Error en validación de sucursal: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error interno en validación de sucursal'
    });
  }
};

/**
 * Middleware para validar montos de egresos
 */
const validateMontoLimits = (req, res, next) => {
  try {
    const { monto } = req.body;
    const { user } = req;
    const { rol } = user;

    // Límites por rol (en bolivianos)
    const limits = {
      cajero: 500,      // 500 Bs
      contador: 2000,   // 2000 Bs
      gerente: 10000,   // 10000 Bs
      admin: Infinity,  // Sin límite
      super_admin: Infinity
    };

    const userLimit = limits[rol] || 0;

    if (monto > userLimit) {
      winston.warn(`[egresosMiddleware] Usuario ${user.username} (${rol}) intentó crear egreso de ${monto} Bs (límite: ${userLimit} Bs)`);
      return res.status(403).json({
        success: false,
        message: `El monto excede tu límite autorizado (${userLimit} Bs). Contacta a un supervisor.`
      });
    }

    next();
  } catch (error) {
    winston.error(`[egresosMiddleware] Error en validación de monto: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error interno en validación de monto'
    });
  }
};

/**
 * Middleware para logging de actividades de egresos
 */
const logEgresosActivity = (action) => {
  return (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      try {
        const { user } = req;
        const { method, originalUrl, body, params } = req;
        
        winston.info(`[EGRESOS_AUDIT] ${action}`, {
          usuario: user.username,
          rol: user.rol,
          sucursal: user.id_restaurante,
          method,
          url: originalUrl,
          params,
          body: method === 'POST' || method === 'PUT' ? body : undefined,
          timestamp: new Date().toISOString(),
          ip: req.ip || req.connection.remoteAddress
        });
      } catch (error) {
        winston.error(`[egresosMiddleware] Error en logging: ${error.message}`);
      }
      
      originalSend.call(this, data);
    };
    
    next();
  };
};

/**
 * Middleware para validar estados de egresos en transiciones
 */
const validateEstadoTransition = (req, res, next) => {
  try {
    const { estado } = req.body;
    const { user } = req;
    
    // Transiciones válidas por rol
    const validTransitions = {
      admin: ['pendiente', 'aprobado', 'pagado', 'cancelado', 'rechazado'],
      gerente: ['pendiente', 'aprobado', 'pagado', 'cancelado', 'rechazado'],
      contador: ['pendiente', 'pagado'],
      cajero: ['pendiente'],
      cocinero: [],
      mesero: []
    };

    const userValidStates = validTransitions[user.rol] || [];
    
    if (estado && !userValidStates.includes(estado)) {
      return res.status(403).json({
        success: false,
        message: `No tienes permisos para cambiar el estado a '${estado}'`
      });
    }

    next();
  } catch (error) {
    winston.error(`[egresosMiddleware] Error en validación de estado: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error interno en validación de estado'
    });
  }
};

module.exports = {
  validateEgresosPermissions,
  validateSucursalAccess,
  validateMontoLimits,
  logEgresosActivity,
  validateEstadoTransition
};
