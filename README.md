# Sistema POS - Restaurante Vegetariano

Sistema de punto de venta completo para restaurante vegetariano con gestión de mesas, productos, ventas y usuarios.

## 🚀 Instalación Rápida

### Prerrequisitos

- **Node.js** (versión 16 o superior)
- **PostgreSQL** (versión 12 o superior)
- **Git**

### 1. Clonar el Repositorio

```bash
git clone https://github.com/adriantorrico126/sistema-pos.git
cd sistema-pos
```

### 2. Configuración Automática

Ejecuta el script de configuración automática:

```bash
node setup_backend.js
```

Este script:
- ✅ Crea el archivo `.env` con configuración por defecto
- ✅ Verifica las dependencias
- ✅ Muestra instrucciones personalizadas

### 3. Configuración Manual (Requerida)

#### 3.1 Configurar Base de Datos

1. **Crear base de datos PostgreSQL:**
```sql
CREATE DATABASE menta_restobar_db;
```

2. **Editar archivo `.env`:**
```bash
cd vegetarian_restaurant_backend
# Edita el archivo .env con tus credenciales reales
```

Ejemplo de `.env`:
```env
# Configuración del servidor
NODE_ENV=development
PORT=3000
API_PREFIX=/api/v1

# Configuración de la base de datos
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=tu_password_real_aqui
DB_NAME=menta_restobar_db
DB_PORT=5432

# Configuración de JWT
JWT_SECRET=tu_jwt_secret_muy_seguro_aqui_cambiar_en_produccion
```

#### 3.2 Ejecutar Migraciones

```bash
# Desde la raíz del proyecto
psql -U postgres -d menta_restobar_db -f create_mesa_tables.sql
```

### 4. Instalar Dependencias

```bash
# Backend
cd vegetarian_restaurant_backend
npm install

# Frontend (si existe)
cd ../menta-resto-system-pro
npm install
```

### 5. Iniciar el Sistema

#### Backend
```bash
cd vegetarian_restaurant_backend
npm start
```

#### Frontend
```bash
cd menta-resto-system-pro
npm run dev
```

## 🔧 Verificación

Para verificar que todo funciona correctamente:

```bash
node check_backend_startup.js
```

## 📁 Estructura del Proyecto

```
sistema-pos/
├── vegetarian_restaurant_backend/     # Backend API
│   ├── src/
│   │   ├── config/                   # Configuración
│   │   ├── controllers/              # Controladores
│   │   ├── models/                   # Modelos
│   │   ├── routes/                   # Rutas
│   │   └── middlewares/              # Middlewares
│   ├── tests/                        # Tests
│   └── package.json
├── menta-resto-system-pro/           # Frontend
├── migration-scripts/                 # Scripts de migración
├── setup_backend.js                   # Script de configuración
└── README.md
```

## 🗄️ Base de Datos

### Tablas Principales

- **categorias** - Categorías de productos
- **productos** - Productos del menú
- **vendedores** - Usuarios del sistema
- **mesas** - Gestión de mesas
- **ventas** - Transacciones
- **detalle_ventas** - Detalle de cada venta
- **sucursales** - Ubicaciones del restaurante

### Scripts de Migración

- `create_mesa_tables.sql` - Estructura principal
- `init_mesas.sql` - Datos iniciales de mesas
- `update_tipo_servicio_constraint.sql` - Actualizaciones

## 🔐 Autenticación

El sistema usa JWT para autenticación. Los roles disponibles son:
- `cajero` - Vendedor básico
- `gerente` - Gestión de inventario
- `admin` - Acceso completo
- `cocinero` - Gestión de cocina

## 🧪 Testing

```bash
# Ejecutar tests del backend
cd vegetarian_restaurant_backend
npm test

# Tests específicos
npm run test:watch
```

## 📊 API Endpoints

### Autenticación
- `POST /api/v1/auth/login` - Iniciar sesión
- `POST /api/v1/auth/register` - Registrar usuario

### Productos
- `GET /api/v1/productos` - Listar productos
- `POST /api/v1/productos` - Crear producto
- `PUT /api/v1/productos/:id` - Actualizar producto

### Ventas
- `POST /api/v1/ventas` - Crear venta
- `GET /api/v1/ventas` - Listar ventas
- `GET /api/v1/ventas/:id` - Obtener venta específica

### Mesas
- `GET /api/v1/mesas` - Listar mesas
- `PUT /api/v1/mesas/:id` - Actualizar estado de mesa

## 🚨 Solución de Problemas

### Error: "Variables de entorno de base de datos faltantes"
- Verifica que el archivo `.env` existe en `vegetarian_restaurant_backend/`
- Asegúrate de que todas las variables DB_* estén configuradas

### Error: "Connection refused"
- Verifica que PostgreSQL esté ejecutándose
- Confirma las credenciales en `.env`
- Verifica que la base de datos existe

### Error: "Table doesn't exist"
- Ejecuta los scripts de migración
- Verifica que estés conectado a la base de datos correcta

## 🔄 Migración de Datos

Si tienes un backup de la base de datos:

```bash
# Restaurar backup
psql -U postgres -d menta_restobar_db < backup.sql

# O usar pg_restore para archivos .dump
pg_restore -U postgres -d menta_restobar_db backup.dump
```

## 📝 Variables de Entorno

| Variable | Descripción | Valor por Defecto |
|----------|-------------|-------------------|
| `NODE_ENV` | Entorno de ejecución | `development` |
| `PORT` | Puerto del servidor | `3000` |
| `DB_HOST` | Host de PostgreSQL | `localhost` |
| `DB_USER` | Usuario de PostgreSQL | `postgres` |
| `DB_PASSWORD` | Contraseña de PostgreSQL | - |
| `DB_NAME` | Nombre de la base de datos | `menta_restobar_db` |
| `DB_PORT` | Puerto de PostgreSQL | `5432` |
| `JWT_SECRET` | Secreto para JWT | - |

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia ISC.

## 👨‍💻 Autor

Adrian Torrico - [GitHub](https://github.com/adriantorrico126)

---

**⚠️ IMPORTANTE**: Siempre cambia las credenciales por defecto en producción y usa un JWT_SECRET seguro. 