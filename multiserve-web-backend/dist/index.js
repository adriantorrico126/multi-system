import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';
import fs from 'fs';
// Importar configuración
import { serverConfig, corsConfig } from './config/index.js';
import { testConnection, initializeWebTables } from './config/database.js';
import { logInfo, logError } from './config/logger.js';
// Importar middleware
import { securityMiddleware, corsMiddleware, compressionMiddleware, loggingMiddleware, corsErrorHandler, jsonValidationMiddleware, payloadSizeMiddleware, securityHeadersMiddleware, errorHandler, notFoundHandler, requestInfoMiddleware, customRequestLogger, } from './middleware/index.js';
// Importar rutas
import routes from './routes/index.js';
// Crear aplicación Express
const app = express();
const server = createServer(app);
// Configurar Socket.IO para notificaciones en tiempo real
const io = new SocketIOServer(server, {
    cors: corsConfig,
    path: '/socket.io',
});
// Crear directorio de logs si no existe
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}
// Middleware de seguridad
app.use(securityMiddleware);
app.use(securityHeadersMiddleware);
// Middleware de CORS
app.use(corsMiddleware);
app.use(corsErrorHandler);
// Middleware de compresión
app.use(compressionMiddleware);
// Middleware de logging
app.use(requestInfoMiddleware);
app.use(customRequestLogger);
app.use(loggingMiddleware);
// Middleware de validación
app.use(jsonValidationMiddleware);
app.use(payloadSizeMiddleware('10mb'));
// Middleware de parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
// Configurar Socket.IO
io.on('connection', (socket) => {
    logInfo('Cliente conectado via WebSocket', {
        socketId: socket.id,
        ip: socket.handshake.address,
    });
    // Unirse a sala de notificaciones
    socket.join('notifications');
    // Manejar desconexión
    socket.on('disconnect', () => {
        logInfo('Cliente desconectado via WebSocket', {
            socketId: socket.id,
        });
    });
    // Manejar errores de socket
    socket.on('error', (error) => {
        logError('Error en WebSocket', error);
    });
});
// Hacer io disponible en las rutas
app.use((req, res, next) => {
    req.io = io;
    next();
});
// Rutas principales
app.use('/api', routes);
// Ruta raíz
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: '🚀 MultiServe Web Backend - Sistema de Marketing y Conversión',
        version: process.env.npm_package_version || '1.0.0',
        environment: serverConfig.env,
        timestamp: new Date().toISOString(),
        endpoints: {
            health: '/api/health',
            info: '/api/info',
            demo_requests: '/api/demo-request',
            conversion_tracking: '/api/conversion-tracking',
            user_sessions: '/api/user-sessions',
            newsletter: '/api/newsletter',
        },
        documentation: 'https://github.com/multiserve/multiserve-web-backend',
    });
});
// Middleware de manejo de errores
app.use(notFoundHandler);
app.use(errorHandler);
// Función para inicializar el servidor
const initializeServer = async () => {
    try {
        logInfo('🚀 Inicializando servidor MultiServe Web Backend...');
        // Probar conexión a la base de datos
        logInfo('📊 Probando conexión a la base de datos...');
        const dbConnected = await testConnection();
        if (!dbConnected) {
            throw new Error('No se pudo conectar a la base de datos');
        }
        // Inicializar tablas de la página web
        logInfo('🗄️ Inicializando tablas de la página web...');
        await initializeWebTables();
        // Iniciar servidor
        server.listen(serverConfig.port, serverConfig.host, () => {
            logInfo('✅ Servidor iniciado exitosamente', {
                host: serverConfig.host,
                port: serverConfig.port,
                environment: serverConfig.env,
                version: process.env.npm_package_version || '1.0.0',
                database: 'PostgreSQL',
                features: [
                    'Solicitudes de demo',
                    'Tracking de conversión',
                    'Gestión de sesiones',
                    'Newsletter',
                    'WebSocket notifications',
                    'Logging profesional',
                    'Seguridad avanzada',
                ],
            });
            console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    🚀 MULTISERVE WEB BACKEND                 ║
╠══════════════════════════════════════════════════════════════╣
║  🌐 Servidor:     http://${serverConfig.host}:${serverConfig.port}                    ║
║  🔧 Entorno:      ${serverConfig.env.padEnd(20)} ║
║  📊 Base de datos: PostgreSQL                               ║
║  🔌 WebSocket:    http://${serverConfig.host}:${serverConfig.port}/socket.io           ║
║  📚 Documentación: /api/info                                ║
║  ❤️  Salud:       /api/health                               ║
╚══════════════════════════════════════════════════════════════╝
      `);
        });
    }
    catch (error) {
        logError('❌ Error inicializando servidor', error);
        process.exit(1);
    }
};
// Manejar señales de terminación
const gracefulShutdown = (signal) => {
    logInfo(`🛑 Recibida señal ${signal}, cerrando servidor...`);
    server.close(() => {
        logInfo('✅ Servidor cerrado exitosamente');
        process.exit(0);
    });
    // Forzar cierre después de 10 segundos
    setTimeout(() => {
        logError('⚠️ Forzando cierre del servidor');
        process.exit(1);
    }, 10000);
};
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
// Manejar errores no capturados
process.on('uncaughtException', (error) => {
    logError('💥 Excepción no capturada', error);
    process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
    logError('💥 Promesa rechazada no manejada', reason, { promise });
    process.exit(1);
});
// Inicializar servidor
initializeServer();
// Exportar para testing
export { app, server, io };
//# sourceMappingURL=index.js.map