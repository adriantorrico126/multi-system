const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf, colorize, align } = format;

const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

const logger = createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }), // Captura el stack trace para errores
    logFormat
  ),
  transports: [
    new transports.Console({
      format: combine(
        colorize(),
        align(),
        logFormat
      )
    }),
    new transports.File({ filename: 'error.log', level: 'error' }),
    new transports.File({ filename: 'combined.log' })
  ],
  exceptionHandlers: [
    new transports.File({ filename: 'exceptions.log' })
  ],
  rejectionHandlers: [
    new transports.File({ filename: 'rejections.log' })
  ]
});

module.exports = logger;
