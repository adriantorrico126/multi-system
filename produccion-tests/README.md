# Pruebas de Header en Producción

Esta carpeta contiene herramientas para debuggear y probar el Header del sistema POS en producción, específicamente para el restaurante ID 10.

## 🎯 Problema Identificado

El Header en producción muestra:
- **"Restaurante"** en lugar del nombre real del restaurante
- **"Sucursal Principal"** en lugar del nombre real de la sucursal
- **Sin información visible del plan**

## 📁 Archivos de Prueba

### 1. `test_header_produccion.js`
Test principal para verificar el Header en producción
- Prueba autenticación de usuario
- Verifica información del restaurante
- Verifica información de sucursal
- Verifica información del plan

### 2. `test_restaurant_data.js`
Test específico para el restaurante ID 10
- Prueba flujo completo de login/refresh
- Verifica datos de BD específicos
- Analiza inconsistencias entre endpoints

### 3. `test_frontend_localStorage.js`
Simula el comportamiento del localStorage en el frontend
- Prueba diferentes escenarios de datos
- Simula problemas de datos corruptos
- Compara con el problema real de producción

### 4. `debug_production_header.sh`
Script shell para debuggear desde línea de comandos
- Prueba endpoints directamente con curl
- Analiza respostas de API
- Compara datos entre diferentes endpoints

## 🚀 Uso

### Instalación
```bash
cd produccion-tests
npm install
```

### Ejecutar Tests

#### Test individual
```bash
npm run test-header
npm run test-restaurant  
npm run test-localstorage
```

#### Todos los tests
```bash
npm run test-all
```

#### Debug desde terminal
```bash
npm run debug-production
```

### Configuración

Antes de ejecutar los tests, actualiza la configuración:

#### 1. En `test_header_produccion.js`:
```javascript
const PRODUCTION_CONFIG = {
    baseURL: 'https://tu-url-real-produccion.com/api/v1', // ← Cambiar URL
    // ...
};

// Cambiar credenciales
const loginData = {
    username: 'usuario_real',  // ← Cambiar usuario
    password: 'password_real'  // ← Cambiar password
};
```

#### 2. En `debug_production_header.sh`:
```bash
API_BASE="https://tu-url-real-produccion.com/api/v1"  # ← Cambiar URL
USERNAME="usuario_real"    # ← Cambiar usuario
PASSWORD="password_real"   # ← Cambiar password
```

## 🔍 Análisis Esperado

### Casos que deberían FALLAR:
1. **Login sin datos de restaurante**
2. **Refresh sin datos de restaurante**
3. **Respuestas API inconsistentes**
4. **Datos corruptos en localStorage**

### Soluciones identificadas:
1. **authController.js**: Incluir datos de restaurante en login y refresh
2. **AuthContext.tsx**: Sincronizar datos correctamente
3. **Header.tsx**: Manejar datos undefined adecuadamente
4. **Sistema de planes**: Verificar endpoints funcionen

## 📊 Reportes

Los tests generan reportes detallados que incluyen:

### Problemas identificados:
- ❌ Datos faltantes en respuestas de API
- ❌ Inconsistencias entre endpoints
- ❌ Datos corruptos en localStorage
- ❌ Timas de sincronización AuthContext

### Recomendaciones:
- ✅ Verificar estructura de respuestas API
- ✅ Implementar refresh automático de datos
- ✅ Añadir logs de debug al frontend
- ✅ Validar datos antes de mostrar en Header

## 🛠️ Pasos para Solucionar

1. **Ejecutar tests** para identificar problemas específicos
2. **Revisar authController.js** en producción
3. **Verificar AuthContext.tsx** en el frontend
4. **Actualizar Header.tsx** si es necesario
5. **Implementar refresco automático** de datos críticos
6. **Validar en producción** que los cambios funcionen

## 🎯 Validación en Producción

Después de aplicar las correcciones:

1. **Login** → Verificar datos de restaurante en respuesta
2. **Refresh** → Verificar consistencia de datos
3. **Header** → Verificar que muestre información correcta
4. **localStorage** → Verificar sincronización automática
5. **Plan system** → Verificar información del plan

## ⚠️ Notas Importantes

- **Credenciales**: No incluyas credenciales reales en el código
- **Variables de entorno**: Usa `.env` para datos sensibles
- **Backup**: Siempre haz backup antes de cambios en producción
- **Testing**: Prueba cambios en local antes de enviar a producción
