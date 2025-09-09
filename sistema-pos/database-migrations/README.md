# Sistema de Migraciones de Base de Datos
# Sistema POS - Pago Diferido

## Descripción
Este sistema permite aplicar migraciones de base de datos de manera profesional y controlada, facilitando el despliegue de cambios desde el entorno de desarrollo a producción.

## Estructura del Proyecto
```
database-migrations/
├── migrate.py                 # Script principal de migración
├── migrations/               # Directorio de archivos SQL
│   ├── 001_add_pago_diferido_tables.sql
│   └── 002_cleanup_metodos_pago.sql
├── requirements.txt          # Dependencias de Python
├── README.md                # Este archivo
└── migrations.log           # Log de ejecución (generado automáticamente)
```

## Instalación

### 1. Instalar dependencias
```bash
pip install -r requirements.txt
```

### 2. Verificar conexión
```bash
# Probar conexión local
python migrate.py local

# Probar conexión a producción (solo verificación)
python migrate.py production
```

## Uso

### Ejecutar todas las migraciones
```bash
# Para entorno local
python migrate.py local

# Para entorno de producción
python migrate.py production
```

### Ejecutar migración específica
```bash
# Ejecutar solo la migración de pago diferido
python migrate.py local 001_add_pago_diferido_tables.sql

# Ejecutar solo la limpieza de métodos de pago
python migrate.py production 002_cleanup_metodos_pago.sql
```

## Configuración

### Entornos Soportados

#### Local (Desarrollo)
- **Host**: localhost
- **Puerto**: 5432
- **Usuario**: postgres
- **Base de datos**: sistempos

#### Producción
- **Host**: db-postgresql-nyc3-64232-do-user-24932517-0.j.db.ondigitalocean.com
- **Puerto**: 25060
- **Usuario**: doadmin
- **Base de datos**: defaultdb

## Migraciones Incluidas

### 001_add_pago_diferido_tables.sql
**Descripción**: Agrega todas las tablas y columnas necesarias para el sistema de pago diferido.

**Cambios**:
- ✅ Agrega columnas a `ventas`: `tipo_pago`, `estado_pago`, `id_pago_final`, `fecha_pago_final`
- ✅ Crea tabla `pagos_diferidos` para gestionar pagos pendientes
- ✅ Crea tabla `historial_pagos_diferidos` para auditoría
- ✅ Crea función `marcar_venta_diferida_como_pagada()` para procesar pagos
- ✅ Crea índices para optimización
- ✅ Crea vista `vista_pagos_diferidos_pendientes` para reportes
- ✅ Agrega triggers para timestamps automáticos

### 002_cleanup_metodos_pago.sql
**Descripción**: Limpia métodos de pago duplicados e incorrectos.

**Cambios**:
- ✅ Desactiva métodos de pago incorrectos (pendiente_caja, Pago Diferido, duplicados)
- ✅ Activa solo los 5 métodos correctos: Efectivo, Tarjeta de Crédito, Tarjeta de Débito, Transferencia, Pago Móvil
- ✅ Actualiza ventas que usan métodos incorrectos
- ✅ Crea vista `vista_metodos_pago_activos` para consultas optimizadas

## Características del Sistema

### ✅ Seguridad
- **Transacciones**: Cada migración se ejecuta en una transacción
- **Rollback automático**: Si falla una migración, se revierten todos los cambios
- **Verificaciones**: Validaciones automáticas al final de cada migración

### ✅ Control de Versiones
- **Tabla de migraciones**: Registra qué migraciones se han ejecutado
- **Prevención de duplicados**: No ejecuta migraciones ya aplicadas
- **Logging detallado**: Registra todas las operaciones en `migrations.log`

### ✅ Flexibilidad
- **Ejecución selectiva**: Puede ejecutar migraciones específicas
- **Múltiples entornos**: Soporte para local y producción
- **Configuración centralizada**: Fácil cambio de credenciales

## Monitoreo y Logs

### Archivo de Log
Todas las operaciones se registran en `migrations.log`:
```
2025-01-09 10:30:15 - INFO - 🚀 Iniciando migraciones para entorno: production
2025-01-09 10:30:16 - INFO - ✅ Conectado a la base de datos: defaultdb
2025-01-09 10:30:17 - INFO - 🚀 Ejecutando migración: 001_add_pago_diferido_tables.sql
2025-01-09 10:30:20 - INFO - ✅ Migración completada: 001_add_pago_diferido_tables.sql
2025-01-09 10:30:21 - INFO - 🎉 ¡Todas las migraciones completadas exitosamente!
```

### Verificaciones Post-Migración
Después de cada migración, el sistema verifica:
- ✅ Que las tablas se crearon correctamente
- ✅ Que las columnas existen
- ✅ Que los índices se crearon
- ✅ Que las funciones están disponibles
- ✅ Que las vistas funcionan

## Troubleshooting

### Error de Conexión
```bash
❌ Error conectando a la base de datos: connection to server failed
```
**Solución**: Verificar credenciales y conectividad de red.

### Migración Ya Ejecutada
```bash
⏭️ Migración ya ejecutada: 001_add_pago_diferido_tables.sql
```
**Solución**: Normal, el sistema previene ejecuciones duplicadas.

### Error en SQL
```bash
❌ Error ejecutando consulta: relation "ventas" does not exist
```
**Solución**: Verificar que la base de datos tiene la estructura base del sistema POS.

## Próximos Pasos

1. **Ejecutar en Local**: Probar las migraciones en el entorno de desarrollo
2. **Validar Funcionalidad**: Verificar que el sistema de pago diferido funciona
3. **Ejecutar en Producción**: Aplicar las migraciones al entorno de producción
4. **Monitorear**: Verificar que todo funciona correctamente en producción

## Contacto
Para dudas o problemas con las migraciones, contactar al equipo de desarrollo del Sistema POS.
