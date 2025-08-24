#!/usr/bin/env node

/**
 * Agente de Impresión Profesional para Sitemm
 * Sistema de impresión distribuido para restaurantes
 * 
 * @author Sitemm Team
 * @version 2.0.0
 */

require('dotenv').config();
const winston = require('winston');
const { v4: uuidv4 } = require('uuid');

// Importar servicios y utilidades
const config = require('./config/config');
const PrinterService = require('./services/printerService');
const WebSocketService = require('./services/websocketService');
const SystemUtils = require('./utils/systemUtils');
const { TicketTemplateManager } = require('./templates/ticketTemplates');

// Configuración de logging profesional
const logger = winston.createLogger({
  level: config.logging.level || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'agente-impresion' },
  transports: [
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      maxFiles: config.logging.maxFiles || 5,
      maxSize: config.logging.maxSize || '10m'
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      maxFiles: config.logging.maxFiles || 5,
      maxSize: config.logging.maxSize || '10m'
    }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Crear directorio de logs si no existe
if (!require('fs').existsSync('logs')) {
  require('fs').mkdirSync('logs', { recursive: true });
}

// Estado del agente
const agentState = {
  id: process.env.AGENT_ID || uuidv4(),
  connected: false,
  lastHeartbeat: null,
  printQueue: [],
  printerStatus: 'disconnected',
  totalPrints: 0,
  successfulPrints: 0,
  failedPrints: 0,
  startTime: Date.now()
};

// Instanciar servicios
const systemUtils = new SystemUtils();
const printerService = new PrinterService(config);
const websocketService = new WebSocketService(config);
const templateManager = new TicketTemplateManager();

/**
 * Inicializa el agente
 */
async function initializeAgent() {
  try {
    logger.info('Iniciando agente de impresión', {
      version: '2.0.0',
      agentId: agentState.id,
      restauranteId: config.agent.restauranteId,
      backendUrl: config.server.url,
      dryRun: config.printing.dryRun,
      printerInterface: config.printer.interface
    });

    // Verificar configuración
    const configValidation = systemUtils.validateConfig(config);
    if (!configValidation.isValid) {
      logger.error('Configuración inválida', {
        errors: configValidation.errors
      });
      throw new Error(`Configuración inválida: ${configValidation.errors.join(', ')}`);
    }

    // Inicializar impresora
    if (!config.printing.dryRun) {
      const printerInitialized = await printerService.initialize();
      if (!printerInitialized) {
        logger.warn('Impresora no inicializada, continuando en modo DRY_RUN');
        config.printing.dryRun = true;
      } else {
        agentState.printerStatus = 'connected';
      }
    }

    // Conectar WebSocket
    await websocketService.connect();
    agentState.connected = true;

    // Configurar eventos
    setupEventHandlers();

    logger.info('Agente inicializado correctamente', {
      agentId: agentState.id,
      printerStatus: agentState.printerStatus,
      dryRun: config.printing.dryRun
    });

    return true;

  } catch (error) {
    logger.error('Error al inicializar agente', {
      error: error.message,
      stack: error.stack
    });
    return false;
  }
}

/**
 * Configura los manejadores de eventos
 */
function setupEventHandlers() {
  // Eventos de WebSocket
  websocketService.on('connected', (data) => {
    agentState.connected = true;
    logger.info('Conectado al servidor backend', data);
  });

  websocketService.on('disconnected', (data) => {
    agentState.connected = false;
    logger.warn('Desconectado del servidor', data);
  });

  websocketService.on('print_request', async (data) => {
    await handlePrintRequest(data);
  });

  websocketService.on('server_status', (status) => {
    logger.info('Estado del servidor recibido', { status });
  });

  websocketService.on('config_update', (config) => {
    logger.info('Configuración actualizada desde servidor', { config });
    // Aquí se podría actualizar la configuración local
  });

  // Eventos de sistema
  process.on('SIGINT', handleShutdown);
  process.on('SIGTERM', handleShutdown);
  process.on('uncaughtException', handleUncaughtError);
  process.on('unhandledRejection', handleUnhandledRejection);
}

/**
 * Maneja una solicitud de impresión
 */
async function handlePrintRequest(data) {
  const printId = uuidv4();
  const startTime = Date.now();
  
  logger.info('Procesando solicitud de impresión', {
    printId,
    pedidoId: data.id_pedido || data.id_venta,
    mesa: data.mesa,
    productos: data.productos?.length || 0
  });

  // Agregar a cola de impresión
  const queueItem = {
    id: printId,
    data,
    timestamp: startTime,
    status: 'processing'
  };
  
  agentState.printQueue.push(queueItem);

  try {
    // Preparar datos del ticket
    const ticketData = {
      id: data.id_pedido || data.id_venta,
      mesa: data.mesa || data.mesa_numero,
      mesero: data.mesero || data.mesero_nombre,
      items: data.productos || [],
      total: data.total || 0,
      fecha: new Date().toLocaleDateString('es-BO'),
      hora: new Date().toLocaleTimeString('es-BO')
    };

    let result;

    if (config.printing.dryRun) {
      // Modo de prueba - guardar en archivo
      const template = templateManager.getTemplate(config.templates.default);
      const processedTemplate = templateManager.processTemplate(config.templates.default, ticketData);
      
      const content = [
        ...processedTemplate.header,
        '',
        ...ticketData.items.map(item => {
          let line = template.itemFormat.product
            .replace('{quantity}', item.cantidad)
            .replace('{name}', item.nombre);
          
          if (item.notas && item.notas.trim()) {
            line += '\n' + template.itemFormat.notes.replace('{notes}', item.notas);
          }
          
          if (item.precio) {
            line += '\n' + template.itemFormat.price.replace('{price}', item.precio);
          }
          
          return line;
        }),
        '',
        ...processedTemplate.footer
      ].join('\n');

      const saveResult = systemUtils.savePrintout(content, ticketData.id);
      
      if (saveResult.success) {
        result = { success: true, printId, duration: Date.now() - startTime };
        logger.info('Ticket guardado en archivo (DRY_RUN)', {
          filename: saveResult.filename,
          printId,
          lines: content.split('\n').length
        });
      } else {
        throw new Error(saveResult.error);
      }
    } else {
      // Impresión real
      result = await printerService.printTicket(ticketData);
    }

    // Actualizar estadísticas
    if (result.success) {
      agentState.successfulPrints++;
      agentState.totalPrints++;
      queueItem.status = 'completed';
      queueItem.result = result;
      
      logger.info('Impresión completada exitosamente', {
        printId,
        duration: result.duration || Date.now() - startTime
      });
    } else {
      throw new Error(result.error || 'Error desconocido en impresión');
    }

    // Confirmar al servidor
    websocketService.sendPrintConfirmation(
      ticketData.id,
      result.success,
      printId,
      result.error
    );

  } catch (error) {
    agentState.failedPrints++;
    agentState.totalPrints++;
    queueItem.status = 'failed';
    queueItem.error = error.message;
    
    logger.error('Error al procesar impresión', {
      printId,
      error: error.message,
      stack: error.stack
    });

    // Confirmar error al servidor
    websocketService.sendPrintConfirmation(
      data.id_pedido || data.id_venta,
      false,
      printId,
      error.message
    );
  }
}

/**
 * Maneja el cierre del agente
 */
async function handleShutdown(signal) {
  logger.info(`Recibida señal ${signal}, cerrando agente...`, {
    agentId: agentState.id
  });

  try {
    // Notificar al servidor
    if (agentState.connected) {
      websocketService.socket?.emit('agent-shutdown', {
        agentId: agentState.id,
        reason: signal
      });
    }

    // Cerrar servicios
    await printerService.close();
    websocketService.disconnect();

    // Crear backup de configuración
    const backupResult = systemUtils.createBackup();
    if (backupResult.success) {
      logger.info('Backup de configuración creado', {
        path: backupResult.path
      });
    }

    logger.info('Agente cerrado correctamente', {
      agentId: agentState.id,
      uptime: Date.now() - agentState.startTime
    });

    process.exit(0);

  } catch (error) {
    logger.error('Error al cerrar agente', {
      error: error.message,
      agentId: agentState.id
    });
    process.exit(1);
  }
}

/**
 * Maneja errores no capturados
 */
function handleUncaughtError(error) {
  logger.error('Error no capturado', {
    error: error.message,
    stack: error.stack,
    agentId: agentState.id
  });
  
  // Crear backup antes de salir
  systemUtils.createBackup();
  process.exit(1);
}

/**
 * Maneja promesas rechazadas no manejadas
 */
function handleUnhandledRejection(reason, promise) {
  logger.error('Promesa rechazada no manejada', {
    reason,
    promise,
    agentId: agentState.id
  });
}

/**
 * Función principal
 */
async function main() {
  try {
    // Verificar configuración
    if (!config.agent.token || config.agent.token === "un_token_secreto_para_autenticar_agentes") {
      logger.warn('Usando token por defecto. Configure PRINT_AGENT_TOKEN en producción.');
    }

    if (config.printing.dryRun) {
      logger.info('Modo DRY_RUN habilitado: las comandas se guardarán en archivos de texto');
    }

    // Inicializar agente
    const initialized = await initializeAgent();
    if (!initialized) {
      logger.error('No se pudo inicializar el agente');
      process.exit(1);
    }

    // Limpiar archivos antiguos cada hora
    setInterval(() => {
      systemUtils.cleanupOldFiles(systemUtils.printoutsPath);
      systemUtils.cleanupOldFiles(systemUtils.logsPath);
    }, 60 * 60 * 1000);

    // Log de estado cada 5 minutos
    setInterval(() => {
      const status = {
        agentId: agentState.id,
        connected: agentState.connected,
        printerStatus: agentState.printerStatus,
        queueLength: agentState.printQueue.length,
        stats: {
          total: agentState.totalPrints,
          successful: agentState.successfulPrints,
          failed: agentState.failedPrints
        },
        uptime: Date.now() - agentState.startTime
      };

      logger.info('Estado del agente', status);
      
      // Enviar estado al servidor si está conectado
      if (agentState.connected) {
        websocketService.sendAgentStatus(status);
      }
    }, 5 * 60 * 1000);

  } catch (error) {
    logger.error('Error en función principal', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
}

// Ejecutar función principal
main().catch(error => {
  logger.error('Error fatal en agente', {
    error: error.message,
    stack: error.stack
  });
  process.exit(1);
});
