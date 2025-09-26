import dotenv from 'dotenv';
import Joi from 'joi';
// Cargar variables de entorno
dotenv.config();
// Esquema de validación para variables de entorno
const envSchema = Joi.object({
    NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
    PORT: Joi.number().default(4000),
    HOST: Joi.string().default('localhost'),
    // Base de datos
    DB_HOST: Joi.string().default('localhost'),
    DB_PORT: Joi.number().default(5432),
    DB_NAME: Joi.string().default('sistempos'),
    DB_USER: Joi.string().default('postgres'),
    DB_PASSWORD: Joi.string().default(''),
    // Seguridad
    JWT_SECRET: Joi.string().min(32).required(),
    JWT_EXPIRES_IN: Joi.string().default('24h'),
    BCRYPT_ROUNDS: Joi.number().default(12),
    // CORS
    CORS_ORIGINS: Joi.string().default('http://localhost:8080,http://localhost:8082'),
    // Rate limiting
    RATE_LIMIT_WINDOW_MS: Joi.number().default(900000),
    RATE_LIMIT_MAX_REQUESTS: Joi.number().default(100),
    // Email
    SMTP_HOST: Joi.string().optional(),
    SMTP_PORT: Joi.number().optional(),
    SMTP_USER: Joi.string().optional(),
    SMTP_PASS: Joi.string().optional(),
    SMTP_FROM: Joi.string().optional(),
    // Logging
    LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),
    LOG_FILE_PATH: Joi.string().default('./logs'),
    LOG_MAX_SIZE: Joi.string().default('20m'),
    LOG_MAX_FILES: Joi.string().default('14d'),
    // Analytics
    ANALYTICS_ENABLED: Joi.boolean().default(true),
    TRACKING_RETENTION_DAYS: Joi.number().default(365),
    // Notificaciones
    NOTIFICATION_SERVICE_ENABLED: Joi.boolean().default(true),
    NOTIFICATION_PORT: Joi.number().default(4001),
});
// Validar y parsear variables de entorno
const parseEnv = () => {
    try {
        const { error, value } = envSchema.validate(process.env, { allowUnknown: true });
        if (error) {
            console.error('❌ Error en la configuración de variables de entorno:');
            console.error(`  - ${error.details.map(d => d.message).join(', ')}`);
            process.exit(1);
        }
        return value;
    }
    catch (error) {
        console.error('❌ Error parseando variables de entorno:', error);
        process.exit(1);
    }
};
export const config = parseEnv();
// Configuración de la base de datos
export const dbConfig = {
    host: config.DB_HOST,
    port: config.DB_PORT,
    database: config.DB_NAME,
    user: config.DB_USER,
    password: config.DB_PASSWORD,
    ssl: config.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
};
// Configuración de CORS
export const corsConfig = {
    origin: config.CORS_ORIGINS.split(',').map((origin) => origin.trim()),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-API-Key'],
    optionsSuccessStatus: 200,
};
// Configuración de rate limiting
export const rateLimitConfig = {
    windowMs: config.RATE_LIMIT_WINDOW_MS,
    max: config.RATE_LIMIT_MAX_REQUESTS,
    message: {
        error: 'Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde.',
        retryAfter: Math.ceil(config.RATE_LIMIT_WINDOW_MS / 1000),
    },
    standardHeaders: true,
    legacyHeaders: false,
};
// Configuración de JWT
export const jwtConfig = {
    secret: config.JWT_SECRET,
    expiresIn: config.JWT_EXPIRES_IN,
    algorithm: 'HS256',
};
// Configuración de email
export const emailConfig = {
    host: config.SMTP_HOST,
    port: config.SMTP_PORT,
    secure: false,
    auth: config.SMTP_USER && config.SMTP_PASS ? {
        user: config.SMTP_USER,
        pass: config.SMTP_PASS,
    } : undefined,
    from: config.SMTP_FROM || 'noreply@multiserve.com',
};
// Configuración de logging
export const loggingConfig = {
    level: config.LOG_LEVEL,
    filePath: config.LOG_FILE_PATH,
    maxSize: config.LOG_MAX_SIZE,
    maxFiles: config.LOG_MAX_FILES,
};
// Configuración de analytics
export const analyticsConfig = {
    enabled: config.ANALYTICS_ENABLED,
    retentionDays: config.TRACKING_RETENTION_DAYS,
};
// Configuración del servidor
export const serverConfig = {
    port: config.PORT,
    host: config.HOST,
    env: config.NODE_ENV,
};
// Validar configuración crítica
if (config.NODE_ENV === 'production') {
    if (config.JWT_SECRET.length < 32) {
        console.error('❌ JWT_SECRET debe tener al menos 32 caracteres en producción');
        process.exit(1);
    }
    if (!config.SMTP_HOST || !config.SMTP_USER || !config.SMTP_PASS) {
        console.warn('⚠️ Configuración de email incompleta para producción');
    }
}
console.log('✅ Configuración cargada correctamente');
console.log(`🌍 Entorno: ${config.NODE_ENV}`);
console.log(`🚀 Servidor: ${config.HOST}:${config.PORT}`);
console.log(`🗄️ Base de datos: ${config.DB_HOST}:${config.DB_PORT}/${config.DB_NAME}`);
//# sourceMappingURL=index.js.map