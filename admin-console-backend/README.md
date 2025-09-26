# Admin Console Backend

Este es el backend de la consola de administración central para el sistema POS multirestaurante.

## Características
- API RESTful exclusiva para administradores del sistema.
- Conexión segura a la base de datos del POS (solo lectura/escritura controlada).
- JWT para autenticación de administradores.
- No afecta el funcionamiento del POS ni modifica su código.

## Primeros pasos

1. Instala dependencias:
   ```bash
   npm install
   ```
2. Crea un archivo `.env` basado en el ejemplo:
   ```env
   ADMIN_JWT_SECRET=supersecreto_admin
   ADMIN_PORT=5001
   POS_DB_HOST=localhost
   POS_DB_PORT=5432
   POS_DB_USER=postgres
   POS_DB_PASSWORD=tu_password
   POS_DB_NAME=menta_restobar_db
   ```
3. Levanta el servidor en modo desarrollo:
   ```bash
   npm run dev
   ```

## Estructura sugerida
- `src/` Código fuente principal
- `controllers/` Lógica de endpoints
- `routes/` Definición de rutas
- `middlewares/` Middlewares de seguridad y autenticación
- `services/` Lógica de negocio y acceso a datos
- `config/` Configuración y utilidades

---

**Este backend es solo para uso interno de administración. No debe ser expuesto a los clientes del POS.** 