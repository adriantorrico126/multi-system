import { Request, Response } from 'express';
import { query, transaction } from '../config/database.js';
import { logInfo, logError, logAudit } from '../config/logger.js';
import { ApiResponse, PaginatedResponse, UserSession, UserSessionCreate, UserSessionUpdate } from '../types/index.js';
import { userSessionSchema } from '../validators/index.js';

// Crear o actualizar sesión de usuario
export const createOrUpdateUserSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const sessionData: UserSessionCreate = req.body;
    
    // Validar datos
    const { error, value: data } = userSessionSchema.validate(sessionData);
    
    if (error) {
      const response: ApiResponse = {
        success: false,
        message: 'Datos de sesión inválidos',
        error: 'VALIDATION_ERROR',
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
        })),
      };
      res.status(400).json(response);
      return;
    }
    
    // Verificar si la sesión ya existe
    const existingSession = await query(
      'SELECT * FROM user_sessions WHERE session_id = $1',
      [data.session_id]
    );
    
    let session: UserSession;
    
    if (existingSession.rows.length > 0) {
      // Actualizar sesión existente
      const updateQuery = `
        UPDATE user_sessions 
        SET last_visit = NOW(),
            visit_count = visit_count + 1,
            updated_at = NOW()
        WHERE session_id = $1
        RETURNING *
      `;
      
      const updateResult = await query(updateQuery, [data.session_id]);
      session = updateResult.rows[0];
      
      logInfo('Sesión de usuario actualizada', {
        sessionId: data.session_id,
        visitCount: session.visit_count,
      });
    } else {
      // Crear nueva sesión
      const insertQuery = `
        INSERT INTO user_sessions (
          session_id, ip_address, user_agent, referrer, landing_page,
          utm_source, utm_medium, utm_campaign, utm_term, utm_content,
          country, city, device_type, browser, os
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING *
      `;
      
      const values = [
        data.session_id,
        data.ip_address || req.clientInfo?.ip || null,
        data.user_agent || req.clientInfo?.userAgent || null,
        data.referrer || req.clientInfo?.referer || null,
        data.landing_page || null,
        data.utm_source || null,
        data.utm_medium || null,
        data.utm_campaign || null,
        data.utm_term || null,
        data.utm_content || null,
        data.country || null,
        data.city || null,
        data.device_type || null,
        data.browser || null,
        data.os || null,
      ];
      
      const insertResult = await query(insertQuery, values);
      session = insertResult.rows[0];
      
      logInfo('Nueva sesión de usuario creada', {
        sessionId: data.session_id,
        ip: data.ip_address,
        userAgent: data.user_agent,
      });
    }
    
    const response: ApiResponse<UserSession> = {
      success: true,
      message: 'Sesión de usuario procesada exitosamente',
      data: session,
    };
    
    res.json(response);
  } catch (error) {
    logError('Error procesando sesión de usuario', error as Error);
    const response: ApiResponse = {
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR',
    };
    res.status(500).json(response);
  }
};

// Obtener sesión por ID
export const getUserSessionById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;
    
    const result = await query(
      'SELECT * FROM user_sessions WHERE session_id = $1',
      [sessionId]
    );
    
    if (result.rows.length === 0) {
      const response: ApiResponse = {
        success: false,
        message: 'Sesión de usuario no encontrada',
        error: 'NOT_FOUND',
      };
      res.status(404).json(response);
      return;
    }
    
    const response: ApiResponse<UserSession> = {
      success: true,
      message: 'Sesión de usuario obtenida exitosamente',
      data: result.rows[0],
    };
    
    res.json(response);
  } catch (error) {
    logError('Error obteniendo sesión de usuario', error as Error);
    const response: ApiResponse = {
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR',
    };
    res.status(500).json(response);
  }
};

// Obtener todas las sesiones con filtros
export const getUserSessions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      sort = 'desc', 
      sortBy = 'first_visit',
      country,
      deviceType,
      isConverted,
      startDate,
      endDate
    } = req.query;
    
    const offset = (Number(page) - 1) * Number(limit);
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;
    
    // Filtros
    if (country) {
      whereClause += ` AND country = $${paramIndex}`;
      params.push(country);
      paramIndex++;
    }
    
    if (deviceType) {
      whereClause += ` AND device_type = $${paramIndex}`;
      params.push(deviceType);
      paramIndex++;
    }
    
    if (isConverted !== undefined) {
      whereClause += ` AND is_converted = $${paramIndex}`;
      params.push(isConverted === 'true');
      paramIndex++;
    }
    
    if (startDate) {
      whereClause += ` AND first_visit >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }
    
    if (endDate) {
      whereClause += ` AND first_visit <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }
    
    // Contar total de registros
    const countQuery = `SELECT COUNT(*) as total FROM user_sessions ${whereClause}`;
    const countResult = await query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);
    
    // Obtener registros con paginación
    const dataQuery = `
      SELECT * FROM user_sessions 
      ${whereClause}
      ORDER BY ${sortBy} ${sort}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(limit, offset);
    
    const dataResult = await query(dataQuery, params);
    
    const response: PaginatedResponse<UserSession> = {
      success: true,
      message: 'Sesiones de usuario obtenidas exitosamente',
      data: dataResult.rows,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        hasMore: offset + Number(limit) < total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    };
    
    res.json(response);
  } catch (error) {
    logError('Error obteniendo sesiones de usuario', error as Error);
    const response: ApiResponse = {
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR',
    };
    res.status(500).json(response);
  }
};

// Actualizar sesión de usuario
export const updateUserSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;
    const updateData: UserSessionUpdate = req.body;
    
    // Verificar que la sesión existe
    const existingResult = await query(
      'SELECT * FROM user_sessions WHERE session_id = $1',
      [sessionId]
    );
    
    if (existingResult.rows.length === 0) {
      const response: ApiResponse = {
        success: false,
        message: 'Sesión de usuario no encontrada',
        error: 'NOT_FOUND',
      };
      res.status(404).json(response);
      return;
    }
    
    // Actualizar sesión
    const updateQuery = `
      UPDATE user_sessions 
      SET last_visit = COALESCE($2, last_visit),
          visit_count = COALESCE($3, visit_count),
          is_converted = COALESCE($4, is_converted),
          conversion_event = COALESCE($5, conversion_event),
          conversion_timestamp = COALESCE($6, conversion_timestamp),
          updated_at = NOW()
      WHERE session_id = $1
      RETURNING *
    `;
    
    const values = [
      sessionId,
      updateData.last_visit || null,
      updateData.visit_count || null,
      updateData.is_converted || null,
      updateData.conversion_event || null,
      updateData.conversion_timestamp || null,
    ];
    
    const result = await query(updateQuery, values);
    const sessionActualizada = result.rows[0];
    
    // Log de auditoría
    logAudit('user_session_updated', undefined, {
      sessionId,
      cambios: updateData,
      ip: req.clientInfo?.ip,
    });
    
    const response: ApiResponse<UserSession> = {
      success: true,
      message: 'Sesión de usuario actualizada exitosamente',
      data: sessionActualizada,
    };
    
    logInfo('Sesión de usuario actualizada', {
      sessionId,
      cambios: updateData,
    });
    
    res.json(response);
  } catch (error) {
    logError('Error actualizando sesión de usuario', error as Error);
    const response: ApiResponse = {
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR',
    };
    res.status(500).json(response);
  }
};

// Obtener estadísticas de sesiones
export const getUserSessionStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;
    
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;
    
    if (startDate) {
      whereClause += ` AND first_visit >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }
    
    if (endDate) {
      whereClause += ` AND first_visit <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }
    
    // Estadísticas generales
    const statsQuery = `
      SELECT 
        COUNT(*) as total_sessions,
        COUNT(CASE WHEN is_converted = true THEN 1 END) as converted_sessions,
        AVG(visit_count) as avg_visits_per_session,
        COUNT(DISTINCT ip_address) as unique_ips,
        COUNT(DISTINCT country) as unique_countries,
        COUNT(CASE WHEN device_type = 'desktop' THEN 1 END) as desktop_sessions,
        COUNT(CASE WHEN device_type = 'mobile' THEN 1 END) as mobile_sessions,
        COUNT(CASE WHEN device_type = 'tablet' THEN 1 END) as tablet_sessions
      FROM user_sessions 
      ${whereClause}
    `;
    
    const statsResult = await query(statsQuery, params);
    const stats = statsResult.rows[0];
    
    // Estadísticas por país
    const countryStatsQuery = `
      SELECT 
        country,
        COUNT(*) as sessions,
        COUNT(CASE WHEN is_converted = true THEN 1 END) as conversions
      FROM user_sessions 
      ${whereClause}
      GROUP BY country
      ORDER BY sessions DESC
      LIMIT 10
    `;
    
    const countryStatsResult = await query(countryStatsQuery, params);
    
    // Estadísticas por dispositivo
    const deviceStatsQuery = `
      SELECT 
        device_type,
        COUNT(*) as sessions,
        COUNT(CASE WHEN is_converted = true THEN 1 END) as conversions
      FROM user_sessions 
      ${whereClause}
      GROUP BY device_type
      ORDER BY sessions DESC
    `;
    
    const deviceStatsResult = await query(deviceStatsQuery, params);
    
    // Estadísticas por fuente UTM
    const utmStatsQuery = `
      SELECT 
        utm_source,
        COUNT(*) as sessions,
        COUNT(CASE WHEN is_converted = true THEN 1 END) as conversions
      FROM user_sessions 
      ${whereClause}
      WHERE utm_source IS NOT NULL
      GROUP BY utm_source
      ORDER BY sessions DESC
      LIMIT 10
    `;
    
    const utmStatsResult = await query(utmStatsQuery, params);
    
    // Estadísticas por día de la semana
    const dailyStatsQuery = `
      SELECT 
        EXTRACT(DOW FROM first_visit) as day_of_week,
        COUNT(*) as sessions
      FROM user_sessions 
      ${whereClause}
      GROUP BY EXTRACT(DOW FROM first_visit)
      ORDER BY day_of_week
    `;
    
    const dailyStatsResult = await query(dailyStatsQuery, params);
    
    // Calcular tasa de conversión
    const totalSessions = parseInt(stats.total_sessions);
    const convertedSessions = parseInt(stats.converted_sessions);
    const conversionRate = totalSessions > 0 ? (convertedSessions / totalSessions * 100) : 0;
    
    const response: ApiResponse = {
      success: true,
      message: 'Estadísticas de sesiones obtenidas exitosamente',
      data: {
        general: {
          total_sessions: totalSessions,
          converted_sessions: convertedSessions,
          conversion_rate: Math.round(conversionRate * 100) / 100,
          avg_visits_per_session: Math.round(parseFloat(stats.avg_visits_per_session) * 100) / 100,
          unique_ips: parseInt(stats.unique_ips),
          unique_countries: parseInt(stats.unique_countries),
        },
        dispositivos: {
          desktop: parseInt(stats.desktop_sessions),
          mobile: parseInt(stats.mobile_sessions),
          tablet: parseInt(stats.tablet_sessions),
        },
        por_pais: countryStatsResult.rows,
        por_dispositivo: deviceStatsResult.rows,
        por_fuente_utm: utmStatsResult.rows,
        por_dia_semana: dailyStatsResult.rows,
      },
    };
    
    res.json(response);
  } catch (error) {
    logError('Error obteniendo estadísticas de sesiones', error as Error);
    const response: ApiResponse = {
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR',
    };
    res.status(500).json(response);
  }
};

// Eliminar sesiones antiguas (limpieza)
export const cleanupOldUserSessions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { days = 365 } = req.query;
    
    const result = await query(
      'DELETE FROM user_sessions WHERE first_visit < NOW() - INTERVAL $1 DAY',
      [days]
    );
    
    const response: ApiResponse = {
      success: true,
      message: `Sesiones de usuario anteriores a ${days} días eliminadas exitosamente`,
      data: {
        deleted_count: result.rowCount,
      },
    };
    
    logInfo('Limpieza de sesiones de usuario completada', {
      deleted_count: result.rowCount,
      days_retention: days,
    });
    
    res.json(response);
  } catch (error) {
    logError('Error en limpieza de sesiones de usuario', error as Error);
    const response: ApiResponse = {
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR',
    };
    res.status(500).json(response);
  }
};
