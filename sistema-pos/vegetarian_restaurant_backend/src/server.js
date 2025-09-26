try {
  const StartupLogger = require('./utils/startupLogger');
  const serverLogger = new StartupLogger();

  console.log('=== INICIANDO SERVER.JS ===');
  serverLogger.logSection('Inicialización del servidor');

  const http = require('http');
  serverLogger.logStep('HTTP module', 'success');

  console.log('Importando app...');
  const app = require('./app');
  serverLogger.logStep('App import', 'success');
  console.log('App importada');

  const envConfig = require('./config/envConfig');
  serverLogger.logStep('EnvConfig import', 'success');
  console.log('EnvConfig importada');

  // Crear servidor HTTP
  const server = http.createServer(app);
  serverLogger.logStep('HTTP server creation', 'success');
  console.log('Servidor HTTP creado');

  // Socket.io para KDS
  const { initializeSocket } = require('./socket');
  const io = initializeSocket(server);
  serverLogger.logStep('Socket.io initialization', 'success');
  console.log('Socket.io inicializado');

  // Cliente de notificaciones para cambios de planes - DESACTIVADO
  // NOTA: El POS debe ser independiente del admin backend
  // const notificationClient = require('./services/notificationClient');
  // serverLogger.logStep('Notification client import', 'success');

  // Iniciar servidor
  const PORT = envConfig.PORT;
  console.log('Antes de server.listen');
  server.listen(PORT, '0.0.0.0', () => {
    serverLogger.logSection('Servidor iniciado');
    serverLogger.logStep(`Servidor HTTP en puerto ${PORT}`, 'success');
    
    // DESACTIVADO: Conectar cliente de notificaciones
    // El POS debe funcionar independientemente del admin backend
    /*
    try {
      // Obtener el ID del restaurante desde las variables de entorno o usar 1 por defecto
      const restaurantId = process.env.RESTAURANT_ID || 1;
      notificationClient.connect(restaurantId);
      serverLogger.logStep(`Cliente de notificaciones conectado para restaurante ${restaurantId}`, 'success');
    } catch (error) {
      serverLogger.logStep(`Error conectando cliente de notificaciones: ${error.message}`, 'error');
    }
    */
    
    serverLogger.getSummary();
    console.log(`🚀 Servidor corriendo en http://0.0.0.0:${PORT}`);
  });
  console.log('Después de server.listen');

  // Exportar io para usar en controladores
  module.exports = { server, io };

  // Manejo de cierre ordenado del servidor
  const gracefulShutdown = (signal) => {
    console.log(`\nRecibida señal ${signal}. Cerrando servidor HTTP...`);
    server.close(async () => {
      console.log('Servidor HTTP cerrado.');
      process.exit(0);
    });
  };

  if (process.listenerCount('SIGTERM') === 0) {
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  }
  if (process.listenerCount('SIGINT') === 0) {
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  }

} catch (err) {
  const StartupLogger = require('./utils/startupLogger');
  const serverLogger = new StartupLogger();
  serverLogger.logStep('ERROR durante la inicialización del servidor', 'error');
  serverLogger.logStep(err && err.stack ? err.stack : String(err), 'error');
  console.error('ERROR DURANTE LA INICIALIZACIÓN DEL SERVIDOR:', err);
}
