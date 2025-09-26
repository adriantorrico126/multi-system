import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import { loggingConfig, serverConfig } from './index.js';
// Formato personalizado para los logs
const logFormat = winston.format.combine(winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss.SSS'
}), winston.format.errors({ stack: true }), winston.format.json(), winston.format.prettyPrint());
// Formato para consola (más legible)
const consoleFormat = winston.format.combine(winston.format.colorize(), winston.format.timestamp({
    format: 'HH:mm:ss'
}), winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    // Agregar metadata si existe
    if (Object.keys(meta).length > 0) {
        log += `\n${JSON.stringify(meta, null, 2)}`;
    }
    return log;
}));
// Configuración de transporte para archivos
const fileTransport = new DailyRotateFile({
    filename: path.join(loggingConfig.filePath, 'application-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: loggingConfig.maxSize,
    maxFiles: loggingConfig.maxFiles,
    format: logFormat,
    zippedArchive: true,
});
// Configuración de transporte para errores
const errorFileTransport = new DailyRotateFile({
    filename: path.join(loggingConfig.filePath, 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: loggingConfig.maxSize,
    maxFiles: loggingConfig.maxFiles,
    format: logFormat,
    zippedArchive: true,
    level: 'error',
});
// Configuración de transporte para auditoría
const auditFileTransport = new DailyRotateFile({
    filename: path.join(loggingConfig.filePath, 'audit-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: loggingConfig.maxSize,
    maxFiles: loggingConfig.maxFiles,
    format: logFormat,
    zippedArchive: true,
});
// Crear logger principal
const logger = winston.createLogger({
    level: loggingConfig.level,
    format: logFormat,
    defaultMeta: {
        service: 'multiserve-web-backend',
        environment: serverConfig.env,
        version: process.env.npm_package_version || '1.0.0',
    },
    transports: [
        fileTransport,
        errorFileTransport,
    ],
    exceptionHandlers: [
        new winston.transports.File({
            filename: path.join(loggingConfig.filePath, 'exceptions.log'),
            format: logFormat,
        }),
    ],
    rejectionHandlers: [
        new winston.transports.File({
            filename: path.join(loggingConfig.filePath, 'rejections.log'),
            format: logFormat,
        }),
    ],
});
// Agregar transporte de consola solo en desarrollo
if (serverConfig.env === 'development') {
    logger.add(new winston.transports.Console({
        format: consoleFormat,
    }));
}
// Logger específico para auditoría
export const auditLogger = winston.createLogger({
    level: 'info',
    format: logFormat,
    defaultMeta: {
        service: 'multiserve-web-backend',
        type: 'audit',
        environment: serverConfig.env,
    },
    transports: [
        auditFileTransport,
    ],
});
// Logger específico para métricas
export const metricsLogger = winston.createLogger({
    level: 'info',
    format: logFormat,
    defaultMeta: {
        service: 'multiserve-web-backend',
        type: 'metrics',
        environment: serverConfig.env,
    },
    transports: [
        new DailyRotateFile({
            filename: path.join(loggingConfig.filePath, 'metrics-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            maxSize: loggingConfig.maxSize,
            maxFiles: loggingConfig.maxFiles,
            format: logFormat,
            zippedArchive: true,
        }),
    ],
});
// Funciones de utilidad para logging
export const logInfo = (message, meta) => {
    logger.info(message, meta);
};
export const logError = (message, error, meta) => {
    logger.error(message, { error: error?.message, stack: error?.stack, ...meta });
};
export const logWarn = (message, meta) => {
    logger.warn(message, meta);
};
export const logDebug = (message, meta) => {
    logger.debug(message, meta);
};
// Función para logging de auditoría
export const logAudit = (action, userId, details) => {
    auditLogger.info('Audit event', {
        action,
        userId,
        timestamp: new Date().toISOString(),
        ip: details?.ip,
        userAgent: details?.userAgent,
        ...details,
    });
};
// Función para logging de métricas
export const logMetrics = (metric, value, tags) => {
    metricsLogger.info('Metric recorded', {
        metric,
        value,
        tags,
        timestamp: new Date().toISOString(),
    });
};
// Middleware para logging de requests HTTP
export const requestLogger = (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        const logData = {
            method: req.method,
            url: req.url,
            status: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent'),
            contentLength: res.get('Content-Length'),
        };
        if (res.statusCode >= 400) {
            logError('HTTP Request Error', undefined, logData);
        }
        else {
            logInfo('HTTP Request', logData);
        }
    });
    next();
};
export default logger;
//# sourceMappingURL=logger.js.map