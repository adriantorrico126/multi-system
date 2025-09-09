# Solución: Problema de Prefacturas Históricas

## Problema Identificado
Cuando se registraba una venta con "pago al final" y luego se generaba la prefactura, aparecían productos históricos de sesiones anteriores en lugar de solo los productos de la sesión actual.

## Causa Raíz
1. **Prefacturas abiertas antiguas**: Existían prefacturas abiertas desde fechas muy anteriores (ej: agosto) que no se cerraban correctamente al liberar la mesa.
2. **Filtro de fecha incorrecto**: La función `generarPrefactura` usaba `LEFT JOIN` que podía traer múltiples prefacturas o la incorrecta.
3. **Liberación incompleta**: La función `liberarMesa` solo cerraba una prefactura, no todas las abiertas.

## Solución Implementada

### 1. Mejora en `liberarMesa` (mesaController.js)
```javascript
// ANTES: Solo cerraba una prefactura
const prefactura = await Mesa.getPrefacturaByMesa(id_mesa, id_restaurante);
if (prefactura) {
  await Mesa.cerrarPrefactura(prefactura.id_prefactura, 0, id_restaurante, client);
}

// DESPUÉS: Cierra TODAS las prefacturas abiertas
const prefacturasAbiertasQuery = `
  SELECT id_prefactura, fecha_apertura, total_acumulado
  FROM prefacturas 
  WHERE id_mesa = $1 AND estado = 'abierta' AND id_restaurante = $2
  ORDER BY fecha_apertura DESC
`;
const prefacturasAbiertasResult = await client.query(prefacturasAbiertasQuery, [id_mesa, id_restaurante]);

if (prefacturasAbiertasResult.rows.length > 0) {
  for (const prefactura of prefacturasAbiertasResult.rows) {
    await Mesa.cerrarPrefactura(prefactura.id_prefactura, 0, id_restaurante, client);
  }
}
```

### 2. Mejora en `generarPrefactura` (mesaController.js)
```javascript
// ANTES: LEFT JOIN simple que podía traer múltiples prefacturas
LEFT JOIN prefacturas p ON m.id_mesa = p.id_mesa AND p.estado = 'abierta'

// DESPUÉS: Subconsulta que garantiza solo la prefactura más reciente
LEFT JOIN (
  SELECT DISTINCT ON (id_mesa) id_prefactura, id_mesa, fecha_apertura, estado
  FROM prefacturas 
  WHERE estado = 'abierta' AND id_restaurante = $2
  ORDER BY id_mesa, fecha_apertura DESC
) p ON m.id_mesa = p.id_mesa
```

### 3. Creación automática de prefactura
```javascript
// Si no hay prefactura abierta, crear una nueva automáticamente
if (!mesa.id_prefactura || mesa.estado_prefactura !== 'abierta') {
  const nuevaPrefactura = await Mesa.crearPrefactura(id_mesa, null, id_restaurante, client);
  mesa.fecha_apertura_prefactura = nuevaPrefactura.fecha_apertura;
  mesa.id_prefactura = nuevaPrefactura.id_prefactura;
  mesa.estado_prefactura = 'abierta';
}
```

## Resultado
✅ **Problema resuelto**: Las prefacturas ahora muestran solo los productos de la sesión actual
✅ **Limpieza automática**: Al liberar una mesa se cierran todas las prefacturas abiertas
✅ **Nueva sesión limpia**: Se crea automáticamente una prefactura nueva con fecha actual
✅ **Filtro robusto**: Solo se incluyen ventas desde la fecha de apertura de la prefactura actual

## Prueba Realizada
- **Mesa probada**: Mesa 1 (ID: 32) que tenía 66 ventas históricas
- **Resultado**: Después de la liberación, la nueva prefactura muestra 0 ventas históricas
- **Estado**: ✅ Funcionando correctamente

## Archivos Modificados
- `sistema-pos/vegetarian_restaurant_backend/src/controllers/mesaController.js`
  - Función `liberarMesa`: Mejorada para cerrar todas las prefacturas abiertas
  - Función `generarPrefactura`: Mejorada para usar solo la prefactura más reciente y crear automáticamente si no existe

El sistema ahora garantiza que cada vez que se libere una mesa y se vuelva a abrir, la prefactura estará completamente limpia y solo mostrará los productos de la nueva sesión.
