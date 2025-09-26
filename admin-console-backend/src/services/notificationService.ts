import { Server } from 'socket.io';
import { createServer } from 'http';
import express from 'express';

class NotificationService {
  private io: Server | null = null;
  private app: express.Application;
  private server: any;

  constructor() {
    this.app = express();
    this.server = createServer(this.app);
  }

  initialize(port: number = 4001) {
    this.io = new Server(this.server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    this.io.on('connection', (socket) => {
      console.log('Cliente conectado al servicio de notificaciones:', socket.id);
      
      socket.on('subscribe-restaurant', (restaurantId: number) => {
        socket.join(`restaurant-${restaurantId}`);
        console.log(`Cliente ${socket.id} suscrito a restaurante ${restaurantId}`);
      });

      socket.on('disconnect', () => {
        console.log('Cliente desconectado:', socket.id);
      });
    });

    this.server.listen(port, () => {
      console.log(`Servicio de notificaciones escuchando en puerto ${port}`);
    });
  }

  notifyPlanChange(restaurantId: number, planData: any) {
    if (this.io) {
      this.io.to(`restaurant-${restaurantId}`).emit('plan-changed', {
        restaurantId,
        plan: planData,
        timestamp: new Date().toISOString()
      });
      console.log(`Notificación de cambio de plan enviada para restaurante ${restaurantId}`);
    }
  }

  notifyUsageAlert(restaurantId: number, alertData: any) {
    if (this.io) {
      this.io.to(`restaurant-${restaurantId}`).emit('usage-alert', {
        restaurantId,
        alert: alertData,
        timestamp: new Date().toISOString()
      });
      console.log(`Alerta de uso enviada para restaurante ${restaurantId}`);
    }
  }

  getIO() {
    return this.io;
  }
}

export const notificationService = new NotificationService();
