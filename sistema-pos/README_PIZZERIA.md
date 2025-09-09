# 🍕 PIZZERIA IL CAPRICCIO - CREACIÓN EN PRODUCCIÓN

## 📋 INFORMACIÓN DEL RESTAURANTE

**Nombre:** Pizzeria Il Capriccio  
**Dirección:** Av. Ecológica, Cochabamba, Bolivia  
**Ciudad:** Cochabamba  
**Teléfono:** 75998430  

## 👤 ADMINISTRADOR

**Nombre:** Alejandro Padilla Castellón  
**Username:** Alejandro  
**Email:** alejandro05052004@gmail.com  
**Contraseña:** P1ZZ4s1lC4P  

## 🔐 CREDENCIALES DE BASE DE DATOS

**Las credenciales de base de datos se deben configurar a través de variables de entorno y no deben estar en el código fuente.**  

## 🚀 INSTRUCCIONES DE CREACIÓN

### Opción 1: Script Específico (RECOMENDADO)
```bash
# Ejecutar el script específico para Pizzeria Il Capriccio
node crear_pizzeria_il_capriccio.js
```

### Opción 2: Script Interactivo
```bash
# Ejecutar el script interactivo con tus datos
node crear_restaurante_produccion.js
```

## 📦 LO QUE SE CREARÁ

### ✅ Restaurante
- Nombre: Pizzeria Il Capriccio
- Dirección: Av. Ecológica, Cochabamba, Bolivia
- Ciudad: Cochabamba
- Teléfono: 75998430

### ✅ Sucursal Principal
- Nombre: Sucursal Principal
- Ubicación: Cochabamba

### ✅ Usuario Administrador
- Nombre: Alejandro Padilla Castellón
- Username: Alejandro
- Email: alejandro05052004@gmail.com
- Contraseña: P1ZZ4s1lC4P
- Rol: admin

### ✅ Categorías Específicas para Pizzería
1. **Pizzas** - Pizzas tradicionales y especiales
2. **Pastas** - Pastas frescas y salsas caseras
3. **Bebidas** - Bebidas, refrescos y jugos
4. **Postres** - Postres italianos tradicionales
5. **Entradas** - Antipasti y entradas italianas
6. **Ensaladas** - Ensaladas frescas y saludables

### ✅ Mesas
- **15 mesas** creadas
- 10 mesas para 4 personas
- 5 mesas para 6 personas

## 🔍 VERIFICACIÓN

Después de la creación, puedes verificar el estado con:
```bash
node -e "require('./crear_pizzeria_il_capriccio.js').verificarEstadoRestaurante()"
```

## ⚠️ IMPORTANTE

- **Este script se conecta directamente a producción**
- **Los datos se crearán en DigitalOcean**
- **Asegúrate de tener backup antes de ejecutar**
- **Las credenciales están hardcodeadas en el script**

## 🎯 PRÓXIMOS PASOS

1. **Ejecutar el script** de creación
2. **Verificar** que todo se creó correctamente
3. **Acceder al sistema POS** con las credenciales del admin
4. **Configurar productos** específicos de la pizzeria
5. **Probar el sistema** completo

## 📞 SOPORTE

Si encuentras algún problema:
1. Verifica la conexión a DigitalOcean
2. Revisa los logs del script
3. Confirma que las credenciales son correctas
4. Verifica que la base de datos existe

---

**¡La Pizzeria Il Capriccio estará lista para usar en producción!** 🍕✨

