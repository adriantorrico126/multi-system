# Corrección de Prefacturas con Datos Históricos en Producción

## Problema Identificado
Las prefacturas en producción están mostrando datos históricos de sesiones anteriores, mientras que en local este problema ya está solucionado. Esto indica que el código de producción no tiene las correcciones más recientes.

## Causa del Problema
1. **Prefacturas sin fecha_apertura**: Algunas prefacturas abiertas no tienen `fecha_apertura` establecida
2. **Filtrado incorrecto**: Las consultas no están filtrando correctamente por fecha de apertura de sesión
3. **Funciones SQL faltantes**: Pueden faltar funciones auxiliares para el cálculo correcto

## Solución

### Paso 1: Diagnóstico
Ejecutar el script de diagnóstico para identificar el problema específico:

```bash
cd sistema-pos/database-migrations
python diagnostico_prefactura_produccion.py
```

Este script:
- Verifica el estado actual de todas las prefacturas abiertas
- Identifica prefacturas sin `fecha_apertura`
- Calcula discrepancias entre totales
- Verifica si existen las funciones SQL necesarias

### Paso 2: Corrección
Ejecutar el script de corrección:

```bash
cd sistema-pos/database-migrations
python fix_prefactura_produccion.py
```

Este script:
- Actualiza todas las prefacturas abiertas sin `fecha_apertura`
- Crea funciones SQL auxiliares si no existen
- Recalcula todos los totales de prefacturas abiertas
- Crea índices para mejorar performance
- Verifica que la corrección se aplicó correctamente

### Paso 3: Verificación
Después de ejecutar la corrección, verificar que:

1. **Todas las prefacturas abiertas tienen `fecha_apertura`**:
   ```sql
   SELECT COUNT(*) FROM prefacturas 
   WHERE estado = 'abierta' AND fecha_apertura IS NULL;
   -- Debe retornar 0
   ```

2. **Los totales coinciden con la sesión actual**:
   ```sql
   SELECT 
       p.id_prefactura,
       p.total_acumulado,
       get_total_sesion_actual(p.id_mesa, p.id_restaurante) as total_calculado
   FROM prefacturas p
   WHERE p.estado = 'abierta';
   ```

3. **Las funciones SQL existen**:
   ```sql
   SELECT proname FROM pg_proc 
   WHERE proname IN ('get_ventas_sesion_actual', 'get_total_sesion_actual');
   ```

## Configuración de Variables de Entorno

Antes de ejecutar los scripts, configurar las variables de entorno para la conexión a producción:

```bash
export DB_HOST=tu_host_produccion
export DB_PORT=5432
export DB_NAME=vegetarian_restaurant
export DB_USER=tu_usuario
export DB_PASSWORD=tu_password
```

## Archivos Creados

1. **`fix_prefactura_produccion.sql`**: Script SQL con todas las correcciones
2. **`fix_prefactura_produccion.py`**: Script Python para ejecutar la corrección de manera segura
3. **`diagnostico_prefactura_produccion.py`**: Script de diagnóstico para identificar problemas

## Logs

Los scripts generan logs detallados:
- `fix_prefactura_produccion.log`: Log de la corrección
- `diagnostico_prefactura_produccion.log`: Log del diagnóstico

## Rollback (Si es necesario)

Si algo sale mal, se puede hacer rollback manual:

```sql
-- Restaurar prefacturas a estado anterior (si es necesario)
-- Nota: Esto solo es necesario si hay problemas graves
```

## Verificación Final

Después de la corrección, probar en la aplicación:

1. Abrir una mesa
2. Hacer algunas ventas
3. Verificar que la prefactura solo muestra las ventas de la sesión actual
4. Liberar la mesa
5. Volver a abrir la mesa
6. Verificar que la prefactura está limpia (sin datos históricos)

## Notas Importantes

- **Backup**: Siempre hacer backup de la base de datos antes de ejecutar correcciones en producción
- **Horario**: Ejecutar durante horarios de bajo tráfico
- **Monitoreo**: Monitorear la aplicación después de la corrección
- **Testing**: Probar en un ambiente de staging primero si es posible

## Contacto

Si hay problemas durante la ejecución, revisar los logs y contactar al equipo de desarrollo.
