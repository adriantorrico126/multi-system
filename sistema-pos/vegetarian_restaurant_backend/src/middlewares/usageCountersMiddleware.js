const { pool } = require('../config/database');
const logger = require('../config/logger');
const { incrementUsageCounter, decrementUsageCounter } = require('./planMiddleware');

/**
 * Middleware para incrementar contadores de uso automáticamente
 */
const autoIncrementCounter = (resourceType, increment = 1) => {
  return async (req, res, next) => {
    try {
      const restaurantId = req.user?.id_restaurante;
      
      if (!restaurantId) {
        return next(); // Si no hay restaurante, continuar sin incrementar
      }

      // Incrementar contador después de que la operación sea exitosa
      const originalSend = res.send;
      res.send = function(data) {
        // Solo incrementar si la respuesta es exitosa
        if (res.statusCode >= 200 && res.statusCode < 300) {
          incrementUsageCounter(restaurantId, resourceType, increment)
            .catch(error => {
              logger.error(`Error incrementando contador de ${resourceType}:`, error);
            });
        }
        originalSend.call(this, data);
      };

      next();
    } catch (error) {
      logger.error(`Error en middleware de incremento de ${resourceType}:`, error);
      next(); // Continuar aunque haya error en el contador
    }
  };
};

/**
 * Middleware para decrementar contadores de uso automáticamente
 */
const autoDecrementCounter = (resourceType, decrement = 1) => {
  return async (req, res, next) => {
    try {
      const restaurantId = req.user?.id_restaurante;
      
      if (!restaurantId) {
        return next(); // Si no hay restaurante, continuar sin decrementar
      }

      // Decrementar contador después de que la operación sea exitosa
      const originalSend = res.send;
      res.send = function(data) {
        // Solo decrementar si la respuesta es exitosa
        if (res.statusCode >= 200 && res.statusCode < 300) {
          decrementUsageCounter(restaurantId, resourceType, decrement)
            .catch(error => {
              logger.error(`Error decrementando contador de ${resourceType}:`, error);
            });
        }
        originalSend.call(this, data);
      };

      next();
    } catch (error) {
      logger.error(`Error en middleware de decremento de ${resourceType}:`, error);
      next(); // Continuar aunque haya error en el contador
    }
  };
};

/**
 * Middleware para incrementar contador de transacciones mensuales
 */
const incrementTransactionCounter = () => {
  return async (req, res, next) => {
    try {
      const restaurantId = req.user?.id_restaurante;
      
      if (!restaurantId) {
        return next();
      }

      // Incrementar contador de transacciones después de operación exitosa
      const originalSend = res.send;
      res.send = function(data) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          incrementUsageCounter(restaurantId, 'transacciones', 1)
            .catch(error => {
              logger.error('Error incrementando contador de transacciones:', error);
            });
        }
        originalSend.call(this, data);
      };

      next();
    } catch (error) {
      logger.error('Error en middleware de incremento de transacciones:', error);
      next();
    }
  };
};

/**
 * Middleware para actualizar contador de usuarios
 */
const updateUserCounter = () => {
  return async (req, res, next) => {
    try {
      const restaurantId = req.user?.id_restaurante;
      
      if (!restaurantId) {
        return next();
      }

      // Actualizar contador de usuarios después de operación exitosa
      const originalSend = res.send;
      res.send = function(data) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          // Recalcular usuarios activos del restaurante
          updateUserCount(restaurantId)
            .catch(error => {
              logger.error('Error actualizando contador de usuarios:', error);
            });
        }
        originalSend.call(this, data);
      };

      next();
    } catch (error) {
      logger.error('Error en middleware de actualización de usuarios:', error);
      next();
    }
  };
};

/**
 * Función para actualizar el contador de usuarios activos
 */
const updateUserCount = async (restaurantId) => {
  try {
    // Contar usuarios activos del restaurante
    const countQuery = `
      SELECT COUNT(*) as user_count
      FROM vendedores 
      WHERE id_restaurante = $1 
      AND activo = true
    `;

    const { rows } = await pool.query(countQuery, [restaurantId]);
    const userCount = parseInt(rows[0].user_count);

    // Actualizar contador en uso_recursos
    const updateQuery = `
      INSERT INTO uso_recursos (
        id_restaurante, 
        id_plan, 
        mes_medicion, 
        año_medicion, 
        usuarios_actuales
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
        usuarios_actuales = $2,
        updated_at = CURRENT_TIMESTAMP
    `;

    await pool.query(updateQuery, [restaurantId, userCount]);
    logger.info(`Contador de usuarios actualizado para restaurante ${restaurantId}: ${userCount}`);

  } catch (error) {
    logger.error('Error actualizando contador de usuarios:', error);
    throw error;
  }
};

/**
 * Función para actualizar el contador de sucursales
 */
const updateSucursalCount = async (restaurantId) => {
  try {
    // Contar sucursales activas del restaurante
    const countQuery = `
      SELECT COUNT(*) as sucursal_count
      FROM sucursales 
      WHERE id_restaurante = $1 
      AND activo = true
    `;

    const { rows } = await pool.query(countQuery, [restaurantId]);
    const sucursalCount = parseInt(rows[0].sucursal_count);

    // Actualizar contador en uso_recursos
    const updateQuery = `
      INSERT INTO uso_recursos (
        id_restaurante, 
        id_plan, 
        mes_medicion, 
        año_medicion, 
        sucursales_actuales
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
        sucursales_actuales = $2,
        updated_at = CURRENT_TIMESTAMP
    `;

    await pool.query(updateQuery, [restaurantId, sucursalCount]);
    logger.info(`Contador de sucursales actualizado para restaurante ${restaurantId}: ${sucursalCount}`);

  } catch (error) {
    logger.error('Error actualizando contador de sucursales:', error);
    throw error;
  }
};

/**
 * Función para actualizar el contador de productos
 */
const updateProductCount = async (restaurantId) => {
  try {
    // Contar productos activos del restaurante
    const countQuery = `
      SELECT COUNT(*) as product_count
      FROM productos 
      WHERE id_restaurante = $1 
      AND activo = true
    `;

    const { rows } = await pool.query(countQuery, [restaurantId]);
    const productCount = parseInt(rows[0].product_count);

    // Actualizar contador en uso_recursos
    const updateQuery = `
      INSERT INTO uso_recursos (
        id_restaurante, 
        id_plan, 
        mes_medicion, 
        año_medicion, 
        productos_actuales
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
        productos_actuales = $2,
        updated_at = CURRENT_TIMESTAMP
    `;

    await pool.query(updateQuery, [restaurantId, productCount]);
    logger.info(`Contador de productos actualizado para restaurante ${restaurantId}: ${productCount}`);

  } catch (error) {
    logger.error('Error actualizando contador de productos:', error);
    throw error;
  }
};

/**
 * Middleware para actualizar contador de sucursales
 */
const updateSucursalCounter = () => {
  return async (req, res, next) => {
    try {
      const restaurantId = req.user?.id_restaurante;
      
      if (!restaurantId) {
        return next();
      }

      const originalSend = res.send;
      res.send = function(data) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          updateSucursalCount(restaurantId)
            .catch(error => {
              logger.error('Error actualizando contador de sucursales:', error);
            });
        }
        originalSend.call(this, data);
      };

      next();
    } catch (error) {
      logger.error('Error en middleware de actualización de sucursales:', error);
      next();
    }
  };
};

/**
 * Middleware para actualizar contador de productos
 */
const updateProductCounter = () => {
  return async (req, res, next) => {
    try {
      const restaurantId = req.user?.id_restaurante;
      
      if (!restaurantId) {
        return next();
      }

      const originalSend = res.send;
      res.send = function(data) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          updateProductCount(restaurantId)
            .catch(error => {
              logger.error('Error actualizando contador de productos:', error);
            });
        }
        originalSend.call(this, data);
      };

      next();
    } catch (error) {
      logger.error('Error en middleware de actualización de productos:', error);
      next();
    }
  };
};

module.exports = {
  autoIncrementCounter,
  autoDecrementCounter,
  incrementTransactionCounter,
  updateUserCounter,
  updateSucursalCounter,
  updateProductCounter,
  updateUserCount,
  updateSucursalCount,
  updateProductCount
};
