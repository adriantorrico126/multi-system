import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import pool from '../config/database.js';
import { logInfo, logError } from '../config/logger.js';

const router = Router();

// Validaciones para el formulario de contacto
const contactFormValidation = [
  body('nombre').notEmpty().withMessage('El nombre es requerido'),
  body('email').isEmail().withMessage('Email válido requerido'),
  body('telefono').notEmpty().withMessage('El teléfono es requerido'),
  body('restaurante').notEmpty().withMessage('El nombre del restaurante es requerido'),
  body('planInteres').optional(),
  body('tipoNegocio').optional(),
  body('mensaje').optional(),
  body('prefijoHorario').optional()
];

// Endpoint para recibir solicitudes de demo
router.post('/demo-request', contactFormValidation, async (req: any, res: any) => {
  try {
    // Validar datos
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Datos de formulario inválidos',
        errors: errors.array()
      });
    }

    const {
      nombre,
      email,
      telefono,
      restaurante,
      planInteres,
      tipoNegocio,
      mensaje,
      prefijoHorario
    } = req.body;

    // Insertar solicitud en la base de datos
    const insertQuery = `
      INSERT INTO solicitudes_demo (
        nombre,
        email,
        telefono,
        restaurante,
        plan_interes,
        tipo_negocio,
        mensaje,
        horario_preferido,
        estado,
        fecha_solicitud,
        ip_address,
        user_agent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pendiente', NOW(), $9, $10)
      RETURNING id_solicitud
    `;

    const values = [
      nombre,
      email,
      telefono,
      restaurante,
      planInteres || null,
      tipoNegocio || null,
      mensaje || null,
      prefijoHorario || null,
      req.ip,
      req.get('User-Agent')
    ];

    const { rows } = await pool.query(insertQuery, values);
    const solicitudId = rows[0].id_solicitud;

    // Log de la solicitud
    logInfo(`Nueva solicitud de demo recibida: ID ${solicitudId}`, {
      solicitudId,
      nombre,
      email,
      restaurante,
      planInteres,
      tipoNegocio
    });

    res.status(200).json({
      success: true,
      message: 'Solicitud de demo enviada exitosamente',
      data: {
        solicitudId,
        nombre,
        email,
        restaurante
      }
    });

  } catch (error: any) {
    logError('Error procesando solicitud de demo:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Endpoint para tracking de conversiones
router.post('/conversion-tracking', async (req: any, res: any) => {
  try {
    const {
      event,
      timestamp,
      plan,
      userAgent,
      referrer,
      sessionId
    } = req.body;

    // Insertar evento de tracking
    const insertQuery = `
      INSERT INTO conversion_events (
        event_type,
        timestamp,
        plan_name,
        user_agent,
        referrer,
        session_id,
        ip_address
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;

    const values = [
      event,
      new Date(timestamp),
      plan || null,
      userAgent,
      referrer,
      sessionId,
      req.ip
    ];

    await pool.query(insertQuery, values);

    res.status(200).json({
      success: true,
      message: 'Evento de conversión registrado'
    });

  } catch (error: any) {
    logError('Error registrando evento de conversión:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

export default router;
