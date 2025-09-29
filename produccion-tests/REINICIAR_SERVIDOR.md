# 🔄 REINICIAR SERVIDOR EN PRODUCCIÓN

## 📋 **DIAGNÓSTICO:**

Los endpoints siguen fallando porque **el servidor necesita reiniciarse** para cargar:
- ✅ Los cambios en `ContadorUsoModel.js` (configuración SSL)
- ✅ Los cambios en todos los modelos para producción

## 🎯 **PASOS PARA REINICIAR:**

### **1. Opción DigitalOcean Web:**
1. Ir a **DigitalOcean Dashboard**
2. Seleccionar tu droplet/servidor
3. Ir a **Power Actions** → **Restart**

### **2. Opción SSH (Recomendado):**
```bash
# Conectar por SSH
ssh root@tu-servidor-ip

# Ir al directorio del proyecto
cd /path/to/vegetarian_restaurant_backend

# Matar procesos Node.js existentes
pkill -f node

# Reiniciar el backend
npm start &

# Verificar logs
tail -f /var/log/pm2/backend.log
# O si usa systemd
journalctl -u forkast-backend -f
```

### **3. Opción PM2 (Si usa PM2):**
```bash
ssh root@tu-servidor-ip
pm2 restart all
pm2 logs --tail=50
```

## ✅ **VERIFICAR DESPUÉS DEL REINICIO:**

1. **Cargar la app** en el navegador
2. **Verificar en consola** que ya no haya:
   - 404 en `/api/v1/contadores-sistema/restaurante/1/actual`
   - 500 en `/api/v1/planes-sistema/restaurante/1/actual`
3. **Confirmar** que `planInfo` ya no sea `null`
4. **Verificar** que el Header muestre "Enterprise" y "Activa"

## 🔍 **EXPECTATIVAS:**

Después del reinicio, deberías ver en consola:
```
✅ /api/v1/contadores-sistema/restaurante/1/actual → 200 OK
✅ /api/v1/planes-sistema/restaurante/1/actual → 200 OK
✅ planInfo: {id: 4, nombre: "Enterprise", ...}
✅ "Acceso a pedidos (orders): true"
```

