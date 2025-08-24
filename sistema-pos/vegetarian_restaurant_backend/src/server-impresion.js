/**
 * Servidor de Impresión Integrado - Sistema POS Sitemm
 * Servidor WebSocket para manejar impresiones de comandas
 */

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Configuración
const PORT = process.env.PRINT_SERVER_PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'tu_jwt_secret_aqui';
const AGENT_TOKEN = process.env.PRINT_AGENT_TOKEN || "un_token_secreto_para_autenticar_agentes";

// Estado del servidor
const serverState = {
  agents: new Map(),
  printQueue: [],
  totalPrints: 0,
  successfulPrints: 0,
  failedPrints: 0,
  restaurants: new Map() // Mapa de restaurantes y sus agentes
};

// Middleware de autenticación para agentes
const authenticateAgent = (socket, next) => {
  const token = socket.handshake.auth.token;
  const restauranteId = socket.handshake.auth.restauranteId;
  
  if (token === AGENT_TOKEN && restauranteId) {
    socket.restauranteId = restauranteId;
    socket.agentId = socket.handshake.auth.agentId;
    next();
  } else {
    next(new Error('Autenticación fallida'));
  }
};

// Middleware de autenticación para clientes POS
const authenticatePOS = (socket, next) => {
  const token = socket.handshake.auth.token;
  
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      socket.user = decoded;
      socket.restauranteId = decoded.id_restaurante;
      next();
    } catch (error) {
      next(new Error('Token inválido'));
    }
  } else {
    next(new Error('Token requerido'));
  }
};

// Aplicar autenticación según el tipo de cliente
io.use((socket, next) => {
  const clientType = socket.handshake.auth.clientType;
  
  if (clientType === 'agent') {
    authenticateAgent(socket, next);
  } else if (clientType === 'pos') {
    authenticatePOS(socket, next);
  } else {
    next(new Error('Tipo de cliente no especificado'));
  }
});

// Rutas HTTP
app.get('/', (req, res) => {
  res.json({
    message: 'Servidor de Impresión Sitemm - Integrado',
    status: 'running',
    agents: serverState.agents.size,
    queue: serverState.printQueue.length,
    restaurants: Array.from(serverState.restaurants.keys()),
    stats: {
      total: serverState.totalPrints,
      successful: serverState.successfulPrints,
      failed: serverState.failedPrints
    }
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    agents: serverState.agents.size,
    queue: serverState.printQueue.length
  });
});

// Ruta para enviar comanda de prueba
app.post('/test-print', (req, res) => {
  try {
    const { mesa, productos, mesero, restauranteId } = req.body;
    
    if (!mesa || !productos || !Array.isArray(productos) || !restauranteId) {
      return res.status(400).json({ error: 'Datos de comanda inválidos' });
    }

    // Crear comanda de prueba
    const comanda = {
      id_pedido: Date.now(),
      mesa: mesa,
      mesero: mesero || 'Mesero Test',
      productos: productos,
      total: productos.reduce((sum, p) => sum + (p.precio * p.cantidad), 0),
      restauranteId: restauranteId,
      timestamp: new Date().toISOString()
    };

    // Agregar a cola de impresión
    serverState.printQueue.push(comanda);
    serverState.totalPrints++;

    // Enviar a agentes del restaurante específico
    const restaurantAgents = serverState.restaurants.get(restauranteId) || [];
    restaurantAgents.forEach(agentSocketId => {
      const agentSocket = io.sockets.sockets.get(agentSocketId);
      if (agentSocket) {
        agentSocket.emit('imprimir-comanda', comanda);
      }
    });

    res.json({
      success: true,
      message: 'Comanda enviada para impresión',
      comanda: comanda,
      agents: restaurantAgents.length
    });

  } catch (error) {
    console.error('Error al procesar comanda:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Socket.io events
io.on('connection', (socket) => {
  const clientType = socket.handshake.auth.clientType;
  
  if (clientType === 'agent') {
    handleAgentConnection(socket);
  } else if (clientType === 'pos') {
    handlePOSConnection(socket);
  }
});

// Manejar conexión de agente de impresión
function handleAgentConnection(socket) {
  console.log('🖨️ Agente de impresión conectado:', {
    agentId: socket.agentId,
    restauranteId: socket.restauranteId,
    socketId: socket.id
  });

  // Registrar agente
  serverState.agents.set(socket.id, {
    id: socket.agentId,
    restauranteId: socket.restauranteId,
    capabilities: ['print', 'status', 'heartbeat'],
    connectedAt: new Date(),
    lastHeartbeat: new Date()
  });

  // Agregar a la lista de agentes del restaurante
  if (!serverState.restaurants.has(socket.restauranteId)) {
    serverState.restaurants.set(socket.restauranteId, []);
  }
  serverState.restaurants.get(socket.restauranteId).push(socket.id);

  // Enviar estado del servidor
  socket.emit('server-status', {
    status: 'running',
    agents: serverState.agents.size,
    queue: serverState.printQueue.filter(item => item.restauranteId === socket.restauranteId).length,
    restauranteId: socket.restauranteId
  });

  console.log(`✅ Agente ${socket.agentId} registrado para restaurante ${socket.restauranteId}. Total: ${serverState.agents.size}`);

  // Eventos del agente
  socket.on('agent-ready', (data) => {
    console.log('🖨️ Agente listo:', data);
  });

  socket.on('agent-heartbeat', (data) => {
    const agent = serverState.agents.get(socket.id);
    if (agent) {
      agent.lastHeartbeat = new Date();
    }
  });

  socket.on('agent-status', (data) => {
    const agent = serverState.agents.get(socket.id);
    if (agent) {
      Object.assign(agent, data.status);
    }
  });

  socket.on('impresion-completada', (data) => {
    console.log('✅ Impresión completada:', data);
    
    if (data.success) {
      serverState.successfulPrints++;
    } else {
      serverState.failedPrints++;
    }

    // Remover de la cola
    const index = serverState.printQueue.findIndex(item => 
      item.id_pedido === data.ticketId || item.id_venta === data.ticketId
    );
    
    if (index !== -1) {
      serverState.printQueue.splice(index, 1);
    }
  });

  socket.on('disconnect', () => {
    console.log('❌ Agente desconectado:', socket.agentId);
    
    // Remover agente
    if (serverState.agents.has(socket.id)) {
      const agent = serverState.agents.get(socket.id);
      console.log(`🖨️ Agente ${agent.id} desconectado del restaurante ${agent.restauranteId}`);
      serverState.agents.delete(socket.id);
      
      // Remover de la lista del restaurante
      const restaurantAgents = serverState.restaurants.get(agent.restauranteId);
      if (restaurantAgents) {
        const agentIndex = restaurantAgents.indexOf(socket.id);
        if (agentIndex !== -1) {
          restaurantAgents.splice(agentIndex, 1);
        }
        if (restaurantAgents.length === 0) {
          serverState.restaurants.delete(agent.restauranteId);
        }
      }
    }
  });

  socket.on('agent-shutdown', (data) => {
    console.log('🔄 Agente se está cerrando:', data);
  });
}

// Manejar conexión de cliente POS
function handlePOSConnection(socket) {
  console.log('💻 Cliente POS conectado:', {
    userId: socket.user.id,
    restauranteId: socket.restauranteId,
    socketId: socket.id
  });

  // Eventos del POS
  socket.on('imprimir-comanda', (data) => {
    try {
      console.log('📋 Comanda recibida del POS:', {
        pedidoId: data.id_pedido || data.id_venta,
        mesa: data.mesa,
        restauranteId: socket.restauranteId
      });

      // Agregar restauranteId si no está presente
      if (!data.restauranteId) {
        data.restauranteId = socket.restauranteId;
      }

      // Agregar a cola de impresión
      serverState.printQueue.push(data);
      serverState.totalPrints++;

      // Enviar a agentes del restaurante específico
      const restaurantAgents = serverState.restaurants.get(socket.restauranteId) || [];
      
      if (restaurantAgents.length === 0) {
        console.log('⚠️ No hay agentes de impresión disponibles para el restaurante:', socket.restauranteId);
        socket.emit('impresion-error', {
          error: 'No hay agentes de impresión disponibles',
          pedidoId: data.id_pedido || data.id_venta
        });
        return;
      }

      restaurantAgents.forEach(agentSocketId => {
        const agentSocket = io.sockets.sockets.get(agentSocketId);
        if (agentSocket) {
          agentSocket.emit('imprimir-comanda', data);
        }
      });

      console.log(`📤 Comanda enviada a ${restaurantAgents.length} agente(s) del restaurante ${socket.restauranteId}`);

    } catch (error) {
      console.error('❌ Error al procesar comanda del POS:', error);
      socket.emit('impresion-error', {
        error: 'Error interno del servidor',
        pedidoId: data.id_pedido || data.id_venta
      });
    }
  });

  socket.on('disconnect', () => {
    console.log('❌ Cliente POS desconectado:', socket.user.id);
  });
}

// Limpiar agentes inactivos cada minuto
setInterval(() => {
  const now = new Date();
  const inactiveThreshold = 2 * 60 * 1000; // 2 minutos

  for (const [socketId, agent] of serverState.agents.entries()) {
    if (now - agent.lastHeartbeat > inactiveThreshold) {
      console.log(`⚠️ Agente ${agent.id} marcado como inactivo`);
      serverState.agents.delete(socketId);
      
      // Remover de la lista del restaurante
      const restaurantAgents = serverState.restaurants.get(agent.restauranteId);
      if (restaurantAgents) {
        const agentIndex = restaurantAgents.indexOf(socketId);
        if (agentIndex !== -1) {
          restaurantAgents.splice(agentIndex, 1);
        }
        if (restaurantAgents.length === 0) {
          serverState.restaurants.delete(agent.restauranteId);
        }
      }
    }
  }
}, 60 * 1000);

// Log de estado cada 30 segundos
setInterval(() => {
  console.log('📊 Estado del servidor de impresión:', {
    agents: serverState.agents.size,
    queue: serverState.printQueue.length,
    restaurants: Array.from(serverState.restaurants.entries()).map(([id, agents]) => ({
      restauranteId: id,
      agentes: agents.length
    })),
    stats: {
      total: serverState.totalPrints,
      successful: serverState.successfulPrints,
      failed: serverState.failedPrints
    }
  });
}, 30000);

// Iniciar servidor
server.listen(PORT, () => {
  console.log(`🚀 Servidor de Impresión Integrado iniciado en puerto ${PORT}`);
  console.log(`📊 Endpoints disponibles:`);
  console.log(`   GET  / - Estado del servidor`);
  console.log(`   GET  /health - Health check`);
  console.log(`   POST /test-print - Enviar comanda de prueba`);
  console.log(`🔌 WebSocket disponible en /socket.io`);
  console.log(`🔑 Token de agente: ${AGENT_TOKEN}`);
  console.log(`🔐 JWT Secret configurado: ${JWT_SECRET ? 'Sí' : 'No'}`);
});

// Manejo de señales
process.on('SIGINT', () => {
  console.log('\n🛑 Cerrando servidor de impresión...');
  server.close(() => {
    console.log('✅ Servidor cerrado correctamente');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Cerrando servidor de impresión...');
  server.close(() => {
    console.log('✅ Servidor cerrado correctamente');
    process.exit(0);
  });
});

module.exports = { server, io, serverState };
