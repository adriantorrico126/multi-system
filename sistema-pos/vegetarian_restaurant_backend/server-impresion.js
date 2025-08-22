
require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const crypto = require('crypto');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');

const app = express();
app.use(cors()); // Habilitar CORS para las peticiones HTTP
app.use(express.json()); // Habilitar parsing de JSON en el body

// Configuración del pool de PostgreSQL
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'sistempos',
  password: process.env.DB_PASSWORD || '',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
});

pool.connect()
  .then(client => {
    console.log('¡Conexión exitosa a PostgreSQL desde server-impresion.js!');
    client.release();
  })
  .catch(err => console.error('❌ Error al conectar a PostgreSQL:', err));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
    methods: ["GET", "POST"]
  }
});

// Middleware de autenticación para los agentes de impresión
io.use((socket, next) => {
  const { token, restauranteId } = socket.handshake.auth || {};
  const expected = process.env.PRINT_AGENT_TOKEN || 'un_token_secreto_para_autenticar_agentes';
  if (!token || !restauranteId) {
    console.warn('[IMPRESION][AUTH] Datos incompletos en handshake', {
      hasToken: !!token,
      hasRestauranteId: !!restauranteId
    });
    return next(new Error('Autenticación fallida: datos incompletos'));
  }
  // Comparación segura de tokens
  const tokenBuf = Buffer.from(String(token).trim());
  const expectedBuf = Buffer.from(String(expected).trim());
  const isValid = tokenBuf.length === expectedBuf.length && crypto.timingSafeEqual(tokenBuf, expectedBuf);
  if (isValid) {
    socket.join(`restaurante-${restauranteId}`);
    console.log(`Agente para restaurante ${restauranteId} conectado y unido a su sala.`);
    next();
  } else {
    console.warn('[IMPRESION][AUTH] Autenticación fallida. Verifique que PRINT_AGENT_TOKEN coincida en servidor y agente.', {
      providedTokenLen: tokenBuf.length,
      expectedTokenLen: expectedBuf.length,
      restauranteId
    });
    next(new Error("Autenticación fallida"));
  }
});

app.get('/', (req, res) => res.send('Servidor de impresión funcionando'));

// Endpoint para que el frontend solicite una impresión
app.post('/api/pedidos/imprimir', (req, res) => {
  const { pedido, restauranteId } = req.body || {};
  if (!pedido || !restauranteId) {
    return res.status(400).json({ message: 'Faltan datos del pedido o el ID del restaurante.' });
  }
  // Validación mínima del payload
  const hasItems = Array.isArray(pedido.productos) && pedido.productos.length > 0;
  if (!hasItems) {
    return res.status(400).json({ message: 'El pedido no contiene productos para imprimir.' });
  }
  const room = `restaurante-${restauranteId}`;
  const roomSockets = io.sockets.adapter.rooms.get(room);
  if (!roomSockets || roomSockets.size === 0) {
    return res.status(503).json({ message: 'No hay agentes de impresión conectados para este restaurante.' });
  }
  console.log(`Recibida solicitud de impresión para restaurante ${restauranteId}. Enviando a ${roomSockets.size} agente(s).`);
  io.to(room).emit('imprimir-comanda', pedido);
  res.status(200).json({ message: 'Solicitud de impresión enviada al agente.' });
});

// Healthcheck para monitoreo
app.get('/healthz', (req, res) => {
  const data = {};
  for (const [room, sockets] of io.sockets.adapter.rooms) {
    if (room.startsWith('restaurante-')) {
      data[room] = sockets.size;
    }
  }
  res.json({ status: 'ok', agents: data });
});

const PORT = process.env.PRINT_SERVER_PORT || 3001;
server.listen(PORT, () => {
  console.log(`Servidor de impresión con WebSockets corriendo en http://localhost:${PORT}`);
});
