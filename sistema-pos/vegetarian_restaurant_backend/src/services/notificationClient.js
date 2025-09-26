const io = require('socket.io-client');

class NotificationClient {
  constructor() {
    this.socket = null;
    this.restaurantId = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 5000;
  }

  connect(restaurantId, notificationServerUrl = 'http://localhost:4001') {
    this.restaurantId = restaurantId;
    
    try {
      this.socket = io(notificationServerUrl, {
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true
      });

      this.socket.on('connect', () => {
        console.log('✅ Conectado al servicio de notificaciones');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        
        // Suscribirse a notificaciones del restaurante
        this.socket.emit('subscribe-restaurant', restaurantId);
        console.log(`📡 Suscrito a notificaciones del restaurante ${restaurantId}`);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('❌ Desconectado del servicio de notificaciones:', reason);
        this.isConnected = false;
        this.handleReconnect();
      });

      this.socket.on('connect_error', (error) => {
        console.log('❌ Error de conexión al servicio de notificaciones:', error.message);
        this.isConnected = false;
        this.handleReconnect();
      });

      // Escuchar cambios de plan
      this.socket.on('plan-changed', (data) => {
        console.log('🔄 Plan cambiado:', data);
        this.handlePlanChange(data);
      });

      // Escuchar alertas de uso
      this.socket.on('usage-alert', (data) => {
        console.log('⚠️ Alerta de uso:', data);
        this.handleUsageAlert(data);
      });

    } catch (error) {
      console.error('Error inicializando cliente de notificaciones:', error);
    }
  }

  handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`🔄 Intentando reconectar... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        if (this.restaurantId) {
          this.connect(this.restaurantId);
        }
      }, this.reconnectDelay);
    } else {
      console.log('❌ Máximo de intentos de reconexión alcanzado');
    }
  }

  handlePlanChange(data) {
    const { restaurantId, plan, suscripcion, motivo } = data;
    
    console.log(`🎯 Plan actualizado para restaurante ${restaurantId}:`);
    console.log(`   Plan: ${plan.nombre}`);
    console.log(`   Precio: $${plan.precio_mensual}/mes`);
    console.log(`   Motivo: ${motivo}`);
    
    // Aquí se pueden agregar acciones específicas cuando cambie el plan
    // Por ejemplo:
    // - Actualizar la interfaz de usuario
    // - Recargar configuraciones
    // - Mostrar notificación al usuario
    // - Actualizar límites en tiempo real
    
    // Emitir evento personalizado para que otros módulos puedan escucharlo
    if (typeof process !== 'undefined' && process.emit) {
      process.emit('planChanged', data);
    }
  }

  handleUsageAlert(data) {
    const { restaurantId, alert } = data;
    
    console.log(`⚠️ Alerta de uso para restaurante ${restaurantId}:`);
    console.log(`   Tipo: ${alert.tipo}`);
    console.log(`   Recurso: ${alert.recurso}`);
    console.log(`   Uso actual: ${alert.uso_actual}/${alert.limite}`);
    
    // Emitir evento personalizado para alertas
    if (typeof process !== 'undefined' && process.emit) {
      process.emit('usageAlert', data);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.isConnected = false;
      console.log('🔌 Desconectado del servicio de notificaciones');
    }
  }

  isConnectedToNotifications() {
    return this.isConnected;
  }

  getRestaurantId() {
    return this.restaurantId;
  }
}

// Crear instancia global
const notificationClient = new NotificationClient();

module.exports = notificationClient;
