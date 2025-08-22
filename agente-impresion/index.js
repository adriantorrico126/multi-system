const { io } = require("socket.io-client");
const { ThermalPrinter, PrinterTypes } = require("node-thermal-printer");
const fs = require('fs');
const path = require('path');

// --- Configuración (usar variables de entorno en producción) ---
require('dotenv').config();
const BACKEND_URL = process.env.PRINT_SERVER_URL || "http://localhost:3001";
const RESTAURANTE_ID = Number(process.env.RESTAURANTE_ID || 1);
const AGENT_TOKEN = process.env.PRINT_AGENT_TOKEN || "un_token_secreto_para_autenticar_agentes";
const PRINTER_INTERFACE = process.env.PRINTER_INTERFACE || "USB"; // o 'tcp://IP:PUERTO'
const DRY_RUN = String(process.env.DRY_RUN || 'false').toLowerCase() === 'true';

console.log("Iniciando agente de impresión...");

const socket = io(BACKEND_URL, {
  auth: {
    token: AGENT_TOKEN,
    restauranteId: RESTAURANTE_ID
  },
  transports: ['websocket'], // evitar polling en entorno Node
  path: '/socket.io',
  reconnectionAttempts: 5,
  reconnectionDelay: 3000
});

socket.on("connect", () => {
  console.log(`Conectado al servidor backend. Escuchando para el restaurante ${RESTAURANTE_ID}`);
  if (DRY_RUN) {
    console.log('Modo DRY_RUN habilitado: se generarán archivos .txt en lugar de enviar a impresora.');
  }
});

socket.on("imprimir-comanda", async (data) => {
  console.log("Nueva comanda recibida para imprimir:", data);

  let printer = new ThermalPrinter({
    type: PrinterTypes.EPSON,
    interface: PRINTER_INTERFACE,
  });

  // Formatear el ticket
  const lines = [];
  printer.alignCenter();
  const header = `Comanda: #${data.id_pedido || data.id_venta || '-'}\nMesa: ${data.mesa || data.mesa_numero || '-'}\nMesero: ${data.mesero || data.mesero_nombre || '-'}\n${new Date().toLocaleString()}`;
  printer.println(header.split('\n')[0]);
  printer.println(header.split('\n')[1]);
  printer.println(header.split('\n')[2]);
  printer.println(header.split('\n')[3]);
  printer.drawLine();
  lines.push(header);

  printer.alignLeft();
  data.productos.forEach(p => {
    const l1 = `${p.cantidad}x ${p.nombre}`;
    printer.println(l1);
    lines.push(l1);
    if (p.notas) {
      const l2 = `  -> Notas: ${p.notas}`;
      printer.println(l2);
      lines.push(l2);
    }
  });

  printer.cut();

  try {
    if (DRY_RUN) {
      const outDir = path.join(__dirname, 'printouts');
      if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
      const filename = `comanda_${Date.now()}.txt`;
      const content = lines.join('\n');
      fs.writeFileSync(path.join(outDir, filename), content, 'utf8');
      console.log(`Comanda guardada en ${path.join(outDir, filename)} (DRY_RUN)`);
    } else {
      await printer.execute();
      console.log("Impresión completada exitosamente.");
    }
  } catch (error) { 
    console.error("Error al imprimir: Verifique que la impresora esté conectada y el driver sea correcto.", error);
  }
});

socket.on("disconnect", () => {
  console.log("Desconectado del servidor backend. Intentando reconectar...");
});

socket.on("connect_error", (err) => {
  console.error(`Error de conexión: ${err.message}`);
});
