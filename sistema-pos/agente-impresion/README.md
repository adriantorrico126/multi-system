# 🖨️ Agente de Impresión Profesional - Sitemm

> Sistema de impresión distribuido y robusto para restaurantes

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/sitemm/agente-impresion)
[![Node.js](https://img.shields.io/badge/node.js-18+-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-MIT-yellow.svg)](LICENSE)

## 🚀 Características

- ✅ **Conexión WebSocket robusta** con reconexión automática
- ✅ **Soporte múltiples impresoras** (USB, Red, Serial)
- ✅ **Sistema de colas** para manejo de múltiples impresiones
- ✅ **Logging profesional** con Winston
- ✅ **Heartbeat automático** para monitoreo
- ✅ **Manejo de errores robusto** con reintentos
- ✅ **Modo de prueba** (DRY_RUN) para desarrollo
- ✅ **Configuración flexible** via variables de entorno
- ✅ **Plantillas personalizables** para tickets
- ✅ **Métricas en tiempo real** del estado del agente

## 📋 Requisitos

- **Node.js** 18.0.0 o superior
- **Impresora térmica** compatible (EPSON, STAR, CITIZEN)
- **Conexión a internet** para conectar con el backend
- **Permisos de administrador** (para acceso a puertos USB)

## 🛠️ Instalación

### 1. Clonar o descargar el proyecto

```bash
git clone <repository-url>
cd agente-impresion
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

```bash
# Copiar archivo de ejemplo
cp env.example .env

# Editar configuración
nano .env
```

### 4. Configurar impresora

Asegúrate de que tu impresora térmica esté:
- **Conectada** (USB, red o serial)
- **Encendida** y con papel
- **Drivers instalados** en el sistema

## ⚙️ Configuración

### Variables de Entorno Principales

```bash
# URL del servidor backend
PRINT_SERVER_URL=http://localhost:3001

# ID del restaurante
RESTAURANTE_ID=1

# Token de autenticación
PRINT_AGENT_TOKEN=tu_token_secreto

# Interfaz de impresora
PRINTER_INTERFACE=USB

# Modo de prueba
DRY_RUN=false
```

### Configuración de Impresora

#### USB
```bash
PRINTER_INTERFACE=USB
```

#### Red
```bash
PRINTER_INTERFACE=tcp://192.168.1.100:9100
```

#### Serial
```bash
PRINTER_INTERFACE=COM1
```

## 🚀 Uso

### Desarrollo

```bash
# Modo desarrollo con recarga automática
npm run dev

# Modo producción
npm start
```

### Producción

```bash
# Construir ejecutable
npm run build

# Ejecutar desde dist/
./dist/agente-impresion.exe
```

## 📦 Empaquetado

### Crear ejecutable Windows

```bash
npm run build:win
```

### Crear ejecutable macOS

```bash
npm run build:mac
```

### Crear ambos

```bash
npm run build
```

Los ejecutables se generan en la carpeta `dist/`.

## 🔧 Comandos Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm start` | Iniciar agente en modo producción |
| `npm run dev` | Iniciar agente en modo desarrollo |
| `npm run build` | Construir ejecutables para todas las plataformas |
| `npm run build:win` | Construir ejecutable para Windows |
| `npm run build:mac` | Construir ejecutable para macOS |
| `npm test` | Ejecutar tests |
| `npm run lint` | Verificar código con ESLint |

## 📊 Monitoreo

### Logs

Los logs se guardan en la carpeta `logs/`:

- `combined.log` - Todos los logs
- `error.log` - Solo errores

### Métricas

El agente expone métricas en tiempo real:

- **Estado de conexión**
- **Cola de impresión**
- **Estadísticas de impresión**
- **Uptime del agente**

### Health Check

```bash
# Verificar estado del agente
curl http://localhost:9090/health
```

## 🚨 Solución de Problemas

### Error: "Impresora no encontrada"

1. **Verificar conexión física**
2. **Revisar drivers del sistema**
3. **Comprobar interfaz en configuración**
4. **Probar con modo DRY_RUN**

### Error: "Conexión fallida"

1. **Verificar URL del backend**
2. **Comprobar token de autenticación**
3. **Revisar firewall/red**
4. **Verificar que el backend esté funcionando**

### Error: "Socket timeout"

1. **Aumentar CONNECTION_TIMEOUT**
2. **Verificar estabilidad de red**
3. **Revisar configuración del servidor**

## 🔒 Seguridad

### Autenticación

- **Token único** por agente
- **Validación de restaurante** en cada conexión
- **Heartbeat** para detectar desconexiones

### Red

- **WebSocket seguro** (WSS) en producción
- **Validación de origen** configurable
- **Rate limiting** en el servidor

## 📈 Escalabilidad

### Múltiples Agentes

Puedes ejecutar múltiples agentes en la misma máquina:

```bash
# Agente 1
RESTAURANTE_ID=1 AGENT_NAME="Agente Cocina" npm start

# Agente 2  
RESTAURANTE_ID=1 AGENT_NAME="Agente Bar" npm start
```

### Balanceo de Carga

El backend distribuye automáticamente las impresiones entre agentes disponibles.

## 🤝 Contribución

1. **Fork** el proyecto
2. **Crea** una rama para tu feature
3. **Commit** tus cambios
4. **Push** a la rama
5. **Abre** un Pull Request

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver [LICENSE](LICENSE) para más detalles.

## 🆘 Soporte

### Documentación
- [Wiki del proyecto](https://github.com/sitemm/agente-impresion/wiki)
- [Guía de configuración](https://github.com/sitemm/agente-impresion/docs)

### Comunidad
- [Issues](https://github.com/sitemm/agente-impresion/issues)
- [Discussions](https://github.com/sitemm/agente-impresion/discussions)

### Contacto
- **Email:** soporte@sitemm.com
- **Telegram:** @sitemm_support

---

**Desarrollado con ❤️ por el equipo de Sitemm**
