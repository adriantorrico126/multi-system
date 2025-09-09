# Solución para Error de Eliminación de Mesas

## Problema Identificado

El error 500 al eliminar mesas se debe a **violaciones de foreign key constraints** en la base de datos. Las mesas tienen dependencias en otras tablas que impiden su eliminación directa.

## Causa Raíz

Las siguientes tablas tienen foreign keys que referencian a la tabla `mesas`:

- `prefacturas.id_mesa` → `mesas.id_mesa`
- `ventas.id_mesa` → `mesas.id_mesa` 
- `reservas.id_mesa` → `mesas.id_mesa`
- `mesas_en_grupo.id_mesa` → `mesas.id_mesa`

## Solución Implementada

### 1. Mejoras en el Backend

#### Modelo (`mesaModel.js`)
- ✅ Verificación de dependencias antes de eliminar
- ✅ Mensajes de error específicos y claros
- ✅ Validación de estado de mesa

#### Controlador (`mesaController.js`)
- ✅ Manejo mejorado de errores específicos
- ✅ Nuevo endpoint para eliminación forzada
- ✅ Mensajes de error informativos con sugerencias

#### Rutas (`mesaRoutes.js`)
- ✅ Endpoint normal: `DELETE /api/v1/mesas/configuracion/:id_mesa`
- ✅ Endpoint forzado: `DELETE /api/v1/mesas/configuracion/:id_mesa/forzar`

### 2. Mejoras en el Frontend

#### Servicios (`api.ts`)
- ✅ Función `eliminarMesa()` mejorada
- ✅ Nueva función `eliminarMesaForzada()`
- ✅ Mejor manejo de errores

#### Componente (`MesaConfiguration.tsx`)
- ✅ Modal de confirmación mejorado
- ✅ Dos opciones de eliminación:
  - **Eliminar Mesa**: Solo si está libre y sin dependencias
  - **Eliminar Forzadamente**: Elimina mesa y todas sus dependencias
- ✅ Mensajes de error más claros

### 3. Scripts de Base de Datos

#### `limpiar_dependencias_mesa.sql`
- ✅ Función `limpiar_dependencias_mesa()` para limpiar dependencias
- ✅ Función `eliminar_mesa_con_limpieza()` para eliminación segura

#### `test_eliminar_mesa.js`
- ✅ Script de pruebas para verificar la solución
- ✅ Pruebas de eliminación normal y forzada

## Cómo Usar la Solución

### Opción 1: Eliminación Normal
```javascript
// En el frontend, usar el botón "Eliminar Mesa"
eliminarMesa(id_mesa)
```

### Opción 2: Eliminación Forzada
```javascript
// En el frontend, usar el botón "Eliminar Forzadamente"
eliminarMesaForzada(id_mesa)
```

### Opción 3: Desde Base de Datos
```sql
-- Limpiar dependencias manualmente
SELECT * FROM limpiar_dependencias_mesa(38);

-- Eliminar mesa con limpieza automática
SELECT * FROM eliminar_mesa_con_limpieza(38, 1, TRUE);
```

## Flujo de Eliminación Mejorado

### Eliminación Normal
1. ✅ Verificar que la mesa existe
2. ✅ Verificar que la mesa está libre
3. ✅ Verificar que no tiene dependencias
4. ✅ Eliminar la mesa
5. ✅ Retornar confirmación

### Eliminación Forzada
1. ✅ Verificar que la mesa existe
2. ✅ Limpiar prefacturas relacionadas
3. ✅ Limpiar reservas relacionadas
4. ✅ Remover de grupos de mesas
5. ✅ Actualizar ventas (remover referencia)
6. ✅ Eliminar la mesa
7. ✅ Retornar confirmación

## Mensajes de Error Mejorados

### Antes
```
Error 500: Internal Server Error
```

### Después
```
Error 400: No se puede eliminar la mesa porque tiene registros relacionados. 
Elimine primero las prefacturas, ventas, reservas o grupos asociados.

Sugerencia: Use ?forzar=true para eliminar la mesa y sus dependencias
```

## Pruebas

Para probar la solución:

```bash
cd sistema-pos/vegetarian_restaurant_backend
node test_eliminar_mesa.js
```

## Beneficios de la Solución

1. **Seguridad**: Previene eliminación accidental de datos importantes
2. **Claridad**: Mensajes de error específicos y útiles
3. **Flexibilidad**: Opción de eliminación forzada cuando sea necesario
4. **Integridad**: Mantiene la consistencia de la base de datos
5. **Usabilidad**: Interfaz clara con opciones bien explicadas

## Consideraciones Importantes

- ⚠️ **Eliminación Forzada**: Elimina datos permanentemente
- ⚠️ **Backup**: Siempre hacer backup antes de eliminaciones masivas
- ⚠️ **Auditoría**: Las eliminaciones quedan registradas en logs
- ⚠️ **Permisos**: Solo administradores pueden eliminar mesas

## Archivos Modificados

- `src/models/mesaModel.js` - Lógica de eliminación mejorada
- `src/controllers/mesaController.js` - Manejo de errores mejorado
- `src/routes/mesaRoutes.js` - Nuevo endpoint forzado
- `src/services/api.ts` - Nueva función de eliminación forzada
- `src/components/pos/MesaConfiguration.tsx` - UI mejorada
- `limpiar_dependencias_mesa.sql` - Scripts de base de datos
- `test_eliminar_mesa.js` - Script de pruebas

La solución está lista para usar y resuelve completamente el error 500 al eliminar mesas.
