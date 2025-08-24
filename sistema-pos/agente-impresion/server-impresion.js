/**
 * Servidor de Impresión Simple para Pruebas
 * Servidor básico para probar el agente de impresión
 */

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

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
const PORT = process.env.PORT || 3001;
const AGENT_TOKEN = process.env.PRINT_AGENT_TOKEN || "un_token_secreto_para_autenticar_agentes";

// Estado del servidor
const serverState = {
  agents: new Map(),
  printQueue: [],
  totalPrints: 0,
  successfulPrints: 0,
  failedPrints: 0
};

// Rutas HTTP
app.get('/', (req, res) => {
  res.json({
    message: 'Servidor de Impresión Sitemm',
    status: 'running',
    agents: serverState.agents.size,
    queue: serverState.printQueue.length,
    stats: {
      total: serverState.totalPrints,
      successful: serverState.successfulPrints,
      failed: serverState.failedPrints
    }
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Ruta para enviar comanda de prueba
app.post('/test-print', (req, res) => {
  try {
    const { mesa, productos, mesero } = req.body;
    
    if (!mesa || !productos || !Array.isArray(productos)) {
      return res.status(400).json({ error: 'Datos de comanda inválidos' });
    }

    // Crear comanda de prueba
    const comanda = {
      id_pedido: Date.now(),
      mesa: mesa,
      mesero: mesero || 'Mesero Test',
      productos: productos,
      total: productos.reduce((sum, p) => sum + (p.precio * p.cantidad), 0),
      timestamp: new Date().toISOString()
    };

    // Agregar a cola de impresión
    serverState.printQueue.push(comanda);
    serverState.totalPrints++;

    // Enviar a todos los agentes conectados
    io.emit('imprimir-comanda', comanda);

    res.json({
      success: true,
      message: 'Comanda enviada para impresión',
      comanda: comanda
    });

  } catch (error) {
    console.error('Error al procesar comanda:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Socket.io events
io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);

  // Autenticación del agente
  socket.on('agent-ready', (data) => {
    console.log('Agente listo:', data);
    
    // Registrar agente
    serverState.agents.set(socket.id, {
      id: data.agentId,
      restauranteId: data.restauranteId,
      capabilities: data.capabilities || [],
      connectedAt: new Date(),
      lastHeartbeat: new Date()
    });

    // Enviar estado del servidor
    socket.emit('server-status', {
      status: 'running',
      agents: serverState.agents.size,
      queue: serverState.printQueue.length
    });

    console.log(`Agente ${data.agentId} registrado. Total: ${serverState.agents.size}`);
  });

  // Heartbeat del agente
  socket.on('agent-heartbeat', (data) => {
    const agent = serverState.agents.get(socket.id);
    if (agent) {
      agent.lastHeartbeat = new Date();
    }
  });

  // Estado del agente
  socket.on('agent-status', (data) => {
    const agent = serverState.agents.get(socket.id);
    if (agent) {
      Object.assign(agent, data.status);
    }
  });

  // Confirmación de impresión
  socket.on('impresion-completada', (data) => {
    console.log('Impresión completada:', data);
    
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

  // Desconexión del agente
  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
    
    // Remover agente
    if (serverState.agents.has(socket.id)) {
      const agent = serverState.agents.get(socket.id);
      console.log(`Agente ${agent.id} desconectado`);
      serverState.agents.delete(socket.id);
    }
  });

  // Agente se está cerrando
  socket.on('agent-shutdown', (data) => {
    console.log('Agente se está cerrando:', data);
    
    if (serverState.agents.has(socket.id)) {
      const agent = serverState.agents.get(socket.id);
      console.log(`Agente ${agent.id} se está cerrando: ${data.reason}`);
      serverState.agents.delete(socket.id);
    }
  });
});

// Limpiar agentes inactivos cada minuto
setInterval(() => {
  const now = new Date();
  const inactiveThreshold = 2 * 60 * 1000; // 2 minutos

  for (const [socketId, agent] of serverState.agents.entries()) {
    if (now - agent.lastHeartbeat > inactiveThreshold) {
      console.log(`Agente ${agent.id} marcado como inactivo`);
      serverState.agents.delete(socketId);
    }
  }
}, 60 * 1000);

// Log de estado cada 30 segundos
setInterval(() => {
  console.log('Estado del servidor:', {
    agents: serverState.agents.size,
    queue: serverState.printQueue.length,
    stats: {
      total: serverState.totalPrints,
      successful: serverState.successfulPrints,
      failed: serverState.failedPrints
    }
  });
}, 30000);

// Iniciar servidor
server.listen(PORT, () => {
  console.log(`🚀 Servidor de Impresión iniciado en puerto ${PORT}`);
  console.log(`📊 Endpoints disponibles:`);
  console.log(`   GET  / - Estado del servidor`);
  console.log(`   GET  /health - Health check`);
  console.log(`   POST /test-print - Enviar comanda de prueba`);
  console.log(`🔌 WebSocket disponible en /socket.io`);
  console.log(`🔑 Token de agente: ${AGENT_TOKEN}`);
});

// Manejo de señales
process.on('SIGINT', () => {
  console.log('\n🛑 Cerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor cerrado correctamente');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Cerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor cerrado correctamente');
    process.exit(0);
  });
});
