const db = require('../config/database');
const logger = require('../config/logger');

exports.getDashboardStats = async (req, res, next) => {
  try {
    const id_restaurante = req.user.id_restaurante;
    
    // Obtener estadísticas de ventas del día
    const ventasHoyQuery = `
      SELECT 
        COUNT(*) as total_ventas_hoy,
        COALESCE(SUM(total), 0) as total_ingresos_hoy,
        COALESCE(AVG(total), 0) as ticket_promedio_hoy
      FROM ventas 
      WHERE DATE(fecha) = CURRENT_DATE 
        AND id_restaurante = $1
        AND estado != 'cancelado'
    `;
    
    // Obtener estadísticas de productos
    const productosQuery = `
      SELECT 
        COUNT(*) as total_productos,
        COUNT(CASE WHEN activo = true THEN 1 END) as productos_activos,
        COUNT(CASE WHEN stock_actual <= 10 THEN 1 END) as productos_bajo_stock
      FROM productos 
      WHERE id_restaurante = $1
    `;
    
    // Obtener estadísticas de usuarios
    const usuariosQuery = `
      SELECT 
        COUNT(*) as total_usuarios,
        COUNT(CASE WHEN activo = true THEN 1 END) as usuarios_activos
      FROM vendedores 
      WHERE id_restaurante = $1
    `;
    
    // Obtener estadísticas de mesas
    const mesasQuery = `
      SELECT 
        COUNT(*) as total_mesas,
        COUNT(CASE WHEN estado = 'libre' THEN 1 END) as mesas_libres,
        COUNT(CASE WHEN estado = 'en_uso' THEN 1 END) as mesas_en_uso
      FROM mesas 
      WHERE id_restaurante = $1
    `;
    
    // Ejecutar todas las consultas
    const [ventasResult, productosResult, usuariosResult, mesasResult] = await Promise.all([
      db.query(ventasHoyQuery, [id_restaurante]),
      db.query(productosQuery, [id_restaurante]),
      db.query(usuariosQuery, [id_restaurante]),
      db.query(mesasQuery, [id_restaurante])
    ]);
    
    const stats = {
      ventas: ventasResult.rows[0],
      productos: productosResult.rows[0],
      usuarios: usuariosResult.rows[0],
      mesas: mesasResult.rows[0]
    };
    
    logger.info(`Estadísticas del dashboard obtenidas exitosamente para restaurante ${id_restaurante}.`);
    res.status(200).json({
      message: 'Estadísticas del dashboard obtenidas exitosamente.',
      data: stats
    });
  } catch (error) {
    logger.error('Error al obtener estadísticas del dashboard:', error);
    next(error);
  }
}; 