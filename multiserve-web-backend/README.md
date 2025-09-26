# 🚀 MultiServe Web Backend

Backend profesional para la página web de marketing de MultiServe POS. Sistema moderno construido con TypeScript, Express.js y PostgreSQL.

## ✨ Características

- **🎯 Tracking de Conversión**: Sistema completo de analytics y métricas
- **📝 Solicitudes de Demo**: Gestión profesional de leads y prospectos
- **👥 Gestión de Sesiones**: Tracking avanzado de usuarios y comportamiento
- **📧 Newsletter**: Sistema de suscripciones y comunicación
- **🔒 Seguridad Avanzada**: Middleware de seguridad, validación y rate limiting
- **📊 Logging Profesional**: Sistema de logs con rotación automática
- **🔌 WebSocket**: Notificaciones en tiempo real
- **📈 Analytics**: Métricas detalladas y reportes

## 🛠️ Stack Tecnológico

- **Node.js** + **TypeScript** - Runtime y tipado estático
- **Express.js** - Framework web robusto
- **PostgreSQL** - Base de datos relacional
- **Socket.IO** - Comunicación en tiempo real
- **Winston** - Sistema de logging profesional
- **Joi** - Validación de esquemas
- **Helmet** - Seguridad HTTP
- **CORS** - Configuración de CORS
- **Rate Limiting** - Protección contra abuso

## 🚀 Instalación

### Prerrequisitos

- Node.js >= 18.0.0
- npm >= 8.0.0
- PostgreSQL >= 12.0

### Pasos de instalación

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/multiserve/multiserve-web-backend.git
   cd multiserve-web-backend
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   ```bash
   cp env.example .env
   # Editar .env con tus configuraciones
   ```

4. **Configurar base de datos**
   ```bash
   # Asegúrate de que PostgreSQL esté ejecutándose
   # Las tablas se crearán automáticamente al iniciar el servidor
   ```

5. **Ejecutar en desarrollo**
   ```bash
   npm run dev
   ```

## 📋 Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Ejecutar en modo desarrollo con hot reload

# Producción
npm run build        # Compilar TypeScript
npm start           # Ejecutar versión compilada

# Testing
npm test            # Ejecutar tests
npm run test:watch  # Ejecutar tests en modo watch

# Linting
npm run lint        # Verificar código
npm run lint:fix    # Corregir problemas de linting

# Base de datos
npm run db:generate # Generar cliente Prisma
npm run db:push     # Sincronizar esquema con BD
npm run db:migrate  # Ejecutar migraciones
npm run db:studio   # Abrir Prisma Studio

# Docker
npm run docker:build # Construir imagen Docker
npm run docker:run   # Ejecutar contenedor Docker
```

## 🔧 Configuración

### Variables de Entorno

| Variable | Descripción | Valor por Defecto |
|----------|-------------|-------------------|
| `NODE_ENV` | Entorno de ejecución | `development` |
| `PORT` | Puerto del servidor | `4000` |
| `HOST` | Host del servidor | `localhost` |
| `DB_HOST` | Host de PostgreSQL | `localhost` |
| `DB_PORT` | Puerto de PostgreSQL | `5432` |
| `DB_NAME` | Nombre de la base de datos | `sistempos` |
| `DB_USER` | Usuario de PostgreSQL | `postgres` |
| `DB_PASSWORD` | Contraseña de PostgreSQL | - |
| `JWT_SECRET` | Clave secreta para JWT | - |
| `CORS_ORIGINS` | Orígenes permitidos para CORS | `http://localhost:8080,http://localhost:8082` |

### Base de Datos

El sistema crea automáticamente las siguientes tablas:

- `solicitudes_demo` - Solicitudes de demo y leads
- `conversion_events` - Eventos de conversión y tracking
- `user_sessions` - Sesiones de usuario y analytics
- `newsletter_suscriptores` - Suscriptores del newsletter

## 📚 API Endpoints

### 🎯 Solicitudes de Demo

```http
POST   /api/demo-request          # Crear solicitud de demo
GET    /api/demo-request          # Obtener solicitudes (con filtros)
GET    /api/demo-request/:id      # Obtener solicitud por ID
PUT    /api/demo-request/:id      # Actualizar solicitud
DELETE /api/demo-request/:id      # Eliminar solicitud
GET    /api/demo-request/stats    # Estadísticas de solicitudes
```

### 📊 Eventos de Conversión

```http
POST   /api/conversion-tracking                    # Registrar evento
GET    /api/conversion-tracking                    # Obtener eventos (con filtros)
GET    /api/conversion-tracking/stats              # Estadísticas de conversión
GET    /api/conversion-tracking/session/:sessionId # Eventos por sesión
GET    /api/conversion-tracking/ip/:ip             # Eventos por IP
DELETE /api/conversion-tracking/cleanup           # Limpiar eventos antiguos
```

### 👥 Sesiones de Usuario

```http
POST   /api/user-sessions          # Crear/actualizar sesión
GET    /api/user-sessions          # Obtener sesiones (con filtros)
GET    /api/user-sessions/:id      # Obtener sesión por ID
PUT    /api/user-sessions/:id      # Actualizar sesión
GET    /api/user-sessions/stats    # Estadísticas de sesiones
DELETE /api/user-sessions/cleanup  # Limpiar sesiones antiguas
```

### 📧 Newsletter

```http
POST   /api/newsletter/subscribe        # Suscribirse
POST   /api/newsletter/unsubscribe/:email # Desuscribirse
GET    /api/newsletter                  # Obtener suscriptores
GET    /api/newsletter/stats            # Estadísticas del newsletter
GET    /api/newsletter/check/:email      # Verificar estado de suscripción
GET    /api/newsletter/export           # Exportar lista de suscriptores
```

### 🔍 Sistema

```http
GET    /api/health    # Estado del sistema
GET    /api/info      # Información del sistema
```

## 🔒 Seguridad

- **Helmet.js** - Headers de seguridad HTTP
- **CORS** - Configuración de orígenes permitidos
- **Rate Limiting** - Protección contra abuso
- **Validación de Datos** - Validación con Joi
- **Sanitización** - Limpieza de datos de entrada
- **Logging de Auditoría** - Registro de acciones importantes

## 📊 Logging

El sistema incluye logging profesional con:

- **Rotación automática** de archivos de log
- **Diferentes niveles** (error, warn, info, debug)
- **Logs de auditoría** para acciones importantes
- **Logs de métricas** para analytics
- **Logs de requests** HTTP con detalles

Archivos de log generados:
- `application-YYYY-MM-DD.log` - Logs generales
- `error-YYYY-MM-DD.log` - Solo errores
- `audit-YYYY-MM-DD.log` - Eventos de auditoría
- `metrics-YYYY-MM-DD.log` - Métricas y analytics

## 🔌 WebSocket

El sistema incluye WebSocket para notificaciones en tiempo real:

```javascript
// Cliente
const socket = io('http://localhost:4000');

socket.on('connect', () => {
  console.log('Conectado al servidor');
});

socket.on('notification', (data) => {
  console.log('Nueva notificación:', data);
});
```

## 🐳 Docker

### Construir imagen

```bash
npm run docker:build
```

### Ejecutar contenedor

```bash
npm run docker:run
```

### Docker Compose

```yaml
version: '3.8'
services:
  multiserve-web-backend:
    build: .
    ports:
      - "4000:4000"
    environment:
      - NODE_ENV=production
      - DB_HOST=postgres
      - DB_PASSWORD=your_password
    depends_on:
      - postgres
  
  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=sistempos
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=your_password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

## 🧪 Testing

```bash
# Ejecutar todos los tests
npm test

# Ejecutar tests en modo watch
npm run test:watch

# Ejecutar tests con cobertura
npm run test:coverage
```

## 📈 Monitoreo

### Métricas Disponibles

- **Solicitudes de demo** por día/mes
- **Tasa de conversión** por fuente
- **Sesiones de usuario** únicas
- **Suscriptores del newsletter** activos
- **Eventos de tracking** por tipo
- **Rendimiento** del servidor

### Health Check

```http
GET /api/health
```

Respuesta:
```json
{
  "success": true,
  "message": "Backend de la página web funcionando correctamente",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": "1.0.0",
  "environment": "production"
}
```

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 📞 Soporte

- **Email**: soporte@multiserve.com
- **Documentación**: [Wiki del proyecto](https://github.com/multiserve/multiserve-web-backend/wiki)
- **Issues**: [GitHub Issues](https://github.com/multiserve/multiserve-web-backend/issues)

## 🏆 Créditos

Desarrollado con ❤️ por el equipo de **MultiServe Solutions**

---

**MultiServe Web Backend** - Sistema profesional de marketing y conversión para restaurantes.
