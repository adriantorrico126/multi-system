const { Server } = require('socket.io');

let io = null;

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*', // Ajusta según tu frontend
      methods: ['GET', 'POST']
    }
  });

  // Evento de conexión
  io.on('connection', (socket) => {
    console.log('KDS conectado:', socket.id);
    // Aquí se pueden manejar rooms por restaurante, sucursal, etc.
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io no ha sido inicializado. Llama a initializeSocket primero.');
  }
  return io;
};

module.exports = { initializeSocket, getIO }; 