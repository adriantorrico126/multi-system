# 🏪 Creador de Nuevo Restaurante

## 📋 Descripción
Script para crear un nuevo restaurante completo en la base de datos de producción, incluyendo todos los datos básicos necesarios.

## 🚀 Cómo Usar

### Paso 1: Configurar los Datos
```bash
# Copiar la plantilla
cp datos_restaurante_template.js datos_restaurante.js

# Editar los datos (usar tu editor favorito)
nano datos_restaurante.js
# o
code datos_restaurante.js
```

### Paso 2: Modificar los Datos
Edita el archivo `datos_restaurante.js` y cambia:

```javascript
module.exports = {
    restaurante: {
        nombre: 'Tu Restaurante',              // ⚠️ CAMBIAR
        direccion: 'Tu Dirección',             // ⚠️ CAMBIAR
        ciudad: 'Tu Ciudad',                   // ⚠️ CAMBIAR
        telefono: '+591 123456789',            // ⚠️ CAMBIAR
        email: 'contacto@turestaurante.com'   // ⚠️ CAMBIAR
    },
    
    sucursal: {
        nombre: 'Sucursal Principal',          // ⚠️ CAMBIAR
        direccion: 'Dirección de Sucursal',    // ⚠️ CAMBIAR
        ciudad: 'Ciudad de Sucursal',          // ⚠️ CAMBIAR
        telefono: '+591 123456789'            // ⚠️ CAMBIAR
    },
    
    admin: {
        nombre: 'Tu Nombre',                   // ⚠️ CAMBIAR
        username: 'tu_usuario',                // ⚠️ CAMBIAR
        email: 'admin@turestaurante.com',      // ⚠️ CAMBIAR
        password: 'tu_password_seguro',        // ⚠️ CAMBIAR
        telefono: '+591 123456789'            // ⚠️ CAMBIAR
    }
};
```

### Paso 3: Ejecutar el Script
```bash
node crear_nuevo_restaurante.js
```

## ✅ Lo que se Crea Automáticamente

### 🏢 Restaurante
- ✅ Información básica del restaurante
- ✅ Configuración de contacto

### 🏪 Sucursal Principal
- ✅ Primera sucursal del restaurante
- ✅ Configuración de ubicación

### 👤 Usuario Administrador
- ✅ Usuario con rol de administrador
- ✅ Password encriptado automáticamente
- ✅ Acceso completo al sistema

### 💳 Métodos de Pago
- ✅ Efectivo
- ✅ Pago Móvil
- ✅ Tarjeta de Débito
- ✅ Tarjeta de Crédito

### 📂 Categorías Básicas
- ✅ Bebidas
- ✅ Platos Principales
- ✅ Postres
- ✅ Entradas

### 🪑 Mesas
- ✅ 10 mesas numeradas (1-10)
- ✅ Capacidad: 4 personas cada una
- ✅ Todas activas por defecto

## 🔐 Credenciales de Acceso

Después de ejecutar el script, tendrás acceso con:
- **Username:** El que configuraste en `admin.username`
- **Password:** El que configuraste en `admin.password`

## 🚨 Importante

### ⚠️ Seguridad
- Cambia la contraseña después del primer login
- Usa contraseñas seguras
- No compartas las credenciales

### ⚠️ Base de Datos
- Este script modifica la base de datos de **PRODUCCIÓN**
- Asegúrate de que los datos sean correctos antes de ejecutar
- No ejecutes el script múltiples veces con los mismos datos

## 🛠️ Solución de Problemas

### Error: "No se encontró archivo datos_restaurante.js"
- **Solución:** Copia `datos_restaurante_template.js` a `datos_restaurante.js`

### Error: "Restaurante ya existe"
- **Solución:** Cambia el nombre del restaurante en `datos_restaurante.js`

### Error: "Username ya existe"
- **Solución:** Cambia el username en `datos_restaurante.js`

## 📞 Soporte
Si tienes problemas, verifica:
1. Que todos los campos estén completos
2. Que no haya caracteres especiales problemáticos
3. Que las credenciales de la base de datos sean correctas
