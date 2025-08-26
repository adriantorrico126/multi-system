const integrityService = require('../services/integrityService');
const logger = require('../config/logger');

/**
 * Middleware de validación de integridad para operaciones críticas
 */
const integrityMiddleware = {
  /**
   * Valida integridad antes de crear/actualizar ventas
   */
  validateVentaIntegrity: async (req, res, next) => {
    try {
      const ventaData = req.body;
      
      // Validar datos básicos
      if (!ventaData.id_mesa || !ventaData.id_sucursal || !ventaData.id_restaurante) {
        return res.status(400).json({
          error: 'Datos incompletos',
          message: 'Se requieren id_mesa, id_sucursal e id_restaurante'
        });
      }

      // Ejecutar validación en tiempo real
      await integrityService.runRealTimeCheck('venta_created', ventaData);
      
      logger.debug(`✅ Venta validada para mesa ${ventaData.id_mesa}`);
      next();
      
    } catch (error) {
      logger.error('❌ Error en validación de integridad de venta:', error);
      return res.status(400).json({
        error: 'Error de validación',
        message: error.message
      });
    }
  },

  /**
   * Valida integridad antes de actualizar mesas
   */
  validateMesaIntegrity: async (req, res, next) => {
    try {
      const mesaData = req.body;
      
      // Validar datos básicos
      if (!mesaData.numero || !mesaData.id_restaurante) {
        return res.status(400).json({
          error: 'Datos incompletos',
          message: 'Se requieren numero e id_restaurante'
        });
      }

      // Ejecutar validación en tiempo real
      await integrityService.runRealTimeCheck('mesa_updated', mesaData);
      
      logger.debug(`✅ Mesa validada: ${mesaData.numero}`);
      next();
      
    } catch (error) {
      logger.error('❌ Error en validación de integridad de mesa:', error);
      return res.status(400).json({
        error: 'Error de validación',
        message: error.message
      });
    }
  },

  /**
   * Valida integridad antes de actualizar productos
   */
  validateProductoIntegrity: async (req, res, next) => {
    try {
      const productoData = req.body;
      
      // Validar datos básicos
      if (productoData.precio !== undefined && productoData.precio < 0) {
        return res.status(400).json({
          error: 'Precio inválido',
          message: 'El precio no puede ser negativo'
        });
      }

      // Ejecutar validación en tiempo real
      await integrityService.runRealTimeCheck('producto_updated', productoData);
      
      logger.debug(`✅ Producto validado: ${productoData.id_producto || 'nuevo'}`);
      next();
      
    } catch (error) {
      logger.error('❌ Error en validación de integridad de producto:', error);
      return res.status(400).json({
        error: 'Error de validación',
        message: error.message
      });
    }
  },

  /**
   * Middleware para verificar integridad del sistema periódicamente
   */
  periodicIntegrityCheck: async (req, res, next) => {
    try {
      // Solo ejecutar en ciertas rutas o bajo ciertas condiciones
      if (req.path.includes('/admin') || req.path.includes('/system')) {
        logger.debug('🔍 Ejecutando verificación periódica de integridad');
        
        // Ejecutar en background para no bloquear la respuesta
        setImmediate(async () => {
          try {
            const results = await integrityService.runAllIntegrityChecks();
            logger.info('✅ Verificación periódica completada', results.summary);
          } catch (error) {
            logger.error('❌ Error en verificación periódica:', error);
          }
        });
      }
      
      next();
      
    } catch (error) {
      logger.error('❌ Error en middleware de verificación periódica:', error);
      next(); // Continuar aunque falle la verificación
    }
  },

  /**
   * Middleware para validar respuesta de prefactura
   */
  validatePrefacturaResponse: async (req, res, next) => {
    try {
      // Interceptar la respuesta de generarPrefactura
      const originalSend = res.send;
      
      res.send = function(data) {
        try {
          // Validar que la respuesta contenga productos
          if (data && typeof data === 'object') {
            if (data.historial && Array.isArray(data.historial)) {
              const productosCount = data.historial.filter(item => item.nombre_producto).length;
              const totalCount = data.historial.length;
              
              if (productosCount === 0 && totalCount > 0) {
                logger.warn(`⚠️ PREFACTURA SIN PRODUCTOS: Mesa ${data.mesa?.id_mesa}, Total: $${data.total_acumulado}`);
                
                // Agregar alerta a la respuesta
                if (!data.warnings) data.warnings = [];
                data.warnings.push({
                  type: 'no_products',
                  message: 'La prefactura no muestra productos. Verificar integridad de datos.',
                  timestamp: new Date().toISOString()
                });
              }
            }
          }
        } catch (error) {
          logger.error('❌ Error validando respuesta de prefactura:', error);
        }
        
        // Llamar al método original
        return originalSend.call(this, data);
      };
      
      next();
      
    } catch (error) {
      logger.error('❌ Error en middleware de validación de prefactura:', error);
      next();
    }
  }
};

module.exports = integrityMiddleware;
