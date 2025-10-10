# ANÁLISIS DE TABLAS LEGACY - SITEMM POS

## Fecha de Análisis
Octubre 2025

## Resumen Ejecutivo
Este documento identifica tablas que pueden estar en desuso o duplicadas en el sistema SITEMM POS.

---

## 1. TABLA `usuarios`

### Estado: ⚠️ POSIBLEMENTE EN DESUSO

### Descripción
Tabla que parece ser un intento anterior de gestión de usuarios, actualmente reemplazada por `vendedores`.

### Estructura
```sql
CREATE TABLE usuarios (
    id_usuario INTEGER,
    nombre VARCHAR,
    email VARCHAR,
    password_hash VARCHAR,
    rol_id INTEGER,
    id_sucursal INTEGER,
    activo BOOLEAN,
    creado_en TIMESTAMP,
    actualizado_en TIMESTAMP
);
```

### Tabla Actual en Uso
**`vendedores`** - Esta es la tabla activa para gestión de usuarios del POS

```sql
CREATE TABLE vendedores (
    id_vendedor SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(100),
    password_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(20) NOT NULL,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    id_sucursal INTEGER,
    id_restaurante INTEGER NOT NULL,
    rol_admin_id INTEGER
);
```

### Referencias en el Código
- ❌ No se encontraron importaciones de modelos de `usuarios`
- ❌ No hay controladores que usen esta tabla
- ❌ No hay rutas que referencien esta tabla
- ⚠️ Aparece 139 veces en el código pero en contexto de:
  - `usuarios_actuales` (contador de uso)
  - `max_usuarios` (límite de plan)
  - NO como referencia a la tabla

### Recomendación
**✅ ELIMINAR**

**Justificación:**
1. La tabla `vendedores` cumple todas las funciones necesarias
2. No hay referencias activas en el código al modelo `usuarios`
3. La tabla `vendedores` tiene mejor diseño (incluye multitenancy con `id_restaurante`)
4. No hay foreign keys que dependan de esta tabla

**Acción Propuesta:**
```sql
-- 1. Verificar que no hay datos críticos
SELECT COUNT(*) FROM usuarios;

-- 2. Si hay datos, migrar a vendedores si es necesario
-- (Probablemente no hay datos o son de prueba)

-- 3. Eliminar la tabla
DROP TABLE IF EXISTS usuarios CASCADE;
```

---

## 2. TABLA `servicios_restaurante`

### Estado: ⚠️ POSIBLEMENTE EN DESUSO

### Descripción
Tabla que parece ser un sistema anterior de gestión de servicios/suscripciones, reemplazada por el sistema de planes actual.

### Estructura
```sql
CREATE TABLE servicios_restaurante (
    id INTEGER,
    id_restaurante INTEGER,
    nombre_plan VARCHAR,
    descripcion_plan TEXT,
    fecha_inicio DATE,
    fecha_fin DATE,
    estado_suscripcion VARCHAR,
    precio_mensual NUMERIC,
    ultimo_pago DATE,
    funcionalidades_json JSONB,
    creado_en TIMESTAMP WITH TIME ZONE,
    actualizado_en TIMESTAMP WITH TIME ZONE
);
```

### Tablas Actuales en Uso
**`planes`** + **`suscripciones`** - Sistema actual de planes

```sql
-- Sistema actual más robusto
CREATE TABLE planes (...);  -- Definición de planes
CREATE TABLE suscripciones (...);  -- Suscripciones de restaurantes
CREATE TABLE contadores_uso (...);  -- Contadores de recursos
CREATE TABLE alertas_limites (...);  -- Alertas de límites
CREATE TABLE auditoria_planes (...);  -- Auditoría de cambios
```

### Referencias en el Código
- ❌ No se encontraron referencias en el código fuente
- ❌ No hay modelos que la importen
- ❌ No hay controladores que la usen
- ❌ No hay rutas que la referencien

### Recomendación
**✅ ELIMINAR**

**Justificación:**
1. El sistema actual de planes es mucho más completo
2. No hay referencias en el código
3. El nuevo sistema tiene mejor arquitectura:
   - Separación de responsabilidades (planes vs suscripciones)
   - Auditoría completa
   - Sistema de contadores y alertas
   - Mejor normalización

**Acción Propuesta:**
```sql
-- 1. Verificar datos existentes
SELECT COUNT(*), MIN(fecha_inicio), MAX(fecha_fin) 
FROM servicios_restaurante;

-- 2. Si hay suscripciones activas, migrar al nuevo sistema
-- Ejemplo de migración:
INSERT INTO suscripciones (
    id_restaurante, 
    id_plan, 
    estado, 
    fecha_inicio, 
    fecha_fin
)
SELECT 
    sr.id_restaurante,
    p.id_plan,
    CASE 
        WHEN sr.estado_suscripcion = 'activo' THEN 'activa'
        WHEN sr.estado_suscripcion = 'inactivo' THEN 'suspendida'
        ELSE 'cancelada'
    END,
    sr.fecha_inicio,
    sr.fecha_fin
FROM servicios_restaurante sr
LEFT JOIN planes p ON p.nombre = sr.nombre_plan
WHERE sr.estado_suscripcion IS NOT NULL;

-- 3. Eliminar la tabla legacy
DROP TABLE IF EXISTS servicios_restaurante CASCADE;
```

---

## 3. TABLA `metodos_pago_backup`

### Estado: ⚠️ BACKUP TEMPORAL

### Descripción
Tabla de respaldo creada durante migración de métodos de pago.

### Estructura
```sql
CREATE TABLE metodos_pago_backup (
    id_pago INTEGER,
    descripcion VARCHAR,
    activo BOOLEAN,
    id_restaurante INTEGER
);
```

### Recomendación
**✅ ELIMINAR DESPUÉS DE VERIFICACIÓN**

**Justificación:**
1. Es un backup temporal
2. Si la migración ya se completó exitosamente, no es necesario mantenerlo
3. Ocupa espacio innecesario

**Acción Propuesta:**
```sql
-- 1. Verificar que los métodos de pago están correctos
SELECT * FROM metodos_pago;

-- 2. Comparar con el backup
SELECT COUNT(*) FROM metodos_pago_backup;

-- 3. Si todo está correcto, eliminar
DROP TABLE IF EXISTS metodos_pago_backup CASCADE;
```

---

## 4. TABLA `planes_pos`

### Estado: ⚠️ DUPLICADA / PROPÓSITO DIFERENTE

### Descripción
Tabla similar a `planes` pero usada para el sitio web de marketing.

### Estructura
```sql
CREATE TABLE planes_pos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100),
    descripcion TEXT,
    precio_mensual DECIMAL(10,2),
    precio_anual DECIMAL(10,2),
    caracteristicas JSONB,
    max_sucursales INTEGER,
    max_usuarios INTEGER,
    incluye_impresion BOOLEAN,
    incluye_delivery BOOLEAN,
    incluye_reservas BOOLEAN,
    incluye_analytics BOOLEAN,
    incluye_soporte_24h BOOLEAN,
    activo BOOLEAN,
    orden_display INTEGER,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### Tabla Similar
**`planes`** - Tabla principal del sistema POS

### Análisis
Esta tabla parece tener un propósito específico para el backend de marketing web (`multiserve-web-backend`), donde se muestran los planes en la página de ventas.

### Recomendación
**⚠️ EVALUAR - POSIBLEMENTE MANTENER SI SE USA EN WEB MARKETING**

**Opciones:**
1. **Mantener separada** - Si el web marketing necesita información independiente
2. **Sincronizar** - Crear triggers para mantener ambas sincronizadas
3. **Consolidar** - Usar una sola tabla `planes` para ambos sistemas

**Acción Propuesta:**
```sql
-- Verificar si está siendo usada
SELECT schemaname, tablename, 
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables 
WHERE tablename = 'planes_pos';

-- Si se decide consolidar:
-- 1. Migrar datos únicos de planes_pos a planes
-- 2. Actualizar el backend web para usar tabla planes
-- 3. Eliminar planes_pos
```

---

## RESUMEN DE ACCIONES

### ✅ Eliminar Inmediatamente
1. `usuarios` - Reemplazada por `vendedores`
2. `servicios_restaurante` - Reemplazada por sistema de planes actual
3. `metodos_pago_backup` - Backup temporal ya no necesario

### ⚠️ Evaluar
4. `planes_pos` - Verificar si es necesaria para web marketing

---

## SCRIPT DE LIMPIEZA

```sql
-- =====================================================
-- SCRIPT DE LIMPIEZA DE TABLAS LEGACY
-- Ejecutar SOLO después de verificar y migrar datos
-- =====================================================

-- Paso 1: Verificar datos existentes
DO $$
BEGIN
    RAISE NOTICE 'Verificando datos en tablas legacy...';
    
    RAISE NOTICE 'usuarios: % registros', (SELECT COUNT(*) FROM usuarios);
    RAISE NOTICE 'servicios_restaurante: % registros', (SELECT COUNT(*) FROM servicios_restaurante);
    RAISE NOTICE 'metodos_pago_backup: % registros', (SELECT COUNT(*) FROM metodos_pago_backup);
    RAISE NOTICE 'planes_pos: % registros', (SELECT COUNT(*) FROM planes_pos);
END $$;

-- Paso 2: Migrar datos si es necesario
-- (Insertar queries de migración específicas aquí si se encuentran datos)

-- Paso 3: Eliminar tablas legacy
-- COMENTAR HASTA ESTAR SEGURO DE QUE NO HAY DATOS IMPORTANTES

-- DROP TABLE IF EXISTS usuarios CASCADE;
-- DROP TABLE IF EXISTS servicios_restaurante CASCADE;
-- DROP TABLE IF EXISTS metodos_pago_backup CASCADE;

-- Verificar tablas_pos solo si no se usa en web marketing
-- DROP TABLE IF EXISTS planes_pos CASCADE;

-- Paso 4: Verificar que todo sigue funcionando
SELECT 'Limpieza completada. Verificar que el sistema funciona correctamente.' AS status;
```

---

## NOTAS IMPORTANTES

1. **⚠️ NUNCA ejecutar DROP en producción sin backup**
2. **✅ Hacer backup completo antes de cualquier eliminación**
3. **🔍 Verificar que no hay foreign keys huérfanas**
4. **✅ Probar en ambiente de desarrollo primero**
5. **📊 Documentar cualquier dato migrado**

---

## HISTORIAL DE CAMBIOS

| Fecha | Acción | Responsable |
|-------|--------|-------------|
| Oct 2025 | Análisis inicial | Sistema |
| - | Pendiente ejecución | - |


