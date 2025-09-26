const { pool } = require('../config/database');
const logger = require('../config/logger');

/**
 * CONTROLADOR DE ANALYTICS AVANZADOS
 * Proporciona funcionalidades avanzadas de análisis para el historial de ventas
 */

// Obtener métricas avanzadas de ventas
exports.getAdvancedSalesMetrics = async (req, res, next) => {
  try {
    const { 
      fechaInicio, 
      fechaFin, 
      id_sucursal, 
      id_vendedor, 
      tipo_servicio,
      comparar_periodo = false 
    } = req.query;
    
    const id_restaurante = req.user.id_restaurante;
    
    // Construir query base
    let whereConditions = ['v.id_restaurante = $1'];
    let params = [id_restaurante];
    let paramIndex = 2;
    
    // Agregar filtros
    if (fechaInicio) {
      whereConditions.push(`v.fecha >= $${paramIndex}`);
      params.push(fechaInicio);
      paramIndex++;
    }
    
    if (fechaFin) {
      whereConditions.push(`v.fecha <= $${paramIndex}`);
      params.push(fechaFin + ' 23:59:59');
      paramIndex++;
    }
    
    if (id_sucursal && id_sucursal !== 'all') {
      whereConditions.push(`v.id_sucursal = $${paramIndex}`);
      params.push(id_sucursal);
      paramIndex++;
    }
    
    if (id_vendedor && id_vendedor !== 'all') {
      whereConditions.push(`v.id_vendedor = $${paramIndex}`);
      params.push(id_vendedor);
      paramIndex++;
    }
    
    if (tipo_servicio && tipo_servicio !== 'all') {
      whereConditions.push(`v.tipo_servicio = $${paramIndex}`);
      params.push(tipo_servicio);
      paramIndex++;
    }
    
    const whereClause = whereConditions.join(' AND ');
    
    // Query principal para métricas
    const metricsQuery = `
      WITH ventas_filtradas AS (
        SELECT 
          v.*,
          vend.nombre as nombre_vendedor,
          s.nombre as nombre_sucursal
        FROM ventas v
        LEFT JOIN vendedores vend ON v.id_vendedor = vend.id_vendedor
        LEFT JOIN sucursales s ON v.id_sucursal = s.id_sucursal
        WHERE ${whereClause}
          AND v.estado IN ('completada', 'entregado', 'pagado')
      ),
      metricas_basicas AS (
        SELECT 
          COUNT(*) as total_ventas,
          COALESCE(SUM(total), 0) as ingresos_totales,
          COALESCE(AVG(total), 0) as ticket_promedio,
          MIN(total) as venta_minima,
          MAX(total) as venta_maxima,
          COUNT(DISTINCT id_vendedor) as vendedores_activos,
          COUNT(DISTINCT id_sucursal) as sucursales_activas,
          COUNT(DISTINCT DATE(fecha)) as dias_con_ventas
        FROM ventas_filtradas
      ),
      ventas_por_dia AS (
        SELECT 
          DATE(fecha) as fecha,
          COUNT(*) as ventas_dia,
          SUM(total) as ingresos_dia
        FROM ventas_filtradas
        GROUP BY DATE(fecha)
        ORDER BY fecha
      ),
      ventas_por_hora AS (
        SELECT 
          EXTRACT(HOUR FROM fecha) as hora,
          COUNT(*) as ventas_hora,
          SUM(total) as ingresos_hora,
          AVG(total) as promedio_hora
        FROM ventas_filtradas
        GROUP BY EXTRACT(HOUR FROM fecha)
        ORDER BY hora
      ),
      top_vendedores AS (
        SELECT 
          id_vendedor,
          nombre_vendedor,
          COUNT(*) as ventas,
          SUM(total) as ingresos,
          AVG(total) as promedio_venta,
          RANK() OVER (ORDER BY SUM(total) DESC) as ranking
        FROM ventas_filtradas
        WHERE id_vendedor IS NOT NULL
        GROUP BY id_vendedor, nombre_vendedor
        ORDER BY ingresos DESC
        LIMIT 10
      ),
      ventas_por_tipo_servicio AS (
        SELECT 
          tipo_servicio,
          COUNT(*) as cantidad,
          SUM(total) as ingresos,
          AVG(total) as promedio,
          ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM ventas_filtradas)), 2) as porcentaje
        FROM ventas_filtradas
        GROUP BY tipo_servicio
        ORDER BY ingresos DESC
      )
      SELECT 
        (SELECT row_to_json(metricas_basicas) FROM metricas_basicas) as metricas_generales,
        (SELECT json_agg(ventas_por_dia ORDER BY fecha) FROM ventas_por_dia) as tendencia_diaria,
        (SELECT json_agg(ventas_por_hora ORDER BY hora) FROM ventas_por_hora) as distribucion_horaria,
        (SELECT json_agg(top_vendedores ORDER BY ranking) FROM top_vendedores) as top_vendedores,
        (SELECT json_agg(ventas_por_tipo_servicio ORDER BY ingresos DESC) FROM ventas_por_tipo_servicio) as por_tipo_servicio
    `;
    
    const result = await pool.query(metricsQuery, params);
    const metrics = result.rows[0];
    
    // Si se solicita comparación de período
    let comparacion = null;
    if (comparar_periodo === 'true' && fechaInicio && fechaFin) {
      const startDate = new Date(fechaInicio);
      const endDate = new Date(fechaFin);
      const diffTime = Math.abs(endDate - startDate);
      
      // Calcular período anterior
      const periodoAnteriorFin = new Date(startDate);
      periodoAnteriorFin.setMilliseconds(periodoAnteriorFin.getMilliseconds() - 1);
      const periodoAnteriorInicio = new Date(periodoAnteriorFin);
      periodoAnteriorInicio.setMilliseconds(periodoAnteriorInicio.getMilliseconds() - diffTime);
      
      // Query para período anterior
      const paramsComparacion = [
        id_restaurante,
        periodoAnteriorInicio.toISOString().split('T')[0],
        periodoAnteriorFin.toISOString().split('T')[0] + ' 23:59:59'
      ];
      
      // Agregar filtros adicionales para comparación
      let paramIndexComp = 4;
      let whereConditionsComp = ['v.id_restaurante = $1', 'v.fecha >= $2', 'v.fecha <= $3'];
      
      if (id_sucursal && id_sucursal !== 'all') {
        whereConditionsComp.push(`v.id_sucursal = $${paramIndexComp}`);
        paramsComparacion.push(id_sucursal);
        paramIndexComp++;
      }
      
      if (id_vendedor && id_vendedor !== 'all') {
        whereConditionsComp.push(`v.id_vendedor = $${paramIndexComp}`);
        paramsComparacion.push(id_vendedor);
        paramIndexComp++;
      }
      
      if (tipo_servicio && tipo_servicio !== 'all') {
        whereConditionsComp.push(`v.tipo_servicio = $${paramIndexComp}`);
        paramsComparacion.push(tipo_servicio);
        paramIndexComp++;
      }
      
      const whereClauseComp = whereConditionsComp.join(' AND ');
      
      const comparacionQuery = `
        SELECT 
          COUNT(*) as total_ventas,
          COALESCE(SUM(total), 0) as ingresos_totales,
          COALESCE(AVG(total), 0) as ticket_promedio
        FROM ventas v
        WHERE ${whereClauseComp}
          AND v.estado IN ('completada', 'entregado', 'pagado')
      `;
      
      const resultComparacion = await pool.query(comparacionQuery, paramsComparacion);
      const metricsAnterior = resultComparacion.rows[0];
      
      // Calcular variaciones
      const ventasActuales = metrics.metricas_generales.total_ventas;
      const ventasAnteriores = parseInt(metricsAnterior.total_ventas);
      const ingresosActuales = parseFloat(metrics.metricas_generales.ingresos_totales);
      const ingresosAnteriores = parseFloat(metricsAnterior.ingresos_totales);
      
      comparacion = {
        periodo_anterior: {
          fecha_inicio: periodoAnteriorInicio.toISOString().split('T')[0],
          fecha_fin: periodoAnteriorFin.toISOString().split('T')[0],
          total_ventas: ventasAnteriores,
          ingresos_totales: ingresosAnteriores,
          ticket_promedio: parseFloat(metricsAnterior.ticket_promedio)
        },
        variaciones: {
          ventas: {
            absoluta: ventasActuales - ventasAnteriores,
            porcentual: ventasAnteriores > 0 ? ((ventasActuales - ventasAnteriores) / ventasAnteriores * 100).toFixed(2) : 0
          },
          ingresos: {
            absoluta: (ingresosActuales - ingresosAnteriores).toFixed(2),
            porcentual: ingresosAnteriores > 0 ? ((ingresosActuales - ingresosAnteriores) / ingresosAnteriores * 100).toFixed(2) : 0
          }
        }
      };
    }
    
    logger.info('Métricas avanzadas obtenidas exitosamente', {
      id_restaurante,
      filtros: { fechaInicio, fechaFin, id_sucursal, id_vendedor, tipo_servicio },
      total_ventas: metrics.metricas_generales.total_ventas
    });
    
    res.status(200).json({
      message: 'Métricas avanzadas obtenidas exitosamente',
      data: {
        ...metrics,
        comparacion,
        filtros_aplicados: {
          fecha_inicio: fechaInicio,
          fecha_fin: fechaFin,
          id_sucursal,
          id_vendedor,
          tipo_servicio
        }
      }
    });
    
  } catch (error) {
    logger.error('Error al obtener métricas avanzadas:', error);
    next(error);
  }
};

// Obtener análisis avanzado de productos
exports.getProductAnalytics = async (req, res, next) => {
  try {
    console.log('🔍 Iniciando análisis de productos...');
    
    const { 
      fechaInicio, 
      fechaFin, 
      id_sucursal, 
      id_categoria,
      id_producto,
      precio_min,
      precio_max,
      estado_producto,
      filtro_ventas,
      filtro_ingresos,
      limit = 50,
      orden = 'cantidad',
      direccion = 'desc',
      incluir_tendencias = 'true'
    } = req.query;
    
    const id_restaurante = req.user.id_restaurante;
    console.log('📊 Parámetros recibidos:', { fechaInicio, fechaFin, id_sucursal, id_categoria, limit, orden, incluir_tendencias });
    
    let whereConditions = ['(v.id_restaurante = $1 OR v.id_restaurante IS NULL)'];
    let params = [id_restaurante];
    let paramIndex = 2;
    
    if (fechaInicio) {
      whereConditions.push(`v.fecha >= $${paramIndex}`);
      params.push(fechaInicio);
      paramIndex++;
    }
    
    if (fechaFin) {
      whereConditions.push(`v.fecha <= $${paramIndex}`);
      params.push(fechaFin + ' 23:59:59');
      paramIndex++;
    }
    
    if (id_sucursal && id_sucursal !== 'all') {
      whereConditions.push(`v.id_sucursal = $${paramIndex}`);
      params.push(id_sucursal);
      paramIndex++;
    }
    
    if (id_categoria) {
      whereConditions.push(`p.id_categoria = $${paramIndex}`);
      params.push(id_categoria);
      paramIndex++;
    }
    
    const whereClause = whereConditions.join(' AND ');
    
    // Query simplificado para análisis de productos
    const productAnalyticsQuery = `
      SELECT 
        p.id_producto,
        p.nombre as producto,
        p.precio as precio_venta,
        c.id_categoria,
        c.nombre as categoria,
        p.activo,
        COALESCE(SUM(dv.cantidad), 0) as cantidad_vendida_final,
        COALESCE(SUM(dv.subtotal), 0) as ingresos_totales_final,
        COALESCE(COUNT(DISTINCT v.id_venta), 0) as ventas_asociadas_final,
        COALESCE(AVG(dv.precio_unitario), p.precio) as precio_promedio_vendido,
        CASE 
          WHEN SUM(dv.cantidad) > 0 THEN 
            ROUND((SUM(dv.subtotal) / SUM(dv.cantidad)), 2)
          ELSE p.precio
        END as ticket_promedio_producto,
        CASE 
          WHEN COUNT(DISTINCT DATE(v.fecha)) > 0 THEN 
            ROUND((SUM(dv.cantidad)::DECIMAL / COUNT(DISTINCT DATE(v.fecha))), 2)
          ELSE 0 
        END as promedio_diario,
        CASE 
          WHEN COUNT(DISTINCT v.id_venta) > 0 THEN 
            ROUND((SUM(dv.cantidad)::DECIMAL / COUNT(DISTINCT v.id_venta)), 2)
          ELSE 0 
        END as promedio_por_venta,
        MIN(v.fecha) as primera_venta,
        MAX(v.fecha) as ultima_venta,
        COUNT(DISTINCT DATE(v.fecha)) as dias_vendido,
        RANK() OVER (ORDER BY COALESCE(SUM(dv.cantidad), 0) DESC) as ranking_cantidad,
        RANK() OVER (ORDER BY COALESCE(SUM(dv.subtotal), 0) DESC) as ranking_ingresos,
        RANK() OVER (ORDER BY COALESCE(COUNT(DISTINCT v.id_venta), 0) DESC) as ranking_frecuencia
      FROM productos p
      LEFT JOIN categorias c ON p.id_categoria = c.id_categoria
      LEFT JOIN detalle_ventas dv ON p.id_producto = dv.id_producto
      LEFT JOIN ventas v ON dv.id_venta = v.id_venta 
        AND v.id_restaurante = $1 
        AND v.estado IN ('completada', 'entregado', 'pagado')
        ${fechaInicio ? `AND v.fecha >= '${fechaInicio}'` : ''}
        ${fechaFin ? `AND v.fecha <= '${fechaFin} 23:59:59'` : ''}
        ${id_sucursal ? `AND v.id_sucursal = ${id_sucursal}` : ''}
        ${id_categoria ? `AND p.id_categoria = ${id_categoria}` : ''}
        ${id_producto ? `AND p.id_producto = ${id_producto}` : ''}
      WHERE p.id_restaurante = $1
        ${precio_min ? `AND p.precio >= ${parseFloat(precio_min)}` : ''}
        ${precio_max ? `AND p.precio <= ${parseFloat(precio_max)}` : ''}
        ${estado_producto === 'activo' ? 'AND p.activo = true' : ''}
        ${estado_producto === 'inactivo' ? 'AND p.activo = false' : ''}
      GROUP BY p.id_producto, p.nombre, c.id_categoria, c.nombre, p.precio, p.activo
      ORDER BY 
        ${orden === 'cantidad' ? `COALESCE(SUM(dv.cantidad), 0) ${direccion.toUpperCase()}` :
          orden === 'ingresos' ? `COALESCE(SUM(dv.subtotal), 0) ${direccion.toUpperCase()}` :
          orden === 'frecuencia' ? `COALESCE(COUNT(DISTINCT v.id_venta), 0) ${direccion.toUpperCase()}` :
          orden === 'ticket' ? `CASE WHEN SUM(dv.cantidad) > 0 THEN ROUND((SUM(dv.subtotal) / SUM(dv.cantidad)), 2) ELSE p.precio END ${direccion.toUpperCase()}` :
          orden === 'diario' ? `CASE WHEN COUNT(DISTINCT DATE(v.fecha)) > 0 THEN ROUND((SUM(dv.cantidad)::DECIMAL / COUNT(DISTINCT DATE(v.fecha))), 2) ELSE 0 END ${direccion.toUpperCase()}` :
          orden === 'precio' ? `p.precio ${direccion.toUpperCase()}` :
          `COALESCE(SUM(dv.cantidad), 0) ${direccion.toUpperCase()}`}
      LIMIT ${parseInt(limit)}
    `;
    
    console.log('🔍 Ejecutando consulta de productos...');
    console.log('Query:', productAnalyticsQuery.substring(0, 200) + '...');
    console.log('Parámetros:', [id_restaurante]);
    
    const result = await pool.query(productAnalyticsQuery, [id_restaurante]);
    console.log('✅ Consulta de productos exitosa, filas:', result.rows.length);
    
    // Si hay error, devolver datos básicos para debug
    if (!result || !result.rows) {
      console.log('⚠️ No hay datos de productos, devolviendo datos de prueba...');
      return res.status(200).json({
        message: 'Análisis de productos obtenido exitosamente',
        data: {
          productos: [],
          categorias: [],
          tendencias: null,
          metricas_generales: {
            total_productos: 0,
            productos_vendidos: 0,
            total_categorias: 0,
            cantidad_total_vendida: 0,
            ingresos_totales: 0,
            precio_promedio_general: 0,
            producto_mas_vendido_cantidad: 0,
            producto_mas_vendido_ingresos: 0
          },
          filtros_aplicados: {
            fecha_inicio: fechaInicio,
            fecha_fin: fechaFin,
            id_sucursal,
            id_categoria,
            limit,
            orden,
            incluir_tendencias
          }
        }
      });
    }
    
    // Calcular porcentajes para productos
    const totalCantidad = result.rows.reduce((sum, prod) => sum + parseFloat(prod.cantidad_vendida_final || 0), 0);
    const totalIngresosProductos = result.rows.reduce((sum, prod) => sum + parseFloat(prod.ingresos_totales_final || 0), 0);
    const totalFrecuencia = result.rows.reduce((sum, prod) => sum + parseFloat(prod.ventas_asociadas_final || 0), 0);
    
    let productosConPorcentajes = result.rows.map(prod => ({
      ...prod,
      porcentaje_cantidad: totalCantidad > 0 ? parseFloat(((parseFloat(prod.cantidad_vendida_final || 0) / totalCantidad) * 100).toFixed(2)) : 0,
      porcentaje_ingresos: totalIngresosProductos > 0 ? parseFloat(((parseFloat(prod.ingresos_totales_final || 0) / totalIngresosProductos) * 100).toFixed(2)) : 0,
      porcentaje_frecuencia: totalFrecuencia > 0 ? parseFloat(((parseFloat(prod.ventas_asociadas_final || 0) / totalFrecuencia) * 100).toFixed(2)) : 0
    }));

    // Aplicar filtros adicionales después de la consulta SQL
    if (filtro_ventas === 'vendidos') {
      productosConPorcentajes = productosConPorcentajes.filter(prod => parseFloat(prod.cantidad_vendida_final || 0) > 0);
    } else if (filtro_ventas === 'no_vendidos') {
      productosConPorcentajes = productosConPorcentajes.filter(prod => parseFloat(prod.cantidad_vendida_final || 0) === 0);
    }

    if (filtro_ingresos === 'alto') {
      productosConPorcentajes = productosConPorcentajes.filter(prod => parseFloat(prod.ingresos_totales_final || 0) > 500);
    } else if (filtro_ingresos === 'medio') {
      productosConPorcentajes = productosConPorcentajes.filter(prod => {
        const ingresos = parseFloat(prod.ingresos_totales_final || 0);
        return ingresos >= 100 && ingresos <= 500;
      });
    } else if (filtro_ingresos === 'bajo') {
      productosConPorcentajes = productosConPorcentajes.filter(prod => parseFloat(prod.ingresos_totales_final || 0) < 100);
    }
    
    // Análisis simplificado por categorías
    const categoryAnalyticsQuery = `
      SELECT 
        COALESCE(c.nombre, 'Sin categoría') as categoria,
        c.id_categoria,
        COUNT(DISTINCT p.id_producto) as productos_totales,
        COUNT(DISTINCT CASE WHEN dv.id_detalle IS NOT NULL THEN p.id_producto END) as productos_vendidos,
        COALESCE(SUM(dv.cantidad), 0) as cantidad_total,
        COALESCE(SUM(dv.subtotal), 0) as ingresos_totales,
        COALESCE(AVG(dv.precio_unitario), AVG(p.precio)) as precio_promedio,
        CASE 
          WHEN SUM(dv.cantidad) > 0 THEN 
            ROUND((SUM(dv.subtotal) / SUM(dv.cantidad)), 2)
          ELSE AVG(p.precio)
        END as ticket_promedio_categoria,
        COUNT(DISTINCT v.id_venta) as total_ventas_categoria,
        CASE 
          WHEN COUNT(DISTINCT p.id_producto) > 0 THEN 
            ROUND((COUNT(DISTINCT CASE WHEN dv.id_detalle IS NOT NULL THEN p.id_producto END)::DECIMAL / COUNT(DISTINCT p.id_producto) * 100), 2)
          ELSE 0 
        END as tasa_conversion
      FROM categorias c
      LEFT JOIN productos p ON c.id_categoria = p.id_categoria AND p.id_restaurante = $1
      LEFT JOIN detalle_ventas dv ON p.id_producto = dv.id_producto
      LEFT JOIN ventas v ON dv.id_venta = v.id_venta 
        AND v.id_restaurante = $1 
        AND v.estado IN ('completada', 'entregado', 'pagado')
      GROUP BY c.id_categoria, c.nombre
      ORDER BY ingresos_totales DESC
    `;
    
    console.log('🔍 Ejecutando consulta de categorías...');
    const categoryResult = await pool.query(categoryAnalyticsQuery, [id_restaurante]);
    console.log('✅ Consulta de categorías exitosa, filas:', categoryResult.rows.length);
    
    // Calcular porcentajes para categorías
    const totalIngresos = categoryResult.rows.reduce((sum, cat) => sum + parseFloat(cat.ingresos_totales || 0), 0);
    const categoriasConPorcentajes = categoryResult.rows.map(cat => ({
      ...cat,
      porcentaje_ingresos: totalIngresos > 0 ? parseFloat(((parseFloat(cat.ingresos_totales || 0) / totalIngresos) * 100).toFixed(2)) : 0
    }));
    
    // Análisis de tendencias por producto (si se solicita)
    let tendenciasResult = null;
    if (incluir_tendencias === 'true' && fechaInicio && fechaFin) {
      const tendenciasQuery = `
        WITH tendencias_productos AS (
          SELECT 
            p.id_producto,
            p.nombre as producto,
            DATE(v.fecha) as fecha_venta,
            SUM(dv.cantidad) as cantidad_dia,
            SUM(dv.subtotal) as ingresos_dia
          FROM productos p
          JOIN detalle_ventas dv ON p.id_producto = dv.id_producto
          JOIN ventas v ON dv.id_venta = v.id_venta
          WHERE v.id_restaurante = $1
            AND v.estado IN ('completada', 'entregado', 'pagado')
            AND v.fecha >= '${fechaInicio}'
            AND v.fecha <= '${fechaFin} 23:59:59'
            ${id_sucursal ? `AND v.id_sucursal = ${id_sucursal}` : ''}
          GROUP BY p.id_producto, p.nombre, DATE(v.fecha)
        ),
        productos_top AS (
          SELECT id_producto, producto
          FROM tendencias_productos
          GROUP BY id_producto, producto
          ORDER BY SUM(cantidad_dia) DESC
          LIMIT 10
        )
        SELECT 
          pt.producto,
          tp.fecha_venta,
          tp.cantidad_dia,
          tp.ingresos_dia
        FROM productos_top pt
        JOIN tendencias_productos tp ON pt.id_producto = tp.id_producto
        ORDER BY pt.producto, tp.fecha_venta
      `;
      
      tendenciasResult = await pool.query(tendenciasQuery, [id_restaurante]);
    }
    
    // Métricas generales simplificadas
    const metricsQuery = `
      SELECT 
        COUNT(DISTINCT p.id_producto) as total_productos,
        COUNT(DISTINCT CASE WHEN dv.id_detalle IS NOT NULL THEN p.id_producto END) as productos_vendidos,
        COUNT(DISTINCT c.id_categoria) as total_categorias,
        COALESCE(SUM(dv.cantidad), 0) as cantidad_total_vendida,
        COALESCE(SUM(dv.subtotal), 0) as ingresos_totales,
        COALESCE(AVG(dv.precio_unitario), AVG(p.precio)) as precio_promedio_general,
        COALESCE(MAX(dv.cantidad), 0) as producto_mas_vendido_cantidad,
        COALESCE(MAX(dv.subtotal), 0) as producto_mas_vendido_ingresos
      FROM productos p
      LEFT JOIN categorias c ON p.id_categoria = c.id_categoria
      LEFT JOIN detalle_ventas dv ON p.id_producto = dv.id_producto
      LEFT JOIN ventas v ON dv.id_venta = v.id_venta 
        AND v.id_restaurante = $1 
        AND v.estado IN ('completada', 'entregado', 'pagado')
      WHERE p.id_restaurante = $1
    `;
    
    console.log('🔍 Ejecutando consulta de métricas...');
    const metricsResult = await pool.query(metricsQuery, [id_restaurante]);
    console.log('✅ Consulta de métricas exitosa');
    
    logger.info('Análisis avanzado de productos obtenido exitosamente', {
      id_restaurante,
      total_productos: result.rows.length,
      total_categorias: categoryResult.rows.length,
      incluir_tendencias: incluir_tendencias === 'true'
    });
    
    // Log para debug del pie chart
    console.log('📊 Datos de categorías para pie chart:', JSON.stringify(categoriasConPorcentajes.slice(0, 3), null, 2));
    
    res.status(200).json({
      message: 'Análisis avanzado de productos obtenido exitosamente',
      data: {
        productos: productosConPorcentajes,
        categorias: categoriasConPorcentajes,
        tendencias: tendenciasResult ? tendenciasResult.rows : null,
        metricas_generales: metricsResult.rows[0],
        filtros_aplicados: {
          fecha_inicio: fechaInicio,
          fecha_fin: fechaFin,
          id_sucursal,
          id_categoria,
          limit,
          orden,
          incluir_tendencias
        }
      }
    });
    
  } catch (error) {
    logger.error('Error al obtener análisis avanzado de productos:', error);
    next(error);
  }
};

// Obtener tendencias temporales detalladas
exports.getTimeTrends = async (req, res, next) => {
  try {
    const { fechaInicio, fechaFin, id_sucursal, granularidad = 'dia' } = req.query;
    const id_restaurante = req.user.id_restaurante;
    
    let whereConditions = ['v.id_restaurante = $1'];
    let params = [id_restaurante];
    let paramIndex = 2;
    
    if (fechaInicio) {
      whereConditions.push(`v.fecha >= $${paramIndex}`);
      params.push(fechaInicio);
      paramIndex++;
    }
    
    if (fechaFin) {
      whereConditions.push(`v.fecha <= $${paramIndex}`);
      params.push(fechaFin + ' 23:59:59');
      paramIndex++;
    }
    
    if (id_sucursal && id_sucursal !== 'all') {
      whereConditions.push(`v.id_sucursal = $${paramIndex}`);
      params.push(id_sucursal);
      paramIndex++;
    }
    
    const whereClause = whereConditions.join(' AND ');
    
    // Determinar la función de agrupación según granularidad
    let dateGrouping;
    let dateLabel;
    
    switch (granularidad) {
      case 'hora':
        dateGrouping = "DATE_TRUNC('hour', v.fecha)";
        dateLabel = "TO_CHAR(DATE_TRUNC('hour', v.fecha), 'YYYY-MM-DD HH24:00')";
        break;
      case 'dia':
        dateGrouping = "DATE_TRUNC('day', v.fecha)";
        dateLabel = "TO_CHAR(DATE_TRUNC('day', v.fecha), 'YYYY-MM-DD')";
        break;
      case 'semana':
        dateGrouping = "DATE_TRUNC('week', v.fecha)";
        dateLabel = "TO_CHAR(DATE_TRUNC('week', v.fecha), 'YYYY-MM-DD')";
        break;
      case 'mes':
        dateGrouping = "DATE_TRUNC('month', v.fecha)";
        dateLabel = "TO_CHAR(DATE_TRUNC('month', v.fecha), 'YYYY-MM')";
        break;
      default:
        dateGrouping = "DATE_TRUNC('day', v.fecha)";
        dateLabel = "TO_CHAR(DATE_TRUNC('day', v.fecha), 'YYYY-MM-DD')";
    }
    
    const trendsQuery = `
      WITH tendencias AS (
        SELECT 
          ${dateGrouping} as periodo,
          ${dateLabel} as etiqueta_periodo,
          COUNT(*) as total_ventas,
          SUM(v.total) as ingresos_totales,
          AVG(v.total) as ticket_promedio,
          COUNT(DISTINCT v.id_vendedor) as vendedores_activos,
          MIN(v.total) as venta_minima,
          MAX(v.total) as venta_maxima
        FROM ventas v
        WHERE ${whereClause}
          AND v.estado IN ('completada', 'entregado', 'pagado')
        GROUP BY ${dateGrouping}
        ORDER BY periodo
      ),
      tendencias_con_variacion AS (
        SELECT 
          *,
          LAG(total_ventas) OVER (ORDER BY periodo) as ventas_periodo_anterior,
          LAG(ingresos_totales) OVER (ORDER BY periodo) as ingresos_periodo_anterior
        FROM tendencias
      )
      SELECT 
        etiqueta_periodo,
        total_ventas,
        ingresos_totales,
        ticket_promedio,
        vendedores_activos,
        venta_minima,
        venta_maxima,
        CASE 
          WHEN ventas_periodo_anterior IS NOT NULL AND ventas_periodo_anterior > 0 
          THEN ROUND(((total_ventas - ventas_periodo_anterior) * 100.0 / ventas_periodo_anterior), 2)
          ELSE NULL 
        END as variacion_ventas_porcentual,
        CASE 
          WHEN ingresos_periodo_anterior IS NOT NULL AND ingresos_periodo_anterior > 0 
          THEN ROUND(((ingresos_totales - ingresos_periodo_anterior) * 100.0 / ingresos_periodo_anterior), 2)
          ELSE NULL 
        END as variacion_ingresos_porcentual
      FROM tendencias_con_variacion
      ORDER BY periodo
    `;
    
    const result = await pool.query(trendsQuery, params);
    
    logger.info('Tendencias temporales obtenidas exitosamente', {
      id_restaurante,
      granularidad,
      total_periodos: result.rows.length
    });
    
    res.status(200).json({
      message: 'Tendencias temporales obtenidas exitosamente',
      data: {
        tendencias: result.rows,
        granularidad,
        filtros_aplicados: {
          fecha_inicio: fechaInicio,
          fecha_fin: fechaFin,
          id_sucursal,
          granularidad
        }
      }
    });
    
  } catch (error) {
    logger.error('Error al obtener tendencias temporales:', error);
    next(error);
  }
};

// Exportar datos para análisis externo
exports.exportAdvancedData = async (req, res, next) => {
  try {
    const { 
      fechaInicio, 
      fechaFin, 
      id_sucursal, 
      formato = 'json',
      incluir_detalles = 'true' 
    } = req.query;
    
    const id_restaurante = req.user.id_restaurante;
    
    let whereConditions = ['v.id_restaurante = $1'];
    let params = [id_restaurante];
    let paramIndex = 2;
    
    if (fechaInicio) {
      whereConditions.push(`v.fecha >= $${paramIndex}`);
      params.push(fechaInicio);
      paramIndex++;
    }
    
    if (fechaFin) {
      whereConditions.push(`v.fecha <= $${paramIndex}`);
      params.push(fechaFin + ' 23:59:59');
      paramIndex++;
    }
    
    if (id_sucursal && id_sucursal !== 'all') {
      whereConditions.push(`v.id_sucursal = $${paramIndex}`);
      params.push(id_sucursal);
      paramIndex++;
    }
    
    const whereClause = whereConditions.join(' AND ');
    
    const exportQuery = incluir_detalles === 'true' ? `
      SELECT 
        v.id_venta,
        v.fecha,
        v.total,
        v.estado,
        v.tipo_servicio,
        v.mesa_numero,
        vend.nombre as vendedor,
        s.nombre as sucursal,
        mp.descripcion as metodo_pago,
        json_agg(
          json_build_object(
            'producto', p.nombre,
            'categoria', c.nombre,
            'cantidad', dv.cantidad,
            'precio_unitario', dv.precio_unitario,
            'subtotal', dv.subtotal,
            'observaciones', dv.observaciones
          )
        ) as productos
      FROM ventas v
      LEFT JOIN vendedores vend ON v.id_vendedor = vend.id_vendedor
      LEFT JOIN sucursales s ON v.id_sucursal = s.id_sucursal
      LEFT JOIN metodos_pago mp ON v.id_pago = mp.id_pago
      LEFT JOIN detalle_ventas dv ON v.id_venta = dv.id_venta
      LEFT JOIN productos p ON dv.id_producto = p.id_producto
      LEFT JOIN categorias c ON p.id_categoria = c.id_categoria
      WHERE ${whereClause}
        AND v.estado IN ('completada', 'entregado', 'pagado')
      GROUP BY v.id_venta, v.fecha, v.total, v.estado, v.tipo_servicio, 
               v.mesa_numero, vend.nombre, s.nombre, mp.descripcion
      ORDER BY v.fecha DESC
    ` : `
      SELECT 
        v.id_venta,
        v.fecha,
        v.total,
        v.estado,
        v.tipo_servicio,
        v.mesa_numero,
        vend.nombre as vendedor,
        s.nombre as sucursal,
        mp.descripcion as metodo_pago
      FROM ventas v
      LEFT JOIN vendedores vend ON v.id_vendedor = vend.id_vendedor
      LEFT JOIN sucursales s ON v.id_sucursal = s.id_sucursal
      LEFT JOIN metodos_pago mp ON v.id_pago = mp.id_pago
      WHERE ${whereClause}
        AND v.estado IN ('completada', 'entregado', 'pagado')
      ORDER BY v.fecha DESC
    `;
    
    const result = await pool.query(exportQuery, params);
    
    logger.info('Datos exportados exitosamente', {
      id_restaurante,
      formato,
      total_registros: result.rows.length,
      incluir_detalles
    });
    
    // Configurar headers según el formato
    if (formato === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=ventas_avanzadas.csv');
      
      // Convertir a CSV (implementación básica)
      const csv = result.rows.map(row => {
        return Object.values(row).map(val => 
          typeof val === 'object' ? JSON.stringify(val) : val
        ).join(',');
      }).join('\n');
      
      const headers = Object.keys(result.rows[0] || {}).join(',');
      res.send(headers + '\n' + csv);
    } else {
      res.status(200).json({
        message: 'Datos exportados exitosamente',
        data: result.rows,
        metadatos: {
          total_registros: result.rows.length,
          fecha_exportacion: new Date().toISOString(),
          filtros_aplicados: {
            fecha_inicio: fechaInicio,
            fecha_fin: fechaFin,
            id_sucursal,
            formato,
            incluir_detalles
          }
        }
      });
    }
    
  } catch (error) {
    logger.error('Error al exportar datos avanzados:', error);
    next(error);
  }
};

module.exports = exports;
