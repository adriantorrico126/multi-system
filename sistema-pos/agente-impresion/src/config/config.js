/**
 * Configuración del Agente de Impresión
 * Este archivo se puede modificar para personalizar el comportamiento
 */

module.exports = {
  // Configuración del servidor
  server: {
    url: process.env.PRINT_SERVER_URL || "http://localhost:3001",
    timeout: Number(process.env.CONNECTION_TIMEOUT) || 20000,
    reconnectAttempts: Number(process.env.RECONNECT_ATTEMPTS) || 10,
    reconnectDelay: Number(process.env.RECONNECT_DELAY) || 5000,
    heartbeatInterval: Number(process.env.HEARTBEAT_INTERVAL) || 30000
  },

  // Configuración del agente
  agent: {
    id: process.env.AGENT_ID || null, // Se genera automáticamente si es null
    restauranteId: Number(process.env.RESTAURANTE_ID) || 1,
    token: process.env.PRINT_AGENT_TOKEN || "un_token_secreto_para_autenticar_agentes",
    name: process.env.AGENT_NAME || "Agente Principal"
  },

  // Configuración de la impresora
  printer: {
    type: process.env.PRINTER_TYPE || "EPSON",
    interface: process.env.PRINTER_INTERFACE || "USB",
    options: {
      timeout: 5000,
      removeSpecialCharacters: false,
      lineCharacter: "-",
      encoding: "UTF-8" // Encoding explícito para evitar errores
    }
  },

  // Configuración de impresión
  printing: {
    dryRun: String(process.env.DRY_RUN || 'true').toLowerCase() === 'true',
    maxRetries: 3,
    retryDelay: 1000,
    paperSize: process.env.PAPER_SIZE || "80mm", // 80mm o 58mm
    encoding: "UTF-8"
  },

  // Configuración de logging
  logging: {
    level: process.env.LOG_LEVEL || "info",
    maxFiles: 5,
    maxSize: "10m",
    directory: "logs"
  },

  // Configuración de seguridad
  security: {
    enableSSL: String(process.env.ENABLE_SSL || 'false').toLowerCase() === 'true',
    sslCert: process.env.SSL_CERT || null,
    sslKey: process.env.SSL_KEY || null,
    allowedOrigins: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['*']
  },

  // Configuración de monitoreo
  monitoring: {
    enableMetrics: true,
    metricsPort: Number(process.env.METRICS_PORT) || 9090,
    healthCheckInterval: 30000
  },

  // Configuración de plantillas
  templates: {
    default: "standard",
    custom: {
      standard: {
        header: [
          "Comanda: #{id}",
          "Mesa: {mesa}",
          "Mesero: {mesero}",
          "{fecha}",
          "─".repeat(32)
        ],
        footer: [
          "",
          "─".repeat(32),
          "Gracias por su preferencia"
        ]
      },
      simple: {
        header: [
          "Comanda #{id}",
          "Mesa {mesa}",
          "{fecha}"
        ],
        footer: []
      }
    }
  }
};
