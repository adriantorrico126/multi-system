# Solución Completa para Prefacturas con Datos Históricos en Producción

## 🔍 Problema Identificado

Las prefacturas en producción están mostrando datos históricos de sesiones anteriores, mientras que en local este problema ya está solucionado. Esto indica que:

1. **Código de producción desactualizado**: No tiene las correcciones más recientes
2. **Base de datos con datos inconsistentes**: Prefacturas sin `fecha_apertura` o con totales incorrectos
3. **Filtrado incorrecto**: Las consultas no están filtrando por fecha de sesión

## 🛠️ Solución Completa

### Paso 1: Diagnóstico de la Base de Datos

Ejecutar el script de diagnóstico para identificar problemas específicos:

```bash
cd sistema-pos/database-migrations
python diagnostico_prefactura_produccion.py
```

**Este script verifica:**
- Estado de todas las prefacturas abiertas
- Prefacturas sin `fecha_apertura`
- Discrepancias en totales
- Existencia de funciones SQL auxiliares

### Paso 2: Corrección de la Base de Datos

Ejecutar el script de corrección:

```bash
cd sistema-pos/database-migrations
python fix_prefactura_produccion.py
```

**Este script:**
- Actualiza prefacturas sin `fecha_apertura`
- Crea funciones SQL auxiliares
- Recalcula totales correctos
- Crea índices para performance
- Verifica que la corrección se aplicó

### Paso 3: Actualización del Código del Backend

Ejecutar el script de actualización del código:

```bash
cd sistema-pos/database-migrations
python actualizar_backend_produccion.py
```

**Este script:**
- Crea backup del código de producción
- Actualiza archivos críticos del backend
- Verifica que las correcciones se aplicaron
- Reinicia el servicio del backend

## 📁 Archivos Creados

### Scripts de Base de Datos
1. **`fix_prefactura_produccion.sql`** - Script SQL con todas las correcciones
2. **`fix_prefactura_produccion.py`** - Script Python para ejecutar correcciones de manera segura
3. **`diagnostico_prefactura_produccion.py`** - Script de diagnóstico detallado

### Scripts de Código
4. **`actualizar_backend_produccion.py`** - Script para actualizar código del backend

### Documentación
5. **`INSTRUCCIONES_CORRECCION_PREFACTURAS.md`** - Instrucciones detalladas

## ⚙️ Configuración Requerida

### Variables de Entorno para Base de Datos
```bash
export DB_HOST=tu_host_produccion
export DB_PORT=5432
export DB_NAME=vegetarian_restaurant
export DB_USER=tu_usuario
export DB_PASSWORD=tu_password
```

### Variables de Entorno para Código
```bash
export BACKEND_PRODUCTION_PATH=/ruta/al/backend/produccion
export BACKEND_RESTART_COMMAND="systemctl restart backend-service"
```

## 🔧 Correcciones Implementadas

### En la Base de Datos
1. **Actualización de prefacturas sin fecha_apertura**:
   ```sql
   UPDATE prefacturas 
   SET fecha_apertura = COALESCE(
       fecha_apertura,
       (SELECT hora_apertura FROM mesas WHERE id_mesa = prefacturas.id_mesa),
       NOW()
   )
   WHERE estado = 'abierta' AND fecha_apertura IS NULL;
   ```

2. **Funciones SQL auxiliares**:
   - `get_ventas_sesion_actual()` - Obtiene solo ventas de la sesión actual
   - `get_total_sesion_actual()` - Calcula total solo de la sesión actual

3. **Índices para performance**:
   ```sql
   CREATE INDEX idx_ventas_fecha_mesa_restaurante 
   ON ventas (fecha, id_mesa, id_restaurante, estado);
   ```

### En el Código del Backend
1. **Filtrado por fecha de apertura**:
   ```javascript
   // Obtener la prefactura abierta más reciente
   const prefacturaQuery = `
     SELECT id_prefactura, fecha_apertura
     FROM prefacturas
     WHERE id_mesa = $1 AND id_restaurante = $2 AND estado = 'abierta'
     ORDER BY fecha_apertura DESC
     LIMIT 1
   `;
   
   // Filtrar ventas por fecha de apertura
   const totalSesionQuery = `
     SELECT COALESCE(SUM(dv.subtotal), 0) as total_acumulado
     FROM ventas v
     JOIN detalle_ventas dv ON v.id_venta = dv.id_venta
     WHERE v.id_mesa = $1 
       AND v.id_restaurante = $3
       AND v.fecha >= $4
       AND v.estado = ANY($5)
   `;
   ```

2. **Limpieza automática al liberar mesa**:
   ```javascript
   // Cerrar TODAS las prefacturas abiertas de esta mesa
   const prefacturasAbiertasQuery = `
     SELECT id_prefactura, fecha_apertura, total_acumulado
     FROM prefacturas 
     WHERE id_mesa = $1 AND estado = 'abierta' AND id_restaurante = $2
     ORDER BY fecha_apertura DESC
   `;
   
   // Crear nueva prefactura limpia para la siguiente sesión
   const nuevaPrefactura = await Mesa.crearPrefactura(id_mesa, null, id_restaurante, client);
   ```

## ✅ Verificación Final

Después de ejecutar todos los scripts, verificar:

### 1. Base de Datos
```sql
-- Verificar que no hay prefacturas sin fecha_apertura
SELECT COUNT(*) FROM prefacturas 
WHERE estado = 'abierta' AND fecha_apertura IS NULL;
-- Debe retornar 0

-- Verificar que los totales coinciden
SELECT 
    p.id_prefactura,
    p.total_acumulado,
    get_total_sesion_actual(p.id_mesa, p.id_restaurante) as total_calculado
FROM prefacturas p
WHERE p.estado = 'abierta';
```

### 2. Aplicación
1. Abrir una mesa
2. Hacer algunas ventas
3. Verificar que la prefactura solo muestra ventas de la sesión actual
4. Liberar la mesa
5. Volver a abrir la mesa
6. Verificar que la prefactura está limpia (sin datos históricos)

## 🚨 Consideraciones Importantes

### Seguridad
- **Backup obligatorio**: Siempre hacer backup de la base de datos antes de ejecutar correcciones
- **Horario**: Ejecutar durante horarios de bajo tráfico
- **Monitoreo**: Monitorear la aplicación después de la corrección

### Rollback
Si algo sale mal, se puede hacer rollback usando los backups creados:
- Backup de base de datos (crear manualmente antes)
- Backup de código (creado automáticamente por el script)

### Testing
- Probar en un ambiente de staging primero si es posible
- Verificar todas las funcionalidades después de la corrección
- Monitorear logs de la aplicación

## 📞 Soporte

Si hay problemas durante la ejecución:
1. Revisar los logs generados
2. Verificar las variables de entorno
3. Contactar al equipo de desarrollo
4. Usar los backups para rollback si es necesario

## 🎯 Resultado Esperado

Después de ejecutar todos los scripts:
- ✅ Las prefacturas solo muestran datos de la sesión actual
- ✅ No hay datos históricos mezclados
- ✅ Los totales son correctos
- ✅ El rendimiento es óptimo
- ✅ La funcionalidad está completamente restaurada
