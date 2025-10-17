# 🚀 Inicio Rápido - Sistema de Creación de Restaurantes

Esta guía te ayudará a crear un nuevo restaurante en **menos de 5 minutos**.

---

## 📋 Prerequisitos

✅ Base de datos PostgreSQL corriendo  
✅ Node.js instalado  
✅ Dependencias del proyecto instaladas (`npm install`)

---

## 🥇 Opción 1: CLI Interactivo (MÁS FÁCIL - RECOMENDADO)

### El método más simple - Sin editar código

```bash
# Paso 1: Ve a la carpeta
cd sistema-pos/vegetarian_restaurant_backend/migrations/sistema_creacion_restaurantes

# Paso 2: Ejecuta el CLI
node cli_interactivo.js

# O con npm
npm start
```

### ¿Qué hace?

El CLI te hace preguntas paso a paso y tú solo respondes:

1. **Datos del restaurante** (nombre, ciudad, email, etc.)
2. **Sucursal principal** (nombre, dirección)
3. **Usuario administrador** (nombre, username, contraseña)
4. **Plan de suscripción** (Básico, Profesional, Avanzado, Enterprise)
5. **Configuración** (mesas, productos opcionales)

### Ejemplo de uso:

```
Tu opción: 1

[PASO 1/5: DATOS DEL RESTAURANTE]
Nombre del restaurante: Mi Pizzería
Ciudad: Cochabamba
Dirección: Av. Principal #123
Teléfono: 44123456
Email: contacto@pizzeria.com

[PASO 2/5: SUCURSAL PRINCIPAL]
Nombre: Sucursal Centro
¿Usar misma dirección? s

[PASO 3/5: USUARIO ADMINISTRADOR]
Nombre: Juan Admin
Username: juan
Email: juan@pizzeria.com
Contraseña: Juan123!

[PASO 4/5: PLAN]
Selecciona plan (1-4): 3

[PASO 5/5: CONFIGURACIÓN]
Cantidad de mesas: 15
Capacidad por defecto: 4
¿Agregar productos ahora? n

¿Confirmar? s

✅ ¡RESTAURANTE CREADO EXITOSAMENTE!

🔐 Credenciales:
  Usuario: juan
  Contraseña: Juan123!
```

**📖 Guía completa del CLI:** Lee `GUIA_CLI.md`

---

## ⚡ Opción 2: Usar Plantilla (RÁPIDO - Desde código)

### Paso 1: Navega a la carpeta

```bash
cd sistema-pos/vegetarian_restaurant_backend/migrations/sistema_creacion_restaurantes
```

### Paso 2: Crea tu archivo de creación

```bash
# Copia el ejemplo
cp ejemplos/crear_pizzeria.js crear_mi_restaurante.js
```

### Paso 3: Edita el archivo

```javascript
// crear_mi_restaurante.js
const { crearDesdePlantilla } = require('./index');

async function main() {
    const datosPersonalizados = {
        restaurante: {
            nombre: 'TU NOMBRE AQUÍ',        // ⬅️ Cambiar
            ciudad: 'Cochabamba',             // ⬅️ Cambiar si es necesario
            telefono: '44123456',             // ⬅️ Cambiar
            email: 'contacto@turestaurante.com' // ⬅️ Cambiar
        },
        administrador: {
            nombre: 'Tu Nombre',              // ⬅️ Cambiar
            username: 'admin',                // ⬅️ Cambiar
            email: 'admin@turestaurante.com', // ⬅️ Cambiar
            password: 'Admin123!'             // ⬅️ Cambiar
        }
    };
    
    // Plantillas disponibles: 'generico', 'pizzeria', 'cafeteria', 'comida_rapida', 'vegetariano'
    const resultado = await crearDesdePlantilla('pizzeria', datosPersonalizados); // ⬅️ Cambiar tipo si quieres
    
    if (resultado.exitoso) {
        console.log('\n✅ ¡Restaurante creado!');
        console.log(`Usuario: ${datosPersonalizados.administrador.username}`);
        console.log(`Contraseña: ${datosPersonalizados.administrador.password}`);
    }
    
    process.exit(resultado.exitoso ? 0 : 1);
}

main();
```

### Paso 4: Ejecuta

```bash
node crear_mi_restaurante.js
```

### Paso 5: ¡Listo! 🎉

Verás un output como este:

```
═══════════════════════════════════════════════════════════════
🚀 INICIANDO CREACIÓN DE NUEVO RESTAURANTE
═══════════════════════════════════════════════════════════════
📋 Restaurante: TU NOMBRE AQUÍ
🏢 Tipo: pizzeria
🌍 Entorno: local
───────────────────────────────────────────────────────────────
✅ Transacción iniciada

[PASO 1/8] Creando restaurante base
✅ Restaurante creado: ID 23

[PASO 2/8] Creando sucursal principal
✅ Sucursal creada: ID 42

... (más pasos)

✨ CREACIÓN COMPLETADA EXITOSAMENTE
═══════════════════════════════════════════════════════════════
📊 RESUMEN:
   🏢 Restaurante: TU NOMBRE AQUÍ (ID: 23)
   🏪 Sucursal: Sucursal Principal (ID: 42)
   👤 Admin: admin (ID: 56)
   📦 Plan: Avanzado (ID: 3)
   📁 Categorías: 3
   🍕 Productos: 11
   🪑 Mesas: 15
   ⏱️  Tiempo: 1.23s
═══════════════════════════════════════════════════════════════
```

---

## 🎨 Plantillas Disponibles

### `'pizzeria'`
- 3 categorías: Pizzas, Bebidas, Entradas
- 11 productos
- 15 mesas

### `'cafeteria'`
- 3 categorías: Cafés, Bebidas Frías, Repostería
- 12 productos
- 8 mesas

### `'comida_rapida'`
- 4 categorías: Hamburguesas, Hot Dogs, Complementos, Bebidas
- 10 productos
- 12 mesas

### `'vegetariano'`
- 4 categorías: Platos Principales, Sopas, Jugos, Postres
- 11 productos
- 10 mesas

### `'generico'`
- 3 categorías básicas
- 7 productos
- 10 mesas

---

## 🛠️ Opción 2: Creación Completamente Personalizada

Si necesitas control total, usa el ejemplo personalizado:

```bash
cp ejemplos/crear_personalizado.js crear_mi_restaurante_custom.js
# Edita el archivo y personaliza TODO
node crear_mi_restaurante_custom.js
```

---

## ❓ FAQ Rápido

### ¿Qué plan se asigna por defecto?
**Plan Avanzado (ID: 3)** - Puedes cambiarlo en `plan: { id_plan: 2 }`

### ¿Puedo cambiar los productos después?
**Sí**, desde el sistema POS una vez creado el restaurante.

### ¿Qué pasa si hay un error?
El sistema hace **ROLLBACK automático** - no quedará nada a medias.

### ¿Puedo usar esto en producción?
**Sí**, solo asegúrate de configurar las credenciales de BD correctas.

---

## 📝 Checklist de Datos

Antes de ejecutar, asegúrate de tener:

- [ ] Nombre del restaurante
- [ ] Email único del restaurante
- [ ] Username único del administrador
- [ ] Email único del administrador
- [ ] Contraseña segura (mín. 6 caracteres)
- [ ] Teléfono del restaurante
- [ ] Dirección y ciudad

---

## 🎯 Siguiente Paso

Una vez creado el restaurante:

1. Inicia el sistema POS
2. Accede con el username y password que configuraste
3. ¡Comienza a personalizar tu restaurante!

---

**¿Necesitas ayuda?** Revisa el archivo `README.md` completo para documentación detallada.

