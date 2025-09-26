import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import { corsConfig, rateLimitConfig } from '../config/index.js';
import { logError, logWarn } from '../config/logger.js';
import { validateQueryParams } from '../validators/index.js';
// Middleware de seguridad con Helmet
export const securityMiddleware = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:"],
            scriptSrc: ["'self'"],
            connectSrc: ["'self'"],
        },
    },
    crossOriginEmbedderPolicy: false,
});
// Middleware de CORS
export const corsMiddleware = cors(corsConfig);
// Middleware de compresión
export const compressionMiddleware = compression();
// Middleware de logging de requests
export const loggingMiddleware = morgan('combined', {
    stream: {
        write: (message) => {
            // El logging se maneja en requestLogger
        },
    },
});
// Middleware de rate limiting
export const rateLimitMiddleware = rateLimit(rateLimitConfig);
// Middleware para manejar errores de CORS
export const corsErrorHandler = (req, res, next) => {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-API-Key');
    res.header('Access-Control-Allow-Credentials', 'true');
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    }
    else {
        next();
    }
};
// Middleware para validar JSON
export const jsonValidationMiddleware = (req, res, next) => {
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
        if (req.headers['content-type'] && !req.headers['content-type'].includes('application/json')) {
            const response = {
                success: false,
                message: 'Content-Type debe ser application/json',
                error: 'INVALID_CONTENT_TYPE',
            };
            res.status(400).json(response);
            return;
        }
    }
    next();
};
// Middleware para validar tamaño de payload
export const payloadSizeMiddleware = (maxSize = '10mb') => {
    return (req, res, next) => {
        const contentLength = parseInt(req.headers['content-length'] || '0');
        const maxSizeBytes = parseSize(maxSize);
        if (contentLength > maxSizeBytes) {
            const response = {
                success: false,
                message: `Payload demasiado grande. Máximo permitido: ${maxSize}`,
                error: 'PAYLOAD_TOO_LARGE',
            };
            res.status(413).json(response);
            return;
        }
        next();
    };
};
// Middleware para validar esquemas de datos
export const validateSchema = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body);
        if (error) {
            const response = {
                success: false,
                message: 'Datos de entrada inválidos',
                error: 'VALIDATION_ERROR',
                errors: error.details.map((detail) => ({
                    field: detail.path.join('.'),
                    message: detail.message,
                })),
            };
            res.status(400).json(response);
            return;
        }
        req.body = value;
        next();
    };
};
// Middleware para validar parámetros de consulta
export const validateQuery = (req, res, next) => {
    const { error, value } = validateQueryParams(req.query);
    if (error) {
        const response = {
            success: false,
            message: 'Parámetros de consulta inválidos',
            error: 'INVALID_QUERY_PARAMS',
            errors: error.details.map((detail) => ({
                field: detail.path.join('.'),
                message: detail.message,
            })),
        };
        res.status(400).json(response);
        return;
    }
    req.query = value;
    next();
};
// Middleware para sanitizar datos de entrada
export const sanitizeInput = (req, res, next) => {
    // Sanitizar strings en el body
    if (req.body && typeof req.body === 'object') {
        req.body = sanitizeObject(req.body);
    }
    // Sanitizar strings en los query params
    if (req.query && typeof req.query === 'object') {
        req.query = sanitizeObject(req.query);
    }
    next();
};
// Middleware para agregar headers de seguridad
export const securityHeadersMiddleware = (req, res, next) => {
    // Prevenir clickjacking
    res.setHeader('X-Frame-Options', 'DENY');
    // Prevenir MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');
    // Habilitar XSS protection
    res.setHeader('X-XSS-Protection', '1; mode=block');
    // Referrer policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    // Permissions policy
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    next();
};
// Middleware para manejar errores globales
export const errorHandler = (err, req, res, next) => {
    logError('Error no manejado', err, {
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
    });
    const response = {
        success: false,
        message: 'Error interno del servidor',
        error: 'INTERNAL_SERVER_ERROR',
    };
    // En desarrollo, incluir detalles del error
    if (process.env.NODE_ENV === 'development') {
        response.error = err.message;
        response.data = {
            stack: err.stack,
            name: err.name,
        };
    }
    res.status(500).json(response);
};
// Middleware para manejar rutas no encontradas
export const notFoundHandler = (req, res) => {
    logWarn('Ruta no encontrada', {
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
    });
    const response = {
        success: false,
        message: 'Ruta no encontrada',
        error: 'NOT_FOUND',
    };
    res.status(404).json(response);
};
// Middleware para agregar información de request
export const requestInfoMiddleware = (req, res, next) => {
    req.requestId = generateRequestId();
    req.startTime = Date.now();
    // Agregar información del cliente
    req.clientInfo = {
        ip: req.ip || req.connection.remoteAddress || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown',
        referer: req.get('Referer') || 'unknown',
        origin: req.get('Origin') || 'unknown',
    };
    next();
};
// Middleware para logging de requests personalizado
export const customRequestLogger = (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        const logData = {
            requestId: req.requestId,
            method: req.method,
            url: req.url,
            status: res.statusCode,
            duration: `${duration}ms`,
            clientInfo: req.clientInfo,
            contentLength: res.get('Content-Length'),
        };
        if (res.statusCode >= 400) {
            logError('HTTP Request Error', undefined, logData);
        }
        else {
            console.log('HTTP Request', logData);
        }
    });
    next();
};
// Funciones helper
function parseSize(size) {
    const units = {
        b: 1,
        kb: 1024,
        mb: 1024 * 1024,
        gb: 1024 * 1024 * 1024,
    };
    const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)$/);
    if (!match)
        return 10 * 1024 * 1024; // Default 10MB
    const value = parseFloat(match[1]);
    const unit = match[2];
    return value * (units[unit] || 1);
}
function sanitizeObject(obj) {
    if (typeof obj === 'string') {
        return obj.trim().replace(/[<>]/g, '');
    }
    if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
    }
    if (obj && typeof obj === 'object') {
        const sanitized = {};
        for (const key in obj) {
            sanitized[key] = sanitizeObject(obj[key]);
        }
        return sanitized;
    }
    return obj;
}
function generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
//# sourceMappingURL=index.js.map