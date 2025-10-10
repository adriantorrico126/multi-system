# 🎯 CÓMO USAR EL PANEL DE ADMINISTRACIÓN DE TOPPINGS

**Sistema:** SITEMM POS  
**Módulo:** Panel de Toppings  
**Versión:** 3.0.0

---

## 🚀 ACCESO AL PANEL

### 1. Inicia el Sistema

**Terminal 1 - Backend:**
```bash
cd sistema-pos/vegetarian_restaurant_backend
npm start
```

**Terminal 2 - Frontend:**
```bash
cd sistema-pos/menta-resto-system-pro
npm run dev
```

### 2. Abre el POS

Navega a: **http://localhost:5173**

### 3. Haz Login

Usuario con rol **admin**, **gerente** o **super_admin**

### 4. Accede al Panel de Toppings

En el menú principal del POS, verás un nuevo botón:

```
🍕 Toppings
```

Haz clic y serás llevado a: **http://localhost:5173/admin/toppings**

---

## 📋 ESTRUCTURA DEL PANEL

El panel tiene **3 pestañas principales**:

### **Pestaña 1: GRUPOS** 📁

**¿Qué son los grupos?**
Los grupos organizan tus toppings. Por ejemplo:
- "Tamaños" (Personal, Mediana, Familiar)
- "Salsas" (BBQ, Picante, Ajo)
- "Extras" (Queso, Tocino, Aguacate)

**Cómo crear un grupo:**
1. Haz clic en **"Nuevo Grupo"**
2. Llena el formulario:
   - **Nombre:** Ej: "Tamaños"
   - **Tipo de Selección:**
     - **Selección Única (Radio):** Cliente elige 1 opción (ej: tamaño)
     - **Selección Múltiple (Checkbox):** Cliente elige varias (ej: extras)
     - **Cantidad Variable (Input):** Cliente indica cantidad (ej: 2x queso)
   - **Mínimo a Seleccionar:** 0 = opcional, 1+ = obligatorio seleccionar mínimo N
   - **Máximo a Seleccionar:** Dejar vacío = sin límite
   - **¿Es Obligatorio?:** SÍ = cliente DEBE seleccionar algo
3. Clic en **"Crear Grupo"**

**Ejemplo: Grupo de Tamaños**
```
Nombre: Tamaños
Descripción: Elige el tamaño de tu porción
Tipo: Selección Única (Radio)
Mínimo: 1
Máximo: 1
Obligatorio: Sí
```

---

### **Pestaña 2: MODIFICADORES** 🍕

**¿Qué son los modificadores?**
Son los toppings individuales. Por ejemplo:
- "Pizza Personal" (+Bs 0)
- "Pizza Familiar" (+Bs 10)
- "Extra Queso" (+Bs 2)

**Cómo crear un modificador:**
1. Haz clic en **"Nuevo Modificador"**
2. Llena el formulario:
   - **Producto:** Selecciona a qué producto pertenece
   - **Grupo:** (Opcional) Selecciona el grupo
   - **Nombre del Topping:** Ej: "Porción Familiar"
   - **Precio Extra:** Ej: 10.00 (o 0 si es gratis)
   - **Tipo:** Ej: tamaño, salsa, ingrediente
   - **Descripción:** Info adicional
   - **Calorías:** (Opcional)
   - **Controlar Stock:** Activa si quieres control de inventario
   - **Stock Disponible:** Si controlas stock
   - **Opciones nutricionales:**
     - 🥬 Vegetariano
     - 🌱 Vegano
     - 🌾 Contiene Gluten
3. Clic en **"Crear Modificador"**

**Ejemplo: Topping de Tamaño Familiar**
```
Producto: Pizza Margarita
Grupo: Tamaños
Nombre: Familiar (40cm)
Precio Extra: 10
Tipo: tamaño
Descripción: Porción para 4-5 personas
Calorías: 1500
Vegetariano: Sí
```

---

### **Pestaña 3: ASOCIAR A PRODUCTOS** 🔗

**¿Para qué sirve?**
Aquí defines qué grupos estarán disponibles para cada producto.

**Cómo asociar:**
1. **Selecciona un Producto** del dropdown
2. Verás los grupos ya asociados
3. Haz clic en **"Asociar Grupo"**
4. Selecciona el grupo
5. Marca si es **Obligatorio** para este producto
6. Clic en **"Asociar"**

**Ejemplo: Pizza Margarita**
```
Producto seleccionado: Pizza Margarita

Grupos asociados:
✓ Tamaños (Obligatorio)
✓ Masa (Obligatorio)
✓ Ingredientes Extra (Opcional)
✓ Salsas (Opcional)
```

---

## 📝 EJEMPLO COMPLETO PASO A PASO

### Configurar una Pizza desde Cero

#### **PASO 1: Crear Grupos (Pestaña "Grupos")**

1. **Grupo de Tamaños:**
   - Nombre: `Tamaños`
   - Tipo: `Selección Única`
   - Min: `1`, Max: `1`
   - Obligatorio: `Sí`

2. **Grupo de Ingredientes:**
   - Nombre: `Ingredientes Extra`
   - Tipo: `Selección Múltiple`
   - Min: `0`, Max: `5`
   - Obligatorio: `No`

#### **PASO 2: Crear Modificadores (Pestaña "Modificadores")**

1. Selecciona **Producto:** "Pizza Margarita"

2. Crea modificadores del grupo "Tamaños":
   - `Personal (25cm)` - Precio: `0` - Grupo: `Tamaños`
   - `Mediana (30cm)` - Precio: `5` - Grupo: `Tamaños`
   - `Familiar (40cm)` - Precio: `10` - Grupo: `Tamaños`

3. Crea modificadores del grupo "Ingredientes":
   - `Champiñones` - Precio: `2` - Grupo: `Ingredientes Extra`
   - `Aceitunas` - Precio: `1.5` - Grupo: `Ingredientes Extra`
   - `Pimientos` - Precio: `1.5` - Grupo: `Ingredientes Extra`

#### **PASO 3: Asociar Grupos al Producto (Pestaña "Asociar a Productos")**

1. Selecciona **Producto:** "Pizza Margarita"

2. Asocia grupos:
   - Grupo `Tamaños` → Marcar **Obligatorio** ✓
   - Grupo `Ingredientes Extra` → **NO** marcar obligatorio

#### **PASO 4: Probar en el POS**

1. Ve a la pestaña **POS** o **Productos**
2. Busca "Pizza Margarita"
3. Haz clic en el botón **"Editar" (✏️)**
4. Verás el modal con:
   ```
   Tamaños * (Selecciona 1)
   ○ Personal (25cm) - Gratis
   ○ Mediana (30cm) - +Bs 5.00
   ○ Familiar (40cm) - +Bs 10.00
   
   Ingredientes Extra (Máx. 5)
   ☐ Champiñones - +Bs 2.00
   ☐ Aceitunas - +Bs 1.50
   ☐ Pimientos - +Bs 1.50
   ```
5. Selecciona opciones
6. Agrega al carrito
7. **¡Listo!** El producto se agrega con los toppings

---

## 🎨 CAPTURAS DEL PANEL

### Pestaña de Grupos
```
┌─────────────────────────────────────────────────────┐
│ Grupos de Toppings                [Nuevo Grupo]     │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Nombre      │ Tipo      │ Min/Max │ Obligat. │ Acc │
│ ─────────────────────────────────────────────────  │
│ Tamaños     │ Única     │ 1-1     │ SÍ       │ ✎ 🗑 │
│ Ingredientes│ Múltiple  │ 0-5     │ NO       │ ✎ 🗑 │
│ Salsas      │ Múltiple  │ 0-3     │ NO       │ ✎ 🗑 │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Pestaña de Modificadores
```
┌─────────────────────────────────────────────────────┐
│ Modificadores/Toppings       [Nuevo Modificador]    │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Ver Modificadores por Producto                      │
│ [ Selecciona un producto ▼ ]                       │
│                                                     │
│ Pizza Margarita                                     │
│ ───────────────────────────────────────────────    │
│ Personal (25cm)     │ Bs 0   │ tamaño    │ 🗑      │
│ Mediana (30cm)      │ Bs 5   │ tamaño    │ 🗑      │
│ Familiar (40cm)     │ Bs 10  │ tamaño    │ 🗑      │
│ Champiñones         │ Bs 2   │ extra     │ 🗑      │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 💡 TIPS Y MEJORES PRÁCTICAS

### ✅ Organización de Grupos

**Para Pizzas:**
1. Tamaños (obligatorio)
2. Masa (obligatorio)
3. Ingredientes (opcional, max 5)
4. Salsas (opcional, max 3)

**Para Hamburguesas:**
1. Punto de cocción (obligatorio)
2. Pan (obligatorio)
3. Extras (opcional, max 5)

**Para Bebidas:**
1. Tamaño (obligatorio)
2. Hielo (opcional)

### ✅ Nomenclatura Clara

**Buenos nombres:**
- ✓ "Personal (25cm)" - Incluye medida
- ✓ "Extra Queso (doble)" - Descriptivo
- ✓ "Salsa BBQ" - Claro

**Malos nombres:**
- ✗ "Opción 1"
- ✗ "Grande"
- ✗ "Extra"

### ✅ Control de Stock

Activa **"Controlar Stock"** solo para:
- Ingredientes perecederos
- Ingredientes limitados
- Ingredientes costosos

NO actives para:
- Tamaños
- Puntos de cocción
- Opciones virtuales

---

## 🔍 VISUALIZACIÓN EN EL POS

### Cuando el Cliente Ve el Modal:

```
┌───────────────────────────────────────────────┐
│ Personaliza tu pedido                         │
│ Pizza Margarita                               │
├───────────────────────────────────────────────┤
│                                               │
│ 🍕 Tamaños * (Selecciona 1)                  │
│                                               │
│ ┌─────────────────────────────────────────┐   │
│ │ ○ Personal (25cm)               Gratis  │   │
│ │   Para 1 persona                        │   │
│ └─────────────────────────────────────────┘   │
│                                               │
│ ┌─────────────────────────────────────────┐   │
│ │ ● Mediana (30cm)              +Bs 5.00  │   │
│ │   Para 2 personas                       │   │
│ └─────────────────────────────────────────┘   │
│                                               │
│ ──────────────────────────────────────────   │
│                                               │
│ 🧀 Ingredientes Extra (Máx. 5)               │
│                                               │
│ ┌─────────────────────────────────────────┐   │
│ │ ☑ Champiñones             +Bs 2.00      │   │
│ │   Frescos   [50 kcal] 🥬 Vegetariano    │   │
│ └─────────────────────────────────────────┘   │
│                                               │
│ ┌─────────────────────────────────────────┐   │
│ │ ☐ Aceitunas               +Bs 1.50      │   │
│ │   Negras   [20 kcal]                    │   │
│ └─────────────────────────────────────────┘   │
│                                               │
│ ──────────────────────────────────────────   │
│                                               │
│ 📝 Notas: Bien cocida                        │
│                                               │
│ ┌────────── Resumen ──────────┐             │
│ │ Pizza Margarita      Bs 45  │             │
│ │ + Mediana            Bs 5   │             │
│ │ + Champiñones        Bs 2   │             │
│ │ ────────────────────────────│             │
│ │ TOTAL               Bs 52   │             │
│ └─────────────────────────────┘             │
│                                               │
│ [Cancelar] [Agregar - Bs 52.00]             │
└───────────────────────────────────────────────┘
```

---

## ⚡ FLUJO RÁPIDO: CONFIGURAR PRODUCTO EN 3 MINUTOS

### Ejemplo: Configurar Hamburguesa

#### **Minuto 1: Crear Grupos**
1. Ve a pestaña **"Grupos"**
2. Clic en **"Nuevo Grupo"**
3. Crea:
   - Grupo: `Punto de Cocción` (único, obligatorio)
   - Grupo: `Extras` (múltiple, max 5, opcional)

#### **Minuto 2: Crear Modificadores**
1. Ve a pestaña **"Modificadores"**
2. Selecciona **Producto:** "Hamburguesa"
3. Crea para "Punto de Cocción":
   - `Término Medio` (Bs 0)
   - `Bien Cocida` (Bs 0)
   - `Jugosa` (Bs 0)
4. Crea para "Extras":
   - `Queso Extra` (Bs 2)
   - `Tocino` (Bs 3)
   - `Aguacate` (Bs 2.5)

#### **Minuto 3: Asociar al Producto**
1. Ve a pestaña **"Asociar a Productos"**
2. Selecciona **Producto:** "Hamburguesa"
3. Asocia:
   - Grupo `Punto de Cocción` → Marcar **Obligatorio**
   - Grupo `Extras` → No marcar obligatorio

**¡Listo!** Tu hamburguesa ya tiene toppings configurados.

---

## 🎯 CASOS DE USO COMUNES

### Caso 1: Producto con Solo Tamaños
**Ejemplo:** Bebidas, Porciones

**Configuración:**
- 1 grupo: "Tamaños" (único, obligatorio)
- Modificadores: Pequeño, Mediano, Grande

### Caso 2: Producto con Extras Opcionales
**Ejemplo:** Café, Ensalada

**Configuración:**
- 1 grupo: "Extras" (múltiple, opcional)
- Modificadores: Leche, Azúcar, Crema, etc.

### Caso 3: Producto Completamente Personalizable
**Ejemplo:** Pizza, Hamburguesa Premium

**Configuración:**
- 3-4 grupos con obligatorios y opcionales
- 10-20 modificadores en total

---

## ⚙️ CARACTERÍSTICAS AVANZADAS

### Control de Stock

Si activas **"Controlar Stock"** en un modificador:
- El sistema verificará disponibilidad antes de vender
- Cuando se vende, el stock se reduce automáticamente
- Si se agota, se marca como **"Sin stock"** y se deshabilita en el modal

**Ejemplo:**
```
Modificador: Champiñones
Controlar Stock: ✓ Sí
Stock Disponible: 50

Cuando un cliente lo selecciona:
Stock Disponible: 49 (automático)

Cuando llega a 0:
Estado: ❌ Sin stock (deshabilitado)
```

### Información Nutricional

Marca las características para que el cliente las vea:
- ✓ **Vegetariano** → Muestra badge 🥬
- ✓ **Vegano** → Muestra badge 🌱
- ✓ **Sin Gluten** → Muestra badge
- ✓ **Calorías** → Muestra info

### Alérgenos

Aunque el formulario actual no tiene campo de alérgenos visible, puedes agregarlos via API:
```javascript
alergenos: ['lacteos', 'nueces', 'mariscos']
```

Se mostrarán como: ⚠️ Contiene: lacteos, nueces, mariscos

---

## 🧪 PROBAR TU CONFIGURACIÓN

### Método Rápido

1. Configura un producto (siguiendo los pasos arriba)
2. Ve al **POS** principal
3. Busca el producto configurado
4. Haz clic en **"Editar" (✏️)**
5. ¡Deberías ver tu configuración!

---

## 🔧 TROUBLESHOOTING

### No veo el botón "Toppings" en el menú
**Causa:** Tu usuario no es admin/gerente  
**Solución:** Haz login con un usuario admin

### Los modificadores no aparecen en el modal
**Causa:** No has asociado el grupo al producto  
**Solución:** Ve a pestaña "Asociar a Productos" y asocia el grupo

### El modal no se abre
**Causa:** Producto sin grupos configurados  
**Solución:** Se abrirá el modal simple (legacy) - configura grupos para el modal profesional

### Stock no se descuenta
**Causa:** "Controlar Stock" está desactivado  
**Solución:** Edita el modificador y activa el control de stock

---

## 📊 VER ESTADÍSTICAS

El sistema ya tiene endpoints para ver:
- Modificadores más vendidos
- Ingresos por topping
- Stock bajo

(Panel de estadísticas visual por implementar)

---

## 🎉 ¡LISTO PARA USAR!

El panel de administración te permite gestionar **VISUALMENTE** todos los toppings sin tocar código o SQL.

**Ruta del panel:** http://localhost:5173/admin/toppings

**Acceso:** Solo admin, gerente o super_admin

**Estado:** ✅ 100% Funcional

---

¿Tienes dudas? Revisa `SISTEMA_TOPPINGS_PROFESIONAL.md` para documentación técnica completa.

