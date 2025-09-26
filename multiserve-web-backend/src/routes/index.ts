import { Router } from 'express';
import solicitudesDemoRouter from './solicitudesDemo.js';
import conversionEventsRouter from './conversionEvents.js';
import userSessionsRouter from './userSessions.js';
import newsletterRouter from './newsletter.js';

const router = Router();

// Rutas principales
router.use('/demo-request', solicitudesDemoRouter);
router.use('/conversion-tracking', conversionEventsRouter);
router.use('/user-sessions', userSessionsRouter);
router.use('/newsletter', newsletterRouter);

// Ruta de salud del sistema
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Backend de la página web funcionando correctamente',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  });
});

// Ruta de información del sistema
router.get('/info', (req, res) => {
  res.json({
    success: true,
    message: 'Información del sistema',
    data: {
      name: 'MultiServe Web Backend',
      description: 'Backend profesional para la página web de marketing de MultiServe POS',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      features: [
        'Solicitudes de demo',
        'Tracking de conversión',
        'Gestión de sesiones de usuario',
        'Newsletter y suscripciones',
        'Analytics y métricas',
        'Logging profesional',
        'Validación de datos',
        'Seguridad avanzada',
      ],
      endpoints: {
        'POST /demo-request': 'Crear solicitud de demo',
        'GET /demo-request': 'Obtener solicitudes de demo',
        'GET /demo-request/stats': 'Estadísticas de solicitudes',
        'POST /conversion-tracking': 'Registrar evento de conversión',
        'GET /conversion-tracking': 'Obtener eventos de conversión',
        'GET /conversion-tracking/stats': 'Estadísticas de conversión',
        'POST /user-sessions': 'Crear/actualizar sesión de usuario',
        'GET /user-sessions': 'Obtener sesiones de usuario',
        'GET /user-sessions/stats': 'Estadísticas de sesiones',
        'POST /newsletter/subscribe': 'Suscribirse al newsletter',
        'POST /newsletter/unsubscribe/:email': 'Desuscribirse del newsletter',
        'GET /newsletter': 'Obtener suscriptores',
        'GET /newsletter/stats': 'Estadísticas del newsletter',
      },
    },
  });
});

export default router;


