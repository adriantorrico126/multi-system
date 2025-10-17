# 🎯 Guía del CLI Interactivo

## ⚡ Inicio Rápido

```bash
cd sistema-pos/vegetarian_restaurant_backend/migrations/sistema_creacion_restaurantes
node cli_interactivo.js
```

O con npm:

```bash
npm start
# o
npm run cli
```

---

## 📋 ¿Qué hace el CLI?

El **CLI Interactivo** es un asistente guiado que te solicita **TODA la información necesaria** paso a paso, sin necesidad de editar código. Simplemente responde las preguntas y el sistema creará el restaurante completo.

---

## 🎨 Opciones del Menú Principal

### 1️⃣ Crear Restaurante Completo (Recomendado)

**Flujo completo** que te guía por 5 pasos:

#### **PASO 1: Datos del Restaurante**
- ✅ Nombre (obligatorio)
- ✅ Ciudad (obligatorio)
- ✅ Email (obligatorio, debe ser válido)
- ⭕ Dirección (opcional)
- ⭕ Teléfono (opcional)

#### **PASO 2: Sucursal Principal**
- ✅ Nombre de la sucursal
- ✅ Dirección y ciudad (puede usar la del restaurante)

#### **PASO 3: Usuario Administrador**
- ✅ Nombre completo
- ✅ Username (mínimo 3 caracteres)
- ✅ Email (debe ser válido y único)
- ✅ Contraseña (mínimo 6 caracteres)

#### **PASO 4: Plan de Suscripción**
Selecciona entre:
- **1. Básico** - 3 usuarios, 1 sucursal, 50 productos
- **2. Profesional** - 10 usuarios, 3 sucursales, 200 productos + Facturación
- **3. Avanzado** ⭐ - 25 usuarios, 5 sucursales, 500 productos + Inventario avanzado
- **4. Enterprise** - 100 usuarios, 20 sucursales, 2000 productos + Todo

#### **PASO 5: Configuración Inicial**
- Cantidad de mesas (default: 10)
- Capacidad por mesa (default: 4 personas)
- Opción de agregar productos ahora o después

### 2️⃣ Crear desde Plantilla (Rápido)

Usa una **plantilla predefinida** con productos y configuración lista:

1. **Pizzería** 🍕 - 11 productos, 15 mesas
2. **Cafetería** ☕ - 12 productos, 8 mesas
3. **Comida Rápida** 🍔 - 10 productos, 12 mesas
4. **Vegetariano** 🥗 - 11 productos, 10 mesas
5. **Genérico** 🍽️ - 7 productos, 10 mesas

Solo necesitas personalizar:
- Nombre del restaurante
- Ciudad
- Email
- Datos del administrador

### 3️⃣ Ver Plantillas Disponibles

Muestra información detallada de cada plantilla sin crear nada.

---

## 💡 Ejemplos de Uso

### Ejemplo 1: Crear Pizzería

```
$ node cli_interactivo.js

[Menú Principal]
Tu opción: 2

[Seleccionar plantilla]
Tu opción: 1 (Pizzería)

Nombre del restaurante: Pizzería Don Carlo
Ciudad: Cochabamba
Dirección: Av. Heroínas #567
Teléfono: 44567890
Email: contacto@doncarlo.com

Nombre del administrador: Carlos Pérez
Username: carlos
Email del admin: carlos@doncarlo.com
Contraseña: Carlos123!

¿Crear restaurante? s

✅ ¡RESTAURANTE CREADO EXITOSAMENTE!

🔐 Credenciales:
  Usuario: carlos
  Contraseña: Carlos123!
```

### Ejemplo 2: Crear Restaurante Personalizado

```
$ node cli_interactivo.js

[Menú Principal]
Tu opción: 1

[PASO 1/5: DATOS DEL RESTAURANTE]
Nombre: Mi Restaurante Único
Ciudad: Cochabamba
Dirección: Calle Principal #123
Teléfono: 44123456
Email: contacto@mirestaurante.com

[PASO 2/5: SUCURSAL PRINCIPAL]
Nombre: Sucursal Centro
¿Usar misma dirección? s

[PASO 3/5: USUARIO ADMINISTRADOR]
Nombre: Juan Pérez
Username: juan
Email: juan@mirestaurante.com
Contraseña: Juan123!

[PASO 4/5: PLAN]
Selecciona plan: 3 (Avanzado)

[PASO 5/5: CONFIGURACIÓN]
Cantidad de mesas: 15
Capacidad por defecto: 4
¿Agregar productos ahora? n

[CONFIRMACIÓN]
¿Confirmar? s

✅ ¡RESTAURANTE CREADO EXITOSAMENTE!
```

---

## ✨ Características del CLI

### Validaciones en Tiempo Real
- ✅ Email debe contener @
- ✅ Username mínimo 3 caracteres
- ✅ Contraseña mínimo 6 caracteres
- ✅ Campos obligatorios no pueden estar vacíos

### Valores por Defecto
- Presiona **ENTER** para usar valores por defecto
- Ejemplo: `[Cochabamba]` significa que si no escribes nada, usará "Cochabamba"

### Colores y Símbolos
- 🟦 **Azul** - Información general
- 🟩 **Verde** - Éxito
- 🟨 **Amarillo** - Advertencias
- 🟥 **Rojo** - Errores
- 🔷 **Cyan** - Títulos y secciones

### Confirmación Final
Antes de crear, el CLI muestra un **resumen completo** de todos los datos para que puedas verificar que todo esté correcto.

---

## 🔐 Seguridad

- Las contraseñas se **encriptan automáticamente** con bcrypt
- Se verifica que **username y email sean únicos**
- **No se muestra la contraseña** mientras la escribes (funcionalidad estándar de terminal)

---

## 📊 Lo que se Crea Automáticamente

1. ✅ **Restaurante** - Registro en tabla `restaurantes`
2. ✅ **Sucursal** - Registro en tabla `sucursales`
3. ✅ **Administrador** - Usuario en tabla `vendedores` con rol administrador
4. ✅ **Suscripción** - Plan activo por 1 año
5. ✅ **Contadores** - 6 contadores de uso (usuarios, sucursales, productos, mesas, pedidos, categorías)
6. ✅ **Productos** - Si se agregaron (con sus categorías)
7. ✅ **Mesas** - Cantidad configurada
8. ✅ **Arqueo** - Caja inicial abierta

---

## ❓ Preguntas Frecuentes

### ¿Puedo cancelar en cualquier momento?
Sí, simplemente presiona `Ctrl+C` para salir.

### ¿Qué pasa si me equivoco en un dato?
Responde "n" en la confirmación final y vuelve a empezar. El CLI no guarda nada hasta que confirmes.

### ¿Puedo editar el restaurante después de crearlo?
Sí, desde el panel de administración del sistema POS.

### ¿Qué pasa si hay un error?
El sistema hace **rollback automático** - no quedará nada a medias en la base de datos.

### ¿Puedo agregar más productos después?
Sí, desde el sistema POS una vez creado el restaurante.

### ¿Los datos deben ser reales?
Para testing puedes usar datos ficticios. Para producción usa datos reales del cliente.

---

## 🚨 Errores Comunes

### "El username ya está en uso"
**Causa:** Ya existe un usuario con ese username  
**Solución:** Usa un username diferente

### "El email ya está en uso"
**Causa:** Ya existe un usuario/restaurante con ese email  
**Solución:** Usa un email diferente

### "Error al conectar a la base de datos"
**Causa:** La base de datos no está corriendo  
**Solución:** Inicia PostgreSQL

---

## 💾 Después de Crear

Una vez creado exitosamente, el CLI te mostrará:

```
✅ ¡RESTAURANTE CREADO EXITOSAMENTE!

📊 IDS GENERADOS:
  Restaurante: 23
  Sucursal: 42
  Administrador: 56

🔐 CREDENCIALES DE ACCESO:
  URL: http://localhost:3000
  Usuario: username
  Contraseña: password123

⏱️  Tiempo: 1.23s

⚠️  ¡IMPORTANTE! Guarda estas credenciales de forma segura
```

**GUARDA ESTA INFORMACIÓN** - La necesitarás para acceder al sistema.

---

## 🎯 Consejos

1. **Ten la información lista** antes de empezar (nombre, email, etc.)
2. **Usa emails únicos** para cada restaurante y administrador
3. **Contraseñas seguras** - Mínimo 6 caracteres, combina letras y números
4. **Verifica todo** en la confirmación final antes de crear
5. **Guarda las credenciales** inmediatamente después de crearlas

---

## 🆘 Ayuda

Si necesitas ayuda:

1. Lee la documentación completa: `README.md`
2. Revisa ejemplos: carpeta `ejemplos/`
3. Consulta el resumen: `RESUMEN.md`

---

**¡Listo para empezar!**

```bash
node cli_interactivo.js
```

