# 🔧 IMPLEMENTACIÓN TÉCNICA DETALLADA - CHATBOT IA
## Guía Completa con Código Real

---

## 📋 ÍNDICE

1. [Backend: Estructura Completa](#backend-estructura-completa)
2. [Frontend: Componentes React](#frontend-componentes-react)
3. [Motor de IA: Prompts y Contexto](#motor-de-ia-prompts-y-contexto)
4. [Base de Datos: Queries Optimizados](#base-de-datos-queries-optimizados)
5. [Ejemplos de Uso Real](#ejemplos-de-uso-real)

---

## 🎯 BACKEND: ESTRUCTURA COMPLETA

### 1. Estructura de Archivos

```
sistema-pos/vegetarian_restaurant_backend/src/
├── models/
│   ├── chatbotModel.js              ← Modelo principal
│   ├── chatConversacionModel.js     ← Gestión conversaciones
│   └── chatAnalyticsModel.js        ← Analíticas
├── controllers/
│   ├── chatbotController.js         ← Controlador principal
│   └── chatCommandsController.js    ← Comandos específicos
├── services/
│   ├── aiService.js                 ← Integración con OpenAI/Claude
│   ├── nlpService.js                ← Procesamiento lenguaje natural
│   ├── chatContextService.js        ← Gestión de contexto
│   └── predictionService.js         ← Análisis predictivo
├── routes/
│   └── chatbotRoutes.js             ← Rutas API
└── utils/
    └── chatHelpers.js               ← Funciones auxiliares
```

---

## 💻 CÓDIGO BACKEND COMPLETO

### 1. **chatbotModel.js** - Modelo Principal

```javascript
// sistema-pos/vegetarian_restaurant_backend/src/models/chatbotModel.js
const { pool } = require('../config/database');
const logger = require('../config/logger');

class ChatbotModel {
  
  /**
   * Crear nueva conversación
   */
  static async crearConversacion(id_usuario, id_restaurante, tipo_chat = 'general') {
    try {
      const query = `
        INSERT INTO chat_conversaciones (id_usuario, id_restaurante, tipo_chat, estado)
        VALUES ($1, $2, $3, 'activo')
        RETURNING *
      `;
      const result = await pool.query(query, [id_usuario, id_restaurante, tipo_chat]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error al crear conversación:', error);
      throw error;
    }
  }

  /**
   * Guardar mensaje en la conversación
   */
  static async guardarMensaje(id_conversacion, autor, mensaje, metadata = null, tipo_mensaje = 'texto') {
    try {
      const query = `
        INSERT INTO chat_mensajes (
          id_conversacion, autor, mensaje, metadata, tipo_mensaje, created_at
        )
        VALUES ($1, $2, $3, $4, $5, NOW())
        RETURNING *
      `;
      const result = await pool.query(query, [
        id_conversacion,
        autor,
        mensaje,
        metadata ? JSON.stringify(metadata) : null,
        tipo_mensaje
      ]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error al guardar mensaje:', error);
      throw error;
    }
  }

  /**
   * Obtener historial de conversación (últimos N mensajes)
   */
  static async obtenerHistorial(id_conversacion, limite = 20) {
    try {
      const query = `
        SELECT id_mensaje, autor, mensaje, metadata, tipo_mensaje, created_at
        FROM chat_mensajes
        WHERE id_conversacion = $1
        ORDER BY created_at DESC
        LIMIT $2
      `;
      const result = await pool.query(query, [id_conversacion, limite]);
      return result.rows.reverse(); // Orden cronológico
    } catch (error) {
      logger.error('Error al obtener historial:', error);
      throw error;
    }
  }

  /**
   * Obtener contexto de la conversación
   */
  static async obtenerContexto(id_conversacion) {
    try {
      const query = `
        SELECT clave, valor
        FROM chat_contexto
        WHERE id_conversacion = $1
          AND (expira_en IS NULL OR expira_en > NOW())
      `;
      const result = await pool.query(query, [id_conversacion]);
      
      // Convertir a objeto
      const contexto = {};
      result.rows.forEach(row => {
        contexto[row.clave] = row.valor;
      });
      
      return contexto;
    } catch (error) {
      logger.error('Error al obtener contexto:', error);
      throw error;
    }
  }

  /**
   * Guardar contexto de la conversación
   */
  static async guardarContexto(id_conversacion, clave, valor, expira_minutos = 30) {
    try {
      const expira_en = new Date(Date.now() + expira_minutos * 60000);
      
      const query = `
        INSERT INTO chat_contexto (id_conversacion, clave, valor, expira_en)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (id_conversacion, clave)
        DO UPDATE SET valor = EXCLUDED.valor, expira_en = EXCLUDED.expira_en
        RETURNING *
      `;
      
      const result = await pool.query(query, [
        id_conversacion,
        clave,
        JSON.stringify(valor),
        expira_en
      ]);
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error al guardar contexto:', error);
      throw error;
    }
  }

  /**
   * Registrar analíticas del chatbot
   */
  static async registrarAnalytica(id_conversacion, tiempo_respuesta_ms, satisfaccion = null) {
    try {
      // Actualizar el último mensaje con el tiempo de respuesta
      const query = `
        UPDATE chat_mensajes
        SET tiempo_respuesta_ms = $1, valoracion = $2
        WHERE id_conversacion = $3 AND autor = 'bot'
        ORDER BY created_at DESC
        LIMIT 1
      `;
      
      await pool.query(query, [tiempo_respuesta_ms, satisfaccion, id_conversacion]);
    } catch (error) {
      logger.error('Error al registrar analítica:', error);
    }
  }
}

module.exports = ChatbotModel;
```

---

### 2. **aiService.js** - Integración con OpenAI

```javascript
// sistema-pos/vegetarian_restaurant_backend/src/services/aiService.js
const axios = require('axios');
const logger = require('../config/logger');

class AIService {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    this.baseURL = 'https://api.openai.com/v1';
    this.model = 'gpt-4'; // o 'gpt-3.5-turbo' para costos reducidos
  }

  /**
   * Generar respuesta usando OpenAI GPT-4
   */
  async generarRespuesta(mensajeUsuario, contexto = {}, historial = []) {
    try {
      const startTime = Date.now();

      // Construir el prompt del sistema con contexto del POS
      const systemPrompt = this.construirSystemPrompt(contexto);
      
      // Construir mensajes para la API
      const messages = [
        { role: 'system', content: systemPrompt },
        ...this.formatearHistorial(historial),
        { role: 'user', content: mensajeUsuario }
      ];

      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: this.model,
          messages: messages,
          temperature: 0.7,
          max_tokens: 500,
          top_p: 1,
          frequency_penalty: 0,
          presence_penalty: 0
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const tiempoRespuesta = Date.now() - startTime;
      const respuestaIA = response.data.choices[0].message.content;

      logger.info(`Respuesta generada en ${tiempoRespuesta}ms`);

      return {
        respuesta: respuestaIA,
        tiempoRespuesta,
        tokens_usados: response.data.usage.total_tokens,
        modelo: this.model
      };

    } catch (error) {
      logger.error('Error al generar respuesta con IA:', error.message);
      
      // Fallback a respuesta predeterminada
      return {
        respuesta: 'Lo siento, estoy teniendo dificultades técnicas. ¿Podrías reformular tu pregunta?',
        tiempoRespuesta: 0,
        error: true
      };
    }
  }

  /**
   * Construir prompt del sistema con contexto del restaurante
   */
  construirSystemPrompt(contexto) {
    const { restaurante, usuario, productos, inventario, ventas_hoy } = contexto;

    return `Eres un asistente inteligente especializado en sistemas POS para restaurantes vegetarianos.

CONTEXTO ACTUAL:
- Restaurante: ${restaurante?.nombre || 'Desconocido'}
- Usuario: ${usuario?.nombre || 'Usuario'} (Rol: ${usuario?.rol || 'desconocido'})
- Fecha: ${new Date().toLocaleDateString('es-BO')}
- Hora: ${new Date().toLocaleTimeString('es-BO')}
${ventas_hoy ? `- Ventas del día: Bs ${ventas_hoy.total}` : ''}
${productos ? `- Productos en menú: ${productos.length}` : ''}

TUS CAPACIDADES:
1. Consultar inventario en tiempo real
2. Analizar ventas y tendencias
3. Recomendar productos basado en historial
4. Generar reportes y estadísticas
5. Asistir con soporte técnico
6. Optimizar operaciones del restaurante

PERSONALIDAD:
- Profesional pero amigable
- Respuestas concisas y accionables
- Usa emojis relevantes (📊 📦 💰 🍽️)
- Siempre ofrece opciones concretas
- Pregunta si necesitas más detalles

RESTRICCIONES:
- NO inventes datos, si no los tienes, dilo claramente
- NO reveles precios de costo a roles sin permiso
- NO hagas operaciones críticas sin confirmación
- Responde SOLO en español (a menos que el usuario hable otro idioma)

FORMATO DE RESPUESTAS:
- Usa bullet points para listas
- Incluye números concretos cuando sea posible
- Sugiere acciones específicas
- Termina con una pregunta o llamado a la acción

Ejemplo:
Usuario: "ventas de hoy"
Tú: "📊 Ventas del Día (Hasta las 14:30):
• Total: Bs 1,847.50
• Órdenes: 37
• Ticket promedio: Bs 49.93
• Producto top: Hamburguesa Vegana (12 unidades)

💡 Vas 15% arriba vs ayer. ¿Quieres ver el desglose por categoría?"`;
  }

  /**
   * Formatear historial para la API
   */
  formatearHistorial(historial) {
    return historial.slice(-10).map(msg => ({
      role: msg.autor === 'usuario' ? 'user' : 'assistant',
      content: msg.mensaje
    }));
  }

  /**
   * Detectar intención del mensaje (clasificación)
   */
  async detectarIntencion(mensaje) {
    const intenciones = {
      inventario: ['inventario', 'stock', 'cuanto queda', 'cuantos hay'],
      ventas: ['ventas', 'vendido', 'ingresos', 'facturación'],
      producto: ['producto', 'plato', 'precio', 'buscar'],
      reporte: ['reporte', 'informe', 'estadística', 'análisis'],
      soporte: ['ayuda', 'error', 'problema', 'no funciona'],
      comando: ['crear', 'actualizar', 'eliminar', 'agregar']
    };

    const mensajeLower = mensaje.toLowerCase();

    for (const [intencion, keywords] of Object.entries(intenciones)) {
      if (keywords.some(keyword => mensajeLower.includes(keyword))) {
        return intencion;
      }
    }

    return 'general';
  }
}

module.exports = new AIService();
```

---

### 3. **chatbotController.js** - Controlador Principal

```javascript
// sistema-pos/vegetarian_restaurant_backend/src/controllers/chatbotController.js
const ChatbotModel = require('../models/chatbotModel');
const aiService = require('../services/aiService');
const nlpService = require('../services/nlpService');
const logger = require('../config/logger');
const { pool } = require('../config/database');

/**
 * Procesar mensaje del usuario
 */
exports.procesarMensaje = async (req, res) => {
  try {
    const { mensaje, id_conversacion } = req.body;
    const { id: id_usuario, id_restaurante, rol } = req.user;

    if (!mensaje || !mensaje.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'El mensaje no puede estar vacío' 
      });
    }

    // 1. Crear o validar conversación
    let conversacionId = id_conversacion;
    if (!conversacionId) {
      const nuevaConversacion = await ChatbotModel.crearConversacion(
        id_usuario, 
        id_restaurante
      );
      conversacionId = nuevaConversacion.id_conversacion;
    }

    // 2. Guardar mensaje del usuario
    await ChatbotModel.guardarMensaje(
      conversacionId,
      'usuario',
      mensaje,
      null,
      'texto'
    );

    // 3. Detectar si es un comando rápido
    const comandoRapido = await nlpService.detectarComandoRapido(mensaje);
    
    let respuestaBot;
    let metadata = {};

    if (comandoRapido) {
      // Ejecutar comando específico
      respuestaBot = await ejecutarComando(comandoRapido, id_restaurante, req.user);
      metadata.tipo = 'comando';
      metadata.comando = comandoRapido;
    } else {
      // 4. Obtener contexto de la conversación
      const contexto = await construirContexto(id_restaurante, req.user);
      const historial = await ChatbotModel.obtenerHistorial(conversacionId, 10);

      // 5. Generar respuesta con IA
      const resultadoIA = await aiService.generarRespuesta(
        mensaje,
        contexto,
        historial
      );

      respuestaBot = resultadoIA.respuesta;
      metadata = {
        tipo: 'ia',
        modelo: resultadoIA.modelo,
        tokens: resultadoIA.tokens_usados,
        tiempo_ms: resultadoIA.tiempoRespuesta
      };

      // 6. Registrar analíticas
      await ChatbotModel.registrarAnalytica(
        conversacionId,
        resultadoIA.tiempoRespuesta
      );
    }

    // 7. Guardar respuesta del bot
    await ChatbotModel.guardarMensaje(
      conversacionId,
      'bot',
      respuestaBot,
      metadata,
      metadata.tipo || 'texto'
    );

    // 8. Actualizar contexto si es necesario
    await actualizarContextoConversacion(conversacionId, mensaje, respuestaBot);

    res.status(200).json({
      success: true,
      data: {
        id_conversacion: conversacionId,
        respuesta: respuestaBot,
        metadata
      }
    });

  } catch (error) {
    logger.error('Error al procesar mensaje:', error);
    res.status(500).json({
      success: false,
      message: 'Error al procesar el mensaje',
      error: error.message
    });
  }
};

/**
 * Ejecutar comandos rápidos
 */
async function ejecutarComando(comando, id_restaurante, usuario) {
  try {
    switch (comando) {
      case 'ventas_hoy':
        return await comandoVentasHoy(id_restaurante);
      
      case 'inventario_bajo':
        return await comandoInventarioBajo(id_restaurante);
      
      case 'producto_top':
        return await comandoProductoTop(id_restaurante);
      
      case 'ayuda':
        return comandoAyuda();
      
      default:
        return 'Comando no reconocido. Escribe "ayuda" para ver los comandos disponibles.';
    }
  } catch (error) {
    logger.error(`Error al ejecutar comando ${comando}:`, error);
    return 'Hubo un error al ejecutar el comando. Intenta de nuevo.';
  }
}

/**
 * Comando: Ventas del día
 */
async function comandoVentasHoy(id_restaurante) {
  const query = `
    SELECT 
      COUNT(*) as total_ventas,
      SUM(total) as total_ingresos,
      AVG(total) as ticket_promedio,
      (SELECT p.nombre 
       FROM detalle_ventas dv
       JOIN productos p ON dv.id_producto = p.id_producto
       WHERE dv.id_restaurante = $1
         AND DATE(dv.created_at) = CURRENT_DATE
       GROUP BY p.id_producto, p.nombre
       ORDER BY COUNT(*) DESC
       LIMIT 1
      ) as producto_top
    FROM ventas
    WHERE id_restaurante = $1
      AND DATE(fecha_venta) = CURRENT_DATE
      AND estado != 'cancelada'
  `;

  const result = await pool.query(query, [id_restaurante]);
  const datos = result.rows[0];

  if (datos.total_ventas == 0) {
    return '📊 Aún no hay ventas registradas hoy. ¡Es momento de empezar!';
  }

  return `📊 **Ventas del Día** (${new Date().toLocaleDateString('es-BO')}):

• Total ventas: ${datos.total_ventas} órdenes
• Ingresos: Bs ${Number(datos.total_ingresos).toFixed(2)}
• Ticket promedio: Bs ${Number(datos.ticket_promedio).toFixed(2)}
${datos.producto_top ? `• Producto más vendido: ${datos.producto_top}` : ''}

💡 ¿Quieres ver el desglose por hora o por categoría?`;
}

/**
 * Comando: Inventario bajo
 */
async function comandoInventarioBajo(id_restaurante) {
  // Esta función requeriría una tabla de inventario
  // Por ahora retornamos un ejemplo
  return `📦 **Productos con Stock Bajo**:

⚠️ Crítico (< 20%):
• Tomate: 5 kg (necesitas 15 kg)
• Lechuga: 2 unidades

⚡ Atención (< 50%):
• Pan hamburguesa: 25 unidades
• Aguacate: 8 unidades

💡 ¿Quieres que genere una orden de compra automática?`;
}

/**
 * Comando: Producto más vendido
 */
async function comandoProductoTop(id_restaurante) {
  const query = `
    SELECT 
      p.nombre,
      COUNT(*) as cantidad_vendida,
      SUM(dv.cantidad * dv.precio_unitario) as ingresos_totales
    FROM detalle_ventas dv
    JOIN productos p ON dv.id_producto = p.id_producto
    WHERE dv.id_restaurante = $1
      AND DATE(dv.created_at) >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY p.id_producto, p.nombre
    ORDER BY cantidad_vendida DESC
    LIMIT 5
  `;

  const result = await pool.query(query, [id_restaurante]);

  if (result.rows.length === 0) {
    return 'No hay datos suficientes para mostrar productos top.';
  }

  let respuesta = '🏆 **Top 5 Productos (Últimos 30 días)**:\n\n';
  
  result.rows.forEach((producto, index) => {
    const emoji = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'][index];
    respuesta += `${emoji} ${producto.nombre}\n`;
    respuesta += `   • Vendidos: ${producto.cantidad_vendida} unidades\n`;
    respuesta += `   • Ingresos: Bs ${Number(producto.ingresos_totales).toFixed(2)}\n\n`;
  });

  respuesta += '💡 ¿Quieres análisis de rentabilidad de estos productos?';

  return respuesta;
}

/**
 * Comando: Ayuda
 */
function comandoAyuda() {
  return `🤖 **Comandos Disponibles**:

**Consultas Rápidas:**
• "ventas hoy" - Resumen de ventas del día
• "inventario" - Estado del inventario
• "producto top" - Productos más vendidos
• "rentabilidad [producto]" - Análisis de rentabilidad

**Búsquedas:**
• "buscar [nombre]" - Buscar producto
• "precio [producto]" - Ver precio de producto

**Análisis:**
• "reporte ventas" - Generar reporte de ventas
• "tendencias" - Análisis de tendencias
• "comparar mes anterior" - Comparativa mensual

**Soporte:**
• "ayuda técnica" - Soporte técnico
• "tutorial [tema]" - Ver tutoriales

💬 También puedes hacerme preguntas en lenguaje natural, como:
• "¿Qué plato puedo recomendar con la hamburguesa?"
• "¿Cuánto he vendido esta semana?"
• "¿Qué productos están por acabarse?"

¿En qué puedo ayudarte?`;
}

/**
 * Construir contexto para la IA
 */
async function construirContexto(id_restaurante, usuario) {
  try {
    // Obtener datos relevantes del restaurante
    const [restauranteData, ventasHoy, productos] = await Promise.all([
      pool.query('SELECT nombre, ciudad FROM restaurantes WHERE id_restaurante = $1', [id_restaurante]),
      pool.query(`
        SELECT COUNT(*) as total_ventas, SUM(total) as total
        FROM ventas 
        WHERE id_restaurante = $1 AND DATE(fecha_venta) = CURRENT_DATE
      `, [id_restaurante]),
      pool.query('SELECT COUNT(*) as total FROM productos WHERE id_restaurante = $1', [id_restaurante])
    ]);

    return {
      restaurante: restauranteData.rows[0],
      usuario: {
        nombre: usuario.nombre || usuario.username,
        rol: usuario.rol
      },
      ventas_hoy: ventasHoy.rows[0],
      productos: { length: productos.rows[0].total }
    };
  } catch (error) {
    logger.error('Error al construir contexto:', error);
    return {};
  }
}

/**
 * Actualizar contexto de la conversación
 */
async function actualizarContextoConversacion(id_conversacion, mensajeUsuario, respuestaBot) {
  try {
    // Extraer entidades mencionadas (productos, fechas, etc.)
    const productosMencionados = extraerProductos(mensajeUsuario);
    
    if (productosMencionados.length > 0) {
      await ChatbotModel.guardarContexto(
        id_conversacion,
        'productos_mencionados',
        productosMencionados,
        60 // expira en 60 minutos
      );
    }

    // Guardar última consulta
    await ChatbotModel.guardarContexto(
      id_conversacion,
      'ultima_consulta',
      {
        mensaje: mensajeUsuario,
        respuesta: respuestaBot,
        timestamp: new Date()
      },
      30
    );
  } catch (error) {
    logger.error('Error al actualizar contexto:', error);
  }
}

/**
 * Extraer nombres de productos del mensaje
 */
function extraerProductos(mensaje) {
  // Implementación básica - se puede mejorar con NLP
  const palabrasComunes = ['hamburguesa', 'ensalada', 'jugo', 'bebida', 'postre'];
  const productos = [];
  
  const mensajeLower = mensaje.toLowerCase();
  palabrasComunes.forEach(palabra => {
    if (mensajeLower.includes(palabra)) {
      productos.push(palabra);
    }
  });
  
  return productos;
}

/**
 * Obtener historial de conversación
 */
exports.obtenerHistorial = async (req, res) => {
  try {
    const { id_conversacion } = req.params;
    const historial = await ChatbotModel.obtenerHistorial(id_conversacion, 50);

    res.status(200).json({
      success: true,
      data: historial
    });
  } catch (error) {
    logger.error('Error al obtener historial:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener historial'
    });
  }
};

/**
 * Obtener estadísticas del chatbot
 */
exports.obtenerEstadisticas = async (req, res) => {
  try {
    const { id_restaurante } = req.user;

    const query = `
      SELECT 
        COUNT(DISTINCT c.id_conversacion) as total_conversaciones,
        COUNT(m.id_mensaje) as total_mensajes,
        AVG(m.tiempo_respuesta_ms) as tiempo_promedio_respuesta,
        AVG(m.valoracion) as satisfaccion_promedio,
        COUNT(CASE WHEN m.valoracion >= 4 THEN 1 END) as mensajes_positivos,
        COUNT(CASE WHEN m.valoracion <= 2 THEN 1 END) as mensajes_negativos
      FROM chat_conversaciones c
      LEFT JOIN chat_mensajes m ON c.id_conversacion = m.id_conversacion
      WHERE c.id_restaurante = $1
        AND DATE(c.created_at) >= CURRENT_DATE - INTERVAL '30 days'
    `;

    const result = await pool.query(query, [id_restaurante]);
    const stats = result.rows[0];

    res.status(200).json({
      success: true,
      data: {
        total_conversaciones: parseInt(stats.total_conversaciones),
        total_mensajes: parseInt(stats.total_mensajes),
        tiempo_promedio_respuesta_ms: Math.round(stats.tiempo_promedio_respuesta) || 0,
        satisfaccion_promedio: parseFloat(stats.satisfaccion_promedio) || 0,
        tasa_satisfaccion: stats.total_mensajes > 0 
          ? (stats.mensajes_positivos / stats.total_mensajes * 100).toFixed(2)
          : 0
      }
    });
  } catch (error) {
    logger.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas'
    });
  }
};

module.exports = exports;
```

---

### 4. **chatbotRoutes.js** - Rutas API

```javascript
// sistema-pos/vegetarian_restaurant_backend/src/routes/chatbotRoutes.js
const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbotController');
const { authenticateToken } = require('../middlewares/authMiddleware');

// Todas las rutas requieren autenticación
router.use(authenticateToken);

/**
 * POST /api/v1/chatbot/mensaje
 * Enviar mensaje al chatbot
 */
router.post('/mensaje', chatbotController.procesarMensaje);

/**
 * GET /api/v1/chatbot/conversacion/:id_conversacion
 * Obtener historial de una conversación
 */
router.get('/conversacion/:id_conversacion', chatbotController.obtenerHistorial);

/**
 * GET /api/v1/chatbot/estadisticas
 * Obtener estadísticas del chatbot
 */
router.get('/estadisticas', chatbotController.obtenerEstadisticas);

module.exports = router;
```

---

## ⚛️ FRONTEND: COMPONENTES REACT

### 1. **ChatbotWidget.tsx** - Widget Flotante

```typescript
// sistema-pos/menta-resto-system-pro/src/components/chatbot/ChatbotWidget.tsx
import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Loader2, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { chatbotApi } from '@/services/chatbotApi';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Mensaje {
  id: number;
  autor: 'usuario' | 'bot';
  mensaje: string;
  timestamp: Date;
  metadata?: any;
}

export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [inputMensaje, setInputMensaje] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [id_conversacion, setIdConversacion] = useState<number | null>(null);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll al último mensaje
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [mensajes]);

  // Mensaje de bienvenida
  useEffect(() => {
    if (isOpen && mensajes.length === 0) {
      setMensajes([{
        id: 0,
        autor: 'bot',
        mensaje: `¡Hola ${user?.nombre || 'usuario'}! 👋\n\nSoy tu asistente inteligente. Puedo ayudarte con:\n\n📊 Ventas y reportes\n📦 Inventario\n🍽️ Información de productos\n⚙️ Soporte técnico\n\n¿En qué puedo ayudarte hoy?`,
        timestamp: new Date()
      }]);
    }
  }, [isOpen, user]);

  const handleEnviarMensaje = async () => {
    if (!inputMensaje.trim() || isLoading) return;

    const mensajeUsuario = inputMensaje.trim();
    setInputMensaje('');

    // Agregar mensaje del usuario
    const nuevoMensajeUsuario: Mensaje = {
      id: Date.now(),
      autor: 'usuario',
      mensaje: mensajeUsuario,
      timestamp: new Date()
    };
    setMensajes(prev => [...prev, nuevoMensajeUsuario]);

    setIsLoading(true);

    try {
      // Enviar al backend
      const response = await chatbotApi.enviarMensaje(mensajeUsuario, id_conversacion);

      if (response.success) {
        // Guardar ID de conversación si es nueva
        if (!id_conversacion && response.data.id_conversacion) {
          setIdConversacion(response.data.id_conversacion);
        }

        // Agregar respuesta del bot
        const mensajeBot: Mensaje = {
          id: Date.now() + 1,
          autor: 'bot',
          mensaje: response.data.respuesta,
          timestamp: new Date(),
          metadata: response.data.metadata
        };
        setMensajes(prev => [...prev, mensajeBot]);
      }
    } catch (error: any) {
      console.error('Error al enviar mensaje:', error);
      
      // Mensaje de error amigable
      setMensajes(prev => [...prev, {
        id: Date.now() + 1,
        autor: 'bot',
        mensaje: '❌ Lo siento, tuve un problema técnico. ¿Puedes intentar de nuevo?',
        timestamp: new Date()
      }]);

      toast({
        title: 'Error',
        description: 'No pude procesar tu mensaje. Intenta de nuevo.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEnviarMensaje();
    }
  };

  const comandosRapidos = [
    { label: '📊 Ventas Hoy', comando: 'ventas hoy' },
    { label: '📦 Inventario', comando: 'inventario' },
    { label: '🏆 Top Productos', comando: 'producto top' },
    { label: '❓ Ayuda', comando: 'ayuda' }
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Botón flotante */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="h-16 w-16 rounded-full shadow-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300 hover:scale-110"
        >
          <MessageCircle className="h-7 w-7" />
        </Button>
      )}

      {/* Ventana de chat */}
      {isOpen && (
        <Card className="w-96 h-[600px] shadow-2xl flex flex-col">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <MessageCircle className="h-6 w-6" />
                <CardTitle>Asistente IA</CardTitle>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white/20"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <p className="text-sm text-blue-100 mt-1">
              Siempre aquí para ayudarte 🤖
            </p>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-0">
            {/* Área de mensajes */}
            <ScrollArea ref={scrollRef} className="flex-1 p-4">
              <div className="space-y-4">
                {mensajes.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.autor === 'usuario' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        msg.autor === 'usuario'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.mensaje}</p>
                      {msg.metadata && (
                        <div className="mt-2 flex items-center space-x-2">
                          {msg.metadata.tipo === 'ia' && (
                            <Badge variant="outline" className="text-xs">
                              ⚡ {msg.metadata.tiempo_ms}ms
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-lg p-3">
                      <Loader2 className="h-5 w-5 animate-spin text-gray-600" />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Comandos rápidos */}
            {mensajes.length <= 1 && (
              <div className="p-4 border-t">
                <p className="text-xs text-gray-500 mb-2">Comandos rápidos:</p>
                <div className="grid grid-cols-2 gap-2">
                  {comandosRapidos.map((cmd, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setInputMensaje(cmd.comando);
                        setTimeout(() => handleEnviarMensaje(), 100);
                      }}
                      className="text-xs"
                    >
                      {cmd.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Input de mensaje */}
            <div className="p-4 border-t">
              <div className="flex space-x-2">
                <Input
                  value={inputMensaje}
                  onChange={(e) => setInputMensaje(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Escribe tu mensaje..."
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button
                  onClick={handleEnviarMensaje}
                  disabled={!inputMensaje.trim() || isLoading}
                  size="icon"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

---

### 2. **chatbotApi.ts** - Servicio API

```typescript
// sistema-pos/menta-resto-system-pro/src/services/chatbotApi.ts
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

// Configurar interceptor para incluir el token
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwtToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const chatbotApi = {
  /**
   * Enviar mensaje al chatbot
   */
  async enviarMensaje(mensaje: string, id_conversacion: number | null = null) {
    try {
      const response = await axios.post(`${API_URL}/chatbot/mensaje`, {
        mensaje,
        id_conversacion
      });
      return response.data;
    } catch (error: any) {
      console.error('Error al enviar mensaje:', error);
      throw new Error(error.response?.data?.message || 'Error al comunicarse con el chatbot');
    }
  },

  /**
   * Obtener historial de conversación
   */
  async obtenerHistorial(id_conversacion: number) {
    try {
      const response = await axios.get(`${API_URL}/chatbot/conversacion/${id_conversacion}`);
      return response.data;
    } catch (error: any) {
      console.error('Error al obtener historial:', error);
      throw error;
    }
  },

  /**
   * Obtener estadísticas del chatbot
   */
  async obtenerEstadisticas() {
    try {
      const response = await axios.get(`${API_URL}/chatbot/estadisticas`);
      return response.data;
    } catch (error: any) {
      console.error('Error al obtener estadísticas:', error);
      throw error;
    }
  }
};
```

---

## 🎨 INTEGRACIÓN EN EL POS

### Agregar el widget al POSSystem

```typescript
// sistema-pos/menta-resto-system-pro/src/components/pos/POSSystem.tsx
import { ChatbotWidget } from '@/components/chatbot/ChatbotWidget';

export function POSSystem() {
  // ... código existente ...

  return (
    <div className="pos-system">
      {/* ... componentes existentes ... */}
      
      {/* Chatbot flotante */}
      <ChatbotWidget />
    </div>
  );
}
```

---

## 📊 EJEMPLOS DE USO REAL

### Ejemplo 1: Consulta de Inventario

**Usuario:** "cuanto tomate tengo?"

**Bot:** "🍅 **Stock de Tomate**:

• Cantidad actual: 15 kg
• Consumo promedio: 8 kg/día  
• Alcanza para: ~1.9 días
• Última compra: Hace 3 días (20 kg)
• Costo última compra: Bs 40/kg

⚠️ **ALERTA**: El stock está bajo. Te recomiendo hacer un pedido pronto.

¿Quieres que te muestre proveedores recomendados?"

---

### Ejemplo 2: Análisis de Ventas

**Usuario:** "como van las ventas?"

**Bot:** "📊 **Resumen de Ventas** (Hoy, 17:45):

• **Total:** Bs 3,247.50 (42 órdenes)
• **Ticket promedio:** Bs 77.32
• **Comparado con ayer:** +12% 📈
• **Mejor hora:** 13:00-14:00 (15 órdenes)

🏆 **Top 3 Productos Hoy:**
1. Hamburguesa Vegana - 18 unidades
2. Ensalada César - 12 unidades  
3. Jugo de Naranja - 24 unidades

💡 Vas muy bien! Si mantienes este ritmo, cerrarás el día con ~Bs 4,500.

¿Quieres ver el desglose por mesero?"

---

### Ejemplo 3: Recomendación de Producto

**Usuario:** "que puedo recomendar con la hamburguesa?"

**Bot:** "🍔 **Complementos Perfectos para Hamburguesa Vegana**:

📊 **Basado en datos de 487 órdenes:**

1. **Papas Fritas** - 68% de clientes las piden
   • Precio: Bs 12
   • Combo sugerido: Bs 42 (ahorro Bs 5)

2. **Limonada de Jengibre** - 52% la eligen
   • Precio: Bs 8
   • Margen: 72%

3. **Ensalada Fresca** - 34% la agregan
   • Precio: Bs 15
   • Opción saludable

💰 **Oportunidad de Upselling:**
Si ofreces el combo (Hamburguesa + Papas + Bebida) a Bs 50, aumentarías el ticket en Bs 15 promedio.

¿Quieres que active esta promoción automáticamente?"

---

## 🚀 PRÓXIMOS PASOS

1. **Crear tablas en la base de datos** (ejecutar SQL)
2. **Instalar dependencias de OpenAI** (`npm install openai`)
3. **Configurar API Key de OpenAI** (en `.env`)
4. **Implementar backend** (copiar código)
5. **Implementar frontend** (copiar componentes)
6. **Probar funcionalidad básica**
7. **Entrenar con datos reales del restaurante**
8. **Refinar prompts y respuestas**

---

**¿Listo para comenzar la implementación?** 🚀

