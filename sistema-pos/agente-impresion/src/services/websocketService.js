/**
 * Servicio de WebSocket para comunicación con el backend
 * Maneja la conexión, reconexión y eventos del servidor
 */

const { io } = require("socket.io-client");
const winston = require('winston');
const { EventEmitter } = require('events');

class WebSocketService extends EventEmitter {
  constructor(config) {
    super();
    this.config = config;
    this.socket = null;
    this.connected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = config.server.reconnectAttempts || 10;
    this.reconnectDelay = config.server.reconnectDelay || 5000;
    this.heartbeatInterval = null;
    
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      defaultMeta: { service: 'websocket-service' },
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        })
      ]
    });
  }

  /**
   * Inicia la conexión WebSocket
   */
  async connect() {
    try {
      this.logger.info('Iniciando conexión WebSocket...', {
        url: this.config.server.url,
        restauranteId: this.config.agent.restauranteId
      });

      // Configuración del socket
      const socketConfig = {
        auth: {
          token: this.config.agent.token,
          restauranteId: this.config.agent.restauranteId,
          agentId: this.config.agent.id || null
        },
        transports: ['websocket'],
        path: '/socket.io',
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
        timeout: this.config.server.timeout || 20000,
        forceNew: true
      };

      // Crear conexión
      this.socket = io(this.config.server.url, socketConfig);

      // Configurar eventos
      this.setupEventHandlers();

      // Esperar conexión inicial
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Timeout de conexión WebSocket'));
        }, this.config.server.timeout || 20000);

        this.socket.once('connect', () => {
          clearTimeout(timeout);
          resolve(true);
        });

        this.socket.once('connect_error', (error) => {
          clearTimeout(timeout);
          reject(error);
        });
      });

    } catch (error) {
      this.logger.error('Error al conectar WebSocket', {
        error: error.message,
        url: this.config.server.url
      });
      throw error;
    }
  }

  /**
   * Configura los manejadores de eventos del socket
   */
  setupEventHandlers() {
    if (!this.socket) return;

    // Evento de conexión exitosa
    this.socket.on('connect', () => {
      this.connected = true;
      this.reconnectAttempts = 0;
      
      this.logger.info('Conectado al servidor backend', {
        restauranteId: this.config.agent.restauranteId,
        agentId: this.config.agent.id,
        url: this.config.server.url
      });

      // Emitir evento de conexión
      this.emit('connected', {
        restauranteId: this.config.agent.restauranteId,
        agentId: this.config.agent.id
      });

      // Iniciar heartbeat
      this.startHeartbeat();

      // Notificar al servidor que el agente está listo
      this.socket.emit('agent-ready', {
        agentId: this.config.agent.id,
        restauranteId: this.config.agent.restauranteId,
        capabilities: ['print', 'status', 'heartbeat']
      });
    });

    // Evento de desconexión
    this.socket.on('disconnect', (reason) => {
      this.connected = false;
      this.stopHeartbeat();
      
      this.logger.warn('Desconectado del servidor', { 
        reason,
        agentId: this.config.agent.id 
      });

      // Emitir evento de desconexión
      this.emit('disconnected', { reason });

      // Programar reconexión automática
      this.scheduleReconnection();
    });

    // Error de conexión
    this.socket.on('connect_error', (error) => {
      this.connected = false;
      this.logger.error('Error de conexión WebSocket', { 
        error: error.message,
        agentId: this.config.agent.id 
      });

      // Emitir evento de error
      this.emit('connection_error', { error: error.message });
    });

    // Evento de reconexión
    this.socket.on('reconnect', (attemptNumber) => {
      this.logger.info('Reconectado al servidor', {
        attemptNumber,
        agentId: this.config.agent.id
      });

      // Emitir evento de reconexión
      this.emit('reconnected', { attemptNumber });
    });

    // Evento de reconexión fallida
    this.socket.on('reconnect_failed', () => {
      this.logger.error('Reconexión fallida después de múltiples intentos', {
        maxAttempts: this.maxReconnectAttempts,
        agentId: this.config.agent.id
      });

      // Emitir evento de fallo de reconexión
      this.emit('reconnect_failed');
    });

    // Eventos de impresión
    this.socket.on('imprimir-comanda', (data) => {
      this.logger.info('Recibida solicitud de impresión', {
        pedidoId: data.id_pedido || data.id_venta,
        mesa: data.mesa,
        productos: data.productos?.length || 0
      });

      // Emitir evento de impresión
      this.emit('print_request', data);
    });

    // Eventos de estado del servidor
    this.socket.on('server-status', (status) => {
      this.logger.info('Estado del servidor recibido', { 
        status,
        agentId: this.config.agent.id 
      });

      // Emitir evento de estado
      this.emit('server_status', status);
    });

    // Eventos de configuración
    this.socket.on('config-update', (config) => {
      this.logger.info('Configuración actualizada desde el servidor', {
        config,
        agentId: this.config.agent.id
      });

      // Emitir evento de actualización de configuración
      this.emit('config_update', config);
    });
  }

  /**
   * Inicia el heartbeat automático
   */
  startHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = setInterval(() => {
      if (this.connected && this.socket) {
        this.socket.emit('agent-heartbeat', {
          agentId: this.config.agent.id,
          timestamp: Date.now(),
          status: 'alive'
        });
      }
    }, this.config.server.heartbeatInterval || 30000);

    this.logger.info('Heartbeat iniciado', {
      interval: this.config.server.heartbeatInterval || 30000
    });
  }

  /**
   * Detiene el heartbeat
   */
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
      this.logger.info('Heartbeat detenido');
    }
  }

  /**
   * Programa la reconexión automática
   */
  scheduleReconnection() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.logger.error('Máximo número de intentos de reconexión alcanzado', {
        maxAttempts: this.maxReconnectAttempts
      });
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * this.reconnectAttempts;

    this.logger.info('Programando reconexión automática', {
      attempt: this.reconnectAttempts,
      delay,
      maxAttempts: this.maxReconnectAttempts
    });

    setTimeout(() => {
      if (!this.connected) {
        this.connect().catch(error => {
          this.logger.error('Reconexión automática fallida', {
            error: error.message,
            attempt: this.reconnectAttempts
          });
        });
      }
    }, delay);
  }

  /**
   * Envía confirmación de impresión completada
   */
  sendPrintConfirmation(ticketId, success, printId, error = null) {
    if (this.connected && this.socket) {
      this.socket.emit('impresion-completada', {
        agentId: this.config.agent.id,
        ticketId,
        success,
        printId,
        error,
        timestamp: Date.now()
      });

      this.logger.info('Confirmación de impresión enviada', {
        ticketId,
        success,
        printId,
        error
      });
    }
  }

  /**
   * Envía estado del agente
   */
  sendAgentStatus(status) {
    if (this.connected && this.socket) {
      this.socket.emit('agent-status', {
        agentId: this.config.agent.id,
        status,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Desconecta el WebSocket
   */
  disconnect() {
    this.stopHeartbeat();
    
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.connected = false;
    this.logger.info('WebSocket desconectado');
  }

  /**
   * Obtiene el estado de la conexión
   */
  getConnectionStatus() {
    return {
      connected: this.connected,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts,
      url: this.config.server.url
    };
  }
}

module.exports = WebSocketService;
