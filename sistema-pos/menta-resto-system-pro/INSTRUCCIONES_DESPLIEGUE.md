# 🚀 Instrucciones de Despliegue - Frontend

## 📋 Pre-requisitos

### 1. Variables de Entorno en Vercel

Configurar en **Vercel Dashboard → Settings → Environment Variables:**

```env
VITE_BACKEND_URL=https://api.forkast.vip
VITE_SOCKET_URL=https://api.forkast.vip
VITE_PRINT_SERVER_URL=https://api.forkast.vip
```

**Aplicar a:** Production, Preview y Development

### 2. Configuración del Proyecto en Vercel

- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`
- **Node.js Version:** 18.x

## 🔧 Archivos Modificados

### 1. `vercel.json` (ACTUALIZADO)
- ✅ Añadido `buildCommand` explícito
- ✅ Añadido `outputDirectory`
- ✅ Añadido `framework: "vite"`
- ✅ Eliminada configuración de functions (no necesaria para SPA)

### 2. `vite.config.ts` (ACTUALIZADO)
- ✅ Añadido code splitting con `manualChunks`
- ✅ Optimización del bundle en 4 chunks principales:
  - `vendor` (React core)
  - `radix-ui` (componentes UI)
  - `charts` (Recharts)
  - `utils` (Axios, date-fns, dayjs)

### 3. `.vercelignore` (NUEVO)
- ✅ Excluye archivos innecesarios del despliegue
- ✅ Reduce tiempo de build

## 🎯 Soluciones Implementadas

### Problema #1: Variables de Entorno No Definidas
**Causa:** Vercel no tiene acceso a las variables de entorno locales  
**Solución:** Configurar variables en Vercel Dashboard (ver arriba)

### Problema #2: Bundle Muy Grande (3.2 MB)
**Causa:** Todas las dependencias en un solo archivo  
**Solución:** Code splitting implementado en `vite.config.ts`

### Problema #3: Configuración Ambigua
**Causa:** `vercel.json` no especificaba el framework  
**Solución:** Añadido `"framework": "vite"` y comandos explícitos

## 📊 Mejoras Implementadas

### Antes
```
dist/assets/index-DG4KnTYq.js   3,216.59 kB (580.60 kB gzip)
```

### Después (esperado)
```
dist/assets/vendor-[hash].js     ~800 kB
dist/assets/radix-ui-[hash].js   ~600 kB
dist/assets/charts-[hash].js     ~400 kB
dist/assets/utils-[hash].js      ~300 kB
dist/assets/index-[hash].js      ~1,100 kB
```

### Ventajas
- ✅ Caché más eficiente
- ✅ Carga paralela de chunks
- ✅ Menor tiempo de carga inicial
- ✅ Mejor performance en mobile

## 🚀 Pasos para Desplegar

### Opción A: Desde Vercel Dashboard
1. Ir a **Vercel Dashboard** → Tu proyecto
2. Configurar variables de entorno (ver arriba)
3. Ir a **Deployments** → Click en "Redeploy"
4. Verificar logs de build

### Opción B: Desde Git
1. Hacer commit de los cambios
2. Push a la rama principal
3. Vercel desplegará automáticamente

### Opción C: Desde CLI
```bash
# Instalar Vercel CLI
npm i -g vercel

# Ir a la carpeta del proyecto
cd sistema-pos/menta-resto-system-pro

# Configurar variables de entorno
vercel env add VITE_BACKEND_URL production
# Ingresar: https://api.forkast.vip

vercel env add VITE_SOCKET_URL production
# Ingresar: https://api.forkast.vip

vercel env add VITE_PRINT_SERVER_URL production
# Ingresar: https://api.forkast.vip

# Desplegar
vercel --prod
```

## ✅ Verificación Post-Despliegue

### 1. Verificar Build Logs
```bash
✓ Collecting project source
✓ Installing build dependencies
✓ Building production bundle
✓ Uploading build artifacts
✓ Deployment ready
```

### 2. Verificar Variables de Entorno en Runtime
Abrir DevTools Console en el sitio desplegado:
```javascript
console.log('Backend URL:', import.meta.env.VITE_BACKEND_URL);
```

### 3. Verificar Conectividad con Backend
- Login debe funcionar
- No debe haber errores de CORS
- API calls deben ir a `https://api.forkast.vip`

### 4. Verificar Chunks
En **Network tab** de DevTools:
- Debe cargar múltiples archivos `.js`
- No solo un `index-[hash].js` gigante

## 🐛 Troubleshooting

### Error: "Module not found"
**Causa:** Dependencias no instaladas correctamente  
**Solución:**
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Error: "Out of memory"
**Causa:** Bundle demasiado grande para memoria de Vercel  
**Solución:** Ya implementada con code splitting

### Error: "Cannot connect to backend"
**Causa:** Variables de entorno no configuradas  
**Solución:** Verificar variables en Vercel Dashboard

### Warning: "Some chunks are larger than 500 kB"
**Causa:** Normal con aplicaciones grandes  
**Solución:** Ya optimizado con `manualChunks`

## 📞 Contacto

Si el despliegue sigue fallando, revisar:
1. **Vercel Build Logs** → Copiar error exacto
2. **Network tab** → Verificar requests fallidos
3. **Console** → Verificar errores JavaScript

## 🔄 Próximos Pasos Opcionales

### Optimizaciones Adicionales
1. Implementar lazy loading para rutas
2. Comprimir imágenes con `vite-plugin-imagemin`
3. Usar CDN para assets estáticos
4. Implementar Service Worker para PWA

### Monitoreo
1. Configurar Vercel Analytics
2. Implementar error tracking (Sentry)
3. Configurar alertas de performance










