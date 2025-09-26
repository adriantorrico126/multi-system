import { query } from '../config/database.js';
import { logInfo, logError, logAudit } from '../config/logger.js';
import { solicitudDemoSchema } from '../validators/index.js';
// Obtener todas las solicitudes de demo con paginación
export const getSolicitudesDemo = async (req, res) => {
    try {
        const { page = 1, limit = 10, sort = 'desc', sortBy = 'fecha_solicitud', search, status, startDate, endDate } = req.query;
        const offset = (Number(page) - 1) * Number(limit);
        let whereClause = 'WHERE 1=1';
        const params = [];
        let paramIndex = 1;
        // Filtros
        if (search) {
            whereClause += ` AND (nombre ILIKE $${paramIndex} OR email ILIKE $${paramIndex} OR restaurante ILIKE $${paramIndex})`;
            params.push(`%${search}%`);
            paramIndex++;
        }
        if (status) {
            whereClause += ` AND estado = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }
        if (startDate) {
            whereClause += ` AND fecha_solicitud >= $${paramIndex}`;
            params.push(startDate);
            paramIndex++;
        }
        if (endDate) {
            whereClause += ` AND fecha_solicitud <= $${paramIndex}`;
            params.push(endDate);
            paramIndex++;
        }
        // Contar total de registros
        const countQuery = `SELECT COUNT(*) as total FROM solicitudes_demo ${whereClause}`;
        const countResult = await query(countQuery, params);
        const total = parseInt(countResult.rows[0].total);
        // Obtener registros con paginación
        const dataQuery = `
      SELECT * FROM solicitudes_demo 
      ${whereClause}
      ORDER BY ${sortBy} ${sort}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
        params.push(limit, offset);
        const dataResult = await query(dataQuery, params);
        const response = {
            success: true,
            message: 'Solicitudes de demo obtenidas exitosamente',
            data: dataResult.rows,
            meta: {
                total,
                page: Number(page),
                limit: Number(limit),
                hasMore: offset + Number(limit) < total,
                totalPages: Math.ceil(total / Number(limit)),
            },
        };
        logInfo('Solicitudes de demo obtenidas', {
            total,
            page: Number(page),
            limit: Number(limit),
            filters: { search, status, startDate, endDate },
        });
        res.json(response);
    }
    catch (error) {
        logError('Error obteniendo solicitudes de demo', error);
        const response = {
            success: false,
            message: 'Error interno del servidor',
            error: 'INTERNAL_SERVER_ERROR',
        };
        res.status(500).json(response);
    }
};
// Obtener una solicitud de demo por ID
export const getSolicitudDemoById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query('SELECT * FROM solicitudes_demo WHERE id_solicitud = $1', [id]);
        if (result.rows.length === 0) {
            const response = {
                success: false,
                message: 'Solicitud de demo no encontrada',
                error: 'NOT_FOUND',
            };
            res.status(404).json(response);
            return;
        }
        const response = {
            success: true,
            message: 'Solicitud de demo obtenida exitosamente',
            data: result.rows[0],
        };
        res.json(response);
    }
    catch (error) {
        logError('Error obteniendo solicitud de demo por ID', error);
        const response = {
            success: false,
            message: 'Error interno del servidor',
            error: 'INTERNAL_SERVER_ERROR',
        };
        res.status(500).json(response);
    }
};
// Crear nueva solicitud de demo
export const createSolicitudDemo = async (req, res) => {
    try {
        const solicitudData = req.body;
        // Validar datos
        const { error, value: data } = solicitudDemoSchema.validate(solicitudData);
        if (error) {
            const response = {
                success: false,
                message: 'Datos de entrada inválidos',
                error: 'VALIDATION_ERROR',
                errors: error.details.map(detail => ({
                    field: detail.path.join('.'),
                    message: detail.message,
                })),
            };
            res.status(400).json(response);
            return;
        }
        // Insertar en la base de datos
        const insertQuery = `
      INSERT INTO solicitudes_demo (
        nombre, email, telefono, restaurante, plan_interes, 
        tipo_negocio, mensaje, horario_preferido, ip_address, user_agent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;
        const values = [
            data.nombre,
            data.email,
            data.telefono,
            data.restaurante,
            data.plan_interes || null,
            data.tipo_negocio || null,
            data.mensaje || null,
            data.horario_preferido || null,
            req.clientInfo?.ip || null,
            req.clientInfo?.userAgent || null,
        ];
        const result = await query(insertQuery, values);
        const nuevaSolicitud = result.rows[0];
        // Log de auditoría
        logAudit('demo_request_created', undefined, {
            solicitudId: nuevaSolicitud.id_solicitud,
            email: nuevaSolicitud.email,
            restaurante: nuevaSolicitud.restaurante,
            plan: nuevaSolicitud.plan_interes,
            ip: req.clientInfo?.ip,
            userAgent: req.clientInfo?.userAgent,
        });
        const response = {
            success: true,
            message: 'Solicitud de demo creada exitosamente',
            data: nuevaSolicitud,
        };
        logInfo('Nueva solicitud de demo creada', {
            id: nuevaSolicitud.id_solicitud,
            email: nuevaSolicitud.email,
            restaurante: nuevaSolicitud.restaurante,
        });
        res.status(201).json(response);
    }
    catch (error) {
        logError('Error creando solicitud de demo', error);
        const response = {
            success: false,
            message: 'Error interno del servidor',
            error: 'INTERNAL_SERVER_ERROR',
        };
        res.status(500).json(response);
    }
};
// Actualizar solicitud de demo
export const updateSolicitudDemo = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        // Verificar que la solicitud existe
        const existingResult = await query('SELECT * FROM solicitudes_demo WHERE id_solicitud = $1', [id]);
        if (existingResult.rows.length === 0) {
            const response = {
                success: false,
                message: 'Solicitud de demo no encontrada',
                error: 'NOT_FOUND',
            };
            res.status(404).json(response);
            return;
        }
        // Actualizar en la base de datos
        const updateQuery = `
      UPDATE solicitudes_demo 
      SET estado = COALESCE($2, estado),
          procesado_por = COALESCE($3, procesado_por),
          fecha_procesamiento = COALESCE($4, fecha_procesamiento),
          observaciones = COALESCE($5, observaciones),
          updated_at = NOW()
      WHERE id_solicitud = $1
      RETURNING *
    `;
        const values = [
            id,
            updateData.estado || null,
            updateData.procesado_por || null,
            updateData.fecha_procesamiento || null,
            updateData.observaciones || null,
        ];
        const result = await query(updateQuery, values);
        const solicitudActualizada = result.rows[0];
        // Log de auditoría
        logAudit('demo_request_updated', undefined, {
            solicitudId: solicitudActualizada.id_solicitud,
            cambios: updateData,
            ip: req.clientInfo?.ip,
            userAgent: req.clientInfo?.userAgent,
        });
        const response = {
            success: true,
            message: 'Solicitud de demo actualizada exitosamente',
            data: solicitudActualizada,
        };
        logInfo('Solicitud de demo actualizada', {
            id: solicitudActualizada.id_solicitud,
            cambios: updateData,
        });
        res.json(response);
    }
    catch (error) {
        logError('Error actualizando solicitud de demo', error);
        const response = {
            success: false,
            message: 'Error interno del servidor',
            error: 'INTERNAL_SERVER_ERROR',
        };
        res.status(500).json(response);
    }
};
// Eliminar solicitud de demo
export const deleteSolicitudDemo = async (req, res) => {
    try {
        const { id } = req.params;
        // Verificar que la solicitud existe
        const existingResult = await query('SELECT * FROM solicitudes_demo WHERE id_solicitud = $1', [id]);
        if (existingResult.rows.length === 0) {
            const response = {
                success: false,
                message: 'Solicitud de demo no encontrada',
                error: 'NOT_FOUND',
            };
            res.status(404).json(response);
            return;
        }
        // Eliminar de la base de datos
        await query('DELETE FROM solicitudes_demo WHERE id_solicitud = $1', [id]);
        // Log de auditoría
        logAudit('demo_request_deleted', undefined, {
            solicitudId: id,
            email: existingResult.rows[0].email,
            restaurante: existingResult.rows[0].restaurante,
            ip: req.clientInfo?.ip,
            userAgent: req.clientInfo?.userAgent,
        });
        const response = {
            success: true,
            message: 'Solicitud de demo eliminada exitosamente',
        };
        logInfo('Solicitud de demo eliminada', {
            id,
            email: existingResult.rows[0].email,
        });
        res.json(response);
    }
    catch (error) {
        logError('Error eliminando solicitud de demo', error);
        const response = {
            success: false,
            message: 'Error interno del servidor',
            error: 'INTERNAL_SERVER_ERROR',
        };
        res.status(500).json(response);
    }
};
// Obtener estadísticas de solicitudes de demo
export const getSolicitudesDemoStats = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let whereClause = 'WHERE 1=1';
        const params = [];
        let paramIndex = 1;
        if (startDate) {
            whereClause += ` AND fecha_solicitud >= $${paramIndex}`;
            params.push(startDate);
            paramIndex++;
        }
        if (endDate) {
            whereClause += ` AND fecha_solicitud <= $${paramIndex}`;
            params.push(endDate);
            paramIndex++;
        }
        // Estadísticas generales
        const statsQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN estado = 'pendiente' THEN 1 END) as pendientes,
        COUNT(CASE WHEN estado = 'contactado' THEN 1 END) as contactadas,
        COUNT(CASE WHEN estado = 'demo_agendada' THEN 1 END) as demos_agendadas,
        COUNT(CASE WHEN estado = 'convertido' THEN 1 END) as convertidas,
        COUNT(CASE WHEN estado = 'perdido' THEN 1 END) as perdidas,
        COUNT(CASE WHEN plan_interes = 'basico' THEN 1 END) as plan_basico,
        COUNT(CASE WHEN plan_interes = 'profesional' THEN 1 END) as plan_profesional,
        COUNT(CASE WHEN plan_interes = 'empresarial' THEN 1 END) as plan_empresarial,
        COUNT(CASE WHEN plan_interes = 'personalizado' THEN 1 END) as plan_personalizado
      FROM solicitudes_demo 
      ${whereClause}
    `;
        const statsResult = await query(statsQuery, params);
        const stats = statsResult.rows[0];
        // Estadísticas por tipo de negocio
        const businessTypeQuery = `
      SELECT 
        tipo_negocio,
        COUNT(*) as count
      FROM solicitudes_demo 
      ${whereClause}
      GROUP BY tipo_negocio
      ORDER BY count DESC
    `;
        const businessTypeResult = await query(businessTypeQuery, params);
        // Estadísticas por día (últimos 30 días)
        const dailyStatsQuery = `
      SELECT 
        DATE(fecha_solicitud) as fecha,
        COUNT(*) as solicitudes
      FROM solicitudes_demo 
      WHERE fecha_solicitud >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(fecha_solicitud)
      ORDER BY fecha DESC
    `;
        const dailyStatsResult = await query(dailyStatsQuery);
        const response = {
            success: true,
            message: 'Estadísticas de solicitudes de demo obtenidas exitosamente',
            data: {
                general: {
                    total: parseInt(stats.total),
                    pendientes: parseInt(stats.pendientes),
                    contactadas: parseInt(stats.contactadas),
                    demos_agendadas: parseInt(stats.demos_agendadas),
                    convertidas: parseInt(stats.convertidas),
                    perdidas: parseInt(stats.perdidas),
                },
                planes: {
                    basico: parseInt(stats.plan_basico),
                    profesional: parseInt(stats.plan_profesional),
                    empresarial: parseInt(stats.plan_empresarial),
                    personalizado: parseInt(stats.plan_personalizado),
                },
                tipos_negocio: businessTypeResult.rows,
                tendencia_diaria: dailyStatsResult.rows,
            },
        };
        res.json(response);
    }
    catch (error) {
        logError('Error obteniendo estadísticas de solicitudes de demo', error);
        const response = {
            success: false,
            message: 'Error interno del servidor',
            error: 'INTERNAL_SERVER_ERROR',
        };
        res.status(500).json(response);
    }
};
//# sourceMappingURL=solicitudesDemoController.js.map