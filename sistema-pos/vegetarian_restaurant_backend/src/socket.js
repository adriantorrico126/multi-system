const { Server } = require('socket.io');

let io = null;

const initializeSocket = (server) => {
  const allowedOrigins = [
    'https://pos.forkast.vip',
    'https://admin.forkast.vip',
    'https://forkast.vip',
    'https://www.forkast.vip'
  ];

  if (process.env.NODE_ENV === 'development') {
    allowedOrigins.push(
      'http://localhost:8080',
      'http://localhost:5173',
      'http://localhost:8081',
      'http://localhost:3000'
    );
  }

  io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST'],
      credentials: true
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