# Solución Corregida para Prefacturas con Datos Históricos en Producción

## 🔍 Problema Identificado

El script de diagnóstico original falló porque intentaba acceder a la tabla `prefacturas` que **SÍ existe** en producción, pero había un error en la consulta. Después de analizar la estructura real de la base de datos de producción, se identificó que:

1. **La tabla `prefacturas` existe** en producción con la estructura correcta
2. **La diferencia principal** está en la tabla `historial_pagos_diferidos` que en producción tiene la columna `id_mesa` pero en local no
3. **El problema real** es que las prefacturas pueden estar mostrando datos históricos por falta de filtrado por fecha de apertura

## 🛠️ Solución Corregida

### Archivos Creados (Corregidos)

1. **`diagnostico_prefactura_produccion_corregido.py`** - Script de diagnóstico que funciona con la estructura real
2. **`fix_prefactura_produccion_corregido.sql`** - Script SQL corregido para la estructura de producción
3. **`fix_prefactura_produccion_corregido.py`** - Script Python corregido para ejecutar la corrección

### Paso 1: Diagnóstico Corregido

Ejecutar el script de diagnóstico corregido:

```bash
cd sistema-pos/database-migrations
python diagnostico_prefactura_produccion_corregido.py
```

**Este script verifica:**
- ✅ Estructura real de las tablas `prefacturas` y `ventas`
- ✅ Estado de todas las prefacturas abiertas
- ✅ Prefacturas sin `fecha_apertura`
- ✅ Discrepancias en totales entre prefacturas y cálculos reales
- ✅ Existencia de funciones SQL auxiliares
- ✅ Índices de performance

### Paso 2: Corrección Corregida

Ejecutar el script de corrección corregido:

```bash
cd sistema-pos/database-migrations
python fix_prefactura_produccion_corregido.py
```

**Este script:**
- ✅ Actualiza prefacturas sin `fecha_apertura`
- ✅ Crea funciones SQL auxiliares (`get_ventas_sesion_actual`, `get_total_sesion_actual`)
- ✅ Recalcula totales correctos solo de la sesión actual
- ✅ Crea índices para mejorar performance
- ✅ Crea vista `vista_pagos_diferidos_pendientes` si no existe
- ✅ Verifica que todas las correcciones se aplicaron

## ⚙️ Configuración Requerida

### Variables de Entorno
```bash
export DB_HOST=tu_host_produccion
export DB_PORT=5432
export DB_NAME=vegetarian_restaurant
export DB_USER=tu_usuario
export DB_PASSWORD=tu_password
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
   - `get_ventas_sesion_actual(p_id_mesa, p_id_restaurante)` - Obtiene solo ventas de la sesión actual
   - `get_total_sesion_actual(p_id_mesa, p_id_restaurante)` - Calcula total solo de la sesión actual

3. **Índices para performance**:
   ```sql
   CREATE INDEX idx_ventas_fecha_mesa_restaurante 
   ON ventas (fecha, id_mesa, id_restaurante, estado);
   
   CREATE INDEX idx_prefacturas_fecha_apertura 
   ON prefacturas (fecha_apertura, id_mesa, estado);
   ```

4. **Vista para pagos diferidos**:
   ```sql
   CREATE OR REPLACE VIEW vista_pagos_diferidos_pendientes AS
   SELECT pd.*, v.mesa_numero, v.total, v.tipo_servicio
   FROM pagos_diferidos pd
   JOIN ventas v ON pd.id_venta = v.id_venta
   WHERE pd.estado = 'pendiente';
   ```

## ✅ Verificación Final

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

-- Verificar que las funciones existen
SELECT proname FROM pg_proc 
WHERE proname IN ('get_ventas_sesion_actual', 'get_total_sesion_actual');
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

### Diferencias con Local
- **Producción**: `historial_pagos_diferidos` tiene columna `id_mesa`
- **Local**: `historial_pagos_diferidos` NO tiene columna `id_mesa`
- **Ambos**: Tienen la tabla `prefacturas` con la misma estructura

### Rollback
Si algo sale mal, se puede hacer rollback usando los backups creados:
- Backup de base de datos (crear manualmente antes)
- Las funciones SQL se pueden eliminar si es necesario

## 📞 Soporte

Si hay problemas durante la ejecución:
1. Revisar los logs generados (`diagnostico_prefactura_produccion_corregido.log`, `fix_prefactura_produccion_corregido.log`)
2. Verificar las variables de entorno
3. Contactar al equipo de desarrollo
4. Usar los backups para rollback si es necesario

## 🎯 Resultado Esperado

Después de ejecutar todos los scripts corregidos:
- ✅ Las prefacturas solo muestran datos de la sesión actual
- ✅ No hay datos históricos mezclados
- ✅ Los totales son correctos y consistentes
- ✅ El rendimiento es óptimo
- ✅ La funcionalidad está completamente restaurada
- ✅ Las funciones SQL auxiliares están disponibles para futuras consultas
