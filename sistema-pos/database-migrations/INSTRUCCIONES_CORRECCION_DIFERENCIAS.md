# Corrección de Diferencias Local vs Producción

## 🔍 Problema Identificado

El sistema de inventario no funciona en producción debido a diferencias en la estructura de la base de datos entre el entorno local y producción.

### Diferencias Principales:

1. **Tabla `ventas`**: Falta la columna `observaciones_pago`
2. **Tabla `historial_pagos_diferidos`**: Faltan varias columnas:
   - `id_pago_final`
   - `id_vendedor` 
   - `id_mesa`
   - `id_restaurante`
   - `id_metodo_pago`
3. **Tabla `pagos_diferidos`**: Falta la columna `id_restaurante`
4. **Funciones SQL**: Faltan funciones críticas para el inventario
5. **Triggers**: Faltan triggers para actualización automática de stock
6. **Vistas**: Faltan vistas para reportes de inventario

## 🛠️ Solución

### Archivos Creados:

1. **`diagnostico_diferencias_local_produccion.sql`** - Diagnóstica las diferencias
2. **`corregir_diferencias_local_produccion.sql`** - Corrige las diferencias
3. **`corregir_diferencias_local_produccion.py`** - Script Python para ejecutar la corrección

### Pasos para Ejecutar:

#### Opción 1: Usando DBeaver (Recomendado)

1. **Ejecutar Diagnóstico:**
   ```sql
   -- Copiar y pegar el contenido de: diagnostico_diferencias_local_produccion.sql
   ```

2. **Ejecutar Corrección:**
   ```sql
   -- Copiar y pegar el contenido de: corregir_diferencias_local_produccion.sql
   ```

#### Opción 2: Usando Python

1. **Configurar credenciales** en `corregir_diferencias_local_produccion.py`:
   ```python
   PRODUCTION_CONFIG = {
       'host': 'tu_ip_servidor',
       'port': 5432,
       'database': 'vegetarian_restaurant_db',
       'user': 'postgres',
       'password': 'tu_password'
   }
   ```

2. **Ejecutar el script:**
   ```bash
   cd sistema-pos/database-migrations
   python corregir_diferencias_local_produccion.py
   ```

## 📋 Qué Corrige el Script

### 1. Estructura de Tablas
- ✅ Agrega `observaciones_pago` a tabla `ventas`
- ✅ Agrega columnas faltantes a `historial_pagos_diferidos`
- ✅ Agrega `id_restaurante` a `pagos_diferidos`

### 2. Funciones SQL
- ✅ `validar_integridad_lote()` - Valida datos de lotes
- ✅ `actualizar_stock_producto()` - Actualiza stock automáticamente
- ✅ `generar_alertas_inventario()` - Genera alertas de stock/caducidad
- ✅ `marcar_venta_diferida_como_pagada()` - Maneja pagos diferidos

### 3. Triggers
- ✅ `trigger_validar_integridad_lote` - Valida lotes al insertar/actualizar
- ✅ `trigger_actualizar_stock_producto` - Actualiza stock al cambiar lotes
- ✅ `trigger_generar_alertas_inventario` - Genera alertas automáticamente

### 4. Vistas
- ✅ `vista_resumen_inventario` - Resumen de inventario por producto
- ✅ `vista_pagos_diferidos_pendientes` - Pagos diferidos pendientes

## 🔧 Verificación Post-Corrección

Después de ejecutar la corrección, verifica que:

1. **Las columnas se agregaron correctamente**
2. **Las funciones se crearon sin errores**
3. **Los triggers están activos**
4. **Las vistas funcionan correctamente**

## ⚠️ Consideraciones Importantes

- **Backup**: Siempre haz backup antes de ejecutar en producción
- **Horario**: Ejecuta durante horarios de bajo tráfico
- **Pruebas**: Prueba el sistema de inventario después de la corrección
- **Monitoreo**: Monitorea los logs durante y después de la ejecución

## 🚨 Si Algo Sale Mal

1. **Revisa los logs** de PostgreSQL
2. **Ejecuta el diagnóstico** nuevamente
3. **Verifica permisos** de usuario
4. **Contacta soporte** si es necesario

## 📞 Soporte

Si encuentras problemas durante la ejecución:
- Revisa los logs de error
- Verifica la conectividad a la base de datos
- Confirma que tienes permisos de administrador
- Ejecuta el diagnóstico para identificar problemas específicos

---

**Fecha de Creación:** 2025-01-09  
**Versión:** 1.0  
**Autor:** Sistema POS
