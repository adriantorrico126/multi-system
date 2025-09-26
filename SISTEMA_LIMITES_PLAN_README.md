# Sistema de Límites de Plan - Guía de Uso

## 📋 Descripción

Este sistema implementa mensajes profesionales y elegantes cuando los usuarios intentan acceder a funcionalidades que no están incluidas en su plan actual. Incluye información de contacto y opciones de actualización.

## 🎯 Características

### ✅ Backend (Node.js/Express)
- **Mensajes profesionales** con información detallada
- **Información de contacto** incluida automáticamente
- **Códigos de error específicos** para diferentes tipos de restricciones
- **Datos de uso actual** vs límites del plan

### ✅ Frontend (React)
- **Modal elegante** con diseño profesional
- **Comparación de planes** visual
- **Botones de contacto directo** (teléfono y email)
- **Información de uso** en tiempo real

## 🚀 Componentes Principales

### 1. PlanLimitErrorHandler
Modal profesional que se muestra cuando se excede un límite de plan.

```jsx
import PlanLimitErrorHandler from '@/components/PlanLimitErrorHandler';

<PlanLimitErrorHandler
  error={planLimitError}
  onClose={hidePlanError}
/>
```

### 2. PlanGate
Componente wrapper que protege funcionalidades específicas.

```jsx
import PlanGate from '@/components/PlanGate';

<PlanGate
  featureName="Dashboard Administrativo"
  requiredPlan="profesional"
  fallback={<Button disabled>Dashboard</Button>}
>
  <Button onClick={openDashboard}>
    Dashboard
  </Button>
</PlanGate>
```

### 3. usePlanLimitError
Hook para manejar errores de límites de plan.

```jsx
import { usePlanLimitError } from '@/hooks/usePlanLimitError';

const { error, isVisible, hideError, handleApiError } = usePlanLimitError();

// En un catch de API
if (handleApiError(error)) {
  // El error fue manejado por el sistema de límites
  return;
}
```

## 📱 Tipos de Mensajes

### 1. Plan Insuficiente
```json
{
  "error": "Funcionalidad Premium No Disponible",
  "message": "La funcionalidad 'Dashboard Avanzado' está disponible únicamente en el plan Profesional...",
  "code": "INSUFFICIENT_PLAN",
  "currentPlan": "basico",
  "requiredPlan": "profesional",
  "contactInfo": {
    "phone": "69512310",
    "email": "forkasbib@gmail.com"
  }
}
```

### 2. Límite Excedido
```json
{
  "error": "Límite de Recursos Excedido",
  "message": "Has alcanzado el límite máximo de usuarios en tu plan actual...",
  "code": "LIMIT_EXCEEDED",
  "currentUsage": 10,
  "limit": 7,
  "contactInfo": {
    "phone": "69512310",
    "email": "forkasbib@gmail.com"
  }
}
```

### 3. Funcionalidad No Disponible
```json
{
  "error": "Funcionalidad No Incluida en tu Plan",
  "message": "La funcionalidad 'Analytics Avanzados' no está disponible en tu plan actual...",
  "code": "FEATURE_NOT_AVAILABLE",
  "currentPlan": "profesional",
  "requiredFeature": "analytics"
}
```

## 🎨 Personalización

### Cambiar Información de Contacto
En `planMiddleware.js`:

```javascript
contactInfo: {
  phone: '69512310',           // Cambiar número de teléfono
  email: 'forkasbib@gmail.com' // Cambiar email
}
```

### Personalizar Mensajes
```javascript
upgradeMessage: `¿Interesado en actualizar a ${requiredPlan}? 
Contacta con nosotros para conocer los beneficios y precios especiales.`
```

### Cambiar Colores del Modal
En `PlanLimitErrorHandler.jsx`:

```jsx
// Cambiar colores del header
<div className="bg-gradient-to-r from-amber-400 to-orange-500">

// Cambiar colores de los botones
<Button className="bg-gradient-to-r from-green-600 to-emerald-600">
```

## 🧪 Pruebas

### Script de Prueba Automatizada
```bash
node test_professional_messages.js
```

Este script prueba:
- ✅ Login en ambos sistemas
- ✅ Obtención de información del plan
- ✅ Prueba de límites de productos
- ✅ Prueba de funcionalidades avanzadas
- ✅ Cambio de planes
- ✅ Verificación de mensajes profesionales

### Pruebas Manuales

1. **Cambiar a plan básico** desde Admin Console
2. **Intentar acceder** a funcionalidades avanzadas en POS
3. **Verificar** que aparezca el modal profesional
4. **Probar** los botones de contacto

## 📊 Jerarquía de Planes

```
Básico (1) < Profesional (2) < Avanzado (3) < Enterprise (4)
```

### Plan Básico
- ✅ Funcionalidades básicas del POS
- ❌ Dashboard avanzado
- ❌ Gestión de usuarios
- ❌ Analytics

### Plan Profesional
- ✅ Todo lo del plan básico
- ✅ Dashboard administrativo
- ✅ Gestión de usuarios
- ❌ Analytics avanzados

### Plan Avanzado
- ✅ Todo lo del plan profesional
- ✅ Control de inventario avanzado
- ✅ Múltiples sucursales
- ❌ Analytics predictivos

### Plan Enterprise
- ✅ Todas las funcionalidades
- ✅ Analytics avanzados
- ✅ Configuración personalizada
- ✅ Soporte prioritario

## 🔧 Integración en Nuevas Funcionalidades

### 1. Proteger un Botón
```jsx
<PlanGate
  featureName="Nueva Funcionalidad"
  requiredPlan="avanzado"
  fallback={<Button disabled>Nueva Funcionalidad</Button>}
>
  <Button onClick={openNewFeature}>
    Nueva Funcionalidad
  </Button>
</PlanGate>
```

### 2. Proteger una Ruta Completa
```jsx
<PlanGate
  featureName="Página Completa"
  requiredPlan="profesional"
>
  <NewFeaturePage />
</PlanGate>
```

### 3. Proteger en el Backend
```javascript
// En las rutas
router.get('/advanced-feature', 
  planMiddleware('advanced-feature', 'avanzado'),
  advancedFeatureController
);
```

## 📞 Información de Contacto

- **Teléfono**: 69512310
- **Email**: forkasbib@gmail.com
- **Horario**: Lunes a Viernes, 9:00 AM - 6:00 PM

## 🎯 Beneficios del Sistema

### Para el Usuario
- ✅ **Mensajes claros** sobre qué funcionalidades están disponibles
- ✅ **Información de contacto** fácil de acceder
- ✅ **Comparación visual** de planes
- ✅ **Proceso de actualización** simplificado

### Para el Negocio
- ✅ **Conversión mejorada** a planes superiores
- ✅ **Reducción de soporte** por consultas sobre límites
- ✅ **Experiencia profesional** que genera confianza
- ✅ **Información de contacto** siempre visible

## 🚀 Próximos Pasos

1. **Integrar** en todas las funcionalidades restringidas
2. **Personalizar** mensajes según el tipo de negocio
3. **Agregar** analytics de conversión
4. **Implementar** notificaciones push para límites cercanos
5. **Crear** dashboard de métricas de uso por plan

---

**Desarrollado con ❤️ para mejorar la experiencia del usuario y aumentar las conversiones de plan.**
