const { pool } = require('../config/database');
const logger = require('../config/logger');

// =====================================================
// CONTROLADOR DE RECONCILIACIONES DE CAJA
// Multi-tenant por restaurante y sucursal
// =====================================================

/**
 * Crear una nueva reconciliación
 */
exports.crearReconciliacion = async (req, res, next) => {
  const client = await pool.connect();
  
  try {
    const {
      tipo_reconciliacion,
      monto_inicial,
      efectivo_esperado,
      efectivo_fisico,
      total_esperado,
      total_registrado,
      datos_por_metodo,
      observaciones
    } = req.body;

    const { id_restaurante, id_sucursal } = req.user;
    const id_vendedor = req.user.id_vendedor || req.user.id;

    // Validaciones básicas
    if (!tipo_reconciliacion || !['efectivo', 'completa'].includes(tipo_reconciliacion)) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de reconciliación requerido: efectivo o completa'
      });
    }

    if (tipo_reconciliacion === 'efectivo' && (!efectivo_esperado || !efectivo_fisico)) {
      return res.status(400).json({
        success: false,
        message: 'Para reconciliación de efectivo se requiere efectivo_esperado y efectivo_fisico'
      });
    }

    if (tipo_reconciliacion === 'completa' && (!total_esperado || !total_registrado)) {
      return res.status(400).json({
        success: false,
        message: 'Para reconciliación completa se requiere total_esperado y total_registrado'
      });
    }

    await client.query('BEGIN');

    // Insertar reconciliación principal
    const reconciliacionQuery = `
      INSERT INTO reconciliaciones_caja (
        id_restaurante, id_sucursal, id_vendedor, tipo_reconciliacion,
        monto_inicial, efectivo_esperado, efectivo_fisico,
        total_esperado, total_registrado,
        datos_por_metodo, observaciones
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *;
    `;

    const reconciliacionResult = await client.query(reconciliacionQuery, [
      id_restaurante, id_sucursal, id_vendedor, tipo_reconciliacion,
      monto_inicial || null, efectivo_esperado || null, efectivo_fisico || null,
      total_esperado || null, total_registrado || null,
      JSON.stringify(datos_por_metodo || {}), observaciones || null
    ]);

    const reconciliacion = reconciliacionResult.rows[0];

    // Si es reconciliación completa, insertar detalles por método
    if (tipo_reconciliacion === 'completa' && datos_por_metodo) {
      for (const [metodo, monto] of Object.entries(datos_por_metodo)) {
        const montoEsperado = parseFloat(monto) || 0;
        const montoRegistrado = parseFloat(monto) || 0;
        const diferencia = montoRegistrado - montoEsperado;

        await client.query(`
          INSERT INTO reconciliaciones_metodos_pago (
            id_reconciliacion, id_restaurante, id_sucursal,
            metodo_pago, monto_esperado, monto_registrado, diferencia
          ) VALUES ($1, $2, $3, $4, $5, $6, $7);
        `, [
          reconciliacion.id_reconciliacion, id_restaurante, id_sucursal,
          metodo, montoEsperado, montoRegistrado, diferencia
        ]);
      }
    }

    await client.query('COMMIT');

    logger.info(`Reconciliación creada: ID ${reconciliacion.id_reconciliacion} por usuario ${id_vendedor}`);

    res.status(201).json({
      success: true,
      message: 'Reconciliación creada exitosamente',
      data: reconciliacion
    });

  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error creando reconciliación:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    client.release();
  }
};

/**
 * Obtener reconciliaciones por fecha y sucursal
 */
exports.obtenerReconciliaciones = async (req, res, next) => {
  try {
    const { fecha_inicio, fecha_fin, id_sucursal } = req.query;
    const { id_restaurante } = req.user;

    let query = `
      SELECT 
        r.id_reconciliacion,
        r.id_restaurante,
        r.id_sucursal,
        r.id_usuario,
        r.fecha_reconciliacion,
        r.fecha_inicio,
        r.fecha_fin,
        r.efectivo_inicial,
        r.efectivo_final,
        r.efectivo_esperado,
        COALESCE(r.diferencia, r.diferencia_efectivo, r.diferencia_total, 0) as diferencia,
        r.observaciones,
        r.estado,
        r.created_at,
        r.updated_at,
        s.nombre as sucursal_nombre,
        COALESCE(v.nombre, u.nombre, 'Sin Usuario') as usuario_nombre,
        COALESCE(v.email, u.email, v.username, 'Sin Email') as usuario_email,
        COALESCE(v.rol, 'Sin Rol') as usuario_rol
      FROM reconciliaciones_caja r
      LEFT JOIN sucursales s ON r.id_sucursal = s.id_sucursal
      LEFT JOIN vendedores v ON r.id_usuario = v.id_vendedor
      LEFT JOIN usuarios u ON r.id_usuario = u.id_usuario
      WHERE r.id_restaurante = $1
    `;
    
    const params = [id_restaurante];
    let paramCount = 1;

    // Filtros opcionales
    if (fecha_inicio) {
      paramCount++;
      query += ` AND r.fecha_reconciliacion >= $${paramCount}`;
      params.push(fecha_inicio);
    }

    if (fecha_fin) {
      paramCount++;
      query += ` AND r.fecha_reconciliacion <= $${paramCount}`;
      params.push(fecha_fin);
    }

    if (id_sucursal) {
      paramCount++;
      query += ` AND r.id_sucursal = $${paramCount}`;
      params.push(id_sucursal);
    }

    query += ' ORDER BY r.fecha_reconciliacion DESC, r.created_at DESC';

    const result = await pool.query(query, params);

    // Obtener también los detalles de métodos de pago para cada reconciliación
    const reconciliacionesConDetalles = await Promise.all(
      result.rows.map(async (reconciliacion) => {
        const detallesQuery = `
          SELECT 
            metodo_pago,
            monto_esperado,
            monto_registrado as monto_real,
            diferencia,
            '' as observaciones
          FROM reconciliaciones_metodos_pago
          WHERE id_reconciliacion = $1
          ORDER BY metodo_pago
        `;
        
        const detallesResult = await pool.query(detallesQuery, [reconciliacion.id_reconciliacion]);
        
        // Formatear datos en JavaScript con validaciones
        const fechaReconciliacion = reconciliacion.fecha_reconciliacion ? new Date(reconciliacion.fecha_reconciliacion) : new Date();
        const fechaInicio = reconciliacion.fecha_inicio ? new Date(reconciliacion.fecha_inicio) : fechaReconciliacion;
        const fechaFin = reconciliacion.fecha_fin ? new Date(reconciliacion.fecha_fin) : fechaReconciliacion;
        
        // Calcular duración en horas (con validación)
        let duracionHoras = 0;
        if (fechaFin && fechaInicio && !isNaN(fechaFin.getTime()) && !isNaN(fechaInicio.getTime())) {
          const duracionMs = fechaFin.getTime() - fechaInicio.getTime();
          duracionHoras = duracionMs / (1000 * 60 * 60);
        }
        
        // Formatear estado
        let estadoFormateado = reconciliacion.estado || 'completada';
        switch (estadoFormateado) {
          case 'completada':
            estadoFormateado = '✅ Completada';
            break;
          case 'pendiente':
            estadoFormateado = '⏳ Pendiente';
            break;
          case 'cancelada':
            estadoFormateado = '❌ Cancelada';
            break;
        }
        
        // Formatear diferencia
        const diferencia = parseFloat(reconciliacion.diferencia) || 0;
        let diferenciaFormateada = 'Sin diferencia';
        if (diferencia === 0) {
          diferenciaFormateada = '✅ Cuadrada';
        } else if (diferencia > 0) {
          diferenciaFormateada = `📈 Sobrante: Bs ${diferencia.toFixed(2)}`;
        } else if (diferencia < 0) {
          diferenciaFormateada = `📉 Faltante: Bs ${Math.abs(diferencia).toFixed(2)}`;
        }
        
        return {
          ...reconciliacion,
          detalles_metodos: detallesResult.rows,
          total_metodos: detallesResult.rows.length,
          // Campos formateados con validaciones
          fecha_formateada: fechaReconciliacion && !isNaN(fechaReconciliacion.getTime()) ? fechaReconciliacion.toLocaleDateString('es-ES') : 'N/A',
          hora_formateada: fechaReconciliacion && !isNaN(fechaReconciliacion.getTime()) ? fechaReconciliacion.toLocaleTimeString('es-ES') : 'N/A',
          fecha_hora_completa: fechaReconciliacion && !isNaN(fechaReconciliacion.getTime()) ? fechaReconciliacion.toLocaleString('es-ES') : 'N/A',
          duracion_horas: Math.round(duracionHoras * 100) / 100,
          estado_formateado: estadoFormateado,
          diferencia_formateada: diferenciaFormateada
        };
      })
    );

    res.json({
      success: true,
      data: reconciliacionesConDetalles,
      total: reconciliacionesConDetalles.length,
      resumen: {
        total_reconciliaciones: reconciliacionesConDetalles.length,
        completadas: reconciliacionesConDetalles.filter(r => r.estado === 'completada').length,
        pendientes: reconciliacionesConDetalles.filter(r => r.estado === 'pendiente').length,
        canceladas: reconciliacionesConDetalles.filter(r => r.estado === 'cancelada').length,
        cuadradas: reconciliacionesConDetalles.filter(r => r.diferencia === 0).length,
        sobrantes: reconciliacionesConDetalles.filter(r => r.diferencia > 0).length,
        faltantes: reconciliacionesConDetalles.filter(r => r.diferencia < 0).length
      }
    });

  } catch (error) {
    logger.error('Error obteniendo reconciliaciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Obtener reconciliación específica con detalles
 */
exports.obtenerReconciliacion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { id_restaurante } = req.user;

    // Obtener reconciliación principal
    const reconciliacionQuery = `
      SELECT r.*, s.nombre as sucursal_nombre, v.nombre as vendedor_nombre
      FROM reconciliaciones_caja r
      LEFT JOIN sucursales s ON r.id_sucursal = s.id_sucursal
      LEFT JOIN vendedores v ON r.id_vendedor = v.id_vendedor
      WHERE r.id_reconciliacion = $1 AND r.id_restaurante = $2
    `;

    const reconciliacionResult = await pool.query(reconciliacionQuery, [id, id_restaurante]);

    if (reconciliacionResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Reconciliación no encontrada'
      });
    }

    const reconciliacion = reconciliacionResult.rows[0];

    // Obtener detalles de métodos si es reconciliación completa
    let metodosDetalle = [];
    if (reconciliacion.tipo_reconciliacion === 'completa') {
      const metodosQuery = `
        SELECT * FROM reconciliaciones_metodos_pago
        WHERE id_reconciliacion = $1
        ORDER BY metodo_pago
      `;
      const metodosResult = await pool.query(metodosQuery, [id]);
      metodosDetalle = metodosResult.rows;
    }

    // Obtener historial de cambios
    const historialQuery = `
      SELECT * FROM reconciliaciones_historial
      WHERE id_reconciliacion = $1
      ORDER BY fecha_cambio DESC
    `;
    const historialResult = await pool.query(historialQuery, [id]);

    res.json({
      success: true,
      data: {
        ...reconciliacion,
        metodos_detalle: metodosDetalle,
        historial: historialResult.rows
      }
    });

  } catch (error) {
    logger.error('Error obteniendo reconciliación:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Obtener resumen de reconciliaciones por período
 */
exports.obtenerResumenReconciliaciones = async (req, res, next) => {
  try {
    const { fecha_inicio, fecha_fin, id_sucursal } = req.query;
    const { id_restaurante } = req.user;

    let query = `
      SELECT 
        DATE(r.fecha_reconciliacion) as fecha,
        r.id_sucursal,
        s.nombre as sucursal_nombre,
        COUNT(*) as total_reconciliaciones,
        SUM(r.efectivo_esperado) as total_efectivo_esperado,
        SUM(r.efectivo_final) as total_efectivo_final,
        SUM(COALESCE(r.diferencia, r.diferencia_efectivo, r.diferencia_total, 0)) as total_diferencia,
        AVG(COALESCE(r.diferencia, r.diferencia_efectivo, r.diferencia_total, 0)) as diferencia_promedio
      FROM reconciliaciones_caja r
      LEFT JOIN sucursales s ON r.id_sucursal = s.id_sucursal
      WHERE r.id_restaurante = $1
    `;
    
    const params = [id_restaurante];
    let paramCount = 1;

    if (fecha_inicio) {
      paramCount++;
      query += ` AND r.fecha_reconciliacion >= $${paramCount}`;
      params.push(fecha_inicio);
    }

    if (fecha_fin) {
      paramCount++;
      query += ` AND r.fecha_reconciliacion <= $${paramCount}`;
      params.push(fecha_fin);
    }

    if (id_sucursal) {
      paramCount++;
      query += ` AND r.id_sucursal = $${paramCount}`;
      params.push(id_sucursal);
    }

    query += ' GROUP BY DATE(r.fecha_reconciliacion), r.id_sucursal, s.nombre ORDER BY fecha DESC';

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows,
      total: result.rows.length
    });

  } catch (error) {
    logger.error('Error obteniendo resumen de reconciliaciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Obtener reconciliaciones del día actual
 */
exports.obtenerReconciliacionesHoy = async (req, res, next) => {
  try {
    const { id_restaurante, id_sucursal } = req.user;

    const query = `
      SELECT r.*, s.nombre as sucursal_nombre, u.nombre as usuario_nombre
      FROM reconciliaciones_caja r
      LEFT JOIN sucursales s ON r.id_sucursal = s.id_sucursal
      LEFT JOIN vendedores v ON r.id_usuario = v.id_vendedor
      WHERE r.id_restaurante = $1 
      AND DATE(r.fecha_reconciliacion) = CURRENT_DATE
      ${id_sucursal ? 'AND r.id_sucursal = $2' : ''}
      ORDER BY r.fecha_reconciliacion DESC
    `;

    const params = id_sucursal ? [id_restaurante, id_sucursal] : [id_restaurante];
    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows,
      total: result.rows.length
    });

  } catch (error) {
    logger.error('Error obteniendo reconciliaciones de hoy:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Actualizar reconciliación
 */
exports.actualizarReconciliacion = async (req, res, next) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    const { id_restaurante } = req.user;
    const {
      efectivo_fisico,
      total_registrado,
      datos_por_metodo,
      observaciones
    } = req.body;

    // Verificar que la reconciliación existe y pertenece al restaurante
    const verificacionQuery = `
      SELECT * FROM reconciliaciones_caja
      WHERE id_reconciliacion = $1 AND id_restaurante = $2
    `;
    const verificacionResult = await client.query(verificacionQuery, [id, id_restaurante]);

    if (verificacionResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Reconciliación no encontrada'
      });
    }

    const reconciliacion = verificacionResult.rows[0];

    await client.query('BEGIN');

    // Actualizar reconciliación principal
    const updateQuery = `
      UPDATE reconciliaciones_caja SET
        efectivo_fisico = COALESCE($1, efectivo_fisico),
        total_registrado = COALESCE($2, total_registrado),
        datos_por_metodo = COALESCE($3, datos_por_metodo),
        observaciones = COALESCE($4, observaciones),
        updated_at = NOW()
      WHERE id_reconciliacion = $5 AND id_restaurante = $6
      RETURNING *;
    `;

    const updateResult = await client.query(updateQuery, [
      efectivo_fisico || null,
      total_registrado || null,
      datos_por_metodo ? JSON.stringify(datos_por_metodo) : null,
      observaciones || null,
      id,
      id_restaurante
    ]);

    // Si se actualizaron los datos por método, actualizar detalles
    if (datos_por_metodo && reconciliacion.tipo_reconciliacion === 'completa') {
      // Eliminar detalles existentes
      await client.query(`
        DELETE FROM reconciliaciones_metodos_pago
        WHERE id_reconciliacion = $1
      `, [id]);

      // Insertar nuevos detalles
      for (const [metodo, monto] of Object.entries(datos_por_metodo)) {
        const montoEsperado = parseFloat(monto) || 0;
        const montoRegistrado = parseFloat(monto) || 0;
        const diferencia = montoRegistrado - montoEsperado;

        await client.query(`
          INSERT INTO reconciliaciones_metodos_pago (
            id_reconciliacion, id_restaurante, id_sucursal,
            metodo_pago, monto_esperado, monto_registrado, diferencia
          ) VALUES ($1, $2, $3, $4, $5, $6, $7);
        `, [
          id, id_restaurante, reconciliacion.id_sucursal,
          metodo, montoEsperado, montoRegistrado, diferencia
        ]);
      }
    }

    await client.query('COMMIT');

    logger.info(`Reconciliación actualizada: ID ${id} por usuario ${req.user.id_vendedor || req.user.id}`);

    res.json({
      success: true,
      message: 'Reconciliación actualizada exitosamente',
      data: updateResult.rows[0]
    });

  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error actualizando reconciliación:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    client.release();
  }
};

/**
 * Eliminar reconciliación
 */
exports.eliminarReconciliacion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { id_restaurante } = req.user;

    const deleteQuery = `
      DELETE FROM reconciliaciones_caja
      WHERE id_reconciliacion = $1 AND id_restaurante = $2
      RETURNING *
    `;

    const result = await pool.query(deleteQuery, [id, id_restaurante]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Reconciliación no encontrada'
      });
    }

    logger.info(`Reconciliación eliminada: ID ${id} por usuario ${req.user.id_vendedor || req.user.id}`);

    res.json({
      success: true,
      message: 'Reconciliación eliminada exitosamente',
      data: result.rows[0]
    });

  } catch (error) {
    logger.error('Error eliminando reconciliación:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Obtener estadísticas de reconciliaciones
 */
exports.obtenerEstadisticasReconciliaciones = async (req, res, next) => {
  try {
    const { fecha_inicio, fecha_fin, id_sucursal } = req.query;
    const { id_restaurante } = req.user;

    let whereClause = 'WHERE r.id_restaurante = $1';
    const params = [id_restaurante];
    let paramCount = 1;

    if (fecha_inicio) {
      paramCount++;
      whereClause += ` AND r.fecha_reconciliacion >= $${paramCount}`;
      params.push(fecha_inicio);
    }

    if (fecha_fin) {
      paramCount++;
      whereClause += ` AND r.fecha_reconciliacion <= $${paramCount}`;
      params.push(fecha_fin);
    }

    if (id_sucursal) {
      paramCount++;
      whereClause += ` AND r.id_sucursal = $${paramCount}`;
      params.push(id_sucursal);
    }

    const statsQuery = `
      SELECT 
        COUNT(*) as total_reconciliaciones,
        COUNT(CASE WHEN r.estado = 'completada' THEN 1 END) as reconciliaciones_completadas,
        COUNT(CASE WHEN r.estado = 'pendiente' THEN 1 END) as reconciliaciones_pendientes,
        COUNT(CASE WHEN r.estado = 'cancelada' THEN 1 END) as reconciliaciones_canceladas,
        COUNT(CASE WHEN COALESCE(r.diferencia, r.diferencia_efectivo, r.diferencia_total, 0) = 0 THEN 1 END) as reconciliaciones_cuadradas,
        COUNT(CASE WHEN COALESCE(r.diferencia, r.diferencia_efectivo, r.diferencia_total, 0) > 0 THEN 1 END) as reconciliaciones_sobrantes,
        COUNT(CASE WHEN COALESCE(r.diferencia, r.diferencia_efectivo, r.diferencia_total, 0) < 0 THEN 1 END) as reconciliaciones_faltantes,
        AVG(COALESCE(r.diferencia, r.diferencia_efectivo, r.diferencia_total, 0)) as diferencia_promedio,
        SUM(COALESCE(r.diferencia, r.diferencia_efectivo, r.diferencia_total, 0)) as diferencia_total,
        SUM(r.efectivo_esperado) as total_efectivo_esperado,
        SUM(r.efectivo_final) as total_efectivo_final,
        MIN(r.fecha_reconciliacion) as fecha_primera,
        MAX(r.fecha_reconciliacion) as fecha_ultima
      FROM reconciliaciones_caja r
      ${whereClause}
    `;

    const result = await pool.query(statsQuery, params);

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    logger.error('Error obteniendo estadísticas de reconciliaciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
