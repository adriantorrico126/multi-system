# 🚀 COMANDOS PARA DEPLOY DE MODELOS EN PRODUCCIÓN

## ❌ PROBLEMA:
Todos los endpoints de planes devuelven **500 Internal Server Error** porque faltan estos modelos en producción:

- `planModel.js` → `PlanModel.js` ✅ Ya existe local
- `suscripcionModel.js` → `SuscripcionModel.js` ✅ Ya existe local  
- `contadorUsoModel.js` → `ContadorUsoModel.js` ✅ Ya existe local
- `alertaLimiteModel.js` → `AlertaLimiteModel.js` ✅ Ya existe local

## ✅ SOLUCIÓN:

### PASO 1: Asegurar que todas las rutas apunten correctamente

Verificar que estas rutas estén desplegadas:
```
src/routes/planesRoutes.js
src/routes/suscripcionesRoutes.js  
src/routes/contadoresRoutes.js
src/routes/alertasRoutes.js
```

### PASO 2: Push de todos los modelos

Hacer push de estos archivos:
```
git add sistema-pos/vegetarian_restaurant_backend/src/models/planModel.js
git add sistema-pos/vegetarian_restaurant_backend/src/models/suscripcionModel.js
git add sistema-pos/vegetarian_restaurant_backend/src/models/contadorUsoModel.js  
git add sistema-pos/vegetarian_restaurant_backend/src/models/alertaLimiteModel.js
git commit -m "Add missing model files for production"
git push origin main
```

### PASO 3: Verificar deployment
Después del push, verificar en DigitalOcean que estos archivos estén presentes:
```
/workspace/sistema-pos/vegetarian_restaurant_backend/src/models/
```

## 🔍 VERIFICACIÓN:
Una vez desplegados, estos endpoints deberían funcionar:
- ✅ `GET /api/v1/planes-sistema/restaurante/1/actual`
- ✅ `GET /api/v1/suscripciones-sistema/restaurante/1/activa`
- ✅ `GET /api/v1/contadores-sistema/restaurante/1/actual`
- ✅ `GET /api/v1/alertas-sistema/restaurante/1/resueltas`

Y el Header debería mostrar:
- ✅ Nombre del plan (ej: "Enterprise")
- ✅ Nombre del restaurante
- ✅ Estado de suscripción
