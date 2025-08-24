/**
 * Servicio de Impresión para Sistema POS
 * Maneja la comunicación con el servidor de impresión
 */

import { io, Socket } from 'socket.io-client';
import { toast } from '@/hooks/use-toast';

export interface PrintData {
  id_pedido?: number;
  id_venta?: number;
  mesa: string;
  mesero: string;
  productos: Array<{
    nombre: string;
    cantidad: number;
    precio: number;
    notas?: string;
  }>;
  total: number;
  restauranteId: number;
}

export interface PrintStatus {
  connected: boolean;
  agents: number;
  queue: number;
}

class PrintService {
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private printQueue: PrintData[] = [];
  private statusCallbacks: ((status: PrintStatus) => void)[] = [];

  constructor() {
    this.initializeSocket();
  }

  /**
   * Inicializa la conexión WebSocket con el servidor de impresión
   */
  private initializeSocket() {
    try {
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('currentUser');
      
      if (!token || !user) {
        console.warn('No hay token o usuario para conectar al servidor de impresión');
        return;
      }

      const userData = JSON.parse(user);
      const printServerUrl = import.meta.env.VITE_PRINT_SERVER_URL || 'http://localhost:3001';

      this.socket = io(printServerUrl, {
        auth: {
          token: token,
          clientType: 'pos'
        },
        transports: ['websocket'],
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
        timeout: 10000
      });

      this.setupEventHandlers();
      
    } catch (error) {
      console.error('Error al inicializar socket de impresión:', error);
    }
  }

  /**
   * Configura los manejadores de eventos del socket
   */
  private setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('🖨️ Conectado al servidor de impresión');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.updateStatus();
      
      // Procesar cola de impresión pendiente
      this.processPrintQueue();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Desconectado del servidor de impresión:', reason);
      this.isConnected = false;
      this.updateStatus();
      
      if (reason === 'io server disconnect') {
        // Reconexión manual
        setTimeout(() => {
          this.socket?.connect();
        }, this.reconnectDelay);
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Error de conexión con servidor de impresión:', error);
      this.isConnected = false;
      this.updateStatus();
      
      this.reconnectAttempts++;
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        setTimeout(() => {
          this.socket?.connect();
        }, this.reconnectDelay * this.reconnectAttempts);
      }
    });

    this.socket.on('impresion-error', (data) => {
      console.error('❌ Error de impresión:', data);
      toast({
        title: "Error de Impresión",
        description: data.error || 'Error desconocido al imprimir',
        variant: "destructive",
      });
    });

    this.socket.on('impresion-completada', (data) => {
      console.log('✅ Impresión completada:', data);
      if (data.success) {
        toast({
          title: "Impresión Exitosa",
          description: "La comanda se imprimió correctamente",
          variant: "default",
        });
      } else {
        toast({
          title: "Error de Impresión",
          description: data.error || 'Error al imprimir la comanda',
          variant: "destructive",
        });
      }
    });
  }

  /**
   * Envía una comanda para impresión
   */
  async printComanda(printData: PrintData): Promise<boolean> {
    try {
      // Validar datos
      if (!printData.mesa || !printData.productos || printData.productos.length === 0) {
        throw new Error('Datos de comanda inválidos');
      }

      // Si no hay conexión, agregar a cola
      if (!this.isConnected || !this.socket) {
        console.log('📋 Agregando comanda a cola de impresión');
        this.printQueue.push(printData);
        return false;
      }

      // Enviar comanda al servidor
      this.socket.emit('imprimir-comanda', printData);
      
      console.log('📤 Comanda enviada para impresión:', {
        id: printData.id_pedido || printData.id_venta,
        mesa: printData.mesa,
        productos: printData.productos.length
      });

      return true;

    } catch (error) {
      console.error('❌ Error al enviar comanda para impresión:', error);
      toast({
        title: "Error de Impresión",
        description: "No se pudo enviar la comanda para impresión",
        variant: "destructive",
      });
      return false;
    }
  }

  /**
   * Procesa la cola de impresión pendiente
   */
  private async processPrintQueue() {
    if (this.printQueue.length === 0 || !this.isConnected) return;

    console.log(`📋 Procesando ${this.printQueue.length} comanda(s) pendiente(s)`);
    
    const queueCopy = [...this.printQueue];
    this.printQueue = [];

    for (const comanda of queueCopy) {
      try {
        await this.printComanda(comanda);
        // Pequeña pausa entre impresiones
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error('❌ Error procesando comanda de cola:', error);
        // Reagregar a la cola si falla
        this.printQueue.push(comanda);
      }
    }
  }

  /**
   * Obtiene el estado de la conexión
   */
  getStatus(): PrintStatus {
    return {
      connected: this.isConnected,
      agents: 0, // Por ahora no tenemos info de agentes
      queue: this.printQueue.length
    };
  }

  /**
   * Suscribe al estado de la impresión
   */
  onStatusChange(callback: (status: PrintStatus) => void) {
    this.statusCallbacks.push(callback);
    // Llamar inmediatamente con el estado actual
    callback(this.getStatus());
  }

  /**
   * Actualiza el estado y notifica a los suscriptores
   */
  private updateStatus() {
    const status = this.getStatus();
    this.statusCallbacks.forEach(callback => callback(status));
  }

  /**
   * Reconecta manualmente al servidor
   */
  reconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket.connect();
    } else {
      this.initializeSocket();
    }
  }

  /**
   * Cierra la conexión
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
    this.updateStatus();
  }

  /**
   * Verifica si el servicio está disponible
   */
  isAvailable(): boolean {
    return this.isConnected && this.socket !== null;
  }

  /**
   * Obtiene estadísticas de la cola de impresión
   */
  getQueueStats() {
    return {
      pending: this.printQueue.length,
      connected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts
    };
  }
}

// Instancia singleton del servicio
export const printService = new PrintService();

// Exportar tipos
export type { PrintData, PrintStatus };
