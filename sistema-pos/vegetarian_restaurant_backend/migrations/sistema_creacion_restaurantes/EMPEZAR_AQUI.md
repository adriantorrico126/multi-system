# 🚀 ¡EMPEZAR AQUÍ!

## ¿Quieres crear un restaurante AHORA?

### Solo necesitas 2 comandos:

```bash
# 1. Ve a esta carpeta (si no estás ya aquí)
cd sistema-pos/vegetarian_restaurant_backend/migrations/sistema_creacion_restaurantes

# 2. Ejecuta el CLI interactivo
node cli_interactivo.js
```

O más simple aún:

```bash
npm start
```

---

## ¿Qué va a pasar?

1. **Verás un menú** con opciones
2. **Seleccionas "1"** para crear restaurante completo
3. **Respondes preguntas** paso a paso:
   - Nombre del restaurante
   - Ciudad, dirección, email
   - Datos del administrador
   - Plan de suscripción
   - Cantidad de mesas
4. **Confirmas** los datos
5. **¡Listo!** Restaurante creado en < 2 segundos

---

## Ejemplo Visual

```
═══════════════════════════════════════════════════════════════
         🏢 SISTEMA DE CREACIÓN DE RESTAURANTES
═══════════════════════════════════════════════════════════════

Selecciona una opción:

  1. 🚀 Crear restaurante completo (Recomendado)
     → Configuración paso a paso de todo

  2. 🎨 Crear desde plantilla (Rápido)
     → Usa una plantilla predefinida

  3. 📋 Ver plantillas disponibles

  0. ❌ Salir

Tu opción: 1

═══════════════════════════════════════════════════════════════
         🚀 CREACIÓN COMPLETA DE RESTAURANTE
═══════════════════════════════════════════════════════════════

ℹ Te guiaré paso a paso para recopilar toda la información.
ℹ Puedes dejar campos opcionales en blanco presionando ENTER.

Presiona ENTER para comenzar...

📋 PASO 1/5: DATOS DEL RESTAURANTE
───────────────────────────────────────────────────────────────

Nombre del restaurante: Mi Pizzería
Ciudad: Cochabamba
Dirección: Av. Principal #123
Teléfono: 44123456
Email del restaurante: contacto@pizzeria.com

✅ Datos del restaurante registrados

🏪 PASO 2/5: SUCURSAL PRINCIPAL
───────────────────────────────────────────────────────────────

Nombre de la sucursal [Sucursal Principal]: 
¿Usar la misma dirección del restaurante? (s/n) [s]: s
ℹ Usando dirección del restaurante

✅ Datos de la sucursal registrados

👤 PASO 3/5: USUARIO ADMINISTRADOR
───────────────────────────────────────────────────────────────
ℹ Este será el usuario con acceso total al sistema

Nombre completo del administrador: Juan Pérez
Username (para login): juan
Email del administrador: juan@pizzeria.com
Contraseña (mín. 6 caracteres): Juan123!

✅ Usuario administrador configurado

📦 PASO 4/5: PLAN DE SUSCRIPCIÓN
───────────────────────────────────────────────────────────────

Selecciona el plan para el restaurante:

  1. Básico
     → 3 usuarios, 1 sucursal, 50 productos

  2. Profesional
     → 10 usuarios, 3 sucursales, 200 productos
     → Facturación electrónica

  3. Avanzado ⭐ [Recomendado]
     → 25 usuarios, 5 sucursales, 500 productos
     → Inventario avanzado, modificadores de productos

  4. Enterprise
     → 100 usuarios, 20 sucursales, 2000 productos
     → Multi-moneda, API, soporte 24/7

Selecciona plan (1-4) [3]: 3

✅ Plan seleccionado: Avanzado

🪑 PASO 5/5: CONFIGURACIÓN INICIAL
───────────────────────────────────────────────────────────────

MESAS:
Cantidad de mesas [10]: 15
Capacidad por defecto (personas) [4]: 4

PRODUCTOS:

¿Deseas agregar productos ahora? (s/n) [n]: n
ℹ Podrás agregar productos después desde el sistema

✅ Configuración inicial completada

🔍 CONFIRMACIÓN DE DATOS
───────────────────────────────────────────────────────────────

Revisa la información antes de crear el restaurante:

RESTAURANTE:
  Nombre: Mi Pizzería
  Ciudad: Cochabamba
  Email: contacto@pizzeria.com
  Teléfono: 44123456

SUCURSAL:
  Nombre: Sucursal Principal
  Ciudad: Cochabamba

ADMINISTRADOR:
  Nombre: Juan Pérez
  Username: juan
  Email: juan@pizzeria.com

CONFIGURACIÓN:
  Plan: Avanzado
  Mesas: 15 mesas de 4 personas
  Productos: 0 productos

¿Confirmar y crear restaurante? (s/n): s


═══════════════════════════════════════════════════════════════
         🚀 CREANDO RESTAURANTE...
═══════════════════════════════════════════════════════════════

ℹ PASO 1/8 - Creando restaurante base
✅ Restaurante creado: ID 23

[... más pasos ...]

✅ TRANSACCIÓN CONFIRMADA
🔍 VERIFICANDO INTEGRIDAD DE DATOS
✅ VERIFICACIÓN EXITOSA - Todo correcto


═══════════════════════════════════════════════════════════════
         ✅ ¡RESTAURANTE CREADO EXITOSAMENTE!
═══════════════════════════════════════════════════════════════

📊 IDS GENERADOS:
  Restaurante: 23
  Sucursal: 42
  Administrador: 56

🔐 CREDENCIALES DE ACCESO:
  URL: http://localhost:3000
  Usuario: juan
  Contraseña: Juan123!

⏱️  Tiempo: 1.23s

⚠️  ¡IMPORTANTE! Guarda estas credenciales de forma segura
```

---

## ¿Necesitas más información?

### 📚 Documentación disponible:

| Archivo | Para qué sirve |
|---------|---------------|
| **`GUIA_CLI.md`** | Guía completa del CLI interactivo |
| **`INICIO_RAPIDO.md`** | Inicio rápido en 5 minutos |
| **`RESUMEN.md`** | Resumen ejecutivo del sistema |
| **`README.md`** | Documentación técnica completa |

### 📂 Ejemplos de código:

```bash
# Ver ejemplos con código
ls ejemplos/

# Crear pizzería (plantilla)
node ejemplos/crear_pizzeria.js

# Crear personalizado
node ejemplos/crear_personalizado.js
```

---

## 🎯 Preguntas Rápidas

**P: ¿Qué plan debo elegir?**  
R: Para la mayoría de casos, el **Plan Avanzado (3)** es perfecto.

**P: ¿Puedo cancelar si me equivoco?**  
R: Sí, responde "n" en la confirmación final.

**P: ¿Los datos deben ser reales?**  
R: Para testing puedes usar datos ficticios. Para producción usa datos reales.

**P: ¿Qué pasa si hay un error?**  
R: El sistema hace rollback automático - no quedará nada a medias.

**P: ¿Puedo agregar productos después?**  
R: Sí, desde el panel de administración del sistema POS.

---

## ✅ Checklist Pre-inicio

Antes de ejecutar, asegúrate de:

- [ ] Base de datos PostgreSQL corriendo
- [ ] Node.js instalado
- [ ] Estás en la carpeta correcta
- [ ] Tienes los datos listos (nombre, email, etc.)

---

## 🚀 ¡Listo! Ejecuta ahora:

```bash
node cli_interactivo.js
```

o simplemente:

```bash
npm start
```

---

**💡 Tip:** El CLI tiene colores y es muy fácil de usar. No te preocupes, te guiará en cada paso.

**🎉 ¡A crear restaurantes!**





