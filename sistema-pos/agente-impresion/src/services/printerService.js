/**
 * Servicio de Impresora Profesional
 * Maneja la comunicación con diferentes tipos de impresoras térmicas
 */

const { ThermalPrinter, PrinterTypes } = require("node-thermal-printer");
const winston = require('winston');

class PrinterService {
  constructor(config) {
    this.config = config;
    this.printer = null;
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      defaultMeta: { service: 'printer-service' },
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        })
      ]
    });
  }

  /**
   * Inicializa la impresora según la configuración
   */
  async initialize() {
    try {
      this.logger.info('Inicializando impresora...', {
        type: this.config.printer.type,
        interface: this.config.printer.interface
      });

      // Configuración base de la impresora
      const printerConfig = {
        type: this.getPrinterType(this.config.printer.type),
        interface: this.config.printer.interface,
        options: {
          timeout: this.config.printer.options.timeout || 5000,
          removeSpecialCharacters: this.config.printer.options.removeSpecialCharacters || false,
          lineCharacter: this.config.printer.options.lineCharacter || "-"
        },
        // Agregar encoding explícito
        encoding: this.config.printer.options.encoding || 'UTF-8'
      };

      // Configuraciones específicas por interfaz
      if (this.config.printer.interface.startsWith('tcp://')) {
        printerConfig.interface = this.config.printer.interface;
      } else if (this.config.printer.interface.startsWith('COM')) {
        printerConfig.interface = this.config.printer.interface;
      }

      this.printer = new ThermalPrinter(printerConfig);
      
      // Test de conexión
      await this.testConnection();
      
      this.logger.info('Impresora inicializada correctamente', {
        type: this.config.printer.type,
        interface: this.config.printer.interface
      });

      return true;

    } catch (error) {
      this.logger.error('Error al inicializar impresora', {
        error: error.message,
        type: this.config.printer.type,
        interface: this.config.printer.interface
      });
      return false;
    }
  }

  /**
   * Obtiene el tipo de impresora desde la configuración
   */
  getPrinterType(typeString) {
    const types = {
      'EPSON': PrinterTypes.EPSON,
      'STAR': PrinterTypes.STAR,
      'CITIZEN': PrinterTypes.CITIZEN
    };
    
    return types[typeString.toUpperCase()] || PrinterTypes.EPSON;
  }

  /**
   * Test de conexión con la impresora
   */
  async testConnection() {
    try {
      if (!this.printer) {
        throw new Error('Impresora no inicializada');
      }

      // Test básico de comunicación
      this.printer.alignCenter();
      this.printer.println('Test de Conexion');
      this.printer.println(new Date().toLocaleString());
      this.printer.drawLine();
      this.printer.cut();

      await this.printer.execute();
      
      this.logger.info('Test de conexión exitoso');
      return true;

    } catch (error) {
      this.logger.error('Error en test de conexión', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Imprime un ticket de comanda
   */
  async printTicket(ticketData) {
    try {
      if (!this.printer) {
        throw new Error('Impresora no inicializada');
      }

      this.logger.info('Iniciando impresión de ticket', {
        ticketId: ticketData.id,
        items: ticketData.items?.length || 0
      });

      // Aplicar plantilla según configuración
      const template = this.config.templates.default;
      await this.applyTemplate(template, ticketData);

      // Ejecutar impresión
      await this.printer.execute();
      
      this.logger.info('Ticket impreso exitosamente', {
        ticketId: ticketData.id
      });

      return { success: true, ticketId: ticketData.id };

    } catch (error) {
      this.logger.error('Error al imprimir ticket', {
        error: error.message,
        ticketId: ticketData.id
      });
      
      return { 
        success: false, 
        error: error.message, 
        ticketId: ticketData.id 
      };
    }
  }

  /**
   * Aplica una plantilla al ticket
   */
  async applyTemplate(templateName, ticketData) {
    const template = this.config.templates.custom[templateName];
    
    if (!template) {
      throw new Error(`Plantilla '${templateName}' no encontrada`);
    }

    // Header centrado
    this.printer.alignCenter();
    template.header.forEach(line => {
      const processedLine = this.processTemplateLine(line, ticketData);
      this.printer.println(processedLine);
    });

    // Línea separadora
    this.printer.drawLine();

    // Productos alineados a la izquierda
    this.printer.alignLeft();
    this.printer.println(''); // Espacio

    if (ticketData.items && Array.isArray(ticketData.items)) {
      ticketData.items.forEach(item => {
        // Línea principal del producto
        const productLine = `${item.quantity}x ${item.name}`;
        this.printer.println(productLine);

        // Notas del producto si existen
        if (item.notes && item.notes.trim()) {
          const notesLine = `  → ${item.notes}`;
          this.printer.println(notesLine);
        }

        // Precio individual si se especifica
        if (item.price) {
          const priceLine = `  $${item.price.toFixed(2)}`;
          this.printer.println(priceLine);
        }
      });
    }

    // Footer
    this.printer.println(''); // Espacio
    this.printer.alignCenter();
    template.footer.forEach(line => {
      const processedLine = this.processTemplateLine(line, ticketData);
      this.printer.println(processedLine);
    });

    // Cortar papel
    this.printer.cut();
  }

  /**
   * Procesa una línea de plantilla reemplazando variables
   */
  processTemplateLine(line, ticketData) {
    return line
      .replace('{id}', ticketData.id || 'N/A')
      .replace('{mesa}', ticketData.mesa || 'N/A')
      .replace('{mesero}', ticketData.mesero || 'N/A')
      .replace('{fecha}', new Date().toLocaleString('es-BO'))
      .replace('{total}', ticketData.total ? `$${ticketData.total.toFixed(2)}` : 'N/A')
      .replace('{cliente}', ticketData.cliente || 'N/A');
  }

  /**
   * Obtiene el estado de la impresora
   */
  getStatus() {
    return {
      initialized: !!this.printer,
      type: this.config.printer.type,
      interface: this.config.printer.interface,
      connected: !!this.printer
    };
  }

  /**
   * Cierra la conexión con la impresora
   */
  async close() {
    try {
      if (this.printer) {
        // Algunas impresoras necesitan un comando de cierre
        this.printer.println(''); // Línea en blanco
        this.printer.cut();
        await this.printer.execute();
        
        this.printer = null;
        this.logger.info('Conexión con impresora cerrada');
      }
    } catch (error) {
      this.logger.error('Error al cerrar impresora', {
        error: error.message
      });
    }
  }
}

module.exports = PrinterService;
