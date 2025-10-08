# 🚀 Deploy Urgente a Producción - Permisos de Cajero

## ⚠️ **Problema Crítico en Producción**

Los cajeros NO pueden:
- ❌ Cerrar caja (error 403)
- ❌ Cancelar pedidos (error 403)

**Causa**: Faltan permisos de rol `cajero` en las rutas del backend de producción.

---

## ✅ **Correcciones Aplicadas**

### **Archivo**: `src/routes/ventaRoutes.js`

#### **1. Ruta de Arqueo (Línea 26)**
**Antes**:
```javascript
router.get('/arqueo', authenticateToken, authorizeRoles('admin', 'super_admin'), ...)
```

**Después**:
```javascript
router.get('/arqueo', authenticateToken, authorizeRoles('admin', 'cajero', 'super_admin'), ...)
```

#### **2. Ruta de Estado de Venta (Línea 17)**
**Antes**:
```javascript
router.patch('/:id/estado', authenticateToken, authorizeRoles('cocinero', 'admin', 'super_admin'), ...)
```

**Después**:
```javascript
router.patch('/:id/estado', authenticateToken, authorizeRoles('cocinero', 'admin', 'cajero', 'super_admin'), ...)
```

---

## 🚀 **Pasos para Deploy en Producción**

### **Opción 1: Deploy Automático (Git)**

```bash
# 1. Commit los cambios
git add src/routes/ventaRoutes.js
git commit -m "fix: agregar permisos de cajero para arqueo y cancelar pedidos"

# 2. Push a producción
git push origin main  # o la rama que uses

# 3. En el servidor de producción:
cd /ruta/del/proyecto
git pull origin main
pm2 restart api  # o el nombre de tu proceso
```

### **Opción 2: Deploy Manual (FTP/SSH)**

```bash
# 1. Subir el archivo modificado al servidor:
#    - src/routes/ventaRoutes.js

# 2. Conectarse al servidor por SSH
ssh usuario@api.forkast.vip

# 3. Navegar al proyecto
cd /ruta/del/proyecto

# 4. Reiniciar el servicio
pm2 restart api  # o
systemctl restart tu-servicio  # según tu configuración
```

### **Opción 3: DigitalOcean App Platform**

```bash
# 1. Commit y push
git add src/routes/ventaRoutes.js
git commit -m "fix: agregar permisos de cajero"
git push origin main

# 2. DigitalOcean detectará automáticamente el cambio
#    y desplegará la nueva versión
#    (o puedes forzar desde el panel)
```

---

## 🔧 **Verificación Post-Deploy**

### **1. Verificar que el servidor esté corriendo**
```bash
# En el servidor
pm2 status  # o
systemctl status tu-servicio
```

### **2. Probar los endpoints**
```bash
# Probar arqueo (debe dar 200, no 403)
curl -H "Authorization: Bearer TOKEN_CAJERO" \
  https://api.forkast.vip/api/v1/ventas/arqueo?startDate=2025-10-08&endDate=2025-10-08&id_restaurante=1&sucursal=4

# Probar cancelar pedido (debe dar 200, no 403)
curl -X PATCH -H "Authorization: Bearer TOKEN_CAJERO" \
  https://api.forkast.vip/api/v1/ventas/562/estado?id_restaurante=1 \
  -d '{"estado":"cancelado"}'
```

### **3. Verificar en la aplicación**
1. Iniciar sesión como **cajero**
2. Intentar **cerrar caja** → Debe funcionar ✅
3. Intentar **cancelar un pedido** → Debe funcionar ✅

---

## 📊 **Endpoints Corregidos**

| Endpoint | Método | Roles Antes | Roles Después | Estado |
|----------|--------|-------------|---------------|--------|
| `/ventas/arqueo` | GET | admin, super_admin | admin, **cajero**, super_admin | ✅ |
| `/ventas/:id/estado` | PATCH | cocinero, admin, super_admin | cocinero, admin, **cajero**, super_admin | ✅ |

---

## ⚡ **Deploy Rápido (Recomendado)**

Si tienes acceso SSH al servidor:

```bash
# 1. Conectarse
ssh usuario@api.forkast.vip

# 2. Ir al proyecto
cd /ruta/del/backend

# 3. Hacer backup
cp src/routes/ventaRoutes.js src/routes/ventaRoutes.js.backup

# 4. Editar el archivo directamente (usando nano o vim)
nano src/routes/ventaRoutes.js

# 5. Buscar las líneas y agregar 'cajero' a los roles
#    Línea ~17: authorizeRoles('cocinero', 'admin', 'cajero', 'super_admin')
#    Línea ~26: authorizeRoles('admin', 'cajero', 'super_admin')

# 6. Guardar (Ctrl+O, Enter, Ctrl+X)

# 7. Reiniciar
pm2 restart api
```

---

## 🎯 **Checklist**

- [ ] Cambios aplicados en `ventaRoutes.js`
- [ ] Código commiteado (si usas Git)
- [ ] Push a repositorio (si usas Git)
- [ ] Deploy ejecutado en servidor
- [ ] Servidor reiniciado
- [ ] Probado: Cajero puede cerrar caja
- [ ] Probado: Cajero puede cancelar pedidos
- [ ] Sin errores 403 en consola

---

## 🆘 **Si Algo Sale Mal**

### **Restaurar Backup**
```bash
# Si guardaste backup
cp src/routes/ventaRoutes.js.backup src/routes/ventaRoutes.js
pm2 restart api
```

### **Ver Logs**
```bash
# Ver logs en tiempo real
pm2 logs api

# O si usas systemctl
journalctl -u tu-servicio -f
```

---

**⏱️ Tiempo estimado de deploy: 2-5 minutos**

**¡URGENTE! Despliega estos cambios lo antes posible para que los cajeros puedan trabajar.**

