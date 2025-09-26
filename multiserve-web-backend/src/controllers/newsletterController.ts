import { Request, Response } from 'express';
import { query, transaction } from '../config/database.js';
import { logInfo, logError, logAudit } from '../config/logger.js';
import { ApiResponse, PaginatedResponse, NewsletterSuscriptor, NewsletterSuscriptorCreate } from '../types/index.js';
import { newsletterSuscriptorSchema } from '../validators/index.js';

// Suscribir usuario al newsletter
export const subscribeToNewsletter = async (req: Request, res: Response): Promise<void> => {
  try {
    const suscriptorData: NewsletterSuscriptorCreate = req.body;
    
    // Validar datos
    const { error, value: data } = newsletterSuscriptorSchema.validate(suscriptorData);
    
    if (error) {
      const response: ApiResponse = {
        success: false,
        message: 'Datos de suscripción inválidos',
        error: 'VALIDATION_ERROR',
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
        })),
      };
      res.status(400).json(response);
      return;
    }
    
    // Verificar si el email ya está suscrito
    const existingSuscriptor = await query(
      'SELECT * FROM newsletter_suscriptores WHERE email = $1',
      [data.email]
    );
    
    if (existingSuscriptor.rows.length > 0) {
      const suscriptor = existingSuscriptor.rows[0];
      
      if (suscriptor.estado === 'activo') {
        const response: ApiResponse = {
          success: false,
          message: 'Este email ya está suscrito al newsletter',
          error: 'ALREADY_SUBSCRIBED',
        };
        res.status(409).json(response);
        return;
      } else {
        // Reactivar suscripción
        const reactivateQuery = `
          UPDATE newsletter_suscriptores 
          SET estado = 'activo',
              fecha_suscripcion = NOW(),
              fecha_baja = NULL,
              updated_at = NOW()
          WHERE email = $1
          RETURNING *
        `;
        
        const reactivateResult = await query(reactivateQuery, [data.email]);
        const suscriptorReactivado = reactivateResult.rows[0];
        
        logInfo('Suscripción al newsletter reactivada', {
          email: data.email,
          nombre: data.nombre,
        });
        
        const response: ApiResponse<NewsletterSuscriptor> = {
          success: true,
          message: 'Suscripción al newsletter reactivada exitosamente',
          data: suscriptorReactivado,
        };
        
        res.json(response);
        return;
      }
    }
    
    // Crear nueva suscripción
    const insertQuery = `
      INSERT INTO newsletter_suscriptores (
        email, nombre, fuente, ip_address, user_agent
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    const values = [
      data.email,
      data.nombre || null,
      data.fuente || 'web',
      data.ip_address || req.clientInfo?.ip || null,
      data.user_agent || req.clientInfo?.userAgent || null,
    ];
    
    const result = await query(insertQuery, values);
    const nuevoSuscriptor = result.rows[0];
    
    // Log de auditoría
    logAudit('newsletter_subscription_created', undefined, {
      email: data.email,
      nombre: data.nombre,
      fuente: data.fuente,
      ip: req.clientInfo?.ip,
    });
    
    const response: ApiResponse<NewsletterSuscriptor> = {
      success: true,
      message: 'Suscripción al newsletter creada exitosamente',
      data: nuevoSuscriptor,
    };
    
    logInfo('Nueva suscripción al newsletter', {
      email: data.email,
      nombre: data.nombre,
      fuente: data.fuente,
    });
    
    res.status(201).json(response);
  } catch (error) {
    logError('Error creando suscripción al newsletter', error as Error);
    const response: ApiResponse = {
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR',
    };
    res.status(500).json(response);
  }
};

// Desuscribir usuario del newsletter
export const unsubscribeFromNewsletter = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.params;
    
    // Verificar si el email está suscrito
    const existingSuscriptor = await query(
      'SELECT * FROM newsletter_suscriptores WHERE email = $1',
      [email]
    );
    
    if (existingSuscriptor.rows.length === 0) {
      const response: ApiResponse = {
        success: false,
        message: 'Email no encontrado en la lista de suscriptores',
        error: 'NOT_FOUND',
      };
      res.status(404).json(response);
      return;
    }
    
    const suscriptor = existingSuscriptor.rows[0];
    
    if (suscriptor.estado === 'baja') {
      const response: ApiResponse = {
        success: false,
        message: 'Este email ya está desuscrito del newsletter',
        error: 'ALREADY_UNSUBSCRIBED',
      };
      res.status(409).json(response);
      return;
    }
    
    // Desuscribir
    const unsubscribeQuery = `
      UPDATE newsletter_suscriptores 
      SET estado = 'baja',
          fecha_baja = NOW(),
          updated_at = NOW()
      WHERE email = $1
      RETURNING *
    `;
    
    const result = await query(unsubscribeQuery, [email]);
    const suscriptorDesuscrito = result.rows[0];
    
    // Log de auditoría
    logAudit('newsletter_unsubscription', undefined, {
      email,
      ip: req.clientInfo?.ip,
    });
    
    const response: ApiResponse<NewsletterSuscriptor> = {
      success: true,
      message: 'Desuscripción del newsletter exitosa',
      data: suscriptorDesuscrito,
    };
    
    logInfo('Usuario desuscrito del newsletter', {
      email,
    });
    
    res.json(response);
  } catch (error) {
    logError('Error desuscribiendo del newsletter', error as Error);
    const response: ApiResponse = {
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR',
    };
    res.status(500).json(response);
  }
};

// Obtener suscriptores del newsletter
export const getNewsletterSubscribers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      sort = 'desc', 
      sortBy = 'fecha_suscripcion',
      estado,
      fuente,
      search
    } = req.query;
    
    const offset = (Number(page) - 1) * Number(limit);
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;
    
    // Filtros
    if (estado) {
      whereClause += ` AND estado = $${paramIndex}`;
      params.push(estado);
      paramIndex++;
    }
    
    if (fuente) {
      whereClause += ` AND fuente = $${paramIndex}`;
      params.push(fuente);
      paramIndex++;
    }
    
    if (search) {
      whereClause += ` AND (email ILIKE $${paramIndex} OR nombre ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    
    // Contar total de registros
    const countQuery = `SELECT COUNT(*) as total FROM newsletter_suscriptores ${whereClause}`;
    const countResult = await query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);
    
    // Obtener registros con paginación
    const dataQuery = `
      SELECT * FROM newsletter_suscriptores 
      ${whereClause}
      ORDER BY ${sortBy} ${sort}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(limit, offset);
    
    const dataResult = await query(dataQuery, params);
    
    const response: PaginatedResponse<NewsletterSuscriptor> = {
      success: true,
      message: 'Suscriptores del newsletter obtenidos exitosamente',
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
    logError('Error obteniendo suscriptores del newsletter', error as Error);
    const response: ApiResponse = {
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR',
    };
    res.status(500).json(response);
  }
};

// Obtener estadísticas del newsletter
export const getNewsletterStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;
    
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;
    
    if (startDate) {
      whereClause += ` AND fecha_suscripcion >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }
    
    if (endDate) {
      whereClause += ` AND fecha_suscripcion <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }
    
    // Estadísticas generales
    const statsQuery = `
      SELECT 
        COUNT(*) as total_suscriptores,
        COUNT(CASE WHEN estado = 'activo' THEN 1 END) as suscriptores_activos,
        COUNT(CASE WHEN estado = 'inactivo' THEN 1 END) as suscriptores_inactivos,
        COUNT(CASE WHEN estado = 'baja' THEN 1 END) as suscriptores_baja,
        COUNT(CASE WHEN fuente = 'web' THEN 1 END) as fuente_web,
        COUNT(CASE WHEN fuente = 'redes_sociales' THEN 1 END) as fuente_redes,
        COUNT(CASE WHEN fuente = 'recomendacion' THEN 1 END) as fuente_recomendacion,
        COUNT(CASE WHEN fuente = 'evento' THEN 1 END) as fuente_evento
      FROM newsletter_suscriptores 
      ${whereClause}
    `;
    
    const statsResult = await query(statsQuery, params);
    const stats = statsResult.rows[0];
    
    // Estadísticas por fuente
    const fuenteStatsQuery = `
      SELECT 
        fuente,
        COUNT(*) as count,
        COUNT(CASE WHEN estado = 'activo' THEN 1 END) as activos
      FROM newsletter_suscriptores 
      ${whereClause}
      GROUP BY fuente
      ORDER BY count DESC
    `;
    
    const fuenteStatsResult = await query(fuenteStatsQuery, params);
    
    // Estadísticas por mes (últimos 12 meses)
    const monthlyStatsQuery = `
      SELECT 
        DATE_TRUNC('month', fecha_suscripcion) as mes,
        COUNT(*) as suscripciones,
        COUNT(CASE WHEN estado = 'activo' THEN 1 END) as activos
      FROM newsletter_suscriptores 
      WHERE fecha_suscripcion >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', fecha_suscripcion)
      ORDER BY mes DESC
    `;
    
    const monthlyStatsResult = await query(monthlyStatsQuery);
    
    // Estadísticas por día de la semana
    const dailyStatsQuery = `
      SELECT 
        EXTRACT(DOW FROM fecha_suscripcion) as day_of_week,
        COUNT(*) as suscripciones
      FROM newsletter_suscriptores 
      ${whereClause}
      GROUP BY EXTRACT(DOW FROM fecha_suscripcion)
      ORDER BY day_of_week
    `;
    
    const dailyStatsResult = await query(dailyStatsQuery, params);
    
    // Calcular tasa de retención
    const totalSuscriptores = parseInt(stats.total_suscriptores);
    const suscriptoresActivos = parseInt(stats.suscriptores_activos);
    const retentionRate = totalSuscriptores > 0 ? (suscriptoresActivos / totalSuscriptores * 100) : 0;
    
    const response: ApiResponse = {
      success: true,
      message: 'Estadísticas del newsletter obtenidas exitosamente',
      data: {
        general: {
          total_suscriptores: totalSuscriptores,
          suscriptores_activos: suscriptoresActivos,
          suscriptores_inactivos: parseInt(stats.suscriptores_inactivos),
          suscriptores_baja: parseInt(stats.suscriptores_baja),
          retention_rate: Math.round(retentionRate * 100) / 100,
        },
        por_fuente: {
          web: parseInt(stats.fuente_web),
          redes_sociales: parseInt(stats.fuente_redes),
          recomendacion: parseInt(stats.fuente_recomendacion),
          evento: parseInt(stats.fuente_evento),
        },
        detalle_fuentes: fuenteStatsResult.rows,
        tendencia_mensual: monthlyStatsResult.rows,
        por_dia_semana: dailyStatsResult.rows,
      },
    };
    
    res.json(response);
  } catch (error) {
    logError('Error obteniendo estadísticas del newsletter', error as Error);
    const response: ApiResponse = {
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR',
    };
    res.status(500).json(response);
  }
};

// Verificar estado de suscripción
export const checkSubscriptionStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.params;
    
    const result = await query(
      'SELECT email, estado, fecha_suscripcion, fecha_baja FROM newsletter_suscriptores WHERE email = $1',
      [email]
    );
    
    if (result.rows.length === 0) {
      const response: ApiResponse = {
        success: true,
        message: 'Email no suscrito',
        data: {
          email,
          estado: 'no_suscrito',
          suscrito: false,
        },
      };
      res.json(response);
      return;
    }
    
    const suscriptor = result.rows[0];
    
    const response: ApiResponse = {
      success: true,
      message: 'Estado de suscripción obtenido',
      data: {
        email: suscriptor.email,
        estado: suscriptor.estado,
        suscrito: suscriptor.estado === 'activo',
        fecha_suscripcion: suscriptor.fecha_suscripcion,
        fecha_baja: suscriptor.fecha_baja,
      },
    };
    
    res.json(response);
  } catch (error) {
    logError('Error verificando estado de suscripción', error as Error);
    const response: ApiResponse = {
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR',
    };
    res.status(500).json(response);
  }
};

// Exportar lista de suscriptores
export const exportNewsletterSubscribers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { formato = 'csv', estado = 'activo' } = req.query;
    
    const result = await query(
      'SELECT email, nombre, fuente, fecha_suscripcion FROM newsletter_suscriptores WHERE estado = $1 ORDER BY fecha_suscripcion DESC',
      [estado]
    );
    
    if (formato === 'csv') {
      // Generar CSV
      const csvHeader = 'Email,Nombre,Fuente,Fecha Suscripción\n';
      const csvRows = result.rows.map((row: any) => 
        `"${row.email}","${row.nombre || ''}","${row.fuente || ''}","${row.fecha_suscripcion}"`
      ).join('\n');
      const csvContent = csvHeader + csvRows;
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="newsletter_suscriptores_${estado}.csv"`);
      res.send(csvContent);
    } else {
      // Retornar JSON
      const response: ApiResponse = {
        success: true,
        message: 'Lista de suscriptores exportada exitosamente',
        data: result.rows,
        meta: {
          total: result.rows.length,
          formato: formato as string,
          estado: estado as string,
        },
      };
      res.json(response);
    }
    
    logInfo('Lista de suscriptores exportada', {
      formato,
      estado,
      total: result.rows.length,
    });
  } catch (error) {
    logError('Error exportando lista de suscriptores', error as Error);
    const response: ApiResponse = {
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR',
    };
    res.status(500).json(response);
  }
};
