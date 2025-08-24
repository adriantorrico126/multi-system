/**
 * Plantillas de Tickets Profesionales
 * Diferentes formatos para comandas, facturas y tickets
 */

const ticketTemplates = {
  // Plantilla estándar para comandas
  standard: {
    name: 'Comanda Estándar',
    description: 'Formato clásico para comandas de cocina',
    header: [
      '╔══════════════════════════════════════════════════════════════╗',
      '║                    COMANDA DE COCINA                        ║',
      '╠══════════════════════════════════════════════════════════════╣',
      '║ Comanda: #{id}                                              ║',
      '║ Mesa: {mesa}                                                ║',
      '║ Mesero: {mesero}                                            ║',
      '║ Fecha: {fecha}                                              ║',
      '║ Hora: {hora}                                                ║',
      '╚══════════════════════════════════════════════════════════════╝'
    ],
    footer: [
      '╔══════════════════════════════════════════════════════════════╗',
      '║                    TOTAL: ${total}                          ║',
      '╠══════════════════════════════════════════════════════════════╣',
      '║                                                            ║',
      '║                ¡GRACIAS POR SU PREFERENCIA!                ║',
      '║                                                            ║',
      '╚══════════════════════════════════════════════════════════════╝'
    ],
    itemFormat: {
      product: '{quantity}x {name}',
      notes: '  → {notes}',
      price: '  ${price}'
    }
  },

  // Plantilla simple para impresoras básicas
  simple: {
    name: 'Comanda Simple',
    description: 'Formato básico para impresoras con funcionalidad limitada',
    header: [
      'Comanda #{id}',
      'Mesa: {mesa}',
      'Mesero: {mesero}',
      'Fecha: {fecha}',
      'Hora: {hora}',
      '─'.repeat(40)
    ],
    footer: [
      '─'.repeat(40),
      'Total: ${total}',
      '',
      'Gracias por su preferencia'
    ],
    itemFormat: {
      product: '{quantity}x {name}',
      notes: '  Notas: {notes}',
      price: '  ${price}'
    }
  },

  // Plantilla para restaurantes vegetarianos
  vegetarian: {
    name: 'Comanda Vegetariana',
    description: 'Formato especializado para restaurantes vegetarianos',
    header: [
      '╔══════════════════════════════════════════════════════════════╗',
      '║                 RESTAURANTE VEGETARIANO                     ║',
      '║                    "MENTA RESTOBAR"                         ║',
      '╠══════════════════════════════════════════════════════════════╣',
      '║ Comanda: #{id}                                              ║',
      '║ Mesa: {mesa}                                                ║',
      '║ Mesero: {mesero}                                            ║',
      '║ Fecha: {fecha}                                              ║',
      '║ Hora: {hora}                                                ║',
      '║                                                            ║',
      '║ 🌱 100% VEGETARIANO • ORGÁNICO • SALUDABLE 🌱              ║',
      '╚══════════════════════════════════════════════════════════════╝'
    ],
    footer: [
      '╔══════════════════════════════════════════════════════════════╗',
      '║                    TOTAL: ${total}                          ║',
      '╠══════════════════════════════════════════════════════════════╣',
      '║                                                            ║',
      '║           ¡GRACIAS POR ELEGIR ALIMENTOS SALUDABLES!        ║',
      '║                                                            ║',
      '║                Menta Restobar - Comida Vegetariana         ║',
      '╚══════════════════════════════════════════════════════════════╝'
    ],
    itemFormat: {
      product: '{quantity}x {name}',
      notes: '  🌿 {notes}',
      price: '  ${price}',
      organic: '  🌱 ORGÁNICO'
    }
  },

  // Plantilla para facturas
  invoice: {
    name: 'Factura',
    description: 'Formato completo para facturas con detalles fiscales',
    header: [
      '╔══════════════════════════════════════════════════════════════╗',
      '║                    FACTURA FISCAL                           ║',
      '║                 "MENTA RESTOBAR"                            ║',
      '╠══════════════════════════════════════════════════════════════╣',
      '║ NIT: 12345678-9                                             ║',
      '║ Dirección: Av. Principal #123, La Paz                      ║',
      '║ Teléfono: (591) 2-1234567                                   ║',
      '╠══════════════════════════════════════════════════════════════╣',
      '║ Factura: #{id}                                              ║',
      '║ Cliente: {cliente}                                          ║',
      '║ Mesa: {mesa}                                                ║',
      '║ Cajero: {mesero}                                            ║',
      '║ Fecha: {fecha}                                              ║',
      '║ Hora: {hora}                                                ║',
      '╚══════════════════════════════════════════════════════════════╝'
    ],
    footer: [
      '╔══════════════════════════════════════════════════════════════╗',
      '║ Subtotal: ${subtotal}                                       ║',
      '║ IVA (13%): ${iva}                                           ║',
      '║ Descuento: ${descuento}                                     ║',
      '║ Total: ${total}                                             ║',
      '╠══════════════════════════════════════════════════════════════╣',
      '║                                                            ║',
      '║                ¡GRACIAS POR SU PREFERENCIA!                ║',
      '║                                                            ║',
      '║           Menta Restobar - Comida Vegetariana              ║',
      '╚══════════════════════════════════════════════════════════════╝'
    ],
    itemFormat: {
      product: '{quantity}x {name}',
      notes: '  → {notes}',
      price: '  ${price}',
      subtotal: '  Subtotal: ${subtotal}'
    }
  },

  // Plantilla para delivery
  delivery: {
    name: 'Pedido Delivery',
    description: 'Formato para pedidos de entrega a domicilio',
    header: [
      '╔══════════════════════════════════════════════════════════════╗',
      '║                   PEDIDO DELIVERY                           ║',
      '║                 "MENTA RESTOBAR"                            ║',
      '╠══════════════════════════════════════════════════════════════╣',
      '║ Pedido: #{id}                                               ║',
      '║ Cliente: {cliente}                                          ║',
      '║ Teléfono: {telefono}                                        ║',
      '║ Dirección: {direccion}                                      ║',
      '║ Fecha: {fecha}                                              ║',
      '║ Hora: {hora}                                                ║',
      '║                                                            ║',
      '║ 🚚 ENTREGA A DOMICILIO 🚚                                  ║',
      '╚══════════════════════════════════════════════════════════════╝'
    ],
    footer: [
      '╔══════════════════════════════════════════════════════════════╗',
      '║ Subtotal: ${subtotal}                                       ║',
      '║ Delivery: ${delivery}                                       ║',
      '║ Total: ${total}                                             ║',
      '╠══════════════════════════════════════════════════════════════╣',
      '║                                                            ║',
      '║           ⏰ Tiempo estimado: {tiempo_entrega}              ║',
      '║                                                            ║',
      '║                ¡GRACIAS POR SU PEDIDO!                     ║',
      '╚══════════════════════════════════════════════════════════════╝'
    ],
    itemFormat: {
      product: '{quantity}x {name}',
      notes: '  📝 {notes}',
      price: '  ${price}'
    }
  },

  // Plantilla para bar/cócteles
  bar: {
    name: 'Pedido Bar',
    description: 'Formato especializado para pedidos de bar',
    header: [
      '╔══════════════════════════════════════════════════════════════╗',
      '║                      PEDIDO BAR                             ║',
      '║                 "MENTA RESTOBAR"                            ║',
      '╠══════════════════════════════════════════════════════════════╣',
      '║ Pedido: #{id}                                               ║',
      '║ Mesa: {mesa}                                                ║',
      '║ Mesero: {mesero}                                            ║',
      '║ Fecha: {fecha}                                              ║',
      '║ Hora: {hora}                                                ║',
      '║                                                            ║',
      '║ 🍹 BEBIDAS • CÓCTELES • JUGOS NATURALES 🍹                ║',
      '╚══════════════════════════════════════════════════════════════╝'
    ],
    footer: [
      '╔══════════════════════════════════════════════════════════════╗',
      '║                    TOTAL: ${total}                          ║',
      '╠══════════════════════════════════════════════════════════════╣',
      '║                                                            ║',
      '║              ¡DISFRUTE SUS BEBIDAS! 🍹                     ║',
      '║                                                            ║',
      '╚══════════════════════════════════════════════════════════════╝'
    ],
    itemFormat: {
      product: '{quantity}x {name}',
      notes: '  🧊 {notes}',
      price: '  ${price}',
      alcohol: '  🍺 {alcohol_content}%'
    }
  }
};

/**
 * Clase para manejar plantillas de tickets
 */
class TicketTemplateManager {
  constructor() {
    this.templates = ticketTemplates;
  }

  /**
   * Obtiene una plantilla por nombre
   */
  getTemplate(templateName) {
    return this.templates[templateName] || this.templates.standard;
  }

  /**
   * Lista todas las plantillas disponibles
   */
  getAvailableTemplates() {
    return Object.keys(this.templates).map(name => ({
      name,
      ...this.templates[name]
    }));
  }

  /**
   * Valida si una plantilla existe
   */
  templateExists(templateName) {
    return !!this.templates[templateName];
  }

  /**
   * Obtiene la plantilla por defecto
   */
  getDefaultTemplate() {
    return this.templates.standard;
  }

  /**
   * Procesa una plantilla con datos específicos
   */
  processTemplate(templateName, data) {
    const template = this.getTemplate(templateName);
    
    if (!template) {
      throw new Error(`Plantilla '${templateName}' no encontrada`);
    }

    return {
      name: template.name,
      description: template.description,
      header: this.processLines(template.header, data),
      footer: this.processLines(template.footer, data),
      itemFormat: template.itemFormat
    };
  }

  /**
   * Procesa las líneas de una plantilla reemplazando variables
   */
  processLines(lines, data) {
    return lines.map(line => {
      return line
        .replace('{id}', data.id || 'N/A')
        .replace('{mesa}', data.mesa || 'N/A')
        .replace('{mesero}', data.mesero || 'N/A')
        .replace('{fecha}', data.fecha || new Date().toLocaleDateString('es-BO'))
        .replace('{hora}', data.hora || new Date().toLocaleTimeString('es-BO'))
        .replace('{cliente}', data.cliente || 'N/A')
        .replace('{telefono}', data.telefono || 'N/A')
        .replace('{direccion}', data.direccion || 'N/A')
        .replace('{total}', data.total ? `$${data.total.toFixed(2)}` : 'N/A')
        .replace('{subtotal}', data.subtotal ? `$${data.subtotal.toFixed(2)}` : 'N/A')
        .replace('{iva}', data.iva ? `$${data.iva.toFixed(2)}` : 'N/A')
        .replace('{descuento}', data.descuento ? `$${data.descuento.toFixed(2)}` : 'N/A')
        .replace('{delivery}', data.delivery ? `$${data.delivery.toFixed(2)}` : 'N/A')
        .replace('{tiempo_entrega}', data.tiempo_entrega || '30-45 min');
    });
  }
}

module.exports = {
  ticketTemplates,
  TicketTemplateManager
};
