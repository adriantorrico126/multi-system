const { pool } = require('./src/config/database');
const logger = require('./src/config/logger');

/**
 * Script para implementar verificación de límites de recursos en tiempo real
 * Este script actualiza los contadores de uso y verifica límites
 */

/**
 * Actualizar contador de productos para un restaurante
 */
async function updateProductCount(restaurantId) {
  try {
    const countQuery = `
      SELECT COUNT(*) as total
      FROM productos 
      WHERE id_restaurante = $1 AND activo = true
    `;
    
    const { rows } = await pool.query(countQuery, [restaurantId]);
    const totalProducts = parseInt(rows[0].total);
    
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
    
    await pool.query(updateQuery, [restaurantId, totalProducts]);
    logger.info(`Contador de productos actualizado para restaurante ${restaurantId}: ${totalProducts}`);
    
    return totalProducts;
  } catch (error) {
    logger.error(`Error actualizando contador de productos para restaurante ${restaurantId}:`, error);
    throw error;
  }
}

/**
 * Actualizar contador de usuarios para un restaurante
 */
async function updateUserCount(restaurantId) {
  try {
    const countQuery = `
      SELECT COUNT(*) as total
      FROM vendedores 
      WHERE id_restaurante = $1 AND activo = true
    `;
    
    const { rows } = await pool.query(countQuery, [restaurantId]);
    const totalUsers = parseInt(rows[0].total);
    
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
    
    await pool.query(updateQuery, [restaurantId, totalUsers]);
    logger.info(`Contador de usuarios actualizado para restaurante ${restaurantId}: ${totalUsers}`);
    
    return totalUsers;
  } catch (error) {
    logger.error(`Error actualizando contador de usuarios para restaurante ${restaurantId}:`, error);
    throw error;
  }
}

/**
 * Actualizar contador de sucursales para un restaurante
 */
async function updateSucursalCount(restaurantId) {
  try {
    const countQuery = `
      SELECT COUNT(*) as total
      FROM sucursales 
      WHERE id_restaurante = $1 AND activo = true
    `;
    
    const { rows } = await pool.query(countQuery, [restaurantId]);
    const totalSucursales = parseInt(rows[0].total);
    
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
    
    await pool.query(updateQuery, [restaurantId, totalSucursales]);
    logger.info(`Contador de sucursales actualizado para restaurante ${restaurantId}: ${totalSucursales}`);
    
    return totalSucursales;
  } catch (error) {
    logger.error(`Error actualizando contador de sucursales para restaurante ${restaurantId}:`, error);
    throw error;
  }
}

/**
 * Actualizar contador de transacciones mensuales para un restaurante
 */
async function updateTransactionCount(restaurantId) {
  try {
    const countQuery = `
      SELECT COUNT(*) as total
      FROM ventas 
      WHERE id_restaurante = $1 
      AND EXTRACT(MONTH FROM fecha_venta) = EXTRACT(MONTH FROM CURRENT_DATE)
      AND EXTRACT(YEAR FROM fecha_venta) = EXTRACT(YEAR FROM CURRENT_DATE)
    `;
    
    const { rows } = await pool.query(countQuery, [restaurantId]);
    const totalTransactions = parseInt(rows[0].total);
    
    const updateQuery = `
      INSERT INTO uso_recursos (
        id_restaurante, 
        id_plan, 
        mes_medicion, 
        año_medicion, 
        transacciones_mes_actual
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
        transacciones_mes_actual = $2,
        updated_at = CURRENT_TIMESTAMP
    `;
    
    await pool.query(updateQuery, [restaurantId, totalTransactions]);
    logger.info(`Contador de transacciones actualizado para restaurante ${restaurantId}: ${totalTransactions}`);
    
    return totalTransactions;
  } catch (error) {
    logger.error(`Error actualizando contador de transacciones para restaurante ${restaurantId}:`, error);
    throw error;
  }
}

/**
 * Verificar límites de un restaurante
 */
async function checkRestaurantLimits(restaurantId) {
  try {
    // Obtener plan actual del restaurante
    const planQuery = `
      SELECT 
        p.id_plan,
        p.nombre as plan_nombre,
        p.max_sucursales,
        p.max_usuarios,
        p.max_productos,
        p.max_transacciones_mes,
        p.almacenamiento_gb
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
    
    // Verificar límites
    const limits = {
      productos: plan.max_productos,
      usuarios: plan.max_usuarios,
      sucursales: plan.max_sucursales,
      transacciones: plan.max_transacciones_mes,
      almacenamiento: plan.almacenamiento_gb * 1024 // Convertir GB a MB
    };
    
    const exceededLimits = [];
    
    // Verificar cada límite
    for (const [resource, limit] of Object.entries(limits)) {
      if (limit > 0 && usage[`${resource}_actuales`] >= limit) {
        exceededLimits.push({
          resource,
          current: usage[`${resource}_actuales`],
          limit: limit,
          percentage: Math.round((usage[`${resource}_actuales`] / limit) * 100)
        });
      }
    }
    
    return {
      restaurantId,
      plan: plan.plan_nombre,
      usage,
      limits,
      exceededLimits,
      isWithinLimits: exceededLimits.length === 0
    };
    
  } catch (error) {
    logger.error(`Error verificando límites para restaurante ${restaurantId}:`, error);
    throw error;
  }
}

/**
 * Actualizar todos los contadores para un restaurante
 */
async function updateAllCounters(restaurantId) {
  try {
    logger.info(`Actualizando todos los contadores para restaurante ${restaurantId}`);
    
    await Promise.all([
      updateProductCount(restaurantId),
      updateUserCount(restaurantId),
      updateSucursalCount(restaurantId),
      updateTransactionCount(restaurantId)
    ]);
    
    const limitsCheck = await checkRestaurantLimits(restaurantId);
    
    if (!limitsCheck.isWithinLimits) {
      logger.warn(`Restaurante ${restaurantId} ha excedido límites:`, limitsCheck.exceededLimits);
    }
    
    return limitsCheck;
    
  } catch (error) {
    logger.error(`Error actualizando contadores para restaurante ${restaurantId}:`, error);
    throw error;
  }
}

/**
 * Actualizar contadores para todos los restaurantes
 */
async function updateAllRestaurants() {
  try {
    logger.info('Iniciando actualización de contadores para todos los restaurantes');
    
    const restaurantsQuery = `
      SELECT id_restaurante, nombre_restaurante
      FROM restaurantes
      WHERE activo = true
    `;
    
    const { rows: restaurants } = await pool.query(restaurantsQuery);
    
    const results = [];
    
    for (const restaurant of restaurants) {
      try {
        const result = await updateAllCounters(restaurant.id_restaurante);
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
    
    logger.info(`Actualización completada para ${results.length} restaurantes`);
    
    // Mostrar resumen
    const exceededLimits = results.filter(r => !r.isWithinLimits);
    if (exceededLimits.length > 0) {
      logger.warn(`${exceededLimits.length} restaurantes han excedido límites:`);
      exceededLimits.forEach(r => {
        logger.warn(`- ${r.restaurantName} (${r.plan}): ${r.exceededLimits.map(l => `${l.resource}: ${l.current}/${l.limit}`).join(', ')}`);
      });
    }
    
    return results;
    
  } catch (error) {
    logger.error('Error actualizando contadores para todos los restaurantes:', error);
    throw error;
  }
}

/**
 * Función principal para ejecutar el script
 */
async function main() {
  try {
    console.log('🚀 Iniciando actualización de límites de recursos...');
    
    // Verificar conexión a la base de datos
    await pool.query('SELECT 1');
    console.log('✅ Conexión a base de datos establecida');
    
    // Actualizar todos los restaurantes
    const results = await updateAllRestaurants();
    
    console.log('✅ Actualización completada');
    console.log(`📊 Procesados: ${results.length} restaurantes`);
    
    const exceededLimits = results.filter(r => !r.isWithinLimits);
    if (exceededLimits.length > 0) {
      console.log(`⚠️  ${exceededLimits.length} restaurantes han excedido límites`);
    } else {
      console.log('✅ Todos los restaurantes están dentro de sus límites');
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
  updateProductCount,
  updateUserCount,
  updateSucursalCount,
  updateTransactionCount,
  checkRestaurantLimits,
  updateAllCounters,
  updateAllRestaurants
};

// Ejecutar si se llama directamente
if (require.main === module) {
  main();
}
