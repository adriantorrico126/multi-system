# Configuración de Mesas

## Descripción

El sistema de gestión de mesas permite configurar y administrar las mesas disponibles en cada sucursal del restaurante. Esta funcionalidad está integrada en el módulo de POS y proporciona una interfaz profesional para la gestión completa de mesas.

## Características

### 🔧 Configuración de Mesas
- **Crear nuevas mesas**: Agregar mesas con número, capacidad y estado inicial
- **Editar mesas existentes**: Modificar número, capacidad y estado de las mesas
- **Eliminar mesas**: Remover mesas que no estén en uso
- **Validación de datos**: Verificación de números únicos y estados válidos

### 📊 Gestión Operativa
- **Estado de mesas**: Libre, En Uso, Pendiente Cobro, Reservada, Mantenimiento
- **Estadísticas en tiempo real**: Total de mesas, libres, en uso y total acumulado
- **Operaciones de mesa**: Abrir, cerrar, generar prefacturas y facturar

## Interfaz de Usuario

### Pestaña de Gestión Operativa
- Vista de tarjetas con estado visual de cada mesa
- Estadísticas en tiempo real
- Acciones rápidas para cada mesa
- Información detallada de consumo

### Pestaña de Configuración
- Tabla profesional con todas las mesas
- Formularios de creación y edición
- Validación de datos en tiempo real
- Confirmaciones de eliminación

## Estados de Mesa

| Estado | Descripción | Color |
|--------|-------------|-------|
| Libre | Mesa disponible para uso | Verde |
| En Uso | Mesa ocupada con servicio activo | Azul |
| Pendiente Cobro | Mesa esperando pago | Amarillo |
| Reservada | Mesa reservada para uso futuro | Púrpura |
| Mantenimiento | Mesa fuera de servicio | Rojo |

## Funcionalidades Técnicas

### Backend
- **Modelo de Mesa**: Gestión completa de CRUD
- **Controladores**: Lógica de negocio para operaciones
- **Rutas API**: Endpoints RESTful para configuración
- **Validaciones**: Verificación de datos y estados

### Frontend
- **Componente MesaConfiguration**: Interfaz de configuración
- **Componente MesaManagement**: Gestión operativa
- **Validaciones**: Verificación de formularios
- **Notificaciones**: Feedback visual de operaciones

## API Endpoints

### Configuración de Mesas
```
GET    /api/v1/mesas/configuracion/sucursal/:id_sucursal
POST   /api/v1/mesas/configuracion
PUT    /api/v1/mesas/configuracion/:id_mesa
DELETE /api/v1/mesas/configuracion/:id_mesa
```

### Gestión Operativa
```
GET    /api/v1/mesas/sucursal/:id_sucursal
POST   /api/v1/mesas/abrir
PUT    /api/v1/mesas/:id_mesa/cerrar
GET    /api/v1/mesas/sucursal/:id_sucursal/estadisticas
```

## Base de Datos

### Tabla `mesas`
```sql
CREATE TABLE mesas (
    id_mesa SERIAL PRIMARY KEY,
    numero INTEGER NOT NULL,
    id_sucursal INTEGER REFERENCES sucursales(id_sucursal),
    capacidad INTEGER DEFAULT 4,
    estado VARCHAR(20) DEFAULT 'libre',
    id_venta_actual INTEGER REFERENCES ventas(id_venta),
    hora_apertura TIMESTAMP,
    hora_cierre TIMESTAMP,
    total_acumulado DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(numero, id_sucursal)
);
```

## Uso

### Para Administradores
1. Acceder al módulo de POS
2. Navegar a la pestaña "Mesas"
3. Seleccionar "Configuración" para gestionar mesas
4. Usar "Gestión Operativa" para operaciones diarias

### Para Cajeros
1. Acceder al módulo de POS
2. Navegar a la pestaña "Mesas"
3. Usar "Gestión Operativa" para operaciones de mesa

## Validaciones

### Creación de Mesa
- Número de mesa obligatorio
- Número debe ser mayor a 0
- Número único por sucursal
- Capacidad entre 2 y 10 personas

### Edición de Mesa
- Validación de número único (excluyendo la mesa actual)
- Verificación de estados válidos
- Actualización automática de timestamp

### Eliminación de Mesa
- Solo mesas libres pueden ser eliminadas
- Confirmación requerida
- Eliminación permanente

## Notificaciones

El sistema proporciona feedback visual para todas las operaciones:

- ✅ **Éxito**: Operación completada correctamente
- ❌ **Error**: Problema en la operación
- ⚠️ **Advertencia**: Validación o restricción

## Mantenimiento

### Script de Inicialización
Ejecutar `init_mesas.sql` para configurar mesas iniciales:

```bash
psql -d vegetarian_restaurant -f init_mesas.sql
```

### Actualización de Base de Datos
El sistema automáticamente:
- Agrega columnas faltantes
- Crea triggers necesarios
- Inicializa datos por defecto

## Seguridad

- Autenticación requerida para todas las operaciones
- Validación de roles (admin/gerente para configuración)
- Verificación de permisos por sucursal
- Protección contra eliminación de mesas en uso 