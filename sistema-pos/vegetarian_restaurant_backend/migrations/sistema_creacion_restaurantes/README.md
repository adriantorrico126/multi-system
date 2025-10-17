# 🏢 Sistema Avanzado de Creación de Restaurantes

Sistema completo y robusto para crear nuevos restaurantes en el sistema POS con todas las configuraciones necesarias, validaciones exhaustivas y manejo de errores.

---

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Estructura del Sistema](#-estructura-del-sistema)
- [Instalación](#-instalación)
- [Uso Rápido](#-uso-rápido)
- [Plantillas Disponibles](#-plantillas-disponibles)
- [Creación Personalizada](#-creación-personalizada)
- [Módulos del Sistema](#-módulos-del-sistema)
- [Ejemplos](#-ejemplos)
- [Troubleshooting](#-troubleshooting)

---

## ✨ Características

### ✅ Completo y Robusto
- **Validaciones exhaustivas** en cada paso
- **Manejo de errores** con rollback automático
- **Logs detallados** con colores para mejor visualización
- **Verificación post-creación** para asegurar integridad

### 🎯 Todo Incluido
El sistema crea automáticamente:
- ✅ Restaurante base
- ✅ Sucursal principal
- ✅ Usuario administrador
- ✅ Suscripción y plan
- ✅ Contadores de uso
- ✅ Categorías y productos
- ✅ Mesas
- ✅ Arqueo inicial de caja

### 🎨 Plantillas Predefinidas
- Restaurante Genérico
- Pizzería
- Cafetería
- Comida Rápida
- Restaurante Vegetariano

---

## 📁 Estructura del Sistema

```
sistema_creacion_restaurantes/
├── index.js                    # Sistema principal
├── README.md                   # Este archivo
│
├── modulos/                    # Módulos funcionales
│   ├── restaurante.js         # Creación de restaurante
│   ├── sucursal.js            # Creación de sucursal
│   ├── administrador.js       # Creación de admin
│   ├── suscripcion.js         # Asignación de plan
│   ├── contadores.js          # Contadores de uso
│   ├── productos.js           # Categorías y productos
│   ├── mesas.js               # Creación de mesas
│   ├── arqueo.js              # Arqueo inicial
│   └── verificacion.js        # Verificación final
│
├── plantillas/                 # Plantillas predefinidas
│   └── index.js               # Todas las plantillas
│
├── utils/                      # Utilidades
│   └── logger.js              # Sistema de logs
│
└── ejemplos/                   # Ejemplos de uso
    ├── crear_pizzeria.js      # Ejemplo con plantilla
    └── crear_personalizado.js # Ejemplo personalizado
```

---

## 🚀 Instalación

No requiere instalación adicional, solo asegúrate de tener:

```bash
# Dependencias del proyecto
npm install bcryptjs pg
```

---

## ⚡ Uso Rápido

### 🥇 Opción 1: CLI Interactivo (MÁS FÁCIL - RECOMENDADO)

**El CLI te pide toda la información paso a paso. ¡No necesitas editar código!**

```bash
node cli_interactivo.js
```

O con npm:

```bash
npm start
# o
npm run cli
```

El asistente te guiará por:
1. 📋 Datos del restaurante
2. 🏪 Sucursal principal
3. 👤 Usuario administrador
4. 📦 Plan de suscripción
5. 🪑 Configuración de mesas y productos

**Ver guía completa:** `GUIA_CLI.md`

---

### Opción 2: Usar una Plantilla (Desde Código)

```javascript
const { crearDesdePlantilla } = require('./sistema_creacion_restaurantes');

const datosPersonalizados = {
    restaurante: {
        nombre: 'Mi Pizzería',
        ciudad: 'Cochabamba',
        email: 'contacto@pizzeria.com'
    },
    administrador: {
        nombre: 'Juan Admin',
        username: 'juan',
        email: 'juan@pizzeria.com',
        password: 'Juan123!'
    }
};

crearDesdePlantilla('pizzeria', datosPersonalizados)
    .then(resultado => {
        if (resultado.exitoso) {
            console.log('✅ Restaurante creado!');
        }
    });
```

### Opción 3: Creación Personalizada (Desde Código)

```javascript
const { crearRestauranteCompleto } = require('./sistema_creacion_restaurantes');

const datos = {
    restaurante: {
        nombre: 'Mi Restaurante',
        direccion: 'Av. Principal #123',
        ciudad: 'Cochabamba',
        telefono: '44444444',
        email: 'contacto@restaurant.com'
    },
    sucursal: {
        nombre: 'Sucursal Principal',
        direccion: 'Av. Principal #123',
        ciudad: 'Cochabamba'
    },
    administrador: {
        nombre: 'Admin',
        username: 'admin',
        email: 'admin@restaurant.com',
        password: 'Admin123!'
    },
    plan: { id_plan: 3 }, // Opcional
    productos: [...],      // Opcional
    mesas: { cantidad: 10 } // Opcional
};

crearRestauranteCompleto(datos)
    .then(resultado => {
        if (resultado.exitoso) {
            console.log('✅ Restaurante creado!');
        }
    });
```

---

## 🎨 Plantillas Disponibles

### 1. Restaurante Genérico (`generico`)
- 3 categorías básicas
- 7 productos de ejemplo
- 10 mesas de 4 personas
- Plan Avanzado

### 2. Pizzería (`pizzeria`)
- Categorías: Pizzas, Bebidas, Entradas
- 11 productos
- 15 mesas de 4 personas
- Plan Avanzado

### 3. Cafetería (`cafeteria`)
- Categorías: Cafés, Bebidas Frías, Repostería
- 12 productos
- 8 mesas de 2 personas
- Plan Profesional

### 4. Comida Rápida (`comida_rapida`)
- Categorías: Hamburguesas, Hot Dogs, Complementos, Bebidas
- 10 productos
- 12 mesas de 4 personas
- Plan Avanzado

### 5. Vegetariano (`vegetariano`)
- Categorías: Platos Principales, Sopas, Jugos y Batidos, Postres
- 11 productos
- 10 mesas de 4 personas
- Plan Avanzado

---

## 🛠️ Creación Personalizada

### Datos Requeridos

#### Restaurante (obligatorio)
```javascript
restaurante: {
    nombre: string,      // Nombre del restaurante
    direccion: string,   // Dirección
    ciudad: string,      // Ciudad
    telefono: string,    // Teléfono
    email: string        // Email válido
}
```

#### Sucursal (obligatorio)
```javascript
sucursal: {
    nombre: string,      // Nombre de la sucursal
    direccion: string,   // Dirección
    ciudad: string       // Ciudad
}
```

#### Administrador (obligatorio)
```javascript
administrador: {
    nombre: string,      // Nombre completo
    username: string,    // Username (mín. 3 caracteres)
    email: string,       // Email válido
    password: string     // Contraseña (mín. 6 caracteres)
}
```

#### Plan (opcional)
```javascript
plan: {
    id_plan: number      // 1: Básico, 2: Profesional, 3: Avanzado, 4: Enterprise
}
// Por defecto: Plan Avanzado (3)
```

#### Productos (opcional)
```javascript
productos: [
    {
        categoria: string,  // Nombre de la categoría
        nombre: string,     // Nombre del producto
        precio: number,     // Precio
        stock: number       // Stock inicial
    }
]
// Por defecto: sin productos
```

#### Mesas (opcional)
```javascript
// Opción 1: Cantidad y capacidad por defecto
mesas: {
    cantidad: number,    // Cantidad de mesas
    capacidad: number    // Capacidad por defecto
}

// Opción 2: Mesas personalizadas
mesas: {
    mesas: [
        { numero: 1, capacidad: 2 },
        { numero: 2, capacidad: 4 },
        { numero: 3, capacidad: 6 }
    ]
}
// Por defecto: 10 mesas de 4 personas
```

---

## 🔧 Módulos del Sistema

### 1. Restaurante (`modulos/restaurante.js`)
- Valida datos del restaurante
- Verifica email válido
- Crea registro en tabla `restaurantes`

### 2. Sucursal (`modulos/sucursal.js`)
- Valida datos de la sucursal
- Crea registro en tabla `sucursales`
- Asocia con restaurante

### 3. Administrador (`modulos/administrador.js`)
- Valida datos del administrador
- Verifica username y email únicos
- Encripta contraseña con bcrypt
- Obtiene rol de administrador
- Crea registro en tabla `vendedores`

### 4. Suscripción (`modulos/suscripcion.js`)
- Obtiene información del plan
- Calcula fechas (1 año por defecto)
- Crea registro en tabla `suscripciones`

### 5. Contadores (`modulos/contadores.js`)
- Obtiene límites del plan
- Crea contadores para: usuarios, sucursales, productos, mesas, pedidos, categorías
- Inicializa valores de uso

### 6. Productos (`modulos/productos.js`)
- Agrupa productos por categoría
- Crea categorías únicas
- Crea productos asociados
- Maneja stock inicial

### 7. Mesas (`modulos/mesas.js`)
- Crea mesas estándar o personalizadas
- Configura estado inicial (libre)
- Asocia con sucursal

### 8. Arqueo (`modulos/arqueo.js`)
- Crea arqueo inicial de caja
- Monto inicial en 0
- Estado: abierto

### 9. Verificación (`modulos/verificacion.js`)
- Verifica todos los datos creados
- Genera reporte de integridad
- Identifica advertencias

---

## 📚 Ejemplos

### Ejemplo 1: Crear Pizzería (Plantilla)

```bash
# Ejecutar ejemplo
cd sistema-pos/vegetarian_restaurant_backend/migrations/sistema_creacion_restaurantes
node ejemplos/crear_pizzeria.js
```

### Ejemplo 2: Crear Restaurante Personalizado

```bash
# Ejecutar ejemplo
node ejemplos/crear_personalizado.js
```

### Ejemplo 3: Script Propio

```javascript
// mi_restaurante.js
const { crearRestauranteCompleto } = require('./sistema_creacion_restaurantes');

async function crearMiRestaurante() {
    const datos = {
        restaurante: {
            nombre: 'Sabor Casero',
            direccion: 'Calle Jordán #890',
            ciudad: 'Cochabamba',
            telefono: '44556677',
            email: 'contacto@saborcasero.com'
        },
        sucursal: {
            nombre: 'Sucursal Centro',
            direccion: 'Calle Jordán #890',
            ciudad: 'Cochabamba'
        },
        administrador: {
            nombre: 'María López',
            username: 'maria',
            email: 'maria@saborcasero.com',
            password: 'Maria123!'
        },
        plan: { id_plan: 3 },
        productos: [
            { categoria: 'Comida Casera', nombre: 'Sopa de Maní', precio: 15, stock: 0 },
            { categoria: 'Comida Casera', nombre: 'Sajta de Pollo', precio: 25, stock: 0 },
            { categoria: 'Bebidas', nombre: 'Chicha Morada', precio: 8, stock: 50 }
        ],
        mesas: { cantidad: 12, capacidad: 4 }
    };

    const resultado = await crearRestauranteCompleto(datos);
    
    if (resultado.exitoso) {
        console.log('\n✅ Restaurante creado!');
        console.log(`ID: ${resultado.resultado.restaurante.id_restaurante}`);
    } else {
        console.error('❌ Error:', resultado.error);
    }
    
    process.exit(resultado.exitoso ? 0 : 1);
}

crearMiRestaurante();
```

---

## 🐛 Troubleshooting

### Error: "El username ya está en uso"
- **Causa:** El username ya existe en la base de datos
- **Solución:** Usa un username diferente

### Error: "El email ya está en uso"
- **Causa:** El email ya existe en la base de datos
- **Solución:** Usa un email diferente

### Error: "No se encontró el plan con ID X"
- **Causa:** El plan especificado no existe
- **Solución:** Usa un ID de plan válido (1, 2, 3, o 4)

### Error: "ROLLBACK ejecutado"
- **Causa:** Error durante la creación
- **Solución:** Revisa los logs para identificar el error específico. Todos los cambios se revierten automáticamente.

### Error: "column X does not exist"
- **Causa:** La estructura de la base de datos no coincide
- **Solución:** Verifica que las tablas tengan las columnas correctas

---

## 📊 Verificación Post-Creación

El sistema automáticamente verifica:

✅ Restaurante creado  
✅ Al menos 1 sucursal  
✅ Al menos 1 administrador  
✅ Suscripción activa  
✅ Contadores de uso (mínimo 6)  
✅ Categorías creadas  
✅ Productos creados  
✅ Mesas creadas  
✅ Arqueo inicial abierto  

---

## 🎯 Planes Disponibles

| ID | Plan | Usuarios | Sucursales | Productos | Características |
|---|---|---|---|---|---|
| 1 | Básico | 3 | 1 | 50 | Inventario básico, reportes básicos |
| 2 | Profesional | 10 | 3 | 200 | + Facturación electrónica, reportes avanzados |
| 3 | Avanzado | 25 | 5 | 500 | + Inventario avanzado, modificadores |
| 4 | Enterprise | 100 | 20 | 2000 | + Multi-moneda, API, soporte 24/7 |

---

## 💡 Consejos

1. **Usa plantillas** cuando sea posible para agilizar el proceso
2. **Personaliza solo lo necesario** - las plantillas tienen configuraciones probadas
3. **Verifica los logs** - proporcionan información detallada de cada paso
4. **Revisa la verificación** - asegura que todo se creó correctamente
5. **Guarda las credenciales** - username y password del administrador

---

## 🆘 Soporte

Si encuentras problemas:

1. Revisa los logs del sistema (incluyen detalles del error)
2. Verifica que la base de datos esté corriendo
3. Asegúrate de que las tablas existan
4. Consulta la documentación de cada módulo

---

## 📝 Notas Importantes

- ⚠️ El sistema usa **transacciones** - si algo falla, todo se revierte
- ⚠️ Las **contraseñas se encriptan** automáticamente con bcrypt
- ⚠️ Los **usernames y emails deben ser únicos** en toda la base de datos
- ⚠️ La **suscripción se crea por 1 año** automáticamente
- ⚠️ Los **contadores de uso** se inicializan según el plan seleccionado

---

**Sistema creado por: Menta Resto - POS System**  
**Versión: 1.0.0**  
**Fecha: Octubre 2025**

