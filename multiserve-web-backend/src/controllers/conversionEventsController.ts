import { Request, Response } from 'express';
import { query, transaction } from '../config/database.js';
import { logInfo, logError, logAudit, logMetrics } from '../config/logger.js';
import { ApiResponse, PaginatedResponse, ConversionEvent, ConversionEventCreate } from '../types/index.js';
import { conversionEventSchema } from '../validators/index.js';

// Crear nuevo evento de conversión
export const createConversionEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const eventData: ConversionEventCreate = req.body;
    
    // Validar datos
    const { error, value: data } = conversionEventSchema.validate(eventData);
    
    if (error) {
      const response: ApiResponse = {
        success: false,
        message: 'Datos de evento inválidos',
        error: 'VALIDATION_ERROR',
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
        })),
      };
      res.status(400).json(response);
      return;
    }
    
    // Insertar evento en la base de datos
    const insertQuery = `
      INSERT INTO conversion_events (
        event_type, timestamp, plan_name, user_agent, referrer, 
        session_id, ip_address, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    
    const values = [
      data.event_type,
      data.timestamp,
      data.plan_name || null,
      data.user_agent || req.clientInfo?.userAgent || null,
      data.referrer || req.clientInfo?.referer || null,
      data.session_id || null,
      data.ip_address || req.clientInfo?.ip || null,
      JSON.stringify(data.metadata || {}),
    ];
    
    const result = await query(insertQuery, values);
    const nuevoEvento = result.rows[0];
    
    // Log de métricas
    logMetrics('conversion_event', 1, {
      event_type: data.event_type,
      plan_name: data.plan_name || 'unknown',
    });
    
    // Log de auditoría
    logAudit('conversion_event_created', undefined, {
      eventId: nuevoEvento.id,
      eventType: data.event_type,
      planName: data.plan_name,
      sessionId: data.session_id,
      ip: req.clientInfo?.ip,
    });
    
    const response: ApiResponse<ConversionEvent> = {
      success: true,
      message: 'Evento de conversión registrado exitosamente',
      data: nuevoEvento,
    };
    
    logInfo('Nuevo evento de conversión registrado', {
      id: nuevoEvento.id,
      type: data.event_type,
      plan: data.plan_name,
    });
    
    res.status(201).json(response);
  } catch (error) {
    logError('Error registrando evento de conversión', error as Error);
    const response: ApiResponse = {
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR',
    };
    res.status(500).json(response);
  }
};

// Obtener eventos de conversión con filtros
export const getConversionEvents = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      sort = 'desc', 
      sortBy = 'timestamp',
      eventType,
      planName,
      startDate,
      endDate,
      sessionId
    } = req.query;
    
    const offset = (Number(page) - 1) * Number(limit);
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;
    
    // Filtros
    if (eventType) {
      whereClause += ` AND event_type = $${paramIndex}`;
      params.push(eventType);
      paramIndex++;
    }
    
    if (planName) {
      whereClause += ` AND plan_name = $${paramIndex}`;
      params.push(planName);
      paramIndex++;
    }
    
    if (sessionId) {
      whereClause += ` AND session_id = $${paramIndex}`;
      params.push(sessionId);
      paramIndex++;
    }
    
    if (startDate) {
      whereClause += ` AND timestamp >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }
    
    if (endDate) {
      whereClause += ` AND timestamp <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }
    
    // Contar total de registros
    const countQuery = `SELECT COUNT(*) as total FROM conversion_events ${whereClause}`;
    const countResult = await query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);
    
    // Obtener registros con paginación
    const dataQuery = `
      SELECT * FROM conversion_events 
      ${whereClause}
      ORDER BY ${sortBy} ${sort}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(limit, offset);
    
    const dataResult = await query(dataQuery, params);
    
    const response: PaginatedResponse<ConversionEvent> = {
      success: true,
      message: 'Eventos de conversión obtenidos exitosamente',
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
    logError('Error obteniendo eventos de conversión', error as Error);
    const response: ApiResponse = {
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR',
    };
    res.status(500).json(response);
  }
};

// Obtener estadísticas de conversión
export const getConversionStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, planName } = req.query;
    
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;
    
    if (startDate) {
      whereClause += ` AND timestamp >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }
    
    if (endDate) {
      whereClause += ` AND timestamp <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }
    
    if (planName) {
      whereClause += ` AND plan_name = $${paramIndex}`;
      params.push(planName);
      paramIndex++;
    }
    
    // Estadísticas generales
    const statsQuery = `
      SELECT 
        COUNT(*) as total_events,
        COUNT(DISTINCT session_id) as unique_sessions,
        COUNT(DISTINCT ip_address) as unique_ips,
        COUNT(CASE WHEN event_type = 'page_view' THEN 1 END) as page_views,
        COUNT(CASE WHEN event_type = 'form_start' THEN 1 END) as form_starts,
        COUNT(CASE WHEN event_type = 'form_submit' THEN 1 END) as form_submits,
        COUNT(CASE WHEN event_type = 'demo_request' THEN 1 END) as demo_requests,
        COUNT(CASE WHEN event_type = 'newsletter_signup' THEN 1 END) as newsletter_signups,
        COUNT(CASE WHEN event_type = 'download' THEN 1 END) as downloads,
        COUNT(CASE WHEN event_type = 'video_play' THEN 1 END) as video_plays,
        COUNT(CASE WHEN event_type = 'button_click' THEN 1 END) as button_clicks
      FROM conversion_events 
      ${whereClause}
    `;
    
    const statsResult = await query(statsQuery, params);
    const stats = statsResult.rows[0];
    
    // Estadísticas por tipo de evento
    const eventTypeQuery = `
      SELECT 
        event_type,
        COUNT(*) as count,
        COUNT(DISTINCT session_id) as unique_sessions
      FROM conversion_events 
      ${whereClause}
      GROUP BY event_type
      ORDER BY count DESC
    `;
    
    const eventTypeResult = await query(eventTypeQuery, params);
    
    // Estadísticas por plan
    const planStatsQuery = `
      SELECT 
        plan_name,
        COUNT(*) as count,
        COUNT(DISTINCT session_id) as unique_sessions
      FROM conversion_events 
      ${whereClause}
      GROUP BY plan_name
      ORDER BY count DESC
    `;
    
    const planStatsResult = await query(planStatsQuery, params);
    
    // Estadísticas por hora del día
    const hourlyStatsQuery = `
      SELECT 
        EXTRACT(HOUR FROM timestamp) as hour,
        COUNT(*) as count
      FROM conversion_events 
      ${whereClause}
      GROUP BY EXTRACT(HOUR FROM timestamp)
      ORDER BY hour
    `;
    
    const hourlyStatsResult = await query(hourlyStatsQuery, params);
    
    // Estadísticas por día de la semana
    const dailyStatsQuery = `
      SELECT 
        EXTRACT(DOW FROM timestamp) as day_of_week,
        COUNT(*) as count
      FROM conversion_events 
      ${whereClause}
      GROUP BY EXTRACT(DOW FROM timestamp)
      ORDER BY day_of_week
    `;
    
    const dailyStatsResult = await query(dailyStatsQuery, params);
    
    // Calcular tasa de conversión
    const totalPageViews = parseInt(stats.page_views);
    const totalDemoRequests = parseInt(stats.demo_requests);
    const conversionRate = totalPageViews > 0 ? (totalDemoRequests / totalPageViews * 100) : 0;
    
    const response: ApiResponse = {
      success: true,
      message: 'Estadísticas de conversión obtenidas exitosamente',
      data: {
        general: {
          total_events: parseInt(stats.total_events),
          unique_sessions: parseInt(stats.unique_sessions),
          unique_ips: parseInt(stats.unique_ips),
          conversion_rate: Math.round(conversionRate * 100) / 100,
        },
        eventos: {
          page_views: parseInt(stats.page_views),
          form_starts: parseInt(stats.form_starts),
          form_submits: parseInt(stats.form_submits),
          demo_requests: parseInt(stats.demo_requests),
          newsletter_signups: parseInt(stats.newsletter_signups),
          downloads: parseInt(stats.downloads),
          video_plays: parseInt(stats.video_plays),
          button_clicks: parseInt(stats.button_clicks),
        },
        por_tipo_evento: eventTypeResult.rows,
        por_plan: planStatsResult.rows,
        por_hora: hourlyStatsResult.rows,
        por_dia_semana: dailyStatsResult.rows,
      },
    };
    
    res.json(response);
  } catch (error) {
    logError('Error obteniendo estadísticas de conversión', error as Error);
    const response: ApiResponse = {
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR',
    };
    res.status(500).json(response);
  }
};

// Obtener eventos de conversión por sesión
export const getConversionEventsBySession = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;
    
    const result = await query(
      'SELECT * FROM conversion_events WHERE session_id = $1 ORDER BY timestamp ASC',
      [sessionId]
    );
    
    const response: ApiResponse<ConversionEvent[]> = {
      success: true,
      message: 'Eventos de conversión por sesión obtenidos exitosamente',
      data: result.rows,
    };
    
    res.json(response);
  } catch (error) {
    logError('Error obteniendo eventos de conversión por sesión', error as Error);
    const response: ApiResponse = {
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR',
    };
    res.status(500).json(response);
  }
};

// Obtener eventos de conversión por IP
export const getConversionEventsByIP = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ip } = req.params;
    
    const result = await query(
      'SELECT * FROM conversion_events WHERE ip_address = $1 ORDER BY timestamp DESC',
      [ip]
    );
    
    const response: ApiResponse<ConversionEvent[]> = {
      success: true,
      message: 'Eventos de conversión por IP obtenidos exitosamente',
      data: result.rows,
    };
    
    res.json(response);
  } catch (error) {
    logError('Error obteniendo eventos de conversión por IP', error as Error);
    const response: ApiResponse = {
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR',
    };
    res.status(500).json(response);
  }
};

// Eliminar eventos de conversión antiguos (limpieza)
export const cleanupOldConversionEvents = async (req: Request, res: Response): Promise<void> => {
  try {
    const { days = 365 } = req.query;
    
    const result = await query(
      'DELETE FROM conversion_events WHERE created_at < NOW() - INTERVAL $1 DAY',
      [days]
    );
    
    const response: ApiResponse = {
      success: true,
      message: `Eventos de conversión anteriores a ${days} días eliminados exitosamente`,
      data: {
        deleted_count: result.rowCount,
      },
    };
    
    logInfo('Limpieza de eventos de conversión completada', {
      deleted_count: result.rowCount,
      days_retention: days,
    });
    
    res.json(response);
  } catch (error) {
    logError('Error en limpieza de eventos de conversión', error as Error);
    const response: ApiResponse = {
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR',
    };
    res.status(500).json(response);
  }
};
